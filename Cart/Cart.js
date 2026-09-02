const API_URL = "https://api.tasswek.com/api";
const token = localStorage.getItem("token");

if (!token) {
    showToast("يرجى تسجيل الدخول أولاً","warning");
    window.location.href = "/Auth/log_in.html";
}

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};

let CURRENT_CART_ID = null;

// ===== Exchange Rate (SYP -> USD) =====
// Assumes GET /api/exchange-rate returns { rate: <SYP per 1 USD> }
// Adjust the endpoint/response shape to match your backend if different.
let EXCHANGE_RATE = null;
let CURRENT_TOTAL_SYP = 0;

async function fetchExchangeRate() {
    try {
        const res = await fetch(`${API_URL}/exchange-rate`);
        if (!res.ok) throw new Error("bad response");
        const json = await res.json();
        const rate = Number(json.rate);
        EXCHANGE_RATE = rate > 0 ? rate : null;
    } catch (error) {
        console.error("فشل جلب سعر الصرف", error);
        EXCHANGE_RATE = null;
    }
    return EXCHANGE_RATE;
}

function sypToUsd(sypAmount) {
    if (!EXCHANGE_RATE) return null;
    return sypAmount / EXCHANGE_RATE;
}

// يعرض السعر المقابل بالدولار لعنصر واحد في السلة (يوحّد شكل العرض مع صفحة المنتج والصفحة الرئيسية)
function usdItemLabel(sypAmount) {
    const usd = sypToUsd(Number(sypAmount) || 0);
    return usd !== null ? `<span class="usd-price">(~$${usd.toFixed(2)})</span>` : "";
}

  
  
  
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

async function getUserCart() {
    try {
        const res = await fetch(`${API_URL}/cart`, {
            method: "GET",
            headers
        });

        if (!res.ok) throw new Error("فشل جلب السلة");

        const cart = await res.json();

        
        CURRENT_CART_ID = cart.id;

        
        renderCartItems(cart.cart_item || []);

        
        updateTotal(cart.total_price || 0);

    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء تحميل السلة",'error');
    }
}

function renderCartItems(items) {
    const grid = document.querySelector(".products-grid");
    grid.innerHTML = "";

    if (!items || items.length === 0) {
        grid.innerHTML = `<div class="empty-cart">السلة فارغة، ابدأ التسوق الآن</div>`;
        document.getElementById("buyAllBtn").style.display = "none";
        document.getElementById("cartTotal").innerText = "0 SYP";
        return;
    }

    document.getElementById("buyAllBtn").style.display = "inline-flex";

    items.forEach(item => {
        // التحقق من وجود الصورة أو استخدام صورة افتراضية في حال عدم وجودها
        const imageUrl = item.product?.image_url || item.product?.image || '/images/looogo.png';

        grid.innerHTML += `
        <div class="product-card">
            <div class="product-image-thumb">
                <img src="${imageUrl}" alt="${item.product?.name ?? "منتج"}" onerror="this.src='/images/looogo.png'">
            </div>
            <div class="product-details">
                <div class="info-top">
                    <h3 class="product-name">${item.product?.name ?? "منتج بدون اسم"}</h3>
                    <p class="product-price">السعر: <span>${item.unit_price} SYP</span> ${usdItemLabel(item.unit_price)}</p>
                </div>

                <div class="actions-bottom">
                    <div class="quantity-control">
                        <button class="btn-qty" onclick="${item.quantity - 1 < 1 ? `removeItem(${item.id})` : `updateQuantity(${item.id}, ${item.quantity - 1})`}">-</button>
                        <input type="number" readonly value="${item.quantity}">
                        <button class="btn-qty" onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>

                    <button class="btn-remove" onclick="removeItem(${item.id})">
                        <i class="fas fa-trash-alt"></i> حذف
                    </button>
                </div>
            </div>
        </div>
        `;
    });
}
// The routes are: /carts/{cart}/items/{item} (not /carts/{cartId}/items/{itemId})
async function updateQuantity(itemId, quantity) {
    if (!CURRENT_CART_ID || quantity < 1) return;
    try {
        const res = await fetch(`${API_URL}/carts/${CURRENT_CART_ID}/items/${itemId}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ quantity: Number(quantity) })
        });
        if (!res.ok) throw new Error();
        getUserCart();
    } catch (error) {
        showToast("فشل تحديث الكمية", "error");
    }
}



async function removeItem(itemId) {
    if (!CURRENT_CART_ID) return;

    if (!confirm("هل تريد حذف المنتج من السلة؟")) return;

    try {
        const res = await fetch(
            `${API_URL}/carts/${CURRENT_CART_ID}/items/${itemId}`,
            {
                method: "DELETE",
                headers
            }
        );

        if (!res.ok) throw new Error();

        
        getUserCart();

    } catch (error) {
        console.error(error);
        showToast("فشل حذف المنتج","error");
    }
}


function updateTotal(total) {
    CURRENT_TOTAL_SYP = Number(total) || 0;

    const usd = sypToUsd(CURRENT_TOTAL_SYP);
    const usdLabel = usd !== null ? ` (~$${usd.toFixed(2)})` : "";

    document.getElementById("cartTotal").innerText = `${total} SYP${usdLabel}`;
}


function checkoutAll() {
    const modal = document.getElementById("checkoutModal");
    if (modal) {
        modal.classList.add("active");
        
        document.getElementById("orderAddress").value = "";
    }
}

function closeCheckoutModal() {
    const modal = document.getElementById("checkoutModal");
    if (modal) {
        modal.classList.remove("active");
    }
}


window.onclick = function(event) {
    const modal = document.getElementById("checkoutModal");
    if (event.target === modal) {
        closeCheckoutModal();
    }
}

// In Cart.js submitOrder function - store more data for payment page
async function submitOrder(event) {
    event.preventDefault();

    const address = document.getElementById("orderAddress").value;

    if (!address.trim()) {
        showToast("يرجى إدخال العنوان","warning");
        return;
    }

    // نحسب الإجمالي الحالي من السلة
    const totalSyp = CURRENT_TOTAL_SYP;
    const exchangeRate = EXCHANGE_RATE;
    const usdTotal = exchangeRate ? totalSyp / exchangeRate : null;

    // نخزن كل البيانات المطلوبة لصفحة الدفع
    localStorage.setItem("checkout_address", address);
    localStorage.setItem("checkout_total_syp", totalSyp.toFixed(2));
    localStorage.setItem("checkout_exchange_rate", exchangeRate?.toFixed(4) || "");
    localStorage.setItem("checkout_total_usd", usdTotal ? usdTotal.toFixed(2) : "");
    localStorage.setItem("checkout_currency", "SYP"); // سيتم تغييره في صفحة الدفع

    closeCheckoutModal();
    window.location.href = "/payments/pay.html";
}


document.addEventListener("DOMContentLoaded", async () => {
    await fetchExchangeRate();
    getUserCart();
});