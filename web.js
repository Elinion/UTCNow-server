/**
 * Created by alexandreabrantes on 5/19/16.
 */

//Configuration variables
var env = process.env.NODE_ENV || 'development';
var config = require('./config')[env];
// usage exemple : server.listen(config.server.port);

// Modules
var express = require('express');
var mysql = require("mysql");
var request = require("request");
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');

// Connect to **local** mysql database
// var connection = mysql.createConnection({
//     host: config.database.host,
//     port: config.database.port,
//     user: config.database.user,
//     password: config.database.password,
//     database: config.database.db
// });
//
// connection.connect();

function executeQuery(query, callback) {
    // Execute php script on UTC server (it is not possible to have access to the database from outside the UTC)
    request.post({
        url: 'http://assos.utc.fr/utcnow/query.php?query=' + query,
        form: {password: config.queryPassword}
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(body);
        }
    });

    // The code below will be used when we don't need to forward SQL queries anymore
    // connection.query(query, function (err, rows) {
    //     if (err)
    //         console.error('Query error: ' + err.stack);
    //
    //     callback(rows);
    // });
}

var app = express();

// Allow CORS (Cross-Origin Resource Sharing)
app.all('/*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTION, TRACE');
    next();
});

//Main route: hello world message
app.get('/', function (request, response) {
    response.set('Content-Type', 'text/plain');
    response.write('UTCNow server says hi buddy!');
    response.end();
});

// ===========================================================================
// ==============================    AUTHENTICATION      =====================
// ===========================================================================

app.set('jwtSecret', config.jwtSecret);

// get our request parameters
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// route to authenticate a user (POST http://localhost:8080/api/authenticate)
app.get('/authenticate', function (req, res) {
    var ticket = req.query.ticket;
    var service = 'http://localhost:8080/authenticate';

    // Check authentication with UTC CAS authenticator
    request('https://cas.utc.fr/cas/serviceValidate?service=' + service + '&ticket=' + ticket, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // Get user email
            var mailRegex = /mail>([a-zA-z\.]*@[a-zA-z\.]*)<\/cas:mail/i;
            var mail = mailRegex.exec(body)[1];

            // Get user first name
            var firstNameRegex = /givenName>([a-zA-z]*)<\/cas:givenName/i;
            var firstName = firstNameRegex.exec(body)[1];

            // Get user last name
            var lastNameRegex = /sn>([a-zA-z]*)<\/cas:sn/i;
            var lastName = lastNameRegex.exec(body)[1];

            // Get user vega login
            var loginRegex = /user>([a-zA-z]*)<\/cas:user/i;
            var login = loginRegex.exec(body)[1];

            // TODO: add get user by mail to the API
            var userExistsQuery = "SELECT mail FROM `users` WHERE mail LIKE '" + mail + "'";
            executeQuery(userExistsQuery, function (result) {
                // If the user connects for the first time, create an account
                if (!result) {
                    console.log('add user');
                    // API query parameters to add a user
                    var firstNameParam = 'firstName=' + firstName;
                    var lastNameParam = 'lastName=' + lastName;
                    var mailParam = 'mail=' + mail;
                    var loginParam = 'login=' + login;
                    var addUserQuery = '/api/users?' + firstNameParam + '&' + lastNameParam + '&' + mailParam + '&' + loginParam;
                    var addUserUrl = config.server.host + ':' + config.server.port + addUserQuery;
                    console.log(addUserUrl);

                    // API call
                    request.post({
                        url: addUserUrl,
                        form: {password: config.apiPassword}
                    }, function () {
                    });
                }

                // Create a JWT token
                var token = jwt.sign({name: 'alex'}, app.get('jwtSecret'), {
                    expiresIn: 60 * 60 * 2 // expires in 2 hours
                });

                // Return the information including token as JSON
                res.json({
                    success: true,
                    message: 'Login successful',
                    token: token
                });
            });
        } else {
            res.send('Authentication failed');
        }
    })
});

// Get an instance of the router for api routes
var apiRoutes = express.Router();

