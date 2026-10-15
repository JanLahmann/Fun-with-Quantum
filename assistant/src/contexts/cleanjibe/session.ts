import type { Context } from '../types';
import { cleanjibeHelp } from './help';
import { cleanBySchema } from './schema';
import SCHEMA from './session-state.schema.json';

/** At most this much state per question (CleanJibe's brief: under 12 KB). */
export const MAX_STATE = 12_000;

/**
 * The app's facts plus one session's numbers (docs/copy/assistant/session-state.schema.json in
 * JanLahmann/WingFoil). Too large: the turn list is shortened from the end.
 */
export function sessionState(raw: unknown): Record<string, unknown> | null {
  const s = cleanBySchema(raw, SCHEMA) as Record<string, any> | null;
  if (!s || !s.session) return null;
  while (JSON.stringify(s).length > MAX_STATE && s.session.turnList?.length) s.session.turnList.pop();
  return JSON.stringify(s).length > MAX_STATE ? null : s;
}

/** The help desk with one session in view: "why was the 14:26 jibe a touchdown?". iPhone app only. */
export const cleanjibeSession: Context = {
  ...cleanjibeHelp,
  role:
    `${cleanjibeHelp.role} This time the rider asks about one of their sessions; its numbers come with the question ` +
    'in <app_state> (session).',
  scope:
    `${cleanjibeHelp.scope} About the session, say only what its numbers show: never invent a number, keep estimated ` +
    'numbers "estimated", and say plainly when a number is missing (e.g. no accelerometer, no Doppler speed). ' +
    'Clock times are local; refer to turns by their clock time.',
  appOnly: true,
  state: sessionState,
};
