const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    shopName: {
      type: String,
       default: "",
    },

    gstNumber: {
      type: String,
       default: "",
    },

    businessAddress: {
      type: String,
       default: "",
    },

    bankAccount: {
      type: String,
      default: "",
    },

    ifscCode: {
      type: String,
      default: "",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Seller", sellerSchema);
