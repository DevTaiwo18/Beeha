const express = require('express');
const router = express.Router();
const { cloudinaryConfig, multerUploads, processImages } = require('../middlewares/imageupload');
const { addProduct, getProducts, getProduct, updateProduct, deleteProduct, getLatestPostsByCategory, getProductsByCategory } = require('../controller/productController');

cloudinaryConfig(); 

router.post('/addproducts', multerUploads, processImages, addProduct);
router.get("/getproducts", getProducts)
router.get("/:productId", getProduct)
router.put("/:productId", updateProduct)
router.delete("/:productId", deleteProduct)
router.get('/pro/latest-posts', getLatestPostsByCategory);
router.get('/products/:category', getProductsByCategory);

module.exports = router;
