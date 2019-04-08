import async from "async";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { default as User, UserModel, AuthToken } from "../models/User";
import { Request, Response, NextFunction } from "express";
import { IVerifyOptions } from "passport-local";
import { WriteError } from "mongodb";
import { default as passport } from "../config/passport";
import { check, validationResult } from "express-validator/check";
import sanitize from "mongo-sanitize";
import logger from "../util/logger";
import CONSTANTS from "../config/constants.json";


/**
 * GET /login
 * Login page.
 */
export let getLogin = (req: Request, res: Response) => {
    if (req.user) {
        return res.redirect(req.app.namedRoutes.build("index"));
    }
    res.render("account/login", {
        title: "Login"
    });
};

/**
 * POST /login
 * Sign in using email and password.
 */
export let postLogin = [
    check("email", "Email is not valid").isEmail().normalizeEmail({
        all_lowercase: false,
        gmail_remove_dots: false
    }),
    check("password").not().isEmpty().withMessage("Password cannot be blank"),
    (req: Request, res: Response, next: NextFunction) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return res.redirect(req.app.namedRoutes.build("admin.login"));
        }

        passport.authenticate("local", (err: Error, user: UserModel, info: IVerifyOptions) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                req.flash("errors", {msg: info.message});
                return res.redirect(req.app.namedRoutes.build("admin.login"));
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                req.flash("success", {msg: "Success! You are logged in."});
                res.redirect(req.session!.returnTo || req.app.namedRoutes.build("index"));
            });
        })(req, res, next);
    }
];

/**
 * GET /logout
 * Log out.
 */
export let logout = (req: Request, res: Response) => {
    req.logout();
    res.redirect(req.app.namedRoutes.build("index"));
};

/**
 * GET /signup
 * Signup page.
 */
export let getSignup = (req: Request, res: Response) => {
    if (req.user) {
        return res.redirect(req.app.namedRoutes.build("index"));
    }
    res.render("account/signup", {
        title: "Register as a Supervisor"
    });
};

/**
 * POST /signup
 * Create a new local account.
 */
export let postSignup = [
    check("email", "Email is not valid").isEmail().normalizeEmail({
        all_lowercase: false,
        gmail_remove_dots: false
    }),
    check("password")
        .not().isEmpty().withMessage("Password cannot be blank")
        .isLength({min: parseInt(CONSTANTS.PASSWORD_MIN_LENGTH)}).withMessage(`Password must be at least ${CONSTANTS.PASSWORD_MIN_LENGTH} characters long`)
        .custom((value, {req}) => {
            if (value !== req.body.confirmPassword) {
                throw new Error("Passwords do not match");
            } else {
                return true;
            }
        }),
    check("fullName").not().isEmpty().withMessage("Full Name cannot be blank"),
    (req: Request, res: Response, next: NextFunction) => {

        const errors = validationResult(req);
        logger.debug("errors", errors.array());
        logger.debug("req.body", req.body);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return res.redirect(req.app.namedRoutes.build("admin.register"));
        }

        const user = new User({
            email: sanitize(req.body.email),
            password: sanitize(req.body.password),
            profile: {
                name: sanitize(req.body.fullName)
            }
        });

        User.findOne({email: sanitize(req.body.email)}, (err, existingUser) => {
            if (err) {
                return next(err);
            }
            if (existingUser) {
                req.flash("errors", {msg: "Account with that email address already exists."});
                return res.redirect(req.app.namedRoutes.build("admin.register"));
            }
            user.save((err) => {
                if (err) {
                    return next(err);
                }
                req.logIn(user, (err) => {
                    if (err) {
                        return next(err);
                    }
                    res.redirect(req.app.namedRoutes.build("index"));
                });
            });
        });
    }
];

/**
 * GET /forgot
 * Forgot Password page.
 */
export let getForgot = (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
        return res.redirect(req.app.namedRoutes.build("index"));
    }
    res.render("account/forgot", {
        title: "Forgot Password"
    });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
export let postForgot = [
    check("email", "Email is not valid").isEmail().normalizeEmail({
        all_lowercase: false,
        gmail_remove_dots: false
    }),
    (req: Request, res: Response, next: NextFunction) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return res.redirect(req.app.namedRoutes.build("admin.forgot"));
        }

        async.waterfall([
            function createRandomToken(done: Function) {
                crypto.randomBytes(16, (err, buf) => {
                    const token = buf.toString("hex");
                    done(err, {
                        accessToken: token,
                        kind: "local"
                    });
                });
            },
            function setRandomToken(token: AuthToken, done: Function) {
                User.findOne({email: sanitize(req.body.email)}, (err, user: any) => {
                    if (err) {
                        return done(err);
                    }
                    if (!user) {
                        req.flash("errors", {msg: "Account with that email address does not exist."});
                        return res.redirect(req.app.namedRoutes.build("admin.forgot"));
                    }
                    user.passwordResetToken = token.accessToken;
                    user.passwordResetExpires = Date.now() + parseInt(CONSTANTS.PASSWORD_RESET_EXPIRES); // 1 hour
                    user.save((err: WriteError) => {
                        done(err, token, user);
                    });
                });
            },
            function sendForgotPasswordEmail(token: AuthToken, user: UserModel, done: Function) {
                const transporter = nodemailer.createTransport({
                    service: "SendGrid",
                    auth: {
                        user: process.env.SENDGRID_USER,
                        pass: process.env.SENDGRID_PASSWORD
                    }
                });
                const resetUrl = req.app.namedRoutes.build("admin.reset", {token: token.accessToken});
                logger.debug(`http://${req.headers.host}${resetUrl}`);
                const mailOptions = {
                    to: user.email,
                    from: CONSTANTS.APP_EMAIL,
                    subject: "Reset your password",
                    text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}${resetUrl}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
                };
                transporter.sendMail(mailOptions, (err) => {
                    req.flash("info", {msg: `An e-mail has been sent to ${user.email} with further instructions.`});
                    done(err);
                });
            }
        ], (err) => {
            if (err) {
                return next(err);
            }
            res.redirect(req.app.namedRoutes.build("admin.forgot"));
        });
    }
];


