const express = require('express');
const { PORT } = require('./config');
const http = require('http')
const databaseConnection = require('./database/connection');
const expressApp = require('./express-app');
require('./jobs')

const StartServer = async () => {

    const app = express();

    await databaseConnection();

    await expressApp(app);

    const httpServer = http.createServer(app);

    httpServer.listen(PORT, () => {
        console.log('HTTP Server running on port ' + PORT);
    })
        .on('error', (err) => {
            console.log(err.message);
            process.exit();
        })
        .on('close', () => {
            channel.close();
        })
}

StartServer();
