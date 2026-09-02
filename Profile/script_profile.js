document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const API_BASE_URL = "https://api.tasswek.com/api";

    if (!token) {
        window.location.href = "/Auth/Log_in.html";
        return;
    }

    const role = localStorage.getItem("auth_role");
    const saveBtn = document.getElementById("save-btn");
    const editBtn = document.getElementById("edit-btn");
    const roleBadge = document.getElementById("role-text");
    const customerSection = document.getElementById("customer-section");
    const adminSection = document.getElementById("admin-section");

    let currentUserId = null;

    // ===== Toast System =====
    function showToast(msg, type = "success") {
        let toastBox = document.getElementById("toast-box");
        if (!toastBox) { toastBox = document.createElement('div'); toastBox.id = 'toast-box'; document.body.appendChild(toastBox); }
        const toast = document.createElement("div");
        toast.classList.add("toast", type);
        const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', warning: 'fa-triangle-exclamation' };
        toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i> ${msg}`;
        toastBox.appendChild(toast);
        setTimeout(() => { toast.classList.add("hide"); toast.addEventListener("animationend", () => toast.remove()); }, 4000);
    }

    // ===== Initialize =====
    fetchUserProfile();

    async function fetchUserProfile() {
        try {
            const res = await fetch(`${API_BASE_URL}/profile`, {
                headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error();
            const profile = await res.json();
            const user = profile.data || profile;
            currentUserId = user.id;

            document.getElementById("info-fullname").textContent = user.name;
            document.getElementById("display-name").textContent = user.name;
            document.getElementById("edit-fullname").value = user.name;
            document.getElementById("info-email").textContent = user.email;
            document.getElementById("edit-email").value = user.email;
            document.getElementById("info-phone").textContent = user.phone || 'غير محدد';
            document.getElementById("edit-phone").value = user.phone || '';

            checkAdminOrUser();
        } catch { showToast("فشل تحميل الملف الشخصي", "error"); }
    }

    function checkAdminOrUser() {
        if (role === "admin") {
            roleBadge.textContent = "مدير النظام";
            roleBadge.style.background = "#e74c3c";
            customerSection.style.display = "none";
            adminSection.style.display = "block";
        } else {
            roleBadge.textContent = "زبون";
            roleBadge.style.background = "#00093f";
            adminSection.style.display = "none";
            customerSection.style.display = "block";
        }
    }

    // ===== Profile Edit Logic =====
    function toggleEditMode(isEditing) {
        document.querySelectorAll(".info-item p").forEach(p => p.style.display = isEditing ? "none" : "block");
        document.querySelectorAll(".edit-input").forEach(i => i.style.display = isEditing ? "block" : "none");
        editBtn.style.display = isEditing ? "none" : "inline-block";
        saveBtn.style.display = isEditing ? "inline-block" : "none";
    }

    editBtn.addEventListener("click", () => toggleEditMode(true));

    saveBtn.addEventListener("click", async () => {
        const password = document.getElementById("edit-pass").value.trim();
        const passwordConfirm = document.getElementById("edit-pass-confirm").value.trim();

        if (password || passwordConfirm) {
            if (password.length < 8) { showToast("كلمة المرور يجب أن تكون 8 أحرف على الأقل", "warning"); return; }
            if (password !== passwordConfirm) { showToast("كلمتا المرور غير متطابقتين", "warning"); return; }
        }

        const updatedData = {
            name: document.getElementById("edit-fullname").value,
            email: document.getElementById("edit-email").value,
            phone: document.getElementById("edit-phone").value,
        };
        if (password) { updatedData.password = password; updatedData.password_confirmation = passwordConfirm; }

        try {
            const res = await fetch(`${API_BASE_URL}/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(updatedData)
            });
            if (!res.ok) throw new Error();
            const result = await res.json();
            const user = result.data || result;
            document.getElementById("info-fullname").textContent = user.name;
            document.getElementById("display-name").textContent = user.name;
            document.getElementById("info-email").textContent = user.email;
            document.getElementById("info-phone").textContent = user.phone;
            toggleEditMode(false);
            showToast("تم تحديث البيانات بنجاح", "success");
        } catch { showToast("فشل تحديث البيانات", "error"); }
    });

    // Password toggles
    document.querySelectorAll(".toggle-pass").forEach(icon => {
        icon.addEventListener("click", () => {
            const input = document.getElementById(icon.dataset.target);
            if (!input) return;
            if (input.type === "password") { input.type = "text"; icon.classList.replace("fa-eye", "fa-eye-slash"); }
            else { input.type = "password"; icon.classList.replace("fa-eye-slash", "fa-eye"); }
        });
    });
});