const express = require("express");
const router = express.Router();

const userRouter = require("../routes/users");
const postRouter = require("../routes/post");

router.use("/", userRouter);
router.use("/", postRouter);

module.exports = router;
