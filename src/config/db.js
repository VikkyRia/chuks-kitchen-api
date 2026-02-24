const Database = require("better-sqlite3");
const path = require("path");


const db = new Database(path.join(__dirname, "../../chuks.db"), {
  verbose: console.log,
});

db.pragma("foreign_keys = ON");

console.log("Connected to SQLite database");

module.exports = db;