const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },

                seller: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Seller",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    default: 1
                },

                price: {
                    type: Number,
                    required: true,
                },
            },
        ],

        shippingAddress: {
            fullName: String,
            phone: String,
            houseNo: String,
            area: String,
            city: String,
            state: String,
            country: {
                type: String,
                default: "India",
            },
            pincode: String,
        },

        totalAmount: {
            type: Number,
            required: true,
        },

        paymentMethod: {
            type: String,
            enum: ["COD", "Online"],
            default: "COD",
        },

        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending",
        },

        orderStatus: {
            type: String,
            enum: [
                "Pending",
                "Confirmed",
                "Packed",
                "Shipped",
                "Delivered",
                "Cancelled",
            ],
            default: "Pending",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("order", orderSchema);