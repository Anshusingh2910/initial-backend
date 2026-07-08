const express = require("express");
const { auth,roleAuth} = require("../middleware/authMiddleware");

const {
  addToCart,
  getCart,
  removeProduct,
  clearCart,
} = require("../controllers/cartController");


const app = express.Router();

app.post("/", auth,roleAuth("user"), addToCart);
app.get("/", auth,roleAuth("user"), getCart);
app.delete("/:productId", auth, roleAuth("user"), removeProduct);
app.delete("/", auth, roleAuth("user"), clearCart);

module.exports = app;