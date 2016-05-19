/**
 * Created by alexandreabrantes on 5/19/16.
 */

var http = require('http');

var server = http.createServer(function(req, res) {
    res.writeHead(200);
    res.end('Server base for UTCNow');
});
server.listen(8080);