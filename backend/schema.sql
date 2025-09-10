-- Create database
CREATE DATABASE IF NOT EXISTS glow_candles;
USE glow_candles;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image VARCHAR(255),
    category VARCHAR(50),
    stock_quantity INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Cart table
CREATE TABLE IF NOT EXISTS cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id INT,
    total_amount DECIMAL(10,2) NOT NULL,
    gst_amount DECIMAL(10,2) NOT NULL,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method ENUM('razorpay', 'upi', 'cod') NOT NULL,
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    product_image VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Shipping addresses table
CREATE TABLE IF NOT EXISTS shipping_addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    country VARCHAR(50) DEFAULT 'India',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    payment_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status ENUM('pending', 'captured', 'failed', 'refunded') DEFAULT 'pending',
    method VARCHAR(50),
    gateway VARCHAR(50),
    gateway_payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Admin notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('new_order', 'payment_received', 'order_cancelled', 'order_delivered') NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    order_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT INTO users (first_name, last_name, email, phone, password, role) 
VALUES ('Admin', 'User', 'admin@glowcandles.com', '9999999999', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE role='admin';

-- Insert sample products
INSERT INTO products (name, description, price, image, category, stock_quantity) VALUES
('Rose Candle', 'Aromatic rose candle perfect for romantic evenings.', 299.00, 'assets/rose.jpg', 'romantic', 50),
('Lavender Candle', 'Relaxing lavender fragrance to calm your senses.', 349.00, 'assets/1.jpg', 'relaxing', 30),
('Vanilla Candle', 'Sweet vanilla candle to freshen up your room.', 249.00, 'assets/2.jpg', 'sweet', 40),
('Decorative Pillar Candle', 'Beautiful decorative candle for home & events.', 499.00, 'assets/3.jpg', 'decor', 25),
('White Rose Candle', 'Elegant white rose scented candle.', 329.00, 'assets/white-rose.jpg', 'romantic', 35),
('Orange Candle', 'Fresh orange fragrance candle.', 279.00, 'assets/orange.jpg', 'fresh', 45),
('Purple Candle', 'Mystical purple scented candle.', 399.00, 'assets/purple-candle.jpg', 'mystical', 20),
('Glass Lily Candle', 'Beautiful glass container with lily fragrance.', 449.00, 'assets/glass-lily.jpg', 'decor', 15);