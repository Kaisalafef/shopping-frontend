

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
