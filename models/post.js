const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, minLength: 100, required: true },
  published: { type: Boolean, required: true, default: false },
  time_stamp: { type: Date, required: true, default: Date.now },
});

module.exports = mongoose.model("Post", PostSchema);
