// Checkout Page Functionality with Payment Gateway Integration

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

  // Initialize checkout
  initializeCheckout();
});

// API base (ensures calls hit backend even if site served from file:// or another port)
const API_BASE = 'http://localhost:5000';

// Initialize checkout functionality
function initializeCheckout() {
  loadOrderItems();
  updateOrderTotals();
  setupFormValidation();
  setupPaymentHandlers();
  updateCartCount();
  setupProgressIndicator();
}

// Load order items from cart
function loadOrderItems() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const orderItemsContainer = document.getElementById('order-items');
  
  if (cart.length === 0) {
    orderItemsContainer.innerHTML = `
      <div class="empty-cart">
        <i class="ri-shopping-cart-line"></i>
        <h3>Your cart is empty</h3>
        <p>Please add some items to your cart before checkout.</p>
        <a href="index.html" class="btn btn-primary">Continue Shopping</a>
      </div>
    `;
    return;
  }

  orderItemsContainer.innerHTML = cart.map(item => `
    <div class="order-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="order-item-details">
        <h4>${item.name}</h4>
        <p>Quantity: ${item.quantity}</p>
        <p class="order-item-price">${item.price}</p>
      </div>
    </div>
  `).join('');
}

// Update order totals
function updateOrderTotals() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  
  // Calculate subtotal
  let subtotal = 0;
  cart.forEach(item => {
    const price = parseFloat(item.price.replace('Rs. ', '').replace(',', ''));
    subtotal += price * item.quantity;
  });

  // Calculate GST (18%)
  const gst = subtotal * 0.18;
  
  // Calculate final total
  const finalTotal = subtotal + gst;

  // Update display
  document.getElementById('subtotal').textContent = `Rs. ${subtotal.toFixed(2)}`;
  document.getElementById('gst').textContent = `Rs. ${gst.toFixed(2)}`;
  document.getElementById('final-total').textContent = `Rs. ${finalTotal.toFixed(2)}`;
  document.getElementById('btn-total').textContent = `Rs. ${finalTotal.toFixed(2)}`;

  // Store totals for payment processing
  window.orderTotals = {
    subtotal: subtotal,
    gst: gst,
    total: finalTotal
  };
}

// Setup form validation
function setupFormValidation() {
  const form = document.getElementById('checkout-form');
  const inputs = form.querySelectorAll('input[required], textarea[required]');
  
  inputs.forEach(input => {
    // Real-time validation on input
    input.addEventListener('input', function() {
      clearFieldError({ target: this });
      // Validate as user types (with slight delay for better UX)
      clearTimeout(this.validationTimeout);
      this.validationTimeout = setTimeout(() => {
        if (this.value.trim().length > 0) {
          validateField({ target: this });
        }
      }, 500);
    });
    
    // Validation on blur
    input.addEventListener('blur', validateField);
    
    // Visual feedback on focus
    input.addEventListener('focus', function() {
      this.style.borderColor = 'var(--primary-color)';
      clearFieldError({ target: this });
    });
  });

  // Phone number validation with real-time formatting
  const phoneInput = document.getElementById('phone');
  phoneInput.addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
    if (this.value.length > 10) {
      this.value = this.value.slice(0, 10);
    }
    
    // Real-time validation
    clearFieldError({ target: this });
    if (this.value.length > 0) {
      validateField({ target: this });
    }
  });

  // PIN code validation with real-time formatting
  const pincodeInput = document.getElementById('pincode');
  pincodeInput.addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
    if (this.value.length > 6) {
      this.value = this.value.slice(0, 6);
    }
    
    // Real-time validation
    clearFieldError({ target: this });
    if (this.value.length > 0) {
      validateField({ target: this });
    }
  });

  // Name fields - only allow letters and spaces
  const nameInputs = document.querySelectorAll('input[name="firstName"], input[name="lastName"]');
  nameInputs.forEach(input => {
    input.addEventListener('input', function() {
      this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
      clearFieldError({ target: this });
      if (this.value.length > 0) {
        validateField({ target: this });
      }
    });
  });

  // City and State fields - only allow letters and spaces
  const locationInputs = document.querySelectorAll('input[name="city"], input[name="state"]');
  locationInputs.forEach(input => {
    input.addEventListener('input', function() {
      this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
      clearFieldError({ target: this });
      if (this.value.length > 0) {
        validateField({ target: this });
      }
    });
  });

  // Terms checkbox validation
  const termsCheckbox = document.getElementById('terms');
  termsCheckbox.addEventListener('change', function() {
    clearFieldError({ target: this });
    if (!this.checked) {
      showFieldError(this, 'You must accept the terms and conditions to proceed');
    }
  });

  // Add visual indicators for required fields
  addRequiredFieldIndicators();
}

