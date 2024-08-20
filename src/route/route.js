const express = require('express');
const { getSignUpForm, signUpUser, getLoginForm, loginUser, getForm, addUser, getEditForm, updateTask, getDeleteForm, deleteTask, Logout, viewList } = require('../controllers/usercontroller');
const middleware = require('../middleware/authentication');

const todoRouter = express.Router();

todoRouter.get("/signup", getSignUpForm);

todoRouter.post("/signup", signUpUser);

todoRouter.get("/login", getLoginForm);

todoRouter.post("/login", loginUser);

todoRouter.get("/user/add", middleware, getForm);

todoRouter.post("/user/add", middleware, addUser);

todoRouter.get("/user/:id/edit", middleware, getEditForm);

todoRouter.patch("/user/:id", middleware, updateTask);

todoRouter.get("/user/:id/delete", middleware, getDeleteForm);

todoRouter.delete("/user/:id", middleware, deleteTask);

todoRouter.post("/logout", middleware, Logout);

todoRouter.get("/view", middleware, viewList); //await garaubne ani error catch garna lai try catch

module.exports = todoRouter;