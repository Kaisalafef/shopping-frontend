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

// Modals
const manualModal = document.getElementById("manualPaymentModal");
const closeManualModal = document.getElementById("closeManualModal");
const cashModal = document.getElementById("cashModal");
const closeCashModal = document.getElementById("closeCashModal");

// Manual Payment Modal Elements
const paymentInfoStep = document.getElementById("paymentInfoStep");
const proofFormStep = document.getElementById("proofFormStep");
const waitingApprovalStep = document.getElementById("waitingApprovalStep");

const paymentMethodTitle = document.getElementById("paymentMethodTitle");
const displayAmount = document.getElementById("displayAmount");
const paymentInstructions = document.getElementById("paymentInstructions");
const walletLabel = document.getElementById("walletLabel");
const walletAddress = document.getElementById("walletAddress");
const networkInfo = document.getElementById("networkInfo");
const networkValue = document.getElementById("networkValue");
const paymentQr = document.getElementById("paymentQr");
const proceedToProofBtn = document.getElementById("proceedToProof");

const proofForm = document.getElementById("proofForm");
const submitProofBtn = document.getElementById("submitProofBtn");
const senderNameInput = document.getElementById("senderName");
const transactionIdInput = document.getElementById("transactionId");

const goToOrdersBtn = document.getElementById("goToOrders");

// Cash Modal
const cashAmount = document.getElementById("cashAmount");
const confirmCashOrderBtn = document.getElementById("confirmCashOrder");

let paymentSettings = { shamcash: {}, usdt: {} };
let currentPaymentMethod = null;
let currentOrderId = null;
let currentAmount = 0;
let currentCurrency = 'SYP';

function getSelectedCurrency() {
    const selected = document.querySelector('input[name="currency"]:checked');
    return selected ? selected.value : "SYP";
}
/////////////////////////////////////////////
// تحميل إعدادات الدفع
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
        submitButton.classList.add("hidden");
        manualModal.style.display = "none";
        cashModal.style.display = "none";

        // fallback بصري لدعم المتصفحات التي لا تدعم :has() في CSS
        document.querySelectorAll('.payment-options .option').forEach(lbl => lbl.classList.remove('selected'));
        this.closest('.option')?.classList.add('selected');

        if (this.value === "cash") {
            submitButton.classList.remove("hidden");
        } else if (this.value === "shamcash" || this.value === "usdt") {
            openManualPaymentModal(this.value);
        }
    });
});

currencyOptions.forEach(option => {
    option.addEventListener("change", function () {
        // fallback بصري لدعم المتصفحات التي لا تدعم :has() في CSS
        document.querySelectorAll('.currency-options .currency-option').forEach(lbl => lbl.classList.remove('selected'));
        this.closest('.currency-option')?.classList.add('selected');

        // تحديث المبلغ المعروض إذا كان المودال مفتوح
        if (currentOrderId) {
            updateDisplayedAmount();
        }
    });
});

/////////////////////////////////////////////
// فتح مودال الدفع اليدوي
/////////////////////////////////////////////
async function openManualPaymentModal(method) {
    currentPaymentMethod = method;
    const currency = getSelectedCurrency();
    const address = localStorage.getItem("checkout_address");
    const totalSyp = parseFloat(localStorage.getItem("checkout_total_syp")) || 0;
    const exchangeRate = parseFloat(localStorage.getItem("checkout_exchange_rate")) || 1;

    // حساب المبلغ بالعملة المختارة
    currentAmount = currency === 'USD' 
        ? round(totalSyp / Math.max(exchangeRate, 0.0001), 2)
        : round(totalSyp, 2);
    currentCurrency = currency;

    // Reset modal steps
    paymentInfoStep.classList.remove("hidden");
    proofFormStep.classList.add("hidden");
    waitingApprovalStep.classList.add("hidden");
    proofForm.reset();

    // إعداد معلومات الدفع
    const info = paymentSettings[method] || {};
    const methodName = method === 'shamcash' ? 'شام كاش' : 'USDT';
    const currencyLabel = currency === 'USD' ? 'دولار' : 'ل.س';

    paymentMethodTitle.textContent = `الدفع عبر ${methodName}`;
    displayAmount.textContent = `${currentAmount} ${currencyLabel}`;
    paymentInstructions.textContent = info.instructions || 'يرجى تحويل المبلغ إلى المحفظة أدناه';
    walletLabel.textContent = info.wallet_label || (method === 'shamcash' ? 'رقم المحفظة/الهاتف' : 'عنوان المحفظة');
    walletAddress.textContent = info.wallet_address || 'غير متوفر حالياً';

    if (method === 'usdt') {
        networkInfo.classList.remove("hidden");
        networkValue.textContent = info.network || 'TRC20';
    } else {
        networkInfo.classList.add("hidden");
    }

    if (info.qr_url) {
        paymentQr.src = info.qr_url;
        paymentQr.classList.remove("hidden");
    } else {
        paymentQr.classList.add("hidden");
    }

    manualModal.style.display = "flex";
}

