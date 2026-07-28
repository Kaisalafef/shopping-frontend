document.addEventListener("DOMContentLoaded", () => {
  /* ===============================
       0. التحقق من تسجيل الدخول
    ================================ */
  const token = localStorage.getItem("token");

  if (!token) {
    alert("يرجى تسجيل الدخول أولاً");
    window.location.replace("/Auth/Login.html");
    return;
  }
 
  
  /* ========== TOAST ========== */
  
  // 1. دالة عرض الإشعارات (Toast)
  function showToast(msg, type = "success") {
    let toastBox = document.getElementById("toast-box");

    // إنشاء العنصر
    let toast = document.createElement("div");
    toast.classList.add("toast", type);

    // تحديد الأيقونة بناءً على النوع
    let icon = "";
    if (type === "success") icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === "error") icon = '<i class="fa-solid fa-circle-xmark"></i>';
    if (type === "warning")
      icon = '<i class="fa-solid fa-triangle-exclamation"></i>';

    toast.innerHTML = `${icon} ${msg}`;

    // إضافته للصفحة
    toastBox.appendChild(toast);

    // حذفه بعد 4 ثواني
    setTimeout(() => {
      toast.classList.add("hide"); // تشغيل انيميشن الخروج
      toast.addEventListener("animationend", () => {
        toast.remove(); // الحذف الفعلي من الـ DOM
      });
    }, 4000);
  }
  /* ===============================
       1. عناصر الإدخال
    ================================ */
  const form = document.getElementById("adsForm");

  const titleInput = document.getElementById("titleInput");
  const descInput = document.getElementById("descInput"); // للمعاينة فقط
  const imageInput = document.getElementById("imageInput");

  /* ===============================
       2. عناصر المعاينة
    ================================ */
  const previewBox = document.getElementById("livePreview");
  const prevTitle = document.getElementById("prevTitle");
  const prevDesc = document.getElementById("prevDesc");

  /* ===============================
       3. تحديث المعاينة النصية
    ================================ */
  function updatePreviewText() {
    prevTitle.textContent = titleInput.value || "عنوان الإعلان";
    prevDesc.textContent = descInput.value || "وصف الإعلان سيظهر هنا";
  }

  titleInput.addEventListener("input", updatePreviewText);
  descInput.addEventListener("input", updatePreviewText);

  /* ===============================
       4. تحديث معاينة الصورة
    ================================ */
  imageInput.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      previewBox.style.backgroundImage = `url(${e.target.result})`;
    };
    reader.readAsDataURL(file);
  });

  /* ===============================
       5. إرسال الإعلان إلى الباك
    ================================ */
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!imageInput.files.length) {
      showToast("يرجى اختيار صورة للإعلان", "warning");
      return;
    }


    const formData = new FormData();
    formData.append("title", titleInput.value);
    formData.append("description", descInput.value); // إضافة الوصف
    formData.append("image", imageInput.files[0]);
    try {
      const response = await fetch("https://api.tasswek.com/api/ads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showToast("تم نشر الإعلان بنجاح", "success");
        window.location.href = "Add_ADS.html";
      } else {
        showToast(result.message || "حدث خطأ أثناء الحفظ", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("خطأ في الاتصال بالخادم", "error");
    }
  });
});
