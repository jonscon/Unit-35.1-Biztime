// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function() {
    let result = await db.query(`
        INSERT INTO companies (code, name, description)
        VALUES ('abc', 'Google', 'Search engine.')
        RETURNING code, name, description`);
    testCompany = result.rows[0];
})

afterEach(async function() {
    // delete any data created by test
    await db.query("DELETE FROM companies");
});

afterAll(async function() {
    // close db connection
    await db.end();
})

/** GET /companies - returns {`companies: [company, ...]}` */

describe("GET /companies", function() {
    test("Gets a list of 1 company", async function() {
        const response = await request(app).get(`/companies`);
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            companies: [testCompany]
        });
    });
});

/** GET /companies/:code - returns {`companies: {company}}` */

describe("GET /companies/:code", function() {
    test("Gets a single company", async function() {
        testCompany.invoices = [];
        const response = await request(app).get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: testCompany
        });
    });

    test("Responds with 404 if can't find company", async function() {
        const response = await request(app).get(`/companies/nike`);
        expect(response.statusCode).toEqual(404);
    })
});

/** POST /companies - returns {`company : {company}}` */

describe("POST /companies", function() {
    test("Creates a single company", async function() {
        const response = await request(app)
            .post(`/companies`)
            .send({
                code: "apple",
                name: "Apple",
                description: "The maker of OSX."
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: {
                code: "apple",
                name: "Apple",
                description: "The maker of OSX."
            }
        });
    });
});

/** PUT /companies/:code - updates company; return {`company : {company}}` */

describe("PUT /companies/:code", function() {
    test("Updates a single company", async function() {
        const response = await request(app)
            .put(`/companies/${testCompany.code}`)
            .send({
                name: "Google Inc.",
                description: "The leading search engine."
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: {
                code: "abc",
                name: "Google Inc.",
                description: "The leading search engine."
            }
        });
    });
    
    test("Responds with 404 if can't find company", async function() {
        const response = await request(app).put(`/companies/nike`);
        expect(response.statusCode).toEqual(404);
    })
});

/** DELETE /companies/:code - deletes company; return {`status : 'deleted'}` */

describe("DELETE /companies/:code", function() {
    test("Deletes a single company", async function() {
        const response = await request(app)
            .delete(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({ status : "deleted" });
    });
    
    test("Responds with 404 if can't find company", async function() {
        const response = await request(app).delete(`/companies/nike`);
        expect(response.statusCode).toEqual(404);
    })
});