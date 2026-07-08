const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../model/userModel");
const Seller = require("../model/sellerModel");
const Product = require("../model/productModel");
const ApiError = require("../Utilities/ApiError");
const { timeStamp } = require("node:console");

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      throw new ApiError(400, "All fields are required");
    }

    const emailExist = await User.findOne({ email });

    if (emailExist) {
      throw new ApiError(400, "Email already exists");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashPassword,
      phone,
      role: "seller",
    });

    await Seller.create({
      user: user._id,
      isApproved: false,
      isProfileCompleted: false,
    });

    res.status(201).json({
      status: true,
      message: "Seller registered successfully. Wait for admin approval.",
      data: {
        name,
        email,
        password: hashPassword,
        phone,
        timeStamp,
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

    const user = await User.findOne({ email });

    if (!user) {
      throw new ApiError(404, "Seller not found");
    }

    if (user.role !== "seller") {
      throw new ApiError(403, "This account is not a seller");
    }

    const seller = await Seller.findOne({ user: user._id });

    if (!seller) {
      throw new ApiError(404, "Seller profile not found");
    }

    if (!seller.isApproved) {
      throw new ApiError(403, "Your seller account is pending admin approval");
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
      message: "Seller login successful",
      token,
    });
  } catch (err) {
    next(err);
  }
};

const profile = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({
      user: req.user._id,
    }).populate("user", "-password");

    if (!seller) {
      throw new ApiError(404, "Seller not found");
    }

    res.status(200).json({
      status: true,
      data: seller,
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const seller = await Seller.findOne({
      user: req.user._id,
    });

    if (!seller) {
      throw new ApiError(404, "Seller not found");
    }

    seller.shopName = req.body.shopName;
    seller.gstNumber = req.body.gstNumber;
    seller.businessAddress = req.body.businessAddress;
    seller.bankAccount = req.body.bankAccount;
    seller.ifscCode = req.body.ifscCode;


    await seller.save();

    res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      data: seller,
    });
  } catch (err) {
    next(err);
  }
};

const myProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      seller: req.seller._id,
    });

    res.status(200).json({
      status: true,
      totalProducts: products.length,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  profile,
  updateProfile,
  myProducts,
};
