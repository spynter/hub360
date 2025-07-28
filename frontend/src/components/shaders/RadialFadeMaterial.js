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
        // Centro de la imagen
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center);
        // Estiramiento radial: cuanto más lejos del centro, más rápido transiciona
        float radial = smoothstep(0.0, 0.7, dist + uProgress * 0.7);
        float blend = smoothstep(0.0, 1.0, uProgress * 1.2 + radial * 0.8);
        vec4 prevColor = texture2D(uPrev, vUv);
        vec4 nextColor = texture2D(uNext, vUv);
        // Fundido cruzado
        gl_FragColor = mix(prevColor, nextColor, blend);
      }
    `,
    transparent: false,
    depthTest: false,
    depthWrite: false,
  });
} 