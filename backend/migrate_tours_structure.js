// Script de migración para tours: estructura scenes/hotspots
const mongoose = require('mongoose');
const Tour = require('./models/Tour');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://anunnaki:IGcICHTKbEVkNnDv@cluster0.la6e0.mongodb.net/mcpdb';

async function migrate() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const tours = await Tour.find({});
  let changed = 0;
  for (const tour of tours) {
    let modified = false;
    // MIGRAR IMAGES A SCENES SI EXISTE
    if (Array.isArray(tour.images) && tour.images.length > 0) {
      // Si scenes está vacío, crearlas desde images
      if (!Array.isArray(tour.scenes) || tour.scenes.length === 0) {
        tour.scenes = tour.images.map((img, idx) => ({
          name: img.name || `Escena ${idx + 1}`,
          image: img.url || img.image,
          hotspots: []
        }));
        modified = true;
      }
      // Eliminar images
      tour.images = undefined;
      modified = true;
    }
    // MIGRAR HOTSPOTS A LA PRIMERA ESCENA SI EXISTE
    if (Array.isArray(tour.hotspots) && tour.hotspots.length > 0) {
      if (Array.isArray(tour.scenes) && tour.scenes.length > 0) {
        // Agregar los hotspots a la primera escena
        tour.scenes[0].hotspots = tour.scenes[0].hotspots || [];
        tour.scenes[0].hotspots.push(...tour.hotspots);
        modified = true;
      }
      // Eliminar hotspots
      tour.hotspots = undefined;
      modified = true;
    }
    // Limpiar escenas vacías
    if (Array.isArray(tour.scenes)) {
      tour.scenes = tour.scenes.filter(s => s && s.image);
    }
    if (modified) {
      await tour.save();
      changed++;
      console.log(`Tour ${tour._id} migrado.`);
    }
  }
  console.log(`\nMigración completada. Tours modificados: ${changed} de ${tours.length}`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Error en la migración:', err);
  process.exit(1);
}); 