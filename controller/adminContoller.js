const Product = require('../model/product');
const User = require('../model/user');
const Shipping = require("../model/Shipping")
const Address = require("../model/addressSchema")
const Order = require("../model/order")
const mongoose = require('mongoose');
const sendEmail = require('../services/email');


const getAdminSearch = async (req, res) => {
    try {
        const { name, category } = req.params;

        const products = await Product.find({
            name: { $regex: new RegExp(name, 'i') },
            category: category
        }).select('name description price category sizes images stock');

        if (products.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No products found matching the criteria'
            });
        }

        res.status(200).json({
            status: 'success',
            data: products
        });
    } catch (error) {
        console.error('Error in admin product search:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to perform search',
            error: error.message
        });
    }
};

const getStatusOfGoodsAdmin = async (req, res) => {
    try {
        const stockStatus = await Product.aggregate([
            {
                $project: {
                    name: 1,
                    status: {
                        $cond: { if: { $gt: ["$stock", 0] }, then: "selling", else: "unavailable" }
                    }
                }
            }
        ]);

        if (stockStatus.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No products found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: stockStatus
        });
    } catch (error) {
        console.error('Error fetching stock status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch stock status',
            error: error.message
        });
    }
};

const getAllUserAdmin = async (req, res) => {
    try {
        const users = await User.find({}).select('-password'); 
        if (users.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No users found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: users
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch user details',
            error: error.message
        });
    }
};

const getSearchAllUserAdmin = async (req, res) => {
    try {
        const { search } = req.params;

        let query = {};
        if (search.includes('@')) {
            query.email = { $regex: new RegExp(search, 'i') };  
        } else {
            query.fullname = { $regex: new RegExp(search, 'i') }; 
        }

        const users = await User.find(query).select('-password');
        if (users.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No users found matching the criteria'
            });
        }

        res.status(200).json({
            status: 'success',
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch users',
            error: error.message
        });
    }
};

const deleteUserAdmin = async (req, res) => {
    try {
        const { userId } = req.params;  
        console.log("Checking user with ID:", userId);

        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete user',
            error: error.message
        });
    }
};

const editUserAdmin = async (req, res) => {
    try {
        const { userId } = req.params; 
        const updates = req.body; 

        const options = { new: true, runValidators: true };

        const updatedUser = await User.findByIdAndUpdate(userId, updates, options);

        if (!updatedUser) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update user',
            error: error.message
        });
    }
};

const addShippingDetails = async (req, res) => {
    try {
        const { title, description, price } = req.body;

        if (!title || !description || typeof price !== 'number') {
            return res.status(400).json({ message: "Invalid input, please check your data." });
        }

        const newShipping = await Shipping.create({ title, description, price });

        res.status(201).send({ message: "Shipping details added successfully!", data: newShipping });
    } catch (error) {
        console.error('Error adding shipping details:', error); 
        res.status(500).send({ message: "Failed to add shipping details", error: error.message });
    }
};

const getAllShippingDetails = async (req, res) => {
    try {
        const shippingDetails = await Shipping.find({});

        if (shippingDetails.length === 0) {
            return res.status(404).json({
                message: "No shipping details found"
            });
        }

        res.status(200).json({
            message: "Shipping details retrieved successfully",
            lenght: shippingDetails.length,
            data: shippingDetails
        });
    } catch (error) {
        console.error('Error retrieving shipping details:', error);
        res.status(500).json({
            message: "Failed to retrieve shipping details",
            error: error.message
        });
    }
};

const editShippingDetails = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const updatedShipping = await Shipping.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!updatedShipping) {
            return res.status(404).json({ message: "Shipping detail not found" });
        }
        res.status(200).json({
            message: "Shipping details updated successfully",
            data: updatedShipping
        });
    } catch (error) {
        console.error('Error updating shipping details:', error);
        res.status(500).json({
            message: "Failed to update shipping details",
            error: error.message
        });
    }
};

