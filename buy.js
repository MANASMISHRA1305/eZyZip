// Complete Candle Data (including homepage products)
const candles = [
  // Homepage Featured Products
  { id: 1, name: "BLOOM GLOW", price: "Rs. 199", desc: "Beautiful rose-scented candle that brings warmth and romance to your space. Handcrafted with love and care.", img: "assets/rose.jpg" },
  { id: 2, name: "LAVENDER WAVES", price: "Rs. 199", desc: "Soothing lavender fragrance perfect for relaxation and stress relief. Creates a calming atmosphere.", img: "assets/purple-candle.jpg" },
  { id: 3, name: "ROSE CHARM", price: "Rs. 199", desc: "Elegant rose charm candle with a delicate floral aroma. Perfect for romantic evenings.", img: "assets/3-rose.jpg" },
  
  // Homepage "For You" Products
  { id: 4, name: "GOLDEN FLAME", price: "Rs. 199", desc: "Warm golden flame candle that illuminates your space with elegance. Premium quality wax.", img: "assets/1.jpg" },
  { id: 5, name: "VELVET ROSE", price: "Rs. 199", desc: "Luxurious velvet rose candle with rich, romantic fragrance. Handmade with premium materials.", img: "assets/2.jpg" },
  { id: 6, name: "PETAL RADIANCE", price: "Rs. 199", desc: "Radiant petal design candle that brightens any room. Beautiful decorative piece.", img: "assets/3.jpg" },
  { id: 7, name: "PASTEL BLOOM", price: "Rs. 199", desc: "Soft pastel bloom candle with gentle, calming fragrance. Perfect for relaxation.", img: "assets/5.jpg" },
  
  // Additional Products
  { id: 8, name: "JASMINE DREAMS", price: "Rs. 199", desc: "Elegant jasmine aroma with soothing glow. Creates a peaceful environment.", img: "assets/4.jpg" },
  { id: 9, name: "COFFEE BLISS", price: "Rs. 199", desc: "Rich coffee aroma, best for cozy evenings. Warm and inviting fragrance.", img: "assets/6.jpg" },
  { id: 10, name: "SANDALWOOD SERENITY", price: "Rs. 199", desc: "Classic sandalwood for calming ambience. Traditional and timeless scent.", img: "assets/glass-lily.jpg" },
  { id: 11, name: "WHITE ROSE ELEGANCE", price: "Rs. 199", desc: "Pure white rose candle with elegant fragrance. Sophisticated and beautiful.", img: "assets/white-rose.jpg" },
  { id: 12, name: "GLOW CANDLES WITH LOVE", price: "Rs. 199", desc: "Illuminate your world with our handcrafted glowing candles. Made with pure love.", img: "assets/orange.jpg" }
];

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

  // Newsletter form submission
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = this.querySelector('input[type="email"]').value;
      if (email) {
        alert('Thank you for subscribing to Glow Candles newsletter! 💌');
        this.reset();
      }
    });
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

  // Add animation on scroll
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

  // Observe elements for animation
  document.querySelectorAll('.product-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});

// Helper to select a product on the buy page without going to checkout
function selectProduct(productName) {
  loadProduct(productName);
  // Update URL for shareability
  const newUrl = `${window.location.pathname}?product=${encodeURIComponent(productName)}`;
  window.history.replaceState(null, '', newUrl);
  // Scroll to product details
  scrollToProduct();
}

// Function to get URL parameters
function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Quantity selector functions
function decreaseQuantity() {
  const quantityInput = document.getElementById('quantity');
  let quantity = parseInt(quantityInput.value);
  if (quantity > 1) {
    quantity--;
    quantityInput.value = quantity;
  }
}

function increaseQuantity() {
  const quantityInput = document.getElementById('quantity');
  let quantity = parseInt(quantityInput.value);
  quantity++;
  quantityInput.value = quantity;
}

// Add to cart with quantity
function addToCartWithQuantity(productName, productImage, productPrice) {
  const quantity = parseInt(document.getElementById('quantity').value);
  addToCart(productName, productImage, productPrice, quantity);
  
  // Show success message
  showNotification(`${productName} (${quantity} item${quantity > 1 ? 's' : ''}) added to cart!`);
}

// Show notification
function showNotification(message) {
  // Create notification element
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
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Load product by ID or name
function loadProduct(productId) {
  let product;
  
  // Try to find by ID first
  if (typeof productId === 'number') {
    product = candles.find(c => c.id === productId);
  } else {
    // Try to find by name (for homepage products)
    product = candles.find(c => c.name.toLowerCase() === productId.toLowerCase());
  }
  
  // If product not found, default to first product
  if (!product) {
    product = candles[0];
  }

  // Product detail with quantity selector and both buttons
  document.getElementById("product-detail").innerHTML = `
    <div class="product-image">
      <img src="${product.img}" alt="${product.name}">
    </div>
    <div class="product-info">
      <h2>${product.name}</h2>
      <p>${product.desc}</p>
      <p class="price">${product.price}</p>
      
      <!-- Quantity Selector -->
      <div class="quantity-selector">
        <label for="quantity">Quantity:</label>
        <div class="quantity-controls">
          <button type="button" onclick="decreaseQuantity()" class="quantity-btn">-</button>
          <input type="number" id="quantity" value="1" min="1" max="10" class="quantity-input">
          <button type="button" onclick="increaseQuantity()" class="quantity-btn">+</button>
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="product__action__buttons">
        <button class="btn buy-btn" onclick="buyNow('${product.name}', '${product.img}', '${product.price}', parseInt(document.getElementById('quantity').value))">
          <i class="ri-shopping-bag-line"></i> BUY NOW
        </button>
        <button class="btn add-cart-btn" onclick="addToCartWithQuantity('${product.name}', '${product.img}', '${product.price}')">
          <i class="ri-shopping-cart-line"></i> ADD TO CART
        </button>
      </div>
    </div>
  `;

  // Similar products (exclude current, pick 6 to show more options)
  const similar = candles.filter(c => c.id !== product.id);
  const similarProducts = similar.slice(0, 6);

  document.getElementById("similar-products").innerHTML = similarProducts.map(c => `
    <div class="product-card">
      <img src="${c.img}" alt="${c.name}" onclick="selectProduct('${c.name}')">
      <h3 onclick="selectProduct('${c.name}')">${c.name}</h3>
      <p class="price">${c.price}</p>
      <div class="product__buttons">
        <button class="btn buy-btn" onclick="selectProduct('${c.name}')">
          <i class="ri-refresh-line"></i> VIEW
        </button>
        <button class="btn add-cart-btn" onclick="addToCart('${c.name}', '${c.img}', '${c.price}')">
          <i class="ri-shopping-cart-line"></i> ADD TO CART
        </button>
      </div>
    </div>
  `).join("");

  // Re-observe new product cards for animation
  setTimeout(() => {
    document.querySelectorAll('.product-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      
      const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
      
      observer.observe(el);
    });
  }, 100);
}

// Load product on page load
document.addEventListener('DOMContentLoaded', function() {
  // Check for product parameter in URL
  const productParam = getUrlParameter('product');
  const productId = getUrlParameter('id');
  
  if (productParam) {
    // Load product by name (from homepage)
    loadProduct(productParam);
  } else if (productId) {
    // Load product by ID
    loadProduct(parseInt(productId));
  } else {
    // Default load (first candle)
    loadProduct(1);
  }
});

// Add smooth scroll behavior for product navigation
function scrollToProduct() {
  document.querySelector('.product-detail').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}

// Enhanced add to cart function with better UX
function addToCart(name, image, price, quantity = 1) {
  // Get existing cart or create new one
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  // Check if item already exists
  const existingItem = cart.find(item => item.name === name);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      name: name,
      image: image,
      price: price,
      quantity: quantity
    });
  }
  
  // Save to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update cart count
  updateCartCount();
  
  // Show notification
  showNotification(`${name} added to cart!`);
}

// Update cart count display
function updateCartCount() {
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
  }
}

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', function() {
  updateCartCount();
  
  // Add click event to cart icon
  const cartIcon = document.getElementById('cart-icon');
  if (cartIcon) {
    cartIcon.addEventListener('click', function() {
      window.location.href = 'cart.html';
    });
  }
});