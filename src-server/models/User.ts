import { compare, genSalt, hash } from "bcrypt";
import { Model, Schema, Types, Document, HookNextFunction } from "mongoose";
import { ChildLogger } from "../util/logger";

const logger = ChildLogger(__filename);
const SALT_ROUND = 13;

export type IUser = {
    _id: Types.ObjectId;
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
};

export type IUserDocument = Document &
    IUser & {
        id: Types.ObjectId;
        comparePassword: (
            this: IUser,
            candidatePassword: string,
            cb: (err: Error | undefined, isMatch: boolean) => void
        ) => void;
    };

export type IUserModel = Model<IUserDocument>;

export const userSchema = new Schema(
    {
        email: { type: Schema.Types.String, unique: true },
        password: Schema.Types.String,
        passwordResetToken: Schema.Types.String,
        passwordResetExpires: Schema.Types.Date,
        emailVerificationToken: Schema.Types.String,
        emailVerified: Schema.Types.Boolean,
        profile: {
            name: Schema.Types.String,
            gender: Schema.Types.String
        }
    },
    { timestamps: true }
);

/**
 * Indexes
 */
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ passwordResetToken: 1 }, { unique: false, background: true });
userSchema.index({ emailVerificationToken: 1 }, { unique: false, background: true });
userSchema.index({ createdAt: 1 }, { unique: false, background: true });

/**
 * Password hash pre save middleware.
 */
userSchema.pre("save", function (this: IUserDocument, next: HookNextFunction) {
    if (this.isModified("email")) {
        this.email = this.email.toLowerCase();
    }
    if (!this.isModified("password")) {
        return next();
    }

    return genSalt(SALT_ROUND, (err, salt) => {
        if (err) {
            logger.log({
                level: "error",
                message: err.toString(),
                FN: "Password hash pre save genSalt"
            });
            return next(err);
        }

        return hash(this.password, salt, (err, hash) => {
            if (err) {
                logger.log({
                    level: "error",
                    message: err.toString(),
                    FN: "Password hash pre save hash"
                });
                return next(err);
            }
            this.password = hash;
            return next();
        });
    });
});

const comparePassword: IUserDocument["comparePassword"] = function (candidatePassword, cb) {
    return compare(candidatePassword, this.password, (err, isMatch) => {
        if (err) {
            logger.log({
                level: "error",
                message: err.toString(),
                FN: "comparePassword"
            });
            return cb(err, false);
        }
        return cb(undefined, isMatch);
    });
};
userSchema.methods.comparePassword = comparePassword;
