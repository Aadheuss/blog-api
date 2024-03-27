const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const { verifyUserJWT, verifyTokenJWT } = require("../config/jwt");

const Post = require("../models/post");

exports.post_create = [
  body("title", "Title must not be empty")
    .trim()
    .isLength({ min: 1 })
    .isLength({ max: 300 })
    .withMessage("Title must not exceed 300 characters")
    .escape(),
  body("content", "Blog content must not be empty")
    .trim()
    .isLength({ min: 100 })
    .withMessage("Blog contain must contain a minimum of 100 characters")
    .escape(),
  body("published").optional({ values: "falsy" }).escape(),
  verifyTokenJWT,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({
        errors: errors.errors.map((object) => {
          return { msg: object.msg, path: object.path };
        }),
        message: "Failed to create post",
      });
    } else {
      if (req.user) {
        const post = new Post({
          title: req.body.title,
          content: req.body.content,
          author: req.user.user._id,
          published:
            typeof req.body.published === "boolean"
              ? req.body.published
              : JSON.parse(req.body.published),
        });

        await post.save();

        res.json({
          message: "Successfully created the post",
          link: `api/v1${post.url}`,
        });
      }
    }
  }),
];

exports.post_get = [
  asyncHandler(async (req, res, next) => {
    const post = await Post.findOne(
      { _id: req.params.id },
      "author title content time_stamp last_updated published"
    )
      .populate("author", "username")
      .exec();

    if (post === null) {
      const err = new Error("Post not found");
      err.status = 404;
      return next(err);
    }

    if (post.published) {
      return res.json({
        message: "Success",
        post: post,
      });
    }

    req.currentPost = post;
    next();
  }),
  verifyTokenJWT,
  asyncHandler(async (req, res, next) => {
    if (
      req.user &&
      req.user.user._id === req.currentPost.author._id.toString()
    ) {
      return res.json({
        message: "Success",
        post: req.currentPost,
      });
    }

    res.status(403).json({
      message: "Unauthorized",
    });
  }),
];

exports.post_update = [
  body("title", "Title must not be empty")
    .trim()
    .isLength({ min: 1 })
    .isLength({ max: 300 })
    .withMessage("Title must not exceed 300 characters")
    .escape(),
  body("content", "Blog content must not be empty")
    .trim()
    .isLength({ min: 100 })
    .withMessage("Blog contain must contain a minimum of 100 characters")
    .escape(),
  body("published").optional({ values: "falsy" }).escape(),
  verifyTokenJWT,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({
        errors: errors.errors.map((object) => {
          return { msg: object.msg, path: object.path };
        }),
        message: "Failed to update Post",
      });
    } else {
      if (req.user) {
        const currentPost = await Post.findById(req.params.id).exec();

        if (currentPost === null) {
          const err = new Error("Unauthorized");
          err.status = 403;
          return next(403);
        }

        if (req.user.user._id === currentPost.author.toString()) {
          const post = new Post({
            _id: req.params.id,
            title: req.body.title,
            content: req.body.content,
            author: req.user.user._id,
            published:
              typeof req.body.published === "boolean"
                ? req.body.published
                : JSON.parse(req.body.published),
            time_stamp: currentPost.time_stamp,
          });

          await post.save();

          res.json({
            message: "Successfully updated the post",
            link: `api/v1${post.url}`,
          });
        } else {
          res.status(403).json({
            message: "Unauthorized",
          });
        }
      }
    }
  }),
];

exports.post_delete = [
  verifyTokenJWT,
  asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id).exec();

    if (req.user && req.user.user._id === post.author.toString()) {
      return res.json({
        message: "Successfully deleted the post",
      });
    }

    res.status(403).json({
      message: "Unauthorized",
    });
  }),
];
