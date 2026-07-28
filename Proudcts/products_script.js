const API_BASE_URL = "https://api.tasswek.com";

const API_URLS = {
  GET_ALL_PRODUCTS: `${API_BASE_URL}/api/products`,
  GET_PRODUCTS_BY_CATEGORY: (category) => `${API_BASE_URL}/api/products/category/${category}`,
  DELETE_PRODUCT: (id) => `${API_BASE_URL}/api/products/${id}`,
};

function showToast(msg, type = "success") {
  let toastBox = document.getElementById("toast-box");
  if (!toastBox) return;

  let toast = document.createElement("div");
  toast.classList.add("toast", type);

  let icon = "";
  if (type === "success") icon = '<i class="fa-solid fa-circle-check"></i>';
  if (type === "error") icon = '<i class="fa-solid fa-circle-xmark"></i>';
  if (type === "warning") icon = '<i class="fa-solid fa-triangle-exclamation"></i>';

  toast.innerHTML = `${icon} <span>${msg}</span>`;
  toastBox.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    toast.addEventListener("animationend", () => toast.remove());
  }, 4000);
}

let allProducts = [];

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const selectedCategory = urlParams.get("cat"); 
  const role = urlParams.get("role") || localStorage.getItem("role"); // جلب الدور أيضاً من localStorage
  const isAdmin = role === "admin";

  const container = document.getElementById("productsContainer");
  const titleElement = document.getElementById("pageTitle");
  
  // تصحيح ربط عناصر البحث مع الـ HTML
  const searchInput = document.getElementById("globalSearchInput");
  const searchBtn = document.querySelector(".search-btn");

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
    clothes: "الملابس",
  };

  if (selectedCategory && categoryTitles[selectedCategory] && titleElement) {
    titleElement.textContent = categoryTitles[selectedCategory];
  }

  async function fetchProducts() {
    if (!container) return;
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;font-weight:bold;">جاري تحميل المنتجات...</div>';

    try {
      const url = selectedCategory
        ? API_URLS.GET_PRODUCTS_BY_CATEGORY(selectedCategory)
        : API_URLS.GET_ALL_PRODUCTS;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("فشل في جلب المنتجات");

      const result = await response.json();
      const data = result.data || result; 

      allProducts = data.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        discount: item.discount_percentage || 0, 
        finalPrice: item.final_price || item.price, 
        currency: "SYP",
        img: item.image_url || item.image || "/images/default.png",
        category: item.category,
      }));

      renderProducts(allProducts);
    } catch (error) {
      console.error(error);
      container.innerHTML = `<div class="no-results" style="color:red">حدث خطأ أثناء جلب البيانات</div>`;
    }
  }

  const renderProducts = (products) => {
    if (!products || products.length === 0) {
      container.innerHTML = '<div class="no-results">لا توجد منتجات في هذا القسم.</div>';
      return;
    }

    container.innerHTML = products
      .map((product) => createProductCard(product, isAdmin))
      .join("");
  };

  const handleSearch = () => {
    if (!searchInput) return;
    const term = searchInput.value.trim().toLowerCase();
    const filtered = allProducts.filter((p) =>
      p.name.toLowerCase().includes(term)
    );
    renderProducts(filtered);
  };

  if (searchBtn) searchBtn.addEventListener("click", (e) => { e.preventDefault(); handleSearch(); });
  if (searchInput) searchInput.addEventListener("keyup", (e) => { if (e.key === "Enter") handleSearch(); });

  fetchProducts();
});

function createProductCard(product, isAdmin) {
  const priceFormatted = new Intl.NumberFormat("en-US").format(product.price);
  const finalPriceVal = product.finalPrice ?? product.price;
  const finalFormatted = new Intl.NumberFormat("en-US").format(finalPriceVal);

  let priceHtml = product.discount > 0
    ? `
      <div class="price-container">
        <span class="new-price">${finalFormatted} SYP</span>
        <span class="old-price">${priceFormatted} SYP</span>
      </div>
    `
    : `<span class="regular-price">${priceFormatted} SYP</span>`;

  const discountBadge = product.discount > 0
    ? `<span class="discount-badge">-${product.discount}%</span>`
    : "";

  const adminActions = isAdmin
    ? `
      <div class="admin-actions">
        <button class="admin-btn edit-btn" onclick="goToEditPage(event, ${product.id})">
          <i class="fa fa-edit"></i>
          <span>تعديل</span>
        </button>

        <button class="admin-btn delete-btn" onclick="deleteProduct(event, ${product.id})">
          <i class="fa fa-trash"></i>
          <span>حذف</span>
        </button>
      </div>
    `
    : "";

  return `
    <div class="product-card">
      <a href="/Product/Product.html?id=${product.id}" class="card-link-wrapper">
        <div class="product-img-wrapper">
          ${discountBadge}
          <img src="${product.img}" alt="${product.name}" onerror="this.src='/images/logo.webp'">
        </div>

        <div class="product-info">
          <div class="product-title">${product.name}</div>
          <div class="product-price">${priceHtml}</div>
        </div>
      </a>
      ${adminActions}
    </div>
  `;
}

// دالة الانتقال للتعديل مع إيقاف انتشار الحدث
window.goToEditPage = (event, id) => {
  event.preventDefault();
  event.stopPropagation();
  window.location.href = `/Edit_Product/Edit_Product.html?editId=${id}`;
};

// دالة الحذف مع إيقاف انتشار الحدث
window.deleteProduct = async (event, id) => {
  event.preventDefault();
  event.stopPropagation();

  if (!confirm("هل أنت متأكد من حذف المنتج؟")) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json", 
        "Accept": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (response.ok) {
      showToast("تم حذف المنتج بنجاح", "success");
      setTimeout(() => { location.reload(); }, 1000); 
    } else {
      const errorData = await response.json();
      showToast(errorData.message || "فشل الحذف", "error");
    }
  } catch (error) {
    console.error("Error details:", error);
    showToast("حدث خطأ في الاتصال بالسيرفر", "error");
  }
};