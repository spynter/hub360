// Tour controller logic goes here
const Tour = require('../models/Tour');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// Generar API Key única
const generateApiKey = () => {
  return uuidv4().replace(/-/g, '').substring(0, 24);
};

// Crear un nuevo tour
exports.createTour = async (req, res) => {
  try {
    const { name, description, scenes, localizacion } = req.body;
    const apiKey = generateApiKey();
    
    const newTour = new Tour({
      name,
      description,
      apiKey,
      scenes: scenes || [],
      localizacion
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
    const tours = await Tour.find().select('name description createdAt scenes localizacion');
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
    const { name, description, scenes, localizacion } = req.body;

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
      { name, description, scenes, localizacion },
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

// Añadir hotspot a una escena
exports.addHotspot = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.tourId);
    if (!tour) {
      return res.status(404).json({ error: 'Tour no encontrado' });
    }

    const scene = tour.scenes.id(req.params.sceneId);
    if (!scene) {
      return res.status(404).json({ error: 'Escena no encontrada' });
    }

    const { type, pitch, yaw, title, description, targetSceneId, socialMedia, imageUrl } = req.body;

    let newHotspot = {
      type,
      pitch,
      yaw
    };

    if (type === 'access') {
      // Validar que la escena destino existe
      let targetId = targetSceneId;
      if (targetId && typeof targetId === 'string' && mongoose.Types.ObjectId.isValid(targetId)) {
        targetId = new mongoose.Types.ObjectId(targetId);
      }
      const targetScene = tour.scenes.id(targetId);
      if (!targetScene) {
        return res.status(400).json({ error: 'Escena destino no encontrada' });
      }
      newHotspot.targetSceneId = targetId;
      if (imageUrl) newHotspot.imageUrl = imageUrl;
    } else if (type === 'commerce') {
      newHotspot.title = title;
      newHotspot.description = description;
      newHotspot.socialMedia = socialMedia;
    } else if (type === 'location') {
      newHotspot.title = title;
      newHotspot.description = description;
    }

    scene.hotspots.push(newHotspot);
    await tour.save();

    res.status(201).json(scene.hotspots[scene.hotspots.length - 1]);
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

// Widget embed: GET /api/tours/embed?api_key=XYZ
exports.embedTourByApiKey = async (req, res) => {
  const apiKey = req.query.api_key;
  if (!apiKey) {
    return res.status(401).json({ error: 'API key requerida' });
  }
  try {
    const tour = await Tour.findOne({ apiKey });
    if (!tour) {
      return res.status(401).json({ error: 'API key inválida o tour no encontrado' });
    }

    // Renderiza un HTML básico con el widget (puedes personalizar el contenido)
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Tour 360° Embed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          html, body { margin:0; padding:0; height:100%; background:#181c23; }
          #embed-root { width:100vw; height:100vh; }
        </style>
      </head>
      <body>
        <div id="embed-root"></div>
        <script>
          window.__EMBED_TOUR__ = ${JSON.stringify(tour)};
        </script>
        <script src="https://unpkg.com/three@0.153.0/build/three.min.js"></script>
        <script src="https://unpkg.com/three@0.153.0/examples/js/controls/OrbitControls.js"></script>
        <script>
          // Renderiza el tour usando Three.js (solo la primera escena)
          (function() {
            const tour = window.__EMBED_TOUR__;
            if (!tour || !tour.scenes || !tour.scenes.length) {
              document.getElementById('embed-root').innerHTML = '<div style="color:#38bdf8;text-align:center;padding:2em;">Tour no disponible</div>';
              return;
            }
            const container = document.getElementById('embed-root');
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
            camera.position.set(0,0,0.1);
            const renderer = new THREE.WebGLRenderer({antialias:true});
            renderer.setSize(window.innerWidth, window.innerHeight);
            container.appendChild(renderer.domElement);
            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.rotateSpeed = -0.5; // INVERTIR dirección de rotación
            // Cargar la primera escena
            const sceneData = tour.scenes[0];
            const geometry = new THREE.SphereGeometry(500, 60, 40);
            geometry.scale(-1,1,1);
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(sceneData.image, function(texture) {
              const material = new THREE.MeshBasicMaterial({map:texture, side:THREE.DoubleSide});
              const sphere = new THREE.Mesh(geometry, material);
              scene.add(sphere);
            });

            // Opcional: Invertir orientación si se usa giroscopio (ejemplo simple)
            if (window.DeviceOrientationEvent) {
              window.addEventListener('deviceorientation', function(event) {
                // Invertir alpha para invertir la rotación horizontal
                var alpha = event.alpha ? -event.alpha : 0;
                // ...aplicar lógica de orientación si se implementa...
              }, true);
            }

            function animate() {
              requestAnimationFrame(animate);
              controls.update();
              renderer.render(scene, camera);
            }
            animate();
            window.addEventListener('resize', function() {
              camera.aspect = window.innerWidth / window.innerHeight;
              camera.updateProjectionMatrix();
              renderer.setSize(window.innerWidth, window.innerHeight);
            });
          })();
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener tour por API key: GET /api/tours/by-key/:apiKey
exports.getTourByApiKey = async (req, res) => {
  const apiKey = req.params.apiKey;
  if (!apiKey) {
    return res.status(400).json({ error: 'API key requerida' });
  }
  
  try {
    const tour = await Tour.findOne({ apiKey });
    if (!tour) {
      return res.status(404).json({ error: 'Tour no encontrado' });
    }
    
    res.json(tour);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};