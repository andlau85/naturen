// Tools
const fs = require('fs');
const express = require('express');
const morgan = require('morgan'); // dev logging
const app = express();

app.use(express.json()); // middleware

app.use((req, res, next) => {
  // next can be called anything just like req and res. || Here we are creating our own middleware. NB!! You need to use all arguments in order to finish the cycle!

  console.log('hello from the middleware 👌');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // Date now, and conv to a readable string.
  next();
});
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
  const newTour = Object.assign({ id: newID }, req.body);

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
const tours = JSON.parse(
  // makes it into JS object
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

// REFACTORING CODE and declaring functions instead

// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', createTour);
// app.patch("/api/v1/tours/:id",updateTour)
// app.delete("/api/v1/tours/:id",deleteTour)

app.route('/api/v1/tours').get(getAllTours).post(createTour);

app
  .route('/api/v1/tours/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

const port = 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
