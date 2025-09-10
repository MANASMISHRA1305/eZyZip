// Admin Panel JavaScript
let authToken = localStorage.getItem('adminToken');
let currentUser = null;
let socket = null;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    if (authToken) {
        verifyToken();
    } else {
        showLoginModal();
    }
    
    initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.dataset.section;
            showSection(section);
        });
    });
    
    // Filters
    document.getElementById('statusFilter').addEventListener('change', loadOrders);
    document.getElementById('paymentFilter').addEventListener('change', loadOrders);
}

// Show login modal
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

// Hide login modal
function hideLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Local admin shortcut (without backend)
    if (email === 'mrmahmood832@gmail.com' && password === 'ahmad123') {
        authToken = 'local-admin-token';
        currentUser = {
            firstName: 'Admin',
            lastName: 'User',
            email: email,
            role: 'admin'
        };
        
        localStorage.setItem('adminToken', authToken);
        localStorage.setItem('adminUser', JSON.stringify(currentUser));
        
        document.getElementById('adminName').textContent = 
            `${currentUser.firstName} ${currentUser.lastName}`;
        
        hideLoginModal();
        initializeSocket();
        loadDashboard();
        showToast('Logged in as Admin', 'success');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/login', {
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
            
            localStorage.setItem('adminToken', authToken);
            localStorage.setItem('adminUser', JSON.stringify(currentUser));
            
            document.getElementById('adminName').textContent = 
                `${currentUser.firstName} ${currentUser.lastName}`;
            
            hideLoginModal();
            initializeSocket();
            loadDashboard();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please try again.', 'error');
    }
}

// Handle logout
function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    
    if (socket) {
        socket.disconnect();
    }
    
    showLoginModal();
}

// Verify token
async function verifyToken() {
    try {
        // Accept local admin token without backend verification
        if (authToken === 'local-admin-token') {
            currentUser = JSON.parse(localStorage.getItem('adminUser')) || {
                firstName: 'Admin', lastName: 'User', role: 'admin'
            };
            document.getElementById('adminName').textContent = 
                `${currentUser.firstName} ${currentUser.lastName}`;
            
            hideLoginModal();
            initializeSocket();
            loadDashboard();
            return;
        }
        
        const response = await fetch('/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = JSON.parse(localStorage.getItem('adminUser'));
            document.getElementById('adminName').textContent = 
                `${currentUser.firstName} ${currentUser.lastName}`;
            
            hideLoginModal();
            initializeSocket();
            loadDashboard();
        } else {
            showLoginModal();
        }
    } catch (error) {
        console.error('Token verification error:', error);
        showLoginModal();
    }
}

