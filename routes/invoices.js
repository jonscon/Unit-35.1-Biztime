const express = require("express");
const ExpressError = require("../expressError");
const db = require("../db");

const router = new express.Router();

router.get('/', async function(req, res, next) {
    try {
        const results = await db.query(
            `SELECT * FROM invoices`);
        return res.status(201).json({ invoices : results.rows });
    } catch(err) {
        return next(err);
    }
})

router.get('/:id', async function(req, res, next) {
    try {
        // Get id from URL params
        const id = req.params.id;

        // Run query to find invoices with specified id
        const results = await db.query(
            `SELECT i.id,
                    i.comp_code,
                    i.amt,
                    i.paid,
                    i.add_date,
                    i.paid_date,
                    c.name,
                    c.description
            FROM invoices AS i
                INNER JOIN companies AS c ON (i.comp_code = c.code)
            WHERE id=$1`, [id]);
        
        // Return 404 error if no companies found
        if (results.rows.length === 0) {
            throw new ExpressError(`No invoices found under ${id}`, 404);
        }

        const data = results.rows[0];
        const invoice = {
            id : data.id,
            amt : data.amt,
            paid : data.paid,
            add_date : data.add_date,
            paid_date : data.paid_date,
            company: {
                code : data.comp_code,
                name : data.name,
                description : data.description,
            },
        }
        return res.status(201).json({ "invoice" : invoice });
    } catch(err) {
        return next(err);
    }
})

router.post('/', async function(req, res, next) {
    try {
        // Get invoice information from req.body
        const { comp_code, amt } = req.body;

        // Run query to insert new invoice
        const results = await db.query(
            `INSERT INTO invoices (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt]
        );

        return res.status(201).json({ invoice : results.rows[0] });
    } catch(err) {
        return next(err);
    }
})

router.put('/:id', async function(req, res, next) {
    try {
        // Get new invoice amount from req.body
        const { amt } = req.body;

        // Run query to update company information
        const results = await db.query(
            `UPDATE invoices SET amt=$1
            WHERE id=$2
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, req.params.id]
        );

        // Return 404 error if company code cannot be found
        if (results.rows.length === 0) {
            throw new ExpressError(`No invoices found under ${req.params.id}.`, 404);
        }
        return res.status(201).json({ invoice : results.rows[0] });
    } catch(err) {
        return next(err);
    }
})

router.delete('/:id', async function(req, res, next) {
    try {
        // Run query to delete invoice
        const results = await db.query(
            "DELETE FROM invoices WHERE id=$1 RETURNING id", [req.params.id]
        )

        // Return 404 error if id  cannot be found
        if (results.rows.length === 0) {
            throw new ExpressError(`No invoices found under ${req.params.id}.`, 404);
        }
        return res.json({ status : "deleted" })
    } catch(err) {
        return next(err);
    }
})

module.exports = router;

