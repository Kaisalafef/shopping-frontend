document.addEventListener("DOMContentLoaded", () => {
    
    
    const yearSpan = document.getElementById("year");
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    
    const role = localStorage.getItem("auth_role"); 
    
    const adminLinks = document.querySelectorAll(".admin-link");
    const clientLinks = document.querySelectorAll(".client-link");

    if (role === 'admin') {
        
        adminLinks.forEach(link => link.style.display = "block");
        clientLinks.forEach(link => link.style.display = "none");
    } else {
        
        adminLinks.forEach(link => link.style.display = "none");
        clientLinks.forEach(link => link.style.display = "block");
    }

    
    const footerLogoLink = document.querySelector(".footer-logo-link");
    if (footerLogoLink) {
        if (role === 'admin') {
            footerLogoLink.href = "/Home/admin_dashboard.html";
        } else {
            footerLogoLink.href = "/Home/client_dashboard.html";
        }
    }
});