const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const { verifyUserJWT, verifyTokenJWT } = require("../config/jwt");

const Post = require("../models/post");
const { findOneAndDelete } = require("../models/user");

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
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const err = new Error("Failed to create post");
      err.status = 422;
      err.details = errors.errors.map((object) => {
        return { msg: object.msg, path: object.path };
      });

      return next(err);
    }

    next();
  }),
  verifyTokenJWT,
  asyncHandler(async (req, res, next) => {
    if (req.user) {
      const post = new Post({
        title: req.body.title,
        content: req.body.content,
        author: req.user.user._id,
        published:
          req.body.published !== undefined
            ? typeof req.body.published === "boolean"
              ? req.body.published
              : JSON.parse(req.body.published)
            : false,
      });

      await post.save();

      res.json({
        message: "Successfully created the post",
        data: { post, link: `api/v1${post.url}` },
      });
    }
  }),
];

exports.post_get = [
  asyncHandler(async (req, res, next) => {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      const err = new Error("Post not found");
      err.status = 404;
      return next(err);
    }

    const post = await Post.findOne({ _id: req.params.id }, "-__v")
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
        data: { post },
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
        data: { post: req.currentPost },
      });
    }

    const err = new Error("Forbidden");
    err.status = 403;
    next(err);
  }),
];

exports.post_update = [
  body("title", "Title must not be empty")
    .trim()
    .optional({ values: "falsy" })
    .isLength({ min: 1 })
    .isLength({ max: 300 })
    .withMessage("Title must not exceed 300 characters")
    .escape(),
  body("content", "Blog content must not be empty")
    .trim()
    .optional({ values: "falsy" })
    .isLength({ min: 100 })
    .withMessage("Blog contain must contain a minimum of 100 characters")
    .escape(),
  body("published").optional({ values: "falsy" }).escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const err = new Error("Failed to update user");
      err.status = 422;
      err.details = errors.errors.map((object) => {
        return { msg: object.msg, path: object.path };
      });

      return next(err);
    }

    next();
  }),
  verifyTokenJWT,
  asyncHandler(async (req, res, next) => {
    if (req.user) {
      if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        const err = new Error("Post not found");
        err.status = 404;
        return next(err);
      }

      const currentPost = await Post.findById(req.params.id).exec();

      if (currentPost === null) {
        const err = new Error("Post not found");
        err.status = 404;
        return next(err);
      }

      if (req.user.user._id === currentPost.author.toString()) {
        const post = new Post({
          _id: req.params.id,
          title: req.body.title || currentPost.title,
          content: req.body.content || currentPost.content,
          author: currentPost.author,
          published:
            req.body.published === undefined
              ? currentPost.published
              : typeof req.body.published === "boolean"
              ? req.body.published
              : JSON.parse(req.body.published),
          time_stamp: currentPost.time_stamp,
        });

        await Post.findByIdAndUpdate(req.params.id, post, {});

        res.json({
          message: "Successfully updated the post",
          data: { post, link: `api/v1${post.url}` },
        });
      } else {
        const err = new Error("Forbidden");
        err.status = 403;
        next(err);
      }
    }
  }),
];

exports.post_delete = [
  verifyTokenJWT,
  asyncHandler(async (req, res, next) => {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      const err = new Error("Post not found");
      err.status = 404;
      return next(err);
    }

    const post = await Post.findById(req.params.id).exec();

    if (post === null) {
      const err = new Error("Post not found");
      err.status = 404;
      return next(err);
    }

    if (req.user && req.user.user._id === post.author.toString()) {
      await Post.findOneAndDelete({ _id: req.params.id });

      return res.json({
        message: "Successfully deleted the post",
        data: { post },
      });
    }

    const err = new Error("forbidden");
    err.status = 403;
    next(err);
  }),
];

// Get all published posts
exports.posts_get = asyncHandler(async (req, res, next) => {
  const posts = await Post.find({ published: true }, "-__v")
    .populate("author", "username")
    .exec();

  if (!posts.length) {
    return res.json({
      message: "No post yet",
    });
  }

  return res.json({
    message: "Success",
    data: {
      posts: posts.map((post) => {
        return { post, link: `api/v1${post.url}` };
      }),
    },
  });
});
