const models = require("../models");
const user = require("../models/user");
const User = models.user;
const  bcrypt = require('bcrypt');
const saltRounds = 10;
const fs = require('fs');

async function databaseSeeder(req,res){
    User.count()
    .then((result) => {
        if (result >= 1){
            res.redirect('/signup');
            } 
    })
    .catch((err) => {
        console.error(err.message); // Log the error for debugging
        res.send("Some error occurred in the database");
    });

    const content = fs.readFileSync('./src/seeder/seed.json','utf-8');
    let parsedContent = JSON.parse(content)

    for (const item of parsedContent ){
        username = item.name,
        user_password = item.password
    }
    const hashedPassword = await bcrypt.hash( user_password, saltRounds);
   
    // console.log(username)
    User.create({
        username : `${username}`,
        user_password : `${hashedPassword}`
    }).catch((err)=>{
        console.log(err?.message);
        
    })
         res.redirect('/signup');
    };

module.exports = databaseSeeder;