// Route middleware to verify a token
apiRoutes.use(function (req, res, next) {

    // Check if an admin password was privided
    var password = req.body.password;
    console.log('api password ' + password)
    if (password && password == config.apiPassword) {
        next();
    }
    // Otherwise check if a JWT was provided
    else {

        // check header or url parameters or post parameters for token
        var token = req.body.token || req.query.token || req.headers['x-access-token'];

        // decode token
        if (token) {

            // verifies secret and checks exp
            jwt.verify(token, app.get('jwtSecret'), function (err, decoded) {
                if (err) {
                    return res.json({success: false, message: 'Failed to authenticate token.'});
                } else {
                    // if everything is good, save to request for use in other routes
                    req.decoded = decoded;
                    next();
                }
            });

        } else {

            // if there is no token
            // return an error
            return res.status(403).send({
                success: false,
                message: 'No token provided.'
            });

        }
    }
});

// apply the routes to our application with the prefix /api
//app.use('/api', apiRoutes);

// ===========================================================================
// ==============================    API      ================================
// ===========================================================================

// /events
// GET method
app.get('/api/events', function (request, response) {
    response.set('Content-Type', 'application/json');

    // Query all events
    var queryAllEvent =
        'SELECT ev.id_event, ev.name, ev.description, ev.start, ev.end, lc.name location, tp.id_type type ' +
        'FROM `events` ev ' +
        'LEFT JOIN `locations` lc USING(`id_location`) ' +
        'LEFT JOIN `types` tp USING(`id_type`)';

    var query = queryAllEvent;
    // key ->  start : query events after that date
    var startDate = request.query.start;
    if (startDate) {
        var sql = queryAllEvent + "WHERE ?? >= ?";
        var inserts = ['end', startDate];
        query = mysql.format(sql, inserts);
    }

    // key -> end : query events before that date
    var endDate = request.query.end;
    if (endDate) {
        var sql = queryAllEvent + "WHERE ?? <= ?";
        var inserts = ['start', endDate];
        query = mysql.format(sql, inserts);
    }

    // key ->  start : query events between two dates
    // key -> end :
    var endDate = request.query.end;
    var startDate = request.query.start;
    if (endDate && startDate) {
        var sql = queryAllEvent + "WHERE id_event NOT IN (SELECT id_event FROM `events` " +
            "WHERE ?? < ? OR ?? > ?)";
        var inserts = ['end', startDate, 'start', endDate];
        query = mysql.format(sql, inserts);
    }

    // key -> id : query the event with this id
    var id_event = request.query.id;
    if (id_event) {
        var sql = queryAllEvent + "WHERE ?? = ?";
        var inserts = ['id_event', id_event];
        query = mysql.format(sql, inserts);
    }

    // key -> name : query the event with this name
    var name_event = request.query.name;
    if (name_event) {
        var sql = queryAllEvent + "WHERE ?? = ?";
        var inserts = ['name', name_event];
        query = mysql.format(sql, inserts);
    }

    //key -> id_user : query all event where the user is participating
    var id_user = request.query.id_user;
    if (id_user) {
        var sql = "SELECT e.id_event, e.name, e.start, e.end, e.description " +
            "FROM events e " +
            "INNER JOIN rel_events_users r ON e.id_event = r.id_event " +
            "WHERE id_user = ? ";
        var inserts = [id_user];
        query = mysql.format(sql, inserts);
    }

    // Execute query
    executeQuery(query, function (result) {
        response.send(result);
    });

});

// /events
// POST method
app.post('/api/events', function (request, response) {
    response.set('Content-Type', 'application/json');

    // keys ->  start, end, name, desc
    var name_event = request.query.name;
    var desc_event = request.query.desc;
    var endDate = request.query.end;
    var startDate = request.query.start;
    //var location = request.query.loc;

    if (name_event && desc_event && endDate && startDate) {
        var sql = "INSERT INTO ?? (name, start, end, description)" +
            "VALUES (?, ?, ?, ?)";
        var inserts = ['events', name_event, startDate, endDate, desc_event];
        query = mysql.format(sql, inserts);
    }

    // Execute query
    executeQuery(query, function (result) {
        response.send(result);
    });
});

