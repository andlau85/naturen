const fs = require('fs');
const express = require('express');
const app = express();
app.use(express.json());

// app.use(express.json());

// app.get('/', (req, res) => {
//   // get url
//   res
//     .status(200)
//     .json({ message: 'Hello from the server side!', app: `Natours` }); // status for errors
// });

// app.post('/', (req, res) => {
//   res.send(`You can post to this endpoint...`);
// });

const tours = JSON.parse(
   // makes it into JS object
   fs.readFileSync(
      `${__dirname}/dev-data/data/tours-simple.json`
   )
);

app.get('/api/v1/tours', (req, res) => {
   res.status(200).json({
      // send back to client
      status: 'success',
      results: tours.length,
      data: {
         tours: tours, //tours variabel is the data
      },
   });
});

app.get('/api/v1/tours/:id', (req, res) => {
   //express declares variabels with ":", så :id will be the variabel
   //id: will be a object, can be anything, like a variabel x or y. Must match the url to be used. Can use '/api/v1/tours/?:id' for it to be optinal.
   console.log(req.params); // shows the variabel / object

   const id = req.params.id * 1; // changing from string to number
   const tour = tours.find((el) => el.id === id);

   if (req.params.id > tours.length) {
      return res.status(404).json({
         status: 'fail',
         message: 'Invalid ID',
      });
   }

   res.status(200).json({
      // send back to client
      status: 'success',
      results: tours.length,
      data: {
         tour: 'Updated tour here...',
      },
   });
});

app.post('/api/v1/tours', (req, res) => {
   //we want to send the response back with data, but the data isnt automaticly tied to "res" so we need middleware. app.use(express.json()) || ;

   const newID = tours[tours.length - 1].id + 1; //finding last id and +1
   const newTour = Object.assign(
      { id: newID },
      req.body
   ); //adding the new id to the post request, combining them into one object.

   // res.send('Done sending!'); // needs a request to finish the response circle
   // console.log(tours);
   tours.push(newTour); //pushing the object into the tours array. []
   // console.log(tours);

   fs.writeFile(
      `${__dirname}/dev-data/data/tours-simple.json`,
      JSON.stringify(tours),
      (err) => {
         //Need to write the data to the file after getting the object.
         //arguments are data:tours and err: if something goes wrong
         //the data is a object and needs to be transformed to string (json).

         res.status(201).json({
            // 201 status for posting success
            status: 'success', // this only shows in reponse, not in the acutual file, just sending headers
            data: {
               tour: newTour,
            },
         });
      }
   );
});

// patch only updates the new elements and not the whole obj.
app.patch('/api/v1/tours/:id', (req, res) => {
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
});

app.delete('/api/v1/tours/:id', (req, res) => {
   const id = req.params.id * 1;
   if (id > tours.length) {
      return res.status(404).json({
         status: 'fail',
         message: 'Invalid ID',
      });
   }

   res.status(204).json({
      statys: 'success',
      data: null, // empty data when deleting
   });
});

const port = 3000;
app.listen(port, () => {
   console.log(`App running on port ${port}`);
});
