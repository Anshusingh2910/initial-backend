const express = require("express");
const app = express.Router();

const { auth, roleAuth } = require("../middleware/AuthMiddleware");

const {
  register,
  login,
  profile,
  updateProfile,
  myProducts,
} = require("../controllers/sellerController");

app.post("/register", register);
app.post("/login", login);
app.get("/profile", auth, roleAuth("seller"), profile);
app.put("/profile", auth, roleAuth("seller"), updateProfile);
app.get("/products", auth, roleAuth("seller"), myProducts);

module.exports = app;