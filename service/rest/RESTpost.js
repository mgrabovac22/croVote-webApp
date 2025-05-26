const PostDAO = require("../dao/postDAO.js");
const { encrypt, decrypt } = require("../modules/crypto");

class RESTpost {

    constructor() {
        this.postDAO = new PostDAO();
    }

    async getPostsPaginated(req, res) {
        res.type("application/json");
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const posts = await this.postDAO.getPostsPaginated(limit, offset);
        const total = await this.postDAO.getPostCount();
        
        const decryptedPosts = posts.map(post => ({
            ...post,
            name: decrypt(post.name),
            description: decrypt(post.description)
        }));
        
        res.status(200).json({
            posts: decryptedPosts,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    }

    async getPostById(req, res) {
        const postId = req.params.postId;
        const post = await this.postDAO.getPostById(postId);
        if (post) {
            post.name = decrypt(post.name);
            post.description = decrypt(post.description);
            res.status(200).json(post);
        } else {
            res.status(404).json({ error: "Post not found" });
        }
    }
    

    async getAllPostsPaginated(req, res) {
        res.type("application/json");
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const posts = await this.postDAO.getAllPostsPaginated(limit, offset);
        const total = await this.postDAO.getAllPostCount();

        const decryptedPosts = posts.map(post => ({
            ...post,
            name: decrypt(post.name),
            description: decrypt(post.description)
        }));
        
        res.status(200).json({
            posts: decryptedPosts,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    }

    async toggleIsActive(req, res) {
        const postId = req.params.postId;
    
        if (!postId || isNaN(postId)) {
            return res.status(400).json({ error: "Invalid post ID" });
        }
    
        await this.postDAO.togglePostIsActive(postId);
        res.status(200).json({ message: "Post activation status toggled successfully." });
    }
    
    async postNewPost(req, res) {
        res.type("application/json");
        
        const { name, description } = req.body;
    
        if (!name || !description) {
            return res.status(400).json({ error: "Missing post name or description" });
        }
    
        const encryptedName = encrypt(name);
        const encryptedDescription = encrypt(description);
    
        const result = await this.postDAO.postNewPost(encryptedName, encryptedDescription);
        res.status(201).json({ message: "Post created successfully", id: result });
    }
    

    async deletePost(req, res) {
        res.type("application/json");
    
        const postId = parseInt(req.params.postId, 10);
    
        if (isNaN(postId)) {
            return res.status(400).json({ error: "Invalid postId" });
        }
    
        const now = new Date();
        const time = now.toISOString().slice(0, 19).replace("T", " ");

    
        const result = await this.postDAO.deletePost(time, postId);
    
        if (result && result.affectedRows > 0) {
            res.status(200).json({ message: "Post successfully marked as deleted." });
        } else {
            res.status(500).json({ error: "Failed to mark post as deleted." });
        }
    }
    
}

module.exports = RESTpost;
