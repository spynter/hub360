// Mongoose Tour model goes here
const mongoose = require('mongoose');

const hotspotSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['access', 'commerce', 'location'],
    required: true
  },
  pitch: {
    type: Number,
    required: true
  },
  yaw: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: function() {
      // Solo requerido si el tipo NO es access
      return this.type !== 'access';
    }
  },
  description: String,
  // Para puntos de acceso
  targetSceneId: mongoose.Schema.Types.ObjectId,
  // Para comercios
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    website: String
  }
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
  },
  localizacion: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }
});

module.exports = mongoose.model('Tour', tourSchema);