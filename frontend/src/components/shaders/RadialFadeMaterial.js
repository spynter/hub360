import * as THREE from 'three';

export default function RadialFadeMaterial(prevTexture, nextTexture, progress) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uPrev: { value: prevTexture },
      uNext: { value: nextTexture },
      uProgress: { value: progress },
      uResolution: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uPrev;
      uniform sampler2D uNext;
      uniform float uProgress;
      varying vec2 vUv;
      
      void main() {
        // Transición de desplazamiento hacia adelante
        // La imagen actual se desvanece hacia adelante (zoom out + fade)
        // La nueva imagen aparece desde atrás (zoom in + fade in)
        
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center);
        
        // Efecto de desplazamiento hacia adelante para la imagen actual
        float currentImageFade = 1.0 - smoothstep(0.0, 0.7, uProgress);
        
        // Efecto de aparición desde atrás para la nueva imagen
        float newImageFade = smoothstep(0.3, 1.0, uProgress);
        
        // Coordenadas UV con efecto de desplazamiento hacia adelante
        vec2 offset = (vUv - center) * (1.0 + uProgress * 0.4);
        vec2 newUv = center + offset;
        
        // Verificar que las coordenadas estén dentro de los límites
        if (newUv.x < 0.0 || newUv.x > 1.0 || newUv.y < 0.0 || newUv.y > 1.0) {
          newUv = vUv; // Usar coordenadas originales si están fuera de rango
        }
        
        // Muestrear las texturas
        vec4 prevColor = texture2D(uPrev, vUv);
        vec4 nextColor = texture2D(uNext, newUv);
        
        // Aplicar efectos de transición con easing suave
        float blend = mix(currentImageFade, newImageFade, uProgress);
        
        // Combinar las imágenes con el efecto de desplazamiento
        gl_FragColor = mix(prevColor, nextColor, blend);
      }
    `,
    transparent: false,
    depthTest: false,
    depthWrite: false,
  });
}
