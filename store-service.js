const Sequelize = require('sequelize');

const sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'z8PgN5uZWjcD', {
    host: 'ep-misty-heart-a5kp6xpy.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

const Category = sequelize.define('Category', {
    category: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

const Item = sequelize.define('Item', {
    body: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    itemDate: {
        type: Sequelize.DATE,
        allowNull: false
    },
    featureImage: {
        type: Sequelize.STRING,
        allowNull: true
    },
    published: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    price: {
        type: Sequelize.DOUBLE,
        allowNull: false
    }
});

Item.belongsTo(Category, { foreignKey: 'category' });

module.exports.initialize = () => {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => {
                resolve('Database synced successfully');
            })
            .catch((err) => {
                reject('Unable to sync the database: ' + err);
            });
    });
};

module.exports.getAllItems = () => {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then((data) => {
                if (data.length > 0) {
                    resolve(data);
                } else {
                    reject('No results');
                }
            })
            .catch(() => {
                reject('No results returned');
            });
    });
};

module.exports.getPublishedItems = () => {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { published: true } })
            .then((data) => {
                if (data.length > 0) {
                    resolve(data);
                } else {
                    reject('No published items found');
                }
            })
            .catch(() => {
                reject('No published items found');
            });
    });
};

module.exports.getCategories = () => {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then((data) => {
                if (data.length > 0) {
                    resolve(data);
                } else {
                    reject('No results');
                }
            })
            .catch(() => {
                reject('No categories found');
            });
    });
};

module.exports.addItem = (itemData) => {
  return new Promise((resolve, reject) => {
      itemData.published = itemData.published ? true : false;

      for (let prop in itemData) {
          if (itemData[prop] === "") {
              itemData[prop] = null;
          }
      }

      itemData.itemDate = new Date();

      Item.create(itemData)
          .then(() => resolve())
          .catch((err) => reject("Unable to create item: " + err));
  });
};

module.exports.addCategory = (categoryData) => {
  return new Promise((resolve, reject) => {
      for (let prop in categoryData) {
          if (categoryData[prop] === "") {
              categoryData[prop] = null;
          }
      }

      Category.create(categoryData)
          .then(() => resolve())
          .catch((err) => reject("Unable to create category: " + err));
  });
};

module.exports.deleteCategoryById = (id) => {
    return new Promise((resolve, reject) => {
        Category.destroy({ where: { id: id } })
            .then((rowsDeleted) => {
                if (rowsDeleted > 0) {
                    resolve();
                } else {
                    reject('Category not found');
                }
            })
            .catch(() => {
                reject('Unable to delete category');
            });
    });
};

module.exports.deleteItemById = (id) => {
  return new Promise((resolve, reject) => {
    Item.destroy({ where: { id: id } })
      .then((rowsDeleted) => {
        if (rowsDeleted > 0) {
          resolve();
        } else {
          reject('Item not found');
        }
      })
      .catch(() => {
        reject('Unable to delete item');
      });
  });
};

module.exports.getItemsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { category: category } })
            .then((data) => {
                if (data.length > 0) {
                    resolve(data);
                } else {
                    reject('No results');
                }
            })
            .catch(() => {
                reject('No results returned');
            });
    });
};

module.exports.getItemsByMinDate = (minDateStr) => {
    return new Promise((resolve, reject) => {
        const { gte } = Sequelize.Op;
        Item.findAll({
            where: {
                itemDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        })
            .then((data) => {
                if (data.length > 0) {
                    resolve(data);
                } else {
                    reject('No results');
                }
            })
            .catch(() => {
                reject('No results returned');
            });
    });
};

module.exports.getItemById = (id) => {
    return new Promise((resolve, reject) => {
        Item.findByPk(id)
            .then((data) => {
                if (data) {
                    resolve(data);
                } else {
                    reject('No result returned');
                }
            })
            .catch(() => {
                reject('No result returned');
            });
    });
};

module.exports.getPublishedItemsByCategory = (category) => {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { published: true, category: category } })
            .then((data) => {
                if (data.length > 0) {
                    resolve(data);
                } else {
                    reject('No published items found for this category');
                }
            })
            .catch(() => {
                reject('No published items found for this category');
            });
    });
};
