const express = require("express");
const router = express.Router();
const {
  createApplication,
  getAllApplications,
  getApplicationById,
} = require("../controllers/application.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// POST /api/applications — يوزر مسجل دخول يبعت الاستمارة
router.post("/", authenticate, createApplication);

// GET /api/applications — أدمن فقط يشوف كل الاستمارات
router.get("/", authenticate, authorizeAdmin, getAllApplications);

// GET /api/applications/:id — أدمن فقط يشوف استمارة بعينها
router.get("/:id", authenticate, authorizeAdmin, getApplicationById);

module.exports = router;
