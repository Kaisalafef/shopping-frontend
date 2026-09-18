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

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = value ?? "";
        return div.innerHTML;
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
            loadCustomers();
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

    // ============================================================
    // ADMIN: Customers list + delete
    // ============================================================
    if (role !== "admin") return; // بقية الدوال أدناه خاصة بالأدمن فقط

    const customersTableBody = document.getElementById("customersTableBody");
    const customersLoading = document.getElementById("customersLoading");
    const customersEmpty = document.getElementById("customersEmpty");
    const customerSearchInput = document.getElementById("customerSearch");

    const deleteModal = document.getElementById("deleteCustomerModal");
    const deleteCustomerName = document.getElementById("deleteCustomerName");
    const closeDeleteModal = document.getElementById("closeDeleteModal");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    let pendingDeleteId = null;
    let searchDebounceId = null;

    async function loadCustomers(search = "") {
        customersLoading.style.display = "block";
        customersEmpty.style.display = "none";
        customersTableBody.innerHTML = "";

        try {
            const url = new URL(`${API_BASE_URL}/admin/customers`);
            if (search) url.searchParams.set("search", search);

            const res = await fetch(url, {
                headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error();

            const result = await res.json();
            const customers = result.data || result;

            renderCustomers(customers);
        } catch {
            showToast("فشل تحميل قائمة الزبائن", "error");
        } finally {
            customersLoading.style.display = "none";
        }
    }

    function renderCustomers(customers) {
        customersTableBody.innerHTML = "";

        if (!customers || customers.length === 0) {
            customersEmpty.style.display = "block";
            return;
        }
        customersEmpty.style.display = "none";

        customers.forEach((customer) => {
            const row = document.createElement("tr");
            row.dataset.id = customer.id;

            const ordersCount = customer.orders_count ?? 0;
            const phone = customer.phone || customer.profile?.phone || "غير محدد";

            row.innerHTML = `
                <td>${escapeHtml(customer.name)}</td>
                <td>${escapeHtml(customer.email)}</td>
                <td>${escapeHtml(phone)}</td>
                <td><span class="status-badge status-processing">${ordersCount}</span></td>
                <td>
                    <button class="btn-danger btn-delete-customer" type="button"
                        data-id="${customer.id}" data-name="${escapeHtml(customer.name)}">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </td>
            `;

            customersTableBody.appendChild(row);
        });
    }

    customerSearchInput?.addEventListener("input", (e) => {
        clearTimeout(searchDebounceId);
        const value = e.target.value.trim();
        searchDebounceId = setTimeout(() => loadCustomers(value), 350);
    });

    customersTableBody.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-delete-customer");
        if (!btn) return;

        pendingDeleteId = btn.dataset.id;
        deleteCustomerName.textContent = btn.dataset.name;
        deleteModal.classList.add("active");
    });

    function closeModal() {
        deleteModal.classList.remove("active");
        pendingDeleteId = null;
    }

    closeDeleteModal?.addEventListener("click", closeModal);
    cancelDeleteBtn?.addEventListener("click", closeModal);
    deleteModal?.addEventListener("click", (e) => {
        if (e.target === deleteModal) closeModal();
    });

    confirmDeleteBtn?.addEventListener("click", async () => {
        if (!pendingDeleteId) return;

        confirmDeleteBtn.disabled = true;
        const originalText = confirmDeleteBtn.innerHTML;
        confirmDeleteBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري الحذف...`;

        try {
            const res = await fetch(`${API_BASE_URL}/admin/customers/${pendingDeleteId}`, {
                method: "DELETE",
                headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                // 409 = الزبون لديه طلبات مرتبطة، الرسالة تأتي جاهزة من الباك اند
                showToast(data.message || "تعذر حذف الزبون", "error");
                return;
            }

            const row = customersTableBody.querySelector(`tr[data-id="${pendingDeleteId}"]`);
            row?.remove();

            if (!customersTableBody.querySelector("tr")) {
                customersEmpty.style.display = "block";
            }

            showToast(data.message || "تم حذف حساب الزبون بنجاح", "success");
        } catch {
            showToast("تعذر الاتصال بالسيرفر", "error");
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = originalText;
            closeModal();
        }
    });
});