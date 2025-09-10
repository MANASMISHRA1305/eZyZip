// Cart page functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Debug function
function debugCartPage() {
  console.log('Cart page - Current cart:', cart);
  console.log('Cart page - Cart length:', cart.length);
  console.log('Cart page - LocalStorage:', localStorage.getItem('cart'));
}

// Update cart count display
function updateCartCount() {
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    console.log('Cart page - Cart count updated:', totalItems);
  }
}

// Load cart items
function loadCartItems() {
  console.log('Loading cart items...');
  debugCartPage();
  
  const cartItemsContainer = document.getElementById('cart-items');
  const emptyCartDiv = document.getElementById('empty-cart');
  const cartSummaryDiv = document.getElementById('cart-summary');
  
  if (!cartItemsContainer || !emptyCartDiv || !cartSummaryDiv) {
    console.log('Cart elements not found');
    return;
  }
  
  if (cart.length === 0) {
    console.log('Cart is empty, showing empty message');
    cartItemsContainer.style.display = 'none';
    emptyCartDiv.style.display = 'block';
    cartSummaryDiv.style.display = 'none';
    return;
  }
  
  console.log('Cart has items, displaying them');
  cartItemsContainer.style.display = 'block';
  emptyCartDiv.style.display = 'none';
  cartSummaryDiv.style.display = 'block';
  
  cartItemsContainer.innerHTML = cart.map((item, index) => {
    // Extract price number from "Rs. 199" format
    const priceNumber = parseInt(item.price.replace(/[^\d]/g, ''));
    const itemTotal = priceNumber * item.quantity;
    
    console.log('Rendering item:', item, 'Total:', itemTotal);
    
    return `
      <div class="cart-item" data-index="${index}">
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
      </div>
    `;
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

// Remove item from cart
function removeItem(index) {
  if (confirm('Are you sure you want to remove this item from your cart?')) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCartItems();
    updateCartCount();
    showCartMessage('Item removed from cart!');
  }
}

// Update cart summary
function updateCartSummary() {
  const subtotal = cart.reduce((sum, item) => {
    const price = parseInt(item.price.replace(/[^\d]/g, ''));
    return sum + (price * item.quantity);
  }, 0);
  
  document.getElementById('subtotal').textContent = `Rs. ${subtotal}`;
  document.getElementById('total').textContent = `Rs. ${subtotal}`;
}

// Proceed to checkout
function proceedToCheckout() {
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  
  // For now, just show an alert. You can integrate with payment gateway later
  const total = cart.reduce((sum, item) => {
    const price = parseInt(item.price.replace(/[^\d]/g, ''));
    return sum + (price * item.quantity);
  }, 0);
  
  alert(`Proceeding to checkout!\n\nTotal Amount: Rs. ${total}\n\nThis is a demo. In a real application, this would redirect to a payment gateway.`);
}

// Show cart message
function showCartMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'cart-message';
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    z-index: 1000;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

// Initialize cart page
document.addEventListener('DOMContentLoaded', function() {
  console.log('Cart page loaded');
  debugCartPage();
  loadCartItems();
  updateCartCount();
  
  // Make cart icon clickable on cart page too
  const cartIcon = document.getElementById('cart-icon');
  if (cartIcon) {
    cartIcon.style.cursor = 'pointer';
    cartIcon.addEventListener('click', function() {
      window.location.href = 'cart.html';
    });
  }
});

// Add CSS animation for cart message
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);