// Add visual indicators for required fields
function addRequiredFieldIndicators() {
  const requiredFields = document.querySelectorAll('input[required], textarea[required]');
  
  requiredFields.forEach(field => {
    const label = field.parentNode.querySelector('label');
    if (label && !label.querySelector('.required-indicator')) {
      const indicator = document.createElement('span');
      indicator.className = 'required-indicator';
      indicator.textContent = ' *';
      indicator.style.color = '#dc3545';
      indicator.style.fontWeight = 'bold';
      label.appendChild(indicator);
    }
  });
}

// Setup progress indicator
function setupProgressIndicator() {
  const form = document.getElementById('checkout-form');
  const requiredFields = form.querySelectorAll('input[required], textarea[required]');
  const termsCheckbox = document.getElementById('terms');
  
  // Add progress tracking to all required fields
  requiredFields.forEach(field => {
    field.addEventListener('input', updateProgress);
    field.addEventListener('blur', updateProgress);
  });
  
  // Add progress tracking to terms checkbox
  termsCheckbox.addEventListener('change', updateProgress);
  
  // Initial progress update
  updateProgress();
}

// Update progress indicator
function updateProgress() {
  const form = document.getElementById('checkout-form');
  const requiredFields = form.querySelectorAll('input[required], textarea[required]');
  const termsCheckbox = document.getElementById('terms');
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
  
  let completedFields = 0;
  let totalFields = requiredFields.length + 1; // +1 for terms checkbox
  
  // Check required fields
  requiredFields.forEach(field => {
    if (field.value.trim() && validateField({ target: field })) {
      completedFields++;
    }
  });
  
  // Check terms checkbox
  if (termsCheckbox.checked) {
    completedFields++;
  }
  
  // Check UPI payment status if UPI is selected
  let upiPaymentRequired = false;
  if (paymentMethod && paymentMethod.value === 'upi') {
    upiPaymentRequired = true;
    totalFields++; // Add UPI payment as a requirement
    
    if (upiPaymentStatus.completed) {
      completedFields++;
    }
  }
  
  const percentage = Math.round((completedFields / totalFields) * 100);
  
  // Update progress bar
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const progressMessage = document.getElementById('progress-message');
  
  if (progressFill) {
    progressFill.style.width = percentage + '%';
  }
  
  if (progressText) {
    progressText.textContent = percentage + '% Complete';
  }
  
  if (progressMessage) {
    if (percentage === 100) {
      if (upiPaymentRequired && upiPaymentStatus.completed) {
        progressMessage.textContent = 'All requirements completed! UPI payment verified. You can now place your order.';
      } else {
        progressMessage.textContent = 'All fields completed! You can now place your order.';
      }
      progressMessage.className = 'progress-message complete';
    } else {
      let remainingFields = totalFields - completedFields;
      let message = `Please complete ${remainingFields} more requirement${remainingFields === 1 ? '' : 's'}`;
      
      if (upiPaymentRequired && !upiPaymentStatus.completed) {
        message += ' (including UPI payment verification)';
      }
      
      progressMessage.textContent = message + ' to place your order';
      progressMessage.className = 'progress-message';
    }
  }
  
  // Update place order button state
  const placeOrderBtn = document.getElementById('place-order-btn');
  if (placeOrderBtn) {
    if (percentage === 100) {
      placeOrderBtn.disabled = false;
      placeOrderBtn.style.opacity = '1';
    } else {
      placeOrderBtn.disabled = true;
      placeOrderBtn.style.opacity = '0.6';
    }
  }
}

