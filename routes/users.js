const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/user", userController.user_sign_up);

router.post("/user/login", userController.user_login);

module.exports = router;
