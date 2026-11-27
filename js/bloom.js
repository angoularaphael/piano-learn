// Halo lumineux (bloom) partage par les scenes 3D
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// Lissage des bords (FXAA, l'algorithme de Timothy Lottes). Le halo fait passer l'image par un tampon
// sans multi-echantillonnage : sans ce lissage, chaque arete, chaque touche et chaque meche de cheveux
// sortait en escalier. Il travaille sur l'image finale (apres tons et sRGB), et laisse intactes les zones
// sans contraste : le grain de la peau et du bois reste net.
const FXAA = {
  name: 'FXAA',
  uniforms: {
    tDiffuse: { value: null },
    texel: { value: new THREE.Vector2(1 / 1024, 1 / 1024) },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec2 texel;
    varying vec2 vUv;
    const vec3 LUMA = vec3(0.299, 0.587, 0.114);
    void main() {
      vec4 m = texture2D(tDiffuse, vUv);
      float lNW = dot(texture2D(tDiffuse, vUv + vec2(-1.0, -1.0) * texel).rgb, LUMA);
      float lNE = dot(texture2D(tDiffuse, vUv + vec2(1.0, -1.0) * texel).rgb, LUMA);
      float lSW = dot(texture2D(tDiffuse, vUv + vec2(-1.0, 1.0) * texel).rgb, LUMA);
      float lSE = dot(texture2D(tDiffuse, vUv + vec2(1.0, 1.0) * texel).rgb, LUMA);
      float lM = dot(m.rgb, LUMA);
      float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
      float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
      if (lMax - lMin < max(0.0312, lMax * 0.125)) { gl_FragColor = m; return; }
      vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
      float reduce = max((lNW + lNE + lSW + lSE) * 0.03125, 1.0 / 128.0);
      float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + reduce);
      dir = clamp(dir * rcp, -8.0, 8.0) * texel;
      vec3 a = 0.5 * (texture2D(tDiffuse, vUv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(tDiffuse, vUv + dir * (2.0 / 3.0 - 0.5)).rgb);
      vec3 b = a * 0.5 + 0.25 * (texture2D(tDiffuse, vUv - dir * 0.5).rgb + texture2D(tDiffuse, vUv + dir * 0.5).rgb);
      float lB = dot(b, LUMA);
      gl_FragColor = vec4((lB < lMin || lB > lMax) ? a : b, m.a);
    }`,
};

export function createBloom(renderer, scene, camera, { strength = 1.1, radius = 0.6, threshold = 0.75 } = {}) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), strength, radius, threshold);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const fxaa = new ShaderPass(FXAA);
  composer.addPass(fxaa);
  const texel = (w, h) => fxaa.material.uniforms.texel.value.set(1 / Math.max(1, Math.floor(w)), 1 / Math.max(1, Math.floor(h)));
  const buf = renderer.getDrawingBufferSize(new THREE.Vector2());
  texel(buf.x, buf.y);
  return {
    composer,
    bloom,
    setSize(w, h) {
      // Suit la resolution adaptative du moteur (stage.js) : sans ca, le halo restait calcule a
      // l'ancienne resolution, et baisser la qualite ne soulageait pas les machines lentes
      const pr = renderer.getPixelRatio();
      composer.setPixelRatio(pr);
      composer.setSize(w, h);
      texel(w * pr, h * pr);
    },
    render() { composer.render(); },
    dispose() { composer.dispose(); bloom.dispose(); fxaa.dispose(); },
  };
}
