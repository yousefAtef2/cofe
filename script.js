/* ============================================
   COFFEE SHOP - ELITE COFFEE
   JavaScript Logic - Cart, Orders, UI
   ============================================ */

// ============================================
// CART SYSTEM
// ============================================
let cart = JSON.parse(localStorage.getItem('eliteCart')) || [];
let discount = 0;
const DELIVERY_FEE = 15;

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('eliteCart', JSON.stringify(cart));
    updateCartUI();
}

// Add item to cart
function addToCart(id) {
    const item = document.querySelector(`[data-id="${id}"]`);
    if (!item) return;

    const name = item.dataset.name;
    const price = parseFloat(item.dataset.price);
    const image = item.dataset.image;

    const existingItem = cart.find(i => i.id === id);

    if (existingItem) {
        existingItem.qty += 1;
    } else {
        cart.push({ id, name, price, image, qty: 1 });
    }

    saveCart();
    showNotification(`تم إضافة ${name} للسلة`);

    // Animate cart icon
    const cartIcons = document.querySelectorAll('.cart-icon, .cart-floating');
    cartIcons.forEach(icon => {
        icon.style.transform = 'scale(1.3)';
        setTimeout(() => icon.style.transform = '', 200);
    });
}

// Remove item from cart
function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    renderCart();
}

// Update quantity
function updateQty(id, change) {
    const item = cart.find(i => i.id === id);
    if (!item) return;

    item.qty += change;

    if (item.qty <= 0) {
        removeFromCart(id);
        return;
    }

    saveCart();
    renderCart();
}

// Clear cart
function clearCart() {
    if (cart.length === 0) return;

    if (confirm('هل أنت متأكد من إفراغ السلة؟')) {
        cart = [];
        discount = 0;
        saveCart();
        renderCart();
        updateSummary();
    }
}

// Update cart count badges
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    const counts = document.querySelectorAll('.cart-count, .cart-floating-count');
    counts.forEach(count => {
        count.textContent = totalItems;
        count.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

// Render cart items on order page
function renderCart() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <i class="fas fa-shopping-basket"></i>
                <h3>السلة فاضية</h3>
                <p>اختار من قائمتنا اللذيذة وأضف لسلتك</p>
                <a href="menu.html" class="btn btn-primary">تصفح القائمة</a>
            </div>
        `;
        updateSummary();
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p class="item-price">${item.price} ج.م</p>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn" onclick="updateQty(${item.id}, -1)">-</button>
                <span class="qty-value">${item.qty}</span>
                <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
                <button class="btn-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');

    updateSummary();
}

// Update order summary
function updateSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountAmount = subtotal * discount;
    const total = subtotal - discountAmount + DELIVERY_FEE;

    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    const discountRow = document.getElementById('discountRow');
    const discountAmountEl = document.getElementById('discountAmount');

    if (subtotalEl) subtotalEl.textContent = `${subtotal} ج.م`;
    if (totalEl) totalEl.textContent = `${Math.max(0, total)} ج.م`;

    if (discount > 0 && discountRow && discountAmountEl) {
        discountRow.style.display = 'flex';
        discountAmountEl.textContent = `-${discountAmount} ج.م`;
    } else if (discountRow) {
        discountRow.style.display = 'none';
    }
}

// Apply promo code
function applyPromo() {
    const input = document.getElementById('promoCode');
    const code = input.value.trim().toUpperCase();

    const validCodes = {
        'COFFEE20': 0.20,
        'WELCOME10': 0.10,
        'ELITE15': 0.15
    };

    if (validCodes[code]) {
        discount = validCodes[code];
        updateSummary();
        showNotification(`تم تطبيق خصم ${discount * 100}%`);
        input.value = '';
    } else {
        showNotification('كود الخصم غير صحيح', 'error');
    }
}

// ============================================
// MENU FILTER
// ============================================
function initMenuFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const categories = document.querySelectorAll('.menu-category');

    if (!filterBtns.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            categories.forEach(cat => {
                if (filter === 'all' || cat.dataset.category === filter) {
                    cat.style.display = 'block';
                    cat.style.animation = 'fadeInUp 0.4s ease';
                } else {
                    cat.style.display = 'none';
                }
            });
        });
    });
}

// ============================================
// CHECKOUT
// ============================================
function submitOrder(e) {
    e.preventDefault();

    if (cart.length === 0) {
        showNotification('السلة فاضية! أضف منتجات الأول', 'error');
        return;
    }

    const name = document.getElementById('customerName').value;
    const phone = document.getElementById('customerPhone').value;
    const address = document.getElementById('customerAddress').value;

    if (!name || !phone || !address) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    // Generate order number
    const orderNum = '#' + Math.floor(10000 + Math.random() * 90000);
    document.getElementById('orderNumber').textContent = orderNum;

    // Show success modal
    const modal = document.getElementById('successModal');
    modal.classList.add('active');

    // Clear cart
    cart = [];
    discount = 0;
    saveCart();

    // Reset form
    document.getElementById('checkoutForm').reset();
}

// ============================================
// NOTIFICATION
// ============================================
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    // Styles
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        left: 50%;
        transform: translateX(-50%) translateY(-20px);
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 14px 28px;
        border-radius: 50px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 600;
        font-size: 14px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 3000;
        opacity: 0;
        transition: all 0.3s ease;
        direction: rtl;
    `;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.padding = '10px 0';
            navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.padding = '15px 0';
            navbar.style.boxShadow = 'none';
        }

        lastScroll = currentScroll;
    });
}

// ============================================
// SCROLL REVEAL ANIMATION
// ============================================
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.feature-card, .popular-item, .menu-item, .about-image, .about-content');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        revealObserver.observe(el);
    });
}

// ============================================
// SMOOTH SCROLL FOR ANCHORS
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ============================================
// CLOSE MODAL ON BACKDROP CLICK
// ============================================
function initModalClose() {
    const modal = document.getElementById('successModal');
    if (!modal) return;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    renderCart();
    initMenuFilter();
    initNavbarScroll();
    initScrollReveal();
    initSmoothScroll();
    initModalClose();

    // Promo code enter key
    const promoInput = document.getElementById('promoCode');
    if (promoInput) {
        promoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyPromo();
            }
        });
    }
})