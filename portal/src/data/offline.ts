/**
 * The offline build for RasQberry Two (`PUBLIC_FWQ_OFFLINE=1 npm run build` → dist-offline/): the same
 * site, served from the Pi without the internet. Home leads with the browser games, links that need
 * the internet are labelled "online", the homepage 3D viewer becomes a photo, notebook buttons point
 * to the Pi's own notebooks, and there are no analytics. Add `?kiosk` to the first URL for a booth:
 * after 3 idle minutes the site returns to the home page.
 */
export const OFFLINE = import.meta.env.PUBLIC_FWQ_OFFLINE === '1';

/**
 * The build bundled in the iOS app (`PUBLIC_FWQ_APP=1`, ios/scripts/build-web.mjs): the online site,
 * but nothing that loads from the internet by itself (no analytics, no 3D viewer from a CDN).
 */
export const APP = import.meta.env.PUBLIC_FWQ_APP === '1';
/** No requests to other hosts without a click: the offline build and the app build. */
export const NO_REMOTE = OFFLINE || APP;