// Initialize Socket.IO
function initializeSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('join-admin');
    });
    
    socket.on('new-order', (data) => {
        showToast(`New order received: ${data.orderNumber}`, 'success');
        loadDashboard();
        loadOrders();
    });
    
    socket.on('payment-received', (data) => {
        showToast(`Payment received for order: ${data.orderNumber}`, 'success');
        loadDashboard();
        loadOrders();
    });
    
    socket.on('new-cod-order', (data) => {
        showToast(`New COD order: ${data.orderNumber}`, 'warning');
        loadDashboard();
        loadOrders();
    });
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Load section data
    switch(sectionName) {
        case 'overview':
            loadDashboard();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'products':
            loadProducts();
            break;
        case 'notifications':
            loadNotifications();
            break;
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        const response = await fetch('/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            const stats = data.data.statistics;
            const recentOrders = data.data.recentOrders;
            
            // Update statistics
            document.getElementById('totalOrders').textContent = stats.totalOrders;
            document.getElementById('pendingOrders').textContent = stats.pendingOrders;
            document.getElementById('totalRevenue').textContent = `₹${stats.totalRevenue.toLocaleString()}`;
            document.getElementById('todayOrders').textContent = stats.todayOrders;
            
            // Update recent orders table
            const tbody = document.querySelector('#recentOrdersTable tbody');
            tbody.innerHTML = recentOrders.map(order => `
                <tr>
                    <td>${order.orderNumber}</td>
                    <td>${order.customerName}</td>
                    <td>₹${order.finalAmount}</td>
                    <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                    <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewOrder(${order.id})">
                            View
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Load dashboard error:', error);
    }
}

// Load orders
async function loadOrders(page = 1) {
    try {
        const statusFilter = document.getElementById('statusFilter').value;
        const paymentFilter = document.getElementById('paymentFilter').value;
        
        let url = `/api/admin/orders?page=${page}&limit=20`;
        if (statusFilter) url += `&status=${statusFilter}`;
        if (paymentFilter) url += `&paymentStatus=${paymentFilter}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            const orders = data.data.orders;
            const pagination = data.data.pagination;
            
            // Update orders table
            const tbody = document.querySelector('#ordersTable tbody');
            tbody.innerHTML = orders.map(order => `
                <tr>
                    <td>${order.orderNumber}</td>
                    <td>
                        <div>
                            <strong>${order.customer.name}</strong><br>
                            <small>${order.customer.email}</small>
                        </div>
                    </td>
                    <td>₹${order.finalAmount}</td>
                    <td>
                        <select onchange="updateOrderStatus(${order.id}, this.value)" 
                                class="status-select status-${order.status}">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </td>
                    <td><span class="status-badge payment-${order.paymentStatus}">${order.paymentStatus}</span></td>
                    <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewOrder(${order.id})">
                            View
                        </button>
                    </td>
                </tr>
            `).join('');
            
            // Update pagination
            updatePagination('ordersPagination', pagination, loadOrders);
        }
    } catch (error) {
        console.error('Load orders error:', error);
    }
}

// Load products
async function loadProducts() {
    try {
        const response = await fetch('/api/admin/products', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            const products = data.data.products;
            
            // Update products table
            const tbody = document.querySelector('#productsTable tbody');
            tbody.innerHTML = products.map(product => `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <img src="../${product.image}" alt="${product.name}" 
                                 style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                            <div>
                                <strong>${product.name}</strong><br>
                                <small>${product.description}</small>
                            </div>
                        </div>
                    </td>
                    <td>₹${product.price}</td>
                    <td>
                        <input type="number" value="${product.stockQuantity}" 
                               onchange="updateProductStock(${product.id}, this.value)"
                               style="width: 80px; padding: 0.25rem; border: 1px solid #ddd; border-radius: 4px;">
                    </td>
                    <td>${product.category}</td>
                    <td>
                        <span class="status-badge ${product.isActive ? 'status-confirmed' : 'status-cancelled'}">
                            ${product.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editProduct(${product.id})">
                            Edit
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Load products error:', error);
    }
}

// Load notifications
async function loadNotifications() {
    try {
        const response = await fetch('/api/admin/notifications', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            const notifications = data.data.notifications;
            
            // Update notifications list
            const container = document.getElementById('notificationsList');
            container.innerHTML = notifications.map(notification => `
                <div class="notification-item ${!notification.isRead ? 'unread' : ''}">
                    <div class="notification-content">
                        <h4>${notification.title}</h4>
                        <p>${notification.message}</p>
                    </div>
                    <div class="notification-meta">
                        <div>${new Date(notification.createdAt).toLocaleString()}</div>
                        ${!notification.isRead ? 
                            `<button class="btn btn-sm btn-primary" onclick="markAsRead(${notification.id})">
                                Mark as Read
                            </button>` : ''
                        }
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load notifications error:', error);
    }
}

// Update order status
async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showToast('Order status updated successfully', 'success');
            loadOrders();
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Update order status error:', error);
        showToast('Failed to update order status', 'error');
    }
}

// Update product stock
async function updateProductStock(productId, stockQuantity) {
    try {
        const response = await fetch(`/api/admin/products/${productId}/stock`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ stockQuantity: parseInt(stockQuantity) })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            showToast('Product stock updated successfully', 'success');
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Update product stock error:', error);
        showToast('Failed to update product stock', 'error');
    }
}

