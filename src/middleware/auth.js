const jwt = require("jsonwebtoken");

const COOKIE_NAME = "auth_token";

// ===== Middleware: التحقق من تسجيل الدخول (يدعم Cookie و Bearer Header) =====
const authenticate = (req, res, next) => {
  let token = req.cookies?.[COOKIE_NAME];

  // لو المتصفح (زي الموبايل/آيفون) حاجب الكوكيز، ناخد التوكن من الـ Authorization Header
  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

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
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "صلاحيات الأدمن فقط" });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };
