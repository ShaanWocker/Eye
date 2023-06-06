const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  active: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  }
});

const UserDB = mongoose.model('User', userSchema);

module.exports = UserDB;
