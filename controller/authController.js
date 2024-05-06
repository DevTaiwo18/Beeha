const User = require("../model/user");
const signJWT = require("../utils/jwt");
const bcrypt = require('bcryptjs');
const yup = require("yup");
const { createVerificationTokenAndSendToEmail } = require("../services/emailVerification"); 
const {BlacklistTokens} = require("../model/tokenBlacklist")

const signup = async (req, res, next) => {
    const { email, password, fullname } = req.body;

    const rules = yup.object().shape({
        email: yup.string().email("Invalid email format").required(),
        fullname: yup.string().required(),
        password: yup.string().min(6, "Password must be at least 6 characters long").required()
    });

    try {
        await rules.validate({ email, password, fullname });

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "Email already registered" });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            email,
            password: hashedPassword,
            fullname,
            emailVerified: false  
        });

        const token = signJWT(newUser._id, newUser.email);

        const hashedVerificationToken = await createVerificationTokenAndSendToEmail(req, newUser);
        
        newUser.hashedVerificationToken = hashedVerificationToken;
        await newUser.save();

        res.status(201).json({
            status: "success",
            message: "User created successfully. Please check your email to verify your account.",
            user: {
                id: newUser._id,
                email: newUser.email,
                fullname: newUser.fullname
            },
            token
        });

    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    const { email, password } = req.body;
    const rule = yup.object().shape({
        email: yup.string().required().trim(),
        password: yup.string().required()
    })

    try {
        let val = await rule.validate({ email, password })
        if (!val) {
            const error = new Error('Validation error');
            error.statusCode = 400;
            error.errors = error.errors;
            next(error);
        }

        const user = await User.findOne({ email }).select("+password")
        if (!user || !(await bcrypt.compare(password, user.password))) {
            const error = new Error("Invalid input data");
            error.statusCode = 404;
            return next(error)
        }

        const token = signJWT(user.id, user.email);
        res.status(200).json({
            status: "success",
            message: "Login successful",
            user,
            token
        })
    } catch (error) {
        next(error);
    }
}

const logout = async (req, res, next) => {
    const { token } = req.body;
    try {
        if (!token) {
            return res.status(400).json({
                status: "fail",
                message: "Please supply token in request body",
            });
        }
    
        const blacklistedToken = await BlacklistTokens.create({ token });
    
        if (!blacklistedToken) {
            const error = new Error("Failed to blacklist token");
            error.statusCode = 500;
            return next(error);
        }
    
        res.status(200).json({
            status: "success",
            message: "Logout successful",
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

module.exports = { signup, login, logout };
