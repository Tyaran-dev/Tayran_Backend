import axios from "axios";
import { ApiError } from "../../utils/apiError.js";

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  return `${year}-${month}-${day}`;
};

export const getCountryList = async (req, res, next) => {
  try {
    const userName = process.env.TBO_USER_NAME,
      passwrod = process.env.TBO_PASSWORD;
    const reponse = await axios.get(
      "http://api.tbotechnology.in/TBOHolidays_HotelAPI/CountryList",
      {
        auth: {
          username: userName,
          password: passwrod,
        },
      }
    );
    return res.status(200).json({ data: reponse.data.CountryList });
  } catch (error) {
    next(
      new ApiError(
        error.response?.status || 500,
        error.response?.data?.errors?.[0]?.detail ||
          "Error searching for countries"
      )
    );
  }
};

export const getCityList = async (req, res, next) => {
  try {
    const userName = process.env.TBO_USER_NAME,
      passwrod = process.env.TBO_PASSWORD;

    const { CountryCode } = req.body;

    const reponse = await axios.post(
      "http://api.tbotechnology.in/TBOHolidays_HotelAPI/CityList",
      {
        CountryCode,
      },
      {
        auth: {
          username: userName,
          password: passwrod,
        },
      }
    );
    return res.status(200).json({ data: reponse.data.CityList });
  } catch (error) {
    next(
      new ApiError(
        error.response?.status || 500,
        error.response?.data?.errors?.[0]?.detail ||
          "Error searching for cities"
      )
    );
  }
};

const PER_PAGE = 30;

