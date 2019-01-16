// imports
var express = require('express');
var bodyParser = require('body-parser')
var apiRouter = require('./apiRouter').router;
const mongoose = require('mongoose');



//init server
var server = express();

// configuration of BodyParser
server.use(bodyParser.urlencoded(
{
    extended: true
}));
server.use(bodyParser.json());

//root Configuration
server.get('/', function(req, res)
{
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send('<h1>RSRestAPI</h1>');
    res.end();
});

mongoose.Promise = global.Promise;

if (process.env.NODE_ENV !== 'test')
{
    mongoose.set('useCreateIndex', true);
    mongoose.connect("mongodb+srv://root:toor@cluster0-rj49s.mongodb.net/test?retryWrites=true",
    {
        useNewUrlParser: true
    });
}

server.use('/api/', apiRouter);

//launch server
server.listen(8080, function()
{
    console.log('server listening on localhost port 8080 ')
});
