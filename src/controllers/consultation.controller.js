const prisma = require("../lib/prisma");

// خطط الاستشارات المتاحة والأسعار الرسمية
const CONSULTATION_PLANS = {
  30: 20,   // 30 دقيقة = 20 دولار
  60: 30,   // 60 دقيقة = 30 دولار
  120: 40,  // 120 دقيقة = 40 دولار
};

// ===== POST /api/consultations — طلب استشارة جديدة (يوزر مسجل) =====
const createConsultation = async (req, res) => {
  try {
    const { name, phone, email, duration, notes } = req.body;
    const userId = req.user.id;

    // التحقق من الحقول المطلوبة
    if (!name || !phone || !email || duration === undefined || duration === null) {
      return res.status(400).json({
        message: "الاسم ورقم الهاتف والإيميل ومدة الاستشارة مطلوبين",
      });
    }

    // التحقق من مدة الاستشارة المحددة
    const durationNum = Number(duration);
    if (!CONSULTATION_PLANS[durationNum]) {
      return res.status(400).json({
        message: "مدة الاستشارة غير صحيحة. الخيارات المتاحة: 30 دقيقة (20$)، 60 دقيقة (30$)، أو 120 دقيقة (40$)",
      });
    }

    // تحديد السعر بناءً على المدة المختارة تلقائياً لمنع أي تلاعب
    const price = CONSULTATION_PLANS[durationNum];

    // التحقق من صيغة الإيميل
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

    // إنشاء طلب الاستشارة
    const consultation = await prisma.consultation.create({
      data: {
        userId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        duration: durationNum,
        price,
        notes: notes ? notes.trim() : null,
        status: "PENDING",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(201).json({
      message: `تم تسجيل طلب الاستشارة بنجاح (${durationNum} دقيقة بـ ${price}$) وهو قيد المراجعة`,
      consultation,
    });
  } catch (error) {
    console.error("Create consultation error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== GET /api/consultations/my — استشارات اليوزر الحالي (يوزر مسجل) =====
const getMyConsultations = async (req, res) => {
  try {
    const userId = req.user.id;

    const consultations = await prisma.consultation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      message: "تم جلب استشاراتك بنجاح",
      data: consultations,
    });
  } catch (error) {
    console.error("Get my consultations error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== GET /api/consultations — كل الاستشارات (أدمن فقط) =====
const getAllConsultations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, duration, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // فلترة اختيارية
    const where = {};

    if (status && ["PENDING", "ACCEPTED", "COMPLETED", "CANCELLED"].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    if (duration && [30, 60, 120].includes(Number(duration))) {
      where.duration = Number(duration);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
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
      prisma.consultation.count({ where }),
    ]);

    return res.status(200).json({
      message: "تم جلب الاستشارات بنجاح",
      data: consultations,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get all consultations error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== GET /api/consultations/:id — استشارة محددة (أدمن فقط) =====
const getConsultationById = async (req, res) => {
  try {
    const { id } = req.params;

    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!consultation) {
      return res.status(404).json({ message: "طلب الاستشارة غير موجود" });
    }

    return res.status(200).json({
      message: "تم جلب تفاصيل الاستشارة بنجاح",
      data: consultation,
    });
  } catch (error) {
    console.error("Get consultation by id error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== PATCH /api/consultations/:id/status — تعديل حالة الاستشارة (أدمن فقط) =====
const updateConsultationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["PENDING", "ACCEPTED", "COMPLETED", "CANCELLED"];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        message: "الحالة غير صالحة. الحالات المتاحة: PENDING, ACCEPTED, COMPLETED, CANCELLED",
      });
    }

    const consultation = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      return res.status(404).json({ message: "طلب الاستشارة غير موجود" });
    }

    const updated = await prisma.consultation.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(200).json({
      message: `تم تحديث حالة الاستشارة إلى ${status.toUpperCase()} بنجاح`,
      consultation: updated,
    });
  } catch (error) {
    console.error("Update consultation status error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== DELETE /api/consultations/:id — حذف استشارة (أدمن فقط) =====
const deleteConsultation = async (req, res) => {
  try {
    const { id } = req.params;

    const consultation = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!consultation) {
      return res.status(404).json({ message: "طلب الاستشارة غير موجود" });
    }

    await prisma.consultation.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "تم حذف طلب الاستشارة بنجاح",
    });
  } catch (error) {
    console.error("Delete consultation error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

module.exports = {
  createConsultation,
  getMyConsultations,
  getAllConsultations,
  getConsultationById,
  updateConsultationStatus,
  deleteConsultation,
};
