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
        const tourData = response.data;
        
        // Validar y limpiar datos del tour
        if (tourData && tourData.scenes) {
          tourData.scenes = tourData.scenes.map((scene, sceneIndex) => {
            if (scene.hotspots && Array.isArray(scene.hotspots)) {
              // Limpiar hotspots inválidos
              scene.hotspots = scene.hotspots.filter(hotspot => {
                if (!hotspot || typeof hotspot.pitch !== 'number' || typeof hotspot.yaw !== 'number') {
                  console.warn(`Eliminando hotspot inválido en escena ${sceneIndex}:`, hotspot);
                  return false;
                }
                return true;
              });
            }
            return scene;
          });
        }
        
        setTour(tourData);
        setLoading(false);
        
        console.log('Tour cargado:', {
          id: tourData._id,
          name: tourData.name,
          scenes: tourData.scenes?.length || 0,
          totalHotspots: tourData.scenes?.reduce((total, scene) => total + (scene.hotspots?.length || 0), 0) || 0
        });
      } catch (err) {
        setError('Error al cargar el tour');
        setLoading(false);
        console.error('Error cargando tour:', err);
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

  // Cargar la escena current con manejo optimizado de hotspots
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

    // Limpiar escena anterior completamente
    while (scene.children.length > 0) {
      const child = scene.children[0];
      // Limpiar recursos de Three.js
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
      scene.remove(child);
    }
    
    // Limpiar referencias
    hotspotSpritesRef.current = [];
    accessSpheresRef.current = [];

    // Crear esfera para la imagen 360 con mayor calidad visual
    const geometry = new THREE.SphereGeometry(500, 128, 96);
    geometry.scale(-1, 1, 1);

    const textureLoader = new THREE.TextureLoader();
    let imageUrl = getAbsoluteImageUrl(currentScene.image);

    textureLoader.load(
      imageUrl,
      texture => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        if (texture.colorSpace !== undefined && THREE.LinearSRGBColorSpace) {
          texture.colorSpace = THREE.LinearSRGBColorSpace;
        }
        if (rendererRef.current && rendererRef.current.capabilities.getMaxAnisotropy) {
          texture.anisotropy = Math.min(16, rendererRef.current.capabilities.getMaxAnisotropy());
        }
        
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide
        });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // --- Renderizar Hotspots con estado optimizado ---
        renderHotspotsForScene(currentScene, scene);
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

  // Función de utilidad para depurar hotspots
  const debugHotspots = (sceneData, sceneIndex) => {
    if (!sceneData.hotspots || !Array.isArray(sceneData.hotspots)) {
      console.log(`Escena ${sceneIndex}: No hay hotspots`);
      return;
    }
    
    console.log(`Escena ${sceneIndex} (${sceneData.name}):`, {
      totalHotspots: sceneData.hotspots.length,
      accessHotspots: sceneData.hotspots.filter(h => h.type === 'access').length,
      commerceHotspots: sceneData.hotspots.filter(h => h.type === 'commerce').length,
      locationHotspots: sceneData.hotspots.filter(h => h.type === 'location').length,
      hotspots: sceneData.hotspots.map((h, i) => ({
        index: i,
        type: h.type,
        pitch: h.pitch,
        yaw: h.yaw,
        targetSceneId: h.targetSceneId,
        title: h.title
      }))
    });
  };

  // Función optimizada para renderizar hotspots
  const renderHotspotsForScene = (sceneData, threeScene) => {
    if (!Array.isArray(sceneData.hotspots) || sceneData.hotspots.length === 0) {
      return;
    }

    // Validar y limpiar hotspots antes de renderizar
    const validHotspots = sceneData.hotspots.filter((hotspot, index) => {
      // Validar que el hotspot tenga las propiedades requeridas
      if (!hotspot || typeof hotspot.pitch !== 'number' || typeof hotspot.yaw !== 'number') {
        console.warn(`Hotspot inválido en índice ${index}:`, hotspot);
        return false;
      }
      
      // Validar que el hotspot de acceso tenga targetSceneId
      if (hotspot.type === 'access' && !hotspot.targetSceneId) {
        console.warn(`Hotspot de acceso sin targetSceneId en índice ${index}:`, hotspot);
        return false;
      }
      
      return true;
    });

    console.log(`Renderizando ${validHotspots.length} hotspots válidos para la escena ${currentSceneIndex}`);
    
    // Depurar hotspots para esta escena
    debugHotspots(sceneData, currentSceneIndex);

    validHotspots.forEach((hotspot, index) => {
      try {
        // Convertir pitch/yaw a coordenadas cartesianas
        const radius = 500;
        const phi = THREE.MathUtils.degToRad(90 - hotspot.pitch);
        const theta = THREE.MathUtils.degToRad(hotspot.yaw);
        const x = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.cos(theta);

        let obj3d;
        
        if (hotspot.type === 'access') {
          // Esfera 3D para access con mejor visualización
          const geometry = new THREE.SphereGeometry(12, 32, 32);
          const material = new THREE.MeshStandardMaterial({ 
            color: 0x38bdf8, 
            emissive: 0x0ea5e9, 
            metalness: 0.3, 
            roughness: 0.5 
          });
          obj3d = new THREE.Mesh(geometry, material);
          
          // Agregar información adicional al hotspot para mejor navegación
          obj3d.userData.hotspot = { 
            ...hotspot, 
            sceneIndex: currentSceneIndex,
            sceneName: sceneData.name
          };
          obj3d.userData.isAccessHotspot = true;
          obj3d.userData.hotspotIndex = index;
          accessSpheresRef.current.push(obj3d);
        } else {
          // Sprite para otros tipos con mejor diseño
          const size = 64;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          // Fondo con gradiente
          const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
          gradient.addColorStop(0, '#38bdf8');
          gradient.addColorStop(1, '#0ea5e9');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(size/2, size/2, size/2-4, 0, 2*Math.PI);
          ctx.fill();
          
          // Borde blanco
          ctx.lineWidth = 4;
          ctx.strokeStyle = '#fff';
          ctx.stroke();
          
          // Sombra
          ctx.shadowColor = '#0ea5e9';
          ctx.shadowBlur = 8;
          
          const texture = new THREE.CanvasTexture(canvas);
          const material = new THREE.SpriteMaterial({ 
            map: texture, 
            depthTest: false,
            transparent: true
          });
          obj3d = new THREE.Sprite(material);
          obj3d.scale.set(20, 20, 1);
          obj3d.userData.hotspot = { 
            ...hotspot, 
            sceneIndex: currentSceneIndex,
            sceneName: sceneData.name
          };
          obj3d.userData.hotspotIndex = index;
        }
        
        obj3d.position.set(x, y, z);
        threeScene.add(obj3d);
        hotspotSpritesRef.current.push(obj3d);
        
      } catch (error) {
        console.error('Error renderizando hotspot:', error, hotspot);
      }
    });
  };

  // --- Detección de clics en hotspots optimizada ---
  useEffect(() => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current || !tour) return;
    
    const dom = rendererRef.current.domElement;
    let lastClickTime = 0;
    
    // Función optimizada para navegar a hotspots de acceso
    const doubleClickNavigateToAccessHotspot = (hotspot) => {
      if (!hotspot || hotspot.type !== 'access' || !hotspot.targetSceneId) {
        console.log('Hotspot inválido para navegación:', hotspot);
        return;
      }
      
      // Buscar la escena destino usando diferentes métodos de comparación
      let targetIdx = -1;
      
      // Método 1: Comparación directa de IDs
      targetIdx = tour.scenes.findIndex(s => String(s._id) === String(hotspot.targetSceneId));
      
      // Método 2: Si no se encuentra, buscar por índice (fallback)
      if (targetIdx === -1 && typeof hotspot.targetSceneId === 'number') {
        targetIdx = hotspot.targetSceneId;
      }
      
      // Método 3: Buscar por nombre de escena (fallback adicional)
      if (targetIdx === -1 && hotspot.targetSceneName) {
        targetIdx = tour.scenes.findIndex(s => s.name === hotspot.targetSceneName);
      }
      
      if (targetIdx !== -1 && targetIdx < tour.scenes.length) {
        console.log(`Navegando de escena ${currentSceneIndex} a escena ${targetIdx}`);
        startTransition(targetIdx);
      } else {
        console.error('Escena destino no encontrada:', {
          targetSceneId: hotspot.targetSceneId,
          availableScenes: tour.scenes.map((s, i) => ({ index: i, id: s._id, name: s.name }))
        });
      }
    };
    
    // Función optimizada para manejar clics en hotspots
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
      
      // Usar todos los objetos de la escena actual para detectar hotspots
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const now = Date.now();
        
        // Verificar si es un hotspot
        if (obj.userData && obj.userData.hotspot) {
          const hotspot = obj.userData.hotspot;
          
          if (obj.userData.isAccessHotspot) {
            if (now - lastClickTime < 400) { // doble click
              console.log('Doble clic en hotspot de acceso:', hotspot);
              doubleClickNavigateToAccessHotspot(hotspot);
            }
            lastClickTime = now;
          } else {
            console.log('Clic en hotspot informativo:', hotspot);
            setSelectedHotspot(hotspot);
          }
        }
      }
    }
    
    dom.addEventListener('pointerdown', onPointerDown);
    
    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
    };
  }, [tour, currentSceneIndex, hotspotSpritesRef.current]);

  // Animación de transición optimizada
  function startTransition(targetIdx) {
    if (fade) return; // Evitar doble trigger
    
    console.log(`Iniciando transición de escena ${currentSceneIndex} a ${targetIdx}`);
    
    setFade(true);
    setPendingSceneIndex(targetIdx);
    
    // Limpiar estados de hotspots antes de la transición
    setSelectedHotspot(null);
    setPlacementMode(false);
    
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
          console.log(`Cambiando a escena ${targetIdx}`);
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
        
        if (transitioning) {
          requestAnimationFrame(renderTransition);
        } else {
          sceneRef.current.remove(sphere);
        }
      }
      
      renderTransition();
    });
  }, [transitioning, transitionProgress, pendingSceneIndex, tour]);

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

  // Guardar hotspot optimizado
  const handleSaveHotspot = async (hotspotData) => {
    try {
      console.log('Guardando hotspot:', hotspotData);
      
      const updatedScenes = [...tour.scenes];
      const currentScene = updatedScenes[currentSceneIndex];

      if (hotspotData._id) {
        // Actualizar hotspot existente
        const index = currentScene.hotspots.findIndex(h => h._id === hotspotData._id);
        if (index !== -1) {
          currentScene.hotspots[index] = {
            ...currentScene.hotspots[index],
            ...hotspotData
          };
        }
      } else {
        // Crear nuevo hotspot
        const newHotspot = {
          ...hotspotData,
          _id: Date.now().toString()
        };
        currentScene.hotspots.push(newHotspot);
      }

      const updatedTour = { ...tour, scenes: updatedScenes };
      setTour(updatedTour);
      
      // Guardar en el backend
      await api.updateTour(tourId, updatedTour);
      
      // Recargar el tour desde la API para asegurar sincronización
      const response = await api.getTour(tourId);
      const refreshedTour = response.data ? response.data : response;
      setTour(refreshedTour);
      
      // Limpiar estados
      setSelectedHotspot(null);
      setPlacementMode(false);
      
      console.log('Hotspot guardado exitosamente');
    } catch (err) {
      console.error('Error guardando hotspot:', err);
      alert(`Error al guardar: ${err.error || 'Intente nuevamente'}`);
    }
  };

  // Nuevo: Guardar hotspot con pitch/yaw del click
  const handleSaveHotspotWithCoords = (hotspotData) => {
    handleSaveHotspot({
      ...hotspotData,
      pitch: pendingHotspot?.pitch ?? hotspotData.pitch,
      yaw: pendingHotspot?.yaw ?? hotspotData.yaw
    });
    setPendingHotspot(null);
  };

  // Efecto unificado para manejar el modo de colocación de hotspots
  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const dom = rendererRef.current.domElement;

    if (placementMode) {
      dom.style.cursor = 'crosshair';
      // Elimina overlay visual, solo usa cursor
      // El handler de click está en el canvas principal (ver más abajo)
    } else {
      dom.style.cursor = '';
    }
  }, [placementMode, rendererRef, sceneRef, cameraRef]);

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

  // Guardar el nuevo hotspot usando el endpoint REST optimizado
  const saveNewHotspot = async (hotspotData) => {
    try {
      console.log('Guardando nuevo hotspot:', hotspotData);
      
      if (!tour || !tour.scenes || !tour.scenes[currentSceneIndex]) {
        throw new Error('Tour o escena no disponible');
      }
      
      const sceneId = tour.scenes[currentSceneIndex]._id;
      const response = await api.addHotspot(tour._id, sceneId, hotspotData);
      
      // Obtener el hotspot creado
      const newHotspot = response.data ? response.data : response;
      console.log('Hotspot creado en backend:', newHotspot);
      
      // Actualizar el estado local
      const updatedTour = { ...tour };
      updatedTour.scenes = [...updatedTour.scenes];
      const scene = updatedTour.scenes[currentSceneIndex];
      scene.hotspots = [...scene.hotspots, newHotspot];
      setTour(updatedTour);
      
      // Limpiar estados
      setShowHotspotModal(false);
      setNewHotspotPosition(null);
      setPlacementMode(false);
      
      // Recargar el tour desde la API para asegurar sincronización completa
      const refreshed = await api.getTour(tourId);
      const refreshedTour = refreshed.data ? refreshed.data : refreshed;
      setTour(refreshedTour);
      
      console.log('Nuevo hotspot guardado exitosamente');
    } catch (error) {
      console.error('Error al guardar el hotspot:', error);
      alert(`Error al guardar el hotspot: ${error.message || 'Intente nuevamente'}`);
      setShowHotspotModal(false);
      setNewHotspotPosition(null);
      setPlacementMode(false);
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
          placementMode={placementMode}
          setPlacementMode={setPlacementMode}
          onReturn={() => navigate('/hub')}
          handleDeleteHotspot={handleDeleteHotspot}
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
        placementMode={placementMode}
        setPlacementMode={setPlacementMode}
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
            setPlacementMode(false);
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
  placementMode,
  setPlacementMode,
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
              <h3>Hotspots de la Escena ({scenes[currentSceneIndex]?.hotspots?.length || 0})</h3>
              <div className="hotspot-controls" style={{marginBottom: 15}}>
                <button
                  className="btn-add-hotspot"
                  onClick={() => setPlacementMode(true)}
                  title="Haz clic para activar el modo de colocación de hotspots. Luego haz clic en la imagen 360° donde quieras colocar el hotspot."
                  style={{
                    background: '#38bdf8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#0ea5e9'}
                  onMouseLeave={(e) => e.target.style.background = '#38bdf8'}
                >
                  <span style={{fontSize: '16px'}}>📍</span>
                  Agregar Hotspot
                </button>
                {placementMode && (
                  <div className="placement-mode-indicator">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                      <strong>Modo de colocación activado</strong>
                      <button
                        onClick={() => setPlacementMode(false)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #ef4444',
                          color: '#ef4444',
                          borderRadius: 4,
                          padding: '4px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#ef4444';
                          e.target.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.color = '#ef4444';
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                    Haz clic en la imagen 360° para colocar el hotspot
                  </div>
                )}
              </div>
              {scenes[currentSceneIndex]?.hotspots?.length === 0 ? (
                <div style={{
                  background: '#1e293b',
                  border: '1px dashed #334155',
                  borderRadius: 6,
                  padding: '20px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '14px'
                }}>
                  <div style={{fontSize: '24px', marginBottom: '8px'}}>📍</div>
                  No hay hotspots en esta escena
                  <div style={{fontSize: '12px', marginTop: '4px'}}>
                    Haz clic en "Agregar Hotspot" para comenzar
                  </div>
                </div>
              ) : (
                <>
                  {/* Resumen de tipos de hotspots */}
                  <div style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 6,
                    padding: '8px 12px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#94a3b8'
                  }}>
                    {(() => {
                      const hotspots = scenes[currentSceneIndex].hotspots;
                      const types = {
                        access: hotspots.filter(h => h.type === 'access').length,
                        commerce: hotspots.filter(h => h.type === 'commerce').length,
                        location: hotspots.filter(h => h.type === 'location').length
                      };
                      return (
                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                          <span>📍 Acceso: {types.access}</span>
                          <span>🏪 Comercio: {types.commerce}</span>
                          <span>📍 Locación: {types.location}</span>
                        </div>
                      );
                    })()}
                  </div>
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
                </>
              )}
            </div>
            <div className="panel-section panel-hint">
              <p><strong>Tipos de Hotspots:</strong></p>
              <ul style={{margin: '8px 0', paddingLeft: '20px', fontSize: '13px'}}>
                <li><strong>📍 Acceso:</strong> Navega a otra escena del tour</li>
                <li><strong>🏪 Comercio:</strong> Muestra información de un negocio</li>
                <li><strong>📍 Locación:</strong> Muestra información de un lugar</li>
              </ul>
              <p style={{marginTop: '12px', fontSize: '13px'}}>
                <strong>Controles:</strong><br/>
                • Haz doble clic en hotspots de acceso para navegar<br/>
                • Haz clic en hotspots para ver/editar información
              </p>
            </div>
          </div>
        )}
      </aside>
      <div className={`editor-backdrop${open ? ' open' : ''}`} onClick={() => setOpen(false)} />
    </>
  );
}

export default TourEditor;