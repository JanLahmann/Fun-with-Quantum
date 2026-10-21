#!/usr/bin/env bash
# Fun with Quantum — family hygiene audit (read-only).
# Checks every member site for HTTPS, icons, OG image, Umami, family footer, GitHub Pages
# config, domain-verification TXT record, README family block, and Qiskit-ecosystem membership.
# Usage: family/audit/family-audit.sh [> family/audit/results/YYYY-MM-DD.txt]   (needs curl, dig, gh, jq; ~2 min)
set -u
UMAMI=97f347ac-e7ba-4be3-b26f-ab4b328bdbf2
MEMBERS=(
  "fun-with-quantum.org JanLahmann/Fun-with-Quantum janlahmann"
  "rasqberry.org JanLahmann/RasQberry-Two janlahmann"
  "rasqberry.one JanLahmann/RasQberry janlahmann"
  "quantego.org JanLahmann/Quantego janlahmann"
  "doqumentation.org JanLahmann/doQumentation janlahmann"
  "qubins.org QuBins/qiskit-images qubins"
  "qamposer.org QAMP-62/qamposer-website qamp-62"
  "qoffee-maker.org JanLahmann/Qoffee-Maker janlahmann"
  "qutie.org JanLahmann/Qutie janlahmann"
  "entangible.org JanLahmann/entangible janlahmann"
  "certiq.dev JanLahmann/qiskit-developer-certification-prep janlahmann"
  "racetraq.org JanLahmann/racetraQ janlahmann"
)
# the manifest next to this script, or (run from a copy or a pipe) the published one
FAMILY_JSON="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)/../family.json"
if ! jq -e '.members' "$FAMILY_JSON" >/dev/null 2>&1; then
  FAMILY_JSON=$(mktemp); trap 'rm -f "$FAMILY_JSON"' EXIT
  curl -sfL --max-time 20 https://raw.githubusercontent.com/JanLahmann/Fun-with-Quantum/master/family/family.json -o "$FAMILY_JSON" \
    && jq -e '.members' "$FAMILY_JSON" >/dev/null || { echo "family.json not found" >&2; exit 1; }
fi
HOSTS=$(jq -r '.members[].url | sub("^https?://"; "") | sub("/.*$"; "")' "$FAMILY_JSON")
eco=$(gh api "repos/Qiskit/ecosystem/git/trees/main?recursive=1" --jq '.tree[].path | select(startswith("resources/members/"))' 2>/dev/null | tr '\n' ' ')
echo "family audit $(date -u +%Y-%m-%dT%H:%MZ)"
printf '%-22s %-5s %-6s %-8s %-5s %-6s %-7s %-6s %-6s %-6s %-6s %-7s %-8s %-6s\n' domain https http→s icons ico apple og umami bsend footer readme txt enforced eco
for m in "${MEMBERS[@]}"; do
  set -- $m; d=$1; repo=$2; owner=$3
  html=$(curl -sL --max-time 20 "https://$d/?audit=$(date +%s)")
  https=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$d/")
  redir=$(curl -s -o /dev/null -w '%{http_code}→%{redirect_url}' --max-time 15 "http://$d/" | grep -q '30[12]→https' && echo yes || echo NO)
  icons=$(printf '%s' "$html" | grep -oiE '<link[^>]+rel=["'"'"']?(icon|shortcut icon)["'"'"' >/]' | wc -l | tr -d ' ')
  ico=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$d/favicon.ico")
  apple=$(printf '%s' "$html" | grep -qi 'apple-touch-icon' && echo yes || echo no)
  og=$(printf '%s' "$html" | grep -qiE 'property=["'"'"']?og:image["'"'"' >/]' && echo yes || echo no)
  ucount=$(printf '%s' "$html" | grep -o "$UMAMI" | wc -l | tr -d ' '); uother=$(printf '%s' "$html" | grep -oE 'data-website-id=\\?["'"'"']?[0-9a-f-]{36}' | grep -vc "$UMAMI"); umami="$ucount"; [ "$uother" -gt 0 ] && umami="$ucount+other"
  # the family's standard tracker tag (family/EVENTS.md); also matches the escaped copy in a Next.js payload
  bsend=$(printf '%s' "$html" | grep -qE 'data-before-send.{0,6}fwqUmamiBeforeSend' && echo yes || echo NO); [ "$ucount" = 0 ] && bsend=-
  # footer: how many other members the page's footer links, by href to their sites, so it works with any
  # markup (quoted or not, a member class or none, a static footer). The footer starts at the first <footer>,
  # role=contentinfo or class with "footer" in it (Next.js: footer_footer__…); without one, the whole page.
  off=$(printf '%s' "$html" | grep -boiE "<footer|role=[\"']?contentinfo|class=[\"']?[^\"'>]*footer" | head -1 | cut -d: -f1)
  if [ -n "$off" ]; then foot=$(printf '%s' "$html" | tail -c +$((off + 1))); else foot=$html; fi
  footer=0
  for h in $HOSTS; do
    [ "$h" = "$d" ] && continue
    printf '%s' "$foot" | grep -qiE "href=[\"']?https?://(www\.)?${h//./\\.}([/\"' >?#]|\$)" && footer=$((footer + 1))
  done
  # footer: false in family.json = not shown on purpose; an app shell (id="root", no <footer>) draws it after load
  if [ "$(jq -r --arg u "https://$d" '.members[] | select(.url == $u) | .footer' "$FAMILY_JSON")" = false ]; then footer=off
  elif [ "$footer" = 0 ] && printf '%s' "$html" | grep -qE 'id=["'"'"']?root["'"'"' >]' && ! printf '%s' "$html" | grep -qi '<footer'; then footer=js; fi
  readme=$(gh api "repos/$repo/readme" -H 'Accept: application/vnd.github.raw' 2>/dev/null | grep -q 'FWQ-FAMILY:START' && echo block || echo none)
  # a real TXT answer is a quoted string; a wildcard CNAME (*.domain → *.github.io) answers with a hostname instead
  txt=$(dig +short TXT "_github-pages-challenge-$owner.$d" | grep '^"' | head -1); [ -n "$txt" ] && txt=yes || txt=NO
  enforced=$(gh api "repos/$repo/pages" --jq '.https_enforced' 2>/dev/null || echo "?")
  # member files are named <slug truncated to 11 chars>_<hash>.toml (e.g. doqumentati_…), so compare the truncated slug
  slug=$(echo "$d" | sed 's/\..*//; s/-//g' | cut -c1-11); ecomem=$(echo "$eco" | grep -qi "members/$slug" && echo member || echo no)
  printf '%-22s %-5s %-6s %-8s %-5s %-6s %-7s %-6s %-6s %-6s %-6s %-7s %-8s %-6s\n' "$d" "$https" "$redir" "$icons" "$ico" "$apple" "$og" "$umami" "$bsend" "$footer" "$readme" "$txt" "$enforced" "$ecomem"
done
echo; echo "legend: icons = <link rel=icon> tags; ico = /favicon.ico status; umami = occurrences of the shared property id (Next.js embeds it in the RSC payload too, so 2 is normal; +other = another property present); bsend = the tracker tag carries data-before-send=fwqUmamiBeforeSend (the standard snippet: no bots, ?notrack); footer = other members linked from the page footer (js = drawn in the browser after load, not checkable here; off = footer: false in family.json); txt = _github-pages-challenge TXT present; eco = Qiskit ecosystem member file (by domain slug — RasQberry legacy and QAMPoser entries checked separately)"
