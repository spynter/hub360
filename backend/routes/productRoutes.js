const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Obtener productos de una tienda específica (por tourId)
router.get('/by-tour/:tourId', async (req, res) => {
  try {
    const products = await Product.find({ tourId: req.params.tourId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener solo el número de productos de una tienda específica
router.get('/by-tour/:tourId/count', async (req, res) => {
  try {
    const count = await Product.countDocuments({ tourId: req.params.tourId });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todos los productos (opcional, para admin)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear producto asociado a un tour
router.post('/', async (req, res) => {
  try {
    const { name, description, image, price, tourId } = req.body;
    const product = new Product({ name, description, image, price, tourId });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
