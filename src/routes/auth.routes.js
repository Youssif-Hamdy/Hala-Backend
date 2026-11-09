const express = require("express");
const router = express.Router();
const { register, login, adminLogin, logout } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");

// POST /api/auth/register — تسجيل يوزر جديد
router.post("/register", register);

// POST /api/auth/login — تسجيل دخول اليوزرس
router.post("/login", login);

// POST /api/auth/admin/login — تسجيل دخول الأدمن
router.post("/admin/login", adminLogin);

// POST /api/auth/logout — تسجيل خروج (يمسح الكوكي)
router.post("/logout", authenticate, logout);

module.exports = router;
