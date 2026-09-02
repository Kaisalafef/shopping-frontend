document.addEventListener("DOMContentLoaded", () => {

    const BASE_URL = "https://api.tasswek.com";

    // ===== Exchange Rate (SYP -> USD) =====
    // Assumes GET /api/exchange-rate returns { rate: <SYP per 1 USD> }
    // Adjust the endpoint/response shape to match your backend if different.
    let EXCHANGE_RATE = null;

    // ذاكرة مؤقتة لآخر قائمة أقسام تم جلبها (تُستخدم عند فتح نافذة التعديل)
    let categoriesCache = [];

    // ذاكرة مؤقتة لآخر قائمة إعلانات تم جلبها (تُستخدم عند فتح حوار تفاصيل الإعلان)
    let adsCache = [];

    // نفس قائمة الأيقونات المستخدمة في صفحة إضافة المنتج، لضمان نفس التجربة عند التعديل
    const CATEGORY_ICONS = [
    // 👗 الأزياء والملابس
    "fa-solid fa-shirt",
    "fa-solid fa-person-dress",
    "fa-solid fa-person",
    "fa-solid fa-vest",
    "fa-solid fa-user-tie",
    "fa-solid fa-hat-cowboy",
    "fa-solid fa-mitten",
    "fa-solid fa-socks",
    "fa-solid fa-shoe-prints",
    "fa-solid fa-boot",
    "fa-solid fa-glasses",
    "fa-solid fa-ring",
    "fa-solid fa-gem",
    "fa-solid fa-bag-shopping",
    "fa-solid fa-wallet",
    "fa-solid fa-scarf",

    // 👩 أزياء نسائية
    "fa-solid fa-person-dress",
    "fa-solid fa-person-dress-burst",
    "fa-solid fa-vest-patches",
    "fa-solid fa-handbag",
    "fa-solid fa-shoe-prints",
    "fa-solid fa-gem",

    // 👨 أزياء رجالية
    "fa-solid fa-person",
    "fa-solid fa-user-tie",
    "fa-solid fa-shirt",
    "fa-solid fa-vest",
    "fa-solid fa-hat-cowboy",
    "fa-solid fa-wallet",

    // 👶 الأطفال
    "fa-solid fa-baby",
    "fa-solid fa-baby-carriage",
    "fa-solid fa-child",
    "fa-solid fa-puzzle-piece",
    "fa-solid fa-gamepad",
    "fa-solid fa-shapes",

    // 💄 الجمال والعناية
    "fa-solid fa-spray-can-sparkles",
    "fa-solid fa-wand-magic-sparkles",
    "fa-solid fa-heart",
    "fa-solid fa-face-smile",
    "fa-solid fa-hand",
    "fa-solid fa-bottle-droplet",
    "fa-solid fa-pump-soap",
    "fa-solid fa-scissors",

    // 📱 الإلكترونيات
    "fa-solid fa-laptop",
    "fa-solid fa-mobile-screen",
    "fa-solid fa-tablet-screen-button",
    "fa-solid fa-desktop",
    "fa-solid fa-headphones",
    "fa-solid fa-headphones-simple",
    "fa-solid fa-camera",
    "fa-solid fa-video",
    "fa-solid fa-tv",
    "fa-solid fa-gamepad",
    "fa-solid fa-keyboard",
    "fa-solid fa-computer-mouse",
    "fa-solid fa-microchip",
    "fa-solid fa-memory",
    "fa-solid fa-hard-drive",
    "fa-solid fa-usb",
    "fa-solid fa-plug",
    "fa-solid fa-battery-full",

    // 🏠 المنزل والأثاث
    "fa-solid fa-house",
    "fa-solid fa-couch",
    "fa-solid fa-bed",
    "fa-solid fa-chair",
    "fa-solid fa-table",
    "fa-solid fa-kitchen-set",
    "fa-solid fa-blender",
    "fa-solid fa-mug-hot",
    "fa-solid fa-utensils",
    "fa-solid fa-plate-wheat",
    "fa-solid fa-faucet",
    "fa-solid fa-lightbulb",
    "fa-solid fa-fan",
    "fa-solid fa-vacuum",

    // 🍔 الطعام والمشروبات
    "fa-solid fa-utensils",
    "fa-solid fa-burger",
    "fa-solid fa-pizza-slice",
    "fa-solid fa-apple-whole",
    "fa-solid fa-carrot",
    "fa-solid fa-lemon",
    "fa-solid fa-ice-cream",
    "fa-solid fa-cake-candles",
    "fa-solid fa-mug-hot",
    "fa-solid fa-bottle-water",
    "fa-solid fa-wine-glass",

    // 🏋️ الرياضة
    "fa-solid fa-dumbbell",
    "fa-solid fa-person-running",
    "fa-solid fa-person-swimming",
    "fa-solid fa-person-biking",
    "fa-solid fa-basketball",
    "fa-solid fa-futbol",
    "fa-solid fa-volleyball",
    "fa-solid fa-baseball",
    "fa-solid fa-football",
    "fa-solid fa-table-tennis-paddle-ball",
    "fa-solid fa-medal",
    "fa-solid fa-trophy",

    // 🚗 السيارات والمركبات
    "fa-solid fa-car",
    "fa-solid fa-car-side",
    "fa-solid fa-car-rear",
    "fa-solid fa-truck",
    "fa-solid fa-van-shuttle",
    "fa-solid fa-motorcycle",
    "fa-solid fa-bicycle",
    "fa-solid fa-scooter",
    "fa-solid fa-gas-pump",
    "fa-solid fa-car-battery",
    "fa-solid fa-wrench",

    // 💍 المجوهرات والساعات
    "fa-solid fa-gem",
    "fa-solid fa-ring",
    "fa-solid fa-clock",
    "fa-solid fa-stopwatch",
    "fa-solid fa-hourglass",
    "fa-solid fa-crown",

    // 📚 الكتب والتعليم
    "fa-solid fa-book",
    "fa-solid fa-book-open",
    "fa-solid fa-bookmark",
    "fa-solid fa-graduation-cap",
    "fa-solid fa-school",
    "fa-solid fa-pencil",
    "fa-solid fa-pen",
    "fa-solid fa-pen-nib",
    "fa-solid fa-calculator",
    "fa-solid fa-ruler",

    // 🎨 الفن والهوايات
    "fa-solid fa-palette",
    "fa-solid fa-paintbrush",
    "fa-solid fa-music",
    "fa-solid fa-guitar",
    "fa-solid fa-microphone",
    "fa-solid fa-camera-retro",
    "fa-solid fa-film",
    "fa-solid fa-puzzle-piece",
    "fa-solid fa-chess",
    "fa-solid fa-dice",

    // 🐶 الحيوانات
    "fa-solid fa-dog",
    "fa-solid fa-cat",
    "fa-solid fa-fish",
    "fa-solid fa-dove",
    "fa-solid fa-horse",

    // 🌱 الحدائق والزراعة
    "fa-solid fa-seedling",
    "fa-solid fa-leaf",
    "fa-solid fa-tree",
    "fa-solid fa-spa",
    "fa-solid fa-wheat-awn",
    "fa-solid fa-sun",

    // 🛠️ الأدوات والصيانة
    "fa-solid fa-wrench",
    "fa-solid fa-screwdriver-wrench",
    "fa-solid fa-hammer",
    "fa-solid fa-screwdriver",
    "fa-solid fa-toolbox",
    "fa-solid fa-gears",
    "fa-solid fa-bolt",

    // 🎁 عام / متنوع
    "fa-solid fa-gift",
    "fa-solid fa-box",
    "fa-solid fa-box-open",
    "fa-solid fa-tag",
    "fa-solid fa-tags",
    "fa-solid fa-cart-shopping",
    "fa-solid fa-basket-shopping",
    "fa-solid fa-store",
    "fa-solid fa-shop",
    "fa-solid fa-star",
    "fa-solid fa-heart",
    "fa-solid fa-fire",
    "fa-solid fa-percent",
    "fa-solid fa-shapes"
];

    const fetchExchangeRate = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/exchange-rate`);
            if (!res.ok) throw new Error("bad response");
            const json = await res.json();
            const rate = Number(json.rate);
            EXCHANGE_RATE = rate > 0 ? rate : null;
        } catch (e) {
            console.error("فشل جلب سعر الصرف", e);
            EXCHANGE_RATE = null;
        }
        return EXCHANGE_RATE;
    };

    // Convert a SYP amount into its USD equivalent string, or "" if rate unavailable
    const toUsdLabel = (sypAmount) => {
        if (!EXCHANGE_RATE) return "";
        const usd = sypAmount / EXCHANGE_RATE;
        return `(~$${usd.toFixed(2)})`;
    };

    // يبني نص السعر بالشكل الصحيح حسب العملة: "$100.00" أو "13,158 SYP"
    const formatMoney = (value, currency) => {
        if (currency === "USD") {
            return `$${Number(value).toFixed(2)}`;
        }
        return `${new Intl.NumberFormat("en-US").format(Math.round(value))} SYP`;
    };

  function isAdminUser() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("auth_role");
    return role === 'admin' && !!token;
  }

  function showToast(msg, type = "success") {
    const toastBox = document.getElementById("toast-box");
    if (!toastBox) return;

    const toast = document.createElement("div");
    toast.classList.add("toast", type);

    let icon = "";
    if (type === "success") icon = '<i class="fa-solid fa-circle-check"></i>';
    if (type === "error") icon = '<i class="fa-solid fa-circle-xmark"></i>';
    if (type === "warning") icon = '<i class="fa-solid fa-triangle-exclamation"></i>';

    toast.innerHTML = `${icon} <span>${msg}</span>`;
    toastBox.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("hide");
      toast.addEventListener("animationend", () => toast.remove());
    }, 4000);
  }

    // ===== الأقسام (من جدول categories) =====
    const loadCategories = async (isAdmin) => {
        const container = document.getElementById("categoriesContainer");
        if (!container) return;

        try {
            const res = await fetch(`${BASE_URL}/api/categories`);
            if (!res.ok) throw new Error("bad response");
            const categories = await res.json();
            categoriesCache = Array.isArray(categories) ? categories : [];

            if (!categoriesCache.length) {
                container.innerHTML = '<div style="padding:20px;">لا توجد أقسام حالياً</div>';
                return;
            }

            container.innerHTML = categoriesCache
                .map((cat) => {
                    const roleParam = isAdmin ? "&role=admin" : "";
                    const href = `/Proudcts/Products.html?cat=${encodeURIComponent(cat.slug)}${roleParam}`;

                    // أيقونة القسم من الجدول (fontawesome class مثل "fa-laptop"),
                    // مع صورة القسم كبديل، ثم أيقونة افتراضية إن لم يوجد أي منهما
                    let iconHtml;
                    if (cat.icon) {
                        const iconClass = cat.icon.startsWith("fa-") ? cat.icon : `fa-${cat.icon}`;
                        iconHtml = `<i class="fas ${iconClass}"></i>`;
                    } else if (cat.image) {
                        iconHtml = `<img src="${cat.image}" alt="${cat.name}" style="width:32px;height:32px;object-fit:contain;">`;
                    } else {
                        iconHtml = `<i class="fas fa-shapes"></i>`;
                    }

                    // أزرار تعديل/حذف القسم تظهر فقط للأدمن، وهي خارج رابط <a> لتفادي فتح الصفحة عند الضغط عليها
                    const adminActionsHtml = isAdmin
                        ? `
                        <div class="category-admin-actions">
                            <button type="button" class="cat-action-btn cat-edit-btn" onclick="editCategoryClick(event, ${cat.id})" title="تعديل القسم">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button type="button" class="cat-action-btn cat-delete-btn" onclick="deleteCategoryClick(event, ${cat.id})" title="حذف القسم">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>`
                        : "";

                    return `
                        <div class="pdf-card-wrapper">
                            <a href="${href}" class="pdf-card">
                                <div class="pdf-card-inner">
                                    ${iconHtml}
                                </div>
                                <div class="pdf-card-title">${cat.name}</div>
                            </a>
                            ${adminActionsHtml}
                        </div>
                    `;
                })
                .join("");
        } catch (e) {
            console.error("فشل جلب الأقسام", e);
            container.innerHTML = '<div style="padding:20px;">تعذر تحميل الأقسام</div>';
        }
    };

    // ===== رسم شبكة الأيقونات داخل نافذة تعديل القسم =====
    const renderCategoryIconGrid = (selectedIcon) => {
        const grid = document.getElementById("editIconGrid");
        if (!grid) return;

        grid.innerHTML = "";
        grid.dataset.selectedIcon = selectedIcon || "";

        CATEGORY_ICONS.forEach((iconClass) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "icon-option";
            if (iconClass === selectedIcon) btn.classList.add("active");
            btn.innerHTML = `<i class="${iconClass}"></i>`;

            btn.onclick = () => {
                grid.querySelectorAll(".icon-option").forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                grid.dataset.selectedIcon = iconClass;
            };

            grid.appendChild(btn);
        });
    };

    // ===== فتح/إغلاق نافذة تعديل القسم =====
    window.editCategoryClick = (event, catId) => {
        event.preventDefault();
        event.stopPropagation();

        const cat = categoriesCache.find((c) => c.id === catId);
        if (!cat) return;

        const modal = document.getElementById("editCategoryModal");
        const idInput = document.getElementById("editCategoryId");
        const nameInput = document.getElementById("editCategoryName");
        if (!modal || !idInput || !nameInput) return;

        idInput.value = cat.id;
        nameInput.value = cat.name;
        renderCategoryIconGrid(cat.icon || "");
        modal.classList.add("active");
    };

    window.closeEditCategoryModal = () => {
        const modal = document.getElementById("editCategoryModal");
        if (modal) modal.classList.remove("active");
    };

    // ===== حذف قسم =====
    window.deleteCategoryClick = async (event, catId) => {
        event.preventDefault();
        event.stopPropagation();

        if (!confirm("هل أنت متأكد من حذف هذا القسم؟ لا يمكن التراجع عن هذا الإجراء.")) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/api/categories/${catId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });

            if (res.ok) {
                showToast("تم حذف القسم بنجاح");
                loadCategories(isAdminUser());
            } else {
                const err = await res.json().catch(() => ({}));
                // نفس رسالة الباك اند عند منع الحذف بسبب منتجات مرتبطة (409)
                showToast(err.message || "تعذر حذف القسم", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("خطأ في الاتصال بالخادم", "error");
        }
    };

    // ===== ربط نموذج التعديل بحدث الحفظ =====
    const setupEditCategoryModal = () => {
        const modal = document.getElementById("editCategoryModal");
        const form = document.getElementById("editCategoryForm");
        if (!modal || !form) return;

        modal.addEventListener("click", (e) => {
            if (e.target === modal) window.closeEditCategoryModal();
        });

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const id = document.getElementById("editCategoryId").value;
            const name = document.getElementById("editCategoryName").value.trim();
            const grid = document.getElementById("editIconGrid");
            const icon = grid ? grid.dataset.selectedIcon || "" : "";

            if (!name) {
                showToast("يرجى إدخال اسم القسم", "warning");
                return;
            }

            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${BASE_URL}/api/categories/${id}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ name, icon }),
                });

                if (res.ok) {
                    showToast("تم تحديث القسم بنجاح");
                    window.closeEditCategoryModal();
                    loadCategories(isAdminUser());
                } else {
                    const err = await res.json().catch(() => ({}));
                    showToast(err.message || "تعذر تحديث القسم", "error");
                }
            } catch (err) {
                console.error(err);
                showToast("خطأ في الاتصال بالخادم", "error");
            }
        });
    };

    // ===== تعديل سعر الصرف (Admin فقط) =====
    const setupExchangeRateEditor = (isAdmin) => {
        const editBtn = document.getElementById("editExchangeRateBtn");
        const modal = document.getElementById("exchangeRateModal");
        const form = document.getElementById("exchangeRateForm");
        const input = document.getElementById("newExchangeRate");

        if (!editBtn || !modal || !form || !input) return;

        if (isAdmin) editBtn.style.display = "inline-flex";

        window.closeExchangeRateModal = () => {
            modal.classList.remove("active");
        };

        editBtn.addEventListener("click", () => {
            input.value = EXCHANGE_RATE ?? "";
            modal.classList.add("active");
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) window.closeExchangeRateModal();
        });

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const newRate = Number(input.value);
            if (!newRate || newRate <= 0) {
                showToast("يرجى إدخال سعر صرف صحيح", "warning");
                return;
            }

            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${BASE_URL}/api/exchange-rate`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ rate: newRate }),
                });

                if (!res.ok) throw new Error("bad response");

                EXCHANGE_RATE = newRate;
                showToast("تم تحديث سعر الصرف بنجاح");
                window.closeExchangeRateModal();

                // إعادة رسم العروض لتعكس السعر الجديد فوراً
                loadDailyOffers();
            } catch (err) {
                console.error(err);
                showToast("فشل تحديث سعر الصرف", "error");
            }
        });
    };

   const loadDailyOffers = async () => {
    const offersContainer = document.getElementById("offersContainer");
    if (!offersContainer) return;

    offersContainer.innerHTML = '<div style="padding:20px; width:100%; text-align:center;">جاري تحميل العروض...</div>';

    try {
        const res = await fetch(`https://api.tasswek.com/api/offers`);
        const json = await res.json();
        const offers = json.offers || [];

        if (!offers.length) {
            offersContainer.innerHTML = '<div style="padding:20px;">لا توجد عروض حالياً</div>';
            return;
        }

        offersContainer.innerHTML = "";
        const isAdmin = isAdminUser(); 

        offers.forEach((o, index) => {
            const p = o.product;
            if (!p) return;

            
            let img = p.image_url || "/images/CLE.jpg";

            
            // العملة التي أدخل بها الأدمن سعر هذا المنتج (افتراضياً SYP للمنتجات القديمة)
            const currency = p.currency || "SYP";
            const isUsd = currency === "USD";
            const otherCurrency = isUsd ? "SYP" : "USD";

            const basePrice = Number(p.price); // بنفس عملة "currency" تماماً كما أُدخل
            let finalPrice = basePrice;
            let label = "";

            if (o.discount_percentage) {
                finalPrice = basePrice - (basePrice * o.discount_percentage / 100);
                label = `-${o.discount_percentage}%`;
            } else if (o.discount_price) {
                // ملاحظة: يُفترض أن قيمة الخصم الثابتة مُدخلة بنفس عملة المنتج
                finalPrice = basePrice - o.discount_price;
                label = "Sale";
            }
            finalPrice = Math.max(finalPrice, 0);

            const convertedFinal = EXCHANGE_RATE
                ? (isUsd ? finalPrice * EXCHANGE_RATE : finalPrice / EXCHANGE_RATE)
                : null;

            const delay = index * 0.1;

            
            let adminButtonsHtml = "";
            if (isAdmin) {
                adminButtonsHtml = `
                    <div class="admin-actions">
                        
                        <button class="action-btn btn-delete" onclick="deleteOffer(${o.id}, event)">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                `;
            }

                offersContainer.insertAdjacentHTML("beforeend", `
                    <div class="offer-white-card" style="animation-delay: ${delay}s"  onclick="location.href='/Product/Product.html?id=${p.id}'">
                        <span class="discount-circle">${label}</span>

                        <div class="offer-img-box" onclick ="window.location.href='/Product/Product.html?id=${p.id}'">
                            <img src="${img}" alt="${p.name}">
                        </div>

                        <div class="offer-details">
                            <h4 class="offer-title">${p.name}</h4>

                            <div class="offer-prices">
                                <span class="new-price">${formatMoney(finalPrice, currency)}</span>
                                <span class="old-price">${formatMoney(basePrice, currency)}</span>
                                ${convertedFinal !== null ? `<span class="usd-price">(~${formatMoney(convertedFinal, otherCurrency)})</span>` : ""}
                            </div>
                        </div>
                        ${adminButtonsHtml}
                        
                    </div>
                `);
            });

        } catch (e) {
            console.error(e);
            offersContainer.innerHTML = "خطأ في تحميل العروض";
        }
    };


    
    // مزامنة النقاط أسفل الإعلانات مع موضع التمرير الفعلي (تعمل بشكل صحيح مع RTL)
    const setupAdsDotsSync = (adsContainer, adsDots) => {
        if (!adsDots) return;
        const banners = adsContainer.querySelectorAll(".ad-banner");
        const dots = adsDots.querySelectorAll(".ads-dot");
        if (!banners.length || !dots.length) return;

        const setActiveDot = (index) => {
            dots.forEach((d) => d.classList.remove("active"));
            const target = adsDots.querySelector(`.ads-dot[data-index="${index}"]`);
            if (target) target.classList.add("active");
        };

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            setActiveDot(entry.target.dataset.index);
                        }
                    });
                },
                { root: adsContainer, threshold: 0.6 }
            );
            banners.forEach((b) => observer.observe(b));
        }
    };

    const loadAds = async () => {
        const adsContainer = document.getElementById("adsContainer");
        const adsDots = document.getElementById("adsDots");
        if (!adsContainer) return;

        try {
            const response = await fetch(`${BASE_URL}/api/ads`);
            const res = await response.json();
            const ads = res.ads || [];
            adsCache = ads;

            if (!ads.length) {
                adsContainer.style.display = "none";
                if (adsDots) adsDots.style.display = "none";
                return;
            }

            adsContainer.style.display = "";
            adsContainer.innerHTML = "";
            if (adsDots) {
                adsDots.style.display = ads.length > 1 ? "flex" : "none";
                adsDots.innerHTML = "";
            }

            const isAdmin = isAdminUser();
            ads.forEach((ad, index) => {
                const img = ad.image
                    ? `${BASE_URL}/storage/${ad.image}`
                    : "https://via.placeholder.com/800x300";

                
                const delay = index * 0.2;

                adsContainer.insertAdjacentHTML("beforeend", `
    <div class="ad-banner"
         data-ad-id="${ad.id}"
         data-index="${index}"
         style="background-image:url('${img}'); animation-delay: ${delay}s;"
         onclick="window.openAdDetails(${ad.id})">
        ${
              isAdmin
                ? `<button class="delete-ad-btn" onclick="deleteAd(${ad.id}, event)">
                      <i class="fas fa-trash"></i> حذف
                   </button>`
                : ""
            }
        <div class="ad-overlay"></div>

        <div class="ad-content">
            <h3>${ad.title}</h3>
            <p>${ad.description || ""}</p>

            ${ad.link ? `<button onclick="event.stopPropagation(); location.href='${ad.link}'">تصفح العرض</button>` : ''}

            
        </div>
    </div>
`);

                if (adsDots) {
                    const dot = document.createElement("button");
                    dot.type = "button";
                    dot.className = "ads-dot" + (index === 0 ? " active" : "");
                    dot.dataset.index = String(index);
                    dot.setAttribute("aria-label", `عرض الإعلان ${index + 1}`);
                    dot.addEventListener("click", () => {
                        const target = adsContainer.querySelector(`.ad-banner[data-index="${index}"]`);
                        if (target) target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                    });
                    adsDots.appendChild(dot);
                }
            });

            setupAdsDotsSync(adsContainer, adsDots);

        } catch (err) {
            console.error(err);
        }
    };

    // ===== حوار تفاصيل الإعلان =====
    window.openAdDetails = (adId) => {
        const ad = adsCache.find((a) => a.id === adId);
        const modal = document.getElementById("adDetailsModal");
        if (!ad || !modal) return;

        const img = ad.image
            ? `${BASE_URL}/storage/${ad.image}`
            : "https://via.placeholder.com/800x400";

        const imageBox = document.getElementById("adModalImage");
        const titleEl = document.getElementById("adModalTitle");
        const descEl = document.getElementById("adModalDesc");
        const actionsEl = document.getElementById("adModalActions");

        if (imageBox) imageBox.style.backgroundImage = `url('${img}')`;
        if (titleEl) titleEl.textContent = ad.title || "";

        if (descEl) {
            descEl.textContent = ad.description || "";
            descEl.style.display = ad.description ? "block" : "none";
        }

        if (actionsEl) {
            actionsEl.innerHTML = ad.link
                ? `<button type="button" class="btn-cancel" onclick="closeAdDetailsModal()">إغلاق</button>
                   <button type="button" class="btn-confirm-order" onclick="location.href='${ad.link}'"><i class="fas fa-arrow-left"></i> تصفح العرض</button>`
                : `<button type="button" class="btn-confirm-order" onclick="closeAdDetailsModal()">حسناً</button>`;
        }

        modal.classList.add("active");
    };

    window.closeAdDetailsModal = () => {
        const modal = document.getElementById("adDetailsModal");
        if (modal) modal.classList.remove("active");
    };

    const setupAdDetailsModal = () => {
        const modal = document.getElementById("adDetailsModal");
        if (!modal) return;
        modal.addEventListener("click", (e) => {
            if (e.target === modal) window.closeAdDetailsModal();
        });
    };

