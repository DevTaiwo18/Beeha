const express = require('express');
const router = express.Router();
const User = require('../model/user'); 
const bcrypt = require('bcryptjs')
const { signup, login, logout} = require("../controller/authController");

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

router.get('/verify/:email/:token', async (req, res) => {
    const { email, token } = req.params;

    try {
        const user = await User.findOne({ email }).select('+hashedVerificationToken');
        if (!user) {
            return res.status(404).send('User not found.');
        }

        const isTokenValid = await bcrypt.compare(token, user.hashedVerificationToken);
        if (!isTokenValid) {
            return res.status(400).send('Invalid or expired token.');
        }

        user.emailVerified = true;
        user.hashedVerificationToken = ''; 
        await user.save();

        res.send('Email successfully verified.');
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).send('Internal server error.');
    }
});

module.exports = router;
