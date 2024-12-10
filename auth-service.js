const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const userSchema = new Schema({
    userName: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    loginHistory: [
        {
            dateTime: {
                type: Date,
                required: true
            },
            userAgent: {
                type: String,
                required: true
            }
        }
    ]
});

let User; 

module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection("mongodb+srv://dpark7448:U7aHDVcInFUrHwzq@cluster0.xd2bk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");

        db.on('error', (err) => {
            reject(err); 
        });
        db.once('open', () => {
            User = db.model("users", userSchema); 
            resolve(); 
        });
    });
};

module.exports.registerUser = function (userData) {
    return new Promise((resolve, reject) => {
        // Check if passwords match
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else {
            let newUser = new User(userData);
            newUser.save()
                .then(() => resolve()) 
                .catch((err) => {
                    if (err.code === 11000) {
                        reject("User Name already taken");
                    } else {
                        reject("There was an error creating the user: " + err);
                    }
                });
        }
    });
};

module.exports.checkUser = function (userData) {
    return new Promise((resolve, reject) => {
        User.find({ userName: userData.userName })
            .then((users) => {
                if (users.length === 0) {
                    reject("Unable to find user: " + userData.userName);
                } else {
                    let user = users[0]; 
                    if (user.password !== userData.password) {
                        reject("Incorrect Password for user: " + userData.userName);
                    } else {
                        user.loginHistory.push({
                            dateTime: new Date().toString(),
                            userAgent: userData.userAgent
                        });
                        User.updateOne(
                            { userName: user.userName },
                            { $set: { loginHistory: user.loginHistory } }
                        )
                            .then(() => resolve(user)) 
                            .catch((err) => {
                                reject("There was an error verifying the user: " + err);
                            });
                    }
                }
            })
            .catch(() => {
                reject("Unable to find user: " + userData.userName);
            });
    });
};
