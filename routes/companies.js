const express = require("express");
const slugify = require("slugify");
const ExpressError = require("../expressError");
const db = require("../db");

const router = new express.Router();

router.get('/', async function(req, res, next) {
    try {
        const results = await db.query(
            `SELECT * FROM companies`);
        return res.status(201).json({ companies : results.rows });
    } catch(err) {
        return next(err);
    }
})

router.get('/:code', async function(req, res, next) {
    try {
        // Get code from URL params
        const code = req.params.code;

        // Run query to find companies with specified code
        const companyResults = await db.query(
            `SELECT * FROM companies
            WHERE code=$1`, [code]);
        // Run query to find invoices with specified code
        const invoiceResults = await db.query(
            `SELECT * FROM invoices
            where comp_code=$1`, [code]);

        // Return 404 error if no companies found
        if (companyResults.rows.length === 0) {
            throw new ExpressError(`No companies found under ${code}`, 404);
        }
        const company = companyResults.rows[0];
        const invoices = invoiceResults.rows;

        company.invoices = invoices.map(invoice => invoice.id);

        return res.status(201).json({ "company" : company });
    } catch(err) {
        return next(err);
    }
})

router.post('/', async function(req, res, next) {
    try {
        // Get company information from req.body
        const { code, name, description } = req.body;

        // Run query to insert new company
        const results = await db.query(
            `INSERT INTO companies (code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`, [slugify(code), name, description]
        );

        return res.status(201).json({ company: results.rows[0] });
    } catch(err) {
        return next(err);
    }
})

router.put('/:code', async function(req, res, next) {
    try {
        // Get new company information from req.body
        const { name, description } = req.body;

        // Run query to update company information
        const results = await db.query(
            `UPDATE companies SET name=$1, description=$2
            WHERE code=$3
            RETURNING code, name, description`, [name, description, req.params.code]
        );

        // Return 404 error if company code cannot be found
        if (results.rows.length === 0) {
            throw new ExpressError(`No companies found under ${req.params.code}.`, 404);
        }
        return res.status(201).json({ company : results.rows[0] });
    } catch(err) {
        return next(err);
    }
})

router.delete('/:code', async function(req, res, next) {
    try {
        // Run query to delete company
        const results = await db.query(
            "DELETE FROM companies WHERE code=$1 RETURNING code", [req.params.code]
        )

        // Return 404 error if company code cannot be found
        if (results.rows.length === 0) {
            throw new ExpressError(`No companies found under ${req.params.code}.`, 404);
        }
        return res.status(201).json({ status : "deleted" })
    } catch(err) {
        return next(err);
    }
})

module.exports = router;