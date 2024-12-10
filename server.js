/*********************************************************************************
*  WEB322 – Assignment 04
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part 
*  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: __________daniel park____________ Student ID: ____180465223__________ Date: ____10-05-2001____________
*
*  Vercel Web App URL: ________web322-project-livid.vercel.app________________________________________________
* 
*  GitHub Repository URL: ________________________________________https://github.com/GranDog123/web322-lab2______________
*
********************************************************************************/ 
const authData = require('./auth-service');
const clientSessions = require('client-sessions');
//auth-service
const express = require('express');
const path = require('path');
const app = express();
const storeService = require('./store-service'); 
const expressLayouts = require('express-ejs-layouts');
const helpers = require('./helpers');
const { getAllItems, getCategories } = require('./store-service');
const { engine } = require('express-handlebars');
const stripJs = require('strip-js');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const Sequelize = require('sequelize');

app.locals.helpers = helpers;

app.use(expressLayouts);
app.set('layout', 'partials/main');

const PORT = process.env.PORT || 8080;

// Set up view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

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



app.use(clientSessions({
    cookieName: "session", // the cookie name
    secret: "jiawnbsdgoinlisafngbkjl3298473857923125", // replace this with a strong secret key
    duration: 2 * 60 * 1000, // session duration in milliseconds (1 day)
    activeDuration: 1000 * 60, // extend session by 5 minutes if active
}));

app.use((req, res, next) => {
    res.locals.session = req.session; 
    next();
});


const sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'z8PgN5uZWjcD', {
    host: 'ep-misty-heart-a5kp6xpy.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
  });
  

  // Define a "Project" model
  
  const Project = sequelize.define('Project', {
    title: Sequelize.STRING,
    description: Sequelize.TEXT,
  });
  
  function ensureLogin(req, res, next) {
    if (!req.session.userName) {
        res.redirect("/login");
    } else {
        next();
    }
}

  // synchronize the Database with our models and automatically add the
  // table if it does not exist
  
  sequelize.sync().then(() => {
    // create a new "Project" and add it to the database
    Project.create({
      title: 'Project1',
      description: 'First Project',
    })
      .then((project) => {
        // you can now access the newly created Project via the variable project
        console.log('success!');
      })
      .catch((error) => {
        console.log('something went wrong!');
      });
  });

app.get('/about', (req, res) => {
    res.render('about', { layout: 'partials/main', title: "Daniel Park" });
});
app.get('/categories/add', ensureLogin, (req, res) => {
    res.render('addCategory', { layout: 'partials/main', title: "Add Category" });
});
app.post('/categories/add', ensureLogin, (req, res) => {
    storeService.addCategory(req.body)
        .then(() => {
            res.redirect('/categories');
        })
        .catch((err) => {
            console.error("Error adding category:", err);
            res.status(500).send("Unable to add category");
        });
});

app.get('/categories/delete/:id', ensureLogin, (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect('/categories');
        })
        .catch((err) => {
            console.error("Error deleting category:", err);
            res.status(500).send("Unable to Remove Category / Category not found");
        });
});

app.get('/items/delete/:id', ensureLogin, (req, res) => {
    storeService.deleteItemById(req.params.id)
        .then(() => {
            res.redirect('/items');
        })
        .catch((err) => {
            console.error("Error deleting item:", err);
            res.status(500).send("Unable to Remove Item / Item not found");
        });
});
  

app.get('/shop', (req, res) => {
    const category = req.query.category;
    let viewData = {};

    storeService.getCategories()
        .then(categories => {
            viewData.categories = categories;
            return storeService.getPublishedItems();
        })
        .then(items => {
            viewData.items = items;

            if (category) {
                return storeService.getPublishedItemsByCategory(category);
            } else {
                return storeService.getPublishedItems();
            }
        })
        .then(itemsByCategory => {
            viewData.itemsByCategory = itemsByCategory;

            if (req.query.id) {
                return storeService.getItemById(req.query.id);
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

    storeService.getCategories()
        .then(categories => {
            viewData.categories = categories;
            return storeService.getPublishedItems();
        })
        .then(items => {
            viewData.items = items;
            return storeService.getItemById(itemId);
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

app.get('/items', ensureLogin, (req, res) => {
    getAllItems()
        .then(data => {
            if (data && data.length > 0) {
                res.render('items', { items: data, title: 'Items List' });
            } else {
                res.render('items', { items: [], message: 'No results', title: 'Items List' });
            }
        })
        .catch(err => {
            console.error("Error fetching items: ", err);
            res.render('items', { items: [], message: 'No results', title: 'Items List' });
        });
});

app.get('/categories', ensureLogin, (req, res) => {
    getCategories()
        .then(data => {
            if (data && data.length > 0) {
                res.render('categories', { categories: data, title: 'Categories List' });
            } else {
                res.render('categories', { categories: [], message: 'No results', title: 'Categories List' });
            }
        })
        .catch(err => {
            console.error("Error fetching categories: ", err);
            res.render('categories', { categories: [], message: 'No results', title: 'Categories List' });
        });
});

app.get('/items/add', ensureLogin, (req, res) => {
    res.render('addItem', { layout: 'partials/main', title: "Daniel Park" });
});

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


app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Login',
        errorMessage: null, 
        userName: null 
    });
});



app.get('/register', (req, res) => {
    res.render('register', {
        title: 'Register',
        successMessage: null, 
        errorMessage: null, 
        userName: null 
    });
});


app.post('/register', (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.render('register', {
                title: 'Register',
                successMessage: 'User created', 
                errorMessage: null, 
                userName: null 
            });
        })
        .catch((err) => {
            res.render('register', {
                title: 'Register',
                successMessage: null, 
                errorMessage: err, 
                userName: req.body.userName 
            });
        });
});


app.post('/login', (req, res) => {
    req.body.userAgent = req.get('User-Agent'); 

    authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect('/items'); 
        })
        .catch((err) => {
            res.render('login', {
                title: 'Login',
                errorMessage: err, 
                userName: req.body.userName 
            });
        });
});


app.get('/logout', (req, res) => {
    req.session.reset(); 
    res.redirect('/'); 
});

app.get('/userHistory', ensureLogin, (req, res) => {
    res.render('userHistory', {
        user: req.session.user,
        title: 'User History'
    });
});


app.get('/item/:id', ensureLogin, (req, res) => {
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
    .then(authData.initialize)
    .then(function () {
        app.listen(PORT, () => {
            console.log(`Express http server listening on port ${PORT}`);
        });
    })
    .catch(function (err) {
        console.log("Unable to start server: " + err);
    });
