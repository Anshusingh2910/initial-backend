const express = require("express");
const { auth, roleAuth } = require("../middleware/Authmiddleware");

const {
    placeOrder,
    placeBuyNowOrder,
    getMyOrders,
    getSingleOrder,
    cancelOrder,
    getSellerOrders,
    updateOrderStatus,
    getAllOrders,
    getOrderById,
} = require("../controllers/orderController");

const app = express.Router();

app.post("/add", auth, placeOrder);
app.post("/buy-now", auth, placeBuyNowOrder);
app.get("/", auth, getMyOrders);
app.get("/:id", auth, getSingleOrder);
app.put("/cancel/:id", auth, cancelOrder);
app.get("/seller", auth, roleAuth("seller"), getSellerOrders);
app.put("/status/:id", auth, roleAuth("seller"), updateOrderStatus);
app.get("/admin", auth, roleAuth("admin"), getAllOrders);
app.get("/admin/:id", auth, roleAuth("admin"), getOrderById);

module.exports = app;