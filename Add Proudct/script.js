
const getAuthHeaders = () => ({
  Accept: "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

(function () {
  "use strict";

  const COLORS = [
    { label: "أسود", value: "black" },
    { label: "أبيض", value: "white" },
    { label: "أحمر", value: "red" },
    { label: "أزرق", value: "blue" },
    { label: "أخضر", value: "green" },
    { label: "أصفر", value: "yellow" },
    { label: "رمادي", value: "gray" },
    { label: "بيج", value: "beige" },
    { label: "بني", value: "brown" },
    { label: "وردي", value: "pink" },
    { label: "بنفسجي", value: "purple" },
    { label: "برتقالي", value: "orange" },
    { label: "زيتي", value: "olive" },
    { label: "فضي", value: "silver" },
    { label: "ذهبي", value: "gold" },
    { label: " تركوازي", value: "turquoise" },
    { label: "كحلي", value: "navy" },
    { label: "لافندر", value: "lavender" },
    { label: "زمردي", value: "emerald" },
    { label: "عنابي", value: "maroon" },
    { label: "كستنائي", value: "chestnut" },
  ];
  const categoryTitles = {
    electronics: "الإلكترونيات",
    food: "المواد الغذائية",
    meals: "المأكولات",
    makeup: "مستحضرات التجميل",
    men: "أزياء رجالية",
    women: "أزياء نسائية",
    perfume: "العطور",
    cleaning: "المنظفات",
    furniture: "المفروشات",
    sweets: "الحلويات",
  };

  const categorySelect = document.getElementById("category");

  if (categorySelect) {
    Object.entries(categoryTitles).forEach(([key, label]) => {
      const option = document.createElement("option");
      option.value = key; 
      option.textContent = label; 
      categorySelect.appendChild(option);
    });
  }
  const state = {
    colors: [],
    sizes: [],
    colorId: 0,
    sizeId: 0,
    isEdit: false,
    productId: null,
  };

  const els = {
    title: document.getElementById("title"),
    price: document.getElementById("price"),
    description: document.getElementById("description"),
    category: document.getElementById("category"),
    brand: document.getElementById("brand"),
    colorsList: document.getElementById("colorsList"),
    sizesList: document.getElementById("sizesList"),
    addColorBtn: document.getElementById("addColorBtn"),
    addSizeBtn: document.getElementById("addSizeBtn"),
    saveBtn: document.getElementById("saveBtn"),
    pageTitle: document.querySelector(".page-header h1"),
  };


  function showToast(msg, type = "success") {
    let toastBox = document.getElementById("toast-box");

 
    let toast = document.createElement("div");
    toast.classList.add("toast", type);

    let icon = "";
    if (type === "success") icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === "error") icon = '<i class="fa-solid fa-circle-xmark"></i>';
    if (type === "warning")
      icon = '<i class="fa-solid fa-triangle-exclamation"></i>';

    toast.innerHTML = `${icon} ${msg}`;

    toastBox.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("hide"); 
      toast.addEventListener("animationend", () => {
        toast.remove(); 
      });
    }, 4000);
  }

  const addColorRow = (data = {}) => {
    const id = ++state.colorId;

    const initialImage = data.image || "";
    const shouldShowImage = initialImage !== "";

    const color = {
      id,
      value: data.color || "",
      file: null,
      image: initialImage,
    };

    state.colors.push(color);

    const row = document.createElement("div");
    row.className = "option-item";

    row.innerHTML = `
      <select class="form-select" style="margin-bottom: 0.5rem ;">
          <option value="">اختر لون</option>
          ${COLORS.map(
            (c) => `<option value="${c.value}">${c.label}</option>`
          ).join("")}
      </select>
      
      <div class="preview-container" style="text-align: center; margin-bottom: 10px;">
          <img class="img-preview" 
               src="${initialImage}" 
               alt="معاينة الصورة" 
               style="width: 100%; max-height: 200px; object-fit: contain; border-radius: 8px; border: 1px solid #e5e7eb; padding: 4px; display: ${
                 shouldShowImage ? "block" : "none"
               };">
      </div>

      <label class="custom-file-upload">
          <input type="file" accept="image/*">
          <i class="${
            shouldShowImage ? "fas fa-check-circle" : "fas fa-cloud-upload-alt"
          }"></i>
          <span class="upload-text">${
            shouldShowImage ? "تغيير الصورة" : "اختر صورة للون"
          }</span>
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
        uploadText.textContent =
          file.name.length > 20
            ? file.name.substring(0, 20) + "..."
            : file.name;
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

    row.innerHTML = `
           <label>  
            <input type="text" class="form-input" placeholder="مثال: XL">
            <button type="button" class="btn-remove">&times;</button>
            </label>
        `;

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
      showToast("يرجى تسجيل الدخول", "warning");
      return;
    }

    if (!els.title.value || !els.price.value || !els.category.value) {
      showToast("يرجى ملء الحقول الأساسية", "warning");
      return;
    }

    if (!state.colors.length) {
      showToast("أضف لونًا واحدًا على الأقل مع صورة", "warning");
      return;
    }

    const fd = new FormData();

    fd.append("name", els.title.value);
    fd.append("description", els.description.value);
    fd.append("price", els.price.value);
    fd.append("category", els.category.value);
    fd.append("brand", els.brand.value || "");

    state.sizes.forEach((s, i) => {
      if (s.value) fd.append(`sizes[${i}][size]`, s.value);
    });

    state.colors.forEach((c, i) => {
      fd.append(`images[${i}][color]`, c.value);
      fd.append(`images[${i}][file]`, c.file);
    });

    let url = "https://api.tasswek.com/api/products";
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
        console.error("Laravel Validation Error:", err);
        showToast("حدث خطأ أثناء إضافة المنتج", "error");
        if (err.errors) {
          const firstError = Object.values(err.errors)[0][0];
        } else {
          showToast("خطأ غير متوقع", "error");
        }
      }
    } catch (e) {
      console.error(err);
      showToast("فشل الاتصال بالسيرفر!", "error");
    }
  };

  els.addColorBtn.onclick = () => addColorRow();
  els.addSizeBtn.onclick = () => addSizeRow();
  els.saveBtn.onclick = saveProduct;

  addColorRow(); 
  addSizeRow(); 
})();
