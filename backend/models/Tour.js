// Mongoose Tour model goes here
const mongoose = require('mongoose');

const hotspotSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['info', 'link', 'scene'],
    default: 'info'
  },
  pitch: {
    type: Number,
    required: true
  },
  yaw: {
    type: Number,
    required: true
  },
  text: String,
  url: String,
  targetSceneId: mongoose.Schema.Types.ObjectId
}, { _id: true });

const sceneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  hotspots: [hotspotSchema]
});

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  scenes: [sceneSchema],
  apiKey: {
    type: String,
    unique: true,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tour', tourSchema);