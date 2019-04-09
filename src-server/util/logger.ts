import winston from "winston";
import path from "path";

export const logger = winston.createLogger({
    transports: [
        new (winston.transports.Console)({level: process.env.NODE_ENV === "production" ? "error" : "debug"}),
        new (winston.transports.File)({filename: "debug.log", level: "debug"})
    ]
});

if (process.env.NODE_ENV !== "production") {
    logger.debug("Logging initialized at debug level");
}

export function ChildLogger(filePath: string) {
    const file = path.relative(process.cwd(), filePath);
    return logger.child({FILE: file});
}


export default logger;