const deleteShippingDetails = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedShipping = await Shipping.findByIdAndDelete(id);
        if (!deletedShipping) {
            return res.status(404).json({ message: "Shipping detail not found" });
        }
        res.status(200).json({
            message: "Shipping details deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting shipping details:', error);
        res.status(500).json({
            message: "Failed to delete shipping details",
            error: error.message
        });
    }
};

const getSingleShippingDetails = async (req, res) => {
    const { shippingId } = req.params; 

    try {
        const shippingDetail = await Shipping.findById(shippingId);

        if (!shippingDetail) {
            return res.status(404).json({
                status: 'fail',
                message: 'Shipping detail not found'
            });
        }
        res.status(200).json({
            status: 'success',
            data: shippingDetail
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error retrieving shipping detail',
            error: error.message
        });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'fullname');  

        if (!orders.length) {
            return res.status(404).json({ message: 'No orders found' });
        }

        res.status(200).json({
            message: 'Orders retrieved successfully',
            data: orders.map(order => ({
                orderId: order._id,
                userName: order.user.fullname,
                totalCost: order.totalCost,
                paymentStatus: order.paymentStatus,
                status: order.status,
                createdAt: order.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error retrieving orders',
            error: error.toString()
        });
    }
}

const getOrdersDetail = async (req, res) => {
    const orderId = req.params.orderId;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
    }

    try {
        const order = await Order.findById(orderId)
            .populate({
                path: 'items.product',
                select: 'name price description'
            })
            .populate({
                path: 'user',
                select: 'fullname' 
            })
            .populate('shippingMethod');

        if (!order) {
            console.log(`Order with ID ${orderId} not found.`);
            return res.status(404).json({ message: 'Order not found' });
        }

        const address = await Address.findOne({ userId: order.user._id });
        const userDetail = {
            ...order.user._doc, 
            address: address ? `${address.street}, ${address.city}, ${address.state}, ${address.country}` : "Address not available"
        };

        const itemsDetails = order.items.map(item => ({
            productId: item.product._id,
            title: item.product.name,
            description: item.product.description,
            quantity: item.quantity,
            price: item.product.price,
            total: item.quantity * item.product.price
        }));

        const totalProductCost = itemsDetails.reduce((acc, item) => acc + item.total, 0);
        const totalWithShipping = totalProductCost + (order.shippingMethod ? order.shippingMethod.price : 0);

        res.status(200).json({
            orderId: order._id,
            user: userDetail,
            items: itemsDetails,
            totalProductCost,
            shippingMethod: order.shippingMethod ? order.shippingMethod.title : "No shipping method",
            shippingDescription: order.shippingMethod ? order.shippingMethod.description : "No shipping description",
            shippingCost: order.shippingMethod ? order.shippingMethod.price : 0,
            totalAmount: totalWithShipping,
            paymentStatus: order.paymentStatus,
            status: order.status,
            createdAt: order.createdAt
        });

    } catch (error) {
        console.error(`Error retrieving order details: ${error}`);
        res.status(500).json({
            message: 'Error retrieving order details',
            error: error.toString()
        });
    }
};

const UpdateOrderStatus = async (req, res) => {
    const { orderId, status } = req.body; 

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
    }

    try {
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        order.status = status;  
        await order.save();

        const user = await User.findById(order.user);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let emailContent = "";
        switch (status) {
            case 'Shipping':
                emailContent = `
                    <p>Hi ${user.fullname},</p>
                    <p>Your order is now on its way to you! Delivery usually takes 1 to 2 weeks. Please contact us for more inquiries.</p>
                    <p><a href="tel:+1234567890">Contact Us</a></p>
                `;
                break;
            case 'Delivered':
                emailContent = `
                    <p>Hi ${user.fullname},</p>
                    <p>We hope you enjoy your product! Don't hesitate to browse more of our products and make another order.</p>
                    <p>Visit us at <a href="https://yourwebsite.com">our site</a>!</p>
                `;
                break;
            default:
                emailContent = `
                    <p>Hi ${user.fullname},</p>
                    <p>Your order status has been updated to ${status}. Please contact us if you have any questions.</p>
                    <p><a href="tel:+1234567890">Contact Us</a></p>
                `;
                break;
        }

        await sendEmail({
            email: user.email,
            subject: 'Order Status Updated',
            html: emailContent
        });

        console.log("Order status updated and user notified:", user.email);
        res.status(200).json({ message: "Order status updated successfully and user notified", orderId: order._id });

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            message: "Error updating order status",
            error: error.toString()
        });
    }
};

