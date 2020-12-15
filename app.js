//jshint esversion:6
require('dotenv').config(); //environment variables
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate =  require("mongoose-findorcreate");


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret : "My secret",
    resave : false,
    saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

    try {

        

        mongoose.connect('mongodb://localhost:27017/userDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        mongoose.set('useCreateIndex', true);


        //schema

        const userSchema = new mongoose.Schema({
            email : String,
            password : String,
            googleId : String
        });

        const secretSchema = new mongoose.Schema({
            userId : String,
            secret : String
        });

        const Secret = new mongoose.model("Secret", secretSchema);

        userSchema.plugin(passportLocalMongoose);
        userSchema.plugin(findOrCreate);

        const User  = new mongoose.model("User", userSchema);

        passport.use(User.createStrategy());

        passport.serializeUser(function(user, done) {
            done(null, user.id);
          });
          
          passport.deserializeUser(function(id, done) {
            User.findById(id, function(err, user) {
              done(err, user);
            });
          });

        passport.use(new GoogleStrategy({
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google/secrets",
            userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo" 
          },
          function(accessToken, refreshToken, profile, cb) {
            User.findOrCreate({ googleId: profile.id }, function (err, user) {
              return cb(err, user);
            });
          }
        ));


        app.route("/")                                      //Home route
            .get((req, res) => {                    
                res.render("home");
            });

        app.route("/auth/google")                                       // google auth route
        .get(passport.authenticate("google", {scope: ["profile"] }));

        app.route("/auth/google/secrets")                               //google auth redirect route
            .get(passport.authenticate('google', { failureRedirect: '/login' }),(req, res) => {
                res.redirect("/secrets");
            });

        app.route("/login")                                  //login route
            .get((req, res) => {
                res.render("login");
            })
            .post((req,res) => {
                    
                const user = new User({
                    username: req.body.username,
                    password: req.body.password
                });

                req.logIn(user, (err) => {
                    if(err){
                        console.log(err);    
                    }
                    else {
                        passport.authenticate("local") (req,res, () => {
                            res.redirect("/secrets");
                        });
                    }
                });
 
            });


        app.route("/logout")
            .get( (req,res) => {
                req.logOut();
                res.redirect("/");
            });

        app.route("/register")                                 //register route
            .get((req, res) => {
                res.render("register");
            })
            .post((req,res) => {
               
                User.register({username : req.body.username}, req.body.password, (err, user) => {
                   if(err){
                       console.log(err);
                       res.redirect("/register");
                   } else {
                       passport.authenticate("local")(req,res, () => {
                            res.redirect("/secrets");
                       })
                   }
                })

            });



        app.route("/secrets")                                   //secrets route
            .get((req, res) => {
                if(req.isAuthenticated()){
                    Secret.find({"secret" : {$ne : null}}, (err, foundSecrets) => {
                        if(err){
                            console.log(err);
                        }else if(foundSecrets){
                            res.render("secrets", {userSecrets : foundSecrets});
                        }
                    });
                   
                }
                else {
                    res.redirect("/login");
                }
                
            });



        app.route("/submit")                                        //submit route
            .get((req, res) => {
                if(req.isAuthenticated()){
                    res.render("submit");
                }
                else {
                    res.redirect("/login");
                }
                
            })
            .post((req,res) => {
                const submittedSecret = req.body.secret;
                const user = req.user.id;

                const newSecret = new Secret({
                    userId : user,
                    secret : submittedSecret
                });

                newSecret.save( () => {
                    res.redirect("/secrets");
                });
            });

    } catch (e) {
        console.log(e);

    } finally {
        app.listen(3000, function () {
            console.log("Server started on port 3000");
        });
    }
