import { randomBytes } from "crypto";
import type { Request, Response, NextFunction } from "express";
import type { IVerifyOptions } from "passport-local";
import { passport } from "../config/passport";
import { check, validationResult } from "express-validator";
import sanitize from "mongo-sanitize";
import { ChildLogger } from "../util/logger";
import {
    // APP_EMAIL,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    PASSWORD_RESET_EXPIRES,
    TOKEN_LENGTH
} from "../config/constants";
import sgMail from "@sendgrid/mail";
import { SENDGRID_API_KEY } from "../util/secrets";
import type { IUserDocument } from "../models/User";
import { $User } from "../models";
import Bluebird from "bluebird";
import moment from "moment";
import type { Types } from "mongoose";

const logger = ChildLogger(__filename);
sgMail.setApiKey(SENDGRID_API_KEY);
/**
 * GET /login
 * Login page.
 */
export const getLogin = function (req: Request, res: Response): void {
    if (req.user) {
        return res.redirect(req.app.namedRoutes.build("index"));
    }
    return res.render("account/login", {
        title: "Login"
    });
};

/**
 * POST /login
 * Sign in using email and password.
 */
export const postLogin = [
    check("email", "Email is not valid").isEmail().normalizeEmail({
        "all_lowercase": false,
        "gmail_remove_dots": false
    }),
    check("password").not().isEmpty().withMessage("Password cannot be blank"),
    (req: Request, res: Response, next: NextFunction): void => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return res.status(400).redirect(req.app.namedRoutes.build("admin.login"));
        }

        return passport.authenticate("local", (err: Error, user: IUserDocument, info: IVerifyOptions): void => {
            if (err) {
                logger.error(err);
                return next(err);
            }
            if (!user) {
                req.flash("errors", { msg: info.message });
                return res.status(422).redirect(req.app.namedRoutes.build("admin.login"));
            }
            return req.logIn(user, (err) => {
                if (err) {
                    logger.error(err);
                    return next(err);
                }
                req.flash("success", { msg: "Success! You are logged in." });
                return res.redirect(req.app.namedRoutes.build("index"));
            });
        })(req, res, next);
    }
];

/**
 * GET /logout
 * Log out.
 */
export const logout = function (req: Request, res: Response): void {
    req.logout();
    return res.redirect(req.app.namedRoutes.build("index"));
};

/**
 * GET /signup
 * Signup page.
 */
export const getSignup = function (req: Request, res: Response): void {
    if (req.user) {
        return res.redirect(req.app.namedRoutes.build("index"));
    }
    return res.render("account/signup", {
        title: "Register as a Supervisor"
    });
};

/**
 * POST /signup
 * Create a new local account.
 */
export const postSignup = [
    check("email", "Email is not valid").isEmail().normalizeEmail({
        "all_lowercase": false,
        "gmail_remove_dots": false
    }),
    check("password")
        .not()
        .isEmpty()
        .withMessage("Password cannot be blank")
        .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
        .withMessage(
            `Password must be at least ${PASSWORD_MIN_LENGTH} and maximun ${PASSWORD_MAX_LENGTH} characters long`
        )
        .custom((value, { req }): boolean => {
            if (value !== req.body.confirmPassword) {
                throw new Error("Passwords do not match");
            }
            return true;
        }),
    check("fullName").not().isEmpty().withMessage("Full Name cannot be blank").trim().escape(),
    (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return Promise.resolve(res.status(400).redirect(req.app.namedRoutes.build("admin.register")));
        }

        return $User
            .findOne({ email: sanitize<string>(req.body.email) })
            .exec()
            .then((existingUser) => {
                if (existingUser) {
                    return Promise.reject(new Error("User exists"));
                }

                return new $User({
                    email: sanitize<string>(req.body.email),
                    password: sanitize<string>(req.body.password),
                    profile: {
                        name: sanitize<string>(req.body.fullName)
                    }
                }).save();
            })
            .then((user) => {
                return req.logIn(user, (err) => {
                    if (err) {
                        throw err;
                    }
                    return res.redirect(req.app.namedRoutes.build("index"));
                });
            })
            .catch((err) => {
                logger.error(err);
                req.flash("errors", {
                    msg: "A link to activate your account has been emailed to the address provided."
                });
                return res.status(422).redirect(req.app.namedRoutes.build("admin.register"));
            });
    }
];

