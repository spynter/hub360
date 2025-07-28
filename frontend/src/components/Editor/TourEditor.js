import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import HotspotEditor from './HotspotEditor';
import api from '../../services/api';
import DragDrop from './DragDrop';
import { useNavigate } from 'react-router-dom';
import './TourEditor.css';
import ApiKeyManager from './ApiKeyManager';
import HotspotCreationModal from './HotspotCreationModal';
import RadialFadeMaterial from '../shaders/RadialFadeMaterial';

// Utilidad para obtener la URL absoluta de la imagen
function getAbsoluteImageUrl(image) {
  if (!image) return '';
  if (image.startsWith('/uploads/')) {
    return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${image}`;
  }
  return image;
}

function createHotspotSprite(hotspot, onClick) {
  // Crear un canvas para el ícono visual
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  // Círculo azul claro
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2-4, 0, 2*Math.PI);
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#0ea5e9';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  // Icono de flecha si es access
  if (hotspot.type === 'access') {
    ctx.beginPath();
    ctx.moveTo(size/2, size/2-12);
    ctx.lineTo(size/2+10, size/2+8);
    ctx.lineTo(size/2-10, size/2+8);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(20, 20, 1); // tamaño visual
  sprite.userData.hotspot = hotspot;
  if (onClick) sprite.userData.onClick = onClick;
  return sprite;
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
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
  const [placementMode, setPlacementMode] = useState(false);
  const [newHotspotPosition, setNewHotspotPosition] = useState(null);
  const [showHotspotModal, setShowHotspotModal] = useState(false);
  const navigate = useNavigate();
  const [fade, setFade] = useState(false);
  const [pendingSceneIndex, setPendingSceneIndex] = useState(null);
  // Estado para transición cruzada
  const [transitioning, setTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [prevTexture, setPrevTexture] = useState(null);

  // Referencias de Three.js
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();
  // Referencia a los sprites de hotspots
  const hotspotSpritesRef = useRef([]);
  // 1. Al guardar un nuevo hotspot, solo guarda el objeto de datos
  const accessSpheresRef = useRef([]);

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
    controls.rotateSpeed = -0.5; // INVERTIR dirección de rotación
    // Soporte de zoom con scroll del mouse
    controls.enableZoom = true;
    controls.minDistance = 0.05;
    controls.maxDistance = 2.5;
    // Limitar fov para evitar zoom extremo
    renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      camera.fov = Math.max(30, Math.min(100, camera.fov + (e.deltaY > 0 ? 2 : -2)));
      camera.updateProjectionMatrix();
    }, { passive: false });

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      // Animación de expansión/contracción para esferas access
      if (accessSpheresRef.current && accessSpheresRef.current.length > 0) {
        const t = Date.now() * 0.003;
        accessSpheresRef.current.forEach(sphere => {
          const scale = 1.1 + 0.15 * Math.sin(t + sphere.position.x);
          sphere.scale.set(scale, scale, scale);
        });
      }
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
    accessSpheresRef.current = [];

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

        // --- Renderizar Hotspots ---
        hotspotSpritesRef.current = [];
        if (Array.isArray(currentScene.hotspots)) {
          currentScene.hotspots.forEach(hotspot => {
            // Convertir pitch/yaw a coordenadas cartesianas
            const radius = 500;
            const phi = THREE.MathUtils.degToRad(90 - hotspot.pitch);
            const theta = THREE.MathUtils.degToRad(hotspot.yaw);
            const x = radius * Math.sin(phi) * Math.sin(theta);
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(phi) * Math.cos(theta);
            let obj3d;
            if (hotspot.type === 'access') {
              // Esfera 3D para access
              const geometry = new THREE.SphereGeometry(12, 32, 32);
              const material = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, metalness: 0.3, roughness: 0.5 });
              obj3d = new THREE.Mesh(geometry, material);
              obj3d.userData.hotspot = hotspot;
              obj3d.userData.isAccessHotspot = true;
              accessSpheresRef.current.push(obj3d);
            } else {
              // Sprite para otros tipos
              const size = 64;
              const canvas = document.createElement('canvas');
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext('2d');
              ctx.beginPath();
              ctx.arc(size/2, size/2, size/2-4, 0, 2*Math.PI);
              ctx.fillStyle = '#38bdf8';
              ctx.shadowColor = '#0ea5e9';
              ctx.shadowBlur = 8;
              ctx.fill();
              ctx.lineWidth = 4;
              ctx.strokeStyle = '#fff';
              ctx.stroke();
              const texture = new THREE.CanvasTexture(canvas);
              const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
              obj3d = new THREE.Sprite(material);
              obj3d.scale.set(20, 20, 1);
              obj3d.userData.hotspot = hotspot;
            }
            obj3d.position.set(x, y, z);
            scene.add(obj3d);
            hotspotSpritesRef.current.push(obj3d);
          });
        }
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

  // --- Detección de clics en hotspots ---
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
    const dom = rendererRef.current.domElement;
    let lastClickTime = 0;
    // 1. Comparación de IDs como string en la navegación de hotspots
    const doubleClickNavigateToAccessHotspot = (hotspot) => {
      if (hotspot && hotspot.type === 'access' && hotspot.targetSceneId) {
        const idx = tour.scenes.findIndex(s => String(s._id) === String(hotspot.targetSceneId));
        if (idx !== -1) {
          startTransition(idx);
        }
      }
    };
    function onPointerDown(event) {
      // Solo click izquierdo
      if (event.button !== 0) return;
      const rect = dom.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(hotspotSpritesRef.current || [], true);
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const now = Date.now();
        if (obj.userData.isAccessHotspot) {
          if (now - lastClickTime < 400) { // doble click
            doubleClickNavigateToAccessHotspot(obj.userData.hotspot);
          }
          lastClickTime = now;
        } else if (obj.userData.hotspot) {
          setSelectedHotspot(obj.userData.hotspot);
        }
      }
    }
    dom.addEventListener('pointerdown', onPointerDown);
    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
    };
  }, [tour, currentSceneIndex]);

  // Animación de transición
  function startTransition(targetIdx) {
    if (fade) return; // Evitar doble trigger
    setFade(true);
    setPendingSceneIndex(targetIdx);
    // Animar FOV (zoom in)
    const camera = cameraRef.current;
    if (!camera) return;
    let startFov = camera.fov;
    let endFov = 35;
    let duration = 350;
    let start = null;
    function animateZoomIn(ts) {
      if (!start) start = ts;
      let progress = Math.min((ts - start) / duration, 1);
      camera.fov = startFov + (endFov - startFov) * progress;
      camera.updateProjectionMatrix();
      if (progress < 1) {
        requestAnimationFrame(animateZoomIn);
      } else {
        // Esperar un poco y luego cambiar escena
        setTimeout(() => {
          setCurrentSceneIndex(targetIdx);
        }, 200);
      }
    }
    requestAnimationFrame(animateZoomIn);
  }

  // Animar transición cruzada
  useEffect(() => {
    if (!transitioning) return;
    let frame;
    function animate() {
      setTransitionProgress(prev => {
        const next = Math.min(prev + 0.04, 1);
        if (next < 1) {
          frame = requestAnimationFrame(animate);
        } else {
          setTransitioning(false);
          setPrevTexture(null);
          setCurrentSceneIndex(pendingSceneIndex);
        }
        return next;
      });
    }
    animate();
    return () => cancelAnimationFrame(frame);
  }, [transitioning]);

  // Modificar render de la escena para usar el shader durante la transición
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;
    if (!transitioning || !prevTexture) return;
    // Crear geometría y materiales
    const geometry = new THREE.SphereGeometry(500, 128, 96);
    geometry.scale(-1, 1, 1);
    const currentScene = tour.scenes[pendingSceneIndex];
    const loader = new THREE.TextureLoader();
    loader.load(getAbsoluteImageUrl(currentScene.image), nextTexture => {
      // Material de transición
      const material = RadialFadeMaterial(prevTexture, nextTexture, transitionProgress);
      const sphere = new THREE.Mesh(geometry, material);
      sceneRef.current.add(sphere);
      // Render loop
      function renderTransition() {
        material.uniforms.uProgress.value = transitionProgress;
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        if (transitioning) requestAnimationFrame(renderTransition);
        else sceneRef.current.remove(sphere);
      }
      renderTransition();
    });
  }, [transitioning, transitionProgress]);

  // Cuando cambia la escena, hacer fade out y zoom out
  useEffect(() => {
    if (pendingSceneIndex === null) return;
    // Animar FOV (zoom out) y quitar fade
    const camera = cameraRef.current;
    if (!camera) return;
    let startFov = camera.fov;
    let endFov = 75;
    let duration = 400;
    let start = null;
    function animateZoomOut(ts) {
      if (!start) start = ts;
      let progress = Math.min((ts - start) / duration, 1);
      camera.fov = startFov + (endFov - startFov) * progress;
      camera.updateProjectionMatrix();
      if (progress < 1) {
        requestAnimationFrame(animateZoomOut);
      } else {
        setFade(false);
        setPendingSceneIndex(null);
      }
    }
    setTimeout(() => {
      requestAnimationFrame(animateZoomOut);
    }, 250);
  }, [currentSceneIndex]);

  // Manejar subida de imágenes
  const handleImageUpload = async (e) => {
    let files = [];
    if (e.target && e.target.files && e.target.files.length > 0) {
      files = Array.from(e.target.files);
    } else if (e instanceof File) {
      files = [e];
    } else if (Array.isArray(e)) {
      files = e;
    }
    if (!files.length) return;
    for (const file of files) {
      try {
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
    }
  };

  // Manejar subida de imágenes (DragDrop)
  const handleDragDropImage = async (files) => {
    if (Array.isArray(files)) {
      for (const file of files) {
        await handleImageUpload(file);
      }
    } else {
      await handleImageUpload(files);
    }
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
      // Recarga el tour desde la API para asegurar sincronización
      const response = await api.getTour(tourId);
      setTour(response.data ? response.data : response);
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

  // Nuevo: Manejar click en la escena para colocar hotspot
  const handleSceneClick = (event) => {
    if (!placementMode) return;
    // Obtener coordenadas del ratón normalizadas
    const mouse = new THREE.Vector2();
    const rect = containerRef.current.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // Intersectar con la esfera (único mesh en la escena)
    const intersects = raycaster.intersectObjects(sceneRef.current.children);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const radius = 500;
      const phi = Math.acos(point.y / radius);
      const theta = Math.atan2(point.x, point.z); // x primero, z segundo
      const pitch = 90 - THREE.MathUtils.radToDeg(phi);
      const yaw = THREE.MathUtils.radToDeg(theta);
      setNewHotspotPosition({ pitch, yaw });
      setShowHotspotModal(true);
      setPlacementMode(false);
    }
  };

  // Guardar el nuevo hotspot usando el endpoint REST
  const saveNewHotspot = async (hotspotData) => {
    try {
      if (!tour || !tour.scenes || !tour.scenes[currentSceneIndex]) return;
      const sceneId = tour.scenes[currentSceneIndex]._id;
      const response = await api.addHotspot(tour._id, sceneId, hotspotData);
      // Solo guardar el objeto de datos, no la respuesta completa
      const newHotspot = response.data ? response.data : response;
      const updatedTour = { ...tour };
      updatedTour.scenes = [...updatedTour.scenes];
      const scene = updatedTour.scenes[currentSceneIndex];
      scene.hotspots = [...scene.hotspots, newHotspot];
      setTour(updatedTour);
      setShowHotspotModal(false);
      setNewHotspotPosition(null);
      // Recarga el tour desde la API para asegurar sincronización
      const refreshed = await api.getTour(tourId);
      setTour(refreshed.data ? refreshed.data : refreshed);
    } catch (error) {
      alert('Error al guardar el hotspot');
      setShowHotspotModal(false);
      setNewHotspotPosition(null);
    }
  };

  // Reemplaza la función handleDeleteScene global para aceptar el índice de la escena a eliminar
  useEffect(() => {
    window.handleDeleteScene = async (deleteIdx) => {
      if (!tour || !tour.scenes || tour.scenes.length <= 1) return;
      const updatedScenes = tour.scenes.filter((_, idx) => idx !== deleteIdx);
      let newIndex = currentSceneIndex;
      if (deleteIdx === currentSceneIndex) {
        newIndex = deleteIdx === 0 ? 0 : deleteIdx - 1;
      } else if (deleteIdx < currentSceneIndex) {
        newIndex = currentSceneIndex - 1;
      }
      const updatedTour = { ...tour, scenes: updatedScenes };
      setTour(updatedTour);
      setCurrentSceneIndex(newIndex);
      await api.updateTour(tour._id, updatedTour);
    };
    return () => { window.handleDeleteScene = undefined; };
  }, [tour, currentSceneIndex]);

  // 1. Función para eliminar hotspot de la escena actual
  const handleDeleteHotspot = async (hotspotIdx) => {
    if (!tour || !tour.scenes || !tour.scenes[currentSceneIndex]) return;
    const updatedScenes = [...tour.scenes];
    const scene = { ...updatedScenes[currentSceneIndex] };
    scene.hotspots = scene.hotspots.filter((_, idx) => idx !== hotspotIdx);
    updatedScenes[currentSceneIndex] = scene;
    const updatedTour = { ...tour, scenes: updatedScenes };
    setTour(updatedTour);
    await api.updateTour(tour._id, updatedTour);
  };

  // --- GIROSCOPIO: Lógica de activación y manejo estilo YouTube 360 ---
  useEffect(() => {
    if (!isMobileDevice() || !cameraRef.current || !controlsRef.current) return;

    // Habilitar/deshabilitar OrbitControls según el estado del giroscopio
    controlsRef.current.enabled = true;

    let lastAlpha = 0, lastBeta = 0, lastGamma = 0;
    let smoothAlpha = 0, smoothBeta = 0, smoothGamma = 0;
    const smoothFactor = 0.15;

    function getScreenOrientation() {
      if (window.screen.orientation && window.screen.orientation.angle !== undefined) {
        return window.screen.orientation.angle;
      }
      return window.orientation || 0;
    }

    function handleOrientation(event) {
      let alpha = event.alpha || 0;
      let beta = event.beta || 0;
      let gamma = event.gamma || 0;

      // INVERTIR alpha para invertir la rotación horizontal
      alpha = -alpha;

      smoothAlpha = smoothAlpha * (1 - smoothFactor) + alpha * smoothFactor;
      smoothBeta = smoothBeta * (1 - smoothFactor) + beta * smoothFactor;
      smoothGamma = smoothGamma * (1 - smoothFactor) + gamma * smoothFactor;

      const _alpha = THREE.MathUtils.degToRad(smoothAlpha);
      const _beta = THREE.MathUtils.degToRad(smoothBeta);
      const _gamma = THREE.MathUtils.degToRad(smoothGamma);

      const orient = getScreenOrientation();
      const orientRad = THREE.MathUtils.degToRad(orient);

      const zee = new THREE.Vector3(0, 0, 1);
      const euler = new THREE.Euler();
      const q0 = new THREE.Quaternion();
      const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

      euler.set(_beta, _alpha, -_gamma, 'YXZ');
      let quaternion = new THREE.Quaternion().setFromEuler(euler);
      quaternion.multiply(q1);
      quaternion.multiply(q0.setFromAxisAngle(zee, -orientRad));

      cameraRef.current.quaternion.copy(quaternion);
    }

    window.addEventListener('deviceorientation', handleOrientation, true);

    const handleScreenOrientation = () => {
      smoothAlpha = lastAlpha;
      smoothBeta = lastBeta;
      smoothGamma = lastGamma;
    };
    window.addEventListener('orientationchange', handleScreenOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('orientationchange', handleScreenOrientation);
      // Rehabilitar OrbitControls al salir del modo giroscopio
      if (controlsRef.current) controlsRef.current.enabled = true;
    };
  }, []);

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
      <div
        ref={containerRef}
        className="three-container"
        onClick={handleSceneClick}
      />
      <div className={`fade-overlay${fade ? ' visible' : ''}`}></div>
      <ControlPanel
        open={panelOpen}
        setOpen={setPanelOpen}
        tour={tour}
        handleDragDropImage={handleDragDropImage}
        handleImageUpload={handleImageUpload}
        scenes={tour.scenes}
        currentSceneIndex={currentSceneIndex}
        setCurrentSceneIndex={setCurrentSceneIndex}
        setIsAddingHotspot={() => setPlacementMode(true)}
        onReturn={() => navigate('/hub')}
        handleDeleteHotspot={handleDeleteHotspot}
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
      {showHotspotModal && newHotspotPosition && (
        <HotspotCreationModal
          position={newHotspotPosition}
          tour={tour}
          currentSceneIndex={currentSceneIndex}
          onSave={saveNewHotspot}
          onCancel={() => {
            setShowHotspotModal(false);
            setNewHotspotPosition(null);
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
  onReturn,
  handleDeleteHotspot
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
            <ApiKeyManager tourId={tour._id} initialApiKey={tour.apiKey} />
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
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }} onClick={() => setCurrentSceneIndex && setCurrentSceneIndex(idx)}>
                        <img src={scene.image ? getAbsoluteImageUrl(scene.image) : ''} alt={scene.name} />
                        <span>{scene.name}</span>
                      </div>
                      {scenes.length > 1 && (
                        <button
                          className="btn-delete-scene"
                          style={{ background: 'transparent', color: '#ef4444', border: 'none', marginLeft: 8, fontSize: 20, cursor: 'pointer' }}
                          title="Eliminar escena"
                          onClick={e => {
                            e.stopPropagation();
                            if (window.confirm('¿Seguro que deseas eliminar esta escena?')) {
                              if (typeof window.handleDeleteScene === 'function') window.handleDeleteScene(idx);
                            }
                          }}
                        >
                          🗑️
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="panel-section">
              <h3>Hotspots de la Escena</h3>
              <ul className="panel-hotspot-list">
                {scenes[currentSceneIndex].hotspots.map((hotspot, idx) => {
                  let accessInfo = null;
                  if (hotspot.type === 'access' && hotspot.targetSceneId) {
                    const target = scenes.find(s => String(s._id) === String(hotspot.targetSceneId));
                    accessInfo = target ? `→ ${target.name}` : '→ [Escena no encontrada]';
                  }
                  return (
                    <li key={hotspot._id || idx} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                      <span>
                        {hotspot.type === 'access' ? 'Punto de Acceso' : (hotspot.title || 'Hotspot')}
                        {accessInfo && <span style={{color:'#38bdf8',marginLeft:8,fontSize:13}}>{accessInfo}</span>}
                      </span>
                      <button style={{background:'transparent',color:'#ef4444',border:'none',fontSize:18,cursor:'pointer'}} title="Eliminar hotspot" onClick={()=>{if(window.confirm('¿Eliminar este hotspot?'))handleDeleteHotspot(idx)}}>🗑️</button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="panel-section panel-hint">
              <p>Haz doble clic en un hotspot de tipo "Acceso" para navegar a la escena vinculada.</p>
              <p>Usa Ctrl + clic para seleccionar múltiples hotspots.</p>
            </div>
          </div>
        )}
      </aside>
      <div className={`editor-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} />
    </>
  );
}

export default TourEditor;