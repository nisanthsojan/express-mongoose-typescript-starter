import { ChildLogger } from "./logger";
import dotenv from "dotenv";
import fs from "fs";

const logger = ChildLogger(__filename);

if (process.env.NODE_ENV === "testing") {
    if (fs.existsSync(".env.testing")) {
        logger.log({
            level: "debug",
            message: "Using .env.testing file to supply config environment variables"
        });
        dotenv.config({ path: ".env.testing" });
    } else {
        logger.log({
            level: "error",
            message: "No testing env file found"
        });
        process.exit(1);
    }
} else {
    if (fs.existsSync(".env")) {
        logger.log({
            level: "debug",
            message: "Using .env file to supply config environment variables"
        });
        dotenv.config({ path: ".env" });
    } else {
        logger.log({
            level: "debug",
            message: "Using .env.example file to supply config environment variables"
        });
        dotenv.config({ path: ".env.example" }); // you can delete this after you create your own .env file!
    }
}
export const ENVIRONMENT = process.env.NODE_ENV as string;
export const IS_PROD: boolean = ENVIRONMENT === "production"; // Anything else is treated as 'dev'
export const IS_TEST: boolean = ENVIRONMENT === "testing"; // Anything else is treated as 'dev'
export const CPU_COUNT: number = process.env.WEB_CONCURRENCY ? parseInt(process.env.WEB_CONCURRENCY) : 2;

export const SESSION_SECRET = process.env.SESSION_SECRET as string;
export const SESSION_NAME = process.env.SESSION_NAME as string;
export const MONGODB_URI = process.env.MONGODB_URI as string;
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY as string;

if (!SESSION_SECRET) {
    logger.log({
        level: "error",
        message: "No client secret. Set SESSION_SECRET environment variable."
    });
    process.exit(1);
}

if (!MONGODB_URI) {
    logger.log({
        level: "error",
        message: "No mongo connection string. Set MONGODB_URI environment variable."
    });
    process.exit(1);
}