// Validate individual field
function validateField(e) {
  const field = e.target;
  const value = field.value.trim();
  
  clearFieldError(e);
  
  if (!value) {
    showFieldError(field, 'This field is required');
    return false;
  }
  
  // Name validation
  if (field.name === 'firstName' || field.name === 'lastName') {
    if (value.length < 2) {
      showFieldError(field, 'Name must be at least 2 characters long');
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      showFieldError(field, 'Name can only contain letters and spaces');
      return false;
    }
  }
  
  // Email validation
  if (field.type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      showFieldError(field, 'Please enter a valid email address');
      return false;
    }
  }
  
  // Phone validation
  if (field.type === 'tel') {
    if (value.length !== 10) {
      showFieldError(field, 'Please enter a valid 10-digit phone number');
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(value)) {
      showFieldError(field, 'Please enter a valid Indian mobile number');
      return false;
    }
  }
  
  // Address validation
  if (field.name === 'address') {
    if (value.length < 10) {
      showFieldError(field, 'Please enter a complete address (at least 10 characters)');
      return false;
    }
  }
  
  // City validation
  if (field.name === 'city') {
    if (value.length < 2) {
      showFieldError(field, 'Please enter a valid city name');
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      showFieldError(field, 'City name can only contain letters and spaces');
      return false;
    }
  }
  
  // State validation
  if (field.name === 'state') {
    if (value.length < 2) {
      showFieldError(field, 'Please enter a valid state name');
      return false;
    }
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      showFieldError(field, 'State name can only contain letters and spaces');
      return false;
    }
  }
  
  // PIN code validation
  if (field.name === 'pincode') {
    if (value.length !== 6) {
      showFieldError(field, 'Please enter a valid 6-digit PIN code');
      return false;
    }
    if (!/^[1-9]\d{5}$/.test(value)) {
      showFieldError(field, 'Please enter a valid Indian PIN code');
      return false;
    }
  }
  
  return true;
}

// Show field error
function showFieldError(field, message) {
  clearFieldError({ target: field });
  
  field.style.borderColor = 'var(--danger)';
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  errorDiv.style.cssText = `
    color: var(--danger);
    font-size: 0.8rem;
    margin-top: 0.25rem;
    display: block;
  `;
  
  field.parentNode.appendChild(errorDiv);
}

// Clear field error
function clearFieldError(e) {
  const field = e.target;
  field.style.borderColor = '#e0e0e0';
  
  const errorDiv = field.parentNode.querySelector('.field-error');
  if (errorDiv) {
    errorDiv.remove();
  }
}

// Setup payment handlers
function setupPaymentHandlers() {
  const form = document.getElementById('checkout-form');
  
  // Handle payment method selection
  const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
  paymentMethods.forEach(method => {
    method.addEventListener('change', function() {
      toggleUPIQRCode();
    });
  });
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = document.getElementById('place-order-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="ri-loader-4-line"></i> Validating...';
    submitBtn.disabled = true;
    
    // Validate form with comprehensive checks
    setTimeout(() => {
      if (validateForm()) {
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        
        // Additional check for cart items
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
          showNotification('Your cart is empty! Please add items before checkout.', 'error');
          resetSubmitButton(submitBtn, originalText);
          return;
        }
        
        // Process payment based on method
        if (paymentMethod === 'razorpay') {
          processRazorpayPayment();
        } else if (paymentMethod === 'upi') {
          // Check if UPI payment is already completed
          if (upiPaymentStatus.completed) {
            processUPIOrder();
          } else {
            // UPI payment requires verification
            showNotification('Please scan the QR code and complete payment, then click "I have made the payment"', 'info');
            resetSubmitButton(submitBtn, originalText);
          }
        } else if (paymentMethod === 'cod') {
          processCODPayment();
        }
      } else {
        // Reset button if validation fails
        resetSubmitButton(submitBtn, originalText);
      }
    }, 500); // Small delay to show validation process
  });
}

// Toggle UPI QR Code section
function toggleUPIQRCode() {
  const upiQRSection = document.getElementById('upi-qr-section');
  const upiMethod = document.getElementById('upi');
  
  if (upiMethod && upiMethod.checked) {
    upiQRSection.style.display = 'block';
    updateQRAmount();
    updateUPIPaymentStatus();
  } else {
    upiQRSection.style.display = 'none';
    // Reset UPI payment status when switching away from UPI
    resetUPIPaymentStatus();
  }
}

