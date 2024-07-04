/** BizTime express application. */

const express = require("express");
const app = express();
const companiesRoutes = require("./routes/companies");
const invoiceRoutes = require("./routes/invoices");
const ExpressError = require("./expressError")

// Parse request bodies for JSON
app.use(express.json());

app.use(express.urlencoded({ extended : true }));
app.use("/companies", companiesRoutes);
app.use("/invoices", invoiceRoutes);

/** 404 handler */

app.use(function(req, res, next) {
  const err = new ExpressError("Not Found", 404);
  return next(err);
});

/** general error handler */

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  return res.json({
    error: err,
  });
});


module.exports = app;
