<div align="center">

# 🛍️ تسوق معنا — واجهة المتجر (Web)

**متجر إلكتروني عربي (RTL) مع لوحة مشرف: تصفّح، سلة، دفع، وإدارة كاملة للمنتجات والعروض والإعلانات.**

<p>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/GSAP-3.12-88CE02?style=for-the-badge&logo=greensock&logoColor=black" alt="GSAP" />
  <img src="https://img.shields.io/badge/Direction-RTL-0f172a?style=for-the-badge" alt="RTL" />
  <img src="https://img.shields.io/badge/No%20Build-Static%20Site-2ea44f?style=for-the-badge" alt="Static" />
</p>

[المزايا](#-المزايا) • [الصفحات](#-الصفحات) • [التشغيل](#-التشغيل-السريع) • [الإعداد](#-ربط-الـ-api) • [البنية](#-بنية-المشروع) • [النشر](#-النشر)

</div>

---

<div dir="rtl">

## 📖 نبذة

واجهة ويب **ثابتة بدون خطوة بناء** (HTML + CSS + JavaScript صرف) لمتجر «تسوق معنا». تتصل بالـ API في [shopping](https://github.com/Ameerdawara/shopping) عبر `fetch`، وتعرض واجهة مختلفة للزبون والمشرف بحسب دور الحساب بعد تسجيل الدخول.

## 🧩 منظومة المشروع

| المستودع | الوصف |
|---|---|
| 🖥️ **shopping-frontend** (هذا المستودع) | واجهة المتجر ولوحة المشرف |
| 🛠️ [shopping](https://github.com/Ameerdawara/shopping) | الـ API — Laravel |

## ✨ المزايا

**للزبون**
- 🔐 إنشاء حساب وتفعيله برمز **OTP** يصل برسالة نصية.
- 🔎 تصفّح المنتجات حسب التصنيف، وصفحة تفاصيل لكل منتج بصور ومقاسات وتقييمات.
- 🛒 سلة مشتريات مع **زر سلة عائم** يظهر في كل الصفحات.
- 💳 صفحة دفع بثلاث طرق: **كاش عند الاستلام** • **شام كاش** • **USDT** (تحويل يدوي مع رفع إثبات الدفع).
- 💱 عرض الأسعار بالدولار والليرة السورية بحسب سعر الصرف الحالي.
- 📦 صفحة «طلباتي» لمتابعة حالة كل طلب، وصفحة ملف شخصي.

**للمشرف**
- 📊 لوحة تحكم بمؤشرات المتجر.
- ➕ إضافة وتعديل المنتجات (صور متعددة، مقاسات، تصنيفات، عملة المنتج).
- 🏷️ إدارة **الخصومات والعروض** و**الإعلانات**.
- 🧾 **سجل الطلبات** واعتماد أو رفض الدفعات اليدوية.
- ⚙️ إعدادات الدفع (حسابات شام كاش وUSDT وصور QR).

**تجربة الاستخدام**
- 🌐 عربية بالكامل (RTL) بخط Cairo / Tajawal.
- 🎞️ حركات انسيابية بـ GSAP.
- 🗜️ **ضغط الصور داخل المتصفح** قبل الرفع (`image_compress.js`) لتسريع الرفع وتقليل الحجم.
- 🧱 رأس وتذييل مشتركان (`Wedgit/`) لتوحيد الواجهة.

## 🗺️ الصفحات

| المجلد | الصفحات | الدور |
|---|---|---|
| `/` | `index.html` — تسجيل الدخول | الجميع |
| `Auth/` | إنشاء حساب • تفعيل OTP • حارس المصادقة (`auth_guard.js`) | الجميع |
| `Home/` | `client_dashboard` • `admin_dashboard` | بحسب الدور |
| `Proudcts/` | تصفّح المنتجات | الجميع |
| `Product/` | تفاصيل المنتج | الجميع |
| `Cart/` | سلة المشتريات | زبون |
| `payments/` | الدفع • إعدادات الدفع وصور QR | زبون • مشرف |
| `Orders/` | سجل الطلبات واعتمادها | مشرف |
| `Profile/` | الملف الشخصي • طلباتي | زبون |
| `Add Proudct/` • `Edit_Product/` | إضافة وتعديل المنتجات | مشرف |
| `Discount/` | الخصومات والعروض | مشرف |
| `ADS/` | إضافة وعرض الإعلانات | مشرف |
| `Wedgit/` | الرأس • التذييل • «عن المتجر» • زر السلة | مشترك |

## 🛠️ التقنيات

| الغرض | الأداة |
|---|---|
| البنية والتنسيق والمنطق | HTML5 • CSS3 • JavaScript (ES6+) بلا إطار عمل |
| الأيقونات | [Font Awesome 6](https://fontawesome.com) |
| الخطوط | Cairo • Tajawal • Poppins (Google Fonts) |
| الحركة | [GSAP 3.12](https://gsap.com) |
| الاتصال بالخادم | `fetch` + Bearer token |

## 🚀 التشغيل السريع

لا حاجة لـ `npm install` ولا لأي بناء. قدّم الملفات كموقع ثابت:

```bash
git clone https://github.com/Kaisalafef/shopping-frontend.git
cd shopping-frontend

npx serve .
# أو
python3 -m http.server 8080
```

ثم افتح `http://localhost:8080`.

> 💡 شغّله عبر خادم محلي وليس بالنقر المزدوج على الملف، حتى تعمل طلبات `fetch` وسياسة CORS.

## 🔧 ربط الـ API

العنوان معرَّف داخل ملفات JavaScript لكل صفحة:

```js
https://api.tasswek.com/api       // طلبات الـ API
https://api.tasswek.com/storage/  // الصور المرفوعة
```

لتجربة المشروع على خادمك، ابحث عن `api.tasswek.com` في المشروع واستبدله بعنوانك:

```bash
grep -rl "api.tasswek.com" --include=*.js --include=*.html .
```

وأضف نطاق الواجهة إلى إعدادات **CORS** في مستودع `shopping` (`config/cors.php`).

**التخزين المحلي (`localStorage`)**

| المفتاح | الاستخدام |
|---|---|
| `token` | توكن الدخول |
| `auth_role` • `auth_user` | دور المستخدم وبياناته |
| `pending_phone` | رقم الهاتف أثناء التفعيل |
| `checkout_address` • `checkout_total_syp` | بيانات صفحة الدفع |

## 🗂️ بنية المشروع

```
shopping-frontend/
├── index.html              # تسجيل الدخول
├── Auth/                   # Sign_up • Verify_otp • Auth.js • otp.js • auth_guard.js
├── Home/                   # client_dashboard • admin_dashboard
├── Proudcts/ • Product/    # القائمة والتفاصيل
├── Cart/ • payments/       # السلة والدفع
├── Orders/ • Profile/      # الطلبات والحساب
├── Add Proudct/ • Edit_Product/ • Discount/ • ADS/    # إدارة المحتوى
└── Wedgit/                 # header • footer • About • cart_fab • image_compress.js
```

## ☁️ النشر

موقع ثابت، يصلح على أي استضافة:

- **GitHub Pages** — فعّل Pages على الفرع `main`.
- **Netlify / Vercel / Cloudflare Pages** — بدون أمر بناء، والمجلد الجذر `/`.
- **Nginx / Apache** — انسخ الملفات إلى مجلد الموقع.

## 👥 الفريق

تم التصميم والتطوير بواسطة:

| الاسم | الدور |
|---|---|
| غيث رؤوف كحل | مهندس برمجيات |
| قيس أيمن العفيف | مهندس برمجيات |
| أمير سلام دواره | مهندس برمجيات |
| حلا سامر هلال | مهندسة برمجيات |
| دلع وائل عدوان | مهندسة برمجيات |

## 📄 الترخيص

مشروع خاص. جميع الحقوق محفوظة © 2026.

</div>
