const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  comment: { type: String, required: true },
  time_stamp: { type: Date, required: true, default: Date.now },
});

module.exports = mongoose.model("Comment", CommentSchema);
