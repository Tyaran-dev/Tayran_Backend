import express from "express";
const router = express.Router();
import { flightOffers, flightPricing, flightBooking, getFlightOrder } from "../../controllers/flights/flights.controller.js";


router.post("/flight-search", flightOffers);
router.post("/flight-pricing", flightPricing);
router.post("/flight-booking", flightBooking);
router.get("/flight-order/:flightId", getFlightOrder);



export default router;


















// {
//     "message": "Flight order created successfully",
//     "order": {
//         "data": {
//             "type": "flight-order",
//             "id": "eJzTd9cPNPGKjPIAAAtKAnA%3D",
//             "queuingOfficeId": "NCE4D31SB",
//             "associatedRecords": [
//                 {
//                     "reference": "Q4JYZH",
//                     "creationDate": "2025-06-11T10:43:00.000",
//                     "originSystemCode": "GDS",
//                     "flightOfferId": "1"
//                 }
//             ],
//             "flightOffers": [
//                 {
//                     "type": "flight-offer",
//                     "id": "1",
//                     "source": "GDS",
//                     "nonHomogeneous": false,
//                     "lastTicketingDate": "2025-06-30",
//                     "itineraries": [
//                         {
//                             "segments": [
//                                 {
//                                     "departure": {
//                                         "iataCode": "CAI",
//                                         "terminal": "2",
//                                         "at": "2025-06-30T04:20:00"
//                                     },
//                                     "arrival": {
//                                         "iataCode": "JED",
//                                         "terminal": "1",
//                                         "at": "2025-06-30T06:35:00"
//                                     },
//                                     "carrierCode": "SV",
//                                     "number": "308",
//                                     "aircraft": {
//                                         "code": "330"
//                                     },
//                                     "duration": "PT2H15M",
//                                     "id": "13",
//                                     "numberOfStops": 0,
//                                     "co2Emissions": [
//                                         {
//                                             "weight": 104,
//                                             "weightUnit": "KG",
//                                             "cabin": "ECONOMY"
//                                         }
//                                     ]
//                                 },
//                                 {
//                                     "departure": {
//                                         "iataCode": "JED",
//                                         "terminal": "1",
//                                         "at": "2025-06-30T08:20:00"
//                                     },
//                                     "arrival": {
//                                         "iataCode": "MED",
//                                         "at": "2025-06-30T09:25:00"
//                                     },
//                                     "carrierCode": "SV",
//                                     "number": "1424",
//                                     "aircraft": {
//                                         "code": "320"
//                                     },
//                                     "duration": "PT1H5M",
//                                     "id": "14",
//                                     "numberOfStops": 0,
//                                     "co2Emissions": [
//                                         {
//                                             "weight": 51,
//                                             "weightUnit": "KG",
//                                             "cabin": "ECONOMY"
//                                         }
//                                     ]
//                                 }
//                             ]
//                         }
//                     ],
//                     "price": {
//                         "currency": "SAR",
//                         "total": "399.81",
//                         "base": "102.00",
//                         "fees": [
//                             {
//                                 "amount": "0.00",
//                                 "type": "TICKETING"
//                             },
//                             {
//                                 "amount": "0.00",
//                                 "type": "SUPPLIER"
//                             },
//                             {
//                                 "amount": "0.00",
//                                 "type": "FORM_OF_PAYMENT"
//                             }
//                         ],
//                         "grandTotal": "399.81",
//                         "billingCurrency": "SAR"
//                     },
//                     "pricingOptions": {
//                         "fareType": [
//                             "PUBLISHED"
//                         ],
//                         "includedCheckedBagsOnly": true
//                     },
//                     "validatingAirlineCodes": [
//                         "SV"
//                     ],
//                     "travelerPricings": [
//                         {
//                             "travelerId": "1",
//                             "fareOption": "STANDARD",
//                             "travelerType": "ADULT",
//                             "price": {
//                                 "currency": "SAR",
//                                 "total": "399.81",
//                                 "base": "102.00",
//                                 "taxes": [
//                                     {
//                                         "amount": "8.00",
//                                         "code": "E3"
//                                     },
//                                     {
//                                         "amount": "12.00",
//                                         "code": "EG"
//                                     },
//                                     {
//                                         "amount": "8.00",
//                                         "code": "EQ"
//                                     },
//                                     {
//                                         "amount": "23.81",
//                                         "code": "IO"
//                                     },
//                                     {
//                                         "amount": "8.00",
//                                         "code": "JK"
//                                     },
//                                     {
//                                         "amount": "2.00",
//                                         "code": "O2"
//                                     },
//                                     {
//                                         "amount": "4.00",
//                                         "code": "O9"
//                                     },
//                                     {
//                                         "amount": "94.00",
//                                         "code": "QH"
//                                     },
//                                     {
//                                         "amount": "8.00",
//                                         "code": "S4"
//                                     },
//                                     {
//                                         "amount": "5.00",
//                                         "code": "T2"
//                                     },
//                                     {
//                                         "amount": "12.00",
//                                         "code": "XK"
//                                     },
//                                     {
//                                         "amount": "113.00",
//                                         "code": "YR"
//                                     }
//                                 ],
//                                 "refundableTaxes": "331.81"
//                             },
//                             "fareDetailsBySegment": [
//                                 {
//                                     "segmentId": "13",
//                                     "cabin": "ECONOMY",
//                                     "fareBasis": "VAOTEGB4",
//                                     "brandedFare": "NBASICE",
//                                     "class": "V",
//                                     "includedCheckedBags": {
//                                         "quantity": 1
//                                     }
//                                 },
//                                 {
//                                     "segmentId": "14",
//                                     "cabin": "ECONOMY",
//                                     "fareBasis": "VAOTEGB4",
//                                     "brandedFare": "NBASICE",
//                                     "class": "E",
//                                     "includedCheckedBags": {
//                                         "quantity": 1
//                                     }
//                                 }
//                             ]
//                         }
//                     ]
//                 }
//             ],
//             "travelers": [
//                 {
//                     "id": "1",
//                     "dateOfBirth": "1982-01-16",
//                     "gender": "MALE",
//                     "name": {
//                         "firstName": "JOHN",
//                         "lastName": "DOE"
//                     },
//                     "documents": [
//                         {
//                             "number": "123456789",
//                             "expiryDate": "2030-12-31",
//                             "issuanceCountry": "US",
//                             "nationality": "US",
//                             "documentType": "PASSPORT",
//                             "holder": true
//                         }
//                     ],
//                     "contact": {
//                         "purpose": "STANDARD",
//                         "phones": [
//                             {
//                                 "deviceType": "MOBILE",
//                                 "countryCallingCode": "1",
//                                 "number": "5551234567"
//                             }
//                         ],
//                         "emailAddress": "john.doe2@example.com"
//                     }
//                 }
//             ],
//             "ticketingAgreement": {
//                 "option": "CONFIRM"
//             },
//             "automatedProcess": [
//                 {
//                     "code": "IMMEDIATE",
//                     "queue": {
//                         "number": "0",
//                         "category": "0"
//                     },
//                     "officeId": "NCE4D31SB"
//                 }
//             ]
//         },
//         "dictionaries": {
//             "locations": {
//                 "JED": {
//                     "cityCode": "JED",
//                     "countryCode": "SA"
//                 },
//                 "CAI": {
//                     "cityCode": "CAI",
//                     "countryCode": "EG"
//                 },
//                 "MED": {
//                     "cityCode": "MED",
//                     "countryCode": "SA"
//                 }
//             }
//         }
//     }
// }




