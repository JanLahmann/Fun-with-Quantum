# IndexNow for a family site

IndexNow lets a site tell Bing, Yandex, Seznam, Naver and other participating search engines right away
which pages changed ([protocol](https://www.indexnow.org/documentation)). Google does not take part;
it keeps using the sitemap and Search Console.

`indexnow.py` reads the site's live `sitemap.xml` (a sitemap index is followed one level), picks the
pages whose `<lastmod>` is today or yesterday (UTC; every page when the sitemap has no `<lastmod>`), checks
that the key file is live, and posts the list to `https://api.indexnow.org/indexnow`. It prints the
answer: **200** received, **202** received with the key check still pending (normal for a new key);
anything else fails the job (403: key file missing or different, 422: URLs not on the site's host,
429: too many requests).

## Set-up (one time, per site)

1. **Make a key**: `python3 -c "import secrets; print(secrets.token_hex(16))"`, 32 hex characters.
   It is public by design (IndexNow fetches it from your site), so it goes into the repo, not into secrets.
2. **Serve the key file** at the site root: `https://<site>/<key>.txt`, containing just the key. Put it
   where your generator copies static files as they are (Astro, Next.js, Docusaurus: `public/` or
   `static/`; Jekyll and plain Pages: the site root). Check after the deploy:
   `curl https://<site>/<key>.txt`.
3. **Add a job** to the workflow that deploys the site, after the deploy job:

   ```yaml
     indexnow:
       needs: deploy                      # the job that publishes the site
       if: github.ref == 'refs/heads/main'   # your production branch
       uses: JanLahmann/Fun-with-Quantum/.github/workflows/indexnow.yml@master
       with:
         site: https://example.org         # no trailing slash
         key: <your key>
   ```

   Optional inputs: `sitemap` (another URL than `<site>/sitemap.xml`), `days` (default 1: lastmod today
   or yesterday), `all: true` (send every page, for the first run or after a big change), `changed` (the
   URL of a JSON list of the pages this build changed, sent instead of the sitemap's choice). The workflow is also in this repo's
   Actions tab for a manual run (`workflow_dispatch`).
4. **Send changed pages only**, as IndexNow asks. A sitemap with build-day dates on every page, or
   without dates, makes every deploy send every page; with real dates, a page changed today is sent
   again by every deploy until tomorrow's has passed. Fine for a site that deploys now and then. A site
   that deploys many times a day does better with a `changed` list: the portal keeps a fingerprint per
   page (`portal/astro.config.mjs`), publishes `sitemap-state.json` with the pages whose fingerprint
   changed in this build under `changed`, and passes its URL.

By hand, from any checkout of this repo:

```bash
python3 family/indexnow/indexnow.py --site https://example.org --key <key> --dry-run   # what would go
python3 family/indexnow/indexnow.py --site https://example.org --key <key> --all       # send every page
```

Sites: the portal (fun-with-quantum.org) since 2026-10-19.
