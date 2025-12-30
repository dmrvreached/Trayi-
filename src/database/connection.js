const mongoose = require('mongoose');
const { DB_URL } = require('../config');

module.exports = async () => {

    // Set 'strictQuery' option to false to suppress the deprecation warning
    mongoose.set('strictQuery', false);

    mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

    // Get the default connection
    const db = mongoose.connection;

    // Bind connection to error event (to get notifications of connection errors)
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));

    // Bind connection to open event (to be notified if the connection is successful)
    db.once('open', function () {
        console.log('Connected to MongoDB');
    });

    // Close the Mongoose connection when the Node.js application is terminated
    process.on('SIGINT', function () {
        mongoose.connection.close(function () {
            console.log('Mongoose default connection disconnected through app termination');
            process.exit(0);
        });
    });


};
