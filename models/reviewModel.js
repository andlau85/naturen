const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
   {
      review: {
         type: String,
         required: [true, 'A review must have a content'],
      },
      rating: {
         type: Number,
         min: 1,
         max: 5,
      },
      createdAt: {
         type: Date,
         default: Date.now(),
      },
      tour: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'Tour',
         required: [true, 'A tour must be specified.'],
      },
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: [true, 'The review must have a author.'],
      },
   },
   {
      toJSON: { virtuals: true },

      toObject: { virtuals: true },
      //second parameter of schema function
   }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
   this.populate({ path: 'user', select: 'name photo' }); //.populate({
   //    path: 'tour',
   //    select: 'name',
   // });
   next();
});

// Static method
reviewSchema.statics.calcAverageRatings = async function (tourId) {
   const stats = await this.aggregate([
      // This points to model
      {
         $match: { tour: tourId }, // selecting only the tour we want to update
      },
      {
         $group: {
            // group for calculating the stats
            _id: '$tour', // common field we want to group by
            nRating: { $sum: 1 }, // adds 1 per matched document
            avgRating: { $avg: '$rating' }, // avg of name of field rating
         },
         // Finds all reviews with tour ID on Review database. Groups them and calc with build in avg "method".
         // does this for earch documents and groups to one.
      },
   ]);
   if (stats.length > 0) {
      await Tour.findByIdAndUpdate(tourId, {
         ratingsQuantity: stats[0].nRating,
         ratingsAverage: stats[0].avgRating,
      });
   } else {
      await Tour.findByIdAndUpdate(tourId, {
         ratingsQuantity: 0,
         ratingsAverage: 4.5,
      });
   }
};

reviewSchema.post('save', function () {
   // this points to current review
   this.constructor.calcAverageRatings(this.tour);
   // post does not have access to next
});

//Post middleware will get the doc as the first argument. So the post middleware will get the updated review as an argument.
reviewSchema.post(/^findOneAnd/, async (doc) => {
   if (doc) {
      await doc.constructor.calcAverageRating(doc.tour);
   }
});

const Review = mongoose.model('Review', reviewSchema); //this creates the collection with the selected Schema)
module.exports = Review;
