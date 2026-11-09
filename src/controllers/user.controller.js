const prisma = require("../lib/prisma");

// ===== GET /api/users — جلب كل اليوزرس (أدمن فقط) =====
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // فلتر اختياري بالـ role
    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          // بيجيب إذا عنده استمارة أو لا
          application: {
            select: {
              id: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      message: "تم جلب اليوزرس بنجاح",
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== GET /api/users/:id — جلب يوزر بعينه (أدمن فقط) =====
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        application: {
          select: {
            id: true,
            name: true,
            currentChallenges: true,
            courseGoal: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "اليوزر مش موجود" });
    }

    return res.status(200).json({
      message: "تم جلب اليوزر بنجاح",
      data: user,
    });
  } catch (error) {
    console.error("Get user by id error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== DELETE /api/users/:id — مسح يوزر (أدمن فقط) =====
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // حماية: الأدمن ما يقدرش يمسح حسابه هو شخصياً
    if (req.user.id === id) {
      return res.status(400).json({ message: "ما ينفعش تمسح حسابك الحالي كأدمن" });
    }

    // التحقق من وجود اليوزر
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ message: "اليوزر مش موجود" });
    }

    // حذف اليوزر (الاستمارة المرتبطة بيه بتتحذف تلقائياً بفضل Cascade)
    await prisma.user.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "تم حذف اليوزر وجميع بياناته بنجاح",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

module.exports = { getAllUsers, getUserById, deleteUser };
