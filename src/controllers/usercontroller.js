const express = require("express");
const app = express();
const path = require("path");
app.set("views", path.join(__dirname, "/views"));
const bcrypt = require("bcrypt");
const saltRounds = 10;
const models = require("../models");
const user = require("../models/user");
const User = models.user;
const todoModel = models.todo;
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { jwtDecode } = require("jwt-decode");
dotenv.config();

const getSignUpForm = (req, res) => {
  res.render("signup.ejs");
};

const signUpUser = async (req, res) => {
  let { username, pwd } = req.body;
  console.log("Signed up");
  const hashedPassword = await bcrypt.hash(pwd, saltRounds);
  if (!username || !hashedPassword) {
    return res.status(400).send("Username and password are required");
  }
  if (!hashedPassword) {
    return res.status(400).send("Password cannot be empty");
  }
  User.create({
    username: `${username}`,
    user_password: `${hashedPassword}`,
  }).catch((err) => {
    if (err) {
      console.log(err.message);
    }
  });
  res.render("login.ejs");
};

const getLoginForm = (req, res) => {
  res.render("login.ejs");
};

const loginUser = async (req, res) => {
  try {
    let { username, pwd } = req.body;
    if (!username || !pwd) {
      return res.status(400).send("Username and password are required");
    }
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.send("user unavailable");
    }
    const isPasswordValid = await bcrypt.compare(pwd, user.user_password);
    if (!isPasswordValid) {
      return res.send("invalid credentials");
    }
    const payload = {
      username: username,
      id: user.id,
    };
    const secret_key = process.env.Secret_Key;
    if (!secret_key) {
      return res.status(500).send("Secret key not configured");
    }
    const token = jwt.sign(payload, secret_key);
    res.cookie("token", token);
    res.redirect("/user/add");
  } catch (err) {
    res.send(err.message);
  }
};

const getForm = (req, res) => {
  res.render("Todo.ejs");
};

const addUser = async (req, res) => {
  try{
    const token = req.cookies.token;
    const decoded = jwtDecode(token);
    let id = decoded.id;
    const todo = req.body.activity;
    await todoModel.create({
    todo_task: `${todo}`,
    user_id: id
    });
  } catch (Err) {
    console.log(Err.message);
  }
  try {
    const token = req.cookies.token;
    const decoded = jwtDecode(token);
    let id = decoded.id;
    const result = await todoModel.findAll({ where: { user_id: `${id}` } });
    console.log({ result });
    res.render("list.ejs", { result });
  } catch (err) {
    console.error("Database error:", err); 
    res.status(500).send("There was an error with the database"); 
  }
};

const getEditForm = async (req, res) => {
  try{
  let { id } = req.params;
  const result = await todoModel.findAll({ where: { id: `${id}` } })
  let task = result[0];
  res.render("edit.ejs", { task });
  }catch(err){
    console.error("Database error:", err); 
    res.status(500).send("There was an error with the database"); 
  }
};

const updateTask = async (req, res) => {
  try{
  let { id } = req.params;
  let { edited_task } = req.body;
  await todoModel.update({ todo_task: `${edited_task}` }, { where: { id: id } })
  res.redirect("/user/add");  
  }catch(err){
    console.error("Database error:", err); 
    res.status(500).send("There was an error with the database"); 
  }  
};

const getDeleteForm = async (req, res) => {
  try{
  let { id } = req.params;
  const result= await todoModel
    .findAll({ where: { id: id } })
    let task = result[0];
    res.render("delete.ejs", { task });
  }catch(err){
      console.log(err.message);
      res.send("some error with DB");
  };
};

const deleteTask = async(req, res) => {
  try{
  let { id } = req.params;
  await todoModel.destroy({ where: { id: `${id}` } })
  res.redirect("/user/add");
  }catch(err){
    console.log(err.message);
    res.send("some error with DB");
  }
};

const Logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
  });
  res.redirect("/login");
};

const viewList = async (req, res) => {
  try {
    const token = req.cookies.token;
    const decoded = jwtDecode(token);
    let id = decoded.id;
    const result = await todoModel.findAll({ where: { user_id: id } });
    console.log(result);
    res.render("list.ejs", { result });
  } catch (err) {
    console.log(err.message);
  }
};

module.exports = {
  getSignUpForm,
  signUpUser,
  getLoginForm,
  loginUser,
  getForm,
  addUser,
  getEditForm,
  updateTask,
  getDeleteForm,
  deleteTask,
  viewList,
  Logout,
};
