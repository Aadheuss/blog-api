const express = require("express");
const router = express.Router();

const postController = require("../controllers/postController");

router.post("/post", postController.post_create);

router.get("/post/:id", postController.post_get);

router.put("/post/:id", postController.post_update);

router.delete("/post/:id", postController.post_delete);

module.exports = router;
