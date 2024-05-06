const express = require('express');
const router = express.Router();
const { getAdminSearch, getStatusOfGoodsAdmin, getAllUserAdmin, getSearchAllUserAdmin, deleteUserAdmin, editUserAdmin, addShippingDetails, getAllShippingDetails, editShippingDetails,deleteShippingDetails, getSingleShippingDetails, getUserOrders, getOrdersDetail, UpdateOrderStatus, getOrderSummaries, getDashboardMetrics } = require('../controller/adminContoller');

router.get('/product/:name/:category', getAdminSearch);
router.get('/stock-status', getStatusOfGoodsAdmin);
router.get('/users', getAllUserAdmin);
router.get('/users/:search', getSearchAllUserAdmin);
router.delete('/users/:userId', deleteUserAdmin);
router.patch('/users/:userId', editUserAdmin);
router.post("/shipping", addShippingDetails)
router.get('/shipping', getAllShippingDetails)
router.patch('/shipping/:id', editShippingDetails)
router.delete('/shipping/:id', deleteShippingDetails)
router.get('/shipping/:shippingId', getSingleShippingDetails);
router.get("/orders", getUserOrders)
router.get("/orders/:orderId", getOrdersDetail)
router.post("/orders/status", UpdateOrderStatus)
router.get('/order-summaries', getOrderSummaries);
router.get('/dashboard-metrics', getDashboardMetrics);
module.exports = router;
