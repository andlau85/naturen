dotenv.config({ path: './config.env' }); // routing env config.

const DB = process.env.DATABASE.replace(
   '<PASSWORD>',
   process.env.DATABASE_PASSWORD
);

mongoose
   .connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
   })
   .then(() => {
      console.log(`DB connection successful!`);
   });

// Setting up a Schema

const testTour = new Tour({
   //document instance
   name: 'The Park Camper',
   rating: 4.7,
   price: 997,
});

testTour
   .save()
   .then((doc) => {
      console.log(doc);
   })
   .catch((err) => {
      console.log(`error😢:`, err);
   }); // saving to db. Returns a promise to consume, then.. use it

const app = require('./app');

// console.log(app.get('env'));
console.log(process.env.NODE_ENV);

const port = process.env.PORT || 3000;
app.listen(port, () => {
   console.log(`App running on port ${port}`);
});