/////////////////////////////////////////////
// نسخ عنوان المحفظة
/////////////////////////////////////////////
function copyWalletAddress() {
    const text = walletAddress.textContent;
    if (text && text !== 'غير متوفر حالياً') {
        navigator.clipboard.writeText(text).then(() => {
            showToast("تم نسخ عنوان المحفظة", "success");
        });
    }
}

/////////////////////////////////////////////
// الانتقال لنموذج الإثبات
/////////////////////////////////////////////
proceedToProofBtn.addEventListener("click", async function () {
    // إنشاء الطلب أولاً
    await createManualOrder();
});

/////////////////////////////////////////////
// إنشاء الطلب اليدوي
/////////////////////////////////////////////
async function createManualOrder() {
    const address = localStorage.getItem("checkout_address");
    const currency = getSelectedCurrency();

    proceedToProofBtn.disabled = true;
    proceedToProofBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إنشاء الطلب...';

    try {
        const res = await fetch(`${API_URL}/orders/manual`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                shipping_address: address,
                currency: currency,
                payment_method: currentPaymentMethod
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "فشل إنشاء الطلب");
        }

        currentOrderId = data.order_id;

        // FIXED: نحفظ الطلب المُنشأ في localStorage. إذا حدّث العميل الصفحة أو أغلقها
        // قبل إرسال اسم المرسل ورقم العملية، لن يضيع الطلب - سيتم استئناف نموذج
        // الإثبات تلقائياً عند فتح صفحة الدفع من جديد (انظر resumePendingManualOrder).
        localStorage.setItem('pending_manual_order', JSON.stringify({
            orderId: data.order_id,
            method: currentPaymentMethod,
            amount: data.amount,
            currency: data.currency
        }));

        // تحديث المبلغ المعروض بالعملة الصحيحة
        displayAmount.textContent = `${data.amount} ${data.currency === 'USD' ? 'دولار' : 'ل.س'}`;
        
        // إخفاء خطوة المعلومات وإظهار نموذج الإثبات
        paymentInfoStep.classList.add("hidden");
        proofFormStep.classList.remove("hidden");

    } catch (error) {
        console.error(error);
        alert(error.message || "حدث خطأ أثناء إنشاء الطلب");
        proceedToProofBtn.disabled = false;
        proceedToProofBtn.textContent = "لقد أتممت الدفع";
    }
}

