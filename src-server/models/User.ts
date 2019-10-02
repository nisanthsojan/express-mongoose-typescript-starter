import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { ChildLogger } from "../util/logger";

const logger = ChildLogger(__filename);
const SALT_ROUND = 10;

export interface IUserModel extends mongoose.Document {
    id: mongoose.Schema.Types.ObjectId;
    email: string;
    password: string;
    passwordResetToken: string | undefined;
    passwordResetExpires: Date | undefined;
    emailVerificationToken: string | undefined;
    emailVerified: boolean;
    profile: {
        name: string;
        gender: string;
    };
    comparePassword: comparePasswordFunction;
}

type comparePasswordFunction = (this: IUserModel, candidatePassword: string, cb: (err: any, isMatch: any) => {}) => void;

export type AuthToken = {
    accessToken: string,
    kind: string
};

const userSchema = new mongoose.Schema({
    email: {type: String, unique: true},
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerified: Boolean,
    profile: {
        name: String,
        gender: String,
    }
}, {timestamps: true});

/**
 * Password hash middleware.
 */
userSchema.pre("save", function save(next) {
    const user = <IUserModel>this;
    if (!user.isModified("password")) {
        return next();
    }

    return bcrypt.genSalt(SALT_ROUND, (err, salt) => {
        if (err) {
            logger.error(err);
            return next(err);
        }

        return bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) {
                logger.error(err);
                return next(err);
            }
            user.password = hash;
            return next();
        });
    });
});

const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
    return bcrypt.compare(candidatePassword, this.password, (err, isMatch: boolean) => {
        return cb(err, isMatch);
    });
};

userSchema.methods.comparePassword = comparePassword;

export const User = mongoose.model<IUserModel>("User", userSchema);
export default User;
