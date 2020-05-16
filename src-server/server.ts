import errorHandler from "errorhandler";
import { mongooseConnection } from "./util/mongoose";
import { ServerApplication } from "./app";
import { IS_PROD } from "./util/secrets";
import { NextFunction, Request, Response } from "express";

mongooseConnection
    .connect()
    .then(() => new ServerApplication().init())
    .then((expressApp) => {
        if (!IS_PROD) {
            /**
             * Error Handler. Provides full stack - remove for production
             */
            expressApp.use(errorHandler());
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            expressApp.use((err: Error, req: Request, res: Response, next: NextFunction) => {
                console.error("Error", err);
                res.status(500);
                res.render("error", {
                    title: "Error",
                    error: err
                });
            });
        }
        /**
         * Start Express server.
         */
        expressApp.listen(expressApp.get("port"), () => {
            console.log(
                "  App is running at http://localhost:%d in %s mode",
                expressApp.get("port"),
                expressApp.get("env")
            );
            console.log("  Press CTRL-C to stop\n");
        });
    })
    .catch((error) => {
        console.error("Error", error);
        process.exit();
    });
