import { Express } from "express";
import NamedRouter from "named-routes";
import { isAuthenticated } from "./config/passport";
import { APP_NAME, CONTENT_HASH } from "./config/constants";
// Controllers (route handlers)
import * as userController from "./controllers/user";
import * as homeController from "./controllers/home";
import * as contactController from "./controllers/contact";

const namedRouter = new NamedRouter({
    caseSensitive: true
});

export function appRoutes(expressApp: Express): void {
    namedRouter.extendExpress(expressApp);
    namedRouter.registerAppHelpers(expressApp);

    // pass variables to our templates + all requests
    expressApp.use((req, res, next) => {
        res.locals.user = req.user;
        res.locals._flashes = req.flash();
        res.locals._appName = APP_NAME;
        res.locals._contentHash = CONTENT_HASH;
        next();
    });

    // Route prefixes
    const adminRoutePrefix = "/admin";

    expressApp.get("/", "index", homeController.index);
    expressApp.get("/contact", "contact", contactController.getContact);
    expressApp.post("/contact", "contact", contactController.postContact);

    // Admin User Routes
    expressApp.get(`${adminRoutePrefix}/register`, "admin.register", userController.getSignup);
    expressApp.post(`${adminRoutePrefix}/register`, userController.postSignup);
    expressApp.get(`${adminRoutePrefix}/entry`, "admin.login", userController.getLogin);
    expressApp.post(`${adminRoutePrefix}/entry`, userController.postLogin);
    expressApp.get(`${adminRoutePrefix}/logout`, "admin.logout", userController.logout);
    expressApp.get(`${adminRoutePrefix}/forgot`, "admin.forgot", userController.getForgot);
    expressApp.post(`${adminRoutePrefix}/forgot`, userController.postForgot);
    expressApp.get(`${adminRoutePrefix}/reset/:token`, "admin.reset", userController.getReset);
    expressApp.post(`${adminRoutePrefix}/reset/:token`, userController.postReset);
    expressApp.get(`${adminRoutePrefix}/account`, "admin.account", isAuthenticated, userController.getAccount);
    expressApp.post(
        `${adminRoutePrefix}/account/profile`,
        "admin.account.profile",
        isAuthenticated,
        userController.postUpdateProfile
    );
    expressApp.post(
        `${adminRoutePrefix}/account/password`,
        "admin.account.password",
        isAuthenticated,
        userController.postUpdatePassword
    );
    expressApp.post(
        `${adminRoutePrefix}/account/delete`,
        "admin.account.delete",
        isAuthenticated,
        userController.postDeleteAccount
    );
}
