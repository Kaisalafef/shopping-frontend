document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const API_BASE_URL = "https://api.tasswek.com/api";

    // ===== Toast System =====
    function showToast(msg, type = "success") {
        let toastBox = document.getElementById("toast-box");
        if (!toastBox) {
            toastBox = document.createElement('div');
            toastBox.id = 'toast-box';
            document.body.appendChild(toastBox);
        }

        const toast = document.createElement("div");
        toast.classList.add("toast", type);
        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            warning: 'fa-triangle-exclamation'
        };
        toast.innerHTML = `<i class="fa-solid ${icons[type]}"></i> ${msg}`;
        toastBox.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("hide");
            toast.addEventListener("animationend", () => toast.remove());
        }, 4000);
    }

    // ===== Money Formatting (يراعي عملة الطلب - FIXED: كانت تُعرض دائماً بالليرة السورية) =====
    // المبلغ المخزّن في total_price/price دائماً بالليرة السورية (عملة الأساس)،
    // فإذا كانت عملة الطلب USD نحوّله باستخدام exchange_rate المخزّن وقت إنشاء الطلب.
    function formatMoney(sypAmount, order) {
        const amount = Number(sypAmount) || 0;
        if (order && order.currency === 'USD' && order.exchange_rate) {
            const usd = amount / Number(order.exchange_rate);
            return '$' + usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return amount.toLocaleString() + ' ل.س';
    }

    // ===== DOM Elements =====
    const tableBody = document.getElementById("orders-table-body");
    const loadingSpinner = document.getElementById("loading-spinner");
    const noOrdersMsg = document.getElementById("no-orders-msg");
    const filterBtns = document.querySelectorAll(".filter-btn[data-filter]");
    const filterDateFrom = document.getElementById("filter-date-from");
    const filterDateTo = document.getElementById("filter-date-to");
    const filterPaymentMethod = document.getElementById("filter-payment-method");
    const exportBtn = document.getElementById("export-orders");
    const clearFiltersBtn = document.getElementById("clear-filters");

    const modal = document.getElementById("order-modal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const rejectionModal = document.getElementById("rejection-modal");
    const closeRejectionModalBtn = document.getElementById("closeRejectionModal");
    const rejectionTextarea = document.getElementById("rejection-reason-textarea");
    const confirmRejectionBtn = document.getElementById("confirm-rejection-btn");

    let allOrders = [];
    let currentRejectionOrderId = null;
    let currentFilters = { status: 'all', dateFrom: '', dateTo: '', paymentMethod: '' };

    // ===== Initialize =====
    fetchOrders();
    setupEventListeners();

    function setupEventListeners() {
        // Status filter buttons
        filterBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                filterBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                currentFilters.status = btn.dataset.filter;
                applyFilters();
            });
        });

        // Date & payment method filters
        [filterDateFrom, filterDateTo, filterPaymentMethod].forEach(el => {
            el.addEventListener("change", () => {
                currentFilters.dateFrom = filterDateFrom.value;
                currentFilters.dateTo = filterDateTo.value;
                currentFilters.paymentMethod = filterPaymentMethod.value;
                applyFilters();
            });
        });

        // Export & Clear
        exportBtn.addEventListener("click", exportToExcel);
        clearFiltersBtn.addEventListener("click", clearAllFilters);

        // Modal close
        closeModalBtn.addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

        // Rejection modal
        closeRejectionModalBtn.addEventListener("click", closeRejectionModal);
        rejectionModal.addEventListener("click", (e) => { if (e.target === rejectionModal) closeRejectionModal(); });
        confirmRejectionBtn.addEventListener("click", executeRejection);

        // Keyboard shortcuts
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") { closeModal(); closeRejectionModal(); }
        });
    }

    // ===== Data Fetching =====
    async function fetchOrders() {
        loadingSpinner.style.display = "block";
        tableBody.innerHTML = "";
        noOrdersMsg.style.display = "none";

        try {
            const res = await fetch(`${API_BASE_URL}/admin/orders`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`HTTP ${res.status}: ${errText.substring(0, 100)}`);
            }

            const result = await res.json();
            allOrders = result.data ? result.data : result;
            
            // Ensure payment_proof is parsed
            allOrders.forEach(order => {
                if (order.payment_proof && typeof order.payment_proof === 'string') {
                    try { order.payment_proof = JSON.parse(order.payment_proof); } catch {}
                }
            });

            updateStats(allOrders);
            applyFilters();

        } catch (error) {
            console.error("Fetch orders error:", error);
            tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--danger); padding:40px;">خطأ في تحميل البيانات: ${error.message}</td></tr>`;
        } finally {
            loadingSpinner.style.display = "none";
        }
    }

    // ===== Filtering & Rendering =====
    function applyFilters() {
        let filtered = [...allOrders];

        // Status filter
        if (currentFilters.status !== 'all') {
            filtered = filtered.filter(o => o.status === currentFilters.status);
        }

        // Date range filter
        if (currentFilters.dateFrom) {
            const from = new Date(currentFilters.dateFrom);
            from.setHours(0,0,0,0);
            filtered = filtered.filter(o => new Date(o.created_at) >= from);
        }
        if (currentFilters.dateTo) {
            const to = new Date(currentFilters.dateTo);
            to.setHours(23,59,59,999);
            filtered = filtered.filter(o => new Date(o.created_at) <= to);
        }

        // Payment method filter
        if (currentFilters.paymentMethod) {
            filtered = filtered.filter(o => o.payment_method === currentFilters.paymentMethod);
        }

        renderOrders(filtered);
    }

    function clearAllFilters() {
        currentFilters = { status: 'all', dateFrom: '', dateTo: '', paymentMethod: '' };
        filterBtns.forEach(b => b.classList.remove("active"));
        document.querySelector('.filter-btn[data-filter="all"]').classList.add("active");
        filterDateFrom.value = '';
        filterDateTo.value = '';
        filterPaymentMethod.value = '';
        applyFilters();
        showToast("تم مسح جميع الفلاتر", "success");
    }

    function renderOrders(orders) {
        tableBody.innerHTML = "";

        if (orders.length === 0) {
            noOrdersMsg.style.display = "block";
            return;
        }
        noOrdersMsg.style.display = "none";

        orders.forEach(order => {
            const tr = document.createElement("tr");
            tr.dataset.orderId = order.id;

            // Action buttons based on status
            let actionButtons = `
                <button class="action-btn btn-view" onclick="openOrderModal(${order.id})" title="عرض التفاصيل">
                    <i class="fas fa-eye"></i>
                </button>
            `;

            if (order.status === 'pending') {
                actionButtons += `
                    <button class="action-btn btn-accept" onclick="updateOrderStatus(${order.id}, 'processing')" title="قبول الطلب">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn btn-refuse" onclick="updateOrderStatus(${order.id}, 'cancelled')" title="رفض الطلب">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            } else if (order.status === 'pending_approval') {
                actionButtons += `
                    <button class="action-btn btn-approve-payment" onclick="approvePayment(${order.id})" title="الموافقة على الدفع">
                        <i class="fas fa-check-double"></i>
                    </button>
                    <button class="action-btn btn-reject-payment" onclick="openRejectionModal(${order.id})" title="رفض الدفع">
                        <i class="fas fa-ban"></i>
                    </button>
                `;
            }

            // Payment method badge
            const paymentMethodLabels = {
                'cash': 'كاش عند الاستلام',
                'shamcash': 'شام كاش',
                'usdt': 'USDT'
            };
            const paymentMethod = paymentMethodLabels[order.payment_method] || order.payment_method;

            let paymentBadgeClass = 'cash';
            let paymentBadgeText = paymentMethod;
            if (order.is_paid) {
                paymentBadgeClass = 'paid';
                paymentBadgeText += ' ✓';
            } else if (order.status === 'pending_approval') {
                paymentBadgeClass = 'pending-approval';
                paymentBadgeText += ' - بانتظار المراجعة';
            }

            tr.innerHTML = `
                <td><strong class="order-id">#${order.id}</strong></td>
                <td>
                    <div class="customer-name">${order.user?.name || "زائر"}</div>
                    ${order.user?.profile?.phone ? `<div class="customer-phone">${order.user.profile.phone}</div>` : ''}
                </td>
                <td class="address-cell" title="${order.shipping_address || 'غير محدد'}">${order.shipping_address || "غير محدد"}</td>
                <td class="date-cell">${formatDate(order.created_at)}</td>
                <td class="amount-cell">${formatMoney(order.total_price, order)}</td>
                <td><span class="payment-badge ${paymentBadgeClass}">${paymentBadgeText}</span></td>
                <td class="transaction-cell">${order.transaction_id || "-"}</td>
                <td class="sender-cell">${order.sender_name || "-"}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${actionButtons}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // ===== Stats =====
    function updateStats(orders) {
        document.getElementById("total-orders-count").textContent = orders.length;
        document.getElementById("pending-orders-count").textContent = orders.filter(o => o.status === "pending").length;
        document.getElementById("pending-approval-count").textContent = orders.filter(o => o.status === "pending_approval").length;
        document.getElementById("processing-orders-count").textContent = orders.filter(o => o.status === "processing").length;
        document.getElementById("cancelled-orders-count").textContent = orders.filter(o => o.status === "cancelled").length;
    }

    // ===== Modal: Order Details =====
    window.openOrderModal = function (orderId) {
        const order = allOrders.find(o => o.id === orderId);
        if (!order) return;

        document.getElementById("modal-order-id").textContent = `تفاصيل الطلب #${order.id}`;

        // Customer Info Box
        const infoBox = document.getElementById("modal-customer-info");

        const paymentMethodLabels = {
            'cash': 'كاش عند الاستلام',
            'shamcash': 'شام كاش',
            'usdt': 'USDT'
        };

        infoBox.innerHTML = `
            <p><strong><i class="fas fa-user"></i> الزبون:</strong> <span>${order.user?.name || "غير معروف"}</span></p>
            <p><strong><i class="fas fa-phone"></i> الهاتف:</strong> <span>${order.user?.profile?.phone || "غير متوفر"}</span></p>
            <p><strong><i class="fas fa-map-marker-alt"></i> العنوان:</strong> <span>${order.shipping_address || "غير محدد"}</span></p>
            <p><strong><i class="fas fa-credit-card"></i> طريقة الدفع:</strong> <span>${paymentMethodLabels[order.payment_method] || order.payment_method}</span></p>
            <p><strong><i class="fas fa-calendar-alt"></i> تاريخ الطلب:</strong> <span>${formatDate(order.created_at)}</span></p>
            ${order.transaction_id ? `<p><strong><i class="fas fa-hashtag"></i> رقم العملية:</strong> <span>${order.transaction_id}</span></p>` : ''}
            ${order.sender_name ? `<p><strong><i class="fas fa-user-tag"></i> اسم المرسل:</strong> <span>${order.sender_name}</span></p>` : ''}
            ${order.paid_at ? `<p><strong><i class="fas fa-check-circle"></i> تاريخ التأكيد:</strong> <span>${formatDate(order.paid_at)}</span></p>` : ''}
            ${order.ip_address ? `<p><strong><i class="fas fa-network-wired"></i> عنوان IP:</strong> <span>${order.ip_address}</span></p>` : ''}
            ${order.user_agent ? `<p><strong><i class="fas fa-desktop"></i> المتصفح:</strong> <span style="font-size:0.75rem; max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block;">${order.user_agent}</span></p>` : ''}
        `;

        // Rejection banner if cancelled with reason
        if (order.status === 'cancelled' && order.payment_proof?.rejection_reason) {
            const rejectionDiv = document.createElement('div');
            rejectionDiv.className = 'rejection-banner';
            rejectionDiv.innerHTML = `<strong><i class="fas fa-ban"></i> سبب الرفض:</strong> ${order.payment_proof.rejection_reason}`;
            infoBox.appendChild(rejectionDiv);
        }

        // Payment proof image
        if (order.payment_proof?.proof_image_url) {
            const proofDiv = document.createElement('div');
            proofDiv.className = 'payment-proof-image';
            proofDiv.innerHTML = `
                <h5><i class="fas fa-image"></i> إثبات الدفع المرفق:</h5>
                <a href="${order.payment_proof.proof_image_url}" target="_blank" rel="noopener">
                    <img src="${order.payment_proof.proof_image_url}" alt="إثبات الدفع" loading="lazy">
                </a>
            `;
            infoBox.appendChild(proofDiv);
        }

        // Items
        const itemsContainer = document.getElementById("modal-items-list");
        itemsContainer.innerHTML = "";

        if (order.order_item && order.order_item.length > 0) {
            order.order_item.forEach(item => {
                const prodName = item.product ? item.product.name : "منتج محذوف";
                const prodImg = item.product ? item.product.image_url : "/images/looogo.png";
                const prodColor = item.color || "-";
                const prodSize = item.size || "-";

                itemsContainer.innerHTML += `
                    <div class="order-item-card">
                        <img src="${prodImg}" alt="${prodName}" class="item-img" onerror="this.src='/images/looogo.png'">
                        <div class="item-details">
                            <h5>${prodName}</h5>
                            <div class="item-meta">
                                <span>اللون: <strong>${prodColor}</strong></span>
                                <span>المقاس: <strong>${prodSize}</strong></span>
                                <span>الكمية: <strong>${item.quantity}</strong></span>
                                <span>السعر: <strong>${formatMoney(item.price, order)}</strong></span>
                                <span>المجموع: <strong>${formatMoney(item.price * item.quantity, order)}</strong></span>
                            </div>
                        </div>
                    </div>
                `;
            });
        } else {
            itemsContainer.innerHTML = "<p style='color:var(--text-secondary); text-align:center; padding:20px;'>لا توجد منتجات في هذا الطلب.</p>";
        }

        // Total
        document.getElementById("modal-total-price").textContent = formatMoney(order.total_price, order);

        // Modal Actions
        const modalActions = document.getElementById("modal-actions-container");
        modalActions.innerHTML = "";

        if (order.status === 'pending') {
            modalActions.innerHTML = `
                <button class="action-btn btn-accept" onclick="updateOrderStatus(${order.id}, 'processing'); closeModal();">
                    <i class="fas fa-check"></i> قبول
                </button>
                <button class="action-btn btn-refuse" onclick="updateOrderStatus(${order.id}, 'cancelled'); closeModal();">
                    <i class="fas fa-times"></i> رفض
                </button>
            `;
        } else if (order.status === 'pending_approval') {
            modalActions.innerHTML = `
                <button class="action-btn btn-approve-payment" onclick="approvePayment(${order.id}); closeModal();">
                    <i class="fas fa-money-check-dollar"></i> الموافقة على الدفع
                </button>
                <button class="action-btn btn-reject-payment" onclick="openRejectionModal(${order.id}); closeModal();">
                    <i class="fas fa-ban"></i> رفض الدفع
                </button>
            `;
        }

        modal.classList.add("active");
        document.body.style.overflow = 'hidden';
    };

    function closeModal() {
        modal.classList.remove("active");
        document.body.style.overflow = '';
    }

    // ===== Modal: Rejection Reason =====
    window.openRejectionModal = function (orderId) {
        currentRejectionOrderId = orderId;
        rejectionTextarea.value = '';
        rejectionModal.classList.add("active");
        document.body.style.overflow = 'hidden';
        setTimeout(() => rejectionTextarea.focus(), 100);
    };

    function closeRejectionModal() {
        rejectionModal.classList.remove("active");
        document.body.style.overflow = '';
        currentRejectionOrderId = null;
    }

    async function executeRejection() {
        const reason = rejectionTextarea.value.trim();
        if (!reason) {
            showToast("سبب الرفض مطلوب", "warning");
            rejectionTextarea.focus();
            return;
        }

        if (!currentRejectionOrderId) return;

        const orderId = currentRejectionOrderId;
        confirmRejectionBtn.disabled = true;
        confirmRejectionBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الرفض...';

        try {
            const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/reject`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ rejection_reason: reason })
            });

            const data = await res.json();

            if (res.ok) {
                showToast("تم رفض الدفع وإلغاء الطلب", "success");
                closeRejectionModal();
                fetchOrders();
            } else {
                showToast(data.message || "فشل الرفض", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("خطأ في الاتصال", "error");
        } finally {
            confirmRejectionBtn.disabled = false;
            confirmRejectionBtn.innerHTML = '<i class="fas fa-check"></i> تأكيد الرفض';
        }
    }

    // ===== Actions: Approve/Reject/Status Update =====
    window.approvePayment = async function (orderId) {
        if (!confirm('هل أنت متأكد من الموافقة على هذا الدفع وتحويل الطلب إلى "قيد المعالجة"؟')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                showToast("تم الموافقة على الدفع بنجاح", "success");
                fetchOrders();
            } else {
                showToast(data.message || "فشل الموافقة", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("خطأ في الاتصال", "error");
        }
    };

    window.updateOrderStatus = async function (orderId, newStatus) {
        const statusText = translateStatus(newStatus);
        if (!confirm(`هل أنت متأكد أنك تريد تغيير حالة الطلب إلى "${statusText}"؟`)) return;

        try {
            const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await res.json();

            if (res.ok) {
                const orderIndex = allOrders.findIndex(o => o.id === orderId);
                if (orderIndex !== -1) allOrders[orderIndex].status = newStatus;
                applyFilters();
                updateStats(allOrders);
                showToast("تم تحديث الحالة بنجاح", "success");
            } else {
                showToast(data.message || "فشل تحديث الحالة", "error");
            }
        } catch (error) {
            console.error(error);
            showToast("حدث خطأ في الاتصال بالخادم", "error");
        }
    };

    // ===== Export to Excel =====
    function exportToExcel() {
        let filtered = [...allOrders];
        if (currentFilters.status !== 'all') filtered = filtered.filter(o => o.status === currentFilters.status);
        if (currentFilters.dateFrom) filtered = filtered.filter(o => new Date(o.created_at) >= new Date(currentFilters.dateFrom));
        if (currentFilters.dateTo) filtered = filtered.filter(o => new Date(o.created_at) <= new Date(currentFilters.dateTo));
        if (currentFilters.paymentMethod) filtered = filtered.filter(o => o.payment_method === currentFilters.paymentMethod);

        if (filtered.length === 0) {
            showToast("لا توجد بيانات للتصدير", "warning");
            return;
        }

        const paymentMethodLabels = { 'cash': 'كاش', 'shamcash': 'شام كاش', 'usdt': 'USDT' };
        const statusLabels = { 
            pending: 'قيد الانتظار', 
            pending_approval: 'انتظار موافقة', 
            processing: 'قيد المعالجة', 
            cancelled: 'ملغى', 
            completed: 'مكتمل' 
        };

        const headers = [
            'رقم الطلب', 'الزبون', 'الهاتف', 'العنوان', 'تاريخ الطلب', 
            'المبلغ', 'العملة', 'طريقة الدفع', 'الحالة', 
            'رقم العملية', 'اسم المرسل', 'تاريخ التأكيد', 'سبب الرفض'
        ];

        const rows = filtered.map(order => [
            order.id,
            order.user?.name || 'زائر',
            order.user?.profile?.phone || '',
            order.shipping_address || '',
            formatDate(order.created_at),
            formatMoney(order.total_price, order),
            order.currency === 'USD' ? 'دولار' : 'ليرة سورية',
            paymentMethodLabels[order.payment_method] || order.payment_method,
            statusLabels[order.status] || order.status,
            order.transaction_id || '',
            order.sender_name || '',
            order.paid_at ? formatDate(order.paid_at) : '',
            order.payment_proof?.rejection_reason || ''
        ]);

        const csvContent = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`تم تصدير ${filtered.length} طلب بنجاح`, "success");
    }

    // ===== Helpers =====
    function formatDate(dateString) {
        if (!dateString) return '-';
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    }

    function getStatusBadge(status) {
        const labels = {
            pending: "قيد الانتظار",
            pending_approval: "⏳ انتظار موافقة",
            processing: "قيد المعالجة",
            cancelled: "ملغى",
            completed: "مكتمل"
        };
        const text = labels[status] || status;
        const className = `status-${status}`;
        return `<span class="status-badge ${className}">${text}</span>`;
    }

    function translateStatus(status) {
        const map = {
            pending: "قيد الانتظار",
            pending_approval: "انتظار موافقة الدفع",
            processing: "قيد المعالجة",
            cancelled: "ملغى",
            completed: "مكتمل"
        };
        return map[status] || status;
    }
});