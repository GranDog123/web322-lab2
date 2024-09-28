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

app.use((req, res) => {
  res.status(404).send("Page Not Found");
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
