const paymentOptions = document.querySelectorAll('input[name="payment"]');
const submitButton = document.getElementById("submitOrder");
const qrModal = document.getElementById("qrModal");
const qrImage = document.getElementById("qrImage");
const closeModal = document.getElementById("closeModal");
const doneButton = document.getElementById("donePayment");
let qrImages = {};
async function loadQRImages() {
    try {
        const res = await fetch("https://api.tasswek.com/api/qr-images");
        const data = await res.json();

        qrImages = data;

        console.log("QR Loaded:", qrImages);

    } catch (error) {
        console.error("فشل تحميل صور QR", error);
    }
}
paymentOptions.forEach(option => {
    option.addEventListener("change", function () {
        if (this.value === "cash") {
            submitButton.classList.remove("hidden");
            qrModal.style.display = "none";
        } else {
            submitButton.classList.add("hidden");
            qrModal.style.display = "flex";

            if (this.value === "shamcash") {
                qrImage.src = qrImages.shamcash_qr; 
            }

            if (this.value === "usdt") {
                qrImage.src = qrImages.usdt_qr; 
            }
        }
    });
});

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
                is_paid: true   // هنا نجعلها 1
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

/////create 
const API_URL = "https://api.tasswek.com/api";
const token = localStorage.getItem("token");

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
};

submitButton.addEventListener("click", createOrder);

async function createOrder() {

    const address = localStorage.getItem("checkout_address");
    const selectedPayment = document.querySelector('input[name="payment"]:checked');

    if (!selectedPayment) {
        alert("يرجى اختيار طريقة الدفع");
        return;
    }

    // فقط في حال الدفع كاش
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
loadQRImages();