/////////////////////////////////////////////
// إرسال نموذج الإثبات
/////////////////////////////////////////////
proofForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!currentOrderId) {
        alert("حدث خطأ، يرجى إعادة المحاولة");
        return;
    }

    const senderName = senderNameInput.value.trim();
    const transactionId = transactionIdInput.value.trim();
    const proofImage = document.getElementById("proofImage").files[0];

    if (!senderName || !transactionId) {
        showToast("يرجى ملء جميع الحقول المطلوبة", "warning");
        return;
    }

    // إظهار حالة التحميل
    submitProofBtn.disabled = true;
    document.querySelector(".btn-text").classList.add("hidden");
    document.querySelector(".btn-loader").classList.remove("hidden");

    try {
        const formData = new FormData();
        formData.append("sender_name", senderName);
        formData.append("transaction_id", transactionId);
        if (proofImage) {
            formData.append("proof_image", proofImage);
        }

        const res = await fetch(`${API_URL}/orders/${currentOrderId}/payment-proof`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "فشل إرسال إثبات الدفع");
        }

        // نجاح - إظهار خطوة الانتظار
        proofFormStep.classList.add("hidden");
        waitingApprovalStep.classList.remove("hidden");
        startStatusPolling(currentOrderId);

        // FIXED: تم إرسال بيانات الدفع بنجاح، لم يعد الطلب بحاجة لاستئناف لاحقاً
        localStorage.removeItem('pending_manual_order');

        // تنظيف البيانات المؤقتة
        localStorage.removeItem("checkout_address");
        localStorage.removeItem("checkout_total_syp");
        localStorage.removeItem("checkout_exchange_rate");
        localStorage.removeItem("checkout_total_usd");

    } catch (error) {
        console.error(error);
        alert(error.message || "حدث خطأ أثناء إرسال الإثبات");
    } finally {
        submitProofBtn.disabled = false;
        document.querySelector(".btn-text").classList.remove("hidden");
        document.querySelector(".btn-loader").classList.add("hidden");
    }
});
function startStatusPolling(orderId) {
    const pollInterval = setInterval(async () => {
        try {
            const res = await fetch(`${API_URL}/orders/${orderId}/status`, { headers });
            if (!res.ok) return;
            const data = await res.json();
            
            if (data.status === 'processing') {
                clearInterval(pollInterval);
                waitingApprovalStep.innerHTML = `
                    <div class="success-icon"><i class="fa-solid fa-check-circle" style="color:#27ae60;"></i></div>
                    <h2>تم قبول طلبك! ✅</h2>
                    <p>تم تأكيد الدفع وتحويل طلبك إلى "قيد المعالجة"</p>
                    <button id="goToOrdersSuccess" class="primary-btn">الذهاب لطلباتي</button>
                `;
                document.getElementById('goToOrdersSuccess').onclick = () => {
                    window.location.href = "/Profile/MyOrders.html";
                };
            } else if (data.status === 'cancelled') {
                clearInterval(pollInterval);
                waitingApprovalStep.innerHTML = `
                    <div class="success-icon"><i class="fa-solid fa-xmark-circle" style="color:#e74c3c;"></i></div>
                    <h2>تم رفض الدفع ❌</h2>
                    <p>السبب: ${data.payment_proof?.rejection_reason || 'غير محدد'}</p>
                    <button class="secondary-btn" onclick="window.location.href='/Cart/Cart.html'">إعادة المحاولة</button>
                `;
            }
        } catch (e) { console.error(e); }
    }, 10000); // Poll every 10 seconds
}
/////////////////////////////////////////////
// الذهاب للطلبات
/////////////////////////////////////////////
goToOrdersBtn.addEventListener("click", function () {
    manualModal.style.display = "none";
    window.location.href = "/Profile/MyOrders.html"; // طلباتي أصبحت صفحة مستقلة عن البروفايل
});

/////////////////////////////////////////////
// إغلاق المودال اليدوي
/////////////////////////////////////////////
closeManualModal.addEventListener("click", function () {
    manualModal.style.display = "none";
    resetManualModal();
});

function resetManualModal() {
    currentPaymentMethod = null;
    currentOrderId = null;
    currentAmount = 0;
    paymentInfoStep.classList.remove("hidden");
    proofFormStep.classList.add("hidden");
    waitingApprovalStep.classList.add("hidden");
    proofForm.reset();
}

/////////////////////////////////////////////
// كاش مودال
/////////////////////////////////////////////
submitButton.addEventListener("click", function () {
    const totalSyp = parseFloat(localStorage.getItem("checkout_total_syp")) || 0;
    const exchangeRate = parseFloat(localStorage.getItem("checkout_exchange_rate")) || 1;
    const currency = getSelectedCurrency();
    
    const amount = currency === 'USD' 
        ? round(totalSyp / Math.max(exchangeRate, 0.0001), 2)
        : round(totalSyp, 2);
    const label = currency === 'USD' ? 'دولار' : 'ل.س';
    
    cashAmount.textContent = `${amount} ${label}`;
    cashModal.style.display = "flex";
});

closeCashModal.addEventListener("click", function () {
    cashModal.style.display = "none";
});

