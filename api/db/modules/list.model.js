var mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
    title: { 
        type:  String, 
        require: true, 
        minLength: 1, 
        trim: true 
    }, 
    // with auth 
    _userId: {
        type: mongoose.Types.ObjectId,
        required: true
    }

  }); 

  const List = mongoose.model('List', ListSchema) 

  module.exports = {
      List 
  }