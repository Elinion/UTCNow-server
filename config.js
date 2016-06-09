var config = {
    development: {
        //url to be used in link generation
        url: 'localhost',
        //mysql rasberry connection settings
        database: {
            host: 'utcnow.ddns.net',
            port: '3306',
            db:     'utcnow',
            user: 'utcnow',
            password: 'utcnow2016'
        },
        //server details
        server: {
            host: 'http://localhost',
            port: '8080'
        },
        // Password used when forwarding the SQL query to the UTC-hosted PHP website
        queryPassword: 'InTheWhiteBoardWeTrust',
        // Secret for encoding JWT authorization
        jwtSecret: 'TheWhiteBoardConsumesYou',
        // Password granting admin access to the API 
        // Providing the password lets you call the API without having to be logged in
        apiPassword: 'WhiteboardWhiteboard,whoIsTheMostBeautiful?'
    },
    production: {
        //url to be used in link generation
        url: 'http://utcnow.ddns.net',
        //mysql rasberry connection settings
        database: {
            host: 'utcnow.ddns.net',
            port: '3306',
            db:     'utcnow',
            user: 'utcnow',
            password: 'utcnow2016'
        },
        //server details
        server: {
            host:   'utcnow.ddns.net',
            port:   '8080'
        },
        // Password used when forwarding the SQL query to the UTC-hosted PHP website
        queryPassword: 'InTheWhiteBoardWeTrust',
        // Secret for encoding JWT authorization
        jwtSecret: 'TheWhiteBoardConsumesYou',
        // Password granting admin access to the API
        // Providing the password lets you call the API without having to be logged in
        apiPassword: 'WhiteboardWhiteboard,tellMe,whoIsTheMostBeautiful?'
    }
};
module.exports = config;