const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const { verifyUserJWT, verifyTokenJWT } = require("../config/jwt");

const Comment = require("../models/comment");
const Post = require("../models/post");

exports.comment_create = [
  body("text", "Comment must not be empty")
    .trim()
    .isLength({ min: 1 })
    .isLength({ max: 300 })
    .withMessage("Title must not exceed 300 characters")
    .escape(),
  asyncHandler(async (req, res, next) => {
    // Check valid ObjectId due to mongoose casting error
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      const err = new Error(
        "Failed to create comment because the post doesn't exist"
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
    next();
  }),
  verifyTokenJWT,
  asyncHandler(async (req, res, next) => {
    const post = await Post.findById(req.params.id)
      .populate("author", "username")
      .exec();

    if (post === null) {
      const err = new Error(
        "Failed to create comment because the post doesn't exist"
      );
      err.status = 404;
      return next(err);
    }

    if (req.user && post.published) {
      const comment = new Comment({
        author: req.user.user._id,
        post: post._id,
        text: req.body.text,
      });

      await comment.save();

      return res.json({
        message: "successfully created the comment",
        data: {
          post: { post, link: `api/v1${post.url}` },
          comment: { comment, link: `api/v1${post.url}${comment.url}` },
        },
      });
    }

    const msg = !post.published
      ? "Can't write comment on unpublished post!"
      : "forbidden";
    const err = new Error(msg);
    err.status = 403;
    next(err);
  }),
];

exports.comment_get = [
  verifyTokenJWT,
  asyncHandler(async (req, res, next) => {
    // Check valid ObjectId due to mongoose casting error
    if (
      !(
        req.params.commentid.match(/^[0-9a-fA-F]{24}$/) &&
        req.params.id.match(/^[0-9a-fA-F]{24}$/)
      )
    ) {
      const msg = !req.params.id.match(/^[0-9a-fA-F]{24}$/)
        ? "Can't find comment because post doesn't exist"
        : "Comments not found";
      const err = new Error(msg);
      err.status = 404;
      return next(err);
    }

    const post = await Post.findById(req.params.id)
      .populate("author", "username")
      .exec();
    const comment = await Comment.findById(req.params.commentid)
      .populate("author", "username")
      .exec();

    if (post === null || comment === null) {
      const msg =
        post === null
          ? "Can't find comment because post doesn't exist"
          : "Comment not found";
      const err = new Error(msg);
      err.status = 404;

      return next(err);
    }

    if (
      req.user &&
      (post.published || post.author._id.toString() === req.user.user._id)
    ) {
      return res.json({
        message: "Success",
        data: {
          comment: comment,
          post: {
            post,
            link: `api/v1${post.url}`,
          },
        },
      });
    }

    const msg = !post.published
      ? "Can't get comments on unpublished post unless you are the author!"
      : "forbidden";
    const err = new Error(msg);
    err.status = 403;
    next(err);
  }),
];

exports.comment_update = [
  body("text", "Comment must not be empty")
    .trim()
    .isLength({ min: 1 })
    .isLength({ max: 300 })
    .withMessage("Title must not exceed 300 characters")
    .escape(),
  asyncHandler(async (req, res, next) => {
    // Check valid ObjectId due to mongoose casting error
    if (
      !(
        req.params.commentid.match(/^[0-9a-fA-F]{24}$/) &&
        req.params.id.match(/^[0-9a-fA-F]{24}$/)
      )
    ) {
      const msg = !req.params.id.match(/^[0-9a-fA-F]{24}$/)
        ? "Can't update comment because post doesn't exist"
        : "Comments not found";
      const err = new Error(msg);
      err.status = 404;
      return next(err);
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const err = new Error("Failed to update comment");
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
    const post = await Post.findById(req.params.id)
      .populate("author", "username")
      .exec();
    const comment = await Comment.findById(req.params.commentid)
      .populate("author", "username")
      .exec();

    if (post === null || comment === null) {
      const msg =
        post === null
          ? "Can't update comment because post doesn't exist"
          : "Comment not found";
      const err = new Error(msg);
      err.status = 404;

      return next(err);
    }

    if (
      req.user &&
      post.published &&
      comment.author._id.toString() === req.user.user._id
    ) {
      const editedComment = new Comment({
        _id: comment._id,
        author: comment.author._id,
        post: comment.post,
        text: req.body.text,
        time_stamp: comment.time_stamp,
      });

      await Comment.findByIdAndUpdate(req.params.commentid, editedComment, {});
      return res.json({
        message: "Successfully updated the comment",
        data: {
          comment: {
            comment,
            link: `api/v1${post.url}${comment.url}`,
          },
          post: {
            post,
            link: `api/v1${post.url}`,
          },
        },
      });
    }

    const msg = !post.published
      ? "Can't edit comment on unpublished post!"
      : "forbidden";

    const err = new Error(msg);
    err.status = 403;
    next(err);
  }),
];

exports.comment_delete = [
  verifyTokenJWT,
  asyncHandler(async (req, res, next) => {
    // Check valid ObjectId due to mongoose casting error
    if (
      !(
        req.params.commentid.match(/^[0-9a-fA-F]{24}$/) &&
        req.params.id.match(/^[0-9a-fA-F]{24}$/)
      )
    ) {
      const msg = !req.params.id.match(/^[0-9a-fA-F]{24}$/)
        ? "Can't delete comment because post doesn't exist"
        : "Comments not found";
      const err = new Error(msg);
      err.status = 404;
      return next(err);
    }

    const post = await Post.findById(req.params.id)
      .populate("author", "username")
      .exec();
    const comment = await Comment.findById(req.params.commentid)
      .populate("author", "username")
      .exec();

    if (post === null || comment === null) {
      const msg =
        post === null
          ? "Can't delete comment because post doesn't exist"
          : "Comment not found";
      const err = new Error(msg);
      err.status = 404;

      return next(err);
    }

    if (
      req.user &&
      post.published &&
      comment.author._id.toString() === req.user.user._id
    ) {
      await Comment.findByIdAndDelete(req.params.commentid);

      return res.json({
        message: "Successfully deleted the comment",
        data: {
          comment: {
            comment,
            link: `api/v1${post.url}${comment.url}`,
          },
          post: {
            post,
            link: `api/v1${post.url}`,
          },
        },
      });
    }

    const msg = !post.published
      ? "Can't delete comment on unpublished post!"
      : "forbidden";

    const err = new Error(msg);
    err.status = 403;
    next(err);
  }),
];

exports.comments_get = [
  verifyTokenJWT,
  asyncHandler(async (req, res, next) => {
    // Check valid ObjectId due to mongoose casting error
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      const err = new Error("Can't find comments because post doesn't exist");
      err.status = 404;
      return next(err);
    }

    const post = await Post.findById(req.params.id)
      .populate("author", "username")
      .exec();
    const comments = await Comment.find({ post: req.params.id })
      .populate("author", "username")
      .exec();

    if (post === null) {
      const err = new Error("Can't find comments because post doesn't exist");
      err.status = 404;

      return next(err);
    }

    if (
      (req.user && post.published) ||
      post.author._id.toString() === req.user.user._id
    ) {
      return res.json({
        message: "Success",
        data: {
          post: {
            post,
            link: `api/v1${post.url}`,
          },
          comments:
            comments.length > 0
              ? comments.map((comment) => {
                  return { comment, link: `api/v1${post.url}${comment.url}` };
                })
              : [],
        },
      });
    }

    const msg = !post.published
      ? "Can't get comments on unpublished post unless you are the author!"
      : "forbidden";

    const err = new Error(msg);
    err.status = 403;
    next(err);
  }),
];
