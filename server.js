/**
* WEB322 - Assignment 2
* I declare that this assignment is my own work in accordance with Seneca Academic Policy.
* No part of this assignment has been copied manually or electronically from any other source
* (including web sites and friends) or distributed to other students.
* I understand that if caught doing so, I will receive zero on this assignment and possibly
* fail the entire course.
* Name: Daniel Park
* Student ID: 180465223
* Date: sep 17
* Vercel Web App URL: web-322-murex.vercel.app
* GitHub Repository URL: https://github.com/GranDog123/WEB322
**/

const express = require('express');
const path = require('path');
const app = express();
const storeService = require('./store-service'); 

const PORT = process.env.PORT || 8080;

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect('/about');
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/shop', (req, res) => {
  storeService.getPublishedItems()
    .then((publishedItems) => {
      res.json(publishedItems);
    })
    .catch((err) => {
      res.status(500).json({ message: err });
    });
});

app.get('/items', (req, res) => {
  storeService.getAllItems()
    .then((items) => {
      res.json(items);
    })
    .catch((err) => {
      res.status(500).json({ message: err });
    });
});

app.get('/categories', (req, res) => {
  storeService.getCategories()
    .then((categories) => {
      res.json(categories);
    })
    .catch((err) => {
      res.status(500).json({ message: err });
    });
});

app.get('/items/add', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'addItem.html'));
});


const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
    cloud_name: 'dep7fzcsy',
    api_key: '522868689755847',
    api_secret: 'X4pdI7kJByaPGKB218GvRAF4C2w',
    secure: true
});

const upload = multer();

app.post('/items/add', upload.single('featureImage'), (req, res) => {
  if (req.file) {
      let streamUpload = (req) => {
          return new Promise((resolve, reject) => {
              let stream = cloudinary.uploader.upload_stream((error, result) => {
                  if (result) {
                      resolve(result);
                  } else {
                      reject(error);
                  }
              });

              streamifier.createReadStream(req.file.buffer).pipe(stream);
          });
      };

      async function upload(req) {
          let result = await streamUpload(req);
          console.log(result);
          return result;
      }

      upload(req).then((uploaded) => {
          processItem(uploaded.url);
      }).catch((err) => {
          console.error("Upload error:", err);
          res.status(500).send("Image upload failed");
      });
  } else {
      processItem("");
  }

  function processItem(imageUrl) {
    req.body.featureImage = imageUrl;

    storeService.addItem(req.body)
        .then(() => {
            res.redirect('/items');
        })
        .catch((err) => {
            console.error("Error adding item:", err);
            res.status(500).json({ message: "Failed to add item" });
        });
}
});

app.get('/items', (req, res) => {
  if (req.query.category) {
      storeService.getItemsByCategory(req.query.category)
          .then((filteredItems) => res.json(filteredItems))
          .catch((err) => res.status(500).json({ message: err }));
  } else if (req.query.minDate) {
      storeService.getItemsByMinDate(req.query.minDate)
          .then((filteredItems) => res.json(filteredItems))
          .catch((err) => res.status(500).json({ message: err }));
  } else {
      storeService.getAllItems()
          .then((items) => res.json(items))
          .catch((err) => res.status(500).json({ message: err }));
  }
});

app.get('/item/:id', (req, res) => {
  storeService.getItemById(req.params.id)
      .then((item) => {
          if (item) {
              res.json(item);
          } else {
              res.status(404).json({ message: "Item not found" });
          }
      })
      .catch((err) => res.status(500).json({ message: err }));
});



storeService.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Express http server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`Unable to initialize data: ${err}`);
  });