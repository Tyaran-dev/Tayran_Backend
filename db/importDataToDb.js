import mongoose from 'mongoose';
import Airline from '../models/Airline.model.js';
import { airlines } from './airlines.js';
import Airport from "../models/airport.model.js";
import { airports } from "./fc-airports.js";

// Replace with your MongoDB Atlas connection string
const uri = "mongodb+srv://tayyrandev:TRGauQDp2fMrrN39@cluster0.ized3iy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to MongoDB Atlas');

        // Optional: clear existing data
        await Airport.deleteMany({});

        await Airport.insertMany(airports);
        console.log('Airline imported successfully');

        mongoose.disconnect();
    })
    .catch(err => console.error('MongoDB connection error:', err));
