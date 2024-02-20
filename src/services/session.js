const db = require('./db');
const dayjs = require("dayjs")

async function createSession(userID, mapTree)
{
    let creation = dayjs().format('YYYY-MM-DD HH:mm:ss')
    let dbRes = await db.createSession(userID, creation, mapTree)
    if(dbRes.rowCount == 1)
    {
        return dbRes.rows[0].id
    }else{
        return null
    }
}

function getNodeByPath(mapJson, pathArray)
{
    if(pathArray === null)
    {
        return mapJson
    }
    let curNode = mapJson
    for (let i = 0; i < pathArray.length; i++) {
        let children = curNode.children
        let childIndex = pathArray[i]
        if(childIndex >= children.length)
        {
            return null;
        }
        curNode = children[childIndex]
    }
    return curNode
}

async function handleOperation(ws, request)
{
    let sessionID = ws.sessionID
    let operation = request.operation
    console.log(request)
    let result = 400
    if(operation == "addChild")
    {
        result = await addChild(sessionID, request.parentPath, request.child)
    }
    else if(operation == "replaceNode")
    {
        result = await replaceNode(sessionID, request.nodePath, request.newNode)
    }
    else if(operation == "removeNode")
    {
        result = await removeNode(sessionID, request.nodePath)
    }
    return {result: result}
}

async function addChild(sessionID, parentPath, child)
{
    if(!sessionID)
    {
        return 400
    }
    let sessionData = await db.getSession(sessionID).catch( e => {
        console.error(e.stack)
        return null
    });
    if(!sessionData)
    {
        return 404
    }
    const mapString = sessionData.rows[0]["map_tree"]
    const mapJson = JSON.parse(mapString)
    const parent = getNodeByPath(mapJson, parentPath)
    parent.children.push(child)
    const newMapString = JSON.stringify(mapJson)
    let dbRes = await db.updateSessionMap(sessionID, newMapString)
    return dbRes?200:500
}

async function replaceNode(sessionID, oldNodePath, newNode)
{
    if(!sessionID)
    {
        return 400
    }
    let sessionData = await db.getSession(sessionID).catch( e => {
        console.error(e.stack)
        return null
    });
    if(!sessionData)
    {
        return 404
    }
    const mapString = sessionData.rows[0]["map_tree"]
    const mapJson = JSON.parse(mapString)
    const oldNode = getNodeByPath(mapJson, oldNodePath)
    if(oldNode === mapJson) return 400;
    const nodeIndex = oldNodePath.pop();
    const oldNodeParent = getNodeByPath(mapJson, oldNodePath)
    oldNodeParent.children[nodeIndex] = newNode
    newNode.children = oldNode.children
    const newMapString = JSON.stringify(mapJson)
    let dbRes = await db.updateSessionMap(sessionID, newMapString)
    return dbRes?200:500
}

async function removeNode(sessionID, nodePath)
{
    if(!sessionID)
    {
        return 400
    }
    let sessionData = await db.getSession(sessionID).catch( e => {
        console.error(e.stack)
        return null
    });
    if(!sessionData)
    {
        return 404
    }
    const mapString = sessionData.rows[0]["map_tree"]
    const mapJson = JSON.parse(mapString)
    if(nodePath.length < 1) return 400
    const nodeIndex = nodePath.pop()
    const nodeParent = getNodeByPath(mapJson, nodePath)
    nodeParent.children.splice(nodeIndex, 1)
    const newMapString = JSON.stringify(mapJson)
    let dbRes = await db.updateSessionMap(sessionID, newMapString)
    return dbRes?200:500
}

module.exports = {
    createSession, addChild, replaceNode, removeNode, handleOperation
};