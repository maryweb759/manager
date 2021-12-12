const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { 
        type:  String, 
        require: true, 
        minLength: 1, 
        trim: true 
    }, 
    // listId make us able to know wich list this id belongs to 
    _listId : {
      type: mongoose.Types.ObjectId ,
      require: true, 
    }, 
    completed: {
      type: Boolean,
      default: false
  }
  }); 

  const Task = mongoose.model('Task', TaskSchema) 

  module.exports = {
      Task
  }