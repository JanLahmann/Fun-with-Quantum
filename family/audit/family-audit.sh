#!/usr/bin/env bash
# Fun with Quantum — family hygiene audit (read-only).
# Checks every member site for HTTPS, icons, OG image, Umami, family footer, GitHub Pages
# config, domain-verification TXT record, README family block, and Qiskit-ecosystem membership.
# Usage: family/audit/family-audit.sh [> report.txt]   (needs curl, dig, gh, jq; ~2 min)
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
)
eco=$(gh api "repos/Qiskit/ecosystem/git/trees/main?recursive=1" --jq '.tree[].path | select(startswith("resources/members/"))' 2>/dev/null | tr '\n' ' ')
echo "family audit $(date -u +%Y-%m-%dT%H:%MZ)"
printf '%-22s %-5s %-6s %-8s %-5s %-6s %-7s %-6s %-6s %-6s %-7s %-8s %-6s\n' domain https http→s icons ico apple og umami footer readme txt enforced eco
for m in "${MEMBERS[@]}"; do
  set -- $m; d=$1; repo=$2; owner=$3
  html=$(curl -sL --max-time 20 "https://$d/?audit=$(date +%s)")
  https=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$d/")
  redir=$(curl -s -o /dev/null -w '%{http_code}→%{redirect_url}' --max-time 15 "http://$d/" | grep -q '30[12]→https' && echo yes || echo NO)
  icons=$(printf '%s' "$html" | grep -oiE '<link[^>]+rel=["'"'"']?(icon|shortcut icon)["'"'"' ]' | wc -l | tr -d ' ')
  ico=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$d/favicon.ico")
  apple=$(printf '%s' "$html" | grep -qi 'apple-touch-icon' && echo yes || echo no)
  og=$(printf '%s' "$html" | grep -qiE 'property=["'"'"']og:image' && echo yes || echo no)
  ucount=$(printf '%s' "$html" | grep -o "$UMAMI" | wc -l | tr -d ' '); uother=$(printf '%s' "$html" | grep -oE 'data-website-id=\\?"[0-9a-f-]{36}' | grep -vc "$UMAMI"); umami="$ucount"; [ "$uother" -gt 0 ] && umami="$ucount+other"
  footer=$(printf '%s' "$html" | grep -oE 'class="[^"]*(\bmember\b|fwq-member|footer_member)[^"]*"' | wc -l | tr -d ' ')
  readme=$(gh api "repos/$repo/readme" -H 'Accept: application/vnd.github.raw' 2>/dev/null | grep -q 'FWQ-FAMILY:START' && echo block || echo none)
  # a real TXT answer is a quoted string; a wildcard CNAME (*.domain → *.github.io) answers with a hostname instead
  txt=$(dig +short TXT "_github-pages-challenge-$owner.$d" | grep '^"' | head -1); [ -n "$txt" ] && txt=yes || txt=NO
  enforced=$(gh api "repos/$repo/pages" --jq '.https_enforced' 2>/dev/null || echo "?")
  # member files are named <slug truncated to 11 chars>_<hash>.toml (e.g. doqumentati_…), so compare the truncated slug
  slug=$(echo "$d" | sed 's/\..*//; s/-//g' | cut -c1-11); ecomem=$(echo "$eco" | grep -qi "members/$slug" && echo member || echo no)
  printf '%-22s %-5s %-6s %-8s %-5s %-6s %-7s %-6s %-6s %-6s %-7s %-8s %-6s\n' "$d" "$https" "$redir" "$icons" "$ico" "$apple" "$og" "$umami" "$footer" "$readme" "$txt" "$enforced" "$ecomem"
done
printf '%-22s ' traQmania; r=$(gh api repos/JanLahmann/traQmania/readme -H 'Accept: application/vnd.github.raw' 2>/dev/null | grep -q 'FWQ-FAMILY:START' && echo block || echo none); echo "(repo only) readme=$r"
echo; echo "legend: icons = <link rel=icon> tags; ico = /favicon.ico status; umami = occurrences of the shared property id (Next.js embeds it in the RSC payload too, so 2 is normal; +other = another property present); footer = family-footer member links; txt = _github-pages-challenge TXT present; eco = Qiskit ecosystem member file (by domain slug — RasQberry legacy and QAMPoser entries checked separately)"
