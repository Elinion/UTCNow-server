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
            host: 'localhost',
            port: '8080'
        },
        // Password used when forwarding the SQL query to the UTC-hosted PHP website
        queryPassword: 'InTheWhiteBoardWeTrust'
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
        queryPassword: 'InTheWhiteBoardWeTrust'
    }
};
module.exports = config;