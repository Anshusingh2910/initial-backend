const Cart = require("../model/cartModel");
const Product = require("../model/productModel");
const ApiError = require("../Utilities/ApiError");


  const addToCart = async (req, res, next) => {
    try {
      const { productId, quantity = 1 } = req.body;

      const product = await Product.findById(productId);

      if (!product) {
        throw new ApiError(404, "Product not found");
      }

      if (quantity > product.stock) {
        throw new ApiError(400, "Insufficient stock");
      }

      let cart = await Cart.findOne({
        user: req.user._id,
      });

      if (!cart) {
        cart = await Cart.create({
          user: req.user._id,
          products: [
            {
              product: productId,
              quantity,
            },
          ],
        });
      } else {
        const existingProduct = cart.products.find(
          (item) => item.product.toString() === productId
        );

        if (existingProduct) {
          if (existingProduct.quantity + quantity > product.stock) {
            throw new ApiError(400, "Insufficient stock");
          }

          existingProduct.quantity += quantity;
        } else {
          cart.products.push({
            product: productId,
            quantity,
          });
        }

        await cart.save();
      }

      res.status(200).json({
        status: true,
        message: "Product added to cart successfully",
        data: cart,
      });
    } catch (err) {
      next(err);
    }
  };

const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({
      user: req.user._id,
    }).populate("products.product");

    res.status(200).json({
      status: true,
      data: cart,
    });
  } catch (err) {
    next(err);
  }
};

const removeProduct = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    cart.products = cart.products.filter(
      (item) => item.product.toString() !== req.params.productId
    );

    await cart.save();

    res.status(200).json({
      status: true,
      message: "Product removed from cart",
    });
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { products: [] }
    );

    res.status(200).json({
      status: true,
      message: "Cart cleared successfully",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addToCart,
  getCart,
  removeProduct,
  clearCart,
};