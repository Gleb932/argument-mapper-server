const crypto = require("crypto");
const jwt = require('jsonwebtoken');

async function hash(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(8).toString("base64")

        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve([salt, derivedKey.toString('base64')])
        });
    })
}

async function verify(password, hash) {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(key == derivedKey.toString('base64'))
        });
    })
}

function createToken(data)
{
    return jwt.sign(
        data,
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.TOKEN_EXPIRATION }
    );
}

function authCheck(req, res, next)
{
    const authHeader = req.header('Authorization')
    if(!authHeader) return res.status(400).json({ message: "No token provided" });
    
    const token = authHeader.split(' ')[1]
    if (token) {
        jwt.verify(token, process.env.TOKEN_SECRET, (err, decodedToken) => {
            if (err) {
                return res.status(401).json({ message: "Not authorized" });
            } else {
                req.userID = decodedToken.userID;
                req.username = decodedToken.username;
                req.role = decodedToken.role;
                next();
            }
        })
    } else {
        return res.status(400).json({ message: "No token provided" });
    }
}

module.exports = {
    hash, verify, createToken, authCheck
};