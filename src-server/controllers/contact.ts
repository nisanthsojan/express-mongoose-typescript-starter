import type { Request, Response } from "express";
import { check, validationResult } from "express-validator";
// import { APP_EMAIL, APP_NAME } from "../config/constants";
import sgMail from "@sendgrid/mail";
import { SENDGRID_API_KEY } from "../util/secrets";
import Bluebird from "bluebird";

sgMail.setApiKey(SENDGRID_API_KEY);

/**
 * GET /contact
 * Contact form page.
 */
export const getContact = function (req: Request, res: Response): void {
    return res.render("contact", {
        title: "Contact"
    });
};

/**
 * POST /contact
 * Send a contact form via Nodemailer.
 */
export const postContact = [
    check("name").not().isEmpty().withMessage("Name cannot be blank").trim().escape(),
    check("email", "Email is not valid").isEmail().normalizeEmail({
        "all_lowercase": false,
        "gmail_remove_dots": false
    }),
    check("message").not().isEmpty().withMessage("Message cannot be blank").trim().escape(),
    (req: Request, res: Response): Promise<void> => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return Bluebird.resolve().then(() => res.status(400).redirect(req.app.namedRoutes.build("contact")));
        }

        req.flash("success", { msg: "Email has been sent successfully!" });
        return Bluebird.resolve(res.redirect(req.app.namedRoutes.build("contact")));

        // const mailOptions = {
        //     to: APP_EMAIL,
        //     from: `${req.body.name} <${req.body.email}>`,
        //     subject: `Contact Form from ${APP_NAME}`,
        //     text: req.body.message
        // };
        //
        // return sgMail.send(mailOptions, false).then(
        //     () => {
        //         req.flash("success", { msg: "Email has been sent successfully!" });
        //         return res.redirect(req.app.namedRoutes.build("contact"));
        //     },
        //     (err) => {
        //         req.flash("errors", { msg: err.message });
        //         return res.status(422).redirect(req.app.namedRoutes.build("contact"));
        //     }
        // );
    }
];
