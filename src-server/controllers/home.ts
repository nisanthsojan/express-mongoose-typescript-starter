import type { Request, Response } from "express";

/**
 * GET /
 * Home page.
 */
export const index = function (req: Request, res: Response): void {
    res.render("home", {
        title: "Home"
    });
};
