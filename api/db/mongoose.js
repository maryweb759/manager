// this file will handle connection login to mongodb database 

//Import the mongoose module
const mongoose = require('mongoose');
//Set up default mongoose connection
mongoose.Promise = global.Promise
const DB = 'mongodb://localhost:27017/taskManager';
mongoose.connect(DB, {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {
    console.log("connected to db successfully :) ");
}).catch((e) => {
    console.log("error on attempting to mongoDB");
}) ;


//Get the default connection

module.exports = {
    mongoose
}