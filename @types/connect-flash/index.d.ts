// Type definitions for connect-flash
// Project: https://github.com/jaredhanson/connect-flash

/// <reference types="express" />

declare namespace Express {
    export interface Request {
        flash(): { [key: string]: string[] };
        flash(message: any): any;
        flash(event: string, message: any): any;
    }
}

declare module "connect-flash" {
    import express = require("express");
    interface IConnectFlashOptions {
        unsafe?: boolean;
    }
    function e(options?: IConnectFlashOptions): express.RequestHandler;
    export = e;
}
