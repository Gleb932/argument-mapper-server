const db = require('../services/db');
const dayjs = require("dayjs")

async function createSession(userID, mapTree)
{
    let creation = dayjs().format('YYYY-MM-DD HH:mm:ss');
    let dbRes = await db.createSession(userID, creation, mapTree)
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