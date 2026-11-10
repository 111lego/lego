// 3D presentation layer for 山海五侠.
//
// The game logic (engine.js) is unchanged and still works in 2D world units;
// this file only replaces how the world is drawn: a real 3D terrain under a
// third-person camera, with the existing atlas art used as billboards.
//
//   scenery.webp 4x4 : cells 0-4 = the five hero bodies, 5-6 trees,
//                      7-8 rocks, 9 gate, 10 spirit stone, 11 pavilion,
//                      12 cauldron, 13 chest, 14 bush, 15 broken pillar
//   beasts.webp  6x4 : 24 creature cells
//
// Camera: drag to orbit, wheel / pinch to zoom.
import * as THREE from './three.module.min.js?v=6';
import { ZONES, dist } from './data.js?v=6';
import { Renderer } from './render.js?v=6';

const HERO_H = 175;            // hero billboard height, same as the 2D actor
const ZONE = 4096;             // one zone of gameplay is 4096x4096 world units
const TERRAIN = 10240;         // the ground mesh is larger than the zone, so the
                               // horizon never shows the mesh edge
const TERRAIN_SEG = 128;
const ATLAS_COLS = 6, ATLAS_ROWS = 4;
const SCENE_COLS = 4, SCENE_ROWS = 4;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// gentle rolling ground: a couple of sine fields plus a hash bump
function heightAt(x, y, zone) {
  const h = Math.sin(x * 0.0016 + zone.id) * 64
    + Math.cos(y * 0.0021 - zone.id) * 46
    + Math.sin((x + y) * 0.0043) * 22
    + Math.sin(x * 0.0051 - y * 0.0037) * 12;
  // flatten the camp clearing and the boss arena so scenery reads cleanly
  const camp = Math.hypot(x - zone.camp[0], y - zone.camp[1]);
  const arena = Math.hypot(x - zone.boss[0], y - zone.boss[1]);
  const flat = Math.min(1, Math.max(0, (camp - 170) / 300)) * Math.min(1, Math.max(0, (arena - 260) / 420));
  return h * flat;
}

function cellTexture(image, index, cols, rows) {
  const tex = new THREE.Texture(image);
  tex.needsUpdate = true;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(1 / cols, 1 / rows);
  const c = index % cols, r = Math.floor(index / cols);
  tex.offset.set(c / cols, 1 - (r + 1) / rows);   // three samples from the bottom
  return tex;
}

