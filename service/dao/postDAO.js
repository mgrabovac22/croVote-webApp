let DB = require("../db/database.js");

class PostDAO {
    constructor() {
        this.db = new DB();
    }
    
    async getPostById(postId) {
    const result = await this.db.executeQuery("SELECT * FROM post WHERE id = ? AND isDeleted IS NULL", [postId]);
    return result[0]; 
    }

    async getPostsPaginated(limit, offset) {
        return await this.db.executeQuery("SELECT * FROM post WHERE isActive = 1 AND isDeleted IS NULL LIMIT ? OFFSET ?", [limit, offset]);
    }
    
    async getPostCount() {
        const result = await this.db.executeQuery("SELECT COUNT(*) as count FROM post WHERE isActive = 1 AND isDeleted IS NULL");
        return result[0].count;
    }
    
    async getAllPostsPaginated(limit, offset) {
        return await this.db.executeQuery("SELECT * FROM post WHERE isDeleted IS NULL LIMIT ? OFFSET ?", [limit, offset]);
    }
    
    async getAllPostCount() {
        const result = await this.db.executeQuery("SELECT COUNT(*) as count FROM post WHERE isDeleted IS NULL");
        return result[0].count;
    }

    async togglePostIsActive(id) {
        const sql = `UPDATE post SET isActive = CASE WHEN isActive = 1 THEN 0 ELSE 1 END WHERE id = ?`;
        return await this.db.executeQuery(sql, [id]);
    }

    async postNewPost(name, description) {
        const sql = `INSERT INTO post (name, description, isActive) VALUES (?, ?, 0);`;
        const result = await this.db.executeQuery(sql, [name, description]);
        return result.insertId;
    }
    async deletePost(time, id) {
        const sql = `UPDATE post SET isDeleted = ? WHERE id = ?;`;
        return await this.db.executeQuery(sql, [time, id]);
    }    
}

module.exports = PostDAO;
