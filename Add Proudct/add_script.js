const getAuthHeaders = () => ({
  Accept: "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

(function () {
  "use strict";

  // ===== Config =====
  const API_BASE = "https://api.tasswek.com/api";
  const CATEGORY_FIELD_NAME = "category_id";

  // قائمة بأشهر الأيقونات المناسبة للأقسام
  const CATEGORY_ICONS = [
    "fa-solid fa-shirt", "fa-solid fa-shoe-prints", "fa-solid fa-glasses",
    "fa-solid fa-clock", "fa-solid fa-gem", "fa-solid fa-laptop",
    "fa-solid fa-mobile-screen", "fa-solid fa-headphones", "fa-solid fa-camera",
    "fa-solid fa-gamepad", "fa-solid fa-tv", "fa-solid fa-plug",
    "fa-solid fa-couch", "fa-solid fa-bed", "fa-solid fa-blender",
    "fa-solid fa-utensils", "fa-solid fa-dumbbell", "fa-solid fa-basketball",
    "fa-solid fa-car", "fa-solid fa-motorcycle", "fa-solid fa-bicycle",
    "fa-solid fa-baby-carriage", "fa-solid fa-puzzle-piece", "fa-solid fa-book",
    "fa-solid fa-pen-nib", "fa-solid fa-palette", "fa-solid fa-music",
    "fa-solid fa-gift", "fa-solid fa-bag-shopping", "fa-solid fa-tag"
  ];

  const COLORS = [
    { label: "أسود", value: "black" }, { label: "أبيض", value: "white" },
    { label: "أحمر", value: "red" }, { label: "أزرق", value: "blue" },
    { label: "أخضر", value: "green" }, { label: "أصفر", value: "yellow" },
    { label: "رمادي", value: "gray" }, { label: "بيج", value: "beige" },
    { label: "بني", value: "brown" }, { label: "وردي", value: "pink" },
    { label: "بنفسجي", value: "purple" }, { label: "برتقالي", value: "orange" },
    { label: "زيتي", value: "olive" }, { label: "فضي", value: "silver" },
    { label: "ذهبي", value: "gold" }, { label: " تركوازي", value: "turquoise" },
    { label: "كحلي", value: "navy" }, { label: "لافندر", value: "lavender" },
    { label: "زمردي", value: "emerald" }, { label: "عنابي", value: "maroon" },
    { label: "كستنائي", value: "chestnut" },
  ];

  const state = {
    colors: [], sizes: [], colorId: 0, sizeId: 0, isEdit: false, productId: null,
    exchangeRate: null,
  };

  // ===== سعر الصرف: يُجلب مرة واحدة لعرض معاينة تلقائية بالليرة للأدمن =====
  async function loadExchangeRate() {
    try {
      const res = await fetch(`${API_BASE}/exchange-rate`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      state.exchangeRate = Number(data.rate) || null;
    } catch (err) {
      console.error("Failed to load exchange rate:", err);
      state.exchangeRate = null;
    } finally {
      updateCurrencyHint();
    }
  }

  // ===== تحديث نص المعاينة أسفل حقل السعر =====
  function updateCurrencyHint() {
    if (!els.currencyHint || !els.currency || !els.price) return;

    const value = parseFloat(els.price.value);
    els.currencyHint.classList.remove("show-conversion");

    if (els.currency.value === "USD") {
      if (!isNaN(value) && value > 0 && state.exchangeRate) {
        const syp = (value * state.exchangeRate).toLocaleString("ar-SY", {
          maximumFractionDigits: 0,
        });
        els.currencyHint.textContent = `سيظهر للزبون تلقائياً بما يعادل ${syp} ل.س (حسب سعر الصرف الحالي)`;
        els.currencyHint.classList.add("show-conversion");
      } else {
        els.currencyHint.textContent = "سيتم تحويل هذا السعر تلقائياً إلى الليرة السورية عند عرضه للزبون";
      }
    } else {
      els.currencyHint.textContent = "السعر سيُعرض للزبون بالليرة السورية كما هو مُدخل";
    }
  }

  const els = {
    title: document.getElementById("title"),
    price: document.getElementById("price"),
    currency: document.getElementById("currency"),
    currencyHint: document.getElementById("currencyHint"),
    description: document.getElementById("description"),
    category: document.getElementById("category"),
    brand: document.getElementById("brand"),
    colorsList: document.getElementById("colorsList"),
    sizesList: document.getElementById("sizesList"),
    addColorBtn: document.getElementById("addColorBtn"),
    addSizeBtn: document.getElementById("addSizeBtn"),
    saveBtn: document.getElementById("saveBtn"),
    
    // Add-category modal
    addCategoryBtn: document.getElementById("addCategoryBtn"),
    categoryModalOverlay: document.getElementById("categoryModalOverlay"),
    closeCategoryModalBtn: document.getElementById("closeCategoryModal"),
    cancelCategoryBtn: document.getElementById("cancelCategoryBtn"),
    saveCategoryBtn: document.getElementById("saveCategoryBtn"),
    newCategoryName: document.getElementById("newCategoryName"),
    
    // Icon Selection elements
    categoryIconInput: document.getElementById("categoryIcon"),
    iconGrid: document.getElementById("iconGrid"),
  };

  function showToast(msg, type = "success") {
    let toastBox = document.getElementById("toast-box");
    let toast = document.createElement("div");
    toast.classList.add("toast", type);
    let icon = "";
    if (type === "success") icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === "error") icon = '<i class="fa-solid fa-circle-xmark"></i>';
    if (type === "warning") icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
    toast.innerHTML = `${icon} ${msg}`;
    toastBox.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("hide");
      toast.addEventListener("animationend", () => toast.remove());
    }, 4000);
  }

  // ===== دالة طباعة الأيقونات في الواجهة =====
  function renderIcons() {
    if (!els.iconGrid) return;
    els.iconGrid.innerHTML = "";
    
    CATEGORY_ICONS.forEach((iconClass) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "icon-option";
      btn.innerHTML = `<i class="${iconClass}"></i>`;
      
      btn.onclick = () => {
        // إزالة التحديد عن كل الأيقونات
        document.querySelectorAll(".icon-option").forEach(b => b.classList.remove("active"));
        // تظليل الأيقونة المحددة
        btn.classList.add("active");
        // حفظ قيمة الكلاس في الحقل المخفي
        els.categoryIconInput.value = iconClass;
      };
      
      els.iconGrid.appendChild(btn);
    });
  }

  // ===== Categories (loaded dynamically) =====
  async function loadCategories(selectedId = null) {
  const categorySelect = els.category;
  if (!categorySelect) return;
  categorySelect.disabled = true;
  categorySelect.innerHTML = `<option value="" disabled selected>جاري تحميل الفئات...</option>`;
  
  try {
    // تم إزالة getAuthHeaders() من هنا لمنع إرسال توكن خاطئ لمسار عام
    const res = await fetch(`${API_BASE}/categories`, { 
        headers: { "Accept": "application/json" } 
    });
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
      const categories = Array.isArray(data) ? data : data.data || [];
      categorySelect.innerHTML = `<option value="" disabled ${selectedId ? "" : "selected"}>اختر الفئة...</option>`;
      categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
      });
      if (selectedId) categorySelect.value = selectedId;
    } catch (err) {
      console.error("Failed to load categories:", err);
      categorySelect.innerHTML = `<option value="" disabled selected>تعذر تحميل الفئات</option>`;
      showToast("تعذر تحميل قائمة الفئات، حاول تحديث الصفحة", "error");
    } finally {
      categorySelect.disabled = false;
    }
  }

  // ===== Quick "add category" modal =====
  function resetCategoryModalFields() {
    els.newCategoryName.value = "";
    els.categoryIconInput.value = "";
    // إزالة التحديد المرئي عن الأيقونات
    document.querySelectorAll(".icon-option").forEach(b => b.classList.remove("active"));
  }

  function openCategoryModal() {
    resetCategoryModalFields();
    els.categoryModalOverlay.classList.remove("hidden");
  }

  function closeCategoryModal() {
    els.categoryModalOverlay.classList.add("hidden");
  }

  async function addCategory(event) {
    if(event) event.preventDefault();

    const categoryName = els.newCategoryName.value;
    const categoryIcon = els.categoryIconInput.value;
    const token = localStorage.getItem("token");

    if (!token) {
        showToast("يرجى تسجيل الدخول أولاً", "warning");
        return;
    }
    if(!categoryName) {
        showToast("يرجى إدخال اسم القسم", "warning");
        return;
    }
    if(!categoryIcon) {
        showToast("يرجى اختيار أيقونة للقسم", "warning");
        return;
    }

    try {
        els.saveCategoryBtn.disabled = true;
        els.saveCategoryBtn.textContent = "جاري الحفظ...";

        const response = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: categoryName, icon: categoryIcon })
        });

        const data = await response.json();

        if (response.ok) {
            showToast("تم إضافة القسم بنجاح", "success");
            closeCategoryModal();
            loadCategories(); 
        } else {
            showToast(data.message || "حدث خطأ أثناء الإضافة", "error");
        }
    } catch (error) {
        showToast("فشل الاتصال بالخادم", "error");
    } finally {
        els.saveCategoryBtn.disabled = false;
        els.saveCategoryBtn.textContent = "حفظ القسم";
    }
  }

  // --- دوال المنتجات (الألوان والمقاسات) ... لم يتم تغييرها ---
  const addColorRow = (data = {}) => {
    const id = ++state.colorId;
    const initialImage = data.image || "";
    const shouldShowImage = initialImage !== "";
    const color = { id, value: data.color || "", file: null, image: initialImage };
    state.colors.push(color);

    const row = document.createElement("div");
    row.className = "option-item";
    row.innerHTML = `
      <select class="form-select" style="margin-bottom: 0.5rem ;">
          <option value="">اختر لون</option>
          ${COLORS.map(c => `<option value="${c.value}">${c.label}</option>`).join("")}
      </select>
      <div class="preview-container" style="text-align: center; margin-bottom: 10px;">
          <img class="img-preview" src="${initialImage}" alt="معاينة الصورة" 
               style="width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; border: 1px solid #e5e7eb; padding: 4px; display: ${shouldShowImage ? "block" : "none"};">
      </div>
      <label class="custom-file-upload">
          <input type="file" accept="image/*">
          <i class="${shouldShowImage ? "fas fa-check-circle" : "fas fa-cloud-upload-alt"}"></i>
          <span class="upload-text">${shouldShowImage ? "تغيير الصورة" : "اختر صورة للون"}</span>
      </label>
      <button type="button" class="btn-remove" style="position: absolute; left: 10px; top: 10px;">&times;</button>
  `;
    const select = row.querySelector("select");
    const fileInput = row.querySelector("input[type=file]");
    const uploadLabel = row.querySelector(".custom-file-upload");
    const uploadText = row.querySelector(".upload-text");
    const uploadIcon = row.querySelector(".custom-file-upload i");
    const imgPreview = row.querySelector(".img-preview");
    const remove = row.querySelector(".btn-remove");

    select.value = color.value;
    select.onchange = (e) => (color.value = e.target.value);

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      color.file = file;
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          imgPreview.src = e.target.result;
          imgPreview.style.display = "block";
        };
        reader.readAsDataURL(file);
        uploadLabel.classList.add("uploaded");
        uploadText.textContent = file.name.length > 20 ? file.name.substring(0, 20) + "..." : file.name;
        uploadIcon.className = "fas fa-check-circle";
      } else {
        if (!initialImage) {
          imgPreview.style.display = "none";
          uploadLabel.classList.remove("uploaded");
          uploadText.textContent = "اختر صورة للون";
          uploadIcon.className = "fas fa-cloud-upload-alt";
        }
      }
    };
    remove.onclick = () => {
      row.remove();
      state.colors = state.colors.filter((c) => c.id !== id);
    };
    els.colorsList.appendChild(row);
  };

  const addSizeRow = (value = "") => {
    const id = ++state.sizeId;
    const size = { id, value };
    state.sizes.push(size);
    const row = document.createElement("div");
    row.className = "option-item";
    row.innerHTML = `<label><input type="text" class="form-input" placeholder="مثال: XL"><button type="button" class="btn-remove">&times;</button></label>`;
    const input = row.querySelector("input");
    const remove = row.querySelector(".btn-remove");
    input.value = value;
    input.oninput = (e) => (size.value = e.target.value);
    remove.onclick = () => {
      row.remove();
      state.sizes = state.sizes.filter((s) => s.id !== id);
    };
    els.sizesList.appendChild(row);
  };

  const saveProduct = async () => {
    if (!localStorage.getItem("token")) {
      showToast("يرجى تسجيل الدخول", "warning"); return;
    }
    if (!els.title.value || !els.price.value || !els.category.value) {
      showToast("يرجى ملء الحقول الأساسية", "warning"); return;
    }
    if (!state.colors.length) {
      showToast("أضف لونًا واحدًا على الأقل مع صورة", "warning"); return;
    }

    const fd = new FormData();
    fd.append("name", els.title.value);
    fd.append("description", els.description.value);
    fd.append("price", els.price.value);
    fd.append(CATEGORY_FIELD_NAME, els.category.value);
    fd.append("brand", els.brand.value || "");
    fd.append("currency", els.currency.value || "SYP");

    state.sizes.forEach((s, i) => { if (s.value) fd.append(`sizes[${i}][size]`, s.value); });
    state.colors.forEach((c, i) => {
      fd.append(`images[${i}][color]`, c.value);
      fd.append(`images[${i}][file]`, c.file);
    });

    let url = `${API_BASE}/products`;
    if (state.isEdit) {
      url += `/${state.productId}`;
      fd.append("_method", "PUT");
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: fd,
      });
      if (res.ok) {
        showToast("تمت إضافة المنتج بنجاح!", "success");
        setTimeout(() => location.reload(), 1500);
      } else {
        const err = await res.json();
        showToast("حدث خطأ أثناء إضافة المنتج", "error");
        if (err.errors) {
          showToast(Object.values(err.errors)[0][0], "error");
        }
      }
    } catch (e) {
      showToast("فشل الاتصال بالسيرفر!", "error");
    }
  };

  els.addColorBtn.onclick = () => addColorRow();
  els.addSizeBtn.onclick = () => addSizeRow();
  els.saveBtn.onclick = saveProduct;

  if (els.price) els.price.addEventListener("input", updateCurrencyHint);
  if (els.currency) els.currency.addEventListener("change", updateCurrencyHint);

  if (els.addCategoryBtn) els.addCategoryBtn.onclick = openCategoryModal;
  if (els.closeCategoryModalBtn) els.closeCategoryModalBtn.onclick = closeCategoryModal;
  if (els.cancelCategoryBtn) els.cancelCategoryBtn.onclick = closeCategoryModal;
  if (els.saveCategoryBtn) els.saveCategoryBtn.onclick = addCategory;
  if (els.categoryModalOverlay) {
    els.categoryModalOverlay.onclick = (e) => {
      if (e.target === els.categoryModalOverlay) closeCategoryModal();
    };
  }

  // استدعاء الدوال عند تحميل الصفحة
  renderIcons(); 
  loadCategories();
  loadExchangeRate();
  addColorRow();
  addSizeRow();
})();