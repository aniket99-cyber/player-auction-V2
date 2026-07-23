type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function format(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  return meta !== undefined ? `${base} ${JSON.stringify(meta)}` : base;
}

export const logger = {
  info: (message: string, meta?: unknown) => console.log(format('info', message, meta)),
  warn: (message: string, meta?: unknown) => console.warn(format('warn', message, meta)),
  error: (message: string, meta?: unknown) => console.error(format('error', message, meta)),
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(format('debug', message, meta));
    }
  },
};
