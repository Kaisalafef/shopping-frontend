const CSRF_TOKEN = document
  .querySelector('meta[name="csrf-token"]')
  ?.getAttribute("content");

/* ============================================================
   Shared validation helpers
   ============================================================ */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:\+?963|0)?9\d{8}$/;
const NAME_REGEX = /^[\u0600-\u06FFa-zA-Z\s]{3,60}$/;

function isEmail(value) {
  return EMAIL_REGEX.test(value.trim());
}

function isPhone(value) {
  return PHONE_REGEX.test(value.trim().replace(/[\s-]/g, ""));
}

function showFieldError(input, message) {
  if (!input) return;
  const group = input.closest(".input-group");
  input.classList.add("invalid");
  if (group) {
    group.classList.remove("shake");
    
    void group.offsetWidth;
    group.classList.add("shake");
    const small = group.querySelector(".error-msg");
    if (small) {
      small.textContent = message;
      small.style.display = "block";
    }
  }
}

function clearFieldError(input) {
  if (!input) return;
  input.classList.remove("invalid");
  const group = input.closest(".input-group");
  if (!group) return;
  const small = group.querySelector(".error-msg");
  if (small) {
    small.textContent = "";
    small.style.display = "none";
  }
}

/* ============================================================
   LOGIN PAGE (index.html)
   ============================================================ */
const loginForm = document.getElementById("loginForm");
const generalError = document.getElementById("generalError");
const loginInput = document.getElementById("loginInput");
const loginIcon = document.getElementById("loginIcon");

function updateLoginIcon() {
  if (!loginInput || !loginIcon) return;
  const value = loginInput.value.trim();

  if (!value) {
    loginIcon.className = "fa-solid fa-user input-icon";
  } else if (/^[0-9+]/.test(value)) {
    loginIcon.className = "fa-solid fa-phone input-icon";
  } else {
    loginIcon.className = "fa-solid fa-envelope input-icon";
  }
}

