/**
 * Created by alexandreabrantes on 5/19/16.
 */

// Modules
var express = require('express');
var mysql = require("mysql");

// Connect to local mysql database
var connection = mysql.createConnection({
    host: 'sql7.freemysqlhosting.net',
    port: '3306',
    user: 'sql7121051',
    password: 'azAp2vKtN7',
    database: 'sql7121051'
});

var app = express();

// Allow CORS (Cross-Origin Resource Sharing)
app.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Main route: hello world message
app.get('/', function (request, response) {
    response.set('Content-Type', 'text/plain');
    response.write('UTCNow server says hi buddy!');
    response.end();
});
connection.connect();

// API: get all events
app.get('/api/events', function (request, response) {
    response.set('Content-Type', 'application/json');

    // Query all events
    var query = 'SELECT * FROM events';

    // If start parameter was passed, query events after that date
    var startDate = request.query.start;
    if (startDate) {
        query = "SELECT * FROM events WHERE date >= '" + startDate + "'";
    }

    // Execute query
    connection.query(query, function (err, rows) {
        if (err)
            console.error('Query error: ' + err.stack);
        else
            response.write(JSON.stringify(rows));

        response.end();
    });

});


// Close database connection when shutting down the server
process.on('exit', function () {
    connection.end();
    app.close();
});

app.listen(8080);

// The code below will be use for CAS connection
//
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