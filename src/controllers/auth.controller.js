const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

// ===== Cookie Options =====
const COOKIE_NAME = "auth_token";

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,       // JavaScript مش تقدر توصله — حماية من XSS
    secure: isProduction, // HTTPS فقط في production
    sameSite: isProduction ? "none" : "lax", // none في الإنتاج لدعم cross-origin بين frontend و backend
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام بالميللي ثانية
    path: "/",
  };
};

// ===== Helper: توليد JWT توكن =====
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// ===== Helper: بعت الكوكي =====
const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
};

// ===== Helper: امسح الكوكي =====
const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
};

// ===== POST /api/auth/register =====
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "الاسم والإيميل والباسورد مطلوبين" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "الباسورد لازم يكون 6 حروف على الأقل" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "الإيميل ده موجود بالفعل" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "تم التسجيل بنجاح",
      user,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== POST /api/auth/login =====
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "الإيميل والباسورد مطلوبين" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "الإيميل أو الباسورد غلط" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "الإيميل أو الباسورد غلط" });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      message: "تم تسجيل الدخول بنجاح",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== POST /api/auth/admin/login =====
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "الإيميل والباسورد مطلوبين" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "الإيميل أو الباسورد غلط" });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({ message: "انت مش أدمن" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "الإيميل أو الباسورد غلط" });
    }

    const token = generateToken(user);
    setAuthCookie(res, token);

    return res.status(200).json({
      message: "تم تسجيل دخول الأدمن بنجاح",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== POST /api/auth/logout =====
const logout = (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: "تم تسجيل الخروج بنجاح" });
};

module.exports = { register, login, adminLogin, logout };
