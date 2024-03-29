const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { verifyUserJWT } = require("../config/jwt");
const { verifyTokenJWT } = require("../config/jwt");

const User = require("../models/user");

// Create a User
exports.user_sign_up = [
  body("first_name", "First name must not be empty")
    .trim()
    .isLength({ min: 1 })
    .isLength({ max: 100 })
    .withMessage("First name must be less than 100 characters")
    .escape()
    .isAlpha()
    .withMessage("First name must only contain alphabetical letters"),
  body("last_name", "Last name must not be empty")
    .trim()
    .isLength({ min: 1 })
    .isLength({ max: 100 })
    .withMessage("Last name must be less than 100 characters")
    .escape()
    .isAlpha()
    .withMessage("Last name must only contain alphabetical letters"),
  body("date_of_birth", "Invalid date of birth")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("username", "Username must not be empty")
    .trim()
    .isLength({ min: 1 })
    .isLength({ max: 60 })
    .withMessage("Username must be less than 60 characters")
    .isAlphanumeric()
    .withMessage("username name must only contain letters and numbers")
    .escape()
    .custom(async (value, { req }) => {
      const usernameExist = await User.findOne({ username: value });

      if (usernameExist) {
        throw new Error("Username is already taken");
      }
    }),
  body("password", "Password must not be empty")
    .trim()
    .isLength({ min: 1 })
    .isLength({ max: 60 })
    .withMessage("Password must be less than 60 characters")
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const err = new Error("Failed to create user");
      err.status = 422;
      err.details = errors.errors.map((object) => {
        return { msg: object.msg, path: object.path };
      });

      next(err);
    } else {
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        if (err) {
          return next(err);
        }

        const user = new User({
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          date_of_birth: req.body.date_of_birth,
          username: req.body.username,
          password: hashedPassword,
        });

        await user.save();
        res.json({
          message: "Successfully created the user",
        });
      });
    }
  }),
];

exports.user_login = [
  body("username", "Please enter your username")
    .trim()
    .isLength({ min: 1 })
    .isLength({ max: 60 })
    .withMessage("Username must be less than 60 characters")
    .isAlphanumeric()
    .withMessage("Username name must only contain letters and numbers")
    .escape(),
  body("password", "Please enter your password")
    .trim()
    .isLength({ min: 1 })
    .isLength({ max: 60 })
    .withMessage("Password must be less than 60 characters")
    .escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const err = new Error("Failed to log in");
      err.status = 422;
      err.details = errors.errors.map((object) => {
        return { msg: object.msg, path: object.path };
      });

      return next(err);
    }

    next();
  }),
  verifyUserJWT,
  asyncHandler(async (req, res, next) => {
    res.json({
      message: "Successfully logged in",
      token: req.token,
    });
  }),
];
