import { ApiError } from "../../utils/apiError.js";
import Airport from "../../models/airport.model.js";


export const getAirports = async (req, res, next) => {
    const { keyword = '', limit = 100, offset = 0 } = req.query;
    const lang = req.get('lng') || 'en'; // Default to English if no language header


    if (!keyword) {
        return res.status(400).json({ error: 'Missing keyword query param' });
    }

    try {
        const regex = new RegExp(keyword, 'i'); // case-insensitive match
        const airports = await Airport.find({
            $or: [
                { airport_code: { $regex: regex } },
                { airport_city_ar: { $regex: regex } },
                { airport_city_en: { $regex: regex } },
            ]
        })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

        // Sort airports - exact code matches first
        const sortedAirports = airports.sort((a, b) => {
            // Check if airport_code exactly matches the keyword (case insensitive)
            const aIsExactMatch = a.airport_code.toLowerCase() === keyword.toLowerCase();
            const bIsExactMatch = b.airport_code.toLowerCase() === keyword.toLowerCase();
            
            if (aIsExactMatch && !bIsExactMatch) return -1; // a comes first
            if (!aIsExactMatch && bIsExactMatch) return 1;  // b comes first
            
            // If both or neither are exact matches, sort by priority (higher priority first)
            return b.priority - a.priority;
        });

        // Transform the response based on language
        const transformedAirports = sortedAirports.map(airport => {
            if (lang.toLowerCase() === 'ar') {
                return {
                    id: airport.airport_code,
                    text: `${airport.name_ar} - ${airport.airport_city_ar}`,
                    name: airport.name_ar,
                    city: airport.airport_city_ar
                };
            } else {
                return {
                    id: airport.airport_code,
                    text: `${airport.name_en} - ${airport.airport_city_en}`,
                    name: airport.name_en,
                    city: airport.airport_city_en
                };
            }
        });

        return res.status(200).json({ data: transformedAirports });
    } catch (error) {
        console.error('DB Query Error:', error.message);
        return next(new ApiError(500, 'Internal Server Error'));
    }
}