confirmCashOrderBtn.addEventListener("click", async function () {
    const address = localStorage.getItem("checkout_address");
    const currency = getSelectedCurrency();

    confirmCashOrderBtn.disabled = true;
    confirmCashOrderBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري إنشاء الطلب...';

    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                shipping_address: address,
                currency: currency,
                is_paid: false
            })
        });

        if (!res.ok) throw new Error("فشل إنشاء الطلب");

        alert("تم إنشاء الطلب بنجاح");
        localStorage.removeItem("checkout_address");
        localStorage.removeItem("checkout_total_syp");
        localStorage.removeItem("checkout_exchange_rate");
        localStorage.removeItem("checkout_total_usd");
        window.location.href = "/Home/client_dashboard.html";

    } catch (error) {
        console.error(error);
        alert("حدث خطأ أثناء إنشاء الطلب");
    } finally {
        confirmCashOrderBtn.disabled = false;
        confirmCashOrderBtn.textContent = "تأكيد الطلب كاش";
        cashModal.style.display = "none";
    }
});

/////////////////////////////////////////////
// دوال مساعدة
/////////////////////////////////////////////
function round(value, decimals) {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

function showToast(msg, type = "success") {
    let toastBox = document.getElementById("toast-box");
    if (!toastBox) return;
    
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

/////////////////////////////////////////////
// FIXED: استئناف طلب معلّق لم يُكمل إرسال بيانات الدفع
// (يعالج حالة تحديث/إغلاق الصفحة بعد إنشاء الطلب وقبل إرسال اسم المرسل ورقم العملية)
/////////////////////////////////////////////
async function resumePendingManualOrder() {
    const raw = localStorage.getItem('pending_manual_order');
    if (!raw) return;

    let pending;
    try { pending = JSON.parse(raw); } catch { localStorage.removeItem('pending_manual_order'); return; }
    if (!pending?.orderId) { localStorage.removeItem('pending_manual_order'); return; }

    try {
        const res = await fetch(`${API_URL}/orders/${pending.orderId}/status`, { headers });
        if (!res.ok) { localStorage.removeItem('pending_manual_order'); return; }
        const data = await res.json();

        // إذا لم يعد الطلب بحاجة لإثبات دفع (تم إرساله، أو تمت الموافقة/الرفض)، لا داعي للاستئناف
        if (!data.needs_proof) {
            localStorage.removeItem('pending_manual_order');
            return;
        }

        // استئناف نموذج إثبات الدفع مباشرة لنفس الطلب المعلّق
        currentOrderId = pending.orderId;
        currentPaymentMethod = pending.method;
        currentCurrency = pending.currency;
        currentAmount = pending.amount;

        const radioToCheck = document.querySelector(`input[name="payment"][value="${pending.method}"]`);
        if (radioToCheck) radioToCheck.checked = true;
        const currencyRadio = document.querySelector(`input[name="currency"][value="${pending.currency}"]`);
        if (currencyRadio) {
            currencyRadio.checked = true;
            document.querySelectorAll('.currency-options .currency-option').forEach(lbl => lbl.classList.remove('selected'));
            currencyRadio.closest('.currency-option')?.classList.add('selected');
        }
        document.querySelectorAll('.payment-options .option').forEach(lbl => lbl.classList.remove('selected'));
        radioToCheck?.closest('.option')?.classList.add('selected');

        displayAmount.textContent = `${pending.amount} ${pending.currency === 'USD' ? 'دولار' : 'ل.س'}`;
        paymentInfoStep.classList.add("hidden");
        proofFormStep.classList.remove("hidden");
        waitingApprovalStep.classList.add("hidden");
        manualModal.style.display = "flex";

        showToast("لديك طلب سابق بانتظار بيانات الدفع، يرجى إكماله", "warning");
    } catch (e) {
        console.error(e);
    }
}

/////////////////////////////////////////////
// تحميل أولي
/////////////////////////////////////////////
loadPaymentSettings();
resumePendingManualOrder();

// تعيين الحالة البصرية الابتدائية للعملة المختارة افتراضياً (fallback لدعم المتصفحات القديمة)
document.querySelector('input[name="currency"]:checked')?.closest('.currency-option')?.classList.add('selected');