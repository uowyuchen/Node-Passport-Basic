const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const User = require("./models/user");

const app = express();

// connect to DB
mongoose.connect("mongodb://localhost:27017/auth_demo_app", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
// 1. tell express to use express session
app.use(
  require("express-session")({
    secret: "english words",
    resave: false,
    saveUninitialized: false
  })
);

// 2. tell express to use passport
app.use(passport.initialize());
// 3. tell express to use passport session
app.use(passport.session());
// 3.1 有了这个，post login的passport.authenticate才好用，不然报错！！！！！！
passport.use(new LocalStrategy(User.authenticate()));
// 4. serialize user
// it's responsible for reading and taking the data from
// the session that's encode it and unecode it
passport.serializeUser(User.serializeUser());
// 5. deserialized user
passport.deserializeUser(User.deserializeUser());

//=====================
// Middleware 顺序很重要
//=====================
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

//=====================
// Routes
//=====================
app.get("/", (req, res) => {
  res.render("home");
});

app.get("/secret", isLoggedIn, (req, res) => {
  res.render("secret");
});

//=====================
// Sign up GET route
//=====================
app.get("/register", (req, res) => {
  res.render("register");
});
//=====================
// Sign up POST route
//=====================
app.post("/register", (req, res) => {
  // 拿到用户输入的username和password
  const { username, password } = req.body;
  // 注册：第一个参数new user object，第二个参数放入user输入的密码，
  // passportlocalMongoose自动加密（User.register就是plm提供的方法），
  // 第三个参数，成功的话就返回user，里面有username和被plm加密过的密码
  User.register(new User({ username: username }), password, (err, user) => {
    if (err) {
      console.log(err);
      return res.render("register");
    }
    // authenticate也是plm提供的方法。注册成功就到secret page
    passport.authenticate("local")(req, res, () => {
      res.redirect("/secret");
    });
  });
});
//=====================
// Log in GET route
//=====================
app.get("/login", (req, res) => {
  res.render("login");
});
//=====================
// Log in POST route
//=====================
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secret",
    failureRedirect: "/login"
  }),
  (req, res) => {}
);

//=====================
// Logout in GET route
//=====================
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.listen(process.env.PORT || 3001, process.env.IP, () => {
  console.log("server started......");
});