/**
 * GET /forgot
 * Forgot Password page.
 */
export const getForgot = function (req: Request, res: Response): void {
    if (req.isAuthenticated()) {
        return res.redirect(req.app.namedRoutes.build("index"));
    }
    return res.render("account/forgot", {
        title: "Forgot Password"
    });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
export const postForgot = [
    check("email", "Email is not valid").isEmail().normalizeEmail({
        "all_lowercase": false,
        "gmail_remove_dots": false
    }),
    (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return Bluebird.resolve(res.status(400).redirect(req.app.namedRoutes.build("admin.forgot")));
        }

        return (
            Bluebird.resolve()
                .then(() => $User.findOne({ email: sanitize<string>(req.body.email) }).exec())
                .then((user) => {
                    if (!user) {
                        return Bluebird.reject(new Error("Account with that email address does not exist."));
                    }
                    return user;
                })
                .then((user) => {
                    const token = randomBytes(TOKEN_LENGTH);
                    user.passwordResetToken = token.toString("hex");
                    user.passwordResetExpires = moment().add(PASSWORD_RESET_EXPIRES, "seconds").toDate();
                    return user.save();
                })
                // .then((user) => {
                // const resetUrl = req.app.namedRoutes.build("admin.reset", { token: user.passwordResetToken as string });
                //       const mailOptions = {
                //           to: user.email,
                //           from: APP_EMAIL,
                //           subject: "Reset your password",
                //           text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
                // Please click on the following link, or paste this into your browser to complete the process:\n\n
                // http://${req.headers.host}${resetUrl}\n\n
                // If you did not request this, please ignore this email and your password will remain unchanged.\n`
                //       };
                // transporter.sendMail(mailOptions, (err) => {
                //     req.flash("info", {msg: `An e-mail has been sent to ${user.email} with further instructions.`});
                //     done(err);
                // });
                // })
                .catch((err) => {
                    logger.error(err);
                    return Bluebird.resolve();
                })
                .finally(() => {
                    req.flash(
                        "success",
                        "If that email address is in our database, we will send you an email to reset your password."
                    );
                    return res.redirect(req.app.namedRoutes.build("admin.forgot"));
                })
        );
    }
];

/**
 * GET /reset/:token
 * Reset Password page.
 */
export const getReset = function (req: Request, res: Response): Promise<void> {
    if (req.isAuthenticated()) {
        return Bluebird.resolve(res.redirect(req.app.namedRoutes.build("index")));
    }

    return $User
        .findOne({ passwordResetToken: sanitize<string>(req.params.token) })
        .where("passwordResetExpires")
        .gt(Date.now())
        .exec()
        .then((user) => {
            if (!user) {
                return Bluebird.reject(new Error("User not found"));
            }
            return res.render("account/reset", {
                title: "Password Reset"
            });
        })
        .catch((err) => {
            logger.error(err);
            req.flash("errors", { msg: "Password reset token is invalid or has expired." });
            return res.status(422).redirect(req.app.namedRoutes.build("index"));
        });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
export const postReset = [
    check("password")
        .not()
        .isEmpty()
        .withMessage("Password cannot be blank")
        .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
        .withMessage(
            `Password must be at least ${PASSWORD_MIN_LENGTH} and maximun ${PASSWORD_MAX_LENGTH} characters long`
        )
        .custom((value, { req }): boolean => {
            if (value !== req.body.confirmPassword) {
                throw new Error("Passwords do not match");
            }
            return true;
        }),
    (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return Bluebird.resolve(res.status(400).redirect("back"));
        }

        return Bluebird.resolve()
            .then(() =>
                $User
                    .findOne({ passwordResetToken: sanitize<string>(req.params.token) })
                    .where("passwordResetExpires")
                    .gt(Date.now())
                    .exec()
            )
            .then((user) => {
                if (!user) {
                    return Bluebird.reject(new Error("User not found"));
                }
                user.password = sanitize<string>(req.body.password);
                user.passwordResetToken = undefined;
                user.passwordResetExpires = undefined;
                return user.save();
            })
            .then((user) => {
                /*
                SEND PASSWORD RESET EMAIL
            const mailOptions = {
                to: user.email,
                from: CONSTANTS.APP_EMAIL,
                subject: "Your password has been changed",
                text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
            };
            transporter.sendMail(mailOptions, (err) => {
                req.flash("success", {msg: "Success! Your password has been changed."});
                done(err);
            });*/
                return user;
            })
            .then(() => {
                req.flash("success", { msg: "You can now login." });
                return res.redirect(req.app.namedRoutes.build("index"));
            })
            .catch((err) => {
                logger.error(err);
                req.flash("errors", { msg: "Password reset token is invalid or has expired." });
                return res.status(422).redirect("back");
            });
    }
];

