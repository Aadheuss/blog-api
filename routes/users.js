const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

router.post("/user", userController.user_sign_up);

router.post("/user/login", userController.user_login);

module.exports = router;