export const hotelsSearch = async (req, res, next) => {
  try {
    const userName = process.env.TBO_USER_NAME;
    const password = process.env.TBO_PASSWORD;

    const {
      CheckIn,
      CheckOut,
      CityCode,
      GuestNationality,
      PreferredCurrencyCode = "SAR",
      PaxRooms,
      Language = "EN",
      page = 1,
    } = req.body;

    // Step 0: Basic validation
    if (!CityCode || !CheckIn || !CheckOut || !PaxRooms || !GuestNationality) {
      return next(
        new ApiError(400, "Missing required fields for hotel search")
      );
    }

    // Step 1: Fetch hotel codes for the city
    const hotelCodesRes = await axios.post(
      "http://api.tbotechnology.in/TBOHolidays_HotelAPI/TBOHotelCodeList",
      { CityCode },
      { auth: { username: userName, password } }
    );

    const allHotelCodes =
      hotelCodesRes.data?.Hotels?.map((h) => h.HotelCode) || [];

    if (allHotelCodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No hotel codes found for the selected city.",
      });
    }

    const HotelCodes = allHotelCodes.join(",");

    // Step 2: Fetch avilable rooms in hotel
    const hotelSearchPayload = {
      CheckIn: formatDate(CheckIn),
      CheckOut: formatDate(CheckOut),
      HotelCodes,
      GuestNationality,
      PreferredCurrencyCode,
      PaxRooms,
      ResponseTime: 23.0,
      IsDetailedResponse: true,
      Filters: {
        Refundable: false,
        NoOfRooms: "All",
        MealType: "All",
      },
    };

    const hotelSearchRes = await axios.post(
      "http://api.tbotechnology.in/TBOHolidays_HotelAPI/Search",
      hotelSearchPayload,
      { auth: { username: userName, password } }
    );

    const searchResults = hotelSearchRes.data?.HotelResult || [];
    console.log(searchResults, "firstttttttttttttttttttttttttttttttt");

    const aviailableHotelCodes = searchResults.map(
      (result) => result.HotelCode
    );

    // Step 3: Paginate avilable hotel codes
    const startIndex = (page - 1) * PER_PAGE;
    const currentBatchArray = aviailableHotelCodes.slice(
      startIndex,
      startIndex + PER_PAGE
    );

    if (currentBatchArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No hotels found for page ${page}.`,
      });
    }

    const currentBatch = currentBatchArray.join(",");

    // Step 4: fetch deatails avilable hotels
    const hotelDetailsRes = await axios.post(
      "http://api.tbotechnology.in/TBOHolidays_HotelAPI/HotelDetails",
      { Hotelcodes: currentBatch, Language },
      { auth: { username: userName, password } }
    );

    const hotelDetails = hotelDetailsRes.data?.HotelDetails || [];

    // Step 5: Merge hotel details with pricing
    const enrichedHotels = hotelDetails.map((hotel) => {
      const hotelCode = hotel?.HotelCode;
      const matched = searchResults.find(
        (result) => result.HotelCode === hotelCode
      );

      return {
        ...hotel,
        MinHotelPrice: matched?.Rooms[0]?.DayRates[0][0].BasePrice || null,
      };
    });

    // Step 6: Return the result
    return res.status(200).json({
      success: true,
      data: enrichedHotels,
      pagination: {
        page,
        perPage: PER_PAGE,
        total: aviailableHotelCodes.length,
        totalPages: Math.ceil(aviailableHotelCodes.length / PER_PAGE),
      },
    });
  } catch (error) {
    console.error(
      "Hotel search error:",
      error?.response?.data || error.message
    );
    next(
      new ApiError(
        error.response?.status || 500,
        error.response?.data?.errors?.[0]?.detail ||
          "Error searching for hotels"
      )
    );
  }
};

export const getHotelDetails = async (req, res, next) => {
  try {
    const userName = process.env.TBO_USER_NAME,
      password = process.env.TBO_PASSWORD;

    const {
      CheckIn,
      CheckOut,
      CityCode,
      HotelCodes,
      GuestNationality,
      PreferredCurrencyCode = "SAR",
      PaxRooms,
      Language = "EN",
    } = req.body;

    if (!HotelCodes) {
      return next(new ApiError(400, "Hotel codes are required"));
    }

    const hotelSearchPayload = {
      CheckIn: formatDate(CheckIn),
      CheckOut: formatDate(CheckOut),
      CityCode,
      HotelCodes,
      GuestNationality,
      PreferredCurrencyCode,
      PaxRooms,
      ResponseTime: 23.0,
      IsDetailedResponse: true,
      Filters: {
        Refundable: false,
        NoOfRooms: "All",
        MealType: "All",
      },
    };

    const hotelDetails = await axios.post(
      "http://api.tbotechnology.in/TBOHolidays_HotelAPI/HotelDetails",
      { HotelCodes, Language },
      {
        auth: {
          username: userName,
          password,
        },
      }
    );

    const hotel = hotelDetails.data.HotelDetails;

    const getRooms = await axios.post(
      "http://api.tbotechnology.in/TBOHolidays_HotelAPI/Search",
      hotelSearchPayload,
      { auth: { username: userName, password } }
    );

    console.log(getRooms, "hereeeeeeeeeee");
    const availableRooms = getRooms.data?.HotelResult[0].Rooms || [];
    // console.log(availableRooms, "avilaible rooooooooms")

    return res.status(200).json({
      data: {
        hotel,
        availableRooms,
      },
    });
  } catch (error) {
    next(
      new ApiError(
        error.response?.status || 500,
        error.response?.data?.errors?.[0]?.detail ||
          "Error searching for Hotel Details "
      )
    );
  }
};

export const preBookRoom = async (req, res, next) => {
  try {
    const userName = process.env.TBO_USER_NAME,
      password = process.env.TBO_PASSWORD,
      { BookingCode } = req.body;

    const response = await axios.post(
      "http://api.tbotechnology.in/TBOHolidays_HotelAPI/PreBook",
      {
        BookingCode,
        PaymentMode: "NewCard",
      },
      { auth: { username: userName, password } }
    );

    return res.status(200).json({
      data: response.data,
    });
  } catch (error) {
    next(
      new ApiError(
        error.response?.status || 500,
        error.response?.data?.errors?.[0]?.detail ||
          "Error searching for Hotel Details "
      )
    );
  }
};

export const bookRoom = async (req, res, next) => {
  try {
    const userName = process.env.TBO_USER_NAME;
    const password = process.env.TBO_PASSWORD;

    const {
      BookingCode,
      CustomerDetails,
      ClientReferenceId,
      BookingReferenceId,
      TotalFare,
      EmailId,
      PhoneNumber,
      BookingType,
      PaymentMode,
      Supplements, // optional
    } = req.body;

    // Compose the request payload
    const payload = {
      BookingCode,
      CustomerDetails,
      ClientReferenceId,
      BookingReferenceId,
      TotalFare,
      EmailId,
      PhoneNumber,
      BookingType,
      PaymentMode,
    };

    if (Supplements && Supplements.length > 0) {
      payload.Supplements = Supplements;
    }

    const response = await axios.post(
      "http://api.tbotechnology.in/TBOHolidays_HotelAPI/Book",
      payload,
      { auth: { username: userName, password } }
    );

    return res.status(200).json({
      success: true,
      message: "Booking successful",
      data: response.data,
    });
  } catch (error) {
    next(
      new ApiError(
        error.response?.status || 500,
        error.response?.data?.errors?.[0]?.detail ||
          "Error searching for Hotel Details"
      )
    );
  }
};
