import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('three', () => {
  class Vector3 {
    constructor(x=0,y=0,z=0){ this.x=x;this.y=y;this.z=z; }
    clone(){ return new Vector3(this.x,this.y,this.z); }
    set(x,y,z){ this.x=x;this.y=y;this.z=z; return this; }
    addScaledVector(v,s){ this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s; return this; }
    crossVectors(){ return this; }
    normalize(){ return this; }
  }
  return { Vector3 };
});

import { OrbitControls } from '../src/controls/OrbitControls.js';

function makeDom() {
  const L = {};
  return {
    addEventListener:    (e, h) => { L[e] = h; },
    removeEventListener: (e)    => { delete L[e]; },
    _fire: (e, d) => L[e]?.(d),
    _L: L,
  };
}
function makeCamera() {
  return {
    position: { x:0, y:0, z:0, set: vi.fn() },
    up: { x:0, y:1, z:0 },
    lookAt: vi.fn(),
    getWorldDirection: vi.fn(v => v),
  };
}

describe('OrbitControls', () => {
  let ctrl, dom, camera;
  beforeEach(() => {
    camera = makeCamera(); dom = makeDom();
    ctrl   = new OrbitControls(camera, dom, { radius: 10 });
  });
  afterEach(() => ctrl.destroy());

  it('calls camera.position.set on construction', () => {
    expect(camera.position.set).toHaveBeenCalled();
  });
  it('registers mousedown, mousemove, wheel, contextmenu', () => {
    ['mousedown','mousemove','wheel','contextmenu'].forEach(e =>
      expect(dom._L[e]).toBeDefined());
  });
  it('sets left button true on mousedown button 0', () => {
    dom._fire('mousedown', { button: 0, clientX: 0, clientY: 0 });
    expect(ctrl._buttons.left).toBe(true);
  });
  it('sets right button true on mousedown button 2', () => {
    dom._fire('mousedown', { button: 2, clientX: 0, clientY: 0 });
    expect(ctrl._buttons.right).toBe(true);
  });
  it('clears left button on mouseup', () => {
    dom._fire('mousedown', { button: 0, clientX: 0, clientY: 0 });
    dom._fire('mouseup',   { button: 0 });
    expect(ctrl._buttons.left).toBe(false);
  });
  it('clamps radius to minRadius on scroll in', () => {
    ctrl._radius = ctrl._minR;
    dom._fire('wheel', { deltaY: -9999, preventDefault: vi.fn() });
    expect(ctrl._radius).toBeGreaterThanOrEqual(ctrl._minR);
  });
  it('clamps radius to maxRadius on scroll out', () => {
    ctrl._radius = ctrl._maxR;
    dom._fire('wheel', { deltaY: 9999, preventDefault: vi.fn() });
    expect(ctrl._radius).toBeLessThanOrEqual(ctrl._maxR);
  });
  it('keeps phi in [0.05, π−0.05] on extreme drag', () => {
    dom._fire('mousedown', { button: 0, clientX: 0, clientY: 0 });
    dom._fire('mousemove', { clientX: 0, clientY: 9999 });
    expect(ctrl._phi).toBeGreaterThanOrEqual(0.05);
    expect(ctrl._phi).toBeLessThanOrEqual(Math.PI - 0.05);
  });
  it('update() is a no-op and does not throw', () => {
    expect(() => ctrl.update()).not.toThrow();
  });
});