function glowTexture() {
  const s = 64, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const c = cv.getContext('2d');
  const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,244,210,1)');
  g.addColorStop(0.45, 'rgba(240,205,140,0.55)');
  g.addColorStop(1, 'rgba(240,205,140,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// hero = body cell from the scenery atlas + the real photo clipped into the head
function heroTexture(def, assets) {
  const S = 256, k = S / HERO_H;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const body = assets.scenery;
  if (body) {
    const sw = body.naturalWidth / SCENE_COLS, sh = body.naturalHeight / SCENE_ROWS;
    const cx = def.id % SCENE_COLS, cy = Math.floor(def.id / SCENE_COLS);
    c.drawImage(body, cx * sw + 1, cy * sh + 1, sw - 2, sh - 2, 0, 0, S, S);
  } else {
    c.fillStyle = def.color || '#8a8f7d';
    c.fillRect(S * 0.3, S * 0.1, S * 0.4, S * 0.8);
  }
  const img = assets[def.photo];
  if (img) {
    // same geometry the 2D actor uses: ellipse at (0,-126) r 12x16, face rect (-13,-143,26,34)
    const px = x => (x + HERO_H / 2) * k;
    const py = y => (y + 163) * k;
    c.save();
    c.beginPath();
    c.ellipse(px(0), py(-126), 12 * k, 16 * k, 0, 0, Math.PI * 2);
    c.clip();
    const [x, y, w, h] = def.crop;
    c.drawImage(img, x, y, w, h, px(-13), py(-143), 26 * k, 34 * k);
    c.restore();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class Renderer3D {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.assets = assets;
    this.w = 1; this.h = 1;
    this.azimuth = Math.PI * 0.25;
    this.pitch = 0.66;
    this.distance = 760;
    this.focus = new THREE.Vector3();
    this.zoneId = -1;
    this.cameraReady = false;
    this.actors = new Map();     // entity -> {sprite, shadow}
    this.propCells = [5, 5, 5, 6, 7, 8, 14];   // pine, dead tree, rocks, bush
    this.landmarks = [
      [11, 0, -170, 1.15],   // pavilion beside the camp
      [10, 110, 40, 0.75],   // spirit stone
      [9, -260, 240, 0.9],   // gate
      [12, 150, 150, 0.6],   // cauldron
      [15, -60, 300, 0.7],   // broken pillar
    ];
    this.glow = glowTexture();

    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, alpha: false, powerPreference: 'high-performance',
    });
    window.__renderer3d = this;   // handy for the diagnostics harness
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(48, 1, 2, 12000);

    const hemi = new THREE.HemisphereLight(0xdfeaf0, 0x1b2a22, 1.15);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff0cf, 1.5);
    sun.position.set(0.55, 1, 0.35);
    this.scene.add(sun);
    this.sun = sun;

    this.ground = null;
    this.propGroup = new THREE.Group();
    this.scene.add(this.propGroup);

    this.rings = [];
    this.orbs = [];
    this.fx = new THREE.Group();
    this.scene.add(this.fx);

    this._bindControls();
  }

  _bindControls() {
    const cv = this.canvas;
    let dragging = false, lastX = 0, lastY = 0, pinch = 0;
    cv.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      try { cv.setPointerCapture(e.pointerId); } catch {}
    });
    cv.addEventListener('pointermove', e => {
      if (!dragging) return;
      this.azimuth -= (e.clientX - lastX) * 0.006;
      this.pitch = Math.min(1.35, Math.max(0.45, this.pitch - (e.clientY - lastY) * 0.004));
      lastX = e.clientX; lastY = e.clientY;
    });
    const stop = () => { dragging = false; };
    cv.addEventListener('pointerup', stop);
    cv.addEventListener('pointercancel', stop);
    cv.addEventListener('lostpointercapture', stop);
    cv.addEventListener('wheel', e => {
      e.preventDefault();
      this.distance = Math.min(1500, Math.max(420, this.distance + e.deltaY * 0.6));
    }, { passive: false });
    cv.addEventListener('touchstart', e => {
      if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }, { passive: true });
    cv.addEventListener('touchmove', e => {
      if (e.touches.length !== 2) return;
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (pinch) this.distance = Math.min(1500, Math.max(420, this.distance * (pinch / d)));
      pinch = d;
    }, { passive: true });
    cv.addEventListener('touchend', () => { pinch = 0; }, { passive: true });
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    if (this.w === w && this.h === h) return;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _sprite(tex, w, h, anchorY = 0) {
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, alphaTest: 0.02 });
    const s = new THREE.Sprite(mat);
    s.scale.set(w, h, 1);
    s.center.set(0.5, anchorY);
    return s;
  }

  _blob(size) {
    const g = new THREE.CircleGeometry(size, 20);
    const m = new THREE.MeshBasicMaterial({ color: 0x05100c, transparent: true, opacity: 0.38, depthWrite: false });
    const mesh = new THREE.Mesh(g, m);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  _buildZone(zone, game) {
    if (this.ground) {
      this.scene.remove(this.ground);
      this.ground.geometry.dispose();
      this.ground.material.dispose();
    }
    const seg = TERRAIN_SEG;
    const geo = new THREE.PlaneGeometry(TERRAIN, TERRAIN, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const base = new THREE.Color(zone.color || '#3a4a3a');
    const accent = new THREE.Color(zone.accent || '#6b6a45');
    const sky = new THREE.Color(zone.accent || '#7f8a6a').lerp(new THREE.Color('#0d1b18'), 0.74);
    const c = new THREE.Color();
    const cx = zone.x + ZONE / 2, cz = zone.y + ZONE / 2;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + cx, wz = pos.getZ(i) + cz;
      const hy = heightAt(wx, wz, zone);
      pos.setY(i, hy);
      const n = Math.sin(wx * 0.01) * Math.cos(wz * 0.008) * 0.5 + 0.5;
      c.copy(base).lerp(accent, n * 0.55 + 0.12);
      c.multiplyScalar(0.82 + Math.min(0.5, Math.max(-0.25, hy / 260)));
      const rim = Math.hypot(wx - cx, wz - cz) / (TERRAIN * 0.5);
      if (rim > 0.62) c.lerp(sky, Math.min(0.95, (rim - 0.62) / 0.38));
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
    this.ground = new THREE.Mesh(geo, mat);
    this.ground.position.set(cx, 0, cz);
    this.scene.add(this.ground);

    // fog + sky tint follow the zone
    this.scene.fog = new THREE.Fog(sky, 520, 2400);
    this.scene.background = sky;

    // landmarks around the camp
    for (const child of [...this.propGroup.children]) {
      this.propGroup.remove(child);
      child.material?.dispose?.();
    }
    for (const [cell, dx, dz, k] of this.landmarks) {
      const w = 190 * k, h = 190 * k;
      const s = this._sprite(cellTexture(this.assets.scenery, cell, SCENE_COLS, SCENE_ROWS), w, h, 0.06);
      const x = zone.camp[0] + dx, z = zone.camp[1] + dz;
      s.position.set(x, heightAt(x, z, zone), z);
      this.propGroup.add(s);
    }

    // scattered scenery, deterministic per zone
    const rnd = mulberry32(1013 + zone.id * 77);
    for (let i = 0; i < 320; i++) {
      const x = zone.x + rnd() * ZONE, z = zone.y + rnd() * ZONE;
      if (dist({ x, y: z }, { x: zone.camp[0], y: zone.camp[1] }) < 340) continue;
      if (dist({ x, y: z }, { x: zone.boss[0], y: zone.boss[1] }) < 380) continue;
      const cell = this.propCells[(rnd() * this.propCells.length) | 0];
      const k = cell === 14 ? 0.35 + rnd() * 0.25 : 0.55 + rnd() * 0.75;
      const s = this._sprite(cellTexture(this.assets.scenery, cell, SCENE_COLS, SCENE_ROWS), 190 * k, 190 * k, 0.06);
      s.position.set(x, heightAt(x, z, zone), z);
      this.propGroup.add(s);
    }
    this.cameraReady = false;
  }

  _syncActor(entity, tex, w, h, zone, time) {
    let a = this.actors.get(entity);
    if (!a) {
      const sprite = this._sprite(tex, w, h, 0.075);
      const shadow = this._blob(w * 0.28);
      this.scene.add(sprite, shadow);
      a = { sprite, shadow, w, h };
      this.actors.set(entity, a);
    }
    if (a.w !== w) { a.sprite.scale.set(w, h, 1); a.shadow.geometry.dispose(); a.shadow.geometry = new THREE.CircleGeometry(w * 0.28, 20); a.w = w; a.h = h; }
    const gy = heightAt(entity.x, entity.y, zone);
    const bob = entity.bob ? Math.sin(time * 11) * 2.5 : 0;
    a.sprite.position.set(entity.x, gy + bob, entity.y);
    a.shadow.position.set(entity.x, gy + 1.2, entity.y);
    a.sprite.visible = true; a.shadow.visible = true;
    return a;
  }

  _recycle(keep) {
    for (const [entity, a] of this.actors) {
      if (keep.has(entity)) continue;
      this.scene.remove(a.sprite, a.shadow);
      a.sprite.material.dispose();
      a.shadow.geometry.dispose();
      a.shadow.material.dispose();
      this.actors.delete(entity);
    }
  }

  draw(game, time) {
    this.resize();
    const zone = ZONES[game.zone.id] || game.zone;
    if (this.zoneId !== zone.id) { this._buildZone(zone, game); this.zoneId = zone.id; }

    const keep = new Set();
    const h = game.hero;
    h.bob = !!game.isMoving;
    const heroDef = game.def;
    if (!this.heroKey || this.heroKey !== heroDef.id) {
      this.heroTex = heroTexture(heroDef, this.assets);
      this.heroKey = heroDef.id;
    }
    const heroActor = this._syncActor(h, this.heroTex, HERO_H, HERO_H, zone, time);
    keep.add(h);

    // shield bubble
    if (game.shield > 0) {
      if (!this.shieldMesh) {
        this.shieldMesh = new THREE.Mesh(
          new THREE.SphereGeometry(HERO_H * 0.52, 18, 12),
          new THREE.MeshBasicMaterial({ color: 0xb7d7d0, transparent: true, opacity: 0.16, depthWrite: false })
        );
        this.scene.add(this.shieldMesh);
      }
      this.shieldMesh.visible = true;
      this.shieldMesh.position.set(h.x, heightAt(h.x, h.y, zone) + HERO_H * 0.5, h.y);
    } else if (this.shieldMesh) this.shieldMesh.visible = false;

    // creatures
    for (const e of game.enemies) {
      if (!e.alive) continue;
      if (dist(e, h) > 2400) continue;
      const size = (e.boss ? 285 : e.elite ? 170 : 130);
      const key = 'b' + e.type;
      let tex = this._beastTex && this._beastTex.get(key);
      if (!tex) {
        tex = cellTexture(this.assets.beasts, e.type, ATLAS_COLS, ATLAS_ROWS);
        if (!this._beastTex) this._beastTex = new Map();
        this._beastTex.set(key, tex);
      }
      e.bob = e.alive;
      const a = this._syncActor(e, tex, size, size, zone, time * (e.boss ? 0.6 : 1));
      if (game.target === e) a.sprite.material.color.setHex(0xffd9a0);
      else a.sprite.material.color.setHex(0xffffff);
      keep.add(e);
    }

    // loot on the ground
    for (const l of (game.loot || [])) {
      const key = 'loot' + l.id;
      let o = this._lootPool && this._lootPool.get(l);
      if (!o) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        s.scale.set(70, 70, 1);
        s.center.set(0.5, 0.5);
        this.scene.add(s);
        if (!this._lootPool) this._lootPool = new Map();
        this._lootPool.set(l, s);
        o = s;
      }
      o.position.set(l.x, heightAt(l.x, l.y, zone) + 34 + Math.sin(time * 3 + l.x) * 6, l.y);
      o.visible = true;
      keep.add(l);
    }
    if (this._lootPool) {
      for (const [ent, spr] of this._lootPool) {
        if (keep.has(ent)) continue;
        this.scene.remove(spr); spr.material.dispose(); this._lootPool.delete(ent);
      }
    }

    // projectiles
    while (this.orbs.length < (game.projectiles || []).length) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.scale.set(46, 46, 1);
      this.scene.add(s);
      this.orbs.push(s);
    }
    const proj = game.projectiles || [];
    for (let i = 0; i < this.orbs.length; i++) {
      const p = proj[i];
      const s = this.orbs[i];
      if (!p || p.delay > 0) { s.visible = false; continue; }
      s.visible = true;
      s.material.color.set(p.enemy ? 0x9bb88b : p.kind === 'fire' ? 0xffb45c : 0xf2e8b6);
      s.position.set(p.x, heightAt(p.x, p.y, zone) + 42, p.y);
    }

    // ground telegraphs / area effects
    const rings = (game.effects || []).filter(e => e.r && (e.kind === 'warning' || e.kind === 'guard' || e.kind === 'meteor'));
    while (this.rings.length < rings.length) {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(0.78, 1, 40),
        new THREE.MeshBasicMaterial({ color: 0xc9a15f, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })
      );
      m.rotation.x = -Math.PI / 2;
      this.scene.add(m);
      this.rings.push(m);
    }
    for (let i = 0; i < this.rings.length; i++) {
      const e = rings[i], m = this.rings[i];
      if (!e) { m.visible = false; continue; }
      m.visible = true;
      m.position.set(e.x, heightAt(e.x, e.y, zone) + 2, e.y);
      m.scale.set(e.r, e.r, 1);
      m.material.color.set(e.kind === 'guard' ? 0xb7d7d0 : 0xd08a63);
      m.material.opacity = 0.28 + 0.25 * Math.max(0, Math.min(1, (e.ttl || 1)));
    }

    this._recycle(keep);

    // camera follows the hero; first frame snaps instead of drifting in
    const gy = heightAt(h.x, h.y, zone);
    if (!this.cameraReady) { this.focus.set(h.x, gy + 70, h.y); this.cameraReady = true; }
    else this.focus.lerp(new THREE.Vector3(h.x, gy + 70, h.y), 0.18);
    const cx = this.focus.x + Math.sin(this.azimuth) * this.distance * Math.cos(this.pitch * 0.6);
    const cz = this.focus.z + Math.cos(this.azimuth) * this.distance * Math.cos(this.pitch * 0.6);
    const cy = this.focus.y + this.distance * this.pitch * 0.72;
    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.focus);
    this.sun.position.set(h.x + 400, gy + 900, h.y + 300);
    this.sun.target.position.set(h.x, gy, h.y);
    this.sun.target.updateMatrixWorld();

    this.renderer.render(this.scene, this.camera);
  }
}

// app.js asks for a renderer; keep the 2D one as a safety net for devices
// without usable WebGL.
export function makeRenderer(canvas, assets) {
  try {
    const r = new Renderer3D(canvas, assets);
    window.__renderMode = '3d';
    return r;
  } catch (err) {
    console.warn('3D unavailable, using 2D renderer:', err);
    window.__renderMode = '2d-fallback';
    return new Renderer(canvas, assets);
  }
}