window.deleteAd = async (adId, event) => {
    event.stopPropagation();

    if (!confirm("هل أنت متأكد من حذف الإعلان؟")) return;

    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `https://api.tasswek.com/api/ads/${adId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                },
            }
        );

        if (response.ok) {
            alert("تم حذف الإعلان بنجاح");
            loadAds(); 
        } else {
            alert("فشل حذف الإعلان");
        }
    } catch (error) {
        console.error(error);
        alert("خطأ في الاتصال بالخادم");
    }
};


window.deleteOffer = async (offerId, event) => {
    event.stopPropagation(); 
    
    if (!confirm("هل أنت متأكد من حذف هذا العرض؟")) return;

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`https://api.tasswek.com/api/offers/${offerId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        });

        if (response.ok) {
            alert("تم حذف العرض بنجاح");
            loadDailyOffers(); 
        } else {
            alert("فشل الحذف، يرجى المحاولة لاحقاً");
        }
    } catch (error) {
        console.error(error);
        alert("حدث خطأ في الاتصال");
    }
};


window.redirectToEdit = (productId, event) => {
    event.stopPropagation(); 
    
    window.location.href = `/Discount/Add_Discount.html?search=${productId}`;
};
    (async () => {
        const isAdmin = isAdminUser();
        setupExchangeRateEditor(isAdmin);
        setupEditCategoryModal();
        setupAdDetailsModal();
        await fetchExchangeRate();
        loadCategories(isAdmin);
        loadDailyOffers();
        loadAds();
    })();
});