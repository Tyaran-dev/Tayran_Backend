import { ApiError } from "../../utils/apiError.js";
import { getAmadeusToken } from "../../utils/amadeus-token.js";
import axios from "axios";
import Airport from "../../models/Airport.model.js";
import Airline from "../../models/Airline.model.js"

// Helper function to format duration from ISO format (PT1H50M) to readable format
const formatDuration = (isoDuration) => {
    const matches = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    const hours = matches[1] ? parseInt(matches[1]) : 0;
    const minutes = matches[2] ? parseInt(matches[2]) : 0;

    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
};

// Helper function to format time (2025-05-28T16:30:00) to 04:30 pm
const formatTime = (isoTime) => {
    const date = new Date(isoTime);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    return `${hours}:${minutes} ${ampm}`;
};

export const flightOffers = async (req, res, next) => {
    try {
        const lang = req.get('lng') || 'en'; // Default to English if no language header
        const { destinations, adults, children, infants, cabinClass, directFlight } = req.body;
        const baseUrl = process.env.AMADEUS_BASE_URL;

        // Validate and prepare request to Amadeus API
        const token = await getAmadeusToken();
        let travelersId = 1; // Start with 1
        const travelers = [];

        // Add adults
        for (let i = 0; i < adults; i++) {
            travelers.push({
                id: (travelersId++).toString(),
                travelerType: "ADULT",
                fareOptions: ["STANDARD"]
            });
        }

        // Add children
        for (let i = 0; i < children; i++) {
            travelers.push({
                id: (travelersId++).toString(),
                travelerType: "CHILD",
                fareOptions: ["STANDARD"]
            });
        }

        // Add infants
        for (let i = 0; i < infants; i++) {
            travelers.push({
                id: (travelersId++).toString(),
                travelerType: "HELD_INFANT",
                fareOptions: ["STANDARD"],
                associatedAdultId: "1" // or dynamically assign to actual adult ID
            });
        }
        const response = await axios.post(
            `${baseUrl}/v2/shopping/flight-offers`,
            {
                currencyCode: "SAR",
                originDestinations: destinations.map((dest, index) => ({
                    id: (index + 1).toString(),
                    originLocationCode: dest.from,
                    destinationLocationCode: dest.to,
                    departureDateTimeRange: {
                        date: dest.date,
                        time: "00:00:00"
                    }
                })),
                travelers,
                sources: ["GDS"],
                searchCriteria: {
                    maxFlightOffers: 250,
                    flightFilters: {
                        cabinRestrictions: [{
                            cabin: cabinClass?.toUpperCase() || "ECONOMY",
                            coverage: "MOST_SEGMENTS",
                            originDestinationIds: destinations.map((_, i) => (i + 1).toString())
                        }],
                        carrierRestrictions: {
                            excludedCarrierCodes: ["ZZ"]
                        },
                        connectionRestrictions: {
                            maxNumberOfConnections: directFlight ? 0 : 3
                        }
                    }
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const carriersCodes = Object.keys(response.data.dictionaries?.carriers);

        const airlineDocs = await Airline.find({
            airLineCode: { $in: carriersCodes }
        });

        const airlineMap = airlineDocs.map((airline, index) => {
            return {
                ...airline._doc,
                name: lang === "en" ? airline._doc.airLineName : airline._doc.airlineNameAr,
                image: `https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20240602/flights/airlines_square/${airline.airLineCode}.png`
            }
        });

        // Extract all unique airport codes from the response
        const airportCodes = new Set();
        response.data.data.forEach(offer => {
            offer.itineraries.forEach(itinerary => {
                itinerary.segments.forEach(segment => {
                    airportCodes.add(segment.departure.iataCode);
                    airportCodes.add(segment.arrival.iataCode);
                });
            });
        });

        console.log(response.data.data,"search here")

        // Fetch airport details for all unique codes
        const airports = await Airport.find({
            airport_code: { $in: Array.from(airportCodes) }
        });

        // Create a map of airport code to localized details
        const airportMap = airports.reduce((map, airport) => {
            map[airport.airport_code] = {
                id: airport._id,
                name: lang === 'ar' ? airport.name_ar : airport.name_en,
                city: lang === 'ar' ? airport.airport_city_ar : airport.airport_city_en,
                country: lang === 'ar' ? airport.country_ar : airport.country_en
            };
            return map;
        }, {});

        // Transform Amadeus response to your desired format
        const formattedResponse = response.data.data.map((offer, index) => {
            // Create mapping string (CAI-MED|2025-05-28|XY-575||MED-CAI|2025-05-29|XY-576)
            const mapping = offer.itineraries.map(itinerary => {
                const segment = itinerary.segments[0];
                return `${segment.departure.iataCode}-${segment.arrival.iataCode}|${segment.departure.at.split('T')[0]}|${segment.carrierCode}-${segment.number}`;
            }).join('||');

            // Prepare itineraries_formated with localized airport info
            const itineraries_formated = offer.itineraries.map((itinerary, i) => {
                // Process all segments, not just the first one
                const segments = itinerary.segments.map((segment, segmentIndex) => {
                    const departureAirport = airportMap[segment.departure.iataCode] || {
                        id: segment.departure.iataCode,
                        name: `${segment.departure.iataCode} Airport`,
                        city: segment.departure.iataCode,
                        country: ''
                    };

                    const arrivalAirport = airportMap[segment.arrival.iataCode] || {
                        id: segment.arrival.iataCode,
                        name: `${segment.arrival.iataCode} Airport`,
                        city: segment.arrival.iataCode,
                        country: ''
                    };

                    // Calculate stop duration if this isn't the first segment
                    let stopDuration = null;
                    if (segmentIndex > 0) {
                        const prevSegment = itinerary.segments[segmentIndex - 1];
                        const arrivalTime = new Date(prevSegment.arrival.at);
                        const departureTime = new Date(segment.departure.at);
                        const durationMinutes = (departureTime - arrivalTime) / (1000 * 60);

                        const hours = Math.floor(durationMinutes / 60);
                        const minutes = Math.floor(durationMinutes % 60);
                        stopDuration = `${hours}h ${minutes}m`;
                    }

                    return {
                        ...segment,
                        departure_date: segment.departure.at.split('T')[0],
                        departure_time: formatTime(segment.departure.at),
                        arrival_date: segment.arrival.at.split('T')[0],
                        arrival_time: formatTime(segment.arrival.at),
                        duration: formatDuration(segment.duration),
                        stopDuration,
                        stopLocation: segmentIndex > 0 ? departureAirport.name : null,
                        fromName: departureAirport.name,
                        toName: arrivalAirport.name,
                        fromAirport: {
                            id: departureAirport.id,
                            name: departureAirport.name,
                            code: segment.departure.iataCode,
                            city: departureAirport.city,
                            country: departureAirport.country
                        },
                        toAirport: {
                            id: arrivalAirport.id,
                            name: arrivalAirport.name,
                            code: segment.arrival.iataCode,
                            city: arrivalAirport.city,
                            country: arrivalAirport.country
                        },
                        class: offer.travelerPricings[0].fareDetailsBySegment[i]?.class || 'ECONOMY',
                        image: `https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20240602/flights/airlines_square/${segment.carrierCode}.png`
                    };
                });

                // Get first and last segments for overall itinerary info
                const firstSegment = segments[0];
                const lastSegment = segments[segments.length - 1];

                return {
                    duration: formatDuration(itinerary.duration),
                    fromLocation: firstSegment.departure.iataCode,
                    toLocation: lastSegment.arrival.iataCode,
                    fromName: firstSegment.fromName,
                    toName: lastSegment.toName,
                    fromAirport: firstSegment.fromAirport,
                    toAirport: lastSegment.toAirport,
                    departure: {
                        departure_date_time: firstSegment.departure.at,
                        departure_date: firstSegment.departure_date,
                        departure_time: firstSegment.departure_time,
                        departure_terminal: firstSegment.departure.terminal || null,
                        arrival_date_time: lastSegment.arrival.at,
                        arrival_date: lastSegment.arrival_date,
                        arrival_time: lastSegment.arrival_time,
                        arrival_terminal: lastSegment.arrival.terminal || null,
                        stops: segments.length - 1, // Total stops is segments count - 1
                        duration: formatDuration(itinerary.duration),
                        flightNumber: firstSegment.number,
                        airlineCode: firstSegment.carrierCode,
                        airlineName: firstSegment.carrierCode,
                        image: firstSegment.image
                    },
                    segments: segments,
                    stops: segments.length > 1 ? segments.slice(1).map((seg, idx) => ({
                        airport: seg.fromAirport,
                        arrivalTime: segments[idx].arrival_time,
                        departureTime: seg.departure_time,
                        duration: seg.stopDuration,
                        airline: seg.carrierCode
                    })) : []
                };
            });
            // Get airline codes for filters
            const airlineCodes = [...new Set(
                offer.itineraries.flatMap(it =>
                    it.segments.map(seg => seg.carrierCode)
                ))];

            // Prepare the complete response object
            return {
                mapping,
                type: "flight-offer",
                id: offer.id,
                agent: "GDS",
                source: offer.source,
                fromLocation: offer.itineraries[0].segments[0].departure.iataCode,
                toLocation: offer.itineraries.slice(-1)[0].segments[0].arrival.iataCode,
                fromName: airportMap[offer.itineraries[0].segments[0].departure.iataCode]?.name ||
                    `${offer.itineraries[0].segments[0].departure.iataCode} Airport`,
                toName: airportMap[offer.itineraries.slice(-1)[0].segments[0].arrival.iataCode]?.name ||
                    `${offer.itineraries.slice(-1)[0].segments[0].arrival.iataCode} Airport`,
                flightType: offer.oneWay ? "OneWay" : "RoundTrip",
                adults: adults,
                children: children || 0,
                infants: infants || 0,
                numberOfBookableSeats: offer.numberOfBookableSeats,
                airline: airlineCodes[0],
                airlineName: airlineCodes[0], // Lookup actual name if needed
                flightNumber: offer.itineraries[0].segments[0].number,
                stops: Math.max(...offer.itineraries.map(it => it.segments.length - 1)),
                original_price: offer.price.total,
                price: parseFloat(offer.price.total),
                currency: offer.price.currency,
                refund: !offer.fareRules?.rules?.some(r => r.category === "REFUND" && r.notApplicable),
                exchange: !offer.fareRules?.rules?.some(r => r.category === "EXCHANGE" && r.notApplicable),
                cabinClass: cabinClass || "ECONOMY",
                allowedBags: `${offer.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags?.weight || 0} KG`,
                allowedCabinBags: offer.travelerPricings[0].fareDetailsBySegment[0].includedCabinBags?.quantity || 0,
                provider: "amadeus",
                itineraries_formated,
                fare_rules: offer.fareRules?.rules || [],
                pricing_options: offer.pricingOptions,
                traveller_pricing: offer.travelerPricings.map(tp => ({
                    travelerType: tp.travelerType,
                    total: tp.price.total,
                    base: tp.price.base,
                    tax: parseFloat(tp.price.total) - parseFloat(tp.price.base),
                    class: tp.fareDetailsBySegment[0].class,
                    allowedBags: {
                        quantity: `${tp.fareDetailsBySegment[0].includedCheckedBags?.weight || 0} KG`,
                        weight: `${tp.fareDetailsBySegment[0].includedCheckedBags?.weight || 0} KG`
                    },
                    cabinBagsAllowed: tp.fareDetailsBySegment[0].includedCabinBags?.quantity || 0,
                    fareDetails: tp.fareDetailsBySegment.map(fds => ({
                        segmentId: fds.segmentId,
                        cabin: fds.cabin,
                        fareBasis: fds.fareBasis,
                        class: fds.class,
                        bagsAllowed: `${fds.includedCheckedBags?.weight || 0} KG`,
                        cabinBagsAllowed: fds.includedCabinBags?.quantity || 0
                    }))
                })),
                baggage_details: offer.itineraries.flatMap((it, i) => it.segments.map(seg => ({
                    "Flight Number": seg.number,
                    "From": seg.departure.iataCode,
                    "To": seg.arrival.iataCode,
                    "Airline": seg.carrierCode,
                    "Checked Bags Allowed": offer.travelerPricings[0].fareDetailsBySegment[i].includedCheckedBags?.weight || 0,
                    "Cabin Bags Allowed": offer.travelerPricings[0].fareDetailsBySegment[i].includedCabinBags?.quantity || 0
                }))),
                total_pricing_by_traveller_type: offer.travelerPricings.reduce((acc, tp) => {
                    acc[tp.travelerType] = {
                        totalPrice: parseFloat(tp.price.total),
                        travelerCount: tp.travelerType === "ADULT" ? adults :
                            tp.travelerType === "CHILD" ? children : infants
                    };
                    return acc;
                }, {}),
                charges: {
                    exchange: offer.fareRules?.rules?.find(r => r.category === "EXCHANGE")?.maxPenaltyAmount || "Not Applicable",
                    refund: offer.fareRules?.rules?.find(r => r.category === "REFUND")?.notApplicable ? "Not Applicable" : "Available",
                    revalidation: offer.fareRules?.rules?.find(r => r.category === "REVALIDATION")?.notApplicable ? "Not Applicable" : "Available"
                },
                origins: [...new Set(offer.itineraries.map(it => it.segments[0].departure.iataCode))],
                destinations: [...new Set(offer.itineraries.map(it => it.segments[0].arrival.iataCode))],
                originalResponse: offer // Include the original response for reference
            };
        });

        res.status(200).json({
            success: true,
            data: formattedResponse,
            filters: {
                carriers: airlineMap || {},
                aircraft: response.data.dictionaries?.aircraft || {},
                currencies: response.data.dictionaries?.currencies || {},
                locations: response.data.dictionaries?.locations || {}
            }
        });

    } catch (error) {
        console.error("Amadeus API Error:", error.response?.data || error.message);
        next(new ApiError(
            error.response?.status || 500,
            error.response?.data?.errors?.[0]?.detail || "Error searching for flights"
        ));
    }
};

export const flightPricing = async (req, res, next) => {
    try {
        const token = await getAmadeusToken();
        const flightOffer = req.body;
        const baseUrl = process.env.AMADEUS_BASE_URL;


        // Correct request body format
        const requestBody = {
            data: {
                type: "flight-offers-pricing",
                flightOffers: [flightOffer.originalResponse] // Use the originalResponse and wrap it in array
            }
        };

        const response = await axios.post(
            `${baseUrl}/v1/shopping/flight-offers/pricing`,
            requestBody, // Send requestBody directly, not wrapped in another object
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.status(200).json(response.data);

    } catch (error) {
        console.error("Amadeus API Error:", error.response?.data || error.message);
        next(new ApiError(
            error.response?.status || 500,
            error.response?.data?.errors?.[0]?.detail || "Error searching for flights"
        ));
    }
}


export const flightBooking = async (req, res, next) => {
    try {
        const token = await getAmadeusToken();
        const { flightOffer, travelers, ticketingAgreement } = req.body;
        const baseUrl = process.env.AMADEUS_BASE_URL;


        // Prepare the request payload
        const payload = {
            data: {
                type: 'flight-order',
                flightOffers: [flightOffer],
                travelers: travelers
            }
        };

        // Only add ticketingAgreement if it exists in the request body
        if (ticketingAgreement && Object.keys(ticketingAgreement).length > 0) {
            payload.data.ticketingAgreement = ticketingAgreement;
        }

        if (!flightOffer || !travelers) {
            return next(new ApiError(400, "Missing flightOffer or travelers in request body"));
        }

        const response = await axios.post(
            `${baseUrl}/v1/booking/flight-orders`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.status(201).json({
            message: 'Flight order created successfully',
            order: response.data
        });

    } catch (error) {
        console.error("Amadeus API Error:", error.response?.data || error.message);
        next(new ApiError(
            error.response?.status || 500,
            error.response?.data?.errors?.[0]?.detail || "Error booking flights"
        ));
    }
};


export const getFlightOrder = async (req, res, next) => {
    try {
        const token = await getAmadeusToken();
        const flightId = req.params.flightId;
        const baseUrl = process.env.AMADEUS_BASE_URL;

        if (!flightId) {
            return next(new ApiError(400, "Missing flight id in request body"));
        }

        const apiUrl = `${baseUrl}/v1/booking/flight-orders/${flightId}`;

        const response = await axios.get(apiUrl, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        res.status(201).json({
            message: 'Flight Order Data',
            flightOrderData: response.data
        });

    } catch (error) {
        console.error("Amadeus API Error:", error.response?.data || error.message);
        next(new ApiError(
            error.response?.status || 500,
            error.response?.data?.errors?.[0]?.detail || "Error get flight order"
        ));
    }
}
