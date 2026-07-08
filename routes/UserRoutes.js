const express = require("express");
const { register, login, profile, updateAddress } = require("../controllers/userController");
const { auth } = require("../middleware/Authmiddleware");

const app = express.Router();

app.post("/register", register);
app.post("/login", login);
app.get("/profile", auth, profile);
app.put("/address", auth, updateAddress);

module.exports = app;
