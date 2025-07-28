// Tour360 Embed Script (versión clásica compatible cross-origin)
(function() {
  'use strict';

  // Configuración global
  const API_BASE_URL = 'http://localhost:5000/api';
  
  // Clase principal Tour360
  window.Tour360 = {
    init: function(config) {
      if (!config.container || !config.apiKey) {
        console.error('Tour360: container y apiKey son requeridos');
        return;
      }
      this.container = document.getElementById(config.container);
      if (!this.container) {
        console.error('Tour360: Contenedor no encontrado:', config.container);
        return;
      }
      this.apiKey = config.apiKey;
      this.currentSceneIndex = 0;
      this.tour = null;
      this.loadTour();
    },
    loadTour: async function() {
      try {
        const response = await fetch(`${API_BASE_URL}/tours/by-key/${this.apiKey}`);
        if (!response.ok) {
          throw new Error('Tour no encontrado');
        }
        this.tour = await response.json();
        this.initViewer();
      } catch (error) {
        console.error('Tour360: Error cargando tour:', error);
        this.showError('No se pudo cargar el tour');
      }
    },
    initViewer: function() {
      if (!this.tour || !this.tour.scenes || this.tour.scenes.length === 0) {
        this.showError('Tour sin escenas disponibles');
        return;
      }
      // Cargar Three.js dinámicamente
      this.loadThreeJS().then(() => {
        // Elimina canvas anterior si existe
        if (this.renderer && this.renderer.domElement && this.container.contains(this.renderer.domElement)) {
          this.container.removeChild(this.renderer.domElement);
        }
        this.renderer = null;
        this.setupScene(true); // true = inicialización
        this.setupControls();
        this.animate();
        this.setupHotspots();
      });
    },
    loadThreeJS: function() {
      return new Promise((resolve, reject) => {
        // Verificar si Three.js ya está cargado
        if (window.THREE && window.THREE.OrbitControls) {
          resolve();
          return;
        }
        // Si ya hay una carga en progreso, espera a que termine
        if (window._tour360ThreeLoading) {
          window._tour360ThreeLoading.then(resolve).catch(reject);
          return;
        }
        // Iniciar carga
        window._tour360ThreeLoading = new Promise((res, rej) => {
          // Cargar Three.js desde CDN si no está
          if (!window.THREE) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/three@0.127.0/build/three.min.js';
            script.onload = () => {
              // Cargar OrbitControls
              if (!window.THREE.OrbitControls) {
                const controlsScript = document.createElement('script');
                controlsScript.src = 'https://unpkg.com/three@0.127.0/examples/js/controls/OrbitControls.js';
                controlsScript.onload = () => {
                  if (window.THREE && window.THREE.OrbitControls) {
                    res();
                  } else {
                    rej(new Error('OrbitControls no disponible tras cargar el script.'));
                  }
                };
                controlsScript.onerror = () => rej(new Error('No se pudo cargar OrbitControls.js'));
                document.head.appendChild(controlsScript);
              } else {
                res();
              }
            };
            script.onerror = () => rej(new Error('No se pudo cargar three.min.js'));
            document.head.appendChild(script);
          } else {
            // Solo cargar OrbitControls si falta
            if (!window.THREE.OrbitControls) {
              const controlsScript = document.createElement('script');
              controlsScript.src = 'https://unpkg.com/three@0.127.0/examples/js/controls/OrbitControls.js';
              controlsScript.onload = () => {
                if (window.THREE && window.THREE.OrbitControls) {
                  res();
                } else {
                  rej(new Error('OrbitControls no disponible tras cargar el script.'));
                }
              };
              controlsScript.onerror = () => rej(new Error('No se pudo cargar OrbitControls.js'));
              document.head.appendChild(controlsScript);
            } else {
              res();
            }
          }
        });
        window._tour360ThreeLoading.then(resolve).catch(reject);
      });
    },
    setupScene: function(isInit) {
      const sceneData = this.tour.scenes[this.currentSceneIndex];
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(
        75,
        this.container.clientWidth / this.container.clientHeight,
        0.1,
        1000
      );
      this.camera.position.set(0, 0, 0.1);
      if (!this.renderer || isInit) {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x181c23, 1);
        this.container.appendChild(this.renderer.domElement);
      }
      const geometry = new THREE.SphereGeometry(500, 128, 96);
      geometry.scale(-1, 1, 1);
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(this.getImageUrl(sceneData.image), (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide
        });
        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);
      });
    },
    setupControls: function() {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.rotateSpeed = 0.5;
    },
    setupHotspots: function() {
      if (!this.tour.scenes[this.currentSceneIndex].hotspots) return;
      this.hotspotSprites = [];
      this.accessSpheres = []; // Array separado para esferas de acceso
      const sceneData = this.tour.scenes[this.currentSceneIndex];
      sceneData.hotspots.forEach(hotspot => {
        const sprite = this.createHotspotSprite(hotspot);
        if (sprite) {
          this.scene.add(sprite);
          this.hotspotSprites.push(sprite);
          // Separar esferas de acceso para animación
          if (hotspot.type === 'access') {
            this.accessSpheres.push(sprite);
          }
        }
      });
      this.setupClickDetection();
    },
    createHotspotSprite: function(hotspot) {
      const geometry = new THREE.SphereGeometry(12, 32, 32);
      let material;
      if (hotspot.type === 'access') {
        // Material para hotspots de acceso (esferas animadas)
        material = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0ea5e9,
          metalness: 0.3,
          roughness: 0.5
        });
      } else {
        // Material para otros tipos de hotspots
        material = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.8
        });
      }
      const sprite = new THREE.Mesh(geometry, material);
      const radius = 500;
      const phi = THREE.MathUtils.degToRad(90 - hotspot.pitch);
      const theta = THREE.MathUtils.degToRad(hotspot.yaw);
      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);
      sprite.position.set(x, y, z);
      sprite.userData.hotspot = hotspot;
      sprite.userData.isAccessHotspot = hotspot.type === 'access';
      return sprite;
    },
    setupClickDetection: function() {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let lastClickTime = 0;
      
      this.renderer.domElement.addEventListener('click', (event) => {
        const rect = this.renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, this.camera);
        const intersects = raycaster.intersectObjects(this.hotspotSprites);
        
        if (intersects.length > 0) {
          const obj = intersects[0].object;
          const now = Date.now();
          
          if (obj.userData.isAccessHotspot) {
            // Doble clic para hotspots de acceso
            if (now - lastClickTime < 400) {
              this.handleHotspotClick(obj.userData.hotspot);
            }
            lastClickTime = now;
          } else {
            // Clic simple para otros tipos de hotspots
            this.handleHotspotClick(obj.userData.hotspot);
          }
        }
      });
    },
    handleHotspotClick: function(hotspot) {
      if (hotspot.type === 'access' && hotspot.targetSceneId) {
        const targetIndex = this.tour.scenes.findIndex(
          scene => String(scene._id) === String(hotspot.targetSceneId)
        );
        if (targetIndex !== -1) {
          this.changeScene(targetIndex);
        }
      } else if (hotspot.type === 'commerce' || hotspot.type === 'location') {
        this.showHotspotInfo(hotspot);
      }
    },
    changeScene: function(sceneIndex) {
      if (sceneIndex < 0 || sceneIndex >= this.tour.scenes.length) return;
      this.currentSceneIndex = sceneIndex;
      // Limpiar solo la escena de Three.js, no el renderer ni el canvas
      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
      // Cargar nueva textura y hotspots
      const sceneData = this.tour.scenes[sceneIndex];
      const geometry = new THREE.SphereGeometry(500, 128, 96);
      geometry.scale(-1, 1, 1);
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(this.getImageUrl(sceneData.image), (texture) => {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide
        });
        this.sphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.sphere);
      });
      this.setupHotspots();
    },
    showHotspotInfo: function(hotspot) {
      // Crear modal simple para mostrar información
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #23272f;
        color: #e2e8f0;
        padding: 20px;
        border-radius: 8px;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      `;
      modal.innerHTML = `
        <h3 style="color: #38bdf8; margin: 0 0 10px 0;">${hotspot.title || 'Información'}</h3>
        <p style="margin: 0 0 15px 0;">${hotspot.description || ''}</p>
        ${hotspot.socialMedia ? `
          <div style="display: flex; gap: 10px;">
            ${hotspot.socialMedia.website ? `<a href="${hotspot.socialMedia.website}" target="_blank" style="color: #38bdf8;">🌐</a>` : ''}
            ${hotspot.socialMedia.facebook ? `<a href="${hotspot.socialMedia.facebook}" target="_blank" style="color: #38bdf8;">📘</a>` : ''}
            ${hotspot.socialMedia.instagram ? `<a href="${hotspot.socialMedia.instagram}" target="_blank" style="color: #38bdf8;">📷</a>` : ''}
            ${hotspot.socialMedia.twitter ? `<a href="${hotspot.socialMedia.twitter}" target="_blank" style="color: #38bdf8;">🐦</a>` : ''}
          </div>
        ` : ''}
        <button style="margin-top:15px;padding:8px 18px;background:#38bdf8;color:#181c23;border:none;border-radius:6px;cursor:pointer;font-weight:500;" onclick="this.parentNode.remove()">Cerrar</button>
      `;
      document.body.appendChild(modal);
    },
    getImageUrl: function(image) {
      if (!image) return '';
      if (image.startsWith('/uploads/')) {
        return `${API_BASE_URL.replace('/api', '')}${image}`;
      }
      return image;
    },
    animate: function() {
      const animateFn = () => {
        requestAnimationFrame(animateFn);
        
        // Animación de expansión/contracción para esferas de acceso
        if (this.accessSpheres && this.accessSpheres.length > 0) {
          const t = Date.now() * 0.003;
          this.accessSpheres.forEach(sphere => {
            const scale = 1.1 + 0.15 * Math.sin(t + sphere.position.x);
            sphere.scale.set(scale, scale, scale);
          });
        }
        
        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }
      };
      animateFn();
    },
    resize: function() {
      if (this.camera && this.renderer && this.container) {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      }
    },
    showError: function(msg) {
      if (!this.container) return;
      this.container.innerHTML = `<div style="color:#ef4444;padding:20px;text-align:center;">${msg}</div>`;
    }
  };
})();

// Configurar resize automático
window.addEventListener('resize', () => {
  if (window.Tour360 && window.Tour360.resize) {
    window.Tour360.resize();
  }
}); 