/**
 * GET /reset/:token
 * Reset Password page.
 */
export let getReset = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return res.redirect(req.app.namedRoutes.build("index"));
    }
    User
        .findOne({passwordResetToken: sanitize(req.params.token)})
        .where("passwordResetExpires").gt(Date.now())
        .exec((err, user) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                req.flash("errors", {msg: "Password reset token is invalid or has expired."});
                return res.redirect(req.app.namedRoutes.build("admin.forgot"));
            }
            res.render("account/reset", {
                title: "Password Reset"
            });
        });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
export let postReset = [
    check("password")
        .not().isEmpty().withMessage("Password cannot be blank")
        .isLength({min: parseInt(CONSTANTS.PASSWORD_MIN_LENGTH)}).withMessage(`Password must be at least ${CONSTANTS.PASSWORD_MIN_LENGTH} characters long`)
        .custom((value, {req}) => {
            if (value !== req.body.confirmPassword) {
                throw new Error("Passwords do not match");
            } else {
                return true;
            }
        }),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return res.redirect("back");
        }

        async.waterfall([
            function resetPassword(done: Function) {
                User
                    .findOne({passwordResetToken: sanitize(req.params.token)})
                    .where("passwordResetExpires").gt(Date.now())
                    .exec((err, user: any) => {
                        if (err) {
                            return next(err);
                        }
                        if (!user) {
                            req.flash("errors", {msg: "Password reset token is invalid or has expired."});
                            return res.redirect("back");
                        }
                        user.password = sanitize(req.body.password);
                        user.passwordResetToken = undefined;
                        user.passwordResetExpires = undefined;
                        user.save((err: WriteError) => {
                            if (err) {
                                return next(err);
                            }
                            req.logIn(user, (err) => {
                                done(err, user);
                            });
                        });
                    });
            },
            function sendResetPasswordEmail(user: UserModel, done: Function) {
                const transporter = nodemailer.createTransport({
                    service: "SendGrid",
                    auth: {
                        user: process.env.SENDGRID_USER,
                        pass: process.env.SENDGRID_PASSWORD
                    }
                });
                const mailOptions = {
                    to: user.email,
                    from: CONSTANTS.APP_EMAIL,
                    subject: "Your password has been changed",
                    text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
                };
                transporter.sendMail(mailOptions, (err) => {
                    req.flash("success", {msg: "Success! Your password has been changed."});
                    done(err);
                });
            }
        ], (err) => {
            if (err) {
                return next(err);
            }
            res.redirect(req.app.namedRoutes.build("index"));
        });
    }
];


/**
 * GET /account
 * Profile page.
 */
export let getAccount = (req: Request, res: Response) => {
    res.render("account/profile", {
        title: "Account Management"
    });
};

/**
 * POST /account/profile
 * Update profile information.
 */
export let postUpdateProfile = [
    check("fullName").not().isEmpty().withMessage("Full Name cannot be blank"),
    (req: Request, res: Response, next: NextFunction) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return res.redirect("back");
        }

        User.findById(req.user.id, (err, user: UserModel) => {
            if (err) {
                return next(err);
            }
            user.profile.name = sanitize(req.body.fullName) || "";
            user.save((err: WriteError) => {
                if (err) {
                    logger.error(err);
                    req.flash("errors", {msg: "Database error."});
                    return res.redirect(req.app.namedRoutes.build("admin.account"));
                }
                req.flash("success", {msg: "Profile information has been updated."});
                res.redirect(req.app.namedRoutes.build("admin.account"));
            });
        });
    }
];

/**
 * POST /account/password
 * Update current password.
 */
export let postUpdatePassword = [
    check("password")
        .not().isEmpty().withMessage("Password cannot be blank")
        .isLength({min: parseInt(CONSTANTS.PASSWORD_MIN_LENGTH)}).withMessage(`Password must be at least ${CONSTANTS.PASSWORD_MIN_LENGTH} characters long`)
        .custom((value, {req}) => {
            if (value !== req.body.confirmPassword) {
                throw new Error("Passwords do not match");
            } else {
                return true;
            }
        }),
    (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return res.redirect("back");
        }

        User.findById(req.user.id, (err, user: UserModel) => {
            if (err) {
                return next(err);
            }
            user.password = sanitize(req.body.password);
            user.save((err: WriteError) => {
                if (err) {
                    return next(err);
                }
                req.flash("success", {msg: "Password has been changed."});
                res.redirect(req.app.namedRoutes.build("admin.account"));
            });
        });
    }];

/**
 * POST /account/delete
 * Delete user account.
 */
export let postDeleteAccount = (req: Request, res: Response, next: NextFunction) => {
    User.remove({_id: req.user.id}, (err) => {
        if (err) {
            return next(err);
        }
        req.logout();
        req.flash("info", {msg: "Your account has been deleted."});
        res.redirect(req.app.namedRoutes.build("index"));
    });
};


