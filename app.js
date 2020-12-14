//jshint esversion:6
//require('dotenv').config(); //environment variables
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const md5 = require('md5');
const bcrypt = require("bcrypt");
const saltRounds = 10;


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

        

        const User  = new mongoose.model("User", userSchema);


        app.route("/")                                      //Home route
            .get((req, res) => {                    
                res.render("home");
            });


             // const secret = process.env.SECRET;
            // userSchema.plugin(encrypt, {secret : secret, encryptedFields : ['password']});


        app.route("/login")                                  //login route
            .get((req, res) => {
                res.render("login");
            })
            .post(async (req,res) => {
                    const username = req.body.username;
                    const password = req.body.password;
                    await User.findOne({email : username}, (err, foundUser) => {
                        if(err){
                            console.log(err);
                        } else {
                            if(foundUser){
                                bcrypt.compare(password, foundUser.password, (err, result) => {
                                    if(result){
                                        res.render("secrets");
                                    }
                                    else  if(err){
                                        console.log(err);
                                    }
                                   
                                }); 
                            }
                           
                        }
                    });    //authentication
 
            });




        app.route("/register")                                 //register route
            .get((req, res) => {
                res.render("register");
            })
            .post((req,res) => {
                bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
                    if(err){
                        console.log(err);
                    }else {
                        const newUser = new User({
                            email : req.body.username,
                            password : hash
                        });
        
                       await  newUser.save((err) => {
                           if(err){
                               console.log(err);
                           }
                           else{
                                res.render("secrets");
                           }
                       }); 
                    }
                    
                });

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
        console.log(e);

    } finally {
        app.listen(3000, function () {
            console.log("Server started on port 3000");
        });
    }
