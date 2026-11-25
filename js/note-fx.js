// Effets lies aux notes, pour l'ouverture de l'accueil : colonnes de lumiere, ondes, etincelles.
// Sur fond sombre la lumiere s'additionne (elle brille) ; sur fond clair elle se pose comme une couleur.
import * as THREE from 'three';

function gradientTexture() {
  const c = document.createElement('canvas');
  c.width = 8; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 256, 0, 0);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.15, 'rgba(255,255,255,.75)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 8, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.3, 'rgba(255,255,255,.6)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

const MAX_SPARKS = 700;

export class NoteFX {
  constructor(parent, opts = {}) {
    this.parent = parent;
    this.speed = opts.speed ?? 6;        // vitesse de montee des colonnes
    this.grow = opts.grow ?? 9;          // vitesse de croissance tant que la touche est tenue
    this.maxHeight = opts.maxHeight ?? 40;
    this.intensity = opts.intensity ?? 1.6;
    this.blending = opts.additive === false ? THREE.NormalBlending : THREE.AdditiveBlending;
    this.columnGeo = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
    this.ringGeo = new THREE.RingGeometry(0.42, 0.5, 64);
    this.tex = gradientTexture();
    this.held = new Map();
    this.flying = [];
    this.rings = [];

    // Etincelles
    this.sp = {
      pos: new Float32Array(MAX_SPARKS * 3),
      col: new Float32Array(MAX_SPARKS * 3),
      vel: new Float32Array(MAX_SPARKS * 3),
      life: new Float32Array(MAX_SPARKS),
      next: 0,
    };
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.sp.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.sp.col, 3));
    this.sparks = new THREE.Points(geo, new THREE.PointsMaterial({
      size: opts.sparkSize ?? 0.35, map: dotTexture(), vertexColors: true, transparent: true,
      blending: this.blending, depthWrite: false,
    }));
    this.sparks.frustumCulled = false;
    parent.add(this.sparks);
  }

  // Une touche est enfoncee : la colonne pousse tant qu'elle est tenue
  start(id, pos, color, width = 0.8) {
    this.end(id);
    const mat = new THREE.MeshBasicMaterial({
      map: this.tex, color: new THREE.Color(color).multiplyScalar(this.blending === THREE.AdditiveBlending ? this.intensity : 1), transparent: true, opacity: Math.min(1, this.intensity),
      blending: this.blending, depthWrite: false, side: THREE.DoubleSide,
    });
    const m = new THREE.Mesh(this.columnGeo, mat);
    m.position.copy(pos);
    m.scale.set(width, 0.01, 1);
    m.renderOrder = 2;
    this.parent.add(m);
    this.held.set(id, m);
    this.burst(pos, color);
  }

  end(id) {
    const m = this.held.get(id);
    if (!m) return;
    this.held.delete(id);
    this.flying.push(m);
  }

  burst(pos, color, count = 16) {
    const c = new THREE.Color(color);
    const ring = new THREE.Mesh(this.ringGeo, new THREE.MeshBasicMaterial({
      color: this.blending === THREE.AdditiveBlending ? c.clone().multiplyScalar(2) : c.clone(), transparent: true, blending: this.blending, depthWrite: false, side: THREE.DoubleSide,
    }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pos).add(new THREE.Vector3(0, 0.05, 0));
    ring.userData.life = 1;
    this.parent.add(ring);
    this.rings.push(ring);

    const s = this.sp;
    for (let i = 0; i < count; i++) {
      const k = s.next;
      s.next = (s.next + 1) % MAX_SPARKS;
      s.pos[k * 3] = pos.x + (Math.random() - 0.5) * 0.5;
      s.pos[k * 3 + 1] = pos.y + 0.1;
      s.pos[k * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.5;
      const a = Math.random() * Math.PI * 2;
      const sp = 1 + Math.random() * 3;
      s.vel[k * 3] = Math.cos(a) * sp;
      s.vel[k * 3 + 1] = 3 + Math.random() * 6;
      s.vel[k * 3 + 2] = Math.sin(a) * sp;
      s.life[k] = 1;
      s.col[k * 3] = c.r; s.col[k * 3 + 1] = c.g; s.col[k * 3 + 2] = c.b;
    }
  }

  update(dt) {
    for (const m of this.held.values()) {
      m.scale.y = Math.min(this.maxHeight, m.scale.y + this.grow * dt);
    }
    for (let i = this.flying.length - 1; i >= 0; i--) {
      const m = this.flying[i];
      m.position.y += this.speed * dt;
      m.material.opacity -= dt * 0.45;
      if (m.material.opacity <= 0) {
        this.parent.remove(m);
        m.material.dispose();
        this.flying.splice(i, 1);
      }
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.userData.life -= dt * 1.6;
      const l = r.userData.life;
      r.scale.setScalar(1 + (1 - l) * 4);
      r.material.opacity = Math.max(0, l);
      if (l <= 0) {
        this.parent.remove(r);
        r.material.dispose();
        this.rings.splice(i, 1);
      }
    }
    const s = this.sp;
    for (let k = 0; k < MAX_SPARKS; k++) {
      if (s.life[k] <= 0) continue;
      s.life[k] -= dt * 0.9;
      s.vel[k * 3 + 1] -= 6 * dt;
      s.pos[k * 3] += s.vel[k * 3] * dt;
      s.pos[k * 3 + 1] += s.vel[k * 3 + 1] * dt;
      s.pos[k * 3 + 2] += s.vel[k * 3 + 2] * dt;
      const f = Math.max(0, s.life[k]);
      if (f <= 0) { s.pos[k * 3 + 1] = -9999; }
      s.col[k * 3] *= 0.985; s.col[k * 3 + 1] *= 0.985; s.col[k * 3 + 2] *= 0.985;
    }
    this.sparks.geometry.attributes.position.needsUpdate = true;
    this.sparks.geometry.attributes.color.needsUpdate = true;
  }

  dispose() {
    [...this.held.values(), ...this.flying, ...this.rings].forEach((m) => { this.parent.remove(m); m.material.dispose(); });
    this.parent.remove(this.sparks);
    this.sparks.geometry.dispose();
    this.sparks.material.dispose();
    this.columnGeo.dispose();
    this.ringGeo.dispose();
    this.tex.dispose();
  }
}
