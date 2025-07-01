// Tour API routes go here
const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');

// Rutas para tours
router.post('/', tourController.createTour);
router.get('/', tourController.getAllTours);
router.get('/:id', tourController.getTourById);
router.put('/:id', tourController.updateTour);
router.delete('/:id', tourController.deleteTour);
router.post('/:id/scenes', tourController.addSceneToTour);
router.post('/:id/generate-key', tourController.generateApiKey);

module.exports = router;