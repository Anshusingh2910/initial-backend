const express = require("express");
const app = express.Router();

const {
  auth,
  roleAuth,
  adminTokenAuth,
} = require("../middleware/Authmiddleware");

const {
  register,
  login,
  dashboard,
  pendingSellers,
  approvedSellers,
  approveSeller,
  rejectSeller,
  blockUser,
  unblockUser,
  deleteProduct,
} = require("../controllers/adminController");

app.post("/register", adminTokenAuth, register);
app.post("/login", login);
app.get("/dashboard", auth, roleAuth("admin"), dashboard);
app.get("/pending-sellers", auth, roleAuth("admin"), pendingSellers);
app.get("/approved-sellers", auth, roleAuth("admin"), approvedSellers);
app.put("/approve/:id", auth, roleAuth("admin"), approveSeller);
app.put("/reject/:id", auth, roleAuth("admin"), rejectSeller);
app.put("/block/:id", auth, roleAuth("admin"), blockUser);
app.put("/unblock/:id", auth, roleAuth("admin"), unblockUser);
app.delete("/product/:id", auth, roleAuth("admin"), deleteProduct);

module.exports = app;
