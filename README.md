# ShaderKit 🌿

A browser-based real-time 3D shader engine built on Three.js.  
All visuals — lighting, terrain, post-processing — are driven by **custom GLSL shaders**, not Three.js built-ins.

> Built as a student-led project by Team C · May 2026

![Three.js](https://img.shields.io/badge/Three.js-v0.164-black?logo=three.js)
![Vite](https://img.shields.io/badge/Vite-v5-646CFF?logo=vite)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What's inside

| Feature | Description |
|---|---|
| ⛰ Procedural terrain | FBM noise + domain warping, height-based colour, fog |
| 💡 Custom Phong lighting | Hand-written GLSL ambient + diffuse + specular |
| ✦ Bloom + Gaussian blur | Separable blur, brightness threshold, Reinhard tone mapping |
| 🎥 Free-fly camera | WASD + mouse look, smooth damping, sprint, Pointer Lock API |
| 🧪 Unit tested | Vitest — all modules tested without a browser or GPU |

---

## Quick start

```bash
git clone https://github.com/sonicisastorm/shader-project.git
cd shader-project
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Controls

| Key | Action |
|---|---|
| W A S D | Move |
| Mouse | Look around |
| Q / E | Move up / down |
| Shift | Sprint |
| B | Toggle bloom |
| L | Toggle blur |
| 1 / 2 / 3 / 4 | Isolate ambient / diffuse / specular / combined |

---

## Using ShaderKit in your own project

You can install ShaderKit as a dependency and use it to add real-time 3D to any website.

### 1. Install

```bash
npm install https://github.com/sonicisastorm/shader-project.git
```

### 2. Copy the shaders folder

ShaderKit loads GLSL files at runtime via `fetch()`.  
Copy the `shaders/` folder into your project's `public/` directory:

```bash
cp -r node_modules/shader-kit/shaders ./public/shaders
```

### 3. Add a canvas to your HTML

```html
<canvas id="c"></canvas>
```

### 4. Import and initialise

```js
import { App } from 'shader-kit';

const canvas = document.querySelector('#c');
const app = new App(canvas);
```

That's it. You now have a live terrain scene with bloom, camera controls, and Phong lighting running in your browser.

---

## Customisation

### Tune bloom at runtime

```js
app.post.bloomPass.threshold = 0.5;  // lower = more glow
app.post.bloomPass.intensity  = 2.0;  // higher = brighter glow
```

### Toggle effects

```js
app.post.bloomEnabled = true;
app.post.blurEnabled  = false;
```

### Use the Phong material on your own mesh

```js
import PhongMaterial from 'shader-kit/src/rendering/PhongMaterial.js';
import * as THREE from 'three';

const mat = await PhongMaterial.create({
  shininess:    128,
  lightPos:     new THREE.Vector3(50, 80, 50),
  lightColor:   new THREE.Vector3(1.0, 0.95, 0.8),
  ambientColor: new THREE.Vector3(0.15, 0.15, 0.25),
});

const mesh = new THREE.Mesh(
  new THREE.SphereGeometry(2, 32, 32),
  mat.getMaterial()
);

// Update every frame
mat.update(elapsedTime, camera, lights.getUniforms());
```

### Use the post-processing pipeline standalone

```js
import { PostProcessor } from 'shader-kit/src/postprocessing/PostProcessor.js';

const post = new PostProcessor(renderer, width, height, {
  bloom: true,
  blur:  false,
});

// Each frame:
renderer.setRenderTarget(post.sceneRT);
renderer.render(scene, camera);
post.render(); // outputs to screen
```

### Use just the blur pass

```js
import { BlurPass } from 'shader-kit/src/postprocessing/BlurPass.js';

const blur = new BlurPass(renderer, width, height, {
  passes:   3,      // more passes = smoother blur
  strength: 2.0,    // pixel spacing between samples
});

blur.render(inputRT, null); // null = render to screen
```

---

## Project structure

```
shader-project/
├── shaders/
│   ├── common/
│   │   ├── uniforms.glsl      # shared uniform declarations
│   │   └── lighting.glsl      # reusable Phong helpers
│   ├── terrain/
│   │   ├── vertex.glsl        # FBM vertex displacement
│   │   └── fragment.glsl      # height-based colour + fog
│   ├── noise/
│   │   ├── simplex.glsl       # simplex noise + FBM
│   │   └── perlin.glsl        # Perlin noise
│   └── post/
│       ├── blur.glsl          # Gaussian blur kernel
│       └── bloom.glsl         # brightness extract + composite
├── src/
│   ├── core/
│   │   ├── App.js             # top-level entry point
│   │   ├── Renderer.js        # WebGLRenderer wrapper
│   │   ├── Sizes.js           # reactive viewport dimensions
│   │   └── Time.js            # elapsed + delta time
│   ├── camera/
│   │   └── Camera.js          # PerspectiveCamera wrapper
│   ├── controls/
│   │   ├── CameraController.js # WASD + mouse look
│   │   └── OrbitControls.js   # fallback orbit camera
│   ├── scene/
│   │   ├── SceneManager.js    # scene coordinator
│   │   ├── Terrain.js         # PlaneGeometry + material
│   │   └── Lights.js          # light position + colour manager
│   ├── rendering/
│   │   ├── PhongMaterial.js   # custom Phong shader material
│   │   ├── TerrainMaterial.js # terrain shader material
│   │   └── ShaderMaterial.js  # base class for all materials
│   ├── postprocessing/
│   │   ├── PostProcessor.js   # pipeline coordinator
│   │   ├── EffectComposer.js  # ordered pass execution
│   │   ├── BloomPass.js       # extract → blur → composite
│   │   └── BlurPass.js        # separable Gaussian blur
│   └── utils/
│       ├── MathUtils.js       # lerp, smoothstep, normal matrix
│       └── Noise.js           # JS-side noise helpers
└── tests/                     # Vitest unit tests
```

---

## Shared GLSL uniforms

All shaders share these uniforms, declared in `shaders/common/uniforms.glsl`:

```glsl
uniform float uTime;        // seconds since start
uniform vec2  uResolution;  // viewport size in pixels
uniform vec3  uLightPos;    // world-space light position
uniform vec3  uCameraPos;   // world-space camera position
```

---

## Running tests

```bash
npm test              # single run
npm run test:watch    # re-run on file save
```

Tests run in Node.js with Three.js mocked — no browser or GPU needed.

---

## Team

| Teammate | Responsibility |
|---|---|
| Teammate A | Terrain, procedural noise, FBM shaders |
| Teammate B | Phong lighting, Lights manager, ShaderMaterial base |
| Teammate C | Camera, post-processing pipeline, core rendering loop |

---

## License

MIT — free to use in your own projects.
