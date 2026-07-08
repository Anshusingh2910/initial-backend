const Product = require("../model/productModel");
const ApiError = require("../Utilities/ApiError");

const addProduct = async (req, res, next) => {
  try {
    const product = await Product.create({
      title: req.body.title,
      price: req.body.price,
      category: req.body.category,
      stock: req.body.stock,
      brand: req.body.brand,
      description: req.body.description,
      seller: req.seller._id,
      image: req.file.path,
    });

    res.status(201).json({
      status: true,
      message: "Product added successfully",
      data: {
        id: product._id,
        image: product.image,
        title: product.title,
        price: product.price,
        category: product.category,
        brand: product.brand,
        stock: product.stock,
        seller: product.seller,
        createdAt: product.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
      sort,
    } = req.query;

    let filter = {};

    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption = {};

    if (sort === "lowToHigh") sortOption.price = 1;
    if (sort === "highToLow") sortOption.price = -1;

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))

    const totalProducts = await Product.countDocuments(filter);

    res.status(200).json({
      status: true,
      message: "Products fetched successfully",
      totalProducts,
      currentPage: Number(page),
      totalPages: Math.ceil(totalProducts / Number(limit)),
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (
      req.user.role === "seller" &&
      product.seller.toString() !== req.seller._id.toString()
    ) {
      throw new ApiError(403, "Access denied");
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json({
      status: true,
      message: "Product updated successfully",
      data: {
        id: updated._id,
        title: updated.title,
        price: updated.price,
        category: updated.category,
        stock: updated.stock,
        updatedAt: updated.updatedAt,
      },
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

    if (
      req.user.role === "seller" &&
      product.seller.toString() !== req.seller._id.toString()
    ) {
      throw new ApiError(403, "Access denied");
    }

    await product.deleteOne();

    res.status(200).json({
      status: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
};