// View order details
async function viewOrder(orderId) {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            const order = data.data.order;
            
            document.getElementById('orderDetails').innerHTML = `
                <div class="order-details">
                    <div class="order-header">
                        <h3>Order #${order.orderNumber}</h3>
                        <div class="order-meta">
                            <span class="status-badge status-${order.status}">${order.status}</span>
                            <span class="status-badge payment-${order.paymentStatus}">${order.paymentStatus}</span>
                        </div>
                    </div>
                    
                    <div class="order-info">
                        <div class="info-section">
                            <h4>Customer Information</h4>
                            <p><strong>Name:</strong> ${order.customer.name}</p>
                            <p><strong>Email:</strong> ${order.customer.email}</p>
                            <p><strong>Phone:</strong> ${order.customer.phone}</p>
                        </div>
                        
                        <div class="info-section">
                            <h4>Shipping Address</h4>
                            <p>${order.customer.address.street}</p>
                            <p>${order.customer.address.city}, ${order.customer.address.state} - ${order.customer.address.pincode}</p>
                            <p>${order.customer.address.country}</p>
                        </div>
                        
                        <div class="info-section">
                            <h4>Order Items</h4>
                            <div class="items-list">
                                ${order.items.map(item => `
                                    <div class="item-row">
                                        <img src="../${item.product_image}" alt="${item.product_name}" 
                                             style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
                                        <div class="item-details">
                                            <strong>${item.product_name}</strong>
                                            <p>Quantity: ${item.quantity} × ₹${item.price} = ₹${item.total_price}</p>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="info-section">
                            <h4>Order Summary</h4>
                            <div class="summary-row">
                                <span>Subtotal:</span>
                                <span>₹${order.totalAmount}</span>
                            </div>
                            <div class="summary-row">
                                <span>GST (18%):</span>
                                <span>₹${order.gstAmount}</span>
                            </div>
                            <div class="summary-row">
                                <span>Shipping:</span>
                                <span>₹${order.shippingAmount}</span>
                            </div>
                            <div class="summary-row total">
                                <span>Total:</span>
                                <span>₹${order.finalAmount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('orderModal').style.display = 'flex';
        }
    } catch (error) {
        console.error('View order error:', error);
        showToast('Failed to load order details', 'error');
    }
}

// Mark notification as read
async function markAsRead(notificationId) {
    try {
        const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            loadNotifications();
        }
    } catch (error) {
        console.error('Mark notification read error:', error);
    }
}

// Mark all notifications as read
async function markAllAsRead() {
    try {
        const notifications = document.querySelectorAll('.notification-item.unread');
        for (let notification of notifications) {
            const button = notification.querySelector('button');
            if (button) {
                const notificationId = button.onclick.toString().match(/\d+/)[0];
                await markAsRead(notificationId);
            }
        }
        showToast('All notifications marked as read', 'success');
    } catch (error) {
        console.error('Mark all as read error:', error);
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Update pagination
function updatePagination(containerId, pagination, loadFunction) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const { currentPage, totalPages, totalItems } = pagination;
    
    let html = `
        <div class="pagination-info">
            Showing ${(currentPage - 1) * 20 + 1} to ${Math.min(currentPage * 20, totalItems)} of ${totalItems} results
        </div>
        <div class="pagination-buttons">
    `;
    
    // Previous button
    html += `
        <button ${currentPage === 1 ? 'disabled' : ''} 
                onclick="${loadFunction.name}(${currentPage - 1})">
            Previous
        </button>
    `;
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        html += `
            <button class="${i === currentPage ? 'active' : ''}" 
                    onclick="${loadFunction.name}(${i})">
                ${i}
            </button>
        `;
    }
    
    // Next button
    html += `
        <button ${currentPage === totalPages ? 'disabled' : ''} 
                onclick="${loadFunction.name}(${currentPage + 1})">
            Next
        </button>
    `;
    
    html += '</div>';
    container.innerHTML = html;
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});