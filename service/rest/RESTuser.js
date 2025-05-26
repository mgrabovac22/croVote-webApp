const UserDAO = require("../dao/userDAO.js");
const { transporter } = require("../modules/nodemailer.js");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

class RESTuser {  

  constructor() {
    this.userDAO = new UserDAO();
    this.transporter = transporter;
    this.MAX_ATTEMPTS = 3;
    this.LOCK_TIME_MS = 30 * 60 * 1000;
  }

  async postUser(req, res) {
    res.type("application/json");
    
    const { oib, name, surname, address, phone, email, password, recaptchaToken} = req.body;
    const id_user_type = 2;
    const TOTP_enabled = 0;
    const TOTP_secret_key = "Not generated!";

    const isCaptchaValid = await this.verifyRecaptcha(recaptchaToken);
    if (!isCaptchaValid) {
      return res.status(400).json({ error: 'Bad recaptcha response!' });
    }

    if (!oib || !name || !surname || !address || !phone || !email || !password) {
        res.status(400).json({ error: "Required data missing!" });
        return;
    }

    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let user = {
        oib,
        name,
        surname,
        address,
        phone,
        email,
        password: hashedPassword,
        id_user_type,
        TOTP_enabled,
        TOTP_secret_key
    }

    const response = await this.userDAO.add(user);
    
    if (response) {
      res.status(201).json({ Success: "User added" });
    } else {
      res.status(400).json({ Error: "Adding cought an error." });
    }
  }

  async oibExists(req, res) {
    res.type("application/json");

    const { oib } = req.body || {};

    if (!oib) {
        res.status(400).json({ error: "Required data missing!" });
        return;
    }

    try {
        const result = await this.userDAO.oibExists(oib);        

        if (result && result.length > 0) {
            res.status(400).json({ error: "Existing oib!" });
        } else {
            res.status(200).json({ success: "OIB not found." });
        }
    } catch (error) {
        console.error("Error in oibExists:", error);
        res.status(500).json({ error: "Internal server error" });
    }
  }

  async getCurrentUser(req, res) {
    res.type("application/json");

    try {
      
        const result = await this.userDAO.getUser(req.session.user.oib);     
        const resultType = await this.userDAO.getNameUserType(req.session.user.oib);

        if (result && resultType) {
          const response = {
            oib: result[0].oib,
            email: result[0].email,
            name: result[0].name,
            surname: result[0].surname,
            type: resultType[0].name
          }

          res.status(201).json(response);
        } else {
          res.status(400).json({ Error: "Error getting current user!" });
        }
    } catch (error) {
        console.error("Error in oibExists:", error);
        res.status(500).json({ error: "Internal server error" });
    }
  }
async getUserRole(req, res) {
        const userRole = req.session.user ? req.session.user.type : "guest"; 
        res.status(200).json(userRole);
}

