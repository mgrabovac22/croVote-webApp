const mysql2 = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../application/resources/.env') });

class DB {
    constructor() {
        this.pool = mysql2.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        }).promise();
    }

    async executeQuery(sql, data) {
        try {
            const [rows] = await this.pool.query(sql, data);
            return rows;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = DB;
