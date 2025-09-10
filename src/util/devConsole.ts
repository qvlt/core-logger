import type { LogEvent } from '../logger';

export function devConsole(ev: LogEvent) {
  const { lvl, event, component, ctx, err } = ev;

  // Use plain text formatting for Sentry compatibility (no CSS formatting)
  const base = `${component ?? 'app'} ${event}`;
  const args: unknown[] = [base];
  if (ctx && Object.keys(ctx).length > 0) args.push(ctx);
  if (err) args.push(err);

  if (lvl === 'debug') {
    (console.debug || console.log)(...args);
  } else {
    (console as unknown as Record<string, (...args: unknown[]) => void>)[lvl](...args);
  }
}
