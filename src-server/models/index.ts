import { IUserDocument, IUserModel, userSchema } from "./User";
import { mongooseConnection } from "../util/mongoose";

export const $User: IUserModel = mongooseConnection.mongoose.model<IUserDocument, IUserModel>("User", userSchema);
