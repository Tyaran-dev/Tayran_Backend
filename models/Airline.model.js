// models/Airline.js
import mongoose from "mongoose";

const airlineSchema = new mongoose.Schema({
    airLineCode: String,
    airLineName: String,
    airlineNameAr: String
});
const Airline = mongoose.model("Airline", airlineSchema);

export default Airline;
