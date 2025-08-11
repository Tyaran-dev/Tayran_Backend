import mongoose from 'mongoose'

const airportSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    airport_code: { type: String, required: true },
    name_en: { type: String, required: true },
    name_ar: { type: String},
    airport_city_en: { type: String },
    airport_city_ar: { type: String },
    airport_lang: { type: String },
    airport_city_code: { type: String },
    airport_country_code: { type: String},
    airport_timezone: { type: String},
    priority: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    created_at: { type: Date, required: true },
    updated_at: { type: Date, required: true }
});

const Airport = mongoose.model("Airport", airportSchema);

export default Airport;

