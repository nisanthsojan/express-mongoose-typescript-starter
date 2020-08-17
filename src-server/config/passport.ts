import Passport, { PassportStatic } from "passport";
import passportLocal from "passport-local";
import { $User } from "../models";
import type { IUserDocument } from "../models/User";
import type { Request, Response, NextFunction } from "express";
import sanitize from "mongo-sanitize";

const LocalStrategy = passportLocal.Strategy;
export const passport: PassportStatic = Passport;

passport.serializeUser((user: IUserDocument, done) => {
    return done(undefined, user.id);
});

passport.deserializeUser(function (id, done): void {
    void $User.findById(id, (err, user) => {
        return done(err, user);
    });
});

/**
 * Sign in using Email and Password.
 */
passport.use(
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
        void $User.findOne({ email: sanitize(email.toLowerCase()) }, (err, user) => {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(undefined, false, { message: `Email ${email} not found.` });
            }

            // @todo
            /*
         if (!user.password) {
      return done(null, false, { msg: 'Your account was registered using a sign-in provider. To enable password login, sign in using a provider, and then set a password under your user profile.' });
    }
         */
            return user.comparePassword(password, (err, isMatch) => {
                if (err) {
                    return done(err);
                }
                if (isMatch) {
                    return done(undefined, user);
                }
                return done(undefined, false, { message: "Invalid email or password." });
            });
        });
    })
);

/**
 * Login Required middleware.
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.redirect(req.app.namedRoutes.build("admin.login"));
};
