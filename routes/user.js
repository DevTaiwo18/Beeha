const express = require('express');
const router = express.Router();
const { getProductSearchSuggestions, getProductById, addToCart, getCart, getCartItemCount, updateCart, removeItemFromCart, saveAddress, getAddress, calculateTotalPayment, paystackWebHook, getUserOrders } = require('../controller/UserContoller');
const {protectRoutes} =  require("../middlewares/auth")

router.get('/products/search/:query', getProductSearchSuggestions);
router.get('/products/:id', getProductById);
router.post('/cart/add', protectRoutes, addToCart);
router.get('/cart', protectRoutes, getCart);
router.get('/cart/count', protectRoutes, getCartItemCount);
router.post('/cart/update', protectRoutes, updateCart);
router.delete('/cart/item', protectRoutes, removeItemFromCart);
router.post('/address', protectRoutes, saveAddress);
router.get('/address', protectRoutes, getAddress);
router.post("/totalpayments", protectRoutes, calculateTotalPayment);
router.post("/webhook/paystack", paystackWebHook)
router.get('/orders/:userId', getUserOrders);

module.exports = router;
