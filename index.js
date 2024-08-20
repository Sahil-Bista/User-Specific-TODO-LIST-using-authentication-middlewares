const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const methodOverride = require("method-override");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const models = require("./src/models");
const databaseSeeder = require("./src/seeder/seeder");
const todoRouter = require("./src/route/route");

dotenv.config();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", databaseSeeder);

console.log("connection created");

app.use(todoRouter);
models.sequelize.sync().then((req) => {
  app.listen(port, (req, res) => {
    console.log(`App is listening on port ${port}`);
  });
});
