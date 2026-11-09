const express = require("express");
const router = express.Router();
const { getAllUsers, getUserById } = require("../controllers/user.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth");

// كل الـ routes دي أدمن فقط
router.use(authenticate, authorizeAdmin);

// GET /api/users              — كل اليوزرس (مع pagination وفلتر role)
router.get("/", getAllUsers);

// GET /api/users/:id          — يوزر واحد مع استمارته لو موجودة
router.get("/:id", getUserById);

module.exports = router;
