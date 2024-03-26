const express = require("express");
const router = express.Router();

const userRouter = require("../routes/users");

router.use("/", userRouter);

module.exports = router;
