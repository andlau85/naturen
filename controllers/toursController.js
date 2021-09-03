// handle requests intereact with models and send back responses
// request - > router - > tourRouter.js -> controller -> interact with buisness model >controller > presentation logic

const AppError = require('../util/appError');
const Tour = require('./../models/tourModel'); // returns array of the results.

const multer = require('multer');
const sharp = require('sharp');

const factory = require('./handlerFacroty');

const catchAsync = require('./../util/catchAsync');

// Adding photo to memory
const multerStorage = multer.memoryStorage();

// Filter for only img type
const multerFilter = (req, file, cb) => {
   if (file.mimetype.startsWith('image')) {
      cb(null, true);
   } else {
      cb(new AppError('Not an image! Please upload only images.', 400), false);
   }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter }); // save location

exports.uploadTourImages = upload.fields([
   { name: 'imageCover', maxCount: 1 },
   { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
   console.log(req.files);

   if (!req.files.imageCover || !req.files.images) return next();

   // 1 Cover image

   req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
   await sharp(req.file.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);

   next();

   // 2 Images
   req.body.images = [];

   await Promise.all(
      req.files.images.map(async (file, i) => {
         const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

         await sharp(req.files.imageCover[0].buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/tours/${filename}`);
         req.body.images.push(filename);
      })
   );
   next();
});

exports.aliasTopTours = (req, res, next) => {
   req.query.limit = '5';
   req.query.sort = 'ratingsAverage,price';
   req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

   next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
// const id = req.params.id * 1;
// const tour = tours.find((el) => el.id === id);

exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
// exports.deleteTour = catchAsync(async (req, res, next) => {
//    const tour = await Tour.findByIdAndDelete(req.params.id);

//    if (!tour) {
//       return next(new AppError('No tour is found with that ID', 404));
//    } // ned 20
//    res.status(204).json({
//       status: 'success',
//       data: null,
//    });
// });

exports.getTourStats = catchAsync(async (req, res, next) => {
   const stats = await Tour.aggregate([
      {
         $match: { ratingsAverage: { $gte: 4.5 } },
      },

      {
         $group: {
            // _id: null,
            // _id: '$ratingsAverage',
            _id: { $toUpper: '$difficulty' },

            num: { $sum: 1 },
            numratings: { $sum: '$ratingsQuantity' },
            avgRating: { $avg: '$ratingsAverage' },
            avgPrice: { $avg: '$price' },
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
         },
      },
      {
         $sort: { avgPrice: 1 }, // 1 for ascending
      },
      // {
      //    $match: { _id: { $ne: 'EASY' } }, //noe equal
      // },
   ]);

   res.status(200).json({
      status: 'success',
      data: {
         stats: stats,
      },
   });
});

exports.getMonthyPlan = catchAsync(async (req, res, next) => {
   const year = req.params.year * 1;

   const plan = await Tour.aggregate([
      {
         $unwind: '$startDates',
      },
      {
         $match: {
            startDates: {
               $gte: new Date(`${year}-01-01`),
               $lte: new Date(`${year}-12-31`),
            },
         },
      },
      {
         $group: {
            _id: { $month: '$startDates' },
            numTourStarts: { $sum: 1 },
            tours: { $push: '$name' },
         },
      },
      {
         $addFields: { month: '$_id' },
      },
      {
         $project: {
            _id: 0, // removes
         },
      },
      {
         $sort: { numTourStarts: -1 },
      },
   ]);

   res.status(200).json({
      status: 'success',
      data: {
         plan: plan,
      },
   });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
   // /tours-within=distance=223&center=-40,45&unit=mi
   // /tours-within/233/center/-40,45/unit/mi
   const { distance, latlng, unit } = req.params;
   const [lat, lng] = latlng.split(',');
   const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

   if (!lat || !lng) {
      next(
         new AppError(
            'Please provide latitude and longitude in the format lat,lng.',
            400
         )
      );
   }
   const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
   });
   // console.log(distance, lat, lng, unit);
   res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
         tours,
      },
   });
});

exports.getDistances = catchAsync(async (req, res, next) => {
   const { latlng, unit } = req.params;
   const [lat, lng] = latlng.split(',');
   const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
   if (!lat || !lng) {
      next(
         new AppError(
            'Please provide latitude and longitude in the format lat,lng.',
            400
         )
      );
   }
   const distances = await Tour.aggregate([
      {
         $geoNear: {
            near: {
               type: 'Point',
               coordinates: [lng * 1, lat * 1],
            },
            distanceField: 'distance',
            distanceMultiplier: multiplier,
         },
      },
      {
         $project: {
            distance: 1,
            name: 1,
         },
      },
   ]);

   res.status(200).json({
      status: 'success',
      data: {
         distances,
      },
   });
});
