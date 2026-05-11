/**
 * SceneEditor.js
 * Drop-in editor panel for SceneManager.
 * Usage:
 *   import { SceneEditor } from './SceneEditor.js';
 *   const editor = new SceneEditor(sceneManager, scene);
 *   // call editor.update(elapsed) inside your animation loop if you want live elapsed readout
 */

import * as THREE from 'three';
import PhongMaterial from '../rendering/PhongMaterial.js';

/* ─────────────────────────── tiny helpers ─────────────────────────── */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') node.className = v;
    else if (k === 'style') Object.assign(node.style, v);
    else node.setAttribute(k, v);
  });
  children.forEach(c => node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return node;
}

function labeledRow(labelText, control) {
  const row = el('div', { class: 'se-row' });
  row.appendChild(el('label', { class: 'se-label' }, labelText));
  row.appendChild(control);
  return row;
}

function slider(opts) {
  const input = el('input', {
    type: 'range',
    class: 'se-slider',
    min: String(opts.min),
    max: String(opts.max),
    step: String(opts.step ?? 0.01),
    value: String(opts.value),
  });
  const readout = el('span', { class: 'se-readout' }, String(opts.value));
  input.addEventListener('input', () => {
    readout.textContent = parseFloat(input.value).toFixed(opts.decimals ?? 2);
    opts.onChange(parseFloat(input.value));
  });
  const wrap = el('div', { class: 'se-slider-wrap' });
  wrap.appendChild(input);
  wrap.appendChild(readout);
  return wrap;
}

function colorInput(value, onChange) {
  const input = el('input', { type: 'color', class: 'se-color', value });
  input.addEventListener('input', () => onChange(input.value));
  return input;
}

function btn(text, onClick, cls = '') {
  const b = el('button', { class: `se-btn ${cls}`.trim() }, text);
  b.addEventListener('click', onClick);
  return b;
}

/* ─────────────────────────── CSS injection ─────────────────────────── */

