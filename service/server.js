const express = require("express");
const session=require('express-session');
const morgan = require('morgan');
const helmet = require('helmet');
const https = require('https');
const http = require('http');
const logger = require('../log/logger.js');
const { createToken, checkToken } = require("./modules/jwtModul.js");
const { isAdmin } = require("./modules/auth.guard.js");
const fs = require('fs');
const path = require("path");
const cors = require("cors");
const RESTuser = require("./rest/RESTuser.js");
const RESTpost = require("./rest/RESTpost.js");
const RESTnavigation = require("./rest/RESTnavigation.js");
const RESTchoices = require("./rest/RESTchoices.js");
const RESTvote = require("./rest/RESTvote.js");
require('dotenv').config();

const server = express();
const port = process.env.PORT;
const startUrl = "https://localhost:";

const privateKey = fs.readFileSync(path.join(__dirname, '../certificates/private.key'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, '../certificates/certificate.crt'), 'utf8');
const ca = fs.readFileSync(path.join(__dirname, '../certificates/ca.key'), 'utf8');

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

try{
    server.use(cors({
        origin: 'https://localhost',
        methods: ['GET', 'POST', 'PUT']
    }));
    
    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));
    server.use(helmet.noSniff());

    server.use(helmet.hsts({
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true
    }));

    server.use(helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
        
            scriptSrc: [
            "'self'",
            "https://cdn.jsdelivr.net",
            "https://www.google.com",
            "https://www.gstatic.com"
            ],
        
            styleSrc: [
            "'self'",
            "https://fonts.googleapis.com",
            "'unsafe-inline'"
            ],
        
            fontSrc: [
            "'self'",
            "https://fonts.gstatic.com"
            ],
        
            imgSrc: [
            "'self'",
            "data:"
            ],
        
            connectSrc: [
            "'self'",
            "https://www.google.com",
            "https://www.gstatic.com"
            ],
        
            frameSrc: [
            "'self'",
            "https://www.google.com",
            "https://www.gstatic.com"
            ],
        
            objectSrc: ["'none'"],
        
            upgradeInsecureRequests: [],
        }
    }));
           
    
    server.use((req, res, next) => {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        next();
    });

    const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs', '../../log/logs/all-logging.log'), { flags: 'a' });
    server.use(morgan('combined', { stream: accessLogStream }));

    server.set('trust proxy', true);

    
    server.use(session(
    { 
        name:'SessionCookie',
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: { secure: true, expires: new Date(Date.now() + 3600000), sameSite: 'Strict' }
    }));
    
    const restUser = new RESTuser();
    const restNavigation = new RESTnavigation();
    server.use("/css", express.static(path.join(__dirname, "../application/css")));
    server.use("/js", express.static(path.join(__dirname, "../application/js")));
    server.use("/images", express.static(path.join(__dirname, "../application/resources/images")));
    server.use("/icons", express.static(path.join(__dirname, "../application/resources/icons")));
    server.disable("x-powered-by");
    
    server.use((req, res, next) => {
        if (req.protocol === 'http') {
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        if (!req.session.loginAttempts) {
            req.session.loginAttempts = { count: 0, lastAttempt: null };
        }
        next();
    });
    
    server.get("/login", (req, res) => {
        res.sendFile(path.join(__dirname, "../application/html/login.html"));        
    });
    
    server.get("/register", (req, res) => {
        res.sendFile(path.join(__dirname, "../application/html/register.html"));
    });
    
    server.post("/api/register", restUser.postUser.bind(restUser));
    server.post("/api/check-existing-oib", restUser.oibExists.bind(restUser));
    server.post("/api/login", restUser.login.bind(restUser));
    server.post("/api/verify-totp", restUser.verifyTotp.bind(restUser));
    server.post("/api/changing-password", restUser.changePassword.bind(restUser));
    server.get("/api/login-tries", restUser.getTryCount.bind(restUser));
    server.get("/api/navigation", restNavigation.getNavigaciju.bind(restNavigation));
    
    server.get("/change-password", (req, res) => {
        res.sendFile(path.join(__dirname, "../application/html/changePassword.html"));
    })
    
    server.get("/about-us", (req, res) => {
        res.sendFile(path.join(__dirname, "../application/html/aboutUs.html"));
    })
    
    server.get("/privacy-policy", (req, res) => {
        res.sendFile(path.join(__dirname, "../application/html/privacyPolicy.html"));
    })
    
    server.all(/(.*)/, (req, res, next) => {
        if (req.session.user == null) {
            return res.redirect("/login");
        } else {
            next();
        }
    });
    
    server.get("/api/getJWT", (req, res) => {
        
        if(req.session.user!=null){
            const korisnik = { oib: req.session.user.oib };
            const token = createToken({ korisnik }, process.env.JWT_SECRET);
            res.status(200).json({ token: `Bearer ${token}` });
        }
        else{
            res.status(401).json({Error: "Session not created"});
        }
    });
    
    server.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "../application/html/index.html"));
    })
    
    server.get("/viewVotes",isAdmin ,(req, res) => {
        res.sendFile(path.join(__dirname, "../application/html/viewVotes.html"));
    })
    
    server.get("/voting", (req, res) => {
        res.sendFile(path.join(__dirname, "../application/html/voting.html"));
    })
    
    server.get("/profile", (req, res) => {
        res.sendFile(path.join(__dirname, "../application/html/profile.html"));
    })
    
    server.get("/manage-voting",isAdmin ,(req, res) => {
        res.sendFile(path.join(__dirname, "../application/html/manageVotings.html"));
    })
    
    server.get("/api/logout", (req, res) => {
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error("Error deleting session:", err);
                    res.status(500).json({ Error: "Invalid logout." });
                } else {
                    console.log("Session destroyed!");
                    res.clearCookie("connect.sid"); 
                    res.redirect("/login"); 
                }
            });
        } else {
            res.redirect("/login"); 
        }
    });
    
    server.all(/(.*)/, (req, res, next) => {
        try {    
            const tokenValid = checkToken(req, process.env.JWT_SECRET);
            
            if (!tokenValid) {
                res.status(406).json({ Error: "Invalid token!" }); 
                return;
            }
            
            const { method, originalUrl, ip } = req;
            const timestamp = new Date().toISOString();
            const user = req.session.user || {};
            const { oib = 'N/A', email = 'N/A', type = 'N/A' } = user;
            
            logger.info(`JWT valid | Time: ${timestamp} | Method: ${method} | Path: ${originalUrl} | OIB: ${oib} | Email: ${email} | Role: ${type} | IP: ${ip}`);
            
            next(); 
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(422).json({ Error: "Token expired." });
            }
            console.error("Unhandled error:", err);
            return res.status(500).json({ Error: "Internal server error." });
        }
    });
    
    server.get("/api/current-user", restUser.getCurrentUser.bind(restUser));
    
    server.get("/api/user/totp/enabled/:oib", restUser.getTotpStatus.bind(restUser));
    server.post("/api/user/totp/enable/:oib", restUser.enableTotp.bind(restUser));
    server.post("/api/user/totp/disable/:oib", restUser.disableTotp.bind(restUser));
    server.get("/api/user/role", restUser.getUserRole.bind(restUser));
    
    const restPost = new RESTpost();
    server.get("/api/posts", restPost.getPostsPaginated.bind(restPost));
    server.get("/api/posts/:postId", restPost.getPostById.bind(restPost));
    server.post("/api/posts/new-post",isAdmin ,restPost.postNewPost.bind(restPost));
    server.put("/api/posts-admin/:postId",isAdmin ,restPost.deletePost.bind(restPost));
    server.get("/api/posts-admin",isAdmin ,restPost.getAllPostsPaginated.bind(restPost));
    server.post("/api/posts/toggle:postId",isAdmin ,restPost.toggleIsActive.bind(restPost));
    
    const restChoice = new RESTchoices();
    server.post("/api/posts/new-choice",isAdmin ,restChoice.postNewChoice.bind(restChoice));
    server.get("/api/stats", isAdmin, restChoice.getVoteStats.bind(restChoice));
    server.get("/api/choices", restChoice.getChoicesByPost.bind(restChoice));

    https.createServer(credentials, server).listen(port, () => {
        logger.info('Server started at:' + startUrl + port);
        console.log("Server started at: " + startUrl + port);
    });

    http.createServer((req, res) => {
        const host = req.headers.host.replace(/:\d+$/, `:${port}`);
        res.writeHead(301, { "Location": `https://${host}${req.url}` });        
        res.end();
    }).listen(8080, () => {
        logger.info('HTTP preusmjerivač pokrenut na portu 8080');
    });
    const restVote = new RESTvote();
    server.post("/api/submit-vote", restVote.submitVote.bind(restVote));
    server.get("/api/user/voted-posts", restVote.getVotedPostIds.bind(restVote));
    server.post("/api/vote/hash", restVote.generateVoteHash.bind(restVote));
    server.get("/has-voted", restVote.hasUserVoted.bind(restVote));


}
catch(err){
    console.log(err);
}