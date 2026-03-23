import pino from "pino";

export const log = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(!process.env.VERCEL && { transport: { target: "pino-pretty", options: { colorize: true } } }),
});
