const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/userModel");
const ApiError = require("../Utilities/ApiError");

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      throw new ApiError(400, "All fields are required");
    }

    const userExist = await User.findOne({ email });

    if (userExist) {
      throw new ApiError(400, "Email already registered");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashPassword,
      phone,
    });

    res.status(201).json({
      status: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
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
      throw new ApiError(404, "User not found");
    }

    if (user.isBlocked) {
      throw new ApiError(403, "Your account has been blocked");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
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
      message: "Login successful",
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
const updateAddress = async (req, res, next) => {
  try {
    const {
      fullName,
      houseNo,
      area,
      city,
      state,
      country,
      pincode,
    } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    user.address = {
      fullName,
      houseNo,
      area,
      city,
      state,
      country: country || "India",
      pincode,
    };

    await user.save();

    res.status(200).json({
      status: true,
      message: "Address updated successfully",
      data: user.address,
    });
  } catch (err) {
    next(err);
  }
};
const profile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      status: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  profile,
  updateAddress,
};
