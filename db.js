const { Pool } = require("pg");
var config = require('./db_config.json');

const pool = new Pool(config);

module.exports = { pool };