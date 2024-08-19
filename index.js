const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const methodOverride = require("method-override");
const mysql = require('mysql2');
const { v4: uuidv4 } = require('uuid')
const fs = require("fs"); 
const { connect } = require("http2");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const  bcrypt = require('bcrypt');
const saltRounds = 10;
const {jwtDecode} = require('jwt-decode');
const { todo } = require("node:test");

dotenv.config();

app.set("view engine","ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const content = fs.readFileSync('./seeder/seed.json','utf-8');
let parsedContent = JSON.parse(content)

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'TODO',
    password: 'mysql@123'
})
console.log("connection created");

app.get('/', async (req, res)=>{
    parsedContent = parsedContent.map(el => {
        const { id,name,password } = el
        let userId = parseInt(id);
        const username = name;
        const user_password = password;
        return `(${userId}, '${username}', '${user_password}')`;
    });
    
    let userQuery = `
    INSERT INTO user (id, username, user_password) VALUES ${parsedContent};`;
    function db(){
        try{
            connection.execute(userQuery);
            console.log("Forst query successfully executed");
            // res.redirect("/signup");
        }catch(err){
            console.log('Error executing query');
        }
    }
    
    let readDB = 'SELECT COUNT(*) AS Count FROM user; '
    
    async function Databaseread(){
        return new Promise((res,rej)=>{
            connection.query(readDB,
                function (err, results) {
                    if (err) {
                        rej(err)
                        console.error('Error executing query:', err.message);
                        return;
                    }
                    const totalValues = results[0].Count;
                    res(totalValues)
                })
        })
    };
    let pendingPromise = Databaseread();
    await Databaseread().then((results)=>{
        console.log(results)
        if (results <= 1){
            console.log("Seed");
            db();
        }
        res.redirect('/signup');

    }
    )
});


app.get("/signup",(req,res)=>{
    res.render("signup.ejs");
})

app.post("/signup", async(req,res)=>{
    let {username,pwd} = req.body;
    console.log("Signed up");
    // res.render("login.ejs");
    const hashedPassword = await bcrypt.hash(pwd, saltRounds);
    
    let q = `INSERT INTO user (username, user_password) VALUES ('${username}', '${hashedPassword}')`;
    try{
        connection.query(q,(err,result)=>{
          if(err) throw err;
          console.log(result);
          res.redirect("/login");
        });
      }catch(err){
        console.log(err);
      }
})

app.get("/login",(req,res)=>{
    res.render("login.ejs");
})

app.post("/login", async (req,res)=>{
    let {username,pwd}=req.body;

    if (!username || !pwd) {
        return res.status(400).send("Username and password are required");
    }

    let q1 = `SELECT *FROM user WHERE username = '${username}'`;
    try{
        const result = await new Promise((resolve,reject) =>{
        connection.query(q1,(err,result)=>{
            if(err) return reject (err);
            resolve(result);
        })
        });
        const userforlogin = result[0];
        // console.log(userforlogin);
        if(!userforlogin){
            return res.send("user unavailable");
        }
        const isPasswordValid = await bcrypt.compare(pwd, userforlogin.user_password);
        if(!isPasswordValid){
            return res.send("invalid credentials");
        }
        const payload ={
            username : username,
            id:userforlogin.id
        }
        const secret_key = process.env.Secret_Key;
        if (!secret_key) {
            return res.status(500).send("Secret key not configured");
        }
        const token = jwt.sign(payload,secret_key);
        // console.log(token);
        res.cookie("token", token ,{ httpOnly:true,});
      
        res.redirect("/user/add");
        // return res.json({ msg: "user logged in", token: token });
    }catch(err){
        res.send("some error with DB");
    }
});

const middleware = (req,res,next)=>{
    // const authorization = req.headers.authorization;
    const authorization = req.cookies.token;
    console.log(authorization);
    if(!authorization){
        return res.send("Token not found");
    }
    // const token = authorization.split(" ");
    // const decoded_token = token[1];
    const decoded_token = authorization;
    if(!decoded_token){
        return res.send("Bearer token not present");
    }
    const secret_key = process.env.Secret_Key;
    let data;
    try{
        data = jwt.verify(decoded_token,secret_key);
    }catch(error){
        console.log(error.message);
        return res.send("Invalid token");
    }
    if(!data){
        return res.send("Forbidden request");
    }
    req.user = data.username;
    next();
}

app.get("/user/add",middleware,(req,res)=>{
    res.render("Todo.ejs");
})

app.post("/user/add",middleware,(req,res)=>{
    const token = req.cookies.token;
    const decoded = jwtDecode(token);
    let id = decoded.id;
    let {activity} = req.body;
    const todo = req.body.activity;
    let q =  `INSERT INTO TODO (todo_task, user_id) VALUES ('${todo}','${id}');`;
    try{
        connection.query(q,(err,result)=>{
            if(err) throw err;
        });
    }catch{
        console.log(err);
        res.send("some error in DB");
    }
    const selectQuery = 'SELECT * FROM TODO WHERE user_id = ?';
    connection.query(selectQuery, [id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Some error in DB");
      }
    //  console.log({todos:result});
      res.render("list.ejs", { todos :result });
});
});

app.get("/user/:id/edit",middleware,(req,res)=>{
    let{id} = req.params;
    let q = `SELECT *FROM todo WHERE id = '${id}'`;

    try{
        connection.query(q,(err,result)=>{
            if(err) throw err;
            let task  = result[0];
            res.render("edit.ejs",{task});
        })
    }catch(err){
        console.log(err.message);
        res.send("some error with DB");
    }
})

app.patch("/user/:id",middleware,(req,res)=>{
    let {id} = req.params;
    let {edited_task} = req.body;
    let q = `UPDATE todo 
            SET todo_task = '${edited_task}'
            WHERE id = '${id}'`;
    try{
        connection.query(q,(err,result)=>{
            if(err) throw err;
            res.redirect("/user/add");
        })
    }catch(err){
        console.log(err.message);
        res.send("error in db");
    }
});

app.post('/logout',middleware, (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
    });
    res.redirect('/login');
});

app.get('/view',middleware,(req,res)=>{
    const token = req.cookies.token;
    const decoded = jwtDecode(token);
    let id = decoded.id;
    const selectQuery = 'SELECT * FROM TODO WHERE user_id = ?';
    connection.query(selectQuery, [id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Some error in DB");
      }
    //  console.log({todos:result});
      res.render("list.ejs", { todos :result });
});
});

app.get("/user/:id/delete",middleware,(req,res)=>{
    let{id} = req.params;
    let q = `SELECT *FROM todo WHERE id = '${id}'`;

    try{
        connection.query(q,(err,result)=>{
            if(err) throw err;
            let task  = result[0];
            res.render("delete.ejs",{task});
        })
    }catch(err){
        console.log(err.message);
        res.send("some error with DB");
    }
});

app.delete("/user/:id", middleware,(req,res)=>{
    let {id} = req.params;
    let q = `DELETE FROM todo WHERE id = '${id}'`;
    try{
        connection.query(q,(err,result)=>{
            if(err) throw err;
            res.redirect("/user/add");
        })
    }catch(err){
        console.log(err.message);
        res.send("error in db");
    }
});

app.listen(port,(req,res)=>{
    console.log(`App is listening on port ${port}`);
});

