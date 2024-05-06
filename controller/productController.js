const Product = require('../model/product');
const { uploader } = require('../middlewares/imageupload');

require('../middlewares/imageupload').cloudinaryConfig();

const addProduct = async (req, res) => {
    try {
        let imageUrls = req.body.images || [];

        const product = new Product({
            ...req.body,
            images: imageUrls
        });

        await product.save();

        res.status(201).json({
            status: 'success',
            message: 'Product added successfully',
            data: {
                product
            }
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to add product',
            error: error.message
        });
    }
};

const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json({
            status: 'success',
            length: products.length,
            data: {
                products
            }
        })
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get products',
            error: error.message
        });
    }
}

const getProduct = async (req, res) => {
    const productId = req.params.productId;

    try {
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                product
            }
        });
    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get product',
            error: error.message
        });
    }
}

const updateProduct = async (req, res) => {
    const productId = req.params.productId;

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({
            status: 'error',
            message: 'Product not found'
        });
    }

    try {
        const updatedProduct = await Product.findByIdAndUpdate(productId, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: {
                product: updatedProduct
            }
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update product',
            error: error.message
        });
    }
}

const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        await Product.findByIdAndDelete(productId);

        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: "Failed to delete product" });
    }
};

const getLatestPostsByCategory = async (req, res) => {
    try {
        const latestPosts = await Product.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$category",
                    latestPost: { $first: "$$ROOT" }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    latestPost: 1
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: latestPosts
        });
    } catch (error) {
        console.error('Error fetching latest posts:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch latest posts',
            error: error.message
        });
    }
};

const getProductsByCategory = async (req, res) => {
    try {
        const category = req.params.category;

        const products = await Product.find({ category });

        if (!products || products.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Products not found for the specified category'
            });
        }

        res.status(200).json({
            status: 'success',
            length: products.length,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch products by category',
            error: error.message
        });
    }
};

module.exports = { addProduct, getProducts, getProduct, updateProduct, deleteProduct, getLatestPostsByCategory, getProductsByCategory };
