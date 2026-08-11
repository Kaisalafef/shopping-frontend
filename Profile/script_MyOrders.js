document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const API_BASE_URL = "https://api.tasswek.com/api";

    if (!token) {
        window.location.href = "/Auth/Log_in.html";
        return;
    }

    let myOrdersData = [];

    // ===== Money Formatting (يراعي عملة الطلب - FIXED: كانت تُعرض دائماً بالليرة السورية) =====
    function formatMoney(sypAmount, order) {
        const amount = Number(sypAmount) || 0;
        if (order && order.currency === 'USD' && order.exchange_rate) {
            const usd = amount / Number(order.exchange_rate);
            return '$' + usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return amount.toLocaleString() + ' ل.س';
    }

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
    fetchCustomerOrders();

    async function fetchCustomerOrders() {
        const tbody = document.getElementById("customer-orders-body");
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">جاري التحميل...</td></tr>';

        try {
            const res = await fetch(`${API_BASE_URL}/orders/user`, { headers: { Authorization: `Bearer ${token}` } });
            const result = await res.json();
            const orders = Array.isArray(result) ? result : result.data || [];

            // تأكد من أن payment_proof كائن (Object) وليس نصاً
            orders.forEach(order => {
                if (order.payment_proof && typeof order.payment_proof === 'string') {
                    try { order.payment_proof = JSON.parse(order.payment_proof); } catch {}
                }
            });

            myOrdersData = orders;
            tbody.innerHTML = "";

            if (!orders.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state">لا توجد طلبات سابقة</td></tr>';
                return;
            }

            orders.forEach((order) => {
                const paymentMethodLabels = { 'cash': 'كاش', 'shamcash': 'شام كاش', 'usdt': 'USDT' };
                const paymentMethod = paymentMethodLabels[order.payment_method] || order.payment_method;

                // FIXED: إشارة تنبيه إذا كان الطلب لا يزال بحاجة لإكمال بيانات الدفع
                // (اسم المرسل / رقم العملية) - يحدث إذا انقطع العميل عن إكمال الخطوة الثانية
                // بعد إنشاء الطلب مباشرة (مثلاً بتحديث الصفحة قبل إرسال الإثبات).
                const needsProof = order.status === 'pending_approval'
                    && ['shamcash', 'usdt'].includes(order.payment_method)
                    && (!order.transaction_id || !order.sender_name);

                const actionBtn = needsProof
                    ? `<button class="btn-primary table-action-btn" onclick="openCompleteProofModal(${order.id})">
                            <i class="fas fa-triangle-exclamation"></i> إكمال بيانات الدفع
                        </button>`
                    : `<button class="btn-secondary table-action-btn" onclick="openCustomerOrderModal(${order.id})">
                            <i class="fas fa-eye"></i> تفاصيل
                        </button>`;

                tbody.innerHTML += `
                    <tr>
                        <td><strong>#${order.id}</strong></td>
                        <td>${formatDate(order.created_at)}</td>
                        <td><strong>${formatMoney(order.total_price, order)}</strong></td>
                        <td>${paymentMethod}</td>
                        <td>${getStatusBadge(order.status)} ${needsProof ? '<span class="status-badge status-pending_approval" style="margin-inline-start:4px;">بيانات ناقصة</span>' : ''}</td>
                        <td>${actionBtn}</td>
                    </tr>`;
            });
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red; padding:40px;">خطأ في تحميل الطلبات</td></tr>';
            showToast("خطأ في تحميل الطلبات", "error");
        }
    }

    function getStatusBadge(status) {
        const map = {
            pending: { text: "قيد الانتظار", class: "status-pending" },
            pending_approval: { text: "⏳ انتظار موافقة", class: "status-pending_approval" },
            processing: { text: "قيد المعالجة", class: "status-processing" },
            cancelled: { text: "ملغى", class: "status-cancelled" },
            completed: { text: "مكتمل", class: "status-completed" }
        };
        const statusInfo = map[status] || { text: status, class: "" };
        return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
    }

    function formatDate(d) {
        if (!d) return '-';
        return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    }

    // ===== Order Detail Modal =====
    window.openCustomerOrderModal = function (orderId) {
        const order = myOrdersData.find(o => o.id === orderId);
        if (!order) return;

        const modal = document.getElementById("order-modal");
        const infoBox = document.getElementById("modal-customer-info");
        const itemsContainer = document.getElementById("modal-items-list");

        // Header
        document.getElementById("modal-order-id").textContent = `تفاصيل الطلب #${order.id}`;
        document.getElementById("modal-total-price").textContent = formatMoney(order.total_price, order);

        // Customer Info with Payment Details
        const paymentMethodLabels = { 'cash': 'كاش عند الاستلام', 'shamcash': 'شام كاش', 'usdt': 'USDT' };
        const paymentMethod = paymentMethodLabels[order.payment_method] || order.payment_method;

        let paymentDetailsHtml = `
            <p><strong><i class="fas fa-map-marker-alt"></i> عنوان التوصيل:</strong> <span>${order.shipping_address || "غير محدد"}</span></p>
            <p><strong><i class="fas fa-calendar-alt"></i> تاريخ الطلب:</strong> <span>${formatDate(order.created_at)}</span></p>
            <p><strong><i class="fas fa-credit-card"></i> طريقة الدفع:</strong> <span>${paymentMethod}</span></p>
            <p><strong><i class="fas fa-money-bill-wave"></i> العملة:</strong> <span>${order.currency === 'USD' ? 'دولار أمريكي' : 'ليرة سورية'}</span></p>
        `;

        if (order.transaction_id) paymentDetailsHtml += `<p><strong><i class="fas fa-hashtag"></i> رقم العملية:</strong> <span>${order.transaction_id}</span></p>`;
        if (order.sender_name) paymentDetailsHtml += `<p><strong><i class="fas fa-user-tag"></i> اسم المرسل:</strong> <span>${order.sender_name}</span></p>`;
        if (order.paid_at) paymentDetailsHtml += `<p><strong><i class="fas fa-check-circle"></i> تاريخ التأكيد:</strong> <span>${formatDate(order.paid_at)}</span></p>`;

        infoBox.innerHTML = paymentDetailsHtml;

        // Payment Status & Rejection Reason
        const paymentInfoDiv = document.createElement('div');
        paymentInfoDiv.className = 'payment-info';

        const needsProof = order.status === 'pending_approval'
            && ['shamcash', 'usdt'].includes(order.payment_method)
            && (!order.transaction_id || !order.sender_name);

        if (needsProof) {
            paymentInfoDiv.innerHTML = `
                <h5><i class="fas fa-triangle-exclamation"></i> حالة الدفع</h5>
                <div class="rejection-reason"><i class="fas fa-circle-exclamation"></i> لم يتم إرسال بيانات إثبات الدفع (اسم المرسل ورقم العملية) بعد.</div>
            `;
            const completeBtn = document.createElement('button');
            completeBtn.className = 'btn-primary';
            completeBtn.style.marginTop = '10px';
            completeBtn.style.width = '100%';
            completeBtn.innerHTML = '<i class="fas fa-pen"></i> إكمال بيانات الدفع الآن';
            completeBtn.onclick = () => { closeModal(); openCompleteProofModal(order.id); };
            paymentInfoDiv.appendChild(completeBtn);
        } else if (order.status === 'pending_approval') {
            paymentInfoDiv.innerHTML = `
                <h5><i class="fas fa-clock"></i> حالة الدفع</h5>
                <div class="status-pending"><i class="fas fa-info-circle"></i> دفعتك قيد المراجعة من قبل الإدارة. يرجى الانتظار.</div>
            `;
        } else if (order.status === 'processing' || order.status === 'completed') {
            paymentInfoDiv.innerHTML = `
                <h5><i class="fas fa-check-circle"></i> حالة الدفع</h5>
                <div class="status-approved"><i class="fas fa-check-circle"></i> تم تأكيد الدفع بنجاح. طلبك قيد المعالجة.</div>
            `;
        } else if (order.status === 'cancelled') {
            let reasonHtml = '';
            if (order.payment_proof?.rejection_reason) {
                reasonHtml = `<div class="rejection-reason"><i class="fas fa-ban"></i> <strong>سبب الرفض:</strong> ${order.payment_proof.rejection_reason}</div>`;
            }
            paymentInfoDiv.innerHTML = `
                <h5><i class="fas fa-xmark-circle"></i> حالة الدفع</h5>
                <div style="color:#dc2626; font-weight:600;"><i class="fas fa-times-circle"></i> تم رفض الدفع وإلغاء الطلب</div>
                ${reasonHtml}
            `;
        } else if (order.payment_method === 'cash') {
            paymentInfoDiv.innerHTML = `
                <h5><i class="fas fa-money-bill-wave"></i> حالة الدفع</h5>
                <div style="color:#64748b;">الدفع كاش عند الاستلام. سيتم تحصيل المبلغ عند التوصيل.</div>
            `;
        }

        if (paymentInfoDiv.innerHTML.trim()) infoBox.appendChild(paymentInfoDiv);

        // Payment Proof Image
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
        itemsContainer.innerHTML = "";
        if (order.order_item && order.order_item.length > 0) {
            order.order_item.forEach(item => {
                const prodName = item.product ? item.product.name : "منتج غير متوفر";
                const prodImg = item.product ? item.product.image_url : "/images/logo.webp";
                const prodColor = item.color || "-";
                const prodSize = item.size || "-";

                itemsContainer.innerHTML += `
                    <div class="order-item-card">
                        <img src="${prodImg}" alt="${prodName}" class="item-img" onerror="this.src='/images/logo.webp'">
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
            itemsContainer.innerHTML = "<p style='color:#64748b; text-align:center; padding:20px;'>لا توجد تفاصيل للمنتجات.</p>";
        }

        modal.classList.add("active");
        document.body.style.overflow = 'hidden';
    };

    window.closeModal = function () {
        const modal = document.getElementById("order-modal");
        if (modal) { modal.classList.remove("active"); document.body.style.overflow = ''; }
    };

    // ===== FIXED: إكمال بيانات الدفع الناقصة (اسم المرسل / رقم العملية) =====
    // يعالج الحالة التي يُنشأ فيها الطلب وتُفرَّغ السلة فوراً، لكن العميل ينقطع
    // (بتحديث الصفحة مثلاً) قبل إرسال نموذج إثبات الدفع، فيبقى الطلب بلا بيانات
    // ولا يمكنه إعادة إدخالها من صفحة الدفع لأن السلة أصبحت فارغة.
    window.openCompleteProofModal = function (orderId) {
        const order = myOrdersData.find(o => o.id === orderId);
        if (!order) return;

        let modal = document.getElementById("complete-proof-modal");
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'complete-proof-modal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width:480px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-pen"></i> إكمال بيانات الدفع</h3>
                        <button class="close-modal" onclick="closeCompleteProofModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p style="color:#64748b; margin-bottom:16px;">أدخل بيانات التحويل التي قمت بها لهذا الطلب حتى تتمكن الإدارة من مراجعته والموافقة عليه.</p>
                        <form id="complete-proof-form">
                            <div style="margin-bottom:16px;">
                                <label style="display:block; font-weight:600; margin-bottom:6px;">اسم المرسل *</label>
                                <input type="text" id="complete-sender-name" required style="width:100%; padding:12px; border:2px solid #e0e0e0; border-radius:10px; font-family:'Cairo',sans-serif;">
                            </div>
                            <div style="margin-bottom:16px;">
                                <label style="display:block; font-weight:600; margin-bottom:6px;">رقم العملية / المعاملة *</label>
                                <input type="text" id="complete-transaction-id" required style="width:100%; padding:12px; border:2px solid #e0e0e0; border-radius:10px; font-family:'Cairo',sans-serif; direction:ltr;">
                            </div>
                            <div style="margin-bottom:16px;">
                                <label style="display:block; font-weight:600; margin-bottom:6px;">صورة الإيصال (اختياري)</label>
                                <input type="file" id="complete-proof-image" accept="image/*" style="width:100%;">
                            </div>
                            <button type="submit" class="btn-primary" style="width:100%; padding:12px;" id="complete-proof-submit-btn">إرسال البيانات</button>
                        </form>
                    </div>
                </div>`;
            document.body.appendChild(modal);

            document.getElementById('complete-proof-form').addEventListener('submit', async function (e) {
                e.preventDefault();
                const senderName = document.getElementById('complete-sender-name').value.trim();
                const transactionId = document.getElementById('complete-transaction-id').value.trim();
                const proofImage = document.getElementById('complete-proof-image').files[0];
                const submitBtn = document.getElementById('complete-proof-submit-btn');
                const currentId = modal.dataset.orderId;

                if (!senderName || !transactionId) {
                    showToast("يرجى ملء جميع الحقول المطلوبة", "warning");
                    return;
                }

                submitBtn.disabled = true;
                submitBtn.textContent = 'جاري الإرسال...';

                try {
                    const formData = new FormData();
                    formData.append("sender_name", senderName);
                    formData.append("transaction_id", transactionId);
                    if (proofImage) formData.append("proof_image", proofImage);

                    const res = await fetch(`${API_BASE_URL}/orders/${currentId}/payment-proof`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData
                    });
                    const data = await res.json();

                    if (!res.ok) throw new Error(data.message || "فشل إرسال البيانات");

                    showToast("تم إرسال بيانات الدفع بنجاح، سيتم مراجعتها قريباً", "success");
                    closeCompleteProofModal();
                    fetchCustomerOrders();
                } catch (err) {
                    showToast(err.message || "حدث خطأ أثناء الإرسال", "error");
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'إرسال البيانات';
                }
            });
        }

        modal.dataset.orderId = orderId;
        document.getElementById('complete-sender-name').value = order.sender_name || '';
        document.getElementById('complete-transaction-id').value = order.transaction_id || '';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeCompleteProofModal = function () {
        const modal = document.getElementById("complete-proof-modal");
        if (modal) { modal.classList.remove("active"); document.body.style.overflow = ''; }
    };

    window.addEventListener("click", (e) => {
        const modal = document.getElementById("order-modal");
        const proofModal = document.getElementById("complete-proof-modal");
        if (e.target === modal) closeModal();
        if (proofModal && e.target === proofModal) closeCompleteProofModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { closeModal(); closeCompleteProofModal(); }
    });
});