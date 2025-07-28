import winston, { Logger, transport } from "winston";
import cleanStack from "clean-stack";
import { CustomError } from "./error-handler";
import { LoggerOptionArguments } from "./interfaces/logger.interface";

export type StrictLogger = Omit<Logger, "info" | "error"> & {
  info: (message: string, context: string) => void;
  error: (
    message: string,
    context: string,
    error?: Error | CustomError
  ) => void;
};

const getFormattedTimestamp = (): string => {
  const now = new Date();
  const pad = (n: number): string => n.toString().padStart(2, "0");
  return `${pad(now.getDate())}-${pad(
    now.getMonth() + 1
  )}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
    now.getSeconds()
  )}`;
};

export const winstonLogger = ({
  level,
  name,
}: LoggerOptionArguments): StrictLogger => {
  const consoleFormat = winston.format.printf((info) => {
     const isCustomError = info.error instanceof CustomError;
    let cleanedStack = null;
    const errorStack = (info?.error as { stack: string })?.stack?.replace(
      /\\/g,
      "/"
    );
    if (errorStack) {
      cleanedStack = cleanStack(errorStack, {
        pretty: true,
        basePath: process.cwd(),
      });
      cleanedStack = cleanedStack
        .split("\n")
        .filter(
          (line) =>
            !line.includes("node_modules") &&
            !line.includes("internal/") &&
            !line.includes("/tsx/")
        )
        .join("\n");
    }
    return JSON.stringify(
      Object.assign(
        {
          level: info.level,
          timestamp: getFormattedTimestamp(),
          service: name,
          message: info.message,
          context: info.context || "unknown",
        },
        info.error
          ? {
              message: isCustomError ? info.message : (info.error as { message: string }).message,
              stack: cleanedStack,
            }
          : {}
      )
    );
  });
  const transports: transport[] = [
    new winston.transports.Console({
      level,
      handleExceptions: true,
      format: consoleFormat,
    }),
  ];

  const logger: Logger = winston.createLogger({
    exitOnError: false,
    transports,
  });

  const originalInfo = logger.info.bind(logger);
  const originalError = logger.error.bind(logger);
  const strictLogger: StrictLogger = Object.assign(logger, {
    info: (message: string, context: string) => {
      originalInfo(message, { context });
    },
    error: (message: string, context: string, error?: Error | CustomError) => {
      originalError(message, {
        context,
        ...(error ? { error } : {}),
      });
    },
  });

  return strictLogger;
};
