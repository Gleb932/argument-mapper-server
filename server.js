var express = require('express');
var bodyParser = require('body-parser');
const login = require('./login.js');
const db = require('./db.js');

var app = express();
app.use(bodyParser.urlencoded({extended: false}));

const PORT = process.env.PORT || 5000

app.get('/', function(req, res) {
    res.status(200).send('Hello world');
});

app.listen(PORT, function() {
    console.log('Server is running on PORT:', PORT);
});

app.post('/register', async function(req, res) {
    var [salt, hash] = await login.hash(req.body.password);
    db.pool.query("INSERT INTO users(username, password, email, activated, salt) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
    [req.body.username, hash, req.body.email, "false", salt],
    function (error, results, fields) {
        if (error) throw error;
    });
    res.status(200);
});

app.post('/login', function(req, res) {
    db.pool.query('SELECT password, salt FROM users WHERE username = $1;',
    [req.body.username], 
    async function (error, results, fields) {
        if (error) throw error;
        if(results.rowCount == 1){
            var result = await login.verify(req.body.password, [results.rows[0].salt, results.rows[0].password]);
            res.status(200).send(result);
        }else{
            res.status(200).send(false);
        }
    });
});