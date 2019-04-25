import express from "express";
import compression from "compression";  // compresses requests
import session, { SessionOptions } from "express-session";
import bodyParser from "body-parser";
import { ChildLogger } from "./util/logger";
import helmet from "helmet";
import mongo, { MogooseConnectionOptions } from "connect-mongo";
import flash from "express-flash";
import path from "path";
import { default as passport } from "./config/passport";
import csurf from "csurf";
import { SESSION_NAME, SESSION_SECRET, IS_PROD } from "./util/secrets";
import express_enforces_ssl from "express-enforces-ssl";
import mongoose from "./util/mongoose";
import CONSTANTS from "./config/constants.json";

const logger = ChildLogger(__filename);
const MongoStore = mongo(session);


// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
/*
* Use the compiled pug template files for production
 */
if (IS_PROD) {

    app.enable("trust proxy");
    app.use(express_enforces_ssl());

    app.set("views", path.join(__dirname, "views"));
    app.set("view engine", "js");
    const runtime = require("pug").runtime;
    logger.debug(path.join(__dirname, "views"));
    app.engine("js", function (filePath, options, callback) { // define the template engine
        const data = require(filePath)(options, runtime);
        callback(undefined, data);
    });
} else {
    app.set("views", path.join(__dirname, "../views"));
    app.set("view engine", "pug");
}

app.use(compression());
app.use(
    express.static(path.join(__dirname, "public"), {maxAge: 31557600000})
);
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session(<SessionOptions>{
    resave: false,
    saveUninitialized: false,
    secret: SESSION_SECRET,
    store: new MongoStore(<MogooseConnectionOptions>{
        mongooseConnection: mongoose.connection,
        autoReconnect: true
    }),
    name: SESSION_NAME,
    cookie: {
        secure: IS_PROD,
        httpOnly: true,
        maxAge: 3600000
    },
    unset: "destroy"
}));
app.use(csurf());
app.use((req, res, next) => {
    // Include the csrf token
    res.locals._csrf = req.csrfToken();
    next();
});
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

app.use((req, res, next) => {
    res.locals._app_name = CONSTANTS.APP_NAME;
    next();
});

app.use((req, res, next) => {
    // After successful login, redirect back to the intended page
    /*if (!req.user &&
        req.path !== "/login" &&
        req.path !== "/signup" &&
        !req.path.match(/^\/auth/) &&
        !req.path.match(/\./)) {
        req.session!.returnTo = req.path;
    } else if (req.user &&
        req.path == "/account") {
        req.session!.returnTo = req.path;
    }*/
    next();
});

/**
 *  include routes (Controller)
 */

import routes from "./routes";

routes(app);

export default app;
