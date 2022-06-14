const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const passportLocal = require("passport-local").Strategy;
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();
const User = require("./user");
const jwt = require("jsonwebtoken");
const config = require("config");
const path = require("path");
const fs = require("fs");

mongoose.connect(
  "mongodb+srv://test:test123@cluster0.nv5pcbi.mongodb.net/?retryWrites=true&w=majority",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("Mongoose Is Connected");
  }
);

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true,
  })
);
app.use(
  session({
    secret: "secretcode",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(cookieParser("secretcode"));
app.use(passport.initialize());
app.use(passport.session());
require("./passportConfig")(passport);


app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) throw err;
    if (!user) res.status(400).send("No User Exists");
    else {
      req.logIn(user, (err) => {
        if (err) throw err;
        const data = { userId: req.user._id };
        console.log(req.user);
        res.send(data);
      });
    }
  })(req, res, next);
});
app.post("/register", (req, res) => {
  User.findOne({ username: req.body.username }, async (err, doc) => {
    console.log(err);
    if (err) throw err;
    if (doc) res.status(400).send("User Already Exists");
    if (!doc) {
      console.log("craete user");
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      const newUser = new User({
        username: req.body.username,
        password: hashedPassword,
      });
      const user = await newUser.save();
      console.log(user);
      res.send({ userId: user._id });
    }
  });
});
app.post("/getfile", (req, res, next) => {
  const { userId } = req.body;
  console.log(userId);
  if (!userId) {
    return res.status(400).send("Missing query data");
  }
  User.findById(userId)
    .then((user) => {
      if (!user) {
        return res.status(400).send("No user found");
      }

      console.log("userrrr", user);

      let userData = {
        username: user.username,
        userId: userId,
      };

      fs.writeFile(`user-${userId}.txt`, JSON.stringify(userData), (err) => {
        if (err) {
          return res.status(400).send("Error writing user");
        }

        userData = {
          ...userData, 
          dataUpdateAt: Date.now(),
        };
    
        return res.send({ user: userData });
      });
    })
    .catch((err) => {
      return next(err);
    });
});
app.get("/user", (req, res) => {
  res.send(req.user);
});

app.listen(4000, () => {
  console.log("Server Has Started");
});
