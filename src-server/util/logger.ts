import { createLogger, format, Logger, transports } from "winston";
import { join, relative } from "path";
import { rootPath } from "../project-directory";

// Cannot use util/secrets here, as it will cause circular dependency
const IS_PROD: boolean = process.env.NODE_ENV === "production";
const IS_TEST: boolean = process.env.NODE_ENV === "testing";

const usedTransports = [];

usedTransports.push(
    new transports.Console({
        level: IS_PROD ? "error" : "debug"
    })
);

// Disabled when testing as its not really necessary
if (!IS_TEST) {
    usedTransports.push(
        new transports.File({
            filename: join(rootPath, "logs", "debug.log"),
            level: IS_PROD ? "info" : "debug",
            maxsize: 5 * 1024 * 1024, // 5mb
            maxFiles: 5,
            tailable: true
        })
    );
}

export const logger = createLogger({
    transports: usedTransports,
    format: format.combine(
        format.timestamp({
            format: "DD/MM/YYYY HH:mm:ss.SSS"
        }),
        format.colorize(),
        format.printf((info) => {
            let out = `[${process.pid}][${info.timestamp}]`;
            if (info.FILE) {
                out += `[${info.FILE}]`;
            }
            if (info.FN) {
                out += `[${info.FN}]`;
            }

            const restInfo = Object.assign({}, info, {
                level: undefined,
                timestamp: undefined,
                message: undefined,
                FILE: undefined,
                FN: undefined
            });
            let stringifiedRest;
            if (!IS_PROD) {
                stringifiedRest = JSON.stringify(restInfo, null, 2);
            } else {
                stringifiedRest = JSON.stringify(restInfo);
            }

            let message = info.message;
            if (stringifiedRest !== "{}") {
                message += "::" + stringifiedRest;
            }
            return out + ` ${info.level}: ${message}`;
        })
    )
});

if (!IS_PROD) {
    logger.debug("Logging initialized at debug level");
}

export function ChildLogger(filePath: string): Logger {
    const file = relative(process.cwd(), filePath);
    return logger.child({ FILE: file });
}

export default logger;
