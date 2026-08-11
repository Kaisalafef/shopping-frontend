const OTP_API_BASE = "https://api.tasswek.com/api";

const phoneDisplay = document.getElementById("phoneDisplay");
const otpForm = document.getElementById("otpForm");
const otpError = document.getElementById("otpError");
const resendLink = document.getElementById("resendLink");
const resendTimer = document.getElementById("resendTimer");
const otpInputs = Array.from(document.querySelectorAll(".otp-digit"));

const pendingPhone = localStorage.getItem("pending_phone");

if (!pendingPhone) {
  
  window.location.replace("/Auth/Sign_up.html");
} else {
  phoneDisplay.textContent = pendingPhone;
}

function showOtpError(message) {
  if (otpError) {
    otpError.textContent = message;
    otpError.style.display = "block";
  } else {
    alert(message);
  }
}

function clearOtpError() {
  if (otpError) {
    otpError.textContent = "";
    otpError.style.display = "none";
  }
}

/* ===== Auto-focus, backspace & paste handling for the 6 digit boxes ===== */
otpInputs.forEach((input, index) => {
  input.addEventListener("input", (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    e.target.value = value;

    if (value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });

  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, otpInputs.length);

    pasted.split("").forEach((digit, i) => {
      if (otpInputs[i]) otpInputs[i].value = digit;
    });

    const nextIndex = Math.min(pasted.length, otpInputs.length - 1);
    otpInputs[nextIndex].focus();
  });
});

function getOtpCode() {
  return otpInputs.map((input) => input.value).join("");
}

/* ===== Submit verification ===== */
otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearOtpError();

  const otpCode = getOtpCode();

  if (otpCode.length !== 6) {
    showOtpError("الرجاء إدخال رمز التحقق المكون من 6 أرقام كاملاً");
    return;
  }

  try {
    const res = await fetch(`${OTP_API_BASE}/verify-otp`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: pendingPhone, otp_code: otpCode }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      localStorage.clear();

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "auth_role",
        data.role || (data.user && data.user.role) || "user"
      );
      localStorage.setItem("auth_user", JSON.stringify(data.user));

      window.location.replace("/Home/client_dashboard.html");
    } else {
      showOtpError(data.message || "رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى");
    }
  } catch (err) {
    console.error(err);
    showOtpError("عذراً، لا يمكن الاتصال بالسيرفر حالياً");
  }
});

/* ===== Resend with 60s cooldown ===== */
let cooldownSeconds = 0;
let cooldownIntervalId = null;

function startCooldown(seconds = 60) {
  cooldownSeconds = seconds;
  resendLink.classList.add("disabled");
  updateResendTimerText();

  if (cooldownIntervalId) clearInterval(cooldownIntervalId);

  cooldownIntervalId = setInterval(() => {
    cooldownSeconds -= 1;
    updateResendTimerText();

    if (cooldownSeconds <= 0) {
      clearInterval(cooldownIntervalId);
      resendLink.classList.remove("disabled");
      resendTimer.textContent = "";
    }
  }, 1000);
}

function updateResendTimerText() {
  resendTimer.textContent = cooldownSeconds > 0 ? ` (${cooldownSeconds}s)` : "";
}

resendLink.addEventListener("click", async (e) => {
  e.preventDefault();
  if (resendLink.classList.contains("disabled")) return;

  clearOtpError();

  try {
    const res = await fetch(`${OTP_API_BASE}/resend-otp`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone: pendingPhone }),
    });

    const data = await res.json();

    if (res.ok) {
      startCooldown(60);
    } else {
      showOtpError(data.message || "تعذر إعادة إرسال الرمز، يرجى المحاولة لاحقاً");
    }
  } catch (err) {
    console.error(err);
    showOtpError("عذراً، لا يمكن الاتصال بالسيرفر حالياً");
  }
});

/* يبدأ العد التنازلي مباشرة عند فتح الصفحة (رسالة OTP الأولى وصلت مسبقاً من صفحة التسجيل) */
startCooldown(60);
otpInputs[0]?.focus();