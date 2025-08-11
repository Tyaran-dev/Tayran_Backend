import mongoose, { Schema, Document } from 'mongoose';


const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['owner', 'admin', 'agent'],
        required: true,
    },
    isApproved: {
        type: Boolean,
        default: false, // Agents must be approved
    },
    credit: {
        type: Number,
        default: 0, // For agent only
    },
    company: {
        name: { type: String },
        vatNumber: { type: String },
        address: { type: String },
        phone: { type: String },
    },

}, {
    timestamps: true,
})

const User = mongoose.model("User", userSchema);

export default User;
