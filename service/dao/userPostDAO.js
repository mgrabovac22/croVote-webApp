let DB = require("../db/database.js");

class UserPostDAO {
    constructor() {
        this.db = new DB();
        this.userPostDAO = new UserPostDAO();

    }

    async insertEncryptedVote(userOib, postId, encryptedChoiceId, ivHex) {
        const query = `
            INSERT INTO user_post (user_oib, post_id, choices_id, voted_time)
            VALUES (?, ?, ?, datetime('now'))
        `;
        return await this.db.executeQuery(query, [userOib, postId, encryptedChoiceId + ":" + ivHex]);
    }

    async hasUserVoted(userOib, postId) {
    const result = await this.db.executeQuery(
        "SELECT COUNT(*) as count FROM user_post WHERE user_oib = ? AND post_id = ?",
        [userOib, postId]
    );
    return result[0].count > 0;
}

}

module.exports = UserPostDAO;