const getOrderSummaries = async (req, res) => {
    try {
        const summaries = {
            today: await getSummary('today'),
            yesterday: await getSummary('yesterday'),
            thisMonth: await getSummary('thisMonth'),
            lastMonth: await getSummary('lastMonth'),
            allTime: await getSummary('allTime')
        };

        res.status(200).json({
            message: 'Order summaries retrieved successfully',
            data: summaries
        });

    } catch (error) {
        console.error('Error retrieving order summaries:', error);
        res.status(500).json({
            message: 'Error retrieving order summaries',
            error: error.toString()
        });
    }
};

const getSummary = async (period) => {
    const dateRange = getDateRange(period);
    const summary = await Order.aggregate([
        { $match: { createdAt: { $gte: dateRange.start, $lte: dateRange.end } } },
        { $group: { _id: null, totalSales: { $sum: "$totalCost" }, count: { $sum: 1 } } },
        { $project: { _id: 0, totalSales: 1, count: 1 } }
    ]);

    return summary[0] || { totalSales: 0, count: 0 };
};

const getDateRange = (period) => {
    const now = new Date();
    now.setHours(0,0,0,0);
    let start, end;

    switch (period) {
        case 'today':
            start = new Date(now);
            end = new Date(now);
            end.setHours(23,59,59,999);
            break;
        case 'yesterday':
            start = new Date(now);
            start.setDate(start.getDate() - 1);
            end = new Date(start);
            end.setHours(23,59,59,999);
            break;
        case 'thisMonth':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            end.setHours(23,59,59,999);
            break;
        case 'lastMonth':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
            end.setHours(23,59,59,999);
            break;
        case 'allTime':
            start = new Date(0);  
            end = new Date();     
            break;
        default:
            return null;
    }

    return { start, end };
};

const getDashboardMetrics = async (req, res) => {
    try {
        const metrics = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    status: "$_id",
                    count: 1
                }
            }
        ]);

        const totalCount = await Order.countDocuments();

        let defaultMetrics = {
            'Pending': { status: 'Pending', count: 0 },
            'Shipping': { status: 'Shipping', count: 0 },
            'Delivered': { status: 'Delivered', count: 0 }
        };

        metrics.forEach(metric => {
            if (defaultMetrics[metric.status]) {
                defaultMetrics[metric.status].count = metric.count;
            }
        });

        const detailedMetrics = Object.values(defaultMetrics);

        const responseMetrics = {
            totalOrders: totalCount,
            details: detailedMetrics
        };

        res.status(200).json({
            message: 'Dashboard metrics retrieved successfully',
            data: responseMetrics
        });

    } catch (error) {
        console.error('Error retrieving dashboard metrics:', error);
        res.status(500).json({
            message: 'Error retrieving dashboard metrics',
            error: error.toString()
        });
    }
};


module.exports = { getAdminSearch, getStatusOfGoodsAdmin, getAllUserAdmin, getSearchAllUserAdmin, deleteUserAdmin, editUserAdmin, addShippingDetails, getAllShippingDetails, editShippingDetails,deleteShippingDetails,getSingleShippingDetails, getUserOrders, getOrdersDetail, UpdateOrderStatus, getOrderSummaries, getDashboardMetrics };
