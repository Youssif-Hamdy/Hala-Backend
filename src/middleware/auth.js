const jwt = require("jsonwebtoken");

const COOKIE_NAME = "auth_token";

// ===== Middleware: التحقق من تسجيل الدخول عبر Cookie =====
const authenticate = (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({ message: "لازم تسجل دخول الأول" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "الجلسة انتهت، سجل دخول تاني" });
  }
};

// ===== Middleware: التحقق من صلاحيات الأدمن =====
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "صلاحيات الأدمن فقط" });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };
