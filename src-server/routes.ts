import { Express } from "express";
import Router from "named-routes";

import logger from "./util/logger";
// API keys and Passport configuration
import * as passportConfig from "./config/passport";
// Controllers (route handlers)
import * as userController from "./controllers/user";
import * as homeController from "./controllers/home";
import * as contactController from "./controllers/contact";

const router = new Router();

export default function routes(app: Express) {
    logger.debug("Initializing routes");
    router.extendExpress(app);
    router.registerAppHelpers(app);

    const adminRoutePrefix = "/supervisor";

    app.get("/", "index", homeController.index);
    app.get("/contact", "contact", contactController.getContact);
    app.post("/contact", "contact", contactController.postContact);


    // Admin User Routes
    app.get(`${adminRoutePrefix}/register`, "admin.register", userController.getSignup);
    app.post(`${adminRoutePrefix}/register`, userController.postSignup);
    app.get(`${adminRoutePrefix}/entry`, "admin.login", userController.getLogin);
    app.post(`${adminRoutePrefix}/entry`, userController.postLogin);
    app.get(`${adminRoutePrefix}/logout`, "admin.logout", userController.logout);
    app.get(`${adminRoutePrefix}/forgot`, "admin.forgot", userController.getForgot);
    app.post(`${adminRoutePrefix}/forgot`, userController.postForgot);
    app.get(`${adminRoutePrefix}/reset/:token`, "admin.reset", userController.getReset);
    app.post(`${adminRoutePrefix}/reset/:token`, userController.postReset);
    app.get(`${adminRoutePrefix}/account`, "admin.account", passportConfig.isAuthenticated, userController.getAccount);
    app.post(`${adminRoutePrefix}/account/profile`, "admin.account.profile", passportConfig.isAuthenticated, userController.postUpdateProfile);
    app.post(`${adminRoutePrefix}/account/password`, "admin.account.password", passportConfig.isAuthenticated, userController.postUpdatePassword);
    app.post(`${adminRoutePrefix}/account/delete`, "admin.account.delete", passportConfig.isAuthenticated, userController.postDeleteAccount);


    /**
     * API examples routes.
     */
// app.get("/api", apiController.getApi);
// app.post("/account/profile", passportConfig.isAuthenticated, userController.postUpdateProfile);
// app.post("/account/password", passportConfig.isAuthenticated, userController.postUpdatePassword);
// app.post("/account/delete", passportConfig.isAuthenticated, userController.postDeleteAccount);
// app.get("/account/unlink/:provider", passportConfig.isAuthenticated, userController.getOauthUnlink);
}
