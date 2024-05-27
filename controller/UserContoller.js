const Product = require('../model/product');
const Cart = require('../model/CartSchema ');
const Address = require('../model/addressSchema');
const User = require("../model/user")
const Shipping = require('../model/Shipping');
const sendEmail = require('../services/email');
const paystack = require("../payment/paystack")();
const axios = require("axios")
const crypto = require('crypto');
const Order = require("../model/order")
const mongoose = require('mongoose');


const getProductSearchSuggestions = async (req, res) => {
    try {
        const searchQuery = req.params.query.trim().toLowerCase();

        if (!searchQuery) {
            return res.status(400).json({
                status: 'error',
                message: 'Search query is required'
            });
        }

        const productSuggestions = await Product.find(
            { name: { $regex: new RegExp(searchQuery, 'i') } },
            '_id name'
        ).limit(10);

        res.status(200).json({
            status: 'success',
            data: productSuggestions
        });

    } catch (error) {
        console.error('Error fetching product search suggestions:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch product search suggestions',
            error: error.message
        });
    }
};

const getProductById = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Product.findById(productId).select('-_id name description price category sizes images stock');

        if (!product) {
            return res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: product
        });
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch product by ID',
            error: error.message
        });
    }
};

const addToCart = async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity, size } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                message: "Insufficient stock available",
                availableStock: product.stock,
                messageTip: "Please search for more products at Beeha website."
            });
        }

        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({
                user: userId,
                items: [{ product: productId, quantity, size: size || "One Size" }]
            });
        } else {
            const itemIndex = cart.items.findIndex(item => item.product.toString() === productId && item.size === (size || "One Size"));

            if (itemIndex > -1) {
                let item = cart.items[itemIndex];
                item.quantity += quantity;
            } else {
                cart.items.push({ product: productId, quantity, size: size || "One Size" });
            }
        }

        cart.modifiedOn = Date.now();
        await cart.save();

        res.status(201).json(cart);
    } catch (error) {
        res.status(500).json({ message: "Error adding to cart", error: error.message });
    }
};

const getCart = async (req, res) => {
    const userId = req.user.id;
    try {
        const cart = await Cart.findOne({ user: userId })
            .populate('items.product', 'name price description');

        if (!cart) {
            return res.status(404).json({
                status: 'fail',
                message: 'No cart found for this user'
            });
        }

        let totalCartValue = 0;
        const updatedItems = cart.items.map(item => {
            const itemTotal = item.quantity * item.product.price;
            totalCartValue += itemTotal;
            return { ...item.toObject(), itemTotal };
        });

        res.status(200).json({
            status: 'success',
            data: {
                cart: {
                    items: updatedItems,
                    totalCartValue,
                    modifiedOn: cart.modifiedOn,
                    _id: cart._id
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve cart',
            error: error.message
        });
    }
};

const getCartItemCount = async (req, res) => {
    const userId = req.user.id;

    try {
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(200).json({
                status: 'success',
                itemCount: 0
            });
        }

        const itemCount = cart.items.length;

        res.status(200).json({
            status: 'success',
            itemCount
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve item count',
            error: error.message
        });
    }
};

const updateCart = async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity, size } = req.body;

    try {
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({
                status: 'fail',
                message: 'Cart not found'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                message: "Insufficient stock available",
                availableStock: product.stock
            });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId && item.size === size);

        if (itemIndex > -1) {
            if (quantity <= 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].quantity = quantity;
            }
        } else if (quantity > 0) {
            cart.items.push({ product: productId, quantity, size });
        }
        cart.modifiedOn = Date.now();
        await cart.save();

        res.status(200).json({
            status: 'success',
            message: 'Cart updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error updating cart',
            error: error.message
        });
    }
};

const removeItemFromCart = async (req, res) => {
    const userId = req.user.id;
    const { productId, size } = req.body;
    try {
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                status: 'fail',
                message: 'No cart found for this user'
            });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId && (size ? item.size === size : true));

        if (itemIndex > -1) {
            cart.items.splice(itemIndex, 1);
        } else {
            return res.status(404).json({
                status: 'fail',
                message: 'Item not found in cart'
            });
        }

        await cart.save();

        if (cart.items.length === 0) {
            return res.status(200).json({
                status: 'success',
                message: 'All items have been removed from your cart',
                data: cart.items
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Item successfully removed from cart'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to remove item from cart',
            error: error.message
        });
    }
};

