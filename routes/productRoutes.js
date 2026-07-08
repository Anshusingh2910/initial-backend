const express = require("express");
const app = express.Router();
const { auth, roleAuth, upload, } = require("../middleware/authMiddleware");

const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
app.post("/", auth, roleAuth("seller"), upload.single("image"), addProduct);
app.get("/", getProducts);
app.put("/:id", auth, roleAuth("seller"), updateProduct);
app.delete("/:id", auth, roleAuth("seller", "admin"), deleteProduct);
module.exports = app;