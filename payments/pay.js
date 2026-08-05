/////////////////////////////////////////////
// إعدادات عامة
/////////////////////////////////////////////
const API_URL = "https://api.tasswek.com/api";
const token = localStorage.getItem("token");

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};

const paymentOptions = document.querySelectorAll('input[name="payment"]');
const currencyOptions = document.querySelectorAll('input[name="currency"]');
const submitButton = document.getElementById("submitOrder");

// USDT modal (كما هو - لم يتغير)
const qrModal = document.getElementById("qrModal");
const qrImage = document.getElementById("qrImage");
const closeModal = document.getElementById("closeModal");
const doneButton = document.getElementById("donePayment");

// ShamCash modal (جديد)
const shamcashModal = document.getElementById("shamcashModal");
const closeShamcashModal = document.getElementById("closeShamcashModal");
const shamcashAmountEl = document.getElementById("shamcashAmount");
const shamcashWalletDisplay = document.getElementById("shamcashWalletDisplay");
const shamcashQr = document.getElementById("shamcashQr");
const proceedShamcashBtn = document.getElementById("proceedShamcash");
const shamcashWaiting = document.getElementById("shamcashWaiting");

let qrImages = {};
let paymentSettings = { shamcash: { qr_url: null, wallet_address: null } };
let shamcashPollTimer = null;

function getSelectedCurrency() {
    const selected = document.querySelector('input[name="currency"]:checked');
    return selected ? selected.value : "SYP";
}

/////////////////////////////////////////////
// تحميل صور USDT/شام كاش القديمة (تبقى كما هي لـ USDT)
/////////////////////////////////////////////
async function loadQRImages() {
    try {
        const res = await fetch(`${API_URL}/qr-images`);
        const data = await res.json();
        qrImages = data;
    } catch (error) {
        console.error("فشل تحميل صور QR", error);
    }
}

/////////////////////////////////////////////
// تحميل إعدادات الدفع العامة (عنوان محفظة شام كاش + QR)
/////////////////////////////////////////////
async function loadPaymentSettings() {
    try {
        const res = await fetch(`${API_URL}/payment-settings`);
        const data = await res.json();
        paymentSettings = data;
    } catch (error) {
        console.error("فشل تحميل إعدادات الدفع", error);
    }
}

/////////////////////////////////////////////
// التبديل بين طرق الدفع
/////////////////////////////////////////////
paymentOptions.forEach(option => {
    option.addEventListener("change", function () {
        // إخفاء كل شيء قبل ما نظهر الحالة المناسبة
        submitButton.classList.add("hidden");
        qrModal.style.display = "none";
        shamcashModal.style.display = "none";

        if (this.value === "cash") {
            submitButton.classList.remove("hidden");
        }

        if (this.value === "usdt") {
            qrModal.style.display = "flex";
            qrImage.src = qrImages.usdt_qr || "";
        }

        if (this.value === "shamcash") {
            openShamcashDialog();
        }
    });
});

/////////////////////////////////////////////
// USDT modal (سلوك قديم بدون تغيير)
/////////////////////////////////////////////
closeModal.addEventListener("click", function () {
    qrModal.style.display = "none";
});

doneButton.addEventListener("click", async function () {
    const address = localStorage.getItem("checkout_address");

    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                shipping_address: address,
                currency: getSelectedCurrency(),
                is_paid: true
            })
        });

        if (!res.ok) throw new Error("فشل إنشاء الطلب");

        alert("تم الدفع وإنشاء الطلب بنجاح");

        localStorage.removeItem("checkout_address");
        window.location.href = "/Home/client_dashboard.html";

    } catch (error) {
        console.error(error);
        alert("حدث خطأ أثناء تأكيد الدفع");
    }
});

/////////////////////////////////////////////
// الدفع كاش (سلوك قديم مع إضافة العملة)
/////////////////////////////////////////////
submitButton.addEventListener("click", createCashOrder);

async function createCashOrder() {
    const address = localStorage.getItem("checkout_address");
    const selectedPayment = document.querySelector('input[name="payment"]:checked');

    if (!selectedPayment) {
        alert("يرجى اختيار طريقة الدفع");
        return;
    }

    if (selectedPayment.value !== "cash") {
        alert("يرجى إتمام الدفع الإلكتروني أولاً");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                shipping_address: address,
                currency: getSelectedCurrency(),
                is_paid: false
            })
        });

        if (!res.ok) throw new Error("فشل إنشاء الطلب");

        alert("تم إنشاء الطلب بنجاح");

        localStorage.removeItem("checkout_address");
        window.location.href = "/Home/client_dashboard.html";

    } catch (error) {
        console.error(error);
        alert("حدث خطأ");
    }
}