function injectStyles() {
  if (document.getElementById('scene-editor-styles')) return;
  const style = document.createElement('style');
  style.id = 'scene-editor-styles';
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@700&display=swap');

    #scene-editor {
      --bg0: #0d0d12;
      --bg1: #14141d;
      --bg2: #1c1c28;
      --border: #2a2a3d;
      --accent: #7c6af7;
      --accent2: #f26c6c;
      --text: #d4d2f0;
      --muted: #6b698a;
      --success: #5de89e;

      position: fixed;
      top: 16px;
      right: 16px;
      width: 280px;
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      background: var(--bg0);
      border: 1px solid var(--border);
      border-radius: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: var(--text);
      z-index: 9999;
      box-shadow: 0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,106,247,0.12);
      scrollbar-width: thin;
      scrollbar-color: var(--border) transparent;
    }

    #scene-editor::-webkit-scrollbar { width: 4px; }
    #scene-editor::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

    .se-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 14px 10px;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      background: var(--bg0);
      z-index: 1;
    }
    .se-title {
      font-family: 'Syne', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--accent);
    }
    .se-toggle-btn {
      background: none;
      border: none;
      color: var(--muted);
      cursor: pointer;
      font-size: 14px;
      padding: 2px 4px;
      border-radius: 4px;
      transition: color 0.15s;
    }
    .se-toggle-btn:hover { color: var(--text); }

    .se-body { padding: 10px; }

    .se-section {
      margin-bottom: 10px;
      border: 1px solid var(--border);
      border-radius: 7px;
      overflow: hidden;
    }
    .se-section-header {
      background: var(--bg2);
      padding: 7px 10px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      user-select: none;
      transition: color 0.15s;
    }
    .se-section-header:hover { color: var(--text); }
    .se-section-header .se-arrow { font-size: 9px; transition: transform 0.2s; }
    .se-section-header.collapsed .se-arrow { transform: rotate(-90deg); }
    .se-section-content { padding: 8px 10px; display: flex; flex-direction: column; gap: 7px; }
    .se-section-content.hidden { display: none; }

    .se-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .se-label {
      flex: 0 0 90px;
      color: var(--muted);
      font-size: 10px;
    }
    .se-slider-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .se-slider {
      flex: 1;
      -webkit-appearance: none;
      height: 3px;
      background: var(--border);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    }
    .se-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
      transition: background 0.15s, transform 0.15s;
    }
    .se-slider:hover::-webkit-slider-thumb { background: #9c8fff; transform: scale(1.2); }
    .se-readout {
      min-width: 34px;
      text-align: right;
      color: var(--accent);
      font-size: 10px;
    }

    .se-color {
      width: 36px;
      height: 22px;
      border: 1px solid var(--border);
      border-radius: 4px;
      cursor: pointer;
      padding: 2px;
      background: var(--bg1);
    }

    .se-btn {
      flex: 1;
      padding: 6px 10px;
      border: 1px solid var(--border);
      border-radius: 5px;
      background: var(--bg2);
      color: var(--text);
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .se-btn:hover { background: var(--border); border-color: var(--accent); }
    .se-btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    .se-btn.primary:hover { background: #9c8fff; }
    .se-btn.danger { border-color: var(--accent2); color: var(--accent2); }
    .se-btn.danger:hover { background: rgba(242,108,108,0.12); }

    .se-btn-row { display: flex; gap: 6px; }

    .se-viewmode-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
    }
    .se-viewmode-btn {
      padding: 5px;
      border: 1px solid var(--border);
      border-radius: 5px;
      background: var(--bg2);
      color: var(--muted);
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s;
    }
    .se-viewmode-btn:hover { color: var(--text); border-color: var(--accent); }
    .se-viewmode-btn.active { background: rgba(124,106,247,0.18); border-color: var(--accent); color: var(--accent); }

    .se-object-list { display: flex; flex-direction: column; gap: 4px; }
    .se-object-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 5px;
      padding: 5px 8px;
      cursor: pointer;
      transition: border-color 0.15s;
      font-size: 10px;
    }
    .se-object-item:hover { border-color: var(--accent); }
    .se-object-item.selected { border-color: var(--accent); background: rgba(124,106,247,0.1); }
    .se-object-item .se-obj-name { color: var(--text); }
    .se-object-item .se-obj-type { color: var(--muted); font-size: 9px; }
    .se-obj-del {
      background: none;
      border: none;
      color: var(--muted);
      cursor: pointer;
      font-size: 11px;
      padding: 0 2px;
      transition: color 0.15s;
    }
    .se-obj-del:hover { color: var(--accent2); }

    .se-select {
      flex: 1;
      background: var(--bg2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 4px 6px;
      border-radius: 5px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      outline: none;
    }
    .se-select:focus { border-color: var(--accent); }

    .se-number-input {
      flex: 1;
      background: var(--bg2);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 4px 6px;
      border-radius: 5px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      outline: none;
      width: 100%;
    }
    .se-number-input:focus { border-color: var(--accent); }

    .se-xyz {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 4px;
    }
    .se-xyz-field { display: flex; flex-direction: column; gap: 2px; }
    .se-xyz-label { font-size: 9px; color: var(--muted); text-align: center; }

    .se-status {
      padding: 6px 10px;
      font-size: 9px;
      color: var(--success);
      border-top: 1px solid var(--border);
      letter-spacing: 0.05em;
      min-height: 24px;
    }
  `;
  document.head.appendChild(style);
}

/* ─────────────────────────── SceneEditor ─────────────────────────── */

export class SceneEditor {
  /**
   * @param {object} sceneManager  – your SceneManager instance
   * @param {THREE.Scene} scene    – THREE.Scene (sceneManager.instance)
   */
  constructor(sceneManager, scene) {
    this._sm = sceneManager;
    this._scene = scene;

    /** ambient light editor state (color + intensity tracked separately so
     *  either slider can change without resetting the other) */
    this._ambientHex = '#262640';   // matches Lights default ~(0.15, 0.15, 0.25)
    this._ambientIntensity = 1.0;

    /** tracked editor-added objects: { uuid, name, mesh } */
    this._objects = [];
    this._selected = null;
    this._collapsed = {};

    injectStyles();
    this._buildUI();
  }

  /* ── UI construction ── */

  _buildUI() {
    this._root = el('div', { id: 'scene-editor' });

    /* header */
    const header = el('div', { class: 'se-header' });
    header.appendChild(el('span', { class: 'se-title' }, '⬡ SCENE EDITOR'));
    const toggleBtn = el('button', { class: 'se-toggle-btn' }, '–');
    let panelOpen = true;
    toggleBtn.addEventListener('click', () => {
      panelOpen = !panelOpen;
      body.style.display = panelOpen ? '' : 'none';
      toggleBtn.textContent = panelOpen ? '–' : '+';
    });
    header.appendChild(toggleBtn);
    this._root.appendChild(header);

    const body = el('div', { class: 'se-body' });

    body.appendChild(this._buildViewModeSection());
    body.appendChild(this._buildAddObjectSection());
    body.appendChild(this._buildObjectsSection());
    body.appendChild(this._buildTransformSection());
    body.appendChild(this._buildTerrainSection());
    body.appendChild(this._buildSceneSection());

    this._root.appendChild(body);

    /* status bar */
    this._statusEl = el('div', { class: 'se-status' }, 'ready');
    this._root.appendChild(this._statusEl);

    document.body.appendChild(this._root);
  }

  _section(id, label, content) {
    const sec = el('div', { class: 'se-section' });
    const hdr = el('div', { class: 'se-section-header' });
    const arrow = el('span', { class: 'se-arrow' }, '▾');
    hdr.appendChild(arrow);
    hdr.appendChild(document.createTextNode(label));
    const cnt = el('div', { class: 'se-section-content' });
    content(cnt);

    const toggle = () => {
      this._collapsed[id] = !this._collapsed[id];
      if (this._collapsed[id]) {
        cnt.classList.add('hidden');
        hdr.classList.add('collapsed');
      } else {
        cnt.classList.remove('hidden');
        hdr.classList.remove('collapsed');
      }
    };
    hdr.addEventListener('click', toggle);
    sec.appendChild(hdr);
    sec.appendChild(cnt);
    return sec;
  }

  /* ── View mode ── */

  _buildViewModeSection() {
    return this._section('viewmode', 'View Mode', cnt => {
      const modes = [
        { label: 'Combined', key: 0 },
        { label: 'Ambient',  key: 1 },
        { label: 'Diffuse',  key: 2 },
        { label: 'Specular', key: 3 },
      ];
      const grid = el('div', { class: 'se-viewmode-grid' });
      this._viewModeBtns = {};
      modes.forEach(({ label, key }) => {
        const b = el('button', { class: 'se-viewmode-btn' + (key === 0 ? ' active' : '') }, label);
        b.addEventListener('click', () => {
          this._setViewMode(key);
        });
        this._viewModeBtns[key] = b;
        grid.appendChild(b);
      });
      cnt.appendChild(grid);
    });
  }

  _setViewMode(key) {
    if (this._sm._phongMaterial) this._sm._phongMaterial.setViewMode(key);
    this._sm._viewMode = key;
    Object.entries(this._viewModeBtns).forEach(([k, b]) => {
      b.classList.toggle('active', Number(k) === key);
    });
    this._status(`View mode → ${['Combined','Ambient','Diffuse','Specular'][key]}`);
  }

  /* ── Add object ── */

  _buildAddObjectSection() {
    return this._section('add', 'Add Object', cnt => {
      /* geometry selector */
      const geoSelect = el('select', { class: 'se-select' });
      ['Box', 'Sphere', 'Cylinder', 'Torus', 'Plane'].forEach(g => {
        geoSelect.appendChild(el('option', { value: g.toLowerCase() }, g));
      });

      /* size input */
      const sizeInput = el('input', {
        type: 'number', class: 'se-number-input',
        value: '2', min: '0.1', max: '50', step: '0.5',
        style: { width: '60px', flex: '0 0 60px' },
      });

      /* color input */
      const colorPick = colorInput('#7c6af7', () => {});

      cnt.appendChild(labeledRow('Geometry', geoSelect));
      cnt.appendChild(labeledRow('Size', (() => {
        const w = el('div', { class: 'se-slider-wrap' });
        w.appendChild(sizeInput);
        return w;
      })()));
      cnt.appendChild(labeledRow('Color', colorPick));
      cnt.appendChild(btn('＋ Add to Scene', () => {
        this._addObject(geoSelect.value, parseFloat(sizeInput.value), colorPick.value);
      }, 'primary'));
    });
  }

  async _addObject(geoType, size, hexColor) {
  let geo;
  switch (geoType) {
    case 'sphere':   geo = new THREE.SphereGeometry(size / 2, 32, 32); break;
    case 'cylinder': geo = new THREE.CylinderGeometry(size / 2, size / 2, size, 32); break;
    case 'torus':    geo = new THREE.TorusGeometry(size / 2, size / 5, 16, 100); break;
    case 'plane':    geo = new THREE.PlaneGeometry(size, size); break;
    default:         geo = new THREE.BoxGeometry(size, size, size); break;
  }

  // Wait for the phong material to be ready, then clone it
  await this._sm._phongMaterial?.getMaterial()?.__loadPromise;
  const mat = this._sm._phongMaterial?.getMaterial()?.clone();

  // Fallback to built-in if custom material not ready
  const finalMat = mat ?? new THREE.MeshPhongMaterial({ color: new THREE.Color(hexColor), shininess: 80 });

  const mesh = new THREE.Mesh(geo, finalMat);
  mesh.position.set(
    (Math.random() - 0.5) * 20,
    size / 2,
    (Math.random() - 0.5) * 20,
  );

  this._scene.add(mesh);

    const entry = {
      uuid: mesh.uuid,
      name: `${geoType[0].toUpperCase() + geoType.slice(1)}_${this._objects.length + 1}`,
      type: geoType,
      mesh,
    };
    this._objects.push(entry);
    this._refreshObjectList();
    this._selectObject(entry);
    this._status(`Added ${entry.name}`);
  }

  /* ── Object list ── */

  _buildObjectsSection() {
    return this._section('objects', 'Objects', cnt => {
      this._objectListEl = el('div', { class: 'se-object-list' });
      cnt.appendChild(this._objectListEl);
      cnt.appendChild(
        el('div', { class: 'se-btn-row' },
          btn('Clear All', () => this._clearAll(), 'danger')
        )
      );
    });
  }

  _refreshObjectList() {
    this._objectListEl.innerHTML = '';
    if (this._objects.length === 0) {
      this._objectListEl.appendChild(
        el('div', { style: { color: 'var(--muted)', fontSize: '10px', padding: '4px 0' } }, 'No objects added yet')
      );
      return;
    }
    this._objects.forEach(obj => {
      const item = el('div', { class: 'se-object-item' + (this._selected === obj ? ' selected' : '') });
      const info = el('div');
      info.appendChild(el('div', { class: 'se-obj-name' }, obj.name));
      info.appendChild(el('div', { class: 'se-obj-type' }, obj.type));
      item.appendChild(info);
      const del = el('button', { class: 'se-obj-del' }, '✕');
      del.addEventListener('click', e => { e.stopPropagation(); this._removeObject(obj); });
      item.appendChild(del);
      item.addEventListener('click', () => this._selectObject(obj));
      this._objectListEl.appendChild(item);
    });
  }

  _selectObject(obj) {
    this._selected = obj;
    this._refreshObjectList();
    this._refreshTransform();
    this._status(`Selected: ${obj.name}`);
  }

  _removeObject(obj) {
    this._scene.remove(obj.mesh);
    obj.mesh.geometry.dispose();
    obj.mesh.material.dispose();
    this._objects = this._objects.filter(o => o !== obj);
    if (this._selected === obj) this._selected = null;
    this._refreshObjectList();
    this._refreshTransform();
    this._status(`Removed ${obj.name}`);
  }

  _clearAll() {
    [...this._objects].forEach(o => this._removeObject(o));
    this._status('All editor objects removed');
  }

  /* ── Transform ── */

  _buildTransformSection() {
    const sec = this._section('transform', 'Transform', cnt => {
      this._transformEl = cnt;
    });
    return sec;
  }

  _refreshTransform() {
    const cnt = this._transformEl;
    cnt.innerHTML = '';

    if (!this._selected) {
      cnt.appendChild(
        el('div', { style: { color: 'var(--muted)', fontSize: '10px' } }, 'Select an object above')
      );
      return;
    }

    const mesh = this._selected.mesh;

    const xyzRow = (label, vec3Prop, min, max) => {
      const row = el('div');
      row.appendChild(el('label', { class: 'se-label' }, label));
      const xyz = el('div', { class: 'se-xyz' });
      ['x', 'y', 'z'].forEach(axis => {
        const field = el('div', { class: 'se-xyz-field' });
        field.appendChild(el('span', { class: 'se-xyz-label' }, axis.toUpperCase()));
        const inp = el('input', {
          type: 'number',
          class: 'se-number-input',
          value: mesh[vec3Prop][axis].toFixed(2),
          step: '0.1',
          min: String(min), max: String(max),
        });
        inp.addEventListener('input', () => {
          mesh[vec3Prop][axis] = parseFloat(inp.value) || 0;
        });
        field.appendChild(inp);
        xyz.appendChild(field);
      });
      row.appendChild(xyz);
      return row;
    };

    cnt.appendChild(xyzRow('Position', 'position', -100, 100));
    cnt.appendChild(xyzRow('Rotation', 'rotation', -Math.PI * 2, Math.PI * 2));
    cnt.appendChild(xyzRow('Scale',    'scale',    0.01, 50));

    /* shininess */
    if (mesh.material.shininess !== undefined) {
      const shinRow = slider({
        min: 0, max: 256, step: 1,
        value: mesh.material.shininess, decimals: 0,
        onChange: v => { mesh.material.shininess = v; },
      });
      cnt.appendChild(labeledRow('Shininess', shinRow));
    }

    /* wireframe */
    const wfBtn = el('button', {
      class: 'se-btn' + (mesh.material.wireframe ? ' primary' : ''),
    }, mesh.material.wireframe ? 'Wireframe ON' : 'Wireframe OFF');
    wfBtn.addEventListener('click', () => {
      mesh.material.wireframe = !mesh.material.wireframe;
      wfBtn.textContent = mesh.material.wireframe ? 'Wireframe ON' : 'Wireframe OFF';
      wfBtn.classList.toggle('primary', mesh.material.wireframe);
    });
    cnt.appendChild(el('div', { class: 'se-btn-row' }, wfBtn));
  }

  /* ── Terrain settings ── */

  _buildTerrainSection() {
  return this._section('terrain', 'Terrain', cnt => {

    const tm = () => this._sm._terrain?.terrainMaterial;

    // Y position
    cnt.appendChild(labeledRow('Y Offset',
      slider({ min: -30, max: 10, step: 0.1, value: -8, decimals: 1,
        onChange: v => { if (this._sm._terrain) this._sm._terrain.setPosition(0, v, 0); }
      })
    ));

    // Amplitude
    cnt.appendChild(labeledRow('Amplitude',
      slider({ min: 0, max: 20, step: 0.1, value: 8, decimals: 1,
        onChange: v => tm()?.setAmplitude(v)
      })
    ));

    // Frequency
    cnt.appendChild(labeledRow('Frequency',
      slider({ min: 0.01, max: 0.3, step: 0.005, value: 0.08, decimals: 3,
        onChange: v => tm()?.setFrequency(v)
      })
    ));

    // Octaves
    cnt.appendChild(labeledRow('Octaves',
      slider({ min: 1, max: 8, step: 1, value: 6, decimals: 0,
        onChange: v => tm()?.setOctaves(v)
      })
    ));

    // Warp Strength
    cnt.appendChild(labeledRow('Warp',
      slider({ min: 0, max: 1, step: 0.01, value: 0.4, decimals: 2,
        onChange: v => tm()?.setWarpStrength(v)
      })
    ));

    // Ridge Blend
    cnt.appendChild(labeledRow('Ridge',
      slider({ min: 0, max: 1, step: 0.01, value: 0.3, decimals: 2,
        onChange: v => tm()?.setRidgeBlend(v)
      })
    ));

    // Sine Blend (water)
    cnt.appendChild(labeledRow('Water',
      slider({ min: 0, max: 1, step: 0.01, value: 0.0, decimals: 2,
        onChange: v => tm()?.setSineBlend(v)
      })
    ));

    // Fog density
    cnt.appendChild(labeledRow('Fog',
      slider({ min: 0, max: 0.02, step: 0.0005, value: 0.004, decimals: 4,
        onChange: v => tm()?.setFogDensity(v)
      })
    ));

    // BG color
    cnt.appendChild(labeledRow('BG Color',
      colorInput('#1a1a2e', v => {
        this._scene.background = new THREE.Color(v);
      })
    ));
  });
}

  /* ── Ambient helper ── */

  /** Converts current hex + intensity to a 0-1 RGB Vector3 and pushes
   *  it straight onto the Lights instance so SceneManager.update()
   *  picks it up every frame automatically. */
  _applyAmbient() {
    if (!this._sm._lights) return;
    const c = new THREE.Color(this._ambientHex);
    this._sm._lights.setAmbientColor(
      c.r * this._ambientIntensity,
      c.g * this._ambientIntensity,
      c.b * this._ambientIntensity,
    );
  }

  /* ── Scene-wide settings ── */

  _buildSceneSection() {
    return this._section('scene', 'Scene', cnt => {
      /* ambient light color */
      cnt.appendChild(labeledRow('Ambient',
        colorInput(this._ambientHex, v => {
          this._ambientHex = v;
          this._applyAmbient();
        })
      ));

      /* ambient intensity */
      cnt.appendChild(labeledRow('Amb. Int.',
        slider({ min: 0, max: 2, step: 0.01, value: this._ambientIntensity, decimals: 2,
          onChange: v => {
            this._ambientIntensity = v;
            this._applyAmbient();
          }
        })
      ));

      /* shininess for phong material */
      cnt.appendChild(labeledRow('Shininess',
        slider({ min: 0, max: 256, step: 1, value: 128, decimals: 0,
          onChange: v => {
            if (this._sm._phongMaterial?.getMaterial?.()) {
              const mat = this._sm._phongMaterial.getMaterial();
              if (mat.uniforms?.shininess) mat.uniforms.shininess.value = v;
            }
          }
        })
      ));

      /* debug cube visibility */
      const cubeBtn = el('button', { class: 'se-btn' }, 'Toggle Debug Cube');
      cubeBtn.addEventListener('click', () => {
        if (this._sm._mesh) {
          this._sm._mesh.visible = !this._sm._mesh.visible;
          this._status(`Debug cube: ${this._sm._mesh.visible ? 'visible' : 'hidden'}`);
        }
      });
      cnt.appendChild(el('div', { class: 'se-btn-row' }, cubeBtn));
    });
  }

  /* ── Status ── */

  _status(msg) {
    this._statusEl.textContent = `> ${msg}`;
    clearTimeout(this._statusTimer);
    this._statusTimer = setTimeout(() => {
      this._statusEl.textContent = 'ready';
    }, 3000);
  }

  /* ── Public API ── */

  /** Call from your animation loop if you want live refreshes of transform inputs. */
  update(_elapsed) {
    // Reserved for future live-sync of transform fields.
  }

  destroy() {
    this._root?.remove();
  }
}