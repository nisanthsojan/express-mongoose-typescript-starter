import nodemailer from "nodemailer";
import { Request, Response } from "express";
import { check, validationResult } from "express-validator/check";
import CONSTANTS from "../config/constants.json";

const transporter = nodemailer.createTransport({
    service: "SendGrid",
    auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD
    }
});

/**
 * GET /contact
 * Contact form page.
 */
export let getContact = (req: Request, res: Response) => {
    res.render("contact", {
        title: "Contact"
    });
};

/**
 * POST /contact
 * Send a contact form via Nodemailer.
 */
export let postContact = [
    check("name")
        .not().isEmpty().withMessage("Name cannot be blank")
        .trim()
        .escape(),
    check("email", "Email is not valid").isEmail().normalizeEmail({
        all_lowercase: false,
        gmail_remove_dots: false
    }),
    check("message")
        .not().isEmpty().withMessage("Message cannot be blank")
        .trim()
        .escape(),
    (req: Request, res: Response) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            req.flash("errors", errors.array());
            return res.status(400).redirect(req.app.namedRoutes.build("contact"));
        }

        const mailOptions = {
            to: CONSTANTS.APP_EMAIL,
            from: `${req.body.name} <${req.body.email}>`,
            subject: "Contact Form",
            text: req.body.message
        };

        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                req.flash("errors", {msg: err.message});
                return res.status(422).redirect(req.app.namedRoutes.build("contact"));
            }
            req.flash("success", {msg: "Email has been sent successfully!"});
            res.redirect(req.app.namedRoutes.build("contact"));
        });
    }
];
