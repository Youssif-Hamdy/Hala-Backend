/**
 * seed.js — ينشئ حساب الأدمن لو مش موجود
 * شغّله بـ: node seed.js
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@hala.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const adminName = process.env.ADMIN_NAME || "Hala Admin";

  // شيك لو الأدمن موجود
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    console.log(`✅ الأدمن موجود بالفعل: ${adminEmail}`);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`✅ تم إنشاء الأدمن بنجاح:`);
  console.log(`   الإيميل: ${admin.email}`);
  console.log(`   الباسورد: ${adminPassword}`);
  console.log(`   الدور: ${admin.role}`);
}

main()
  .catch((e) => {
    console.error("❌ خطأ:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
