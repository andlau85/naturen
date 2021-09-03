// handle requests intereact with models and send back responses
// request - > router - > tourRouter.js -> controller -> interact with buisness model >controller > presentation logic

// exports.checkID = (req, res, next, val) => {
//    console.log(`Tour id is ${val}`);
// };
//    const id = req.params.id * 1;
//    if (id > tours.length) {
//       return res.status(404).json({
//          status: 'fail',
//          message: 'Invalid ID',
//       });
//    }
//    next();
// };
// creating a new middleware. req and res will be run through here. check condition and return "res", or next(). Dont use "val" here.

const Tour = require('./../models/tourModel'); // returns array of the results.

exports.aliasTopTours = (req, res, next) => {
   req.query.limit = '5';
   req.query.sort = 'ratingsAverage,price';
   req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

   next();
};

exports.getAllTours = async (req, res) => {
   try {
      // Filtering
      // eslint-disable-next-line node/no-unsupported-features/es-syntax
      const queryObj = { ...req.query };

      const excludeFields = ['page', 'sort', 'limit', 'fields'];

      excludeFields.forEach((el) => delete queryObj[el]);
      // Advanced filtering gte, gt ,lte, lt

      let queryStr = JSON.stringify(queryObj);
      // \b for exact match, /g for search whole string
      queryStr = queryStr.replace(
         /\b(gte|gt|lte|lt)\b/g,
         (match) => `$${match}`
      );

      // console.log(JSON.parse(queryStr));
      let query = Tour.find(JSON.parse(queryStr));

      // Sorting
      if (req.query.sort) {
         // sort is from browser req
         const sortBy = req.query.sort.split(',').join(' ');
         // console.log(soryBy);
         query = query.sort(sortBy);
      } else {
         query = query.sort('-createdAt');
      }

      // Field limiter
      if (req.query.fields) {
         const fields = req.query.fields.split(',').join(' ');
         query = query.select(fields);
      } else {
         query = query.select('-__');
      }

      // Pagination
      const page = req.query.page * 1 || 1;
      const limit = req.query.limit * 1 || 100;
      const skip = (page - 1) * limit;
      //page=2&limit=10 , 1-10 = page 1 and 11-20 = page2

      query = query.skip(skip).limit(limit);

      if (req.query.page) {
         const numTours = await Tour.countDocuments();
         if (skip >= numTours) throw new Error('This page does not exist');
      }

      // Execute query
      const tours = await query;

      // Send response
      res.status(200).json({
         status: 'success',
         results: tours.length,
         data: {
            tours: tours,
         },
      });
   } catch (err) {
      res.status(404).json({
         status: 'fail',
         message: err,
      });
   }
};
exports.getTour = async (req, res) => {
   try {
      const tour = await Tour.findById(req.params.id);
      // Tour.findOne({ _id: req.params.id }) is same
      res.status(200).json({
         status: 'success',
         data: {
            tour: tour,
         },
      });
   } catch (err) {
      res.status(404).json({
         status: 'fail',
         message: err,
      });
   }
};
// const id = req.params.id * 1;
// const tour = tours.find((el) => el.id === id);

exports.createTour = async (req, res) => {
   try {
      // const newTour = new Tour({})
      // newTour.save()

      const newTour = await Tour.create(req.body);

      res.status(201).json({
         status: 'success',
         data: {
            tour: newTour,
         },
      });
   } catch (err) {
      res.status(400).json({
         status: 'fail',
         message: `Invalid data sendt!`,
      });
   }
};

exports.updateTour = async (req, res) => {
   try {
      const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
         new: true,
         runValidators: true,
      });
      res.status(200).json({
         statys: 'success',
         data: {
            tour: tour,
         },
      });
   } catch (err) {
      res.status(404).json({
         status: 'fail',
         message: err,
      });
   }
};

exports.deleteTour = async (req, res) => {
   try {
      await Tour.findByIdAndDelete(req.params.id);

      res.status(204).json({
         status: 'success',
         data: null,
      });
   } catch (err) {
      res.status(404).json({
         status: 'fail',
         message: err,
      });
   }
};
