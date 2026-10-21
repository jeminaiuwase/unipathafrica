// Runs every day at 06:00 UTC (09:00 East Africa Time): deadline reminders, "applications open"
// alerts, analytics tidy-up, and on the 1st of each month the data freshness report.
import { getStore } from '@netlify/blobs';
import { runReminders, runFreshness, compactAnalytics, putJSON, now } from '../lib/jobs.mjs';

export const config = { schedule: '0 6 * * *' };
const store = () => (globalThis.__UNIPATH_STORE__ || getStore({ name: 'unipath', consistency: 'strong' }));

export default async function handler() {
  const st = store(); const log = { at: now() };
  try { log.reminders = await runReminders(st); } catch (e) { log.remindersError = String(e && e.message || e); }
  try { log.analytics = await compactAnalytics(st); } catch (e) { log.analyticsError = String(e && e.message || e); }
  if (new Date().getUTCDate() === 1) { try { const r = await runFreshness(st); log.freshness = { month: r.month }; } catch (e) { log.freshnessError = String(e && e.message || e); } }
  await putJSON(st, 'jobs/last-daily', log);
  return new Response(JSON.stringify(log), { headers: { 'content-type': 'application/json' } });
}
