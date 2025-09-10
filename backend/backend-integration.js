// Frontend Backend Integration for Glow Candles
// This file integrates your existing frontend with the new backend

const API_BASE_URL = 'http://localhost:5000/api';
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// Initialize backend integration
document.addEventListener('DOMContentLoaded', function() {
    initializeBackendIntegration();
});

// Backend Integration Functions
async function initializeBackendIntegration() {
    // Check if user is logged in
    if (authToken && currentUser) {
        console.log('User logged in:', currentUser);
        updateUIForLoggedInUser();
    } else {
        console.log('User not logged in');
        updateUIForGuestUser();
    }
}

// User Authentication Functions
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.status === 'success') {
            authToken = data.data.token;
            currentUser = data.data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateUIForLoggedInUser();
            showNotification('Login successful!', 'success');
            return true;
        } else {
            showNotification(data.message, 'error');
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
        return false;
    }
}

async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (data.status === 'success') {
            authToken = data.data.token;
            currentUser = data.data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            updateUIForLoggedInUser();
            showNotification('Registration successful!', 'success');
            return true;
        } else {
            showNotification(data.message, 'error');
            return false;
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
        return false;
    }
}

function logoutUser() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    updateUIForGuestUser();
    showNotification('Logged out successfully!', 'success');
    
    // Reload page to reset UI
    window.location.reload();
}

// Cart Functions with Backend Integration
async function loadCartFromBackend() {
    if (currentUser && authToken) {
        try {
            const response = await fetch(`${API_BASE_URL}/cart`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.data.cart.items || [];
            }
        } catch (error) {
            console.error('Error loading cart from backend:', error);
        }
    }
    
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem('cart')) || [];
}

async function saveCartToBackend(cartItems) {
    // Always save to localStorage first
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    if (currentUser && authToken) {
        try {
            // Clear existing cart items
            await fetch(`${API_BASE_URL}/cart`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            // Add new items
            for (const item of cartItems) {
                await fetch(`${API_BASE_URL}/cart/items`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        productId: item.productId,
                        quantity: item.quantity
                    })
                });
            }
        } catch (error) {
            console.error('Error saving cart to backend:', error);
        }
    }
}

// Order Functions
async function createOrderInBackend(orderData) {
    if (currentUser && authToken) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (data.status === 'success') {
                return data.data.order;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error creating order in backend:', error);
            throw error;
        }
    } else {
        // Create order in localStorage for guest users
        const order = {
            id: Date.now(),
            orderNumber: 'GC' + Date.now(),
            ...orderData,
            status: 'pending',
            paymentStatus: 'pending',
            createdAt: new Date()
        };
        localStorage.setItem('currentOrder', JSON.stringify(order));
        return order;
    }
}

// Payment Functions
async function processRazorpayPayment(order) {
    try {
        // Create Razorpay order
        const response = await fetch(`${API_BASE_URL}/payments/razorpay/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                orderId: order.id,
                amount: order.finalAmount
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            const options = {
                key: data.data.key,
                amount: data.data.order.amount,
                currency: data.data.order.currency,
                name: 'Glow Candles',
                description: `Order #${order.orderNumber}`,
                order_id: data.data.order.id,
                handler: async function(response) {
                    try {
                        // Verify payment
                        const verifyResponse = await fetch(`${API_BASE_URL}/payments/razorpay/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`
                            },
                            body: JSON.stringify({
                                orderId: order.id,
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyData.status === 'success') {
                            showNotification('Payment successful!', 'success');
                            // Redirect to success page
                            window.location.href = `order-success.html?order=${order.orderNumber}`;
                        } else {
                            showNotification('Payment verification failed', 'error');
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        showNotification('Payment verification failed', 'error');
                    }
                },
                prefill: {
                    name: order.shippingAddress.firstName + ' ' + order.shippingAddress.lastName,
                    email: order.shippingAddress.email,
                    contact: order.shippingAddress.phone
                },
                theme: {
                    color: '#e8c696'
                }
            };

            const rzp = new Razorpay(options);
            rzp.open();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Razorpay payment error:', error);
        showNotification('Payment failed. Please try again.', 'error');
    }
}

async function processUPIPayment(order) {
    // For UPI, we'll create the order and show UPI details
    try {
        const orderResult = await createOrderInBackend(order);
        showNotification('Order created! Please complete UPI payment.', 'success');
        // Redirect to UPI payment page or show UPI details
        window.location.href = `order-success.html?order=${orderResult.orderNumber}&payment=pending`;
    } catch (error) {
        console.error('UPI payment error:', error);
        showNotification('Order creation failed', 'error');
    }
}

async function processCODPayment(order) {
    try {
        const response = await fetch(`${API_BASE_URL}/payments/cod/confirm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                orderId: order.id
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            showNotification('COD order confirmed!', 'success');
            // Redirect to success page
            window.location.href = `order-success.html?order=${order.orderNumber}`;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('COD payment error:', error);
        showNotification('Order confirmation failed', 'error');
    }
}

// UI Update Functions
function updateUIForLoggedInUser() {
    // Update cart count
    updateCartCount();
    
    // Show user info if elements exist
    const userInfoElements = document.querySelectorAll('.user-info');
    userInfoElements.forEach(element => {
        element.innerHTML = `
            <p><strong>Logged in as:</strong> ${currentUser.firstName} ${currentUser.lastName}</p>
            <p><strong>Email:</strong> ${currentUser.email}</p>
        `;
    });
    
    // Show logout button if exists
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
        button.style.display = 'block';
    });
}

function updateUIForGuestUser() {
    // Hide user info
    const userInfoElements = document.querySelectorAll('.user-info');
    userInfoElements.forEach(element => {
        element.innerHTML = '<p>Not logged in</p>';
    });
    
    // Hide logout button
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
        button.style.display = 'none';
    });
}

// Enhanced addToCart function with backend integration
async function addToCartWithBackend(productId, name, image, price, quantity = 1) {
    // Add to localStorage first (immediate UI update)
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            productId: productId,
            name: name,
            image: image,
            price: price,
            quantity: quantity
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    // Save to backend if logged in
    if (currentUser && authToken) {
        try {
            await fetch(`${API_BASE_URL}/cart/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    productId: productId,
                    quantity: quantity
                })
            });
        } catch (error) {
            console.error('Backend cart save failed:', error);
        }
    }
    
    showNotification(`${name} added to cart!`, 'success');
}

// Notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
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

// Export functions for use in other files
window.BackendIntegration = {
    loginUser,
    registerUser,
    logoutUser,
    loadCartFromBackend,
    saveCartToBackend,
    createOrderInBackend,
    processRazorpayPayment,
    processUPIPayment,
    processCODPayment,
    addToCartWithBackend,
    showNotification
};