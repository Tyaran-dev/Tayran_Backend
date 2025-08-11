import express from "express";
const router = express.Router();
import {
  getCountryList,
  getCityList,
  hotelsSearch,
  getHotelDetails,
  preBookRoom,
  bookRoom,
} from "../../controllers/hotels/hotels.controller.js";

router.get("/CountryList", getCountryList);
router.post("/CityList", getCityList);
router.post("/HotelsSearch", hotelsSearch);
router.post("/HotelDetails", getHotelDetails);
router.post("/PreBookRoom", preBookRoom);
router.post("/BookRoom", bookRoom);

export default router;