if (loginInput) {
  loginInput.addEventListener("input", () => {
    updateLoginIcon();
    clearFieldError(loginInput);
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const identifier = loginInput.value.trim();
    const passwordInput = document.getElementById("password");
    const password = passwordInput.value;

    generalError.style.display = "none";
    generalError.textContent = "";

    let hasError = false;

    if (!identifier) {
      showFieldError(loginInput, "الرجاء إدخال البريد الإلكتروني أو رقم الهاتف");
      hasError = true;
    } else if (!isEmail(identifier) && !isPhone(identifier)) {
      showFieldError(loginInput, "يرجى إدخال بريد إلكتروني أو رقم هاتف صحيح");
      hasError = true;
    }

    if (!password) {
      showFieldError(passwordInput, "الرجاء إدخال كلمة المرور");
      hasError = true;
    } else if (password.length < 6) {
      showFieldError(passwordInput, "كلمة المرور يجب ألا تقل عن 6 أحرف");
      hasError = true;
    }

    if (hasError) return;

    const submitBtn = loginForm.querySelector(".btn-primary");
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "جاري تسجيل الدخول...";

    try {
      const res = await fetch("https://api.tasswek.com/api/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        // "login" can be an email or a phone number — the backend
        // now decides which and looks up the matching user
        body: JSON.stringify({ login: identifier, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.clear();

        localStorage.setItem("token", data.token);
        localStorage.setItem("auth_role", data.user.role);
        localStorage.setItem("auth_user", JSON.stringify(data.user));

        if (data.user.role === "admin") {
          window.location.replace("/Home/admin_dashboard.html");
        } else {
          window.location.replace("/Home/client_dashboard.html");
        }
      } else if (res.status === 403 && data.requires_verification) {
        localStorage.setItem("pending_phone", data.phone);
        window.location.href = "/Auth/Verify_otp.html";
      } else {
        const msg = data.message || "البيانات المدخلة غير صحيحة";
        showError(msg);
      }
    } catch (err) {
      console.error(err);
      showError(
        "عذراً، يوجد مشكلة في الاتصال بالسيرفر. تأكد من تشغيل الـ Backend."
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

/* ============================================================
   SIGNUP PAGE (Sign_up.html)
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  if (!signupForm) return;

  const signupError = document.getElementById("signupError");
  const fullnameInput = document.getElementById("fullname");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const passwordInput = document.getElementById("password");
  const passwordConfirmInput = document.getElementById("passwordcomf");
  const strengthMeter = document.getElementById("strengthMeter");
  const strengthBar = document.getElementById("strengthBar");
  const strengthText = document.getElementById("strengthText");

  /* ---------- field validators ---------- */
  function validateFullname() {
    const value = fullnameInput.value.trim();
    if (!value) {
      showFieldError(fullnameInput, "الاسم الكامل مطلوب");
      return false;
    }
    if (!NAME_REGEX.test(value) || value.split(/\s+/).length < 2) {
      showFieldError(fullnameInput, "يرجى إدخال الاسم الثلاثي بحروف صحيحة");
      return false;
    }
    clearFieldError(fullnameInput);
    return true;
  }

  function validateEmail() {
    const value = emailInput.value.trim();
    if (!value) {
      showFieldError(emailInput, "البريد الإلكتروني مطلوب");
      return false;
    }
    if (!isEmail(value)) {
      showFieldError(emailInput, "صيغة البريد الإلكتروني غير صحيحة");
      return false;
    }
    clearFieldError(emailInput);
    return true;
  }

  function validatePhone() {
    const value = phoneInput.value.trim();
    if (!value) {
      showFieldError(phoneInput, "رقم الموبايل مطلوب");
      return false;
    }
    if (!isPhone(value)) {
      showFieldError(phoneInput, "صيغة الرقم يجب أن تكون مثل 09XXXXXXXX");
      return false;
    }
    clearFieldError(phoneInput);
    return true;
  }

  function getPasswordScore(value) {
    let score = 0;
    if (value.length >= 6) score++;
    if (value.length >= 10) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
  }

  function updateStrengthMeter() {
    const value = passwordInput.value;
    if (!strengthMeter || !strengthBar) return;

    if (!value) {
      strengthMeter.style.display = "none";
      if (strengthText) strengthText.textContent = "";
      return;
    }

    strengthMeter.style.display = "block";
    const score = getPasswordScore(value);

    let width, color, label;
    if (score <= 1) {
      width = "25%"; color = "#e74c3c"; label = "ضعيفة";
    } else if (score === 2) {
      width = "50%"; color = "#ff9700"; label = "متوسطة";
    } else if (score === 3) {
      width = "75%"; color = "#f1c40f"; label = "جيدة";
    } else {
      width = "100%"; color = "#27ae60"; label = "قوية";
    }

    strengthBar.style.width = width;
    strengthBar.style.background = color;
    if (strengthText) {
      strengthText.textContent = label;
      strengthText.style.color = color;
    }
  }

  function validatePassword() {
    const value = passwordInput.value;
    if (!value) {
      showFieldError(passwordInput, "كلمة المرور مطلوبة");
      return false;
    }
    if (value.length < 6) {
      showFieldError(passwordInput, "كلمة المرور يجب ألا تقل عن 6 أحرف");
      return false;
    }
    clearFieldError(passwordInput);
    return true;
  }

  function validatePasswordConfirm() {
    const value = passwordConfirmInput.value;
    if (!value) {
      showFieldError(passwordConfirmInput, "يرجى تأكيد كلمة المرور");
      return false;
    }
    if (value !== passwordInput.value) {
      showFieldError(passwordConfirmInput, "كلمتا المرور غير متطابقتين");
      return false;
    }
    clearFieldError(passwordConfirmInput);
    return true;
  }

  /* ---------- live listeners ---------- */
  fullnameInput?.addEventListener("blur", validateFullname);
  fullnameInput?.addEventListener("input", () => clearFieldError(fullnameInput));

  emailInput?.addEventListener("blur", validateEmail);
  emailInput?.addEventListener("input", () => clearFieldError(emailInput));

  phoneInput?.addEventListener("blur", validatePhone);
  phoneInput?.addEventListener("input", () => clearFieldError(phoneInput));

  passwordInput?.addEventListener("input", () => {
    updateStrengthMeter();
    clearFieldError(passwordInput);
    if (passwordConfirmInput.value) validatePasswordConfirm();
  });

  passwordConfirmInput?.addEventListener("input", validatePasswordConfirm);

  /* ---------- submit ---------- */
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (signupError) {
      signupError.style.display = "none";
      signupError.textContent = "";
    }

    const validName = validateFullname();
    const validEmail = validateEmail();
    const validPhone = validatePhone();
    const validPassword = validatePassword();
    const validConfirm = validatePasswordConfirm();

    if (!validName || !validEmail || !validPhone || !validPassword || !validConfirm) {
      showSignupError("يرجى تصحيح الأخطاء الموضحة أعلاه");
      return;
    }

    const name = fullnameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const passwordcomf = passwordConfirmInput.value;
    const phone = phoneInput.value.trim();

    const submitBtn = signupForm.querySelector(".btn-primary");
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "جاري إنشاء الحساب...";

    try {
      const res = await fetch("https://api.tasswek.com/api/register", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordcomf,
          phone,
        }),
      });

      const data = await res.json();

      if (res.status === 201 && data.token) {
        localStorage.clear();

        localStorage.setItem("token", data.token);
        localStorage.setItem("auth_role", data.user.role);
        localStorage.setItem("auth_user", JSON.stringify(data.user));

        window.location.replace("/Home/client_dashboard.html");
      } else if (res.status === 201 && data.phone) {
        localStorage.setItem("pending_phone", data.phone);
        window.location.href = "/Auth/Verify_otp.html";
      } else {
        let msg = data.message || "فشل إنشاء الحساب، يرجى المحاولة مرة أخرى";

        if (data.errors) {
          msg = Object.values(data.errors).flat()[0];
        }
        showSignupError(msg);
      }
    } catch (err) {
      console.error(err);
      showSignupError("عذراً، لا يمكن الاتصال بالسيرفر حالياً");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});

/* ============================================================
   Shared UI helpers (both pages)
   ============================================================ */

// NOTE: previously only ".toggle-password" was selected here, so the
// confirm-password eye icon (".toggle-password-2" in Sign_up.html)
// never worked. Both classes are now handled.
document.querySelectorAll(".toggle-password, .toggle-password-2").forEach((icon) => {
  icon.addEventListener("click", function () {
    const input = this.parentElement.querySelector("input");

    if (input.type === "password") {
      input.type = "text";
      this.classList.replace("fa-eye", "fa-eye-slash");
    } else {
      input.type = "password";
      this.classList.replace("fa-eye-slash", "fa-eye");
    }
  });
});

function showSignupError(message) {
  const signupError = document.getElementById("signupError");
  if (signupError) {
    signupError.textContent = message;
    signupError.style.display = "block";
  } else {
    alert(message);
  }
}

function showError(message) {
  if (generalError) {
    generalError.textContent = message;
    generalError.style.display = "block";
    generalError.style.color = "#d63031";
  } else {
    alert(message);
  }
}