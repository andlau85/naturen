// Tools
const fs = require('fs');
const express = require('express');
const morgan = require('morgan'); // dev logging
const app = express();

//middleware
app.use(morgan('dev'));
app.use(express.json());
app.use((req, res, next) => {
   console.log('hello from the middleware 👌');
   next();
});
app.use((req, res, next) => {
   req.requestTime = new Date().toISOString();
   next();
});
// load file
const tours = JSON.parse(
   fs.readFileSync(
      `${__dirname}/dev-data/data/tours-simple.json`
   )
);

// Route handlers
const getAllTours = (req, res) => {
   console.log(req.requestTime);
   res.status(200).json({
      // This ends the respond cicle.
      // send back to client
      status: 'success',
      requestedAT: req.requestTime,
      results: tours.length,
      data: {
         tours: tours,
      },
   });
};
const getTour = (req, res) => {
   console.log(req.params);
   const id = req.params.id * 1;
   const tour = tours.find((el) => el.id === id);

   if (req.params.id > tours.length) {
      return res.status(404).json({
         status: 'fail',
         message: 'Invalid ID',
      });
   }

   res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
         tour: tour,
      },
   });
};
const createTour = (req, res) => {
   const newID = tours[tours.length - 1].id + 1;
   const newTour = Object.assign(
      { id: newID },
      req.body
   );

   tours.push(newTour);

   fs.writeFile(
      `${__dirname}/dev-data/data/tours-simple.json`,
      JSON.stringify(tours),
      (err) => {
         res.status(201).json({
            status: 'success',
            data: {
               tour: newTour,
            },
         });
      }
   );
};

const updateTour = (req, res) => {
   const id = req.params.id * 1;
   if (id > tours.length) {
      return res.status(404).json({
         status: 'fail',
         message: 'Invalid ID',
      });
   }

   res.status(200).json({
      statys: 'success',
      data: {
         tour: 'updated tours',
      },
   });
};
const deleteTour = (req, res) => {
   const id = req.params.id * 1;
   if (id > tours.length) {
      return res.status(404).json({
         status: 'fail',
         message: 'Invalid ID',
      });
   }

   res.status(204).json({
      statys: 'success',
      data: null,
   });
};
//----------------------Users----------------------------------
const getAllUsers = (req, res) => {
   res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined.',
   });
};
const getUser = (req, res) => {
   res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined.',
   });
};
const createUser = (req, res) => {
   res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined.',
   });
};
const updateUser = (req, res) => {
   res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined.',
   });
};
const deleteUser = (req, res) => {
   res.status(500).json({
      status: 'error',
      message: 'This route is not yet defined.',
   });
};

// Routes

// This is called mounting a Router
const tourRouter = express.Router();
const usersRouter = express.Router();
//This creates a under application
tourRouter
   .route('/')
   .get(getAllTours)
   .post(createTour);

tourRouter
   .route('/:id')
   .get(getTour)
   .patch(updateTour)
   .delete(deleteTour);
//-----------------------------------------------

usersRouter
   .route('/')
   .get(getAllUsers)
   .post(createUser);

usersRouter
   .route('/:id')
   .get(getUser)
   .patch(updateUser)
   .delete(deleteUser);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', usersRouter);

// This is a middleware wich will run if the '/api/v1/tours' is requested, then run tourRouter middleware

// Start server
const port = 3000;
app.listen(port, () => {
   console.log(`App running on port ${port}`);
});
