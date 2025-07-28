const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String,
  price: { type: Number, required: true, min: 0 },
  tourId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
