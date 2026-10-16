const express = require('express');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

app.use(express.json());

// Pendaftaran seluruh rute API (akan dapat prefix /api)
app.use('/api', routes);

// Global Error Handler (selalu di paling bawah setelah routes)
app.use(errorHandler);

module.exports = app;