// Update UPI Payment Status Display
function updateUPIPaymentStatus() {
  const upiQRSection = document.getElementById('upi-qr-section');
  if (!upiQRSection) return;
  
  // Remove existing status indicators
  const existingStatus = upiQRSection.querySelector('.payment-status');
  if (existingStatus) {
    existingStatus.remove();
  }
  
  // Add status indicator
  const statusDiv = document.createElement('div');
  statusDiv.className = 'payment-status';
  
  if (upiPaymentStatus.completed) {
    statusDiv.innerHTML = `
      <div class="status-completed">
        <i class="ri-checkbox-circle-line"></i>
        <span>Payment Verified Successfully!</span>
        <small>Payment ID: ${upiPaymentStatus.paymentId}</small>
      </div>
    `;
    statusDiv.style.cssText = `
      background: #d4edda;
      border: 2px solid #28a745;
      color: #155724;
      padding: 1rem;
      border-radius: 10px;
      margin-bottom: 1rem;
      text-align: center;
    `;
  } else {
    statusDiv.innerHTML = `
      <div class="status-pending">
        <i class="ri-time-line"></i>
        <span>Payment Pending - Complete payment to proceed</span>
        <small>Scan QR code and make payment, then click "I have made the payment"</small>
      </div>
    `;
    statusDiv.style.cssText = `
      background: #fff3cd;
      border: 2px solid #ffc107;
      color: #856404;
      padding: 1rem;
      border-radius: 10px;
      margin-bottom: 1rem;
      text-align: center;
    `;
  }
  
  // Insert status before payment confirmation button
  const confirmationDiv = upiQRSection.querySelector('.payment-confirmation');
  if (confirmationDiv) {
    upiQRSection.insertBefore(statusDiv, confirmationDiv);
  } else {
    upiQRSection.appendChild(statusDiv);
  }
}

// Update QR amount display
function updateQRAmount() {
  const qrAmountElement = document.getElementById('qr-amount');
  if (qrAmountElement && window.orderTotals) {
    qrAmountElement.textContent = `Rs. ${window.orderTotals.total.toFixed(2)}`;
  }
}

// Reset submit button
function resetSubmitButton(button, originalText) {
  button.innerHTML = originalText;
  button.disabled = false;
}

// UPI Payment Status Tracking
let upiPaymentStatus = {
  initiated: false,
  completed: false,
  paymentId: null,
  timestamp: null
};

// Confirm UPI Payment
function confirmUPIPayment() {
  // First validate the form before allowing UPI confirmation
  if (!validateForm()) {
    showNotification('Please complete all required fields before confirming payment', 'error');
    return;
  }
  
  // Check if UPI payment is already completed
  if (upiPaymentStatus.completed) {
    showNotification('Payment already confirmed! Processing your order...', 'success');
    processUPIOrder();
    return;
  }
  
  // Show payment verification dialog
  showUPIPaymentVerification();
}

// Show UPI Payment Verification Dialog
function showUPIPaymentVerification() {
  const verificationDialog = document.createElement('div');
  verificationDialog.id = 'upi-verification-dialog';
  verificationDialog.innerHTML = `
    <div class="verification-overlay">
      <div class="verification-content">
        <div class="verification-header">
          <i class="ri-shield-check-line"></i>
          <h3>UPI Payment Verification</h3>
        </div>
        <div class="verification-body">
          <p><strong>Please confirm that you have successfully completed the UPI payment:</strong></p>
          <div class="verification-steps">
            <div class="step">
              <i class="ri-qr-code-line"></i>
              <span>Scanned the QR code</span>
            </div>
            <div class="step">
              <i class="ri-smartphone-line"></i>
              <span>Entered amount: <strong id="verification-amount">Rs. 0</strong></span>
            </div>
            <div class="step">
              <i class="ri-checkbox-circle-line"></i>
              <span>Received payment confirmation</span>
            </div>
          </div>
          <div class="verification-actions">
            <button class="btn btn-success" onclick="verifyUPIPayment()">
              <i class="ri-checkbox-circle-line"></i> Yes, Payment Completed
            </button>
            <button class="btn btn-secondary" onclick="closeUPIVerification()">
              <i class="ri-close-line"></i> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add styles
  verificationDialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-out;
  `;
  
  document.body.appendChild(verificationDialog);
  
  // Update amount in verification dialog
  const amountElement = document.getElementById('verification-amount');
  if (amountElement && window.orderTotals) {
    amountElement.textContent = `Rs. ${window.orderTotals.total.toFixed(2)}`;
  }
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

// Verify UPI Payment
function verifyUPIPayment() {
  // Generate payment ID
  upiPaymentStatus.paymentId = 'UPI_' + Date.now();
  upiPaymentStatus.timestamp = new Date().toISOString();
  upiPaymentStatus.completed = true;
  
  // Close verification dialog
  closeUPIVerification();
  
  // Show payment confirmation
  showNotification('UPI Payment verified successfully! Processing your order...', 'success');
  
  // Process the order
  processUPIOrder();
}

// Process UPI Order
function processUPIOrder() {
  showLoadingOverlay();
  
  // Get form data
  const formData = getFormData();
  
  // Simulate UPI payment processing
  setTimeout(() => {
    hideLoadingOverlay();
    processOrderSuccess(formData, 'upi');
  }, 2000);
}

// Close UPI Verification Dialog
function closeUPIVerification() {
  const dialog = document.getElementById('upi-verification-dialog');
  if (dialog) {
    dialog.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      if (document.body.contains(dialog)) {
        document.body.removeChild(dialog);
      }
    }, 300);
  }
  
  // Restore body scroll
  document.body.style.overflow = 'auto';
}

