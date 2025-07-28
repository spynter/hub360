import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './EmbedViewer.css';
import RadialFadeMaterial from '../shaders/RadialFadeMaterial';

function EmbedViewer({ tour }) {
  const containerRef = useRef();
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [fade, setFade] = useState(false);
  const [pendingSceneIndex, setPendingSceneIndex] = useState(null);
  const cameraRef = useRef();
  const [transitioning, setTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [prevTexture, setPrevTexture] = useState(null);

  useEffect(() => {
    if (!tour || !tour.scenes || tour.scenes.length === 0) return;

    // Configuración de Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    camera.position.set(0, 0, 0.1);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Cargar escena actual
    const loadScene = (index) => {
      // Limpiar escena
      while(scene.children.length > 0) { 
        scene.remove(scene.children[0]); 
      }
      
      const sceneData = tour.scenes[index];
      const geometry = new THREE.SphereGeometry(500, 128, 96);
      geometry.scale(-1, 1, 1);
      
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(sceneData.image, texture => {
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
    
    // Cargar primera escena
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

    // Doble click para navegar entre escenas por hotspot
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
      if (renderer) {
        renderer.dispose();
        containerRef.current.removeChild(renderer.domElement);
      }
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
    };
  }, [tour, currentSceneIndex]);

  // Animación de transición
  function startTransition(targetIdx) {
    if (transitioning) return;
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

  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;
    if (!transitioning || !prevTexture) return;
    const geometry = new THREE.SphereGeometry(500, 128, 96);
    geometry.scale(-1, 1, 1);
    const currentScene = tour.scenes[pendingSceneIndex];
    const loader = new THREE.TextureLoader();
    loader.load(currentScene.image, nextTexture => {
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

  // Handler para botones de escena
  function handleSceneBtn(idx) {
    if (idx === currentSceneIndex) return;
    startTransition(idx);
  }

  return (
    <div className="embed-viewer">
      <div ref={containerRef} className="three-container"></div>
      <div className={`fade-overlay${fade ? ' visible' : ''}`}></div>
      {tour.scenes.length > 1 && (
        <div className="scene-selector">
          {tour.scenes.map((scene, index) => (
            <button
              key={index}
              className={`scene-btn ${index === currentSceneIndex ? 'active' : ''}`}
              onClick={() => handleSceneBtn(index)}
            >
              {scene.name || `Escena ${index + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default EmbedViewer;
