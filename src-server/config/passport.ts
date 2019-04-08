import passport from "passport";
import request from "request";
import passportLocal from "passport-local";
import _ from "lodash";

import { default as User, UserModel } from "../models/User";
import { Request, Response, NextFunction } from "express";
import sanitize from "mongo-sanitize";

const LocalStrategy = passportLocal.Strategy;

passport.serializeUser<any, any>((user, done) => {
    done(undefined, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, <UserModel>user);
    });
});


/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({usernameField: "email"}, (email, password, done) => {
    User.findOne({email: sanitize(email)}, (err, user: any) => {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(undefined, false, {message: `Email ${email} not found.`});
        }
        user.comparePassword(password, (err: Error, isMatch: boolean) => {
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
    res.redirect(req.app.namedRoutes.build("admin.login"));
};

export default passport;
