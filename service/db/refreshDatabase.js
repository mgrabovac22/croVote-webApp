const { exit } = require("process");
const DB = require("./database");
const fs = require("fs");

fs.readFile("./database.sql", "utf-8", async (err, data) => {
    let db = new DB();

    let statements = data.split(";");

    statements.pop();

    for (const statement of statements) {
        await db.executeQuery(statement, []);
    }

    console.log("Database has been freshed.");
    exit();
});
