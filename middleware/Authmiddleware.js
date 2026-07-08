const jwt = require("jsonwebtoken");
const User = require("../model/userModel");
const Seller = require("../model/sellerModel");
const ApiError = require("../Utilities/ApiError");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      throw new ApiError(401, "Token is required");
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new ApiError(401, "Token has expired. Please login again.");
      }

      throw new ApiError(401, "Invalid token");
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    if (user.isBlocked) {
      throw new ApiError(403, "Your account has been blocked.");
    }

    req.user = user;

    next();
  } catch (err) {
    next(err);
  }
};
const roleAuth = (...roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized. Please login first.");
      }

      const user = req.user;

      if (!roles.includes(user.role)) {
        throw new ApiError( 403`Only ${roles.join(" / ")} can access this route.`);
      }

      if (user.role === "seller") {
        const seller = await Seller.findOne({
          user: user._id,
        });

        if (!seller) {
          throw new ApiError(404, "Seller profile not found.");
        }

        if (!seller.isApproved) {
          throw new ApiError(
            403,
            "Seller account is waiting for admin approval."
          );
        }

        req.seller = seller;
      }

      req.user = user;

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = roleAuth;
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ecommerce-products",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

const adminTokenAuth = (req, res, next) => {
  try {
    const token = req.header("AdminToken");

    if (!token) {
      throw new ApiError(401, "Admin Token is required.");
    }

    if (token !== process.env.ADMIN_TOKEN) {
      throw new ApiError(403, "Invalid Admin Token.");
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  auth,
  roleAuth,
  upload,
  adminTokenAuth,
};