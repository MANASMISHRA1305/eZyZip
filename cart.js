// Enhanced Cart Functionality with Checkout Integration

// Mobile Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIcon = mobileMenuBtn ? mobileMenuBtn.querySelector('i') : null;

  if (mobileMenuBtn && mobileMenu && menuIcon) {
    // Toggle mobile menu
    mobileMenuBtn.addEventListener('click', function() {
      mobileMenu.classList.toggle('open');
      
      // Change icon
      const isOpen = mobileMenu.classList.contains('open');
      menuIcon.setAttribute('class', isOpen ? 'ri-close-line' : 'ri-menu-line');
    });

    // Close mobile menu when clicking on a link
    mobileMenu.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') {
        mobileMenu.classList.remove('open');
        menuIcon.setAttribute('class', 'ri-menu-line');
      }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
        menuIcon.setAttribute('class', 'ri-menu-line');
      }
    });
  }

  // Initialize cart functionality
  initializeCart();
});

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

console.log('Cart.js loaded');
console.log('Current cart:', cart);

// Initialize cart
function initializeCart() {
  updateCartCount();
  
  // Add click event to cart icon
  const cartIcon = document.getElementById('cart-icon');
  if (cartIcon) {
    cartIcon.style.cursor = 'pointer';
    cartIcon.addEventListener('click', function() {
      console.log('Cart icon clicked, redirecting to cart.html');
      window.location.href = 'cart.html';
    });
  }

  // Load cart items if on cart page
  if (window.location.pathname.includes('cart.html')) {
    loadCartItems();
  }

  // Newsletter form submission
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = this.querySelector('input[type="email"]').value;
      if (email) {
        showNotification('Thank you for subscribing to Glow Candles newsletter! 💌');
        this.reset();
      }
    });
  }
}

// Add item to cart
function addToCart(name, image, price, quantity = 1) {
  console.log('Adding to cart:', { name, image, price, quantity });
  
  const existingItem = cart.find(item => item.name === name);
  
  if (existingItem) {
    existingItem.quantity += quantity;
    console.log('Updated existing item:', existingItem);
  } else {
    const newItem = {
      name: name,
      image: image,
      price: price,
      quantity: quantity
    };
    cart.push(newItem);
    console.log('Added new item:', newItem);
  }
  
  // Save to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  console.log('Cart saved to localStorage');
  
  // Update cart count
  updateCartCount();
  
  // Show success message
  showNotification(`${name} added to cart!`);
}

// Update cart count display
function updateCartCount() {
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    console.log('Cart count updated:', totalItems);
  }
}

// Load cart items (for cart page)
function loadCartItems() {
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyCartDiv = document.getElementById('empty-cart');
  const cartSummaryDiv = document.getElementById('cart-summary');
  
  if (!cartItemsContainer || !emptyCartDiv || !cartSummaryDiv) {
    return; // Not on cart page
  }

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '';
    emptyCartDiv.style.display = 'block';
    cartSummaryDiv.style.display = 'none';
    return;
  }

  emptyCartDiv.style.display = 'none';
  cartSummaryDiv.style.display = 'block';
  
  cartItemsContainer.innerHTML = cart.map((item, index) => {
    const priceNumber = parseInt(item.price.replace(/[^\d]/g, ''));
    const itemTotal = priceNumber * item.quantity;
    return `
      <div class="cart-item">
        <div class="cart-item-number">${index + 1}</div>
        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${item.price}</div>
        </div>
        <div class="cart-item-quantity">
          <button class="quantity-btn" onclick="decreaseQuantity(${index})">-</button>
          <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="10" onchange="updateQuantity(${index}, this.value)">
          <button class="quantity-btn" onclick="increaseQuantity(${index})">+</button>
        </div>
        <div class="cart-item-total">Rs. ${itemTotal}</div>
        <button class="remove-btn" onclick="removeItem(${index})">
          <i class="ri-delete-bin-line"></i> Remove
        </button>
      </div>`;
  }).join('');
  
  updateCartSummary();
}

// Update quantity
function updateQuantity(index, newQuantity) {
  if (newQuantity < 1) newQuantity = 1;
  if (newQuantity > 10) newQuantity = 10;
  cart[index].quantity = parseInt(newQuantity);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCartItems();
  updateCartCount();
}

// Increase quantity
function increaseQuantity(index) {
  if (cart[index].quantity < 10) {
    cart[index].quantity++;
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems();
    updateCartCount();
  }
}

// Decrease quantity
function decreaseQuantity(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity--;
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems();
    updateCartCount();
  }
}

// Remove item
function removeItem(index) {
  if (confirm('Are you sure you want to remove this item from your cart?')) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems();
    updateCartCount();
    showNotification('Item removed from cart');
  }
}

// Update cart summary
function updateCartSummary() {
  const subtotal = cart.reduce((sum, item) => {
    const price = parseInt(item.price.replace(/[^\d]/g, ''));
    return sum + (price * item.quantity);
  }, 0);

  const gst = subtotal * 0.18; // 18% GST
  const total = subtotal + gst;

  const subtotalElement = document.getElementById('subtotal');
  const gstElement = document.getElementById('gst');
  const totalElement = document.getElementById('total');

  if (subtotalElement) subtotalElement.textContent = `Rs. ${subtotal.toFixed(2)}`;
  if (gstElement) gstElement.textContent = `Rs. ${gst.toFixed(2)}`;
  if (totalElement) totalElement.textContent = `Rs. ${total.toFixed(2)}`;
}

// Proceed to checkout
function proceedToCheckout() {
  if (cart.length === 0) {
    showNotification('Your cart is empty!', 'error');
    return;
  }

  // Redirect to checkout page
  window.location.href = 'checkout.html';
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  const colors = {
    success: 'var(--success)',
    error: 'var(--danger)',
    warning: '#ffc107'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.success};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    font-weight: 600;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
  `;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Buy now function (redirects to checkout with single item)
function buyNow(name, image, price, quantity = 1) {
  const currentPath = window.location.pathname;
  const isOnBuyPage = currentPath.includes('buy.html');

  if (isOnBuyPage) {
    // Proceed to checkout with selected item
    cart = [{
      name: name,
      image: image,
      price: price,
      quantity: quantity
    }];

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    window.location.href = 'checkout.html';
  } else {
    // From other pages (e.g., homepage), go to detailed buy page with product preselected
    const productParam = encodeURIComponent(name);
    window.location.href = `buy.html?product=${productParam}`;
  }
}

// Make functions globally available
window.addToCart = addToCart;
window.buyNow = buyNow;
window.proceedToCheckout = proceedToCheckout;
window.updateQuantity = updateQuantity;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.removeItem = removeItem;