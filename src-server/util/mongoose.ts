import bluebird from "bluebird";
import mongoose, { ConnectionOptions } from "mongoose";
import { ChildLogger } from "./logger";

import { MONGODB_URI, IS_PROD } from "./secrets";

const mongoUrl = <string>MONGODB_URI;
const options: ConnectionOptions = {
    useNewUrlParser: false
};
(<any>mongoose).Promise = bluebird;
const logger = ChildLogger(__filename);

mongoose.connection.on("open", function () {
    logger.info("Database connection OPEN");
});
mongoose.connection.on("close", function () {
    logger.info("Database connection CLOSED");
});

export const dbConnection = (callback: Function) => {
    mongoose.connect(mongoUrl, options, (err) => {
        /** ready to use. The `mongoose.connect()` promise resolves to undefined. */
        if (err) {
            logger.error("MongoDB connection error. Please make sure MongoDB is running. " + err);
        } else {
            logger.info("MongoDB connection success ");

        }
        callback(err);
    });
};


export default mongoose;