  async getTotpStatus(req, res) {
    res.type("application/json");

    const oib = req.params.oib;
    try {
      const result = await this.userDAO.totpEnabled(oib);
      res.status(200).json({ TOTP_enabled: result[0].TOTP_enabled });
    } catch (err) {
      console.error("Error getting TOTP status:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async enableTotp(req, res) {
    res.type("application/json");

    const oib = req.params.oib;
    try {
      const secretResult = await this.userDAO.getTotpSecretKey(oib);
      let secret = secretResult[0].TOTP_secret_key;

      if (secret === "Not generated!") {
        const newSecret = speakeasy.generateSecret({ length: 20 });
        secret = newSecret.base32;
        await this.userDAO.setSecretKey(oib, secret);
      }

      await this.userDAO.setTotp(oib, 1);

      const otpauth_url = speakeasy.otpauthURL({
        secret: secret,
        label: `CroVote:${oib}`,
        issuer: "CroVote",
        encoding: "base32"
      });

      qrcode.toDataURL(otpauth_url, (err, data_url) => {
        if (err) {
          console.error("QR code generation error:", err);
          res.status(500).json({ error: "QR code generation failed" });
        } else {
          res.status(200).json({ secret, qrCode: data_url });
        }
      });

    } catch (err) {
      console.error("Error enabling TOTP:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async disableTotp(req, res) {
    res.type("application/json");

    const oib = req.params.oib;

    try {
      await this.userDAO.setTotp(oib, 0);
      res.status(200).json({ success: "TOTP disabled." });
    } catch (err) {
      console.error("Error disabling TOTP:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async changePassword(req, res) {
    res.type("application/json");
  
    const { oib, email, password, oldPassword } = req.body;
  
    if (!oib || !email || !password || !oldPassword) {
      res.status(400).json({ error: "Required data missing!" });
      return;
    }
  
    try {
      const user = await this.userDAO.getUserByEmail(oib, email);
      if (!user?.[0]?.password) {
        res.status(404).json({ error: "User not found." });
        return;
      }
  
      const isMatch = await bcrypt.compare(oldPassword, user[0]?.password);
      if (!isMatch) {
        res.status(401).json({ error: "Incorrect old password." });
        return;
      }
  
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);      
  
      await this.userDAO.changePassword(oib, hashedPassword, email);

      const mailOptions = {
        from: 'crovote@gmail.com',
        to: user[0]?.email,
        subject: 'Promjena lozinke',
        text: `Poštovani ${user[0]?.name} ${user[0]?.surname},\n\nVaša lozinka je uspješno promijenjena.\n\nAko niste vi inicirali ovu promjenu, molimo vas da nas odmah kontaktirate na mail: info@crovote.hr.\nLijep pozdrav\nCro vote tim`
      };
      
      this.transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.error('Greška pri slanju e-maila:', error);
        }
      });      
  
      res.status(200).json({ success: "Password changed." });
    } catch (err) {
      console.error("Error changing password: ", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async login(req, res) {
    res.type("application/json");
    const { oib, password, recaptchaToken } = req.body;
    const now = Date.now();
    const la = req.session.loginAttempts || { count: 0, lastAttempt: null };

    if (la.count >= this.MAX_ATTEMPTS) {
      const unlockAt = new Date(la.lastAttempt).getTime() + this.LOCK_TIME_MS;
      if (now < unlockAt) {
        const retryAfter = Math.ceil((unlockAt - now) / 1000);
        return res.status(429).json({
          error: "Too many attempts, try again later",
          attemptsLeft: 0,
          retryAfter
        });
      } else {
        la.count = 0;
        la.lastAttempt = null;
      }
    }

    if (!oib || !password) {
      return res.status(400).json({ error: "Required data missing!" });
    }

    const isCaptchaValid = await this.verifyRecaptcha(recaptchaToken);
    if (!isCaptchaValid) {
      return res.status(400).json({ error: "Bad recaptcha response!" });
    }

    try {
      const user = await this.userDAO.login(oib, password);
      if (!user) {
        la.count++;
        la.lastAttempt = new Date().toISOString();
        req.session.loginAttempts = la;

        return res.status(401).json({
          error: "Invalid OIB or password!",
          attemptsLeft: Math.max(0, this.MAX_ATTEMPTS - la.count),
          retryAfter: la.count >= this.MAX_ATTEMPTS
            ? Math.ceil(this.LOCK_TIME_MS / 1000)
            : 0
        });
      }

      req.session.loginAttempts = { count: 0, lastAttempt: null };

      const type = await this.userDAO.getNameUserType(oib);
      if (user.TOTP_enabled) {
        return res.status(200).json({ requiresTOTP: true });
      } else {
        req.session.user = {
          oib: user.oib,
          type: type[0]?.name || "Unknown",
          email: user.email
        };
        return res.status(200).json({ success: "Login successful!" });
      }
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async verifyTotp(req, res) {
    res.type("application/json");
  
    const { oib, token } = req.body;
  
    if (!oib || !token) {
      res.status(400).json({ error: "Require data is missing!" });
      return;
    }
  
    try {
      const user = await this.userDAO.getUser(oib);
      const type = await this.userDAO.getNameUserType(oib);
      const secretResult = await this.userDAO.getTotpSecretKey(oib);
      const secret = secretResult[0].TOTP_secret_key;
  
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: "base32",
        token: token,
        window: 1
      });
  
      if (verified) {
        req.session.user = {
          oib: user[0]?.oib,
          type: type[0]?.name || "Unknown",
          email: user[0]?.email
        };
        res.status(200).json({ success: "TOTP code is valid." });
      } else {
        res.status(400).json({ error: "TOTP code is invalid." });
      }
    } catch (err) {
      console.error("Error checking TOTP:", err);
      res.status(500).json({ error: "Internal server error." });
    }
  }
  
  async verifyRecaptcha(token) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        body: new URLSearchParams({
            secret: secretKey,
            response: token
        })
    });
    const data = await response.json();    
    
    return data.success && data.score > 0.5;
  }

  async getTryCount(req, res) {
    res.type("application/json");
    const { count, lastAttempt } = req.session.loginAttempts;
    const now = Date.now();
    let retryAfter = 0, attemptsLeft = this.MAX_ATTEMPTS - count;
  
    if (count >= this.MAX_ATTEMPTS) {
      const unlockAt = new Date(lastAttempt).getTime() + this.LOCK_TIME_MS;
      if (now < unlockAt) {
        retryAfter = Math.ceil((unlockAt - now) / 1000);
        attemptsLeft = 0;
      } else {
        req.session.loginAttempts.count = 0;
        req.session.loginAttempts.lastAttempt = null;
        attemptsLeft = this.MAX_ATTEMPTS;
      }
    }
  
    res.status(200).json({ count, attemptsLeft, retryAfter, lastAttempt });
  }  
    
}

module.exports = RESTuser;