// Reset UPI Payment Status
function resetUPIPaymentStatus() {
  upiPaymentStatus = {
    initiated: false,
    completed: false,
    paymentId: null,
    timestamp: null
  };
}

// Validate entire form
function validateForm() {
  const form = document.getElementById('checkout-form');
  const requiredFields = form.querySelectorAll('input[required], textarea[required]');
  let isValid = true;
  let missingFields = [];
  
  // Clear previous errors
  clearAllFieldErrors();
  
  // Validate each required field
  requiredFields.forEach(field => {
    if (!validateField({ target: field })) {
      isValid = false;
      missingFields.push(field.name || field.id);
    }
  });
  
  // Check terms and conditions
  const termsCheckbox = document.getElementById('terms');
  if (!termsCheckbox.checked) {
    isValid = false;
    showFieldError(termsCheckbox, 'You must accept the terms and conditions to proceed');
  }
  
  // Show comprehensive error message if validation fails
  if (!isValid) {
    showValidationAlert(missingFields, !termsCheckbox.checked);
  }
  
  return isValid;
}

// Clear all field errors
function clearAllFieldErrors() {
  const errorDivs = document.querySelectorAll('.field-error');
  errorDivs.forEach(div => div.remove());
  
  const fields = document.querySelectorAll('input, textarea');
  fields.forEach(field => {
    field.style.borderColor = '#e0e0e0';
  });
}

// Show comprehensive validation alert
function showValidationAlert(missingFields, termsNotAccepted) {
  let message = 'Please complete all required fields before placing your order:\n\n';
  
  if (missingFields.length > 0) {
    message += 'Missing Information:\n';
    missingFields.forEach(field => {
      const fieldName = getFieldDisplayName(field);
      message += `• ${fieldName}\n`;
    });
  }
  
  if (termsNotAccepted) {
    message += '\n• Terms and Conditions Agreement';
  }
  
  message += '\n\nPlease fill all the requirements and accept the agreement to confirm your order.';
  
  showNotification(message, 'error');
  
  // Also show a persistent alert at the top of the form
  showPersistentValidationAlert();
}

// Get display name for field
function getFieldDisplayName(fieldName) {
  const fieldNames = {
    'firstName': 'First Name',
    'lastName': 'Last Name',
    'email': 'Email Address',
    'phone': 'Phone Number',
    'address': 'Shipping Address',
    'city': 'City',
    'state': 'State',
    'pincode': 'PIN Code',
    'country': 'Country'
  };
  return fieldNames[fieldName] || fieldName;
}

