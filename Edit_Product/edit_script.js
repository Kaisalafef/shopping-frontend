


const categoryTitles = {
    'electronics': 'الإلكترونيات',
    'food': 'المواد الغذائية',
    'meals': 'المأكولات',
    'makeup': 'مستحضرات التجميل',
    'men': 'أزياء رجالية',
    'women': 'أزياء نسائية',
    'perfume': 'العطور',
    'cleaning': 'المنظفات',
    'furniture': 'المفروشات',
    'sweets': 'الحلويات'
};

  
  
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
document.addEventListener('DOMContentLoaded', async () => {
    
    populateCategories();

    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('editId');

    
    if (productId) {
        enableEditMode(productId);
    } else {
        
        const saveBtn = document.getElementById('saveBtn');
        if(saveBtn) {
            saveBtn.addEventListener('click', () => {
                
                showToast('وضع الإضافة الجديدة', 'warning');
            });
        }
    }
});


function populateCategories() {
    const categorySelect = document.getElementById('category');
    
    
    if (!categorySelect) return;

    
    for (const [key, title] of Object.entries(categoryTitles)) {
        const option = document.createElement('option');
        option.value = key;       
        option.textContent = title; 
        categorySelect.appendChild(option);
    }
}

async function enableEditMode(id) {
    
    const title = document.querySelector('h1') || document.getElementById('pageTitle');
    
    
    const submitBtn = document.getElementById('saveBtn'); 

    if (title) title.textContent = "تعديل المنتج";
    if (submitBtn) submitBtn.textContent = "حفظ التعديلات";

    try {
        
        const response = await fetch(`https://api.tasswek.com/api/products/${id}`, {
            headers: {
                'Accept': 'application/json',
                
            }
        });

        if (!response.ok) throw new Error('فشل جلب بيانات المنتج');

        const result = await response.json();
        const product = result.data || result;

        
        const titleInput = document.getElementById('title');
        if (titleInput) titleInput.value = product.name;

        const priceInput = document.getElementById('price');
        if (priceInput) priceInput.value = product.price;

        const descInput = document.getElementById('description');
        if (descInput) descInput.value = product.description;

        
        const categorySelect = document.getElementById('category');
        if (categorySelect) categorySelect.value = product.category;

        const brandInput = document.getElementById('brand');
        if (brandInput) brandInput.value = product.brand;

        
        if(submitBtn) {
            setupUpdateAction(id, submitBtn);
        }

    } catch (error) {
        console.error('Error fetching product:', error);
        showToast('حدث خطأ أثناء تحميل بيانات المنتج للتعديل',"error");
    }
}

function setupUpdateAction(id, btn) {
    
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const form = document.getElementById('productForm');
        const formData = new FormData(form);
        formData.append('_method', 'PUT');

        try {
            const response = await fetch(`https://api.tasswek.com/api/products/${id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                },
                body: formData
            });

            if (response.ok) {
                showToast('"تم تعديل المنتج بنجاح','success')
                
                setTimeout(() => {
                    window.location.href = '/Proudcts/Products.html?role=admin';
                }, 1000);
            } else {
                const err = await response.json();
                showToast('فشل التعديل: ' + (err.message || 'تأكد من البيانات'),'error');
            }
        } catch (error) {
            console.error(error);
            showToast('خطأ في الاتصال','error');
        }
    });
}