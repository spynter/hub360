import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import SceneManager from './SceneManager';
import HotspotEditor from './HotspotEditor';
import api from '../../services/api';
import DragDrop from './DragDrop';
import { useNavigate } from 'react-router-dom';
import './TourEditor.css';

// Utilidad para obtener la URL absoluta de la imagen
function getAbsoluteImageUrl(image) {
  if (!image) return '';
  if (image.startsWith('/uploads/')) {
    return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${image}`;
  }
  return image;
}

function TourEditor({ tourId }) {
  const containerRef = useRef();
  const [tour, setTour] = useState(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [isAddingHotspot, setIsAddingHotspot] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [pendingHotspot, setPendingHotspot] = useState(null);
  const navigate = useNavigate();

  // Referencias de Three.js
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();

  // Cargar tour desde la API
  useEffect(() => {
    const fetchTour = async () => {
      try {
        const response = await api.getTour(tourId);
        setTour(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar el tour');
        setLoading(false);
        console.error(err);
      }
    };
    fetchTour();
  }, [tourId]);

  // Inicializar Three.js
  useEffect(() => {
    if (!tour || loading) return;

    // Limpiar canvas anterior si existe
    if (rendererRef.current && rendererRef.current.domElement && containerRef.current) {
      if (containerRef.current.contains(rendererRef.current.domElement)) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current.dispose();
    }

    // Eliminar cualquier canvas sobrante (por si acaso)
    if (containerRef.current) {
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    }

    // Usar el tamaño del contenedor para el renderer
    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.set(0, 0, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x22232a, 1); // Fondo oscuro, pero no negro puro
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Responsivo al tamaño del contenedor
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Limpieza
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) cancelAnimationFrame(animationId);
      if (
        rendererRef.current &&
        rendererRef.current.domElement &&
        containerRef.current &&
        containerRef.current.contains(rendererRef.current.domElement)
      ) {
        rendererRef.current.dispose();
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [tour, loading]);

  // Cargar la escena current
  useEffect(() => {
    if (
      !tour ||
      !sceneRef.current ||
      !tour.scenes ||
      !Array.isArray(tour.scenes) ||
      tour.scenes.length === 0 ||
      currentSceneIndex === -1 ||
      !tour.scenes[currentSceneIndex]
    ) return;

    const scene = sceneRef.current;
    const currentScene = tour.scenes[currentSceneIndex];

    // Limpiar escena anterior
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Crear esfera para la imagen 360 con mayor calidad visual
    const geometry = new THREE.SphereGeometry(500, 128, 96); // Más segmentos para suavidad
    geometry.scale(-1, 1, 1);

    const textureLoader = new THREE.TextureLoader();
    let imageUrl = getAbsoluteImageUrl(currentScene.image);

    textureLoader.load(
      imageUrl,
      texture => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        // Usar LinearSRGBColorSpace si está disponible, si no, omitir
        if (texture.colorSpace !== undefined && THREE.LinearSRGBColorSpace) {
          texture.colorSpace = THREE.LinearSRGBColorSpace;
        }
        // Anisotropía para mayor nitidez
        if (rendererRef.current && rendererRef.current.capabilities.getMaxAnisotropy) {
          texture.anisotropy = Math.min(16, rendererRef.current.capabilities.getMaxAnisotropy());
        }
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide
        });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
      },
      undefined,
      err => {
        console.error('Error al cargar la textura:', err, imageUrl);
        const material = new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
      }
    );
  }, [tour, currentSceneIndex]);

  // Manejar subida de imágenes
  const handleImageUpload = async (e) => {
    let file;
    if (e.target && e.target.files && e.target.files[0]) {
      file = e.target.files[0];
    } else if (e instanceof File) {
      file = e;
    } else if (e && e.target && e.target.files) {
      file = e.target.files[0];
    }
    if (!file) return;

    try {
      // Asegura que imageUrl siempre sea un string válido
      let uploadRes = await api.uploadImage(file);
      let imageUrl = uploadRes.data?.imageUrl || uploadRes.imageUrl;
      if (!imageUrl) {
        throw new Error('No se recibió la URL de la imagen');
      }
      const newScene = {
        name: `Escena ${tour.scenes.length + 1}`,
        image: imageUrl,
        hotspots: []
      };
      const updatedTour = {
        ...tour,
        scenes: [...tour.scenes, newScene]
      };
      const savedTour = await api.updateTour(tourId, updatedTour);
      setTour(savedTour.data ? savedTour.data : savedTour);
      setCurrentSceneIndex(updatedTour.scenes.length - 1);
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      alert(`Error al subir imagen: ${err.error || err.message || 'Intente nuevamente'}`);
    }
  };

  // Manejar subida de imágenes (DragDrop)
  const handleDragDropImage = async (file) => {
    await handleImageUpload(file);
  };

  // Guardar hotspot
  const handleSaveHotspot = async (hotspotData) => {
    try {
      const updatedScenes = [...tour.scenes];
      const currentScene = updatedScenes[currentSceneIndex];

      if (hotspotData._id) {
        const index = currentScene.hotspots.findIndex(h => h._id === hotspotData._id);
        if (index !== -1) {
          currentScene.hotspots[index] = hotspotData;
        }
      } else {
        currentScene.hotspots.push({
          ...hotspotData,
          _id: Date.now().toString()
        });
      }

      const updatedTour = { ...tour, scenes: updatedScenes };
      setTour(updatedTour);
      await api.updateTour(tourId, updatedTour);
      setSelectedHotspot(null);
      setIsAddingHotspot(false);
    } catch (err) {
      console.error('Error guardando hotspot:', err);
      alert(`Error al guardar: ${err.error || 'Intente nuevamente'}`);
    }
  };

  // Manejar click en la esfera para añadir hotspot SOLO cuando isAddingHotspot es true
  useEffect(() => {
    if (!isAddingHotspot || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const handlePointerDown = (event) => {
      // Solo permitir click izquierdo
      if (event.button !== 0) return;

      // Evitar que el panel de control capture el click
      if (event.target !== rendererRef.current.domElement) return;

      // Obtener posición del click relativo al canvas
      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Vector 3D en la dirección de la cámara
      const vector = new THREE.Vector3(x, y, 0.5).unproject(cameraRef.current);

      // Convertir a coordenadas esféricas (pitch/yaw)
      const camPos = cameraRef.current.position;
      const dir = vector.sub(camPos).normalize();
      const phi = Math.acos(dir.y); // [0, PI]
      const theta = Math.atan2(dir.x, dir.z); // [-PI, PI]

      // Convertir a grados
      const pitch = 90 - (phi * 180 / Math.PI);
      const yaw = theta * 180 / Math.PI;

      setPendingHotspot({
        pitch: Number(pitch.toFixed(2)),
        yaw: Number(yaw.toFixed(2))
      });
      setIsAddingHotspot(false);
    };

    const dom = rendererRef.current.domElement;
    dom.style.cursor = 'crosshair';
    dom.addEventListener('pointerdown', handlePointerDown);

    return () => {
      dom.style.cursor = '';
      dom.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isAddingHotspot, rendererRef, sceneRef, cameraRef]);

  // Nuevo: Guardar hotspot con pitch/yaw del click
  const handleSaveHotspotWithCoords = (hotspotData) => {
    handleSaveHotspot({
      ...hotspotData,
      pitch: pendingHotspot?.pitch ?? hotspotData.pitch,
      yaw: pendingHotspot?.yaw ?? hotspotData.yaw
    });
    setPendingHotspot(null);
  };

  if (loading) {
    return <div className="loading">Cargando tour...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Si no hay escenas, muestra mensaje amigable y área de drag & drop
  if (!tour.scenes || tour.scenes.length === 0) {
    return (
      <div className="tour-editor">
        <div ref={containerRef} className="three-container" />
        <ControlPanel
          open={panelOpen}
          setOpen={setPanelOpen}
          tour={tour}
          handleDragDropImage={handleDragDropImage}
          handleImageUpload={handleImageUpload}
          scenes={[]}
        />
      </div>
    );
  }

  return (
    <div className="tour-editor">
      <div ref={containerRef} className="three-container" />
      <ControlPanel
        open={panelOpen}
        setOpen={setPanelOpen}
        tour={tour}
        handleDragDropImage={handleDragDropImage}
        handleImageUpload={handleImageUpload}
        scenes={tour.scenes}
        currentSceneIndex={currentSceneIndex}
        setCurrentSceneIndex={setCurrentSceneIndex}
        setIsAddingHotspot={setIsAddingHotspot}
        onReturn={() => navigate('/')}
      />
      {(selectedHotspot || pendingHotspot) && (
        <HotspotEditor
          hotspot={selectedHotspot || { pitch: pendingHotspot?.pitch, yaw: pendingHotspot?.yaw }}
          scenes={tour.scenes}
          onSave={pendingHotspot ? handleSaveHotspotWithCoords : handleSaveHotspot}
          onCancel={() => {
            setSelectedHotspot(null);
            setIsAddingHotspot(false);
            setPendingHotspot(null);
          }}
        />
      )}
    </div>
  );
}

// Panel lateral plegable
function ControlPanel({
  open,
  setOpen,
  tour,
  handleDragDropImage,
  handleImageUpload,
  scenes,
  currentSceneIndex,
  setCurrentSceneIndex,
  setIsAddingHotspot,
  onReturn
}) {
  return (
    <>
      <aside className={`editor-panel${open ? ' open' : ''}`}>
        <div className="panel-header">
          <span className="panel-title">Tour Virtual 360°</span>
          <button className="panel-toggle" onClick={() => setOpen(!open)}>
            {open ? <>&#10094;</> : <>&#10095;</>}
          </button>
        </div>
        {open && (
          <div className="panel-content">
            <button
              className="btn-return-hub"
              onClick={onReturn}
              style={{
                background: '#23272f',
                color: '#38bdf8',
                border: 'none',
                borderRadius: 8,
                padding: '10px 0',
                fontSize: '1rem',
                fontWeight: 500,
                marginBottom: 18,
                cursor: 'pointer',
                width: '100%',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              ← Volver al Hub
            </button>
            <button className="api-key-btn">🔑 Mostrar API Key</button>
            <div className="panel-section">
              <h3>Imágenes 360°</h3>
              <DragDrop onFileUpload={handleDragDropImage} />
              <div className="panel-dragdrop-hint">o haz clic para seleccionar</div>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
            <div className="panel-section">
              <h3>Imágenes Cargadas ({scenes.length})</h3>
              {scenes.length === 0 ? (
                <div className="panel-empty">No hay imágenes cargadas</div>
              ) : (
                <ul className="panel-image-list">
                  {scenes.map((scene, idx) => (
                    <li
                      key={scene._id || idx}
                      className={`panel-image-item${currentSceneIndex === idx ? ' active' : ''}`}
                      onClick={() => setCurrentSceneIndex && setCurrentSceneIndex(idx)}
                    >
                      <img src={scene.image ? getAbsoluteImageUrl(scene.image) : ''} alt={scene.name} />
                      <span>{scene.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="panel-section panel-hint">
              <span>
                Haz clic en "Agregar Punto de Acceso" en la vista principal para conectar imágenes entre sí.
              </span>
            </div>
            <button
              className="btn-add-hotspot"
              onClick={() => setIsAddingHotspot && setIsAddingHotspot(true)}
            >
              ➕ Agregar Punto de Acceso
            </button>
          </div>
        )}
      </aside>
      {!open && (
        <button
          className="panel-toggle-collapsed"
          onClick={() => setOpen(true)}
          aria-label="Abrir panel de control"
        >
          &#10095;
        </button>
      )}
    </>
  );
}

export default TourEditor;