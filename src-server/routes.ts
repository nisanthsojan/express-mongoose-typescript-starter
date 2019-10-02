import express from "express";
import Router from "named-routes";

import { ChildLogger } from "./util/logger";
// API keys and Passport configuration
import * as passportConfig from "./config/passport";
// Controllers (route handlers)
import * as userController from "./controllers/user";
import * as homeController from "./controllers/home";
import * as contactController from "./controllers/contact";

const logger = ChildLogger(__filename);
export const router = new Router();
export const expressRouter = express.Router();
router.extendExpress(expressRouter);

// Route prefixes
const adminRoutePrefix = "/admin";

expressRouter.get("/", "index", homeController.index);
expressRouter.get("/contact", "contact", contactController.getContact);
expressRouter.post("/contact", "contact", contactController.postContact);


// Admin User Routes
expressRouter.get(`${adminRoutePrefix}/register`, "admin.register", userController.getSignup);
expressRouter.post(`${adminRoutePrefix}/register`, userController.postSignup);
expressRouter.get(`${adminRoutePrefix}/entry`, "admin.login", userController.getLogin);
expressRouter.post(`${adminRoutePrefix}/entry`, userController.postLogin);
expressRouter.get(`${adminRoutePrefix}/logout`, "admin.logout", userController.logout);
expressRouter.get(`${adminRoutePrefix}/forgot`, "admin.forgot", userController.getForgot);
expressRouter.post(`${adminRoutePrefix}/forgot`, userController.postForgot);
expressRouter.get(`${adminRoutePrefix}/reset/:token`, "admin.reset", userController.getReset);
expressRouter.post(`${adminRoutePrefix}/reset/:token`, userController.postReset);
expressRouter.get(`${adminRoutePrefix}/account`, "admin.account", passportConfig.isAuthenticated, userController.getAccount);
expressRouter.post(`${adminRoutePrefix}/account/profile`, "admin.account.profile", passportConfig.isAuthenticated, userController.postUpdateProfile);
expressRouter.post(`${adminRoutePrefix}/account/password`, "admin.account.password", passportConfig.isAuthenticated, userController.postUpdatePassword);
expressRouter.post(`${adminRoutePrefix}/account/delete`, "admin.account.delete", passportConfig.isAuthenticated, userController.postDeleteAccount);

export default expressRouter;
