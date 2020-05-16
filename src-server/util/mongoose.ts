import { ChildLogger } from "./logger";
import { MONGODB_URI } from "./secrets";
import { Connection, ConnectionOptions, Mongoose, Types, STATES } from "mongoose";
import Bluebird from "bluebird";

const logger = ChildLogger(__filename);

export function toObjectId(id: string | Types.ObjectId): undefined | Types.ObjectId {
    if (!id || "" === id) {
        return undefined;
    }
    const stringId = id.toString().toLowerCase();
    logger.log({
        level: "debug",
        message: `stringId::${stringId}`,
        FN: "toObjectId"
    });

    if (!Types.ObjectId.isValid(stringId)) {
        return undefined;
    }

    const result = new Types.ObjectId(stringId);
    if (result.toString() != stringId) {
        return undefined;
    }

    return result;
}

class MongooseConnection {
    private readonly mongo: Mongoose;
    private readonly _options: ConnectionOptions;
    private readonly _uri: string;

    constructor() {
        this._options = {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false
        };
        this.mongo = new Mongoose();
        this.mongo.Promise = Bluebird;
        this._uri = MONGODB_URI;
        this.mongo.connection
            .on(STATES[STATES.connected], () => {
                logger.log({
                    level: "info",
                    message: "Database connection OPEN",
                    FN: "constructor"
                });
            })
            .on(STATES[STATES.disconnected], function () {
                logger.log({
                    level: "info",
                    message: "Database connection CLOSED",
                    FN: "constructor"
                });
            });
    }

    connect(): Promise<Mongoose> {
        return this.mongo.connect(this._uri, this._options);
    }

    get connection(): Connection {
        return this.mongo.connection;
    }

    get mongoose(): Mongoose {
        return this.mongo;
    }

    get uri(): string {
        return this._uri;
    }

    disconnect(): Promise<void> {
        return this.mongo.disconnect();
    }
}

export const mongooseConnection = new MongooseConnection();
