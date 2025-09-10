# Glow Candles Backend Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- Git

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Database Setup
1. Create MySQL database:
```sql
CREATE DATABASE glow_candles;
```

2. Import the schema:
```bash
mysql -u root -p glow_candles < database/schema.sql
```

### 3. Environment Configuration
1. Copy `.env.example` to `.env`
2. Update the following values in `.env`:
   - `DB_PASSWORD`: Your MySQL password
   - `JWT_SECRET`: A strong secret key
   - `RAZORPAY_KEY_ID`: Your Razorpay key ID
   - `RAZORPAY_KEY_SECRET`: Your Razorpay key secret
   - `EMAIL_USER`: Your email for notifications
   - `EMAIL_PASS`: Your email app password

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Access Admin Panel
- URL: http://localhost:5000/admin
- Default Admin Login:
  - Email: admin@glowcandles.com
  - Password: admin123

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/category/:category` - Get products by category

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:productId` - Update cart item
- `DELETE /api/cart/items/:productId` - Remove cart item
- `DELETE /api/cart` - Clear cart

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order

### Payments
- `POST /api/payments/razorpay/create-order` - Create Razorpay order
- `POST /api/payments/razorpay/verify` - Verify Razorpay payment
- `POST /api/payments/cod/confirm` - Confirm COD payment

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/orders` - Get all orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/products` - Get all products
- `PUT /api/admin/products/:id/stock` - Update product stock
- `GET /api/admin/notifications` - Get notifications

## Frontend Integration

1. Include the backend integration script in your HTML files:
```html
<script src="backend-integration.js"></script>
```

2. Update your existing cart functions to use backend integration:
```javascript
// Replace your existing addToCart function
async function addToCart(name, image, price, quantity = 1) {
    await BackendIntegration.addToCartWithBackend(
        productId, name, image, price, quantity
    );
}
```

## Features

### Admin Dashboard
- Real-time order notifications
- Order management
- Product stock management
- Payment tracking
- Customer information
- Sales statistics

### User Features
- User registration/login
- Cart synchronization
- Order history
- Multiple payment methods (Razorpay, UPI, COD)
- Real-time updates

### Security
- JWT authentication
- Password hashing
- Input validation
- Rate limiting
- CORS protection

## Troubleshooting

### Common Issues
1. **Database Connection Error**: Check MySQL service and credentials
2. **Port Already in Use**: Change PORT in .env file
3. **CORS Issues**: Update CORS origins in server.js
4. **Razorpay Errors**: Verify API keys in .env

### Logs
Check console logs for detailed error messages and debugging information.