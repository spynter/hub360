import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import api from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import './TourViewer.css';
import RadialFadeMaterial from '../shaders/RadialFadeMaterial';

function getAbsoluteImageUrl(image) {
  if (!image) return '';
  if (image.startsWith('/uploads/')) {
    return `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${image}`;
  }
  return image;
}

function TourViewer() {
  const { tourId } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [fade, setFade] = useState(false);
  const [pendingSceneIndex, setPendingSceneIndex] = useState(null);
  const containerRef = useRef();
  const navigate = useNavigate();
  const cameraRef = useRef();
  const sceneRef = useRef();
  const rendererRef = useRef();
  const [transitioning, setTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [prevTexture, setPrevTexture] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const [gyroControls, setGyroControls] = useState(null);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        const response = await api.getTour(tourId);
        setTour(response.data);
        setLoading(false);
      } catch (err) {
        setError('No se pudo cargar el tour');
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId]);

  // Solicitar permiso de orientación del dispositivo
  const requestGyroPermission = async () => {
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          setGyroEnabled(true);
        }
      } else {
        setGyroEnabled(true);
      }
    } catch (err) {
      console.error('Error al solicitar permiso del giroscopio:', err);
    }
  };

  useEffect(() => {
    if (!tour || !tour.scenes || tour.scenes.length === 0) return;

    // Limpiar canvas anterior si existe
    if (containerRef.current) {
      while (containerRef.current.firstChild) {
        containerRef.current.removeChild(containerRef.current.firstChild);
      }
    }

    // Configuración de Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0.1);
    cameraRef.current = camera;
    sceneRef.current = scene;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
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

    // Cargar escena actual
    const loadScene = (index) => {
      // Limpiar escena
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
      const sceneData = tour.scenes[index];
      const geometry = new THREE.SphereGeometry(500, 128, 96);
      geometry.scale(-1, 1, 1);
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(getAbsoluteImageUrl(sceneData.image), texture => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        if (texture.colorSpace !== undefined && THREE.LinearSRGBColorSpace) {
          texture.colorSpace = THREE.LinearSRGBColorSpace;
        }
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide
        });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // Renderizar hotspots de acceso
        if (Array.isArray(sceneData.hotspots)) {
          sceneData.hotspots.forEach(hotspot => {
            if (hotspot.type === 'access') {
              const radius = 500;
              const phi = THREE.MathUtils.degToRad(90 - hotspot.pitch);
              const theta = THREE.MathUtils.degToRad(hotspot.yaw);
              const x = radius * Math.sin(phi) * Math.sin(theta);
              const y = radius * Math.cos(phi);
              const z = radius * Math.sin(phi) * Math.cos(theta);
              const hGeo = new THREE.SphereGeometry(12, 32, 32);
              const hMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0ea5e9, metalness: 0.3, roughness: 0.5 });
              const hMesh = new THREE.Mesh(hGeo, hMat);
              hMesh.position.set(x, y, z);
              hMesh.userData.hotspot = hotspot;
              hMesh.userData.isAccessHotspot = true;
              scene.add(hMesh);
            }
          });
        }
      });
    };

    loadScene(currentSceneIndex);

    // Animación y hover
    let hoveredObj = null;
    const animate = () => {
      requestAnimationFrame(animate);
      // Recalcular accessSpheres en cada frame
      const accessSpheres = [];
      scene.traverse(obj => {
        if (obj.userData && obj.userData.isAccessHotspot) accessSpheres.push(obj);
      });
      // Animación de expansión/contracción para esferas access
      if (accessSpheres.length > 0) {
        const t = Date.now() * 0.003;
        accessSpheres.forEach(sphere => {
          let scale = 1.1 + 0.15 * Math.sin(t + sphere.position.x);
          if (sphere === hoveredObj) scale *= 1.25; // resalta al hacer hover
          sphere.scale.set(scale, scale, scale);
        });
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Doble click para navegar entre escenas
    let lastClickTime = 0;
    const dom = renderer.domElement;
    function getAccessSpheres() {
      const arr = [];
      scene.traverse(obj => {
        if (obj.userData && obj.userData.isAccessHotspot) arr.push(obj);
      });
      return arr;
    }
    function onPointerDown(event) {
      if (event.button !== 0) return;
      const rect = dom.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      const accessSpheres = getAccessSpheres();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(accessSpheres, true);
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const now = Date.now();
        if (obj.userData.isAccessHotspot) {
          if (now - lastClickTime < 400) {
            const hotspot = obj.userData.hotspot;
            if (hotspot && hotspot.type === 'access' && hotspot.targetSceneId) {
              const idx = tour.scenes.findIndex(s => String(s._id) === String(hotspot.targetSceneId));
              if (idx !== -1) {
                // Iniciar animación de transición
                startTransition(idx);
              }
            }
          }
          lastClickTime = now;
        }
      }
    }
    function onPointerMove(event) {
      const rect = dom.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      const accessSpheres = getAccessSpheres();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(accessSpheres, true);
      if (intersects.length > 0) {
        hoveredObj = intersects[0].object;
        dom.style.cursor = 'pointer';
      } else {
        hoveredObj = null;
        dom.style.cursor = '';
      }
    }
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);

    // Manejar redimensionamiento
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Limpieza
    return () => {
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      if (renderer) {
        renderer.dispose();
        if (containerRef.current && renderer.domElement)
          containerRef.current.removeChild(renderer.domElement);
      }
      if (gyroControls) {
        gyroControls.disconnect();
      }
    };
  }, [tour, currentSceneIndex, isMobile]);

  // Animación de transición
  function startTransition(targetIdx) {
    if (transitioning) return; // Evitar doble trigger
    const scene = sceneRef.current;
    const renderer = rendererRef.current;
    // Capturar textura de la escena actual
    const renderTarget = new THREE.WebGLRenderTarget(
      renderer.domElement.width,
      renderer.domElement.height
    );
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, cameraRef.current);
    renderer.setRenderTarget(null);
    setPrevTexture(renderTarget.texture);
    setTransitioning(true);
    setTransitionProgress(0);
    setPendingSceneIndex(targetIdx);
  }

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

  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;
    if (!transitioning || !prevTexture) return;
    const geometry = new THREE.SphereGeometry(500, 128, 96);
    geometry.scale(-1, 1, 1);
    const currentScene = tour.scenes[pendingSceneIndex];
    const loader = new THREE.TextureLoader();
    loader.load(getAbsoluteImageUrl(currentScene.image), nextTexture => {
      const material = RadialFadeMaterial(prevTexture, nextTexture, transitionProgress);
      const sphere = new THREE.Mesh(geometry, material);
      sceneRef.current.add(sphere);
      function renderTransition() {
        material.uniforms.uProgress.value = transitionProgress;
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        if (transitioning) requestAnimationFrame(renderTransition);
        else sceneRef.current.remove(sphere);
      }
      renderTransition();
    });
  }, [transitioning, transitionProgress]);

  if (loading) {
    return <div className="viewer-loading">Cargando tour...</div>;
  }
  if (error) {
    return <div className="viewer-error">{error}</div>;
  }
  if (!tour) {
    return <div className="viewer-error">Tour no encontrado</div>;
  }

  return (
    <div className="tour-viewer-container">
      <div ref={containerRef} className="three-container"></div>
      <div className={`fade-overlay${fade ? ' visible' : ''}`}></div>
      <div className="gyro-controls">
        <button
          className={`gyro-toggle ${gyroEnabled ? 'active' : ''}`}
          onClick={requestGyroPermission}
          title="Activar giroscopio"
        >
          🌀
        </button>
        <button className="btn-return" onClick={() => navigate('/')}>Volver al mapa</button>
      </div>
    </div>
  );
}

export default TourViewer;