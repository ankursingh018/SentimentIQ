const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.cjs');
const router = express.Router();
const crypto = require('crypto');

// Register
router.post('/signup', async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 12);
        const result = await User.create({ email, password: hashedPassword, fullName });

        const token = jwt.sign({ email: result.email, id: result._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

        res.status(200).json({ result, token });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) return res.status(404).json({ message: 'User not found' });

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

        res.status(200).json({ result: existingUser, token });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const token = crypto.randomBytes(32).toString('hex');
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000; // 1 hr
        await user.save();

        // In a real app, send email via nodemailer here.
        // For now we will just return success and log the token
        console.log(`Reset Token for ${email}: ${token}`);

        res.status(200).json({ message: 'Reset link sent (check console for simulated token)' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Something went wrong' });
    }
});

module.exports = router;
