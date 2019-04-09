import express from "express";
import compression from "compression";  // compresses requests
import session, { SessionOptions } from "express-session";
import bodyParser from "body-parser";
import { ChildLogger } from "./util/logger";
import helmet from "helmet";
import dotenv from "dotenv";
import mongo, { MongoUrlOptions } from "connect-mongo";
import flash from "express-flash";
import path from "path";
import mongoose from "mongoose";
import { default as passport } from "./config/passport";
import bluebird from "bluebird";
import csurf from "csurf";
import { MONGODB_URI, SESSION_NAME, SESSION_SECRET, IS_PROD } from "./util/secrets";

const logger = ChildLogger(__filename);
const MongoStore = mongo(session);

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({path: ".env.example"});

// Create Express server
const app = express();

// Connect to MongoDB
const mongoUrl = <string>MONGODB_URI;
(<any>mongoose).Promise = bluebird;
mongoose.connect(mongoUrl, {useNewUrlParser: false}).then(() => {
    /** ready to use. The `mongoose.connect()` promise resolves to undefined. */
}).catch(err => {
    logger.error("MongoDB connection error. Please make sure MongoDB is running. " + err);
    // process.exit();
});

// Express configuration
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(compression());
app.use(
    express.static(path.join(__dirname, "public"), {maxAge: 31557600000})
);
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session(<SessionOptions>{
    resave: true,
    saveUninitialized: true,
    secret: SESSION_SECRET,
    store: new MongoStore(<MongoUrlOptions>{
        url: mongoUrl,
        autoReconnect: true
    }),
    name: SESSION_NAME,
    cookie: {
        secure: IS_PROD,
        httpOnly: true,
    }
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
    res.locals._app_name = "ExMoBoTy Starter";
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
