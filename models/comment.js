const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  text: { type: String, required: true },
  time_stamp: { type: Date, required: true, default: Date.now },
  last_updated: { type: Date, required: true, default: Date.now },
});

CommentSchema.virtual("url").get(function () {
  return `/comment/${this._id}`;
});

CommentSchema.virtual("edited").get(function () {
  return this.time_stamp === this.last_updated;
});

module.exports = mongoose.model("Comment", CommentSchema);
