//jshint esversion:6
require('dotenv').config(); //environment variables
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const e = require('express');
//const GoogleStrategy = require('passport-google-oauth20').Strategy;


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
            password : String
        });

        userSchema.plugin(passportLocalMongoose);

        const User  = new mongoose.model("User", userSchema);

        passport.use(User.createStrategy());

        passport.serializeUser(User.serializeUser());
        passport.deserializeUser(User.deserializeUser());


        app.route("/")                                      //Home route
            .get((req, res) => {                    
                res.render("home");
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
                    res.render("secrets");
                }
                else {
                    res.redirect("/login");
                }
                
            });



        app.route("/submit")                                        //submit route
            .get((req, res) => {
                res.render("submit");
            });

    } catch (e) {
        console.log(e);

    } finally {
        app.listen(3000, function () {
            console.log("Server started on port 3000");
        });
    }
