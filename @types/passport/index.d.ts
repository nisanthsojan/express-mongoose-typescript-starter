import type { IUserDocument } from "../../src-server/models/User";

declare global {
    namespace Express {
        interface User extends IUserDocument {}
    }
}
