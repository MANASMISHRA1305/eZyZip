const express = require('express');
const { pool } = require('./database');

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE is_active = TRUE ORDER BY created_at DESC'
    );

    res.json({
      status: 'success',
      data: {
        products: products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          category: product.category,
          stockQuantity: product.stock_quantity,
          createdAt: product.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const product = products[0];
    res.json({
      status: 'success',
      data: {
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          category: product.category,
          stockQuantity: product.stock_quantity,
          createdAt: product.created_at
        }
      }
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product'
    });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE category = ? AND is_active = TRUE ORDER BY created_at DESC',
      [category]
    );

    res.json({
      status: 'success',
      data: {
        products: products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          category: product.category,
          stockQuantity: product.stock_quantity,
          createdAt: product.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
});

module.exports = router;