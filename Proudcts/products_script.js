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

// ===== Exchange Rate (SYP -> USD) =====
let EXCHANGE_RATE = null;

async function fetchExchangeRate() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/exchange-rate`);
    if (!res.ok) throw new Error("bad response");
    const json = await res.json();
    const rate = Number(json.rate);
    EXCHANGE_RATE = rate > 0 ? rate : null;
  } catch (e) {
    console.error("فشل جلب سعر الصرف", e);
    EXCHANGE_RATE = null;
  }
  return EXCHANGE_RATE;
}

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

      allProducts = data.map((item) => {
        // العملة التي أدخل بها الأدمن سعر هذا المنتج (افتراضياً SYP للمنتجات القديمة)
        const currency = item.currency || "SYP";
        const rawPrice = Number(item.price); // بنفس عملة "currency" تماماً كما أُدخل

        const discountPercentage = Number(item.discount_percentage || item.activeOffer?.discount_percentage || 0);
        const discountAmount = item.discount_price ?? item.activeOffer?.discount_price ?? null; // ملاحظة: يُفترض أنه مُدخل بنفس عملة المنتج

        // نطبّق الخصم على السعر بعملته الأصلية أولاً، ثم نحوّل بعد ذلك
        let finalNative = rawPrice;
        if (discountPercentage > 0) {
          finalNative = rawPrice - (rawPrice * discountPercentage / 100);
        } else if (discountAmount) {
          finalNative = rawPrice - Number(discountAmount);
        }
        finalNative = Math.max(finalNative, 0);

        return {
          id: item.id,
          name: item.name,
          currency,           // "USD" أو "SYP": عملة الإدخال الأصلية (تُعرض كسعر رئيسي)
          rawPrice,            // السعر الأصلي قبل الخصم، بعملته
          finalNative,         // السعر بعد الخصم، بنفس عملته الأصلية
          discount: discountPercentage,
          img: item.image_url || item.image || "/images/default.png",
          category: item.category,
        };
      });

      renderProducts(allProducts);
    } catch (error) {
      console.error(error);
      container.innerHTML = `<div class="no-results" style="color:#e74c3c">حدث خطأ أثناء جلب البيانات</div>`;
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

  (async () => {
    await fetchExchangeRate();
    fetchProducts();
  })();
});

// يبني نص السعر بالشكل الصحيح حسب العملة: "$100.00" أو "13,158 SYP"
function formatMoney(value, currency) {
  if (currency === "USD") {
    return `$${Number(value).toFixed(2)}`;
  }
  return `${new Intl.NumberFormat("en-US").format(Math.round(value))} SYP`;
}

function createProductCard(product, isAdmin) {
  const isUsd = product.currency === "USD";
  const otherCurrency = isUsd ? "SYP" : "USD";

  // السعر المحوّل للعملة الأخرى (تقريبي، حسب آخر سعر صرف)، يُعرض بجانب السعر الأصلي
  const convert = (val) => {
    if (!EXCHANGE_RATE) return null;
    return isUsd ? val * EXCHANGE_RATE : val / EXCHANGE_RATE;
  };

  const finalConverted = convert(product.finalNative);
  const convertedHtml = finalConverted !== null
    ? `<span class="usd-price">(~${formatMoney(finalConverted, otherCurrency)})</span>`
    : "";

  let priceHtml = product.discount > 0
    ? `
      <div class="price-container">
        <span class="new-price">${formatMoney(product.finalNative, product.currency)}</span>
        <span class="old-price">${formatMoney(product.rawPrice, product.currency)}</span>
        ${convertedHtml}
      </div>
    `
    : `<span class="regular-price">${formatMoney(product.finalNative, product.currency)}</span> ${convertedHtml}`;

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
          <img src="${product.img}" alt="${product.name}" onerror="this.src='/images/looogo.png'">
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