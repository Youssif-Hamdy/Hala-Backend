# 📚 دليل الـ Frontend الشامل — Hala Backend API

دليل كامل للمطور لشرح كيفية ربط الـ Frontend مع الـ Backend، والتعامل مع نظام الأمان (Cookies + Bearer Token)، وجميع الـ Endpoints مع الـ Payload والـ Responses.

---

## 📑 الفهرس
1. [إعداد الاتصال وحل مشكلة الكوكيز (Setup)](#1-إعداد-الاتصال-وحل-مشكلة-الكوكيز)
2. [المصادقة وتسجيل الدخول (Auth APIs)](#2-المصادقة-وتسجيل-الدخول-auth-apis)
3. [استمارة التقديم للكورس (Applications APIs)](#3-استمارة-التقديم-للكورس-applications-apis)
4. [حجز الكورس وحالاته (Bookings APIs)](#4-حجز-الكورس-وحالاته-bookings-apis)
5. [حجز الاستشارات والخطط (Consultations APIs)](#5-حجز-الاستشارات-والخطط-consultations-apis)
6. [إدارة المستخدمين للأدمن (Users APIs)](#6-إدارة-المستخدمين-users-apis)
7. [جدول ملخص لكافة الـ APIs](#7-جدول-ملخص-لكافة-الـ-apis)

---

## 1. إعداد الاتصال وحل مشكلة الكوكيز

### ⚠️ ملاحظة هامة جداً عن الكوكيز والموبايل:
الباك إند يدعم **نظامين أمان معاً (Hybrid System)**:
1. **HttpOnly Cookie** تلقائياً لأجهزة اللابتوب والكمبيوتر.
2. **Bearer Token** عبر الـ Header لأجهزة **الموبايل (خصوصاً iPhone / Safari)** لأن متصفحات الموبايل تحجب الـ Third-Party Cookies بين دومينات Vercel افتراضياً.

لذلك، يجب ضبط إعداد الـ `axios` مرة واحدة ليعمل على جميع الأجهزة بدون أي مشاكل كالتالي:

### 🛠️ كود إعداد `axios` المعتمد:
أنشئ ملفاً باسم `api.js` (أو `axios.js`) واستخدمه في كل طلباتك:

```javascript
import axios from "axios";

// استبدل الرابط برابط الباك إند على Vercel
const API_URL = "https://your-backend-url.vercel.app"; 

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ضروري جداً لإرسال واستقبال الكوكيز
  headers: {
    "Content-Type": "application/json",
  },
});

// إنترسبتور لإرفاق التوكن تلقائياً من localStorage للموبايل
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// إنترسبتور للتعامل مع انتهاء الجلسة (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // يمكنك تحويل المستخدم لصفحة تسجيل الدخول هنا لو أحببت
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 2. المصادقة وتسجيل الدخول (Auth APIs)

### 2.1 تسجيل حساب مستخدم جديد
- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **الصلاحية:** متاح للجميع (Public)
- **Request Body (Payload):**
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "password": "password123"
}
```
- **Success Response (`201 Created`):**
```json
{
  "message": "تم التسجيل بنجاح",
  "user": {
    "id": "cmwas7ee60000c485vnee7g8n",
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "role": "USER",
    "createdAt": "2026-11-10T14:24:41.332Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```
> **ملاحظة للمطور:** قم بحفظ `data.token` في `localStorage` وحفظ `data.user` في الـ State.

---

### 2.2 تسجيل دخول مستخدم (User Login)
- **Method:** `POST`
- **Endpoint:** `/api/auth/login`
- **الصلاحية:** متاح للجميع (Public)
- **Request Body (Payload):**
```json
{
  "email": "ahmed@example.com",
  "password": "password123"
}
```
- **Success Response (`200 OK`):**
```json
{
  "message": "تم تسجيل الدخول بنجاح",
  "user": {
    "id": "cmwas7ee60000c485vnee7g8n",
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "role": "USER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

---

### 2.3 تسجيل دخول الأدمن (Admin Login)
- **Method:** `POST`
- **Endpoint:** `/api/auth/admin/login`
- **الصلاحية:** متاح للجميع، لكن **يرفض أي حساب ليس له صلاحية `ADMIN`** بكود `403`.
- **Request Body (Payload):**
```json
{
  "email": "admin@hala.com",
  "password": "Admin@12345"
}
```
- **Success Response (`200 OK`):**
```json
{
  "message": "تم تسجيل دخول الأدمن بنجاح",
  "user": {
    "id": "cmw972mef0000zqz8fv5h4vzx",
    "name": "Hala Admin",
    "email": "admin@hala.com",
    "role": "ADMIN"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```
- **Error Response (`403 Forbidden`):**
```json
{
  "message": "انت مش أدمن"
}
```

---

### 2.4 تسجيل الخروج (Logout)
- **Method:** `POST`
- **Endpoint:** `/api/auth/logout`
- **الصلاحية:** يتطلب تسجيل دخول
- **Request Body:** لا يوجد
- **Success Response (`200 OK`):**
```json
{
  "message": "تم تسجيل الخروج بنجاح"
}
```
- **كود الـ Frontend:**
```javascript
await api.post("/api/auth/logout");
localStorage.removeItem("token");
localStorage.removeItem("user");
```

---

## 3. استمارة التقديم للكورس (Applications APIs)

### 3.1 إرسال استمارة التقديم
- **Method:** `POST`
- **Endpoint:** `/api/applications`
- **الصلاحية:** يتطلب أن يكون المستخدم **مسجل دخول**.
- **شروط النصوص:**
  - `currentChallenges`: من 50 إلى 500 كلمة كحد أقصى.
  - `courseGoal`: من 50 إلى 500 كلمة كحد أقصى.
  - يحق لكل مستخدم إرسال استمارة **واحدة فقط** (إرسال ثانٍ يرجع `409 Conflict`).
- **Request Body (Payload):**
```json
{
  "name": "أحمد محمد",
  "currentChallenges": "أواجه تحديات في تعلم البرمجة وفهم خوارزميات الويب وإدارة قواعد البيانات بشكل احترافي وبناء مشاريع كاملة...",
  "courseGoal": "هدفي من الالتحاق بهذا الكورس هو احتراف برمجة الويب والحصول على وظيفة Full Stack Developer خلال الأشهر القادمة..."
}
```
- **Success Response (`201 Created`):**
```json
{
  "message": "تم تقديم الاستمارة بنجاح",
  "application": {
    "id": "cmw9746rq0002uo2xkd7kxwwq",
    "userId": "cmwas7ee60000c485vnee7g8n",
    "name": "أحمد محمد",
    "currentChallenges": "...",
    "courseGoal": "...",
    "createdAt": "2026-11-10T14:46:33.152Z",
    "updatedAt": "2026-11-10T14:46:33.152Z"
  }
}
```

---

### 3.2 جلب جميع الاستمارات (للأدمن)
- **Method:** `GET`
- **Endpoint:** `/api/applications`
- **الصلاحية:** **أدمن فقط 👑**
- **Query Parameters (اختيارية):**
  - `page`: رقم الصفحة (الافتراضي: 1)
  - `limit`: عدد العناصر لكل صفحة (الافتراضي: 10)
  - *مثال:* `/api/applications?page=1&limit=10`
- **Success Response (`200 OK`):**
```json
{
  "message": "تم جلب الاستمارات بنجاح",
  "data": [
    {
      "id": "cmw9746rq0002uo2xkd7kxwwq",
      "userId": "cmwas7ee60000c485vnee7g8n",
      "name": "أحمد محمد",
      "currentChallenges": "...",
      "courseGoal": "...",
      "createdAt": "2026-11-10T14:46:33.152Z",
      "user": {
        "id": "cmwas7ee60000c485vnee7g8n",
        "name": "أحمد محمد",
        "email": "ahmed@example.com"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 3.3 جلب استمارة واحدة بالتفصيل (للأدمن)
- **Method:** `GET`
- **Endpoint:** `/api/applications/:id`
- **الصلاحية:** **أدمن فقط 👑**
- **Success Response (`200 OK`):**
```json
{
  "message": "تم جلب الاستمارة بنجاح",
  "data": {
    "id": "cmw9746rq0002uo2xkd7kxwwq",
    "userId": "cmwas7ee60000c485vnee7g8n",
    "name": "أحمد محمد",
    "currentChallenges": "...",
    "courseGoal": "...",
    "createdAt": "2026-11-10T14:46:33.152Z",
    "user": {
      "id": "cmwas7ee60000c485vnee7g8n",
      "name": "أحمد محمد",
      "email": "ahmed@example.com"
    }
  }
}
```

---

## 4. حجز الكورس وحالاته (Bookings APIs)

### 4.1 تقديم طلب حجز كورس
- **Method:** `POST`
- **Endpoint:** `/api/bookings`
- **الصلاحية:** يتطلب أن يكون المستخدم **مسجل دخول**.
- **الحالة الافتراضية:** ينشأ الحجز بحالة `PENDING`.
- **Request Body (Payload):**
```json
{
  "name": "أحمد محمود",
  "phone": "01012345678",
  "email": "ahmed.personal@example.com"
}
```
- **Success Response (`201 Created`):**
```json
{
  "message": "تم تسجيل طلب الحجز بنجاح وهو قيد المراجعة",
  "booking": {
    "id": "cmwas7emr0002c485022o2v6y",
    "userId": "cmwas7ee60000c485vnee7g8n",
    "name": "أحمد محمود",
    "phone": "01012345678",
    "email": "ahmed.personal@example.com",
    "status": "PENDING",
    "createdAt": "2026-11-10T14:24:41.332Z",
    "updatedAt": "2026-11-10T14:24:41.332Z"
  }
}
```
- **Error Response لو عنده حجز معلق بالفعل (`409 Conflict`):**
```json
{
  "message": "لديك طلب حجز قيد المراجعة بالفعل"
}
```

---

### 4.2 استعراض حجوزات المستخدم الحالي
- **Method:** `GET`
- **Endpoint:** `/api/bookings/my`
- **الصلاحية:** مستخدم مسجل دخول (يرى فقط طلبات الحجز الخاصة به).
- **Success Response (`200 OK`):**
```json
{
  "message": "تم جلب حجوزاتك بنجاح",
  "data": [
    {
      "id": "cmwas7emr0002c485022o2v6y",
      "name": "أحمد محمود",
      "phone": "01012345678",
      "email": "ahmed.personal@example.com",
      "status": "ACCEPTED",
      "createdAt": "2026-11-10T14:24:41.332Z"
    }
  ]
}
```

---

### 4.3 استعراض كل الحجوزات (للأدمن)
- **Method:** `GET`
- **Endpoint:** `/api/bookings`
- **الصلاحية:** **أدمن فقط 👑**
- **Query Parameters (اختيارية):**
  - `status`: تصفية بالحالة (`PENDING`, `ACCEPTED`, `REJECTED`)
  - `search`: بحث بالاسم أو التليفون أو الإيميل
  - `page`: رقم الصفحة
  - `limit`: عدد العناصر بالصفحة
  - *أمثلة:*
    - `/api/bookings?status=PENDING`
    - `/api/bookings?search=010123`
    - `/api/bookings?page=1&limit=20`
- **Success Response (`200 OK`):**
```json
{
  "message": "تم جلب الحجوزات بنجاح",
  "data": [
    {
      "id": "cmwas7emr0002c485022o2v6y",
      "userId": "cmwas7ee60000c485vnee7g8n",
      "name": "أحمد محمود",
      "phone": "01012345678",
      "email": "ahmed.personal@example.com",
      "status": "PENDING",
      "createdAt": "2026-11-10T14:24:41.332Z",
      "user": {
        "id": "cmwas7ee60000c485vnee7g8n",
        "name": "أحمد محمد",
        "email": "ahmed@example.com"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 4.4 تعديل حالة الحجز (للأدمن)
- **Method:** `PATCH`
- **Endpoint:** `/api/bookings/:id/status`
- **الصلاحية:** **أدمن فقط 👑**
- **الحالات المقبولة:** `"PENDING"`, `"ACCEPTED"`, `"REJECTED"`
- **Request Body (Payload):**
```json
{
  "status": "ACCEPTED"
}
```
*(أو `REJECTED` أو `PENDING`)*
- **Success Response (`200 OK`):**
```json
{
  "message": "تم تحديث حالة الحجز إلى ACCEPTED بنجاح",
  "booking": {
    "id": "cmwas7emr0002c485022o2v6y",
    "status": "ACCEPTED",
    "updatedAt": "2026-11-10T14:30:00.000Z"
  }
}
```

---

### 4.5 حذف طلب حجز (للأدمن)
- **Method:** `DELETE`
- **Endpoint:** `/api/bookings/:id`
- **الصلاحية:** **أدمن فقط 👑**
- **Success Response (`200 OK`):**
```json
{
  "message": "تم حذف طلب الحجز بنجاح"
}
```

---

## 5. حجز الاستشارات والخطط (Consultations APIs)

### 📌 خطط الاستشارات المتاحة والأسعار:
- **30 دقيقة:** 20 دولار (`duration: 30`, `price: 20`)
- **60 دقيقة:** 30 دولار (`duration: 60`, `price: 30`)
- **120 دقيقة:** 40 دولار (`duration: 120`, `price: 40`)

> **ملاحظة:** الفرونت يرسل فقط المدة `duration` (30 أو 60 أو 120)، والباك إند يقوم بتحديد السعر تلقائياً لضمان عدم التلاعب بالأسعار.

---

### 5.1 تقديم طلب استشارة جديدة
- **Method:** `POST`
- **Endpoint:** `/api/consultations`
- **الصلاحية:** يتطلب أن يكون المستخدم **مسجل دخول**.
- **Request Body (Payload):**
```json
{
  "name": "أحمد محمود",
  "phone": "01123456789",
  "email": "ahmed@example.com",
  "duration": 60,
  "notes": "أحتاج استشارة بخصوص تطوير موقع لشركتي واختيار التقنيات المناسبة"
}
```
> حقل `notes` اختياري.
- **Success Response (`201 Created`):**
```json
{
  "message": "تم تسجيل طلب الاستشارة بنجاح (60 دقيقة بـ 30$) وهو قيد المراجعة",
  "consultation": {
    "id": "cmwfbdvjn0001nd68wxr1ozuc",
    "userId": "cmwas7ee60000c485vnee7g8n",
    "name": "أحمد محمود",
    "phone": "01123456789",
    "email": "ahmed@example.com",
    "duration": 60,
    "price": 30,
    "notes": "...",
    "status": "PENDING",
    "createdAt": "2026-11-13T18:32:00.000Z",
    "updatedAt": "2026-11-13T18:32:00.000Z"
  }
}
```

---

### 5.2 استعراض استشارات المستخدم الحالي
- **Method:** `GET`
- **Endpoint:** `/api/consultations/my`
- **الصلاحية:** مستخدم مسجل دخول (يرى فقط استشاراته وحالتها).
- **Success Response (`200 OK`):**
```json
{
  "message": "تم جلب استشاراتك بنجاح",
  "data": [
    {
      "id": "cmwfbdvjn0001nd68wxr1ozuc",
      "name": "أحمد محمود",
      "phone": "01123456789",
      "email": "ahmed@example.com",
      "duration": 60,
      "price": 30,
      "status": "ACCEPTED",
      "createdAt": "2026-11-13T18:32:00.000Z"
    }
  ]
}
```

---

### 5.3 استعراض كل الاستشارات (للأدمن)
- **Method:** `GET`
- **Endpoint:** `/api/consultations`
- **الصلاحية:** **أدمن فقط 👑**
- **Query Parameters (اختيارية):**
  - `status`: تصفية بالحالة (`PENDING`, `ACCEPTED`, `COMPLETED`, `CANCELLED`)
  - `duration`: تصفية بالمدة (`30`, `60`, `120`)
  - `search`: بحث بالاسم أو التليفون أو الإيميل
  - `page`: رقم الصفحة
  - `limit`: عدد النتائج بالصفحة
  - *أمثلة:*
    - `/api/consultations?status=PENDING`
    - `/api/consultations?duration=60`
    - `/api/consultations?search=01123`
- **Success Response (`200 OK`):**
```json
{
  "message": "تم جلب الاستشارات بنجاح",
  "data": [
    {
      "id": "cmwfbdvjn0001nd68wxr1ozuc",
      "userId": "cmwas7ee60000c485vnee7g8n",
      "name": "أحمد محمود",
      "phone": "01123456789",
      "email": "ahmed@example.com",
      "duration": 60,
      "price": 30,
      "notes": "...",
      "status": "PENDING",
      "createdAt": "2026-11-13T18:32:00.000Z",
      "user": {
        "id": "cmwas7ee60000c485vnee7g8n",
        "name": "أحمد",
        "email": "user@gmail.com"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### 5.4 تعديل حالة الاستشارة (للأدمن)
- **Method:** `PATCH`
- **Endpoint:** `/api/consultations/:id/status`
- **الصلاحية:** **أدمن فقط 👑**
- **الحالات المقبولة:** `"PENDING"`, `"ACCEPTED"`, `"COMPLETED"`, `"CANCELLED"`
- **Request Body (Payload):**
```json
{
  "status": "ACCEPTED"
}
```
- **Success Response (`200 OK`):**
```json
{
  "message": "تم تحديث حالة الاستشارة إلى ACCEPTED بنجاح",
  "consultation": {
    "id": "cmwfbdvjn0001nd68wxr1ozuc",
    "status": "ACCEPTED",
    "updatedAt": "2026-11-13T18:35:00.000Z"
  }
}
```

---

### 5.5 حذف استشارة (للأدمن)
- **Method:** `DELETE`
- **Endpoint:** `/api/consultations/:id`
- **الصلاحية:** **أدمن فقط 👑**
- **Success Response (`200 OK`):**
```json
{
  "message": "تم حذف طلب الاستشارة بنجاح"
}
```

---

## 6. إدارة المستخدمين للأدمن (Users APIs)

### 5.1 عرض كل المستخدمين المسجلين (للأدمن)
- **Method:** `GET`
- **Endpoint:** `/api/users`
- **الصلاحية:** **أدمن فقط 👑**
- **Query Parameters (اختيارية):**
  - `page`: رقم الصفحة
  - `limit`: عدد المستخدمين بالصفحة
  - `role`: فلترة بحسب الدور (`USER` أو `ADMIN`)
- **Success Response (`200 OK`):**
```json
{
  "message": "تم جلب اليوزرس بنجاح",
  "data": [
    {
      "id": "cmwas7ee60000c485vnee7g8n",
      "name": "أحمد محمد",
      "email": "ahmed@example.com",
      "role": "USER",
      "createdAt": "2026-11-10T14:24:41.332Z",
      "application": {
        "id": "cmw9746rq0002uo2xkd7kxwwq",
        "createdAt": "2026-11-10T14:46:33.152Z"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```
> **ملاحظة:** حقل `application` يكون إما كائن يحتوي معرف الاستمارة إذا كان المستخدم قدم استمارة، أو `null` إذا لم يقدم بعد.

---

### 5.2 عرض تفاصيل مستخدم محدد واستمارته (للأدمن)
- **Method:** `GET`
- **Endpoint:** `/api/users/:id`
- **الصلاحية:** **أدمن فقط 👑**
- **Success Response (`200 OK`):**
```json
{
  "message": "تم جلب اليوزر بنجاح",
  "data": {
    "id": "cmwas7ee60000c485vnee7g8n",
    "name": "أحمد محمد",
    "email": "ahmed@example.com",
    "role": "USER",
    "createdAt": "2026-11-10T14:24:41.332Z",
    "application": {
      "id": "cmw9746rq0002uo2xkd7kxwwq",
      "name": "أحمد محمد",
      "currentChallenges": "...",
      "courseGoal": "...",
      "createdAt": "2026-11-10T14:46:33.152Z"
    }
  }
}
```

---

### 5.3 حذف مستخدم (للأدمن)
- **Method:** `DELETE`
- **Endpoint:** `/api/users/:id`
- **الصلاحية:** **أدمن فقط 👑**
- **المميزات:**
  - يتم حذف المستخدم وكافة بياناته وحجوزاته واستماراته تلقائياً (Cascade).
  - حماية تمنع الأدمن من حذف حسابه هو شخصياً (`400 Bad Request`).
- **Success Response (`200 OK`):**
```json
{
  "message": "تم حذف اليوزر وجميع بياناته بنجاح"
}
```

---

## 7. جدول ملخص لكافة الـ APIs

| # | الطريقة (Method) | المسار (Endpoint) | الصلاحية | الوصف |
|---|---|---|---|---|
| **1** | `POST` | `/api/auth/register` | عام | تسجيل مستخدم جديد |
| **2** | `POST` | `/api/auth/login` | عام | تسجيل دخول المستخدمين |
| **3** | `POST` | `/api/auth/admin/login` | عام | تسجيل دخول الأدمن |
| **4** | `POST` | `/api/auth/logout` | مسجل دخول | تسجيل الخروج |
| **5** | `POST` | `/api/applications` | مسجل دخول | تقديم استمارة الكورس |
| **6** | `GET` | `/api/applications` | أدمن فقط 👑 | عرض كافة استمارات التقديم |
| **7** | `GET` | `/api/applications/:id` | أدمن فقط 👑 | عرض تفاصيل استمارة محددة |
| **8** | `POST` | `/api/bookings` | مسجل دخول | تقديم طلب حجز كورس |
| **9** | `GET` | `/api/bookings/my` | مسجل دخول | عرض حجوزات المستخدم الحالي |
| **10** | `GET` | `/api/bookings` | أدمن فقط 👑 | عرض كافة طلبات الحجز وفلترتها |
| **11** | `PATCH` | `/api/bookings/:id/status` | أدمن فقط 👑 | تحديث حالة الحجز (PENDING / ACCEPTED / REJECTED) |
| **12** | `DELETE` | `/api/bookings/:id` | أدمن فقط 👑 | حذف طلب حجز |
| **13** | `POST` | `/api/consultations` | مسجل دخول | تقديم طلب استشارة (30د/20$، 60د/30$، 120د/40$) |
| **14** | `GET` | `/api/consultations/my` | مسجل دخول | استعراض استشارات المستخدم الحالي |
| **15** | `GET` | `/api/consultations` | أدمن فقط 👑 | استعراض كل الاستشارات مع فلترة وبحث |
| **16** | `GET` | `/api/consultations/:id` | أدمن فقط 👑 | عرض تفاصيل استشارة محددة |
| **17** | `PATCH` | `/api/consultations/:id/status` | أدمن فقط 👑 | تعديل حالة الاستشارة (PENDING, ACCEPTED, COMPLETED, CANCELLED) |
| **18** | `DELETE` | `/api/consultations/:id` | أدمن فقط 👑 | حذف استشارة |
| **19** | `GET` | `/api/users` | أدمن فقط 👑 | عرض قائمة جميع المستخدمين |
| **20** | `GET` | `/api/users/:id` | أدمن فقط 👑 | عرض بيانات مستخدم مع استمارته |
| **21** | `DELETE` | `/api/users/:id` | أدمن فقط 👑 | حذف مستخدم وكافة بياناته |
