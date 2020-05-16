import express, { Express, RequestHandler } from "express";
import compression from "compression"; // compresses requests
import session from "express-session";
import bodyParser from "body-parser";
import { ChildLogger } from "./util/logger";
import helmet from "helmet";
import connectMongo from "connect-mongo";
import flash from "connect-flash";
import path from "path";
import { default as passport } from "./config/passport";
import csurf from "csurf";
import { SESSION_NAME, SESSION_SECRET, IS_PROD } from "./util/secrets";
import expressEnforcesSsl from "express-enforces-ssl";
import { mongooseConnection } from "./util/mongoose";
import { appRoutes } from "./routes";
import { Logger } from "winston";

export class ServerApplication {
    private readonly _logger: Logger;
    private readonly _app: Express;
    private readonly _session: RequestHandler;

    constructor() {
        this._logger = ChildLogger(__filename);
        this._app = express();

        const MongoStore = connectMongo(session);
        this._session = session({
            resave: false,
            saveUninitialized: false,
            secret: SESSION_SECRET,
            store: new MongoStore({
                mongooseConnection: mongooseConnection.connection,
                autoReconnect: true
            }),
            name: SESSION_NAME,
            cookie: {
                secure: IS_PROD,
                httpOnly: true,
                maxAge: 3600000
            },
            unset: "destroy"
        });
    }

    public init(): Express {
        this._initViews();
        this._app.set("port", process.env.PORT || 3000);

        if (IS_PROD) {
            this._app.enable("trust proxy");
            this._app.use(expressEnforcesSsl());
        }

        this._app.use(compression());
        this._app.use(express.static(path.join(__dirname, "public"), { maxAge: 31557600000 }));
        this._app.use(helmet());
        this._app.use(bodyParser.json());
        this._app.use(bodyParser.urlencoded({ extended: true }));
        this._app.use(this._session);
        this._app.use(csurf());
        this._app.use((req, res, next) => {
            // Include the csrf token
            res.locals._csrf = req.csrfToken();
            next();
        });
        this._app.use(passport.initialize());
        this._app.use(passport.session());
        this._app.use(flash());

        /**
         *  register routes (Controller)
         */
        appRoutes(this._app);

        return this._app;
    }

    /*
     * Use the compiled pug template files for production
     */
    protected _initViews(): void {
        if (IS_PROD) {
            this._app.set("views", path.join(__dirname, "views"));
            this._app.set("view engine", "js");
            const runtime = require("pug").runtime;
            this._logger.debug(path.join(__dirname, "views"));
            this._app.engine("js", function (filePath, options, callback) {
                // define the template engine
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const data = require(filePath)(options, runtime);
                callback(undefined, data);
            });
        } else {
            this._app.set("views", path.join(__dirname, "../src-server/views"));
            this._app.set("view engine", "pug");
        }
    }

    get app(): Express {
        return this._app;
    }
}
