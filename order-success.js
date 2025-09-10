// Order Success Page Functionality

// Mobile Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIcon = mobileMenuBtn.querySelector('i');

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

  // Initialize order success page
  initializeOrderSuccess();
});

// Initialize order success page
function initializeOrderSuccess() {
  loadOrderDetails();
  updateCartCount();
  setupConfetti();
  setupSocialShare();
}

// Load order details
function loadOrderDetails() {
  const orderDetails = JSON.parse(localStorage.getItem('lastOrder'));
  const orderDetailsContainer = document.getElementById('order-details');
  
  if (!orderDetails) {
    // Redirect to home if no order found
    window.location.href = 'index.html';
    return;
  }

  // Format order date
  const orderDate = new Date(orderDetails.date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate total items
  const totalItems = orderDetails.items.reduce((sum, item) => sum + item.quantity, 0);

  orderDetailsContainer.innerHTML = `
    <h3>Order Details</h3>
    <div class="detail-row">
      <span class="detail-label">Order ID:</span>
      <span class="detail-value">${orderDetails.orderId}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Order Date:</span>
      <span class="detail-value">${orderDate}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Payment Method:</span>
      <span class="detail-value">${orderDetails.paymentMethod === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Total Items:</span>
      <span class="detail-value">${totalItems}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Order Total:</span>
      <span class="detail-value">Rs. ${orderDetails.amount.toFixed(2)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Shipping Address:</span>
      <span class="detail-value">${orderDetails.customer.address}, ${orderDetails.customer.city}, ${orderDetails.customer.state} - ${orderDetails.customer.pincode}</span>
    </div>
  `;

  // Store order details for social sharing
  window.currentOrder = orderDetails;
}

// Update cart count (should be 0 after successful order)
function updateCartCount() {
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    cartCount.textContent = '0';
  }
}

// Setup confetti animation
function setupConfetti() {
  // Simple confetti effect using CSS animations
  const confettiContainer = document.createElement('div');
  confettiContainer.className = 'confetti-container';
  confettiContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1000;
    overflow: hidden;
  `;

  // Create confetti pieces
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.cssText = `
      position: absolute;
      width: 10px;
      height: 10px;
      background: ${getRandomColor()};
      left: ${Math.random() * 100}%;
      animation: confetti-fall ${2 + Math.random() * 3}s linear forwards;
      animation-delay: ${Math.random() * 2}s;
    `;
    confettiContainer.appendChild(confetti);
  }

  document.body.appendChild(confettiContainer);

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes confetti-fall {
      0% {
        transform: translateY(-100vh) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Remove confetti after animation
  setTimeout(() => {
    if (document.body.contains(confettiContainer)) {
      document.body.removeChild(confettiContainer);
    }
    if (document.head.contains(style)) {
      document.head.removeChild(style);
    }
  }, 5000);
}

// Get random color for confetti
function getRandomColor() {
  const colors = ['#e8c696', '#ffb667', '#28a745', '#dc3545', '#007bff', '#6f42c1'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Setup social sharing
function setupSocialShare() {
  const socialLinks = document.querySelectorAll('.social-link');
  
  socialLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const platform = this.classList.contains('instagram') ? 'instagram' : 'facebook';
      const orderDetails = window.currentOrder;
      
      if (orderDetails) {
        const message = `Just ordered beautiful candles from Glow Candles! 🕯️✨ Order #${orderDetails.orderId} - Can't wait for them to arrive! #GlowCandles #HandmadeCandles #CandleLove`;
        
        if (platform === 'instagram') {
          // For Instagram, we'll open the app or web version
          window.open('https://www.instagram.com/glow_candels01?igsh=OTc0MTdzOGlmbHIz', '_blank');
        } else if (platform === 'facebook') {
          // For Facebook, we'll use the share dialog
          const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(message)}`;
          window.open(shareUrl, '_blank', 'width=600,height=400');
        }
      }
    });
  });
}

// Add click event to cart icon
document.addEventListener('DOMContentLoaded', function() {
  const cartIcon = document.getElementById('cart-icon');
  if (cartIcon) {
    cartIcon.addEventListener('click', function() {
      window.location.href = 'cart.html';
    });
  }
});

// Newsletter form submission
document.addEventListener('DOMContentLoaded', function() {
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
});

// Show notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--success);
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

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Add some interactive animations
document.addEventListener('DOMContentLoaded', function() {
  // Animate success icon on load
  const successIcon = document.querySelector('.success-icon i');
  if (successIcon) {
    successIcon.style.animation = 'bounce 1s ease-in-out';
  }

  // Animate steps on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe steps for animation
  document.querySelectorAll('.step').forEach((step, index) => {
    step.style.opacity = '0';
    step.style.transform = 'translateY(30px)';
    step.style.transition = `opacity 0.6s ease ${index * 0.2}s, transform 0.6s ease ${index * 0.2}s`;
    observer.observe(step);
  });
});

// Add order tracking functionality (for future enhancement)
function trackOrder() {
  const orderDetails = window.currentOrder;
  if (orderDetails) {
    // In a real application, this would make an API call to track the order
    console.log('Tracking order:', orderDetails.orderId);
    
    // For demo purposes, show a message
    showNotification('Order tracking feature coming soon! 📦');
  }
}

// Add reorder functionality
function reorderItems() {
  const orderDetails = window.currentOrder;
  if (orderDetails && orderDetails.items) {
    // Add items back to cart
    localStorage.setItem('cart', JSON.stringify(orderDetails.items));
    
    // Show notification
    showNotification('Items added to cart! You can modify quantities before checkout.');
    
    // Redirect to cart
    setTimeout(() => {
      window.location.href = 'cart.html';
    }, 1500);
  }
}
