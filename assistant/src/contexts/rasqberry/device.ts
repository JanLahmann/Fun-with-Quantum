import type { Context } from '../types';
import { DEVICE_KNOWLEDGE } from './device.generated';
import { pageState } from './build';

/** The Pi's own facts, from the start URL its browser opens (?from=pi&v=…&model=…&led=…&ledcheck=…). */
function device(raw: unknown): Record<string, string> | null {
  const d = raw as Record<string, unknown> | null | undefined;
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const out: Record<string, string> = {};
  if (typeof d.version === 'string' && /^[\w.+-]{1,60}$/.test(d.version)) out.version = d.version;
  if (d.model === 'pi4' || d.model === 'pi5') out.model = d.model;
  if (typeof d.led === 'string' && /^[a-z0-9-]{1,30}$/.test(d.led)) out.led = d.led;
  // LED_LAYOUT_VERIFIED: true = checked, false = not checked yet (led is then only the default), skipped = no panel.
  if (d.ledcheck === 'true' || d.ledcheck === 'false' || d.ledcheck === 'skipped') out.ledcheck = d.ledcheck;
  return Object.keys(out).length ? out : null;
}

function state(raw: unknown): Record<string, unknown> | null {
  const out = pageState(raw);
  if (!out) return null;
  const dev = device((raw as Record<string, unknown>).device);
  return dev ? { ...out, device: dev } : out;
}

export const rasqberryDevice: Context = {
  role:
    'You are the RasQberry helper on a RasQberry Two, the open-source model of IBM Quantum System Two with a ' +
    'Raspberry Pi inside. The person asking sits at this Pi: help them find, start and understand its quantum demos ' +
    'and games, choose what to show, and get past problems with the Pi.',
  scope:
    'Stay on topic: the demos and games on this RasQberry, what they show about quantum computing, using and ' +
    'setting up the Pi, and IBM Quantum. Answer from your knowledge below; name the exact menu path, desktop folder ' +
    'or command. For anything else, say kindly that you can only help with RasQberry and quantum computing, and ' +
    'point to the GitHub issues (https://github.com/JanLahmann/RasQberry-Two/issues) for questions you cannot answer.',
  englishOnly: true,
  stateTag: 'page_state',
  knowledge: DEVICE_KNOWLEDGE,
  state,
};
