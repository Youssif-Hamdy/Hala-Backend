const express = require("express");
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
} = require("../controllers/booking.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// جميع مسارات الحجز تتطلب تسجيل الدخول
router.use(authenticate);

// POST /api/bookings         — حجز كورس (يوزر مسجل)
router.post("/", createBooking);

// GET /api/bookings/my       — استعراض حجوزاتي (يوزر مسجل)
router.get("/my", getMyBookings);

// GET /api/bookings          — استعراض كل الحجوزات (أدمن فقط)
router.get("/", authorizeAdmin, getAllBookings);

// PATCH /api/bookings/:id/status — تعديل حالة الحجز (أدمن فقط)
router.patch("/:id/status", authorizeAdmin, updateBookingStatus);

// DELETE /api/bookings/:id   — حذف حجز (أدمن فقط)
router.delete("/:id", authorizeAdmin, deleteBooking);

module.exports = router;
