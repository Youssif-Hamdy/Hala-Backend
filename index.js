require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");

const authRoutes = require("./src/routes/auth.routes");
const applicationRoutes = require("./src/routes/application.routes");

const app = express();

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===== Routes =====
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);

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

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
