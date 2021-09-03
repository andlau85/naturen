// Tools
const path = require('path');
const express = require('express');
const morgan = require('morgan'); // dev logging
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongodbSanitize = require('mongodb-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRouter');
const usersRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');
const viewRouter = require('./routes/viewRouter');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./util/appError');

const app = express();
//require new modules
// app.js > router>routers>controller>app.js

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Servering static files
app.use(express.static(path.join(__dirname, '/public')));

// GLOBAL MIDDLEWARES
// Set security HTTP headers
// app.use(helmet());
app.use(
   helmet({
      contentSecurityPolicy: {
         directives: {
            defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
            baseUri: ["'self'"],
            fontSrc: ["'self'", 'https:', 'data:'],
            scriptSrc: [
               "'self'",
               'https:',
               'http:',
               'blob:',
               'https://*.mapbox.com',
               'https://*.stripe.com',
               'https://js.stripe.com',
               'https://*.cloudflare.com',
               'https://cdnjs.cloudflare.com',
               'https://api.mapbox.com',
               'https://js.stripe.com/v3/',
            ],
            frameSrc: [
               "'self'",
               'https://js.stripe.com',
               'https://hooks.stripe.com',
            ],
            objectSrc: ['none'],
            styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
            workerSrc: ["'self'", 'data:', 'blob:'],
            childSrc: ["'self'", 'blob:'],
            imgSrc: ["'self'", 'data:', 'blob:'],
            connectSrc: [
               "'self'",
               'blob:',
               'wss:',
               'https://*.tiles.mapbox.com',
               'https://api.mapbox.com',
               'https://events.mapbox.com',
               'https://api.stripe.com',
               'ws://127.0.0.1',
            ],
            upgradeInsecureRequests: [],
         },
      },
   })
);

// Development logging
if (process.env.NODE_ENV === 'development') {
   app.use(morgan('dev'));
}
// Limit requests from same API
const limiter = rateLimit({
   max: 100,
   windowMs: 60 * 60 * 1000, // 100 req from ip in 1 hour
   message: 'Too many requests from this IP, please try again in a hour!',
});
app.use('/api', limiter);

// Body parser, reading data from "body" into "req.body"
app.use(express.json({ limit: '10kb' })); // limits body size
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // limits body size
app.use(cookieParser());

// // Data sanitization against NoSQL querry injection
app.use(mongodbSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
   hpp({
      whitelist: [
         'duration',
         'ratingsQuantity',
         'ratingsAverage',
         'price',
         'maxGroupSize',
         'difficulty',
      ],
   })
);

// Test middleware
app.use((req, res, next) => {
   // This middleware will show request in milliseconds and transform it to normal time format
   // console.log(req.cookies);
   req.requestTime = new Date().toISOString();
   next();
});

// Routes
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter); // Defines the routes and
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewRouter);

// MIDDLEWARE ERROR HANDLER
//----------------------------------------------------------------
//if not found. The "*" means every rout.
app.all('*', (req, res, next) => {
   next(new AppError(`Can't find ${req.originalUrl} on the server!`, 404));
});
app.use(globalErrorHandler);

// ---------------------------------------------------------------
module.exports = app;