// /events
// DELETE method
app.delete('/api/events', function (request, response) {
    response.set('Content-Type', 'application/json');

    // key ->  id
    var id_event = request.query.id;

    if (id_event) {
        var sql = "DELETE FROM ?? WHERE ?? = ?";
        var inserts = ['events', 'id_event', id_event];
        query = mysql.format(sql, inserts);
    }

    // Execute query
    executeQuery(query, function (result) {
        response.send(result);
    });
});

// /events
// UPDATE method
app.put('/api/events', function (request, response) {
    response.set('Content-Type', 'application/json');

    // key ->  id, name, start, end, desc
    var id_event = request.query.id;
    var name_event = request.query.name;
    var desc_event = request.query.desc;
    var endDate = request.query.end;
    var startDate = request.query.start;

    if (id_event && name_event && desc_event && endDate && startDate) {
        var sql = "UPDATE ?? SET ?? = ?, ?? = ?, ?? = ?, ?? = ? WHERE ?? = ?";
        var inserts = ['events', 'name', name_event, 'start', startDate, 'end', endDate, 'description', desc_event, 'id_event', id_event];
        query = mysql.format(sql, inserts);
    }

    // Execute query
    executeQuery(query, function (result) {
        response.send(result);
    });
});

// /users
// get method
app.get('/api/users', function (request, response) {
    response.set('Content-Type', 'application/json');

    // Query all users
    var query = 'SELECT * FROM users';

    // key ->  id_event : query users participating to this event
    var id_event = request.query.id_event;
    if (id_event) {
        var sql = "SELECT u.id_user, u.firstName, u.lastName " +
            "FROM users u " +
            "INNER JOIN rel_events_users r ON u.id_user = r.id_user " +
            "WHERE id_event = ? ";
        var inserts = [id_event];
        query = mysql.format(sql, inserts);
    }

    // Execute query
    executeQuery(query, function (result) {
        response.send(result);
    });
});

// /users
// POST method
app.post('/api/users', function (request, response) {
    response.set('Content-Type', 'application/json');

    // keys ->  lastName, firstName
    var firstName = request.query.firstName;
    var lastName = request.query.lastName;
    var mail = request.query.mail;
    var login = request.query.login;

    // key ->  id_event : add an user participating to an event
    // key ->  user
    var id_event = request.query.id_event;
    var id_user = request.query.id_user;

    if (firstName && lastName) {
        var sql = "INSERT INTO ?? (firstName, lastName, mail, login)" +
            "VALUES (?, ?, ?, ?)";
        var inserts = ['users', firstName, lastName, mail, login];
        query = mysql.format(sql, inserts);
    }

    else if (id_event && id_user) {
        var sql = "INSERT INTO ?? (id_event, id_user)" +
            "VALUES (?, ?)";
        var inserts = ['rel_events_users', id_event, id_user];
        query = mysql.format(sql, inserts);
    }

    // Execute query
    executeQuery(query, function (result) {
        response.send(result);
    });
});

// /users
// DELETE method
app.delete('/api/users', function (request, response) {
    response.set('Content-Type', 'application/json');

    // key ->  id
    var id_user = request.query.id;

    if (id_user) {
        var sql = "DELETE FROM ?? WHERE ?? = ?";
        var inserts = ['users', 'id_user', id_user];
        query = mysql.format(sql, inserts);
    }

    // Execute query
    executeQuery(query, function (result) {
        response.send(result);
    });
});

// /users
// UPDATE method
app.put('/api/users', function (request, response) {
    response.set('Content-Type', 'application/json');

    // keys ->  lastName, firstName
    var firstName = request.query.firstName;
    var lastName = request.query.lastName;
    var id_user = request.query.id;

    if (firstName && lastName && id_user) {
        var sql = "UPDATE ?? SET ?? = ?, ?? = ? WHERE ?? = ?";
        var inserts = ['users', 'firstName', firstName, 'lastName', lastName, 'id_user', id_user];
        query = mysql.format(sql, inserts);
    }

    // Execute query
    executeQuery(query, function (result) {
        response.send(result);
    });
});

// ===========================================================================
// ==============================  API  END   ================================
// ===========================================================================


// Close database connection when shutting down the server
process.on('exit', function () {
    // connection.end();
    app.close();
});


//Heroku dynamic port;
app.listen(process.env.PORT || config.server.port)
//app.listen(8080);

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