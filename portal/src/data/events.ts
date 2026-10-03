/**
 * Settings for /workshops/ — the one place to edit.
 *
 * EVENTS_EMAIL: the contact address for workshop requests. While it is the placeholder
 * (no "@"), the page shows no e-mail line. Keep it in sync with the address in
 * ../../../.github/ISSUE_TEMPLATE/workshop-request.yml.
 *
 * QDC_2025: photos and a video from the IBM Quantum Developer Conference, November 2025.
 * Photos go in public/events/ (src '/events/qdc-2025-1.jpg'); video is a URL. While both
 * are empty, the "At QDC 2025" block is not rendered.
 */
export const EVENTS_EMAIL = 'info@fun-with-quantum.org';
export const eventsEmail: string | null = EVENTS_EMAIL.includes('@') ? EVENTS_EMAIL : null;

export const QDC_2025: { photos: { src: string; alt: string }[]; video: string } = {
  photos: [
    { src: '/events/qdc2025-model.jpg', alt: '3D-printed RasQberry Two model of IBM Quantum System Two at the QDC 2025 stand' },
    { src: '/events/qdc2025-led-panels.jpg', alt: 'RasQberry Two models with their LED panels lit at QDC 2025' },
    { src: '/events/qdc2025-booth.jpg', alt: 'The RasQberry Two stand at QDC 2025: models and a screen with the demos' },
    { src: '/events/qdc2025-jan.jpg', alt: 'Jan-Rainer Lahmann at the RasQberry Two stand, QDC 2025' },
  ],
  video: '/events/qdc2025-opening.mp4',
};
