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

  async function fetchUserProfile() {
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error();

      const profile = await res.json();
      const user = profile.data || profile;

      currentUserId = user.id;

      document.getElementById("info-fullname").innerText = user.name;
      document.getElementById("display-name").innerText = user.name;
      document.getElementById("edit-fullname").value = user.name;

      document.getElementById("info-email").innerText = user.email;
      document.getElementById("edit-email").value = user.email;

      document.getElementById("info-phone").innerText = user.phone;
      document.getElementById("edit-phone").value = user.phone;

      checkAdminOrUser();
    } catch {
      showToast("فشل تحميل الملف الشخصي", "error");
    }
  }


  async function checkAdminOrUser() {
    if (role === "admin") {
      roleBadge.innerText = "مدير النظام";
      roleBadge.style.background = "#e74c3c";

      customerSection.style.display = "none";
      adminSection.style.display = "block";
    } else {
      roleBadge.innerText = "زبون";
      roleBadge.style.background = "#232f3e";

      adminSection.style.display = "none";
      customerSection.style.display = "block";

      const profileTitle = document.getElementById("profileTitle");
      if (profileTitle) {
        profileTitle.innerText =
          role === "admin" ? "لوحة تحكم المدير" : "ملفي الشخصي";
      }
      fetchCustomerOrders();
    }
  }

  let myOrdersData = [];

  async function fetchCustomerOrders() {
    const tbody = document.getElementById("customer-orders-body");
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align:center;">جاري التحميل...</td></tr>';

    try {

      const res = await fetch(`${API_BASE_URL}/orders/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      const orders = Array.isArray(result) ? result : result.data || [];

      myOrdersData = orders;

      tbody.innerHTML = "";

      if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">لا توجد طلبات سابقة</td></tr>`;
        return;
      }

      orders.forEach((order) => {
        tbody.innerHTML += `
            <tr>
                <td><strong>#${order.id}</strong></td>
                <td>${formatDate(order.created_at)}</td>
                <td><strong>${Number(
                  order.total_price
                ).toLocaleString()} ل.س</strong></td>
                <td>${getStatusBadge(order.status)}</td>
                <td>
                    <button class="btn-secondary" style="padding: 5px 10px; font-size: 0.8rem;" onclick="openCustomerOrderModal(${
                      order.id
                    })">
                        <i class="fas fa-eye"></i> تفاصيل
                    </button>
                </td>
            </tr>`;
      });
    } catch (error) {
      console.error(error);
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">خطأ في تحميل الطلبات</td></tr>`;
    }
  }

  function getStatusBadge(status) {
    const map = {
      pending: { text: "قيد الانتظار", class: "status-pending" },
      processing: { text: "تمت الموافقة", class: "status-processing" },
      cancelled: { text: "ملغى", class: "status-cancelled" },
      delivered: { text: "تم التوصيل", class: "status-done" },
    };

    const statusInfo = map[status] || { text: status, class: "" };

    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
  }

  function formatDate(d) {
    return new Date(d).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  window.openCustomerOrderModal = function (orderId) {
    const order = myOrdersData.find((o) => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById("order-modal");

    document.getElementById(
      "modal-order-id"
    ).innerText = `تفاصيل الطلب #${order.id}`;
    document.getElementById("modal-address").innerText =
      order.shipping_address || "غير محدد";
    document.getElementById("modal-date").innerText = formatDate(
      order.created_at
    );
    document.getElementById("modal-total-price").innerText =
      Number(order.total_price).toLocaleString() + " ل.س";

    const itemsContainer = document.getElementById("modal-items-list");
    itemsContainer.innerHTML = "";

    if (order.order_item && order.order_item.length > 0) {
  order.order_item.forEach((item) => {
        const prodName = item.product ? item.product.name : "منتج غير متوفر";
        const prodImg = item.product
          ? item.product.image_url
          : "/images/logo.webp";

        itemsContainer.innerHTML += `
                <div class="order-item-card" style="display:flex; align-items:center; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <img src="${prodImg}" alt="${prodName}" style=" height:50px; border-radius:5px; object-fit:cover; margin-left:10px;">
                    <div class="item-details">
                        <h5 style="margin:0 0 5px 0;">${prodName}</h5>
                        <div style="font-size:0.85rem; color:#777;">
                           اللون: ${item.color || "-"} | المقاس: ${
          item.size || "-"
        } <br>
                           الكمية: <strong>${item.quantity}</strong> × ${Number(
          item.price
        ).toLocaleString()}
                        </div>
                    </div>
                </div>
            `;
      });
    } else {
      itemsContainer.innerHTML = "<p>لا توجد تفاصيل للمنتجات.</p>";
    }

    modal.classList.add("active");
  };

  window.closeModal = function () {
    const modal = document.getElementById("order-modal");
    if (modal) modal.classList.remove("active");
  };

  window.addEventListener("click", (e) => {
    const modal = document.getElementById("order-modal");
    if (e.target === modal) closeModal();
  });

  function formatDate(d) {
    return new Date(d).toLocaleDateString("ar-EG");
  }

  function translateStatus(s) {
    return (
      {
        pending: "قيد الانتظار",
        processing: "تمت الموافقة",
        cancelled: "ملغى",
      }[s] || s
    );
  }

  fetchUserProfile();

  function toggleEditMode(isEditing) {
    const infoTexts = document.querySelectorAll(".info-item p");
    const inputs = document.querySelectorAll(".edit-input");

    if (isEditing) {
      infoTexts.forEach((p) => (p.style.display = "none"));
      inputs.forEach((i) => (i.style.display = "block"));

      editBtn.style.display = "none";
      saveBtn.style.display = "inline-block";
    } else {
      infoTexts.forEach((p) => (p.style.display = "block"));
      inputs.forEach((i) => (i.style.display = "none"));

      editBtn.style.display = "inline-block";
      saveBtn.style.display = "none";
    }
  }

  editBtn.addEventListener("click", () => {
    toggleEditMode(true);
  });

  saveBtn.addEventListener("click", async () => {
    const password = document.getElementById("edit-pass").value.trim();
    const passwordConfirm = document
      .getElementById("edit-pass-confirm")
      .value.trim();

    if (password || passwordConfirm) {
      if (password.length < 8) {
        showToast("كلمة المرور يجب أن تكون 8 أحرف على الأقل", "warning");
        return;
      }

      if (password !== passwordConfirm) {
        showToast("كلمتا المرور غير متطابقتين", "warning");
        return;
      }
    }

    const updatedData = {
      name: document.getElementById("edit-fullname").value,
      email: document.getElementById("edit-email").value,
      phone: document.getElementById("edit-phone").value,
    };

    if (password) {
      updatedData.password = password;
      updatedData.password_confirmation = passwordConfirm;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error();

      const result = await res.json();
      const user = result.data || result;

      document.getElementById("info-fullname").innerText = user.name;
      document.getElementById("display-name").innerText = user.name;
      document.getElementById("info-email").innerText = user.email;
      document.getElementById("info-phone").innerText = user.phone;

      toggleEditMode(false);
      showToast("تم تحديث البيانات بنجاح", "success");
    } catch {
      showToast("فشل تحديث البيانات", "error");
    }
  });

  document.querySelectorAll(".toggle-pass").forEach((icon) => {
    icon.addEventListener("click", () => {
      const inputId = icon.getAttribute("data-target");
      const input = document.getElementById(inputId);

      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  });
});
