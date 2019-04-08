import bcrypt from "bcrypt-nodejs";
import mongoose from "mongoose";

export interface UserModel extends mongoose.Document {
    email: string;
    password: string;
    passwordResetToken: string;
    passwordResetExpires: Date;
    profile: {
        name: string;
    };
    comparePassword: comparePasswordFunction;
}

type comparePasswordFunction = (this: UserModel, candidatePassword: string, cb: (err: any, isMatch: any) => {}) => void;

export type AuthToken = {
    accessToken: string,
    kind: string
};

const userSchema = new mongoose.Schema({
    email: {type: String, unique: true},
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    profile: {
        name: String,
    }
}, {timestamps: true});

/**
 * Password hash middleware.
 */
userSchema.pre("save", function save(next) {
    const user = <UserModel>this;
    if (!user.isModified("password")) {
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        // @ts-ignore
        bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});

const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
        cb(err, isMatch);
    });
};

userSchema.methods.comparePassword = comparePassword;

export const User = mongoose.model<UserModel>("User", userSchema);
export default User;
