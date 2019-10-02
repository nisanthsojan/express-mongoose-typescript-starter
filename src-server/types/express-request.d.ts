/// <reference types="express" />
import { IUserModel } from "../models/User";

declare global {
    namespace Express {
        interface User extends IUserModel {
        }
    }
}
