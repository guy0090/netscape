import { app } from "electron";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import {
  Logger,
  LeveledLogMethod,
  config,
  createLogger,
  format,
  transports,
} from "winston";
import winstonDaily from "winston-daily-rotate-file";

const { combine, metadata, json, splat, timestamp } = format;
const isDevelopment = process.env.NODE_ENV === "development";

// Logs dir
const logDir: string = isDevelopment
  ? join(__dirname, "logs")
  : join(app.getPath("userData"), "logs");

if (!existsSync(logDir)) {
  mkdirSync(logDir);
}

const logFormat = format.printf(({ timestamp, level, message }) => {
  // if (typeof timestamp === "number")
  //   timestamp = new Date(timestamp).toISOString();
  return `${timestamp} ${level.toUpperCase()} > ${message}`;
});

// Log file format
const fileFormat = combine(timestamp(), json());

// Console format
const consoleFormat = combine(
  timestamp(),
  splat(),
  // colorize(),
  logFormat
);

// Workaround for only logging a specific level, excluding those lower in hierarchy
// #region

const debugFilter = format((info) => {
  return info.level === "debug" || info.level === "info" ? info : false;
});

const warnAndErrorFilter = format((info) => {
  return info.level === "warn" || info.level === "error" ? info : false;
});

const parserFilter = format((info) => {
  return info.level === "parser" ? info : false;
});
// #endregion

// Custom log levels
// #region
const customLevels: config.AbstractConfigSetLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
  parser: 7,
};

interface CustomLevels extends Logger {
  error: LeveledLogMethod;
  warn: LeveledLogMethod;
  info: LeveledLogMethod;
  http: LeveledLogMethod;
  verbose: LeveledLogMethod;
  debug: LeveledLogMethod;
  silly: LeveledLogMethod;
  parser: LeveledLogMethod;
}
// #endregion

// Transports
const customTransports = [
  // Debug log setting
  new winstonDaily({
    level: "debug",
    dirname: logDir + "/debug",
    filename: `NETSCAPE_DEBUG_%DATE%.log`,
    maxFiles: 4, // keep 2 days worth of logs
    frequency: "12h",
    handleExceptions: true,
    zippedArchive: true,
    format: combine(debugFilter(), fileFormat),
  }),
  // Error log setting
  new winstonDaily({
    level: "error",
    dirname: logDir + "/error",
    filename: `NETSCAPE_ERR_%DATE%.log`,
    maxFiles: 4, // keep 2 days worth of logs
    frequency: "12h",
    handleExceptions: true,
    zippedArchive: true,
    format: combine(warnAndErrorFilter(), fileFormat),
  }),
  // Parser log
  new winstonDaily({
    level: "parser",
    dirname: logDir + "/parser",
    filename: `NETSCAPE_PARSER_%DATE%.log`,
    maxFiles: 4, // keep 2 days worth of logs
    frequency: "12h",
    handleExceptions: true,
    zippedArchive: true,
    format: combine(parserFilter(), fileFormat),
  }),
];

const logger = <CustomLevels>createLogger({
  level: "debug",
  levels: customLevels,
  format: combine(
    timestamp(),
    metadata({ fillExcept: ["message", "level", "timestamp"] })
  ),
  transports: customTransports,
});

if (isDevelopment) {
  logger.add(
    new transports.Console({
      handleExceptions: true,
      level: "debug",
      format: consoleFormat,
    })
  );
}

export { logger };
