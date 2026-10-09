import fs from "node:fs";
import path from "node:path";

import { env, isProduction } from "../config/env.js";

/**
 * App-wide logger. Writes to the console and to daily files in logs/:
 *  - app-YYYY-MM-DD.log   every entry
 *  - error-YYYY-MM-DD.log errors only
 *
 * Level comes from LOG_LEVEL, else "info" in production and "debug" otherwise.
 */

type LogLevel = "error" | "warn" | "info" | "http" | "debug";

// Lower number = more important
const LEVELS: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };

const COLORS: Record<LogLevel, string> = {
  error: "\x1b[31m",
  warn: "\x1b[33m",
  info: "\x1b[36m",
  http: "\x1b[35m",
  debug: "\x1b[90m",
};
const RESET = "\x1b[0m";

const minLevel: LogLevel = env.LOG_LEVEL ?? (isProduction ? "info" : "debug");

// Bangladesh time, whatever timezone the host machine runs in
const TIME_ZONE = "Asia/Dhaka";

// e.g. "Oct 09, 2026, 03:04:42 PM"
const displayTime = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

// e.g. "2026-10-09" (en-CA formats dates as YYYY-MM-DD)
const fileDate = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

const LOG_DIR = path.resolve("logs");
fs.mkdirSync(LOG_DIR, { recursive: true });

let currentDate = "";
let appStream: fs.WriteStream | undefined;
let errorStream: fs.WriteStream | undefined;

// Opens a fresh pair of files when the date changes
function getStreams() {
  const today = fileDate.format(new Date());

  if (today !== currentDate || !appStream || !errorStream) {
    appStream?.end();
    errorStream?.end();
    currentDate = today;
    appStream = fs.createWriteStream(path.join(LOG_DIR, `app-${today}.log`), { flags: "a" });
    errorStream = fs.createWriteStream(path.join(LOG_DIR, `error-${today}.log`), { flags: "a" });
  }

  return { appStream, errorStream };
}

// Error objects stringify to {} by default; keep name, message and stack
function stringify(value: unknown, indent?: number): string {
  return JSON.stringify(
    value,
    (_key, val: unknown) =>
      val instanceof Error ? { name: val.name, message: val.message, stack: val.stack } : val,
    indent,
  );
}

function write(level: LogLevel, message: string, meta?: unknown): void {
  if (LEVELS[level] > LEVELS[minLevel]) return;

  const now = new Date();
  // Files keep ISO time (sortable, parseable); the console shows 12-hour local time
  const timestamp = now.toISOString();
  const line = stringify({ timestamp, level, message, ...(meta !== undefined && { meta }) });

  const streams = getStreams();
  streams.appStream.write(line + "\n");
  if (level === "error") streams.errorStream.write(line + "\n");

  // Production: plain JSON for log tools. Development: colored and readable.
  const output = isProduction
    ? line
    : `${COLORS[level]}[${displayTime.format(now)}] ${level.toUpperCase()}${RESET} ${message}${
        meta !== undefined ? " " + stringify(meta, 2) : ""
      }`;

  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.log(output);
}

export const logger = {
  error: (message: string, meta?: unknown) => write("error", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  info: (message: string, meta?: unknown) => write("info", message, meta),
  http: (message: string, meta?: unknown) => write("http", message, meta),
  debug: (message: string, meta?: unknown) => write("debug", message, meta),
};

// Sends morgan's request lines through the logger
export const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};
