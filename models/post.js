const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true, maxLength: 300 },
  content: { type: String, required: true, minLength: 100 },
  published: { type: Boolean, required: true, default: false },
  time_stamp: { type: Date, required: true, default: Date.now },
  last_updated: { type: Date, required: true, default: Date.now },
});

PostSchema.virtual("url").get(function () {
  return `/post/${this._id}`;
});

PostSchema.virtual("edited").get(function () {
  return this.time_stamp === this.last_updated;
});

module.exports = mongoose.model("Post", PostSchema);
