const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const verifyCallback = async (username, password, done) => {
  try {
    const user = await User.findOne({ username: username });

    if (!user) {
      return done(null, false, { message: "Incorrect username" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      // passwords do not match
      return done(null, false, { message: "Incorrect password" });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
};

exports.verifyUserJWT = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      return res.status(400).json({ message: "Incorrect username" });
    }

    const match = await bcrypt.compare(req.body.password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    jwt.sign(
      { user: user },
      process.env.SECRET,
      { expiresIn: "3d" },
      (err, token) => {
        if (err) {
          return next(err);
        }
        req.token = token;
        next();
      }
    );
  } catch (err) {
    return next(err);
  }
};

exports.verifyTokenJWT = async (req, res, next) => {
  const bearerHeader = req.headers["authorization"];

  if (bearerHeader !== undefined) {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
    req.token = bearerToken;
    jwt.verify(req.token, process.env.SECRET, (err, authData) => {
      if (err) {
        res.status(403).json({ err });
      } else {
        const authShortData = {
          ...authData,
          user: {
            _id: authData.user._id,
            username: authData.user.username,
          },
        };

        res.json({
          message: "Authorized",
          authShortData,
        });
      }
    });
  } else {
    res.status(403).json({ message: "Unauthorized" });
  }
};
