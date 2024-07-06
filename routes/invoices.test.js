// connect to right DB --- set before loading db.js
process.env.NODE_ENV = "test";

// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testInvoice;

beforeEach(async function() {
    let companyResult = await db.query(`
        INSERT INTO companies (code, name, description)
        VALUES ('ibm', 'IBM', 'Big computer card.')
        RETURNING code, name, description`);
    let invoiceResult = await db.query(`
        INSERT INTO invoices (comp_code, amt)
        VALUES ('ibm', 100)
        RETURNING id, comp_code, amt, add_date, paid, paid_date`);
    testCompany = companyResult.rows[0];
    testInvoice = invoiceResult.rows[0];
})

afterEach(async function() {
    // delete any data created by test
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM invoices");
});

afterAll(async function() {
    // close db connection
    await db.end();
})

/** GET /invoices - returns {`invoices: [invoice, ...]}` */

describe("GET /invoices", function() {
    test("Gets a list of 1 invoice", async function() {
        const response = await request(app).get(`/invoices`);
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            invoices: [{id : testInvoice.id,
                amt: testInvoice.amt,
                add_date : testInvoice.add_date.toISOString(),
                paid : testInvoice.paid,
                paid_date : testInvoice.paid_date,
                comp_code : testInvoice.comp_code}]
        });
    });
});

/** GET /invoices/:id - returns {`companies: {company}}` */

describe("GET /invoices/:id", function() {
    test("Gets a single invoice", async function() {
        const response = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            invoice: {
                id : testInvoice.id,
                amt: testInvoice.amt,
                add_date : testInvoice.add_date.toISOString(),
                paid : testInvoice.paid,
                paid_date : testInvoice.paid_date,
                company : testCompany
            }
        });
    });

    test("Responds with 404 if can't find invoice", async function() {
        const response = await request(app).delete(`/invoices/2`);
        expect(response.statusCode).toEqual(404);
    })
});

/** POST /companies - returns {`invoice: {invoice}}` */

describe("POST /invoices", function() {
    test("Creates a single invoice", async function() {
        const response = await request(app)
            .post(`/invoices`)
            .send({
                comp_code: testInvoice.comp_code,
                amt: 200
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            invoice: {
                id : expect.any(Number),
                amt: 200,
                add_date : testInvoice.add_date.toISOString(),
                paid : testInvoice.paid,
                paid_date : testInvoice.paid_date,
                comp_code : testInvoice.comp_code,
            }
        });
    });
});

/** PUT /invoices/:id - updates invoice; return {`invoice : {invoice}}` */

describe("PUT /invoices/:id", function() {
    test("Updates a single company", async function() {
        const response = await request(app)
            .put(`/invoices/${testInvoice.id}`)
            .send({
                amt : 300
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            invoice : {
                id : testInvoice.id,
                amt: 300,
                add_date : testInvoice.add_date.toISOString(),
                paid : testInvoice.paid,
                paid_date : testInvoice.paid_date,
                comp_code : testInvoice.comp_code,
            }
        });
    });
    
    test("Responds with 404 if can't find invoice", async function() {
        const response = await request(app).delete(`/invoices/2`);
        expect(response.statusCode).toEqual(404);
    })
});

/** DELETE /invoices/:id - deletes invoice; return {`status : 'deleted' }` */

describe("DELETE /invoices/:id", function() {
    test("Deletes a single invoice", async function() {
        const response = await request(app)
            .delete(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({ status : "deleted" });
    });
    
    test("Responds with 404 if can't find invoice", async function() {
        const response = await request(app).delete(`/invoices/2`);
        expect(response.statusCode).toEqual(404);
    })
});