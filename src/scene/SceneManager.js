import * as THREE from 'three';

export class SceneManager {
  constructor() {
    this.instance = new THREE.Scene();
    this.instance.background = new THREE.Color(0x1a1a2e); // dark navy, not black

    // Strong ambient so no face is pure black
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);

    // Main key light — bright, warm, from top-right
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(8, 12, 10);

    // Fill light — cool blue from left, so faces are clearly different colors
    const fill = new THREE.DirectionalLight(0x6688ff, 1.2);
    fill.position.set(-8, 4, -6);

    // Rim light from below-back — separates the box from the background
    const rim = new THREE.DirectionalLight(0x44aaff, 0.8);
    rim.position.set(0, -6, -10);

    this.instance.add(ambient, key, fill, rim);

    // Placeholder mesh — bright enough to actually see the bloom glow
    const geo = new THREE.BoxGeometry(3, 3, 3);
    const mat = new THREE.MeshStandardMaterial({
      color:     0x3399ff,  // brighter blue so bloom threshold is actually hit
      roughness: 0.3,
      metalness: 0.4,
      emissive:  new THREE.Color(0x112244), // slight self-glow on dark faces
    });
    this._mesh = new THREE.Mesh(geo, mat);
    this.instance.add(this._mesh);
  }

  update(elapsed, camPos) {
    this._mesh.rotation.y = elapsed * 0.5;
    this._mesh.rotation.x = elapsed * 0.2;
  }
}
