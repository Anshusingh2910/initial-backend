const Order = require("../model/orderModel");
const Cart = require("../model/cartModel");
const User = require("../model/userModel");
const Product = require("../model/productModel");
const ApiError = require("../Utilities/ApiError");

const placeOrder = async (req, res, next) => {
    try {
        const { shippingAddress, paymentMethod = "COD" } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const address = shippingAddress || user.address;

        if (
            !address ||
            !address.fullName ||
            !address.houseNo ||
            !address.area ||
            !address.city ||
            !address.state ||
            !address.pincode
        ) {
            throw new ApiError(400, "Please fill complete shipping address");
        }

        if (!["COD", "Online"].includes(paymentMethod)) {
            throw new ApiError(400, "Invalid payment method");
        }

        const cart = await Cart.findOne({
            user: req.user._id,
        }).populate("products.product");

        if (!cart || cart.products.length === 0) {
            throw new ApiError(400, "Cart is empty");
        }

        let items = [];
        let totalAmount = 0;

        for (const item of cart.products) {

            if (item.quantity > item.product.stock) {
                throw new ApiError(
                    400,
                    `${item.product.title} is out of stock`
                );
            }

            items.push({
                product: item.product._id,
                seller: item.product.seller,
                quantity: item.quantity,
                price: item.product.price,
            });

            totalAmount += item.quantity * item.product.price;
            item.product.stock -= item.quantity;
            await item.product.save();
        }

        user.address = address;
        await user.save();

        const order = await Order.create({
            user: user._id,
            items,
            shippingAddress: address,
            totalAmount,
            paymentMethod,
        });

        cart.products = [];
        await cart.save();
        const response = {
            _id: order._id,

            items: items.map((item) => ({
                product: {
                    _id: item.product._id,
                    title: item.product.title,
                    image: item.product.image,
                    price: item.product.price,
                    category: item.product.category,
                },
                quantity: item.quantity,
                price: item.price,
            })),
            shippingAddress: order.shippingAddress,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            createdAt: order.createdAt,
        };

        res.status(201).json({
            status: true,
            message: "Order placed successfully",
            data: response,
        });

    } catch (err) {
        next(err);
    }
};
const placeBuyNowOrder = async (req, res, next) => {
    try {
        const {
            productId,
            quantity = 1,
            shippingAddress,
            paymentMethod = "COD",
        } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const address = shippingAddress || user.address;

        if (
            !address ||
            !address.fullName ||
            !address.houseNo ||
            !address.area ||
            !address.city ||
            !address.state ||
            !address.pincode
        ) {
            throw new ApiError(400, "Please fill complete shipping address");
        }

        if (!["COD", "Online"].includes(paymentMethod)) {
            throw new ApiError(400, "Invalid payment method");
        }

        const product = await Product.findById(productId);

        if (!product) {
            throw new ApiError(404, "Product not found");
        }

        if (product.stock < quantity) {
            throw new ApiError(400, "Product is out of stock");
        }

        const totalAmount = product.price * quantity;
        const order = await Order.create({
            user: user._id,

            items: [
                {
                    product: product._id,
                    seller: product.seller,
                    quantity,
                    price: product.price,
                },
            ],
            shippingAddress: address,
            totalAmount,
            paymentMethod,
        });
        product.stock -= quantity;
        await product.save();

        const response = {
            _id: order._id,

            items: items.map((item) => ({
                product: {
                    _id: item.product._id,
                    title: item.product.title,
                    image: item.product.image,
                    price: item.product.price,
                    category: item.product.category,
                },
                quantity: item.quantity,
                price: item.price,
            })),
            shippingAddress: order.shippingAddress,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            createdAt: order.createdAt,
        };

        res.status(201).json({
            status: true,
            message: "Order placed successfully",
            data: response,
        });
    } catch (err) {
        next(err);
    }
};
const getMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({
            user: req.user._id,
        })
            .populate("items.product", "title image price category")
            .sort({ createdAt: -1 });

        const response = orders.map((order) => ({
            _id: order._id,

            items: order.items.map((item) => ({
                product: {
                    _id: item.product._id,
                    title: item.product.title,
                    image: item.product.image,
                    price: item.product.price,
                    category: item.product.category,
                },
                quantity: item.quantity,
                price: item.price,
            })),
            shippingAddress: order.shippingAddress,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            createdAt: order.createdAt,
        }));

        res.status(200).json({
            status: true,
            message: "orders fetched successfully",
            total: response.length,
            data: response,
        });
    } catch (err) {
        next(err);
    }
};

const getSingleOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "-password")
            .populate("items.product");

        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        if (order.user._id.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Access denied");
        }
        const orderData = {
            _id: order._id,

            items: order.items.map((item) => ({
                product: {
                    _id: item.product._id,
                    title: item.product.title,
                    image: item.product.image,
                    price: item.product.price,
                    category: item.product.category,
                },
                quantity: item.quantity,
                price: item.price,
            })),
            shippingAddress: order.shippingAddress,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            createdAt: order.createdAt,
        };
        res.status(200).json({
            status: true,
            data: orderData,
        });
    } catch (err) {
        next(err);
    }
};

const cancelOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        if (order.user.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Access denied");
        }

        if (order.orderStatus !== "Pending") {
            throw new ApiError(400, "Only pending orders can be cancelled");
        }

        order.orderStatus = "Cancelled";

        await order.save();

        res.status(200).json({
            status: true,
            message: "Order cancelled successfully",
            data: {
                orderId: order._id,
                orderStatus: order.orderStatus,
                paymentStatus: order.paymentStatus,
                cancelledAt: order.updatedAt,
            },
        });
    } catch (err) {
        next(err);
    }
};

const getSellerOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({
            "items.seller": req.seller._id,
        })
            .populate("user", "-password")
            .populate("items.product");

        res.status(200).json({
            status: true,
            message: "Seller orders fetched successfully",
            total: orders.length,
            data: orders,
        });
    } catch (err) {
        next(err);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        if (!req.seller) {
            throw new ApiError(403, "Seller not found");
        }

        const isSellerOrder = order.items.some((item) => {
            if (!item.seller) {
                console.log("Seller missing in item:", item);
                return false;
            }
            return (
                item.seller.toString() === req.seller._id.toString()
            );
        });

        if (!isSellerOrder) {
            throw new ApiError(403, "You are not allowed to update this order");
        }

        const allowedStatus = [
            "Confirmed",
            "Packed",
            "Shipped",
            "Delivered",
        ];

        if (!allowedStatus.includes(status)) {
            throw new ApiError(400, "Invalid order status");
        }

        order.orderStatus = status;

        await order.save();

        res.status(200).json({
            status: true,
            message: "Order status updated successfully",
            data: order,
        });
    } catch (err) {
        next(err);
    }
};
const getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find()
            .populate("user", "-password")
            .populate("items.product")
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: true,
            message: "All orders fetched successfully",
            total: orders.length,
            data: orders,
        });
    } catch (err) {
        next(err);
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "-password")
            .populate("items.product");

        if (!order) {
            throw new ApiError(404, "Order not found");
        }

        res.status(200).json({
            status: true,
            data: order,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    placeOrder,
    placeBuyNowOrder,
    getMyOrders,
    getSingleOrder,
    cancelOrder,
    getSellerOrders,
    updateOrderStatus,
    getAllOrders,
    getOrderById,
};