const db = require('../services/db');
const dayjs = require("dayjs")

async function createSession(userID, mapTree)
{
    let duration = process.env.SESSION_DURATION.split(' ')
    let expiration = dayjs().add(duration[0], duration[1]);
    let dbRes = await db.createSession(userID, expiration.format('YYYY-MM-DD HH:mm:ss'), mapTree)
    if(dbRes.rowCount == 1)
    {
        return dbRes.rows[0].id;
    }else{
        return null;
    }
}

module.exports = {
    createSession
};