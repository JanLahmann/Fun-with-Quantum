/**
 * Settings for /workshops/ — the one place to edit.
 *
 * EVENTS_EMAIL: the contact address for workshop requests. While it is the placeholder
 * (no "@"), the page shows no e-mail line. Also replace EVENTS_EMAIL_TBD in
 * ../../../.github/ISSUE_TEMPLATE/workshop-request.yml.
 *
 * QDC_2025: photos and a video from the IBM Quantum Developer Conference, November 2025.
 * Photos go in public/events/ (src '/events/qdc-2025-1.jpg'); video is a URL. While both
 * are empty, the "At QDC 2025" block is not rendered.
 */
export const EVENTS_EMAIL = 'EVENTS_EMAIL_TBD';
export const eventsEmail: string | null = EVENTS_EMAIL.includes('@') ? EVENTS_EMAIL : null;

export const QDC_2025: { photos: { src: string; alt: string }[]; video: string } = {
  photos: [],
  video: '',
};
