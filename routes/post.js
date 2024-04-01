const express = require("express");
const router = express.Router();

const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");

router.post("/post", postController.post_create);

router.get("/post/:id", postController.post_get);

router.put("/post/:id", postController.post_update);

router.delete("/post/:id", postController.post_delete);

router.get("/posts", postController.posts_get);

router.post("/post/:id/comment", commentController.comment_create);

router.get("/post/:id/comment/:commentid", commentController.comment_get);

router.put("/post/:id/comment/:commentid", commentController.comment_update);

router.delete("/post/:id/comment/:commentid", commentController.comment_delete);

router.get("/post/:id/comments", commentController.comments_get);

module.exports = router;
