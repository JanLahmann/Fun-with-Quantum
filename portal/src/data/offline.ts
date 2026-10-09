/**
 * The offline build for RasQberry Two (`PUBLIC_FWQ_OFFLINE=1 npm run build` → dist-offline/): the same
 * site, served from the Pi without the internet. Home leads with the browser games, links that need
 * the internet are labelled "online", the homepage 3D viewer becomes a photo, notebook buttons point
 * to the Pi's own notebooks, and there are no analytics. Add `?kiosk` to the first URL for a booth:
 * after 3 idle minutes the site returns to the home page.
 */
export const OFFLINE = import.meta.env.PUBLIC_FWQ_OFFLINE === '1';
