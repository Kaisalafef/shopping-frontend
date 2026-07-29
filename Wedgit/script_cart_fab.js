/* ==========================================================================
   FLOATING CART BUTTON (FAB) — script_cart_fab.js
   Injects the widget markup so no per-page HTML edits are required.
   Mirrors the role logic already used in script_header.js: hidden for
   admins, hidden on the cart page itself, visible everywhere else.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "https://api.tasswek.com/api";
    const role = localStorage.getItem("auth_role");
    const token = localStorage.getItem("token");

    // Admins manage the store from the dashboard, not a shopping cart —
    // keep the FAB out of their way, same rule the header already applies.
    if (role === "admin") return;

    // Don't show a "go to cart" button while the user is already on the
    // cart page.
    if (/\/Cart\/Cart\.html/i.test(window.location.pathname)) return;

    // Avoid double-injection if this script is accidentally included twice.
    if (document.getElementById("cartFab")) return;

    const fab = document.createElement("a");
    fab.id = "cartFab";
    fab.className = "cart-fab";
    fab.href = "/Cart/Cart.html";
    fab.setAttribute("aria-label", "الذهاب إلى سلة المشتريات");
    fab.innerHTML = `
        <i class="fas fa-shopping-cart" aria-hidden="true"></i>
        <span id="cartFabBadge" class="cart-fab-badge" hidden>0</span>
    `;

    document.body.appendChild(fab);

    // Trigger the entrance animation on the next frame.
    requestAnimationFrame(() => fab.classList.add("is-visible"));

    const badge = document.getElementById("cartFabBadge");

    function setBadgeCount(count) {
        const n = Number(count) || 0;
        if (n <= 0) {
            badge.hidden = true;
            return;
        }
        badge.hidden = false;
        badge.textContent = n > 99 ? "99+" : String(n);
        badge.classList.remove("bump");
        // restart the bump animation
        void badge.offsetWidth;
        badge.classList.add("bump");
    }

    async function refreshCartCount() {
        if (!token) return; // guest: no badge, FAB still links to login-gated cart
        try {
            const res = await fetch(`${API_URL}/cart`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("bad response");
            const cart = await res.json();
            const items = cart.cart_item || [];
            const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
            setBadgeCount(totalQty);
        } catch (err) {
            console.error("تعذر تحديث عداد السلة", err);
        }
    }

    refreshCartCount();

    // Let other scripts (Product.html's "add to cart", Cart.js mutations)
    // notify the FAB without a page reload:
    //   window.dispatchEvent(new CustomEvent("cart:updated"))
    window.addEventListener("cart:updated", refreshCartCount);
});