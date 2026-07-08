const bcrypt = require("bcrypt");
const User = require("../model/userModel");
const Seller = require("../model/sellerModel");
const Product = require("../model/productModel");
const Admin = require("../model/adminModel");
const ApiError = require("../Utilities/ApiError");
const jwt = require("jsonwebtoken")

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      throw new ApiError(400, "All fields are required");
    }

    const emailExist = await User.findOne({
      email: email.toLowerCase(),
    });

    if (emailExist) {
      throw new ApiError(400, "Email already exists");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email");
    }

    if (password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      throw new ApiError(400, "Invalid phone number");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashPassword,
      phone,
      role: "admin",
    });
    await Admin.create({
      user: user._id,
      isProfileCompleted: true,
    });

    res.status(201).json({
      status: true,
      message: "Admin registered successfully.",
      data: {
        id: user._id,
        name,
        email,
        phone,
      },
    });
  } catch (err) {
    next(err);
  }
};
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      throw new ApiError(404, "Admin not found");
    }

    if (user.role !== "admin") {
      throw new ApiError(403, "This account is not an admin");
    }

    const admin = await Admin.findOne({
      user: user._id,
    });

    if (!admin) {
      throw new ApiError(404, "Admin profile not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new ApiError(400, "Invalid credentials");
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.status(200).json({
      status: true,
      message: "Admin login successful",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};
const dashboard = async (req, res, next) => {
  try {
    const users = await User.countDocuments({ role: "user" });
    const sellers = await Seller.countDocuments();
    const products = await Product.countDocuments();

    res.status(200).json({
      status: true,
      message: "Dashboard fetched successfully",
      data: {
        users,
        sellers,
        products,
      },
    });
  } catch (err) {
    next(err);
  }
};

const pendingSellers = async (req, res, next) => {
  try {
    const sellers = await Seller.find({
      isApproved: false,
    }).populate("user", "-password -__v");

    res.status(200).json({
      status: true,
      message: "Pending sellers fetched successfully",
      total: sellers.length,
      data: sellers,
    });
  } catch (err) {
    next(err);
  }
};

const approvedSellers = async (req, res, next) => {
  try {
    const sellers = await Seller.find({
      isApproved: true,
    }).populate("user", "-password");

    res.status(200).json({
      status: true,
      message: "Approved sellers fetched successfully",
      total: sellers.length,
      data: sellers,
    });
  } catch (err) {
    next(err);
  }
};

const approveSeller = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      throw new ApiError(404, "Seller not found");
    }

    if (seller.isApproved) {
      throw new ApiError(400, "Seller is already approved");
    }

    seller.isApproved = true;

    await seller.save();

    res.status(200).json({
      status: true,
      message: "Seller approved successfully",
    });
  } catch (err) {
    next(err);
  }
};

const rejectSeller = async (req, res, next) => {
  try {
    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      throw new ApiError(404, "Seller not found");
    }

    if (!seller.isApproved) {
      throw new ApiError(400, "Seller is already rejected");
    }

    seller.isApproved = false;

    await seller.save();

    res.status(200).json({
      status: true,
      message: "Seller rejected successfully",
    });
  } catch (err) {
    next(err);
  }
};

const blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (user.isBlocked) {
      throw new ApiError(400, "User is already blocked");
    }

    user.isBlocked = true;

    await user.save();

    res.status(200).json({
      status: true,
      message: "User blocked successfully",
    });
  } catch (err) {
    next(err);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.isBlocked) {
      throw new ApiError(400, "User is already unblocked");
    }

    user.isBlocked = false;

    await user.save();

    res.status(200).json({
      status: true,
      message: "User unblocked successfully",
    });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    await product.deleteOne();

    res.status(200).json({
      status: true,
      message: "Product deleted successfully",
      data: {
        id: product._id,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
