const prisma = require("../lib/prisma");

// ===== Helper: حساب عدد الكلمات =====
const countWords = (text) => {
  return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
};

// ===== POST /api/applications =====
// يتطلب: تسجيل دخول (Bearer token)
const createApplication = async (req, res) => {
  try {
    const { name, currentChallenges, courseGoal } = req.body;
    const userId = req.user.id;

    // التحقق من البيانات المطلوبة
    if (!name || !currentChallenges || !courseGoal) {
      return res.status(400).json({
        message: "الاسم وأبرز التحديات والهدف من الكورس مطلوبين",
      });
    }

    // التحقق من عدد الكلمات (500 كلمة حد أقصى)
    const challengesWordCount = countWords(currentChallenges);
    const goalWordCount = countWords(courseGoal);

    if (challengesWordCount > 500) {
      return res.status(400).json({
        message: `أبرز التحديات تجاوز الحد الأقصى (${challengesWordCount}/500 كلمة)`,
      });
    }

    if (goalWordCount > 500) {
      return res.status(400).json({
        message: `هدف الكورس تجاوز الحد الأقصى (${goalWordCount}/500 كلمة)`,
      });
    }

    // التحقق من عدد الكلمات الأدنى (50 كلمة كحد أدنى معقول)
    if (challengesWordCount < 50) {
      return res.status(400).json({
        message: `أبرز التحديات قصير جداً (${challengesWordCount}/50 كلمة على الأقل)`,
      });
    }

    if (goalWordCount < 50) {
      return res.status(400).json({
        message: `هدف الكورس قصير جداً (${goalWordCount}/50 كلمة على الأقل)`,
      });
    }

    // التحقق إن اليوزر ده مقدمش استمارة قبل كده
    const existingApplication = await prisma.application.findUnique({
      where: { userId },
    });

    if (existingApplication) {
      return res.status(409).json({
        message: "انت قدمت استمارة قبل كده",
      });
    }

    // إنشاء الاستمارة
    const application = await prisma.application.create({
      data: {
        userId,
        name,
        currentChallenges,
        courseGoal,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return res.status(201).json({
      message: "تم تقديم الاستمارة بنجاح",
      application,
    });
  } catch (error) {
    console.error("Create application error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== GET /api/applications =====
// يتطلب: تسجيل دخول أدمن فقط
const getAllApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.application.count(),
    ]);

    return res.status(200).json({
      message: "تم جلب الاستمارات بنجاح",
      data: applications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get applications error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

// ===== GET /api/applications/:id =====
// يتطلب: تسجيل دخول أدمن فقط
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ message: "الاستمارة مش موجودة" });
    }

    return res.status(200).json({
      message: "تم جلب الاستمارة بنجاح",
      data: application,
    });
  } catch (error) {
    console.error("Get application by id error:", error);
    return res.status(500).json({ message: "حصل خطأ في السيرفر" });
  }
};

module.exports = { createApplication, getAllApplications, getApplicationById };
