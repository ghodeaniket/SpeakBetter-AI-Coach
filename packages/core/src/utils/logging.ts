export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
}

export const createLogger = (options: LoggerOptions = {}): Logger => {
  const { level = LogLevel.INFO, prefix = '' } = options;
  
  const logLevels: { [key in LogLevel]: number } = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3
  };

  const shouldLog = (messageLevel: LogLevel): boolean => {
    return logLevels[messageLevel] >= logLevels[level];
  };

  const formatMessage = (message: string): string => {
    return prefix ? `[${prefix}] ${message}` : message;
  };

  return {
    debug: (message: string, ...args: any[]): void => {
      if (shouldLog(LogLevel.DEBUG)) {
        console.debug(formatMessage(message), ...args);
      }
    },
    info: (message: string, ...args: any[]): void => {
      if (shouldLog(LogLevel.INFO)) {
        console.info(formatMessage(message), ...args);
      }
    },
    warn: (message: string, ...args: any[]): void => {
      if (shouldLog(LogLevel.WARN)) {
        console.warn(formatMessage(message), ...args);
      }
    },
    error: (message: string, ...args: any[]): void => {
      if (shouldLog(LogLevel.ERROR)) {
        console.error(formatMessage(message), ...args);
      }
    }
  };
};