//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt =  require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

    try {

        mongoose.connect('mongodb://localhost:27017/userDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });


        //schema

        const userSchema = new mongoose.Schema({
            email : String,
            password : String
        });

        const secret = process.env.SECRET;
        userSchema.plugin(encrypt, {secret : secret, encryptedFields : ['password']});

        const User  = new mongoose.model("User", userSchema);


        app.route("/")                                      //Home route
            .get((req, res) => {                    
                res.render("home");
            });




        app.route("/login")                                  //login route
            .get((req, res) => {
                res.render("login");
            })
            .post( async(req,res) => {
                const username = req.body.username;
                const password = req.body.password;

                await User.findOne({email : username, password : password}) && res.render("secrets");   //authentication
            });




        app.route("/register")                                 //register route
            .get((req, res) => {
                res.render("register");
            })
            .post( async (req,res) => {
                const newUser = new User({
                    email : req.body.username,
                    password : req.body.password
                });

               await  newUser.save() &&  res.render("secrets");

            });



        app.route("/secrets")                                   //secrets route
            .get((req, res) => {
                res.render("secrets");
            });



        app.route("/submit")                                        //submit route
            .get((req, res) => {
                res.render("submit");
            });

    } catch (e) {

    } finally {
        app.listen(3000, function () {
            console.log("Server started on port 3000");
        });
    }
