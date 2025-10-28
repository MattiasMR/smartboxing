import { handler } from '../lib/http.js';
export const main = handler(async () => ({ ok: true, ts: Date.now() }));
