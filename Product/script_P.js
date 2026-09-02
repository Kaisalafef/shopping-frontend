const API_BASE = "https://api.tasswek.com/api";

  
  
  
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

// ===== Exchange Rate (SYP -> USD) =====
let EXCHANGE_RATE = null;

async function fetchExchangeRate() {
  try {
    const res = await fetch(`${API_BASE}/exchange-rate`);
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

function usdLabel(sypAmount) {
  if (!EXCHANGE_RATE) return "";
  return `<span class="usd-price">(~$${(sypAmount / EXCHANGE_RATE).toFixed(2)})</span>`;
}

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

if (!productId) {
  showToast("لم يتم تحديد المنتج", "warning");
}


const titleEl = document.getElementById("pw-title");
const priceEl = document.getElementById("pw-price");
const descEl = document.getElementById("pw-description");
const imageEl = document.getElementById("pw-product-image");

const colorGroup = document.getElementById("pw-color-group");
const colorContainer = document.getElementById("pw-color-options");

const sizeGroup = document.getElementById("pw-size-group");
const sizeSelect = document.getElementById("pw-size-select");

const qtyInput = document.getElementById("pw-quantity");
const btnInc = document.getElementById("pw-qty-inc");
const btnDec = document.getElementById("pw-qty-dec");

const addBtn = document.getElementById("pw-add-btn");


const lightbox = document.getElementById("pw-lightbox");
const lightboxImg = document.getElementById("pw-lightbox-img");
const lightboxClose = document.getElementById("pw-lightbox-close");


const reviewRatingValue = document.getElementById("review-rating-value");
const reviewComment = document.getElementById("review-text");
const reviewBtn = document.querySelector("#review-form .submit-btn");


let selectedColor = null;


async function loadProduct() {
  try {
    const res = await fetch(`${API_BASE}/products/${productId}`);
    if (!res.ok) throw new Error("Product not found");

    const json = await res.json();
    renderProduct(json.data);
  } catch (err) {
    console.error(err);
    showToast("تعذر تحميل بيانات المنتج", "error");
  }
}

function calcDiscountedPrice(price, offer) {
  if (!offer) return price;

  
  if (offer.discount_percentage) {
    return Math.round(price - price * (offer.discount_percentage / 100));
  }

  
  if (offer.discount_price) {
    return price - offer.discount_price;
  }

  return price;
}


// يبني نص السعر بالشكل الصحيح حسب العملة: "$100.00" أو "13,158 SYP"
function formatMoney(value, currency) {
  if (currency === "USD") {
    return `$${Number(value).toFixed(2)}`;
  }
  return `${new Intl.NumberFormat("en-US").format(Math.round(value))} SYP`;
}

function renderProduct(product) {
  console.log("PRODUCT DATA 👉", product);

  titleEl.textContent = product.name;
  descEl.textContent = product.description;
  imageEl.src = product.image_url;

  // العملة التي أدخل بها الأدمن سعر هذا المنتج (افتراضياً SYP للمنتجات القديمة)
  const currency = product.currency || "SYP";
  const isUsd = currency === "USD";
  const otherCurrency = isUsd ? "SYP" : "USD";

  const rawPrice = Number(product.price); // بنفس عملة "currency" تماماً كما أُدخل
  const discount = Number(product.discount_percentage || 0);

  // السعر المحوّل للعملة الأخرى (تقريبي، حسب آخر سعر صرف)
  const convert = (val) => {
    if (!EXCHANGE_RATE) return null;
    return isUsd ? val * EXCHANGE_RATE : val / EXCHANGE_RATE;
  };

  if (discount > 0) {
    const finalPrice = rawPrice - rawPrice * (discount / 100);
    const convertedFinal = convert(finalPrice);
    priceEl.innerHTML = `
      <span class="old-price">${formatMoney(rawPrice, currency)}</span>
      <span class="new-price">${formatMoney(finalPrice, currency)}</span>
      <span class="discount-badge">-${discount}%</span>
      ${convertedFinal !== null ? `<span class="usd-price">(~${formatMoney(convertedFinal, otherCurrency)})</span>` : ""}
    `;
  } else {
    const convertedRaw = convert(rawPrice);
    priceEl.innerHTML = `
      <span class="new-price">${formatMoney(rawPrice, currency)}</span>
      ${convertedRaw !== null ? `<span class="usd-price">(~${formatMoney(convertedRaw, otherCurrency)})</span>` : ""}
    `;
  }

  
  renderColors(product.images || []);

  
  renderSizes(product.sizes || []);
}



function renderColors(images) {
  if (!images.length) {
    colorGroup.classList.add("pw--hidden");
    return;
  }

  colorGroup.classList.remove("pw--hidden");
  colorContainer.innerHTML = "";

  images.forEach((img, index) => {
    const swatch = document.createElement("div");
    swatch.className = "pw__color-swatch";
    swatch.style.background = img.color;

    swatch.addEventListener("click", () => {
      document
        .querySelectorAll(".pw__color-swatch")
        .forEach((el) => el.classList.remove("selected"));

      swatch.classList.add("selected");
      selectedColor = img.color;

      if (img.url) {
        imageEl.src = img.url;
      }
    });

    if (index === 0) {
      swatch.classList.add("selected");
      selectedColor = img.color;

      if (img.url) {
        imageEl.src = img.url;
      }
    }

    colorContainer.appendChild(swatch);
  });
}


function renderSizes(sizes) {
  if (!sizes.length) {
    sizeGroup.classList.add("pw--hidden");
    return;
  }

  sizeGroup.classList.remove("pw--hidden");
  sizeSelect.innerHTML = `<option value="">اختر المقاس</option>`;

  sizes.forEach((size) => {
    const opt = document.createElement("option");
    opt.value = size.size;
    opt.textContent = size.size;
    sizeSelect.appendChild(opt);
  });
}


btnInc.addEventListener("click", () => {
  qtyInput.value = parseInt(qtyInput.value || 1) + 1;
});

btnDec.addEventListener("click", () => {
  const value = parseInt(qtyInput.value || 1);
  if (value > 1) qtyInput.value = value - 1;
});

// In script_P.js - replace the addBtn event listener (around line 260-290)

addBtn.addEventListener("click", () => {
  const quantity = parseInt(qtyInput.value || 1);

  if (!quantity || quantity < 1) {
    showToast("يرجى إدخال كمية صحيحة", "warning");
    return;
  }

  if (!colorGroup.classList.contains("pw--hidden") && !selectedColor) {
    showToast("يرجى اختيار اللون", "warning");
    return;
  }

  if (!sizeGroup.classList.contains("pw--hidden") && !sizeSelect.value) {
    showToast("يرجى اختيار المقاس", "warning");
    return;
  }

  const token = localStorage.getItem("token");

  // Show loading state
  const btnText = document.getElementById("pw-btn-text");
  const originalText = btnText.textContent;
  btnText.textContent = "جاري الإضافة...";
  addBtn.disabled = true;

  fetch(`${API_BASE}/my-cart`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",  // Important: ensure JSON response
    },
  })
    .then(async (res) => {
      // Check if response is OK before parsing JSON
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Cart fetch failed:", res.status, errorText);
        throw new Error(`فشل جلب السلة: ${res.status} - ${errorText.substring(0, 100)}`);
      }
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        throw new Error("استجابة غير متوقعة من السيرفر");
      }
      
      return res.json();
    })
    .then((cart) => {
      const cartId = cart.id;
      const payload = {
        product_id: productId,
        quantity,
        color: selectedColor,
        size: sizeSelect.value || null,
      };

      return fetch(`${API_BASE}/carts/${cartId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
    })
    .then(async (res) => {
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Add to cart failed:", res.status, errorText);
        throw new Error(`فشل إضافة المنتج: ${res.status}`);
      }
      return res.json();
    })
    .then((item) => {
      console.log("تمت إضافة المنتج:", item);
      showToast("تمت إضافة المنتج إلى السلة بنجاح ✅", "success");
      window.dispatchEvent(new CustomEvent("cart:updated"));
    })
    .catch((err) => {
      console.error(err);
      showToast(err.message || "حدث خطأ أثناء إضافة المنتج", "error");
    })
    .finally(() => {
      // Reset button state
      btnText.textContent = originalText;
      addBtn.disabled = false;
    });
});

reviewBtn.addEventListener("click", (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  if (!token) {
    showToast("يجب تسجيل الدخول لإضافة تقييم", "warning");
    return;
  }

  if (!productId) {
    showToast("لا يمكن إضافة تقييم: المنتج غير محدد", "warning");
    return;
  }

  const rating = parseFloat(reviewRatingValue.value);
  const comment = reviewComment.value.trim();

  if (!rating || rating < 1 || rating > 5) {
    showToast("الرجاء إدخال تقييم بين 1 و 5", "warning");
    return;
  }

  const payload = {
    product_id: productId,
    rating,
    comment,
  };

  fetch(`${API_BASE}/reviews`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
    .then((res) => {
      if (!res.ok) throw new Error("تعذر إرسال التقييم");
      return res.json();
    })
    .then((data) => {
      console.log("تم إرسال التقييم:", data);
      showToast("تم إرسال التقييم بنجاح ✅","success");
      reviewRatingValue.value = "";
      reviewComment.value = "";
      document
        .querySelectorAll("#rating-input .star")
        .forEach((s) => (s.textContent = "☆"));

      
      loadReviews();
    })
    .catch((err) => {
      console.error(err);
      alert(err.message);
    });
});


document.addEventListener("DOMContentLoaded", () => {
  const stars = document.querySelectorAll("#rating-input .star");
  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const rating = star.dataset.value;
      reviewRatingValue.value = rating;

      stars.forEach((s) => (s.textContent = "☆"));
      for (let i = 0; i < rating; i++) {
        stars[i].textContent = "★";
      }
    });
  });

  
  fetchExchangeRate().then(() => loadProduct());

  
  loadReviews();
});



const reviewsApi = () => `${API_BASE}/reviews/product/${productId}`;

async function loadReviews() {
  if (!productId) return;

  try {
    const res = await fetch(reviewsApi());
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      document.getElementById("reviews-list").innerHTML =
        "<p>لا توجد تقييمات بعد</p>";
      document.getElementById("average-rating").textContent = "0.0";
      document.getElementById("average-stars").textContent = "☆☆☆☆☆";
      document.getElementById("reviews-count").textContent = "0 تقييم";
      return;
    }

    renderAverageRating(data);
    renderReviews(data);
  } catch (err) {
    console.error("خطأ في تحميل التقييمات", err);
  }
}

function renderAverageRating(reviews) {
  const total = reviews.reduce((sum, r) => sum + Number(r.rating), 0);
  const avg = (total / reviews.length).toFixed(1);

  
  document.getElementById("average-rating").textContent = "التقييم :" + avg;

  
  document.getElementById("average-stars").textContent = "";

  
  document.getElementById("reviews-count").textContent = "";
}

function generateStars(value) {
  let stars = "";
  const full = Math.floor(value);
  for (let i = 1; i <= 5; i++) {
    stars += i <= full ? "★" : "☆";
  }
  return stars;
}

function renderReviews(reviews) {
  const container = document.getElementById("reviews-list");
  container.innerHTML = "";

  reviews.forEach((review) => {
    const div = document.createElement("div");
    div.className = "review-item";

    div.innerHTML = `
      <div class="review-stars">
        ${generateStars(review.rating)}
      </div>
      <div class="review-comment">
        ${review.comment}
      </div>
    `;

    container.appendChild(div);
  });
}