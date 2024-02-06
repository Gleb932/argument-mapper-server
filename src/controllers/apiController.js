const db = require('../services/db');
const sessions = require('../services/sessions');

let roles;

function init()
{
    db.getRoles()
    .then( res => {
        if(!res || res.rowCount == 0)
        {
            console.error("Could not retrieve roles data");
            return;
        }
        roles = res.rows;
    })
    .catch( e => {
        console.error(e.stack);
        return false;
    })
}
init();

async function test(req, res) {
    console.log(req.username, "test");
    res.status(200).send("test");
}

async function getSessionMap(req, res){
    let sessionID = req.params.sessionID;
    if(!sessionID)
    {
        return res.status(400).json({message:"missing sessionID"});
    }
    let sessionData = await db.getSession(sessionID).then(res => {
        if(!res || res.rowCount == 0)
        {
            return null;
        }
        return res;
    }).catch( e => {
        console.error(e.stack);
        return null;
    });
    if(sessionData)
    {
        console.log(sessionData)
        return res.status(200).json({sessionMap:sessionData.rows[0]["map_tree"]});
    }else{
        return res.status(404).json({message:"session not found"});
    }
}

async function createSession(req, res) {
    let role = roles[req.role];
    let mapTree = req.body.mapTree;
    if(!mapTree)
    {
        return res.status(400).json({message:"mapTree is empty"});
    }
    let countRes = await db.getCurrentSessionsCount(req.userID);
    if(role.max_sessions <= countRes.rows[0].count)
    {
        res.status(403).json({message:"exceeded allowed count of sessions"});
        return;
    }
    let sessionID = await sessions.createSession(req.userID, mapTree);
    if(sessionID)
    {
        return res.status(200).json({sessionID:sessionID});
    }else{
        return res.status(500).json({message:"failed to create session"});
    }
}

async function deleteSession(req, res) {
    let sessionID = req.params.sessionID;
    if(!sessionID)
    {
        return res.status(400).json({message:"missing sessionID"});
    }
    await db.deleteSession(req.userID, sessionID);
    return res.sendStatus(200);
}

module.exports = {
    test, createSession, deleteSession, getSessionMap
};