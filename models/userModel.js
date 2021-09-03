const crypto = require('crypto');
const mongoose = require('mongoose');
// const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// Creating User Schema

const userSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Pleave tell us your name!'],
   },
   email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'please provide a valid email'],
   },
   photo: { type: String, default: 'default.jpg' },
   role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
   },
   password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlenght: 8,
      select: false, // will never send back to client
   },
   passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      // This only works on .save() and. .create()
      validate: {
         validator: function (el) {
            return el === this.password;
         },
         message: 'Passwords are not the same!',
      },
   },
   passwordChangedAt: Date,
   passwordResetToken: String,
   passwordResetExpires: Date,
   active: {
      type: Boolean,
      default: true,
      select: false,
   },
});
// Password encrypting---------------------------------
userSchema.pre('save', async function (next) {
   // Only run this function if password was actually modified
   // this is document ( Userschema )
   if (!this.isModified('password')) return next();

   // Hash password with cost of 12
   this.password = await bcrypt.hash(this.password, 12);

   // Delete passwordConfirm from field
   this.passwordConfirm = undefined;
   next();
});

userSchema.pre('save', function (next) {
   if (!this.isModified('password') || this.isNew) return next();

   this.passwordChangedAt = Date.now() - 1000;
   next();
});
//----------------------------------------------------
userSchema.pre(/^find/, function (next) {
   // this points to current query
   this.find({ active: { $ne: false } }); // This adds the query

   next();
});

// Compairing encrypted password with login password
userSchema.methods.correctPassword = async function (
   candidatePassword,
   userPassword
) {
   return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
   if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
         this.passwordChangedAt.getTime() / 1000,
         10
      );
      // console.log(changedTimestamp, JWTTimestamp);
      return JWTTimestamp < changedTimestamp;
   }
   // False means NOT changed
   return false;
};

userSchema.methods.createPasswordResetToken = function () {
   const resetToken = crypto.randomBytes(32).toString('hex');

   this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
   // console.log({ resetToken }, this.passwordResetToken);
   this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
   return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
