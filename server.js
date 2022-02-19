var express = require('express');

var app = express();

const PORT = process.env.PORT || 5000

app.get('/', function(req, res) {
    res.status(200).send('Hello world');
});

app.listen(PORT, function() {
    console.log('Server is running on PORT:',PORT);
});

app.post('/register', function(req, res) {
    res.status(200).send("Registration: " + req.body.login + " " + req.body.password);
});

app.post('/login', function(req, res) {
    res.status(200).send("Login: " + req.body.login + " " + req.body.password);
});