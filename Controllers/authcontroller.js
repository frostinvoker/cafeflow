const User = require('../models/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const secretKey = process.env.JWT_SECRET || 'your-default-secret-key';
const generateToken = (user) => {
    return jwt.sign({
        id: user._id,
        role: user.role
    }, secretKey, {
        expiresIn: '1h'
    });
};

exports.register = async (req, res) => {
    try {
        const {
            username,
            password,
            role
        } = req.body;
        const user = new User({
            username,
            password,
            role
        });
        await user.save();
        const token = generateToken(user);
        res.status(201).json({
            user,
            token
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const {
            username,
            password
        } = req.body;
        const user = await User.findOne({
            username
        });
        if (!user) {
            return res.status(400).json({
                message: 'Invalid credentials'
            });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({
                message: 'Invalid credentials'
            });
        }
        const token = generateToken(user);
        res.json({
            user,
            token
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

exports.verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({
            message: 'No token provided'
        });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                message: 'Invalid token'
            });
        }
        req.user = decoded;
        next();
    });
};

exports.authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Unauthorized'
            });
        }
        next();
    };
};