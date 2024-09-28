const fs = require('fs');
const path = require('path');

let items = [];
let categories = [];

module.exports.initialize = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, 'data', 'items.json'), 'utf8', (err, data) => {
      if (err) {
        reject("Unable to read items.json file");
        return;
      }

      try {
        items = JSON.parse(data);
      } catch (parseError) {
        reject("Error parsing items.json file");
        return;
      }

      fs.readFile(path.join(__dirname, 'data', 'categories.json'), 'utf8', (err, data) => {
        if (err) {
          reject("Unable to read categories.json file");
          return;
        }

        try {
          categories = JSON.parse(data);
        } catch (parseError) {
          reject("Error parsing categories.json file");
          return;
        }

        resolve("Data successfully initialized");
      });
    });
  });
};

module.exports.getAllItems = () => {
  return new Promise((resolve, reject) => {
    if (items.length > 0) {
      resolve(items);
    } else {
      reject("No items found");
    }
  });
};

module.exports.getPublishedItems = () => {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter(item => item.published === true);
    if (publishedItems.length > 0) {
      resolve(publishedItems);
    } else {
      reject("No published items found");
    }
  });
};

module.exports.getCategories = () => {
  return new Promise((resolve, reject) => {
    if (categories.length > 0) {
      resolve(categories);
    } else {
      reject("No categories found");
    }
  });
};
