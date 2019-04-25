import errorHandler from "errorhandler";
import { dbConnection } from "./util/mongoose";
import { default as app } from "./app";
import { IS_PROD } from "./util/secrets";


dbConnection((error: any) => {
  if (error) {
    console.error("Error", error);
    process.exit();
  }

  if (!IS_PROD) {
    /**
     * Error Handler. Provides full stack - remove for production
     */
    app.use(errorHandler());
  } else {
    app.use((err, req, res, next) => {
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
  app.listen(app.get("port"), () => {
    console.log(
        "  App is running at http://localhost:%d in %s mode",
        app.get("port"),
        app.get("env")
    );
    console.log("  Press CTRL-C to stop\n");
  });
});
