const prisma = require("../lib/prisma");

// ===== POST /api/bookings — تقديم حجز جديد (يوزر مسجل) =====
const createBooking = async (req, res) => {
  try {
    const { name, phone, email } = req.body;
    const userId = req.user.id;

    // التحقق من الحقول المطلوبة
    if (!name || !phone || !email) {
      return res.status(400).json({
        message: "الاسم ورقم الهاتف والإيميل مطلوبين",
      });
    }

    // التحقق البسيط من صيغة الإيميل
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "صيغة الإيميل غير صحيحة",
      });
    }

    // التحقق من رقم الهاتف
    if (phone.trim().length < 8) {
      return res.status(400).json({
        message: "رقم الهاتف غير صالح",
      });
    }

    // التحقق لو اليوزر عنده حجز قيد المراجعة بالفعل
    const existingPending = await prisma.booking.findFirst({
      where: {
        userId,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return res.status(409).json({
        message: "لديك طلب حجز قيد المراجعة بالفعل",
      });
    }

    // إنشاء الحجز
    const booking = await prisma.booking.create({
      data: {
        userId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        status: "PENDING",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(201).json({
      message: "تم تسجيل طلب الحجز بنجاح وهو قيد المراجعة",
      booking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== GET /api/bookings/my — حجوزات اليوزر الحالي (يوزر مسجل) =====
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      message: "تم جلب حجوزاتك بنجاح",
      data: bookings,
    });
  } catch (error) {
    console.error("Get my bookings error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== GET /api/bookings — كل الحجوزات (أدمن فقط) =====
const getAllBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // فلترة اختيارية
    const where = {};

    if (status && ["PENDING", "ACCEPTED", "REJECTED"].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return res.status(200).json({
      message: "تم جلب الحجوزات بنجاح",
      data: bookings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== PATCH /api/bookings/:id/status — تعديل حالة الحجز (أدمن فقط) =====
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["PENDING", "ACCEPTED", "REJECTED"];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        message: "الحالة غير صالحة. الحالات المتاحة: PENDING, ACCEPTED, REJECTED",
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ message: "طلب الحجز غير موجود" });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(200).json({
      message: `تم تحديث حالة الحجز إلى ${status.toUpperCase()} بنجاح`,
      booking: updated,
    });
  } catch (error) {
    console.error("Update booking status error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== DELETE /api/bookings/:id — حذف حجز (أدمن فقط) =====
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return res.status(404).json({ message: "طلب الحجز غير موجود" });
    }

    await prisma.booking.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "تم حذف طلب الحجز بنجاح",
    });
  } catch (error) {
    console.error("Delete booking error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  deleteBooking,
};
