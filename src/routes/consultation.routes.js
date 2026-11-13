const express = require("express");
const router = express.Router();
const {
  createConsultation,
  getMyConsultations,
  getAllConsultations,
  getConsultationById,
  updateConsultationStatus,
  deleteConsultation,
} = require("../controllers/consultation.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// جميع مسارات الاستشارات تتطلب تسجيل الدخول
router.use(authenticate);

// POST /api/consultations         — طلب استشارة جديدة (يوزر مسجل)
router.post("/", createConsultation);

// GET /api/consultations/my       — استعراض استشاراتي (يوزر مسجل)
router.get("/my", getMyConsultations);

// GET /api/consultations          — استعراض كل الاستشارات (أدمن فقط)
router.get("/", authorizeAdmin, getAllConsultations);

// GET /api/consultations/:id      — تفاصيل استشارة معينة (أدمن فقط)
router.get("/:id", authorizeAdmin, getConsultationById);

// PATCH /api/consultations/:id/status — تعديل حالة الاستشارة (أدمن فقط)
router.patch("/:id/status", authorizeAdmin, updateConsultationStatus);

// DELETE /api/consultations/:id   — حذف طلب استشارة (أدمن فقط)
router.delete("/:id", authorizeAdmin, deleteConsultation);

module.exports = router;
