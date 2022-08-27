const express = require('express');
const bodyParser = require('body-parser');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
const logging = require('./middlewares/logging');
app.use(logging)
const apiRouter = require('./routes/apiRoute');
const authRouter = require('./routes/authRoute');
app.use('/api', apiRouter);
app.use('/auth', authRouter);

const PORT = process.env.PORT || 5000
app.listen(PORT, async function() {
    console.log('Server is running on PORT:', PORT);
});

app.get('/', async function(req, res) {
    res.status(200).send('Hello world');
});