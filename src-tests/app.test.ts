import { default as supertest } from "supertest";
import { describe, it, before, after } from "mocha";
import { ServerApplication } from "../src-server/app";
import { mongooseConnection } from "../src-server/util/mongoose";
import { Express } from "express";

describe("/", function () {
    let expressApp: Express;

    before(function () {
        return mongooseConnection
            .connect()
            .then(() => new ServerApplication().init())
            .then((_app) => {
                expressApp = _app;
                return true;
            });
    });

    after(function () {
        return mongooseConnection.disconnect();
    });

    describe("GET /", function () {
        it("should return 200 OK", function () {
            return supertest(expressApp).get("/").expect(200);
        });
    });

    describe("GET /some-random-string-for-route", function () {
        it("should return 404", function () {
            return supertest(expressApp).get("/some-random-string-for-route").expect(404);
        });
    });
});
