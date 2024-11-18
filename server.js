


/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: __________daniel park____________ Student ID: ____180465223__________ Date: ____10-05-2001____________
*
*  Vercel Web App URL: ________https://vercel.com/dans-projects-b384ffa4/web322-lab2________________________________________________
* 
*  GitHub Repository URL: ________________________________________https://github.com/GranDog123/web322-lab2______________
*
********************************************************************************/ 



const express = require('express');
const path = require('path');
const app = express();
const storeService = require('./store-service'); 
const expressLayouts = require('express-ejs-layouts');
const helpers = require('./helpers');
const { getAllItems }  = require('./store-service');
const { getCategories }  = require('./store-service');
const { engine } = require('express-handlebars');
const stripJs = require('strip-js');
const itemData = require('./store-service');
app.locals.helpers = helpers;

app.use(expressLayouts);
app.set('layout', 'partials/main');

const PORT = process.env.PORT || 8080;

//app.engine('hbs', engine({
   // extname: 'hbs',
    //helpers: {
    //    safeHTML: function(context) {
      //      return stripJs(context);
     //   }
  //  }
//}));
//app.set('view engine', 'hbs');
//app.set('views', path.join(__dirname, 'views'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.locals.activeRoute = req.path;
    next();
});
app.use((req, res, next) => {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    app.locals.viewingCategory = req.query.category;
    next();
});

app.get('/', (req, res) => {
    res.redirect('/shop');
});

// Handle 404 errors
//app.use((req, res) => {
    //res.status(404).render('404', { title: '404 - Page Not Found' });
//});

app.get('/about', (req, res) => {
    res.render('about', { layout: 'partials/main', title: "Daniel Park" });
});

app.get('/items/add', (req, res) => {
    res.render('addItem', { layout: 'partials/main', title: "Daniel Park" });
});
  

app.get('/shop', (req, res) => {
    const category = req.query.category;
    let viewData = {};

    itemData.getCategories()
        .then(categories => {
            viewData.categories = categories;
            return itemData.getPublishedItems();
        })
        .then(items => {
            viewData.items = items;

            if (category) {
                return itemData.getPublishedItemsByCategory(category);
            } else {
                return itemData.getPublishedItems();
            }
        })
        .then(itemsByCategory => {
            viewData.itemsByCategory = itemsByCategory;

            if (req.query.id) {
                return itemData.getItemById(req.query.id);
            } else {
                return null;
            }
        })
        .then(item => {
            if (item) {
                viewData.item = item;
            }
            res.render('shop', { data: viewData, viewingCategory: category, title: "Shop - Daniel Park" });
        })
        .catch(err => {
            viewData.message = "An error occurred while fetching items or categories";
            res.render('shop', { data: viewData, title: "Shop - Error" });
        });
});

app.get('/shop/:id', (req, res) => {
    const itemId = req.params.id;
    let viewData = {};

    itemData.getCategories()
        .then(categories => {
            viewData.categories = categories;
            return itemData.getPublishedItems();
        })
        .then(items => {
            viewData.items = items;

            return itemData.getItemById(itemId);
        })
        .then(item => {
            if (item) {
                viewData.item = item;
            } else {
                viewData.message = "Item not found";
            }
            res.render('shop', { data: viewData, title: `Item Details - ${item ? item.title : "Not Found"}` });
        })
        .catch(err => {
            viewData.message = "An error occurred while fetching items or categories";
            res.render('shop', { data: viewData, title: "Shop - Error" });
        });
});

app.get('/items', (req, res) => {
    getAllItems()
        .then(data => {
            console.log("Fetched Items: ", data);

            if (data && data.length > 0) {
                res.render('items', { items: data, title: 'Items List' });
            } else {
                res.render('items', { items: [], message: 'No items available', title: 'Items List' });
            }
        })
        .catch(err => {
            console.error("Error fetching items: ", err);
            res.render('items', { items: [], message: 'No results', title: 'Items List' });
        });
});

app.get('/categories', (req, res) => {
    getCategories() 
        .then(data => {
            console.log("Fetched Categories: ", data);

            if (data && data.length > 0) {
                res.render('categories', { categories: data, title: 'Categories List' });
            } else {
                res.render('categories', { categories: [], message: 'No categories available', title: 'Categories List' });
            }
        })
        .catch(err => {
            console.error("Error fetching categories: ", err);
            res.render('categories', { categories: [], message: 'No results', title: 'Categories List' });
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