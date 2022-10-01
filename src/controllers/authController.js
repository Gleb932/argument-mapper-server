const crypto = require("crypto");
const auth = require('../services/auth');
const db = require('../services/db');
const mailing = require('../services/mailing');

async function register(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;
    if(!username || !password || !email)
    {
        res.status(400);
        res.json({message:"missing data"})
        return;
    }
    let [salt, hash] = await auth.hash(password);
    let emailVerificationStr = crypto.randomBytes(64).toString('hex');
    let id = await db.createUser(username, hash, email, salt, emailVerificationStr)

    if(id < 0)
    {
        res.status(500)
        res.json({message:"failed to create user"})
        return;
    }
    res.sendStatus(200);
    //mailing.sendVerification(req.body.email, id, emailVerificationStr);
}

async function login(req, res) {
    let password = req.body.password;
    let username = req.body.username;
    if(!password || !username)
    {
        res.status(400);
        res.json({message:"missing data"})
        return;
    }
    let queryRes = await db.getUserByUsername(username);
    if(!queryRes || queryRes.rowCount == 0)
    {
        res.status(401);
        res.json({message:"invalid password or username"})
        return;
    }
    let user = queryRes.rows[0];
    if(user.activated && user.salt && user.password){
        let success = await auth.verify(password, [user.salt, user.password]);
        if(success)
        {
            res.status(200);
            res.json({access_token: auth.createToken({userID: user.id, username: username, role: user.role})});
        } else {
            res.status(401);
            res.json({message:"invalid password or username"})
        }
    }
}

async function verify(req, res) {
    let userID = req.query.userID;
    let verification_str = req.query.verification_str;
    if(!userID || !verification_str)
    {
        res.sendStatus(400);
        return;
    }
    let dbRes = await db.activateAccount(userID, verification_str);
    res.status(200).send(dbRes);
}

module.exports = {
    register,
    login,
    verify,
  };