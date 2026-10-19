#!/usr/bin/env python3
"""Tell IndexNow search engines (Bing, Yandex, Seznam, Naver, ...) which pages of a site changed.

Run after a deploy, by hand or from the reusable workflow .github/workflows/indexnow.yml:

    python3 indexnow.py --site https://fun-with-quantum.org --key <key>            # pages new since yesterday
    python3 indexnow.py --site https://example.org --key <key> --all               # every sitemap page
    python3 indexnow.py --site https://example.org --key <key> https://example.org/a/ ...   # just these
    ... --changed https://example.org/sitemap-state.json   # the pages a build listed as changed
    ... --dry-run                                                                   # list, don't send

Which pages: the URLs given, or the list under --changed (a JSON array, or an object with a `changed`
array, as the portal's sitemap-state.json), or else those in the site's sitemap.xml (a sitemap index is followed one level) whose <lastmod>
is no older than --days days (UTC). A sitemap without <lastmod> sends all its pages, so give your
sitemap real <lastmod> dates if you can: IndexNow asks for changed pages only.

The key is public by design: the file https://<host>/<key>.txt holds it, and IndexNow checks it there.
Python 3.9+, standard library only. Exit code 0 on 200/202 or when nothing changed, 1 otherwise.
"""
import argparse
import datetime as dt
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ENDPOINT = 'https://api.indexnow.org/indexnow'
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'
UA = 'fwq-indexnow/1 (+https://github.com/JanLahmann/Fun-with-Quantum/tree/master/family/indexnow)'
MAX_URLS = 10_000  # per request (IndexNow)


def get(url: str) -> bytes:
    # a fresh copy past CDN caches (GitHub Pages caches for up to 10 minutes)
    sep = '&' if '?' in url else '?'
    req = urllib.request.Request(f'{url}{sep}indexnow={int(time.time())}', headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def check_key(site: str, key: str, tries: int) -> None:
    """The key file must be live before submitting, or IndexNow answers 403. Right after a deploy it
    may not be served yet, so try a few times."""
    url = f'{site}/{key}.txt'
    tries = max(1, tries)
    for i in range(tries):
        try:
            if get(url).decode('utf-8').strip() == key:
                return
            problem = 'does not contain the key'
        except (OSError, UnicodeDecodeError) as e:  # OSError: URLError, HTTPError, timeouts, resets
            problem = str(e)
        if i + 1 < tries:
            time.sleep(20)
    sys.exit(f'key file {url}: {problem}')


def fetch(url: str, what: str) -> bytes:
    try:
        return get(url)
    except OSError as e:
        sys.exit(f'{what} {url}: {e}')


def sitemap_pages(url: str, depth: int = 0) -> list:
    """(loc, lastmod or None) for every page, following a sitemap index one level down."""
    try:
        root = ET.fromstring(fetch(url, 'sitemap'))
    except ET.ParseError as e:
        sys.exit(f'sitemap {url}: not XML ({e})')
    if root.tag == f'{NS}sitemapindex' and depth == 0:
        return [p for sm in root.iter(f'{NS}sitemap') for p in sitemap_pages(sm.findtext(f'{NS}loc').strip(), 1)]
    return [(u.findtext(f'{NS}loc').strip(), (u.findtext(f'{NS}lastmod') or '').strip() or None)
            for u in root.iter(f'{NS}url')]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--site', required=True, help='https://host, no trailing path')
    ap.add_argument('--key', required=True, help='the IndexNow key (8-128 of a-z A-Z 0-9 -)')
    ap.add_argument('--sitemap', help='sitemap URL (default: <site>/sitemap.xml)')
    ap.add_argument('--changed', help='URL of a JSON list of changed pages (an array, or {"changed": [...]})')
    ap.add_argument('--days', type=int, default=1, help='send pages whose lastmod is at most this many days old (default 1)')
    ap.add_argument('--all', action='store_true', help='send every sitemap page')
    ap.add_argument('--dry-run', action='store_true', help='list the pages, send nothing')
    ap.add_argument('--key-tries', type=int, default=6, help='how often to look for the key file, 20 s apart')
    ap.add_argument('urls', nargs='*', help='send these pages instead of reading the sitemap')
    a = ap.parse_args()

    site = a.site.rstrip('/')
    host = urllib.parse.urlsplit(site).hostname
    if not host or not site.startswith('https://'):
        return print(f'--site must look like https://example.org, not {a.site!r}', file=sys.stderr) or 1
    if not re.fullmatch(r'[A-Za-z0-9-]{8,128}', a.key):
        return print('--key: 8 to 128 characters of a-z, A-Z, 0-9 and -', file=sys.stderr) or 1

    if a.urls:
        urls = a.urls
    elif a.changed:
        try:
            data = json.loads(fetch(a.changed, 'changed list'))
        except ValueError as e:
            sys.exit(f'changed list {a.changed}: not JSON ({e})')
        urls = data.get('changed', []) if isinstance(data, dict) else data
        if not isinstance(urls, list) or not all(isinstance(u, str) for u in urls):
            sys.exit(f'changed list {a.changed}: expected a list of URLs')
        print(f'changed list: {len(urls)} pages')
    else:
        pages = sitemap_pages(a.sitemap or f'{site}/sitemap.xml')
        dated = any(lm for _, lm in pages)
        since = (dt.datetime.now(dt.timezone.utc).date() - dt.timedelta(days=a.days)).isoformat()
        # W3C dates start with YYYY-MM-DD, so the first ten characters compare as dates
        urls = [loc for loc, lm in pages if a.all or not dated or (lm and lm[:10] >= since)]
        print(f'sitemap: {len(pages)} pages, {"with" if dated else "without"} <lastmod>; '
              f'{"all" if a.all or not dated else f"changed since {since}"}: {len(urls)}')
    foreign = [u for u in urls if urllib.parse.urlsplit(u).hostname != host]
    if foreign:
        return print(f'not on {host}: {foreign[:5]}', file=sys.stderr) or 1
    urls = list(dict.fromkeys(urls))
    for u in urls:
        print(' ', u)
    if not urls:
        print('nothing to send')
        return 0
    if len(urls) > MAX_URLS:
        print(f'sending the first {MAX_URLS} of {len(urls)}')
        urls = urls[:MAX_URLS]
    if a.dry_run:
        print('dry run: nothing sent')
        return 0

    check_key(site, a.key, a.key_tries)
    body = json.dumps({'host': host, 'key': a.key, 'keyLocation': f'{site}/{a.key}.txt', 'urlList': urls}).encode()
    req = urllib.request.Request(ENDPOINT, data=body, method='POST',
                                 headers={'Content-Type': 'application/json; charset=utf-8', 'User-Agent': UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            status, text = r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        status, text = e.code, e.read().decode('utf-8', 'replace')
    except OSError as e:
        sys.exit(f'IndexNow {ENDPOINT}: {e}')
    meaning = {200: 'OK, received', 202: 'accepted, key validation pending', 400: 'bad request',
               403: 'key not valid (key file missing or different)', 422: 'URLs not on this host, or key mismatch',
               429: 'too many requests'}.get(status, 'unexpected')
    print(f'IndexNow: {status} {meaning}, {len(urls)} URL(s) {text.strip()[:300]}')
    return 0 if status in (200, 202) else 1


if __name__ == '__main__':
    sys.exit(main())
