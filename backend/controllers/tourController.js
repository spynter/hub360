// Tour controller logic goes here
const Tour = require('../models/Tour');
const { v4: uuidv4 } = require('uuid');

// Generar API Key única
const generateApiKey = () => {
  return uuidv4().replace(/-/g, '').substring(0, 24);
};

// Crear un nuevo tour
exports.createTour = async (req, res) => {
  try {
    const { name, description, scenes } = req.body;
    const apiKey = generateApiKey();
    
    const newTour = new Tour({
      name,
      description,
      apiKey,
      scenes: scenes || []
    });

    const savedTour = await newTour.save();
    res.status(201).json(savedTour);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los tours (resumen)
exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find().select('name description createdAt scenes');
    res.json(tours);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un tour por ID
exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ error: 'Tour no encontrado' });
    }
    res.json(tour);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un tour
exports.updateTour = async (req, res) => {
  try {
    const { name, description, scenes } = req.body;

    // Validar que todas las escenas tengan imagen
    if (Array.isArray(scenes)) {
      for (let i = 0; i < scenes.length; i++) {
        if (!scenes[i].image || typeof scenes[i].image !== 'string' || !scenes[i].image.trim()) {
          return res.status(400).json({ error: `La escena ${i + 1} no tiene una imagen válida.` });
        }
      }
    }

    const updatedTour = await Tour.findByIdAndUpdate(
      req.params.id,
      { name, description, scenes },
      { new: true, runValidators: true }
    );

    if (!updatedTour) {
      return res.status(404).json({ error: 'Tour no encontrado' });
    }

    res.json(updatedTour);
  } catch (error) {
    console.error('Error en updateTour:', error);
    res.status(500).json({ error: error.message || 'Algo salió mal' });
  }
};

// Eliminar un tour
exports.deleteTour = async (req, res) => {
  try {
    const deletedTour = await Tour.findByIdAndDelete(req.params.id);
    
    if (!deletedTour) {
      return res.status(404).json({ error: 'Tour no encontrado' });
    }
    
    res.json({ message: 'Tour eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Añadir una escena a un tour
exports.addSceneToTour = async (req, res) => {
  try {
    const { name, image } = req.body;
    
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ error: 'Tour no encontrado' });
    }
    
    tour.scenes.push({ name, image, hotspots: [] });
    const updatedTour = await tour.save();
    
    res.json(updatedTour);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generar nueva API Key para un tour
exports.generateApiKey = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({ error: 'Tour no encontrado' });
    }
    
    tour.apiKey = generateApiKey();
    const updatedTour = await tour.save();
    
    res.json({ apiKey: updatedTour.apiKey });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};