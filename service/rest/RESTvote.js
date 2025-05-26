const VoteDAO = require("../dao/voteDAO.js");
const bcrypt = require("bcrypt");

class RESTvote {
    constructor() {
        this.voteDAO = new VoteDAO();
    }

    async submitVote(req, res) {
        res.type("application/json");
    
        try {
            const user = req.session.user;
            if (!user?.oib) {
                return res.status(401).json({
                    error: "Unauthorized."
                });
            }
    
            const { choiceId, postId, signature } = req.body;
    
            if (!choiceId || !postId || !signature) {
                return res.status(400).json({
                    error: "Missing data."
                });
            }
    
            const alreadyVoted = await this.voteDAO.userAlreadyVoted(user.oib, postId);
            if (alreadyVoted) {
                return res.status(409).json({
                    error: "Already voted."
                });
            }
    
            const dataToVerify = `${user.oib}:${postId}:${choiceId}`;
            const isValidSignature = await bcrypt.compare(dataToVerify, signature);
    
            if (!isValidSignature) {
                return res.status(403).json({
                    error: "Invalid signature."
                });
            }
    
            await this.voteDAO.insertVote(user.oib, postId, choiceId);
    
            res.status(200).json({
                success: "Vote recorded."
            });
    
        } catch (err) {
            console.error("Error in submitVote:", err);
            res.status(500).json({
                error: "Server error."
            });
        }
    }

    async getVotedPostIds(req, res) {
        res.type("application/json");

        try {
            const user = req.session.user;
            if (!user?.oib) {
                return res.status(401).json({
                    error: "Unauthorized"
                });
            }

            const votedPostIds = await this.voteDAO.getVotedPostIds(user.oib);
            
            res.status(200).json({
                votedPostIds
            });

        } catch (err) {
            console.error("Error fetching voted post IDs:", err);
            res.status(500).json({
                error: "Server error."
            });
        }
    }

    async generateVoteHash(req, res) {
        res.type("application/json");

        try {
            const user = req.session.user;
            if (!user?.oib) {
                return res.status(401).json({
                    error: "Unauthorized."
                });
            }

            const { idVote, choiceId } = req.body;
            if (!idVote) {
                return res.status(400).json({
                    error: "Missing idVote in request body."
                });
            }

            const saltRounds = 10;
            const dataToHash = `${user.oib}:${idVote}:${choiceId}`;
            const hashed = await bcrypt.hash(dataToHash, saltRounds);

            res.status(200).json({
                hash: hashed
            });

        } catch (err) {
            console.error("Error generating vote hash:", err);
            res.status(500).json({
                error: "Server error."
            });
        }
    }

    async hasUserVoted(req, res) {
        res.type("application/json");
    
        try {
            const user = req.session.user;
            if (!user?.oib) {
                return res.status(401).json({
                    error: "Unauthorized."
                });
            }
    
            const { postId } = req.query;
    
            if (!postId) {
                return res.status(400).json({
                    error: "Missing postId."
                });
            }
    
            const alreadyVoted = await this.voteDAO.userAlreadyVoted(user.oib, postId);
    
            res.status(200).json({
                hasVoted: alreadyVoted
            });
    
        } catch (err) {
            console.error("Error checking vote status:", err);
            res.status(500).json({
                error: "Server error."
            });
        }
    }
    
    
}

module.exports = RESTvote;