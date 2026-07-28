document.addEventListener("DOMContentLoaded", async () => {

    const displayArea = document.getElementById("adDisplayArea");

    if (!displayArea) {
        console.error("عنصر adDisplayArea غير موجود");
        return;
    }

    try {
        const response = await fetch("https://api.tasswek.com/api/ads", {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error("فشل جلب الإعلانات");

        const result = await response.json();

        if (!result.ads || result.ads.length === 0) {
            displayArea.innerHTML = `<h3 style="text-align:center; color:#777; padding:20px;">لا يوجد إعلانات حالياً</h3>`;
            return;
        }

        const ad = result.ads[0]; // عرض أحدث إعلان

        // التأكد من رابط الصورة (معالجة الشرطات المائلة)
        let imageUrl = "https://via.placeholder.com/800x300?text=No+Image"; // صورة بديلة في حال الخطأ
        if (ad.image) {
            imageUrl = `https://api.tasswek.com/storage/${ad.image}`;
        }

        // بناء محتوى الإعلان
        displayArea.innerHTML = `
            <div class="ad-banner" style="background-image: url('${imageUrl}');">
                <div class="ad-overlay"></div>
                <div class="ad-content">
                    <h3 class="animate-title">${ad.title || ''}</h3>
                    <p class="animate-desc">${ad.description || ''}</p>
                    ${ad.btn_text ? `<button class="animate-btn" onclick="location.href='#'">${ad.btn_text}</button>` : ''}
                </div>
            </div>
        `;

    } catch (error) {
        console.error(error);
        displayArea.innerHTML = `<p style="color:red; text-align:center;">حدث خطأ في تحميل الإعلان</p>`;
    }
});