// {
//     "message": "Flight order created successfully",
//     "order": {
//         "data": {
//             "type": "flight-order",
//             "id": "eJzTd9cPNPEOi%2FIAAAtFAm4%3D",
//             "queuingOfficeId": "NCE4D31SB",
//             "associatedRecords": [
//                 {
//                     "reference": "Q4KVZH",
//                     "creationDate": "2025-06-11T10:46:00.000",
//                     "originSystemCode": "GDS",
//                     "flightOfferId": "1"
//                 }
//             ],
//             "flightOffers": [
//                 {
//                     "type": "flight-offer",
//                     "id": "1",
//                     "source": "GDS",
//                     "nonHomogeneous": false,
//                     "lastTicketingDate": "2025-06-30",
//                     "itineraries": [
//                         {
//                             "segments": [
//                                 {
//                                     "departure": {
//                                         "iataCode": "CAI",
//                                         "terminal": "2",
//                                         "at": "2025-06-30T04:20:00"
//                                     },
//                                     "arrival": {
//                                         "iataCode": "JED",
//                                         "terminal": "1",
//                                         "at": "2025-06-30T06:35:00"
//                                     },
//                                     "carrierCode": "SV",
//                                     "number": "308",
//                                     "aircraft": {
//                                         "code": "330"
//                                     },
//                                     "duration": "PT2H15M",
//                                     "id": "13",
//                                     "numberOfStops": 0,
//                                     "co2Emissions": [
//                                         {
//                                             "weight": 104,
//                                             "weightUnit": "KG",
//                                             "cabin": "ECONOMY"
//                                         }
//                                     ]
//                                 },
//                                 {
//                                     "departure": {
//                                         "iataCode": "JED",
//                                         "terminal": "1",
//                                         "at": "2025-06-30T08:20:00"
//                                     },
//                                     "arrival": {
//                                         "iataCode": "MED",
//                                         "at": "2025-06-30T09:25:00"
//                                     },
//                                     "carrierCode": "SV",
//                                     "number": "1424",
//                                     "aircraft": {
//                                         "code": "320"
//                                     },
//                                     "duration": "PT1H5M",
//                                     "id": "14",
//                                     "numberOfStops": 0,
//                                     "co2Emissions": [
//                                         {
//                                             "weight": 51,
//                                             "weightUnit": "KG",
//                                             "cabin": "ECONOMY"
//                                         }
//                                     ]
//                                 }
//                             ]
//                         }
//                     ],
//                     "price": {
//                         "currency": "SAR",
//                         "total": "399.81",
//                         "base": "102.00",
//                         "fees": [
//                             {
//                                 "amount": "0.00",
//                                 "type": "TICKETING"
//                             },
//                             {
//                                 "amount": "0.00",
//                                 "type": "SUPPLIER"
//                             },
//                             {
//                                 "amount": "0.00",
//                                 "type": "FORM_OF_PAYMENT"
//                             }
//                         ],
//                         "grandTotal": "399.81",
//                         "billingCurrency": "SAR"
//                     },
//                     "pricingOptions": {
//                         "fareType": [
//                             "PUBLISHED"
//                         ],
//                         "includedCheckedBagsOnly": true
//                     },
//                     "validatingAirlineCodes": [
//                         "SV"
//                     ],
//                     "travelerPricings": [
//                         {
//                             "travelerId": "1",
//                             "fareOption": "STANDARD",
//                             "travelerType": "ADULT",
//                             "price": {
//                                 "currency": "SAR",
//                                 "total": "399.81",
//                                 "base": "102.00",
//                                 "taxes": [
//                                     {
//                                         "amount": "8.00",
//                                         "code": "E3"
//                                     },
//                                     {
//                                         "amount": "12.00",
//                                         "code": "EG"
//                                     },
//                                     {
//                                         "amount": "8.00",
//                                         "code": "EQ"
//                                     },
//                                     {
//                                         "amount": "23.81",
//                                         "code": "IO"
//                                     },
//                                     {
//                                         "amount": "8.00",
//                                         "code": "JK"
//                                     },
//                                     {
//                                         "amount": "2.00",
//                                         "code": "O2"
//                                     },
//                                     {
//                                         "amount": "4.00",
//                                         "code": "O9"
//                                     },
//                                     {
//                                         "amount": "94.00",
//                                         "code": "QH"
//                                     },
//                                     {
//                                         "amount": "8.00",
//                                         "code": "S4"
//                                     },
//                                     {
//                                         "amount": "5.00",
//                                         "code": "T2"
//                                     },
//                                     {
//                                         "amount": "12.00",
//                                         "code": "XK"
//                                     },
//                                     {
//                                         "amount": "113.00",
//                                         "code": "YR"
//                                     }
//                                 ],
//                                 "refundableTaxes": "331.81"
//                             },
//                             "fareDetailsBySegment": [
//                                 {
//                                     "segmentId": "13",
//                                     "cabin": "ECONOMY",
//                                     "fareBasis": "VAOTEGB4",
//                                     "brandedFare": "NBASICE",
//                                     "class": "V",
//                                     "includedCheckedBags": {
//                                         "quantity": 1
//                                     }
//                                 },
//                                 {
//                                     "segmentId": "14",
//                                     "cabin": "ECONOMY",
//                                     "fareBasis": "VAOTEGB4",
//                                     "brandedFare": "NBASICE",
//                                     "class": "E",
//                                     "includedCheckedBags": {
//                                         "quantity": 1
//                                     }
//                                 }
//                             ]
//                         }
//                     ]
//                 }
//             ],
//             "travelers": [
//                 {
//                     "id": "1",
//                     "dateOfBirth": "1982-01-16",
//                     "gender": "MALE",
//                     "name": {
//                         "firstName": "JOHN",
//                         "lastName": "DOE"
//                     },
//                     "documents": [
//                         {
//                             "number": "123456789",
//                             "expiryDate": "2030-12-31",
//                             "issuanceCountry": "US",
//                             "nationality": "US",
//                             "documentType": "PASSPORT",
//                             "holder": true
//                         }
//                     ],
//                     "contact": {
//                         "purpose": "STANDARD",
//                         "phones": [
//                             {
//                                 "deviceType": "MOBILE",
//                                 "countryCallingCode": "1",
//                                 "number": "5551234567"
//                             }
//                         ],
//                         "emailAddress": "john.doe2@example.com"
//                     }
//                 }
//             ],
//             "ticketingAgreement": {
//                 "option": "CONFIRM"
//             },
//             "automatedProcess": [
//                 {
//                     "code": "IMMEDIATE",
//                     "queue": {
//                         "number": "0",
//                         "category": "0"
//                     },
//                     "officeId": "NCE4D31SB"
//                 }
//             ]
//         },
//         "dictionaries": {
//             "locations": {
//                 "JED": {
//                     "cityCode": "JED",
//                     "countryCode": "SA"
//                 },
//                 "CAI": {
//                     "cityCode": "CAI",
//                     "countryCode": "EG"
//                 },
//                 "MED": {
//                     "cityCode": "MED",
//                     "countryCode": "SA"
//                 }
//             }
//         }
//     }
// }