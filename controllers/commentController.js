const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const { verifyUserJWT, verifyTokenJWT } = require("../config/jwt");

const Comment = require("../models/comment");
const Post = require("../models/post");
const comment = require("../models/comment");

exports.comment_create = [
  body("text", "Comment must not be empty")
    .trim()
    .isLength({ min: 1 })
    .isLength({ max: 300 })
    .withMessage("Title must not exceed 300 characters")
    .escape(),
  verifyTokenJWT,
  asyncHandler(async (req, res, next) => {
    // Check valid ObjectId due to mongoose casting error
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      const err = new Error(
        "Failed to create comment because post doesn't exist"
      );
      err.status = 404;
      return next(err);
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const err = new Error("Failed to create comment");
      err.status = 422;
      err.details = errors.errors.map((object) => {
        return { msg: object.msg, path: object.path };
      });

      return next(err);
    }

    const post = await Post.findById(req.params.id).exec();

    if (post === null) {
      const err = new Error(
        "Failed to create comment because post doesn't exist"
      );
      err.status = 404;
      return next(err);
    }

    if (req.user) {
      const comment = new Comment({
        author: req.user.user._id,
        post: post._id,
        text: req.body.text,
      });

      await comment.save();

      return res.json({
        message: "successfully created the comment",
        data: {
          post: post,
          comment: comment,
        },
      });
    }

    const err = new Error("Forbidden");
    err.status = 403;
    next(err);
  }),
];