const saveAddress = async (req, res) => {
    try {
        const { id: userId } = req.user;
        const { street, city, state, country, phone } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let address = await Address.findOne({ userId });
        if (address) {
            address.street = street;
            address.city = city;
            address.state = state;
            address.country = country;
            address.phone = phone;
        } else {
            address = new Address({
                userId,
                street,
                city,
                state,
                country,
                phone
            });
        }

        await address.save();
        res.status(201).json({ message: "Address saved successfully", address });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAddress = async (req, res) => {
    try {
        const { id: userId } = req.user;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const address = await Address.findOne({ userId });
        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        res.status(200).json({ address });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const calculateTotalPayment = async (req, res) => {
    const { userId, shippingId } = req.body;

    try {
        const user = await User.findById(userId);
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        const shipping = await Shipping.findById(shippingId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        if (!shipping) {
            return res.status(404).json({ message: "Shipping method not found" });
        }

        const goodsTotal = cart.items.reduce((total, item) => total + (item.itemTotal || (item.product.price * item.quantity)), 0);
        const shippingCost = shipping.price;
        const totalPayment = goodsTotal + shippingCost;

        const form = {
            email: user.email,
            amount: totalPayment * 100,
            callback_url: 'https://1244-105-112-200-6.ngrok-free.app/payment/callback',
            metadata: {
                userId: user._id.toString(),
                shippingMethodId: shipping._id.toString()
            }
        };

        const paymentInitialization = await paystack.initializePayment(form);

        res.status(200).json({
            message: "Total payment calculated and payment initialized successfully",
            goodsTotal: goodsTotal,
            shippingCost: shippingCost,
            totalPayment: totalPayment,
            paymentLink: paymentInitialization.data.authorization_url
        });
    } catch (error) {
        res.status(500).json({
            message: "Error calculating total payment or initializing payment",
            error: error.message
        });
    }
};

const paystackWebHook = async (req, res) => {
    const secret = "sk_test_b9f8cf66adab4d49ebf4e6e5672c753af5ee6f7c";
    const hash = req.headers['x-paystack-signature'];
    const event = req.body;

    const verifyWebhook = crypto
        .createHmac('sha512', secret)
        .update(JSON.stringify(event))
        .digest('hex');

    if (hash !== verifyWebhook) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    if (event.event === "charge.success") {
        try {
            const userId = event.data.metadata.userId;
            const shippingMethodId = event.data.metadata.shippingMethodId;
            const user = await User.findById(userId);
            const cart = await Cart.findOne({ user: userId }).populate('items.product');

            if (!cart) {
                console.error('Cart not found for the user:', userId);
                return res.status(404).json({ message: "Cart not found" });
            }

            const shippingMethod = await Shipping.findById(shippingMethodId);
            if (!shippingMethod) {
                console.error('Shipping method not found:', shippingMethodId);
                return res.status(404).json({ message: "Shipping method not found" });
            }

            const totalCostInNaira = event.data.amount / 100;

            const orderItems = cart.items.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price
            }));

            const order = new Order({
                user: userId,
                items: orderItems,
                shippingMethod: shippingMethod._id,
                totalCost: totalCostInNaira,
                productCount: orderItems.length,
                paymentStatus: 'Paid',
                status: 'Pending'
            });

            let emailContent = `New order placed by ${user.email}<br/>Products:<br/>`;

            for (let item of orderItems) {
                const product = await Product.findById(item.product);
                if (product && product.stock >= item.quantity) {
                    product.stock -= item.quantity;
                    await product.save();
                    emailContent += `${product.name}: ${item.quantity} pcs<br/>`;
                } else {
                    console.error('Insufficient stock for product:', product.name);
                }
            }

            await order.save();
            await Cart.findByIdAndDelete(cart._id);

            await sendEmail({
                email: 'BeehaLagos@gmail.com',
                subject: 'New Order Placed',
                html: emailContent
            });

            console.log("Order successfully processed for user:", userId);
            res.status(200).json({ message: "Order processed successfully", orderId: order._id });

        } catch (error) {
            console.error('Error processing the order:', error);
            res.status(500).json({ message: "Error processing the order", error: error.toString() });
        }
    } else if (event.event === "charge.failed") {
        console.log("Payment failed for reference:", event.data.reference);
        res.status(200).json({ message: "Payment failed", data: event.data });
    } else {
        console.log(`Unhandled event type: ${event.event}`);
        res.status(200).json({ message: "Received unhandled event type", event: event.event });
    }
};

const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;

        const orders = await Order.find({ user: userId })
            .populate('user', 'fullname')
            .populate({
                path: 'items.product',
                select: 'name price'
            });

        if (!orders.length) {
            return res.status(404).json({ message: 'No orders found for the specified user' });
        }

        const responseData = orders.map(order => ({
            orderId: order._id,
            userName: order.user.fullname,
            totalCost: order.totalCost,
            paymentStatus: order.paymentStatus,
            status: order.status,
            createdAt: order.createdAt,
            items: order.items.map(item => ({
                productName: item.product.name,
                price: item.product.price,
                quantity: item.quantity
            }))
        }));

        res.status(200).json({
            message: 'Orders retrieved successfully',
            data: responseData
        });
    } catch (error) {
        console.error('Error retrieving orders:', error);
        res.status(500).json({
            message: 'Error retrieving orders',
            error: error.toString()
        });
    }
};


module.exports = { getProductSearchSuggestions, getProductById, addToCart, getCart, getCartItemCount, updateCart, removeItemFromCart, saveAddress, calculateTotalPayment, paystackWebHook, getUserOrders, getAddress };