/**
 * GET /account
 * Profile page.
 */
export const getAccount = function (req: Request, res: Response): void {
    return res.render("account/profile", {
        title: "Account Management"
    });
};

/**
 * POST /account/profile
 * Update profile information.
 */
export const postUpdateProfile = [
    check("fullName").not().isEmpty().withMessage("Full Name cannot be blank").trim().escape(),
    (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return Bluebird.resolve(res.status(400).redirect("back"));
        }

        if (!req.user) {
            req.flash("errors", { msg: "App error." });
            return Bluebird.resolve(res.status(400).redirect("back"));
        }

        return $User
            .findById((req.user as IUserDocument).id)
            .then((user) => {
                if (!user) {
                    return Bluebird.reject(new Error("User not found"));
                }
                user.profile.name = sanitize<string>(req.body.fullName) || "";

                return user.save();
            })
            .then(() => {
                req.flash("success", { msg: "Profile information has been updated." });
                return res.redirect(req.app.namedRoutes.build("admin.account"));
            })
            .catch((err) => {
                logger.error(err);
                req.flash("errors", { msg: "App error." });
                return res.status(422).redirect(req.app.namedRoutes.build("admin.account"));
            });
    }
];

/**
 * POST /account/password
 * Update current password.
 */
export const postUpdatePassword = [
    check("password")
        .not()
        .isEmpty()
        .withMessage("Password cannot be blank")
        .isLength({ min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
        .withMessage(
            `Password must be at least ${PASSWORD_MIN_LENGTH} and maximun ${PASSWORD_MAX_LENGTH} characters long`
        )
        .custom((value, { req }): boolean => {
            if (value !== req.body.confirmPassword) {
                throw new Error("Passwords do not match");
            }
            return true;
        }),
    (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return Bluebird.resolve(res.status(400).redirect("back"));
        }

        if (!req.user) {
            req.flash("errors", { msg: "Invalid User" });
            return Bluebird.resolve(res.status(400).redirect("back"));
        }

        return $User
            .findById((req.user as IUserDocument).id)
            .then((user) => {
                if (!user) {
                    return Bluebird.reject(new Error("User not found"));
                }
                user.password = sanitize<string>(req.body.password);

                return user.save();
            })
            .then(() => {
                req.flash("success", { msg: "Password has been changed." });
                return res.redirect(req.app.namedRoutes.build("admin.account"));
            })
            .catch((err) => {
                logger.error(err);
                req.flash("error", { msg: "Error. Please try again later" });
                return res.redirect(req.app.namedRoutes.build("admin.account"));
            });
    }
];

/**
 * POST /account/delete
 * Delete user account.
 * @todo need to confirm password again for additional security.
 */
export const postDeleteAccount = function (req: Request, res: Response): Promise<void> {
    if (!req.user) {
        logger.error("Undefined user");
        req.flash("errors", { msg: "Undefined user." });
        return Bluebird.resolve(res.redirect(req.app.namedRoutes.build("index")));
    }
    return $User
        .remove({ _id: (req.user as IUserDocument).id as Types.ObjectId })
        .exec()
        .then(() => {
            req.logout();
            req.flash("info", { msg: "Your account has been deleted." });
            return res.redirect(req.app.namedRoutes.build("index"));
        })
        .catch((err) => {
            logger.error(err);
            req.flash("errors", { msg: "Undefined user." });
            return res.redirect(req.app.namedRoutes.build("index"));
        });
};
