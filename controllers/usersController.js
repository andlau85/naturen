const User = require('./../models/userModel');
const catchAsync = require('./../util/catchAsync');
const AppError = require('./../util/appError');
const factory = require('./handlerFacroty');
const multer = require('multer');
const sharp = require('sharp');

// disabling becous of resizing middleware
// const multerStorage = multer.diskStorage({
//    destination: (req, file, cb) => {
//       cb(null, 'public/img/users');
//    },
//    filename: (req, file, cb) => {
//       //user-352523as23-timestamp.jpeg
//       const ext = file.mimetype.split('/')[1];
//       cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//    },
// });

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

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
   if (!req.file) return next();
   req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
   // faster to resize in memory instead of writing first
   await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);
   // console.log('resized', 'stored', req.file);
   next();
});

const filterObj = (obj, ...allowedFields) => {
   const newObj = {};
   Object.keys(obj).forEach((el) => {
      if (allowedFields.includes(el)) newObj[el] = obj[el];
   });
   return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
   // Create error if user posts password data
   // console.log(req.file, req.body);
   if (req.body.password || req.body.passwordConfirm) {
      return next(
         new AppError(
            'This route is not for password updates. Please use /updateMyPassword.',
            400
         )
      );
   }

   // Update userdocument
   const filteredBody = filterObj(req.body, 'name', 'email');
   if (req.file) filteredBody.photo = req.file.filename;

   const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
   });

   res.status(200).json({
      status: 'success',
      data: {
         user: updatedUser,
      },
   });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
   await User.findByIdAndUpdate(req.user.id, { active: false });

   res.status(204).json({
      status: 'success',
      data: null,
   });
});

exports.createUser = (req, res) => {
   res.status(500).json({
      status: 'error',
      message: 'This route is not defined. Please use /signup instead.',
   });
};
exports.getMe = (req, res, next) => {
   req.params.id = req.user.id;
   next();
};
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
// Does not update password with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
