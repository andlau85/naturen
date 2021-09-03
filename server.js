/* eslint-disable no-console */
const mongoose = require('mongoose'); // Easy communication to mongoDB
const dotenv = require('dotenv'); // env-file npm

process.on('uncaughtException', (err) => {
   // Handling uncaughtException errors
   console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
   console.log(err.name, err.message);
   process.exit(1);
});

dotenv.config({ path: './config.env' }); // read config.env
const app = require('./app'); // Express

const DB = process.env.DATABASE.replace(
   // Changing the database password.
   '<PASSWORD>',
   process.env.DATABASE_PASSWORD
);

mongoose // Connecting to mongoDB
   .connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      // Standard config.
   })
   .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000; // Using port in env-file else 3000
const server = app.listen(port, () => {
   // Starting server
   console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
   // Handling unhandledRejection errors
   console.log('UNHANDLED REJECTION! 💥 Shutting down...');
   console.log(err.name, err.message);
   server.close(() => {
      process.exit(1);
   });
});
