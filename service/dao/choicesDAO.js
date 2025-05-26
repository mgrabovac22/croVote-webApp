let DB = require("../db/database.js");

class ChoicesDAO {
    constructor() {
        this.db = new DB();
    }

    async getChoicesByPost(postId) {
        return await this.db.executeQuery(` SELECT c.* FROM choices c JOIN post p ON c.post_id = p.id WHERE c.post_id = ? AND p.isDeleted IS NULL`, [postId]);
    }
    
    async postNewChoice(name, post_id) {
        const sql = `INSERT INTO choices (name, post_id) VALUES (?, ?);`;
        return await this.db.executeQuery(sql, [name, post_id]);
    }

    async getVoteStats(id) {
        const sql = `SELECT 
                    c.name AS choiceName, 
                    COUNT(up.choices_id) AS voteCount,
                    (SELECT COUNT(*) FROM user_post WHERE post_id = ?) AS totalVotes
                    FROM 
                        choices c
                    LEFT JOIN 
                        user_post up ON c.id = up.choices_id
                    WHERE 
                        c.post_id = ?
                    GROUP BY 
                        c.id;
                    `;
        return await this.db.executeQuery(sql, [id, id]);
    }
}

module.exports = ChoicesDAO;
