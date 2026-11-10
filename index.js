require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./src/routes/auth.routes");
const applicationRoutes = require("./src/routes/application.routes");
const userRoutes = require("./src/routes/user.routes");
const bookingRoutes = require("./src/routes/booking.routes");

const app = express();

// ===== CORS Middleware =====
app.use(
  cors({
    origin: (origin, callback) => {
      // السماح للطلبات من أي origin (مثل localhost أو vercel frontend)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true, // ضروري عشان الكوكيز تعدي
  })
);

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===== Routes =====
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/bookings", bookingRoutes);

// ===== Health Check =====
app.get("/", (req, res) => {
  res.json({ message: "Hala Backend is running 🚀" });
});

// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({ message: "المسار ده مش موجود" });
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "حصل خطأ في السيرفر" });
});

// ===== Start Server (local only) =====
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

// ===== Export للـ Vercel Serverless =====
module.exports = app;
