/**
 * Created by alexandreabrantes on 5/19/16.
 */
//var url = require('url');
// var queryString = require('querystring');

// var server = http.createServer(function (req, res) {
//     var params = queryString.parse(url.parse(req.url).query);
//     res.writeHead(200, {"Content-Type": "text/plain"});
//     if ('ticket' in params) {
//         res.write('Ticket : ' + params['ticket']);
//     }
//     else {
//         res.write('No CAS ticket received');
//     }
//     res.end();
// });
// server.listen(8080);

var express = require('express');
var mysql = require("mysql");

var app = express();

var connection = mysql.createConnection({
    host     : 'localhost',
    port     : '8889',
    user     : 'alex',
    database : 'utcnow'
});

connection.connect();

var result = 'not found';

connection.query('SELECT * FROM events', function(err, rows, fields) {
    if (err) throw err;

    result = JSON.stringify(rows);
});

connection.end();


app.get('/', function (request, response) {
    response.set('Content-Type', 'text/plain');
    response.write(result);
    response.end();
});

app.listen(8080);