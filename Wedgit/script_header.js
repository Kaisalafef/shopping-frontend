document.addEventListener("DOMContentLoaded", () => {
    
    
    
    const userStr = localStorage.getItem("auth_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const role = localStorage.getItem("auth_role"); 

    
    const userRole = (role === 'admin') ? 'admin' : 'client'; 

    const adminFeatures = document.querySelectorAll(".admin-only");
    const cartLink = document.getElementById("cart-link");

    if (role === 'admin') {
        
        adminFeatures.forEach(el => el.style.display = "block");
        
        if (cartLink) cartLink.style.display = "none";
    } else {
        
        adminFeatures.forEach(el => el.style.display = "none");
        if (cartLink) cartLink.style.display = "block";
    }

    
    const logoLink = document.querySelector(".logo-link");
    if (logoLink) {
        logoLink.href = (role === 'admin') ? "/Home/admin_dashboard.html" : "/Home/client_dashboard.html";
    }
    
    const backBtn = document.getElementById("backToCategories");
    if (backBtn) {
        backBtn.href = targetDashboard;
        if (userRole === 'admin') {
            backBtn.innerHTML = '<i class="fas fa-arrow-right"></i> عودة للوحة الإدارة';
        }
    }

    
    if (userRole === 'admin') {
        const cartLink = document.querySelector('a[href="/Cart/Cart.html"]');
        if (cartLink && cartLink.parentElement) {
            cartLink.parentElement.style.display = 'none';
        }
    }

    
    const searchInput = document.getElementById("globalSearchInput");
    const searchResults = document.getElementById("searchResults");
    const API_URL = "https://api.tasswek.com/api/products"; 
    
    let debounceTimer;

    const getImageUrl = (path) => {
        if (!path) return '/images/placeholder.png';
        if (path.startsWith('http')) return path;
        return `https://api.tasswek.com/storage/${path}`;
    };

    if (searchInput && searchResults) {
        
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.classList.remove('active');
            }
        });

        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.trim();
            clearTimeout(debounceTimer);

            if (query.length === 0) {
                searchResults.classList.remove('active');
                searchResults.innerHTML = "";
                return;
            }

            debounceTimer = setTimeout(() => {
                fetch(`${API_URL}?search=${encodeURIComponent(query)}`)
                    .then(res => {
                        if(!res.ok) throw new Error("Network response was not ok");
                        return res.json();
                    })
                    .then(resData => {
                        const products = resData.data || resData; 
                        renderSearchResults(products);
                    })
                    .catch(err => {
                        console.error("Search Error:", err);
                        searchResults.innerHTML = `<div class="search-item" style="animation: fadeInUp 0.3s forwards">خطأ في البحث</div>`;
                        searchResults.classList.add('active');
                    });
            }, 500); 
        });
    }

    function renderSearchResults(products) {
        searchResults.innerHTML = "";
        
        if (!products || products.length === 0) {
            searchResults.innerHTML = `
                <div class="search-item" style="justify-content:center; color:#999; animation: fadeInUp 0.3s forwards">
                    لا توجد نتائج
                </div>`;
        } else {
            
            products.slice(0, 5).forEach((product, index) => {
                const item = document.createElement("a");
                item.href = `/Product/Product.html?id=${product.id}`;
                item.className = "search-item";
                
                
                
                item.style.animationDelay = `${index * 0.1}s`;

                item.innerHTML = `
                    <div class="search-item-info">
                        <span class="search-item-title">${product.name}</span>
                    <!--    <span class="search-item-price">${Number(product.price).toLocaleString()} SYP</span> -->
                    </div>
                    <img src="${getImageUrl(product.image_url)}" alt="${product.name}">
                `;
                searchResults.appendChild(item);
            });
        }
        
        searchResults.classList.add('active');
    }

    
    const profileBtn = document.getElementById("profileBtn");
    const dropdown = document.getElementById("desktopDropdown");

    if (profileBtn && dropdown) {
        profileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("show");
        });
        document.addEventListener("click", (e) => {
            if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove("show");
            }
        });
    }
    // ========================================================
    // الإشعارات (جرس الـ Header)
    // ========================================================
    const NOTIF_API_BASE = "https://api.tasswek.com/api";

    const notifBtn = document.getElementById("notifBtn");
    const notifBadge = document.getElementById("notifBadge");
    const notifDropdown = document.getElementById("notifDropdown");
    const notifList = document.getElementById("notifList");
    const markAllReadBtn = document.getElementById("markAllReadBtn");

    const notifAuthHeaders = () => ({
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Accept": "application/json",
    });

    const notifTimeAgo = (isoDate) => {
        const diffMs = Date.now() - new Date(isoDate).getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return "الآن";
        if (mins < 60) return `منذ ${mins} د`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `منذ ${hours} س`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `منذ ${days} يوم`;
        return new Date(isoDate).toLocaleDateString("ar-SY");
    };

    const notifIconClass = (type) => {
        switch (type) {
            case "order": return "fa-cart-shopping";
            case "order_approved": return "fa-circle-check";
            case "order_rejected": return "fa-circle-xmark";
            case "order_status": return "fa-truck-fast";
            case "payment_incomplete": return "fa-triangle-exclamation";
            case "proof_submitted": return "fa-clock";
            default: return "fa-bell";
        }
    };

    const updateNotifBadge = (count) => {
        if (!notifBadge) return;
        if (count > 0) {
            notifBadge.textContent = count > 99 ? "99+" : count;
            notifBadge.style.display = "flex";
            notifBtn?.classList.add("has-unread");
        } else {
            notifBadge.style.display = "none";
            notifBtn?.classList.remove("has-unread");
        }
    };

    const renderNotifications = (items) => {
        if (!notifList) return;

        if (!items || !items.length) {
            notifList.innerHTML = `<div class="notif-empty">لا توجد إشعارات حالياً</div>`;
            return;
        }

        notifList.innerHTML = items.map(n => `
            <div class="notif-item ${n.is_read ? "" : "unread"}" data-type="${n.type}" data-id="${n.id}" data-link="${n.link || ""}">
                <div class="notif-icon"><i class="fas ${notifIconClass(n.type)}"></i></div>
                <div class="notif-content">
                    <div class="notif-title">${n.title}</div>
                    <div class="notif-message">${n.message}</div>
                    <div class="notif-time">${notifTimeAgo(n.created_at)}</div>
                </div>
                ${!n.is_read ? '<span class="notif-dot"></span>' : ""}
            </div>
        `).join("");

        notifList.querySelectorAll(".notif-item").forEach((el) => {
            el.addEventListener("click", async () => {
                const id = el.dataset.id;
                const link = el.dataset.link;

                if (el.classList.contains("unread")) {
                    try {
                        await fetch(`${NOTIF_API_BASE}/notifications/${id}/read`, {
                            method: "PUT",
                            headers: notifAuthHeaders(),
                        });
                        el.classList.remove("unread");
                        el.querySelector(".notif-dot")?.remove();
                        fetchUnreadCount();
                    } catch (e) { /* silent */ }
                }

                if (link) window.location.href = link;
            });
        });
    };

    const fetchNotifications = async () => {
        if (!localStorage.getItem("token") || !notifList) return;
        try {
            const res = await fetch(`${NOTIF_API_BASE}/notifications`, { headers: notifAuthHeaders() });
            if (!res.ok) throw new Error("bad response");
            const json = await res.json();
            renderNotifications(json.data || []);
            updateNotifBadge(json.unread_count || 0);
        } catch (e) {
            notifList.innerHTML = `<div class="notif-empty">تعذر تحميل الإشعارات</div>`;
        }
    };

    const fetchUnreadCount = async () => {
        if (!localStorage.getItem("token") || !notifBadge) return;
        try {
            const res = await fetch(`${NOTIF_API_BASE}/notifications/unread-count`, { headers: notifAuthHeaders() });
            if (!res.ok) return;
            const json = await res.json();
            updateNotifBadge(json.unread_count || 0);
        } catch (e) { /* silent */ }
    };

    if (notifBtn && notifDropdown) {
        notifBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle("show");
            if (notifDropdown.classList.contains("show")) fetchNotifications();
        });
        document.addEventListener("click", (e) => {
            if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
                notifDropdown.classList.remove("show");
            }
        });
    }

    if (markAllReadBtn) {
        markAllReadBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            try {
                await fetch(`${NOTIF_API_BASE}/notifications/mark-all-read`, {
                    method: "POST",
                    headers: notifAuthHeaders(),
                });
                fetchNotifications();
            } catch (err) { /* silent */ }
        });
    }

    // تحديث الشارة عند تحميل الصفحة، ثم كل 30 ثانية بدون فتح القائمة
    fetchUnreadCount();
    setInterval(fetchUnreadCount, 30000);

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (e) {
            e.preventDefault();
            const token = localStorage.getItem("token");
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الخروج...';

            fetch("https://api.tasswek.com/api/logout", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            })
            .finally(() => {
                localStorage.clear(); 
                sessionStorage.clear();
                window.location.replace("../index.html"); 
            })
            .catch(err => {
                console.error("Logout Error", err);
                localStorage.clear();
                window.location.href = "../index.html";
            });
        });
    }
});