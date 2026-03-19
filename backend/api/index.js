/**
 * Vercel Serverless entrypoint for FuelNow backend.
 *
 * Notes:
 * - Vercel Serverless Functions must NOT call server.listen().
 * - Socket.io (websockets) is not supported in this mode; REST APIs only.
 */

const { app } = require('../server');

module.exports = app;

