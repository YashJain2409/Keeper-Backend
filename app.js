//jshint esversion:6
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const saltRounds = 10;
const app = express();
app.use(bodyParser.json());
mongoose.connect(
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0cm8n.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
);

// middleware.

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,auth-token"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE");
  next();
});

const fetchUser = function (req, res, next) {
  const token = req.header("auth-token");
  if (!token) res.send({ error: "authenticate using valid token" });
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.user = data.user;
    next();
  } catch (err) {
    // err
    res.send({ error: "authenticate using valid token" });
  }
};

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  notes: [
    {
      _id: String,
      title: String,
      content: String,
    },
  ],
});

const User = mongoose.model("User", userSchema);

app.post(
  "/register",
  body("email").isEmail(),
  body("password").isLength({
    min: 7,
  }),
  function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: "invalid values" });
      return;
    }
    User.findOne({ email: req.body.email }, function (err, docs) {
      if (err) res.status(400).send({ message: "some error occured" });
      if (docs) res.status(401).send({ message: "email exists" });
      else {
        bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
          const newUser = new User({
            email: req.body.email,
            password: hash,
          });
          newUser.save(function (err) {
            if (!err) console.log("user created");
            else res.send({ message: "some error occured" });
          });
          const data = {
            user: {
              id: newUser.id,
              email: newUser.email,
              password: newUser.password,
            },
          };
          const token = jwt.sign(data, process.env.JWT_SECRET);
          res.json({ token: token });
        });
      }
    });
  }
);

app.post("/login", function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email }, function (err, user) {
    if (err) res.status(400).send({ message: "some error occured" });
    if (!user) res.status(401).send({ message: "invalid credentials" });
    else {
      bcrypt.compare(password, user.password, function (err, result) {
        if (!result) res.status(401).send({ message: "invlaid credentials" });
        else {
          const data = {
            user: {
              id: user.id,
              email: user.email,
              password: user.password,
            },
          };
          const token = jwt.sign(data, process.env.JWT_SECRET);
          res.json({ token: token });
        }
      });
    }
  });
});

app.get("/notes/fetch", fetchUser, function (req, res) {
  console.log("dfsdsf");
  const findEmail = req.user.email;
  User.find({ email: findEmail }, function (err, user) {
    if (!err) {
      console.log(user);
      res.json(user[0].notes);
    }
  });
});

app.post("/notes/add", fetchUser, (req, res) => {
  User.updateOne(
    { email: req.user.email },
    {
      $push: {
        notes: {
          _id: req.body.id,
          title: req.body.title,
          content: req.body.content,
        },
      },
    },
    function (err, result) {
      if (!err) {
        res.send({ message: "successfully added notes" });
        console.log(result);
      }
    }
  );
});

app.delete("/notes/delete", fetchUser, function (req, res) {
  User.findByIdAndUpdate(
    req.user.id,
    {
      $pull: {
        notes: { _id: req.body.id },
      },
    },
    function (err, doc) {
      if (!err) {
        res.send({ message: "successfully deleted note" });
        console.log(doc);
      }
    }
  );
});

let port = process.env.PORT;
if (port == null || port == "") port = 3001;
app.listen(port, function () {
  console.log("listening on port 3001");
});
