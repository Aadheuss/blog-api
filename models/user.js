const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  last_name: { type: String, required: true, maxLength: 100 },
  date_of_birth: { type: Date },
  username: { type: String, required: true, unique: true, maxLength: 60 },
  password: { type: String, required: true, maxLength: 60 },
});

module.exports = mongoose.model("User", UserSchema);
