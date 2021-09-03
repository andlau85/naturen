/* eslint-disable no-console */
// Setting up a Schema
const mongoose = require('mongoose');

const slugify = require('slugify');

// const User = require('./userModel');
// const validator = require('validator');

const toursSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: [true, 'A tour must have a name'], // validators
         unique: true,
         trim: true,
         maxlenght: [
            40,
            'A tour name must have less or equal then 40 characters.',
         ],
         minlenght: [10, 'A tour name must have more then 10 characters.'],
         /* validate: [
            validator.isAlpha,
            'Tour name must only contain characters',
         ], */
         // validator npm
      },
      slug: String,
      duration: {
         type: Number,
         required: [true, 'A tour must have a duration'],
      },
      maxGroupSize: {
         type: Number,
         required: [true, 'A tour must have a group size'],
      },
      difficulty: {
         type: String,
         require: [true, 'A tour must have a difficulty'],
         enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy,medium or difficult',
         },
      },
      ratingsAverage: {
         type: Number,
         default: 4.5,
         min: [1, 'A tour name must be min 1 rating'],
         max: [5, 'A tour name must equal or under 5 rating'],
         set: (val) => Math.round(val * 10) / 10, // 4.666 | 46.66 | 4.6
      },
      ratingsQuantity: {
         type: Number,
         default: 0,
      },
      price: { type: Number, required: [true, 'A tour must have a price'] },
      priceDiscount: {
         type: Number,
         validate: {
            validator: function (val) {
               // wont work on updates, only on new inputs
               return val < this.price;
            },
            message: 'Discount price ({value}) should be below regular price',
         },
      },
      summary: {
         type: String,
         trim: true,
         required: [true, 'A tour must have a discription'],
      },
      description: {
         type: String,
         trim: true,
      },
      imageCover: {
         type: String,
         required: [true, 'A tour must have a cover image'],
      },
      images: [String],
      createdAt: {
         type: Date,
         default: Date.now(),
         select: false,
      },
      startDates: [Date],
      secretTour: {
         type: Boolean,
         default: false,
      },
      startLocation: {
         // GeoJSON
         type: {
            type: String,
            default: 'Point',
            enum: ['Point'], // enum is limiting the array
         },
         coordinates: [Number], // lat and lng reversed
         adress: String,
         discription: String,
      },

      locations: [
         {
            type: {
               type: String,
               default: 'Point',
               enum: ['Point'],
            },

            coordinates: [Number],
            adress: String,
            description: String,
            day: Number,
         },
      ],

      // guides: Array, Embedded
      // Referancing
      guides: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
   }, //schema stops here
   {
      toJSON: { virtuals: true },

      toObject: { virtuals: true },
      //second parameter of schema function
   }
);

// toursSchema.index({ price: 1 }); One field index
toursSchema.index({ price: 1, ratingsAverage: -1 });
toursSchema.index({ slug: 1 });
toursSchema.index({ startLocation: '2dsphere' }); // earthlike sphere

toursSchema.virtual('durationWeeks').get(function () {
   return this.duration / 7;
}); //"this" is pointing to current document

//Virtual populate
toursSchema.virtual('reviews', {
   ref: 'Review',
   foreignField: 'tour', //the tour field in the Review model
   localField: '_id', //_id of the tour in the Tour model
   //look for the _id of the tour in the tour field in review
});

// Document middleware: runs before .save() and .create(). Not insert()
toursSchema.pre('save', function (next) {
   this.slug = slugify(this.name, { lower: true });
   next();
});
toursSchema.pre(/^find/, function (next) {
   this.populate({
      // Populate creates a new querry
      path: 'guides',
      select: '-__v -passwordChangedAt',
   });
   next();
});

// toursSchema.pre('save', async function (next) {
//    const guidesPromises = this.guides.map(
//       async (id) => await User.findById(id)
//    );
//    this.guides = await Promise.all(guidesPromises);
// }); EMBEDDING USERS IN TOURS

/*eslint prefer-arrow-callback: 0*/
/* toursSchema.pre('save', function (next) {
   console.log('Will save document...');
   next();
});

toursSchema.post('save', function (doc, next) {
   console.log(doc);
   next();
}); */

// Creating a model. Here we use uppcase variabel

// Query middleware
// toursSchema.pre('find', function (next) {
toursSchema.pre(/^find/, function (next) {
   //all strings that starts with find
   this.find({ secretTour: { $ne: true } });

   this.start = Date.now();
   next();
});

toursSchema.post(/^find/, function (docs, next) {
   // console.log(docs);
   console.log(`Query took ${Date.now() - this.start} ms`);
   next();
});

// AGGREGATION MIDDLEWARE
// toursSchema.pre('aggregate', function (next) {
//    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//    console.log(this.pipeline());
//    next();
// });

const Tour = mongoose.model('Tour', toursSchema); //this creates the collection with the selected Schema)

module.exports = Tour;
