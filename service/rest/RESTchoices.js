const ChoicesDAO = require("../dao/choicesDAO.js");
const { encrypt, decrypt } = require("../modules/crypto");

class RESTchoices {

    constructor() {
        this.choicesDAO = new ChoicesDAO();
    }

    async getChoicesByPost(req, res) {
        const postId = req.query.postId; 
        const choices = await this.choicesDAO.getChoicesByPost(postId);
    
        const decryptedChoices = choices.map(choice => ({
            ...choice,
            name: decrypt(choice.name)
        }));
    
        res.status(200).json({ choices: decryptedChoices });
    }
    
    
    async postNewChoice(req, res) {
        const { name, post_id } = req.body;

        if (!name || post_id === undefined || post_id === null) {
            return res.status(400).json({ error: "Missing choice name or post ID" });
        }
        
        const encryptedName = encrypt(name);

        const result = await this.choicesDAO.postNewChoice(encryptedName, post_id);
        res.status(201).json({ message: "Choice created successfully", result });
    }

    async getVoteStats(req, res) {
        const postId = parseInt(req.query.postId, 10);
    
        if (isNaN(postId)) {
            return res.status(400).json({ error: "Invalid postId" });
        }
        
        const result = await this.choicesDAO.getVoteStats(postId);
    
        const decryptedStats = result.map(stat => ({
            ...stat,
            choiceName: decrypt(stat.choiceName)
        }));
    
        res.status(200).json({ stats: decryptedStats });
    }
    
}

module.exports = RESTchoices;
