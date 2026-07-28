

  async function removeDiscount(productId) {
    const product = state.products.find((p) => p.id == productId);
    if (!product?.discount) return;

    try {
      await fetch(API_URLS.DELETE_OFFER(product.discount.offerId), {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      toast("تم حذف الخصم");
      closeModal();
      fetchProducts();
    } catch {
      toast("فشل حذف الخصم", "error");
    }
  }


document.addEventListener("DOMContentLoaded", () => {

    const BASE_URL = "https://api.tasswek.com";

  function isAdminUser() {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("auth_role");
    return role === 'admin' && !!token;
  }
    
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

            
            const basePrice = Number(p.price);
            let finalPrice = basePrice;
            let label = "";

            if (o.discount_percentage) {
                finalPrice = basePrice - (basePrice * o.discount_percentage / 100);
                label = `-${o.discount_percentage}%`;
            } else if (o.discount_price) {
                finalPrice = basePrice - o.discount_price;
                label = "Sale";
            }

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
                                <span class="new-price">SYP</span>
                                <span class="new-price">${Math.round(finalPrice)}</span>
                                <span class="old-price">${basePrice}</span>
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


    
    const loadAds = async () => {
        const adsContainer = document.getElementById("adsContainer");
        if (!adsContainer) return;

        try {
            const response = await fetch(`${BASE_URL}/api/ads`);
            const res = await response.json();
            const ads = res.ads || [];

            if (!ads.length) {
                adsContainer.style.display = "none";
                return;
            }

            adsContainer.innerHTML = "";
            const isAdmin = isAdminUser();
            ads.forEach((ad, index) => {
                const img = ad.image
                    ? `${BASE_URL}/storage/${ad.image}`
                    : "https://via.placeholder.com/800x300";

                
                const delay = index * 0.2;

                adsContainer.insertAdjacentHTML("beforeend", `
    <div class="ad-banner"
         data-ad-id="${ad.id}"
         style="background-image:url('${img}'); animation-delay: ${delay}s;">
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

            ${ad.link ? `<button onclick="location.href='${ad.link}'">تصفح العرض</button>` : ''}

            
        </div>
    </div>
`);

            });

        } catch (err) {
            console.error(err);
        }
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
    loadDailyOffers();
    loadAds();
});
