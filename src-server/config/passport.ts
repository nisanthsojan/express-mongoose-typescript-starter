import passport from "passport";
import request from "request";
import passportLocal from "passport-local";
import _ from "lodash";

import { default as User, IUserModel } from "../models/User";
import { Request, Response, NextFunction } from "express";
import sanitize from "mongo-sanitize";

const LocalStrategy = passportLocal.Strategy;

passport.serializeUser<any, any>((user, done) => {
    return done(undefined, user.id);
});

passport.deserializeUser((id, done) => {

    return User.findById(id, (err, user) => {
        return done(err, <IUserModel>user);
    });
});


/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({usernameField: "email"}, (email, password, done) => {

    return User.findOne({email: sanitize(email.toLowerCase())}, (err, user: any) => {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(undefined, false, {message: `Email ${email} not found.`});
        }

        // @todo
        /*
         if (!user.password) {
      return done(null, false, { msg: 'Your account was registered using a sign-in provider. To enable password login, sign in using a provider, and then set a password under your user profile.' });
    }
         */
        return user.comparePassword(password, (err: Error, isMatch: boolean) => {
            if (err) {
                return done(err);
            }
            if (isMatch) {
                return done(undefined, user);
            }
            return done(undefined, false, {message: "Invalid email or password."});
        });
    });
}));

/**
 * Login Required middleware.
 */
export let isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.redirect(req.app.namedRoutes.build("admin.login"));
};

export default passport;
