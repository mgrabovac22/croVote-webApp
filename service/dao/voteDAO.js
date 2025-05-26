let DB = require("../db/database.js");

class VoteDAO {
    constructor() {
        this.db = new DB();
    }

    async userAlreadyVoted(oib, postId) {
        const result = await this.db.executeQuery(
            "SELECT COUNT(*) as count FROM user_post WHERE user_oib = ? AND post_id = ?",
            [oib, postId]
        );
        return result[0].count > 0;
    }

    async getVotedPostIds(oib){
        const result = await this.db.executeQuery(
            "SELECT post_id FROM user_post WHERE user_oib = ?",
            [oib]
        );

        return result.map(row => row.post_id);
    }

   async insertVote(oib, postId, choiceId) {
        return await this.db.executeQuery(
            "INSERT INTO user_post (user_oib, post_id, choices_id, voted_time) VALUES (?, ?, ?, NOW())",
            [oib, postId, choiceId]
        );
    }

}

module.exports = VoteDAO;