// Show persistent validation alert
function showPersistentValidationAlert() {
  // Remove existing alert if any
  const existingAlert = document.getElementById('validation-alert');
  if (existingAlert) {
    existingAlert.remove();
  }
  
  const alert = document.createElement('div');
  alert.id = 'validation-alert';
  alert.innerHTML = `
    <div class="validation-alert-content">
      <i class="ri-error-warning-line"></i>
      <div class="alert-text">
        <h4>Complete All Requirements</h4>
        <p>Please fill all required fields and accept the terms and conditions to place your order.</p>
      </div>
      <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
        <i class="ri-close-line"></i>
      </button>
    </div>
  `;
  
  alert.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: #dc3545;
    color: white;
    padding: 1rem;
    border-radius: 10px;
    box-shadow: 0 5px 20px rgba(220, 53, 69, 0.3);
    z-index: 1000;
    max-width: 90%;
    width: 500px;
    animation: slideDown 0.3s ease-out;
  `;
  
  document.body.appendChild(alert);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (document.body.contains(alert)) {
      alert.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => {
        if (document.body.contains(alert)) {
          alert.remove();
        }
      }, 300);
    }
  }, 10000);
}

// Process Razorpay Payment
function processRazorpayPayment() {
  showLoadingOverlay();
  
  // Get form data
  const formData = getFormData();
  
  // Create order data
  const orderData = {
    amount: Math.round(window.orderTotals.total * 100), // Convert to paise
    currency: 'INR',
    receipt: 'order_' + Date.now(),
    notes: {
      customer_name: `${formData.firstName} ${formData.lastName}`,
      customer_email: formData.email,
      customer_phone: formData.phone,
      shipping_address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`
    }
  };
  
  // Razorpay options
  const options = {
    key: 'rzp_test_1DP5mmOlF5G5ag', // Replace with your Razorpay key
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'Glow Candles',
    description: 'Handmade Decorative Candles',
    image: 'assets/LOGO.jpg',
    order_id: '', // This will be set after creating order
    handler: function(response) {
      // Payment successful
      processPaymentSuccess(response, formData);
    },
    prefill: {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      contact: formData.phone
    },
    notes: orderData.notes,
    theme: {
      color: '#e8c696'
    },
    modal: {
      ondismiss: function() {
        hideLoadingOverlay();
        showNotification('Payment cancelled', 'warning');
      }
    }
  };
  
  // For demo purposes, we'll simulate a successful payment
  // In production, you would create an order on your server first
  setTimeout(() => {
    hideLoadingOverlay();
    
    // Simulate successful payment
    const mockResponse = {
      razorpay_payment_id: 'pay_' + Date.now(),
      razorpay_order_id: 'order_' + Date.now(),
      razorpay_signature: 'signature_' + Date.now()
    };
    
    processPaymentSuccess(mockResponse, formData);
  }, 2000);
}

// Process Cash on Delivery
function processCODPayment() {
  showLoadingOverlay();
  
  // Get form data
  const formData = getFormData();
  
  // Simulate order processing
  setTimeout(() => {
    hideLoadingOverlay();
    processOrderSuccess(formData, 'cod');
  }, 1500);
}

// Process successful payment
async function processPaymentSuccess(paymentResponse, formData) {
  // Build payload for backend
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const payload = {
    items: cartItems.map(it => ({ name: it.name, image: it.image, price: it.price, quantity: it.quantity })),
    shippingAddress: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      country: formData.country
    },
    payment: {
      method: 'razorpay',
      paymentId: paymentResponse.razorpay_payment_id || null
    }
  };

  try {
    await fetch(`${API_BASE}/api/orders/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    // ignore to not block UX
  }

  // Clear cart and redirect
  localStorage.removeItem('cart');
  window.location.href = 'order-success.html';
}

// Process order success (for COD)
async function processOrderSuccess(formData, paymentMethod) {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  const payload = {
    items: cartItems.map(it => ({ name: it.name, image: it.image, price: it.price, quantity: it.quantity })),
    shippingAddress: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      country: formData.country
    },
    payment: {
      method: paymentMethod
    }
  };

  try {
    await fetch(`${API_BASE}/api/orders/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    // ignore
  }

  localStorage.removeItem('cart');
  window.location.href = 'order-success.html';
}

// Get form data
function getFormData() {
  const form = document.getElementById('checkout-form');
  const formData = new FormData(form);
  
  return {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    city: formData.get('city'),
    state: formData.get('state'),
    pincode: formData.get('pincode'),
    country: formData.get('country'),
    paymentMethod: formData.get('paymentMethod')
  };
}

// Show loading overlay
function showLoadingOverlay() {
  document.getElementById('loading-overlay').classList.add('show');
  document.getElementById('place-order-btn').disabled = true;
}

// Hide loading overlay
function hideLoadingOverlay() {
  document.getElementById('loading-overlay').classList.remove('show');
  document.getElementById('place-order-btn').disabled = false;
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  const colors = {
    success: 'var(--success)',
    error: 'var(--danger)',
    warning: '#ffc107',
    info: '#17a2b8'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
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
  
  // Remove after 4 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// Update cart count
function updateCartCount() {
  const cartCount = document.getElementById('cart-count');
  if (cartCount) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
  }
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