/////////////////////////////////////////////
// تدفّق الدفع الجديد عبر شام كاش
/////////////////////////////////////////////

// 1) فتح دايلوج التأكيد قبل الذهاب للتطبيق
function openShamcashDialog() {
    const currency = getSelectedCurrency();
    const currencyLabel = currency === "USD" ? "دولار" : "ليرة سورية";

    shamcashAmountEl.textContent = `سيتم احتساب المبلغ عند المتابعة (${currencyLabel})`;
    shamcashWalletDisplay.textContent = paymentSettings.shamcash?.wallet_address || "غير متوفر حالياً";

    if (paymentSettings.shamcash?.qr_url) {
        shamcashQr.src = paymentSettings.shamcash.qr_url;
        shamcashQr.classList.remove("hidden");
    } else {
        shamcashQr.classList.add("hidden");
    }

    shamcashWaiting.classList.add("hidden");
    proceedShamcashBtn.classList.remove("hidden");
    shamcashModal.style.display = "flex";
}

closeShamcashModal.addEventListener("click", function () {
    shamcashModal.style.display = "none";
    stopShamcashPolling();
    // إعادة تحديد "اختر طريقة الدفع" بشكل فارغ منطقياً - نترك الاختيار كما هو
    // بدون فرض إعادة تحميل الصفحة حتى لا نزعج المستخدم.
});

// 2) عند الضغط على "متابعة": ننشئ الطلب + الفاتورة، ثم نحاول فتح التطبيق
proceedShamcashBtn.addEventListener("click", async function () {
    const address = localStorage.getItem("checkout_address");
    const currency = getSelectedCurrency();

    proceedShamcashBtn.disabled = true;
    proceedShamcashBtn.textContent = "جارِ التحضير...";

    try {
        const res = await fetch(`${API_URL}/payments/shamcash/create`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                shipping_address: address,
                currency: currency
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "فشل إنشاء فاتورة الدفع");
        }

        shamcashAmountEl.textContent = `${data.amount} ${data.currency === "USD" ? "USD" : "ل.س"}`;
        if (data.wallet_address) {
            shamcashWalletDisplay.textContent = data.wallet_address;
        }

        // داخل حدث الضغط على proceedShamcashBtn في pay.js
if (data.deep_link) {
    tryToOpenApp(data.deep_link);
}

function tryToOpenApp(url) {
    // التنقل المباشر - يعمل فعلياً لفتح custom scheme على الموبايل
    window.location.href = url;
}

        // إظهار حالة الانتظار وبدء الاستعلام عن حالة الطلب
        proceedShamcashBtn.classList.add("hidden");
        shamcashWaiting.classList.remove("hidden");

        startShamcashPolling(data.order_id);

    } catch (error) {
        console.error(error);
        alert(error.message || "حدث خطأ أثناء تجهيز الدفع عبر شام كاش");
        proceedShamcashBtn.disabled = false;
        proceedShamcashBtn.textContent = "متابعة إلى شام كاش";
    }
});

// 3) استعلام دوري عن حالة الطلب لحين تأكيد الدفع عبر الـ webhook
function startShamcashPolling(orderId) {
    stopShamcashPolling();

    const startedAt = Date.now();
    const timeoutMs = 5 * 60 * 1000; // 5 دقائق كحد أقصى

    shamcashPollTimer = setInterval(async () => {
        if (Date.now() - startedAt > timeoutMs) {
            stopShamcashPolling();
            shamcashWaiting.innerHTML = `
                <p>لم يتم تأكيد الدفع بعد. إذا أتممت الدفع فعلياً، سيتم قبول
                طلبك تلقائياً خلال دقائق، ويمكنك متابعته من صفحة طلباتي.</p>
            `;
            return;
        }

        try {
            const res = await fetch(`${API_URL}/payments/${orderId}/status`, { headers });
            if (!res.ok) return;

            const data = await res.json();

            if (data.is_paid) {
                stopShamcashPolling();
                shamcashWaiting.innerHTML = `<p>✔ تم تأكيد الدفع وقبول طلبك بنجاح</p>`;
                localStorage.removeItem("checkout_address");

                setTimeout(() => {
                    window.location.href = "/Home/client_dashboard.html";
                }, 1500);
            }
        } catch (error) {
            console.error("خطأ أثناء التحقق من حالة الطلب", error);
        }
    }, 3000);
}

function stopShamcashPolling() {
    if (shamcashPollTimer) {
        clearInterval(shamcashPollTimer);
        shamcashPollTimer = null;
    }
}

/////////////////////////////////////////////
// تحميل أولي
/////////////////////////////////////////////
loadQRImages();
loadPaymentSettings();