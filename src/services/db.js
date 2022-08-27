const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function getUserByID(id)
{
    let client = await pool.connect();
    let res = await client.query('SELECT * FROM users WHERE id = $1;', [id]).catch(e => {console.error(e.stack); return null});
    client.release();
    return res;
}

async function getUserByUsername(username)
{
    let client = await pool.connect();
    let res = await client.query('SELECT * FROM users WHERE username = $1;', [username]).catch(e => {console.error(e.stack); return null});
    client.release();
    return res;
}

async function createUser(username, password, email, salt, verification_str)
{
    let client = await pool.connect();
    let result = await client.query("INSERT INTO users(username, password, email, activated, salt) VALUES ($1, $2, $3, $4, $5) RETURNING id;", [username, password, email, "false", salt])
    .catch(e => {
        console.error(e.stack);
        return null;
    });
    if(!result || result.rowCount <= 0)
    {
        client.release();
        return -1;
    }
    let id = result.rows[0].id;
    await client.query("INSERT INTO users_to_verify(id, verification_str) VALUES ($1, $2);", [id, verification_str]).catch(e => {console.error(e.stack); });

    client.release();
    return id;
}

async function activateAccount(userID, verification_str)
{
    let client = await pool.connect();
    return client.query(
        "SELECT verification_str FROM users_to_verify WHERE id = $1;",
        [userID]
    ) 
    .then( res => {
        if (res.rows.length <= 0 || res.rows[0].verification_str != verification_str)
        {
            throw "No match found";
        }
    })
    .then(()=>client.query("DELETE FROM users_to_verify WHERE id = $1;", [userID]))
    .then(()=>client.query("UPDATE users SET activated = TRUE WHERE id = $1;", [userID]))
    .then(()=>{return true;})
    .catch( e => {
        console.error(e.stack);
        return false;
    })
    .finally(()=>client.release());
}

async function getSaltAndPassword(username)
{
    let client = await pool.connect();
    return client.query('SELECT password, salt FROM users WHERE username = $1;', [username])
    .then(  res => {
        if(res.rowCount == 1)
        {
            return [res.rows[0].salt, res.rows[0].password];
        }else
        {
            throw "No username found";
        }
    })
    .catch(e => {
        console.error(e.stack);
        return null;
    })
    .finally(()=>client.release());
}

module.exports = { createUser, activateAccount, getSaltAndPassword, getUserByID, getUserByUsername };