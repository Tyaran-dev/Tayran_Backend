import User from "../../models/User.model";
import bcrypt from "bcryptjs";
import { ApiError } from "../../utils/apiError.js";

import { generateTokenAndSetCookie } from "../../utils/generateToken.js";


export const signup = async (req, res, next) => {
    try {
        const { name, email, password, role, company } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return next(new ApiError(400, "Invalid email format"));
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);


        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            role: 'agent', // only agents can register via this route
            isApproved: false,
            company
        });

        if (newUser) {
            generateTokenAndSetCookie(newUser._id, res);
            await newUser.save();
            res.status(201).json({ ...newUser._doc, password: null });
        } else {
            res.status(400).json({ error: "Invalid user data" });

        }
    } catch (error) {
        return next(new ApiError(500, "Internal Server Error"));
    }
}



