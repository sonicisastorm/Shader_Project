import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('three', () => {
  class Vector3 {
    constructor(x=0,y=0,z=0){ this.x=x; this.y=y; this.z=z; }
    set(x,y,z){ this.x=x; this.y=y; this.z=z; return this; }
    clone(){ return new Vector3(this.x, this.y, this.z); }
    normalize(){ const l=Math.sqrt(this.x**2+this.y**2+this.z**2)||1; this.x/=l;this.y/=l;this.z/=l; return this; }
    lengthSq(){ return this.x**2+this.y**2+this.z**2; }
    multiplyScalar(s){ this.x*=s;this.y*=s;this.z*=s; return this; }
    lerp(v,a){ this.x+=(v.x-this.x)*a;this.y+=(v.y-this.y)*a;this.z+=(v.z-this.z)*a; return this; }
    addScaledVector(v,s){ this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s; return this; }
    applyQuaternion(){ return this; }
  }
  class Euler { constructor(){ this.x=0;this.y=0;this.z=0; } setFromQuaternion(){ return this; } }
  class Quaternion { setFromEuler(){ return this; } }
  return { Vector3, Euler, Quaternion };
});

import { CameraController } from '../src/controls/CameraController.js';

const makeCamera = () => ({
  position: { x:0, y:0, z:0, addScaledVector(v,s){ this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s; } },
  quaternion: { setFromEuler(){} },
});
const makeDom = () => ({ requestPointerLock: vi.fn(), addEventListener: vi.fn() });

describe('CameraController', () => {
  let ctrl, docAdd, docRemove;
  beforeEach(() => {
    docAdd    = vi.spyOn(document, 'addEventListener');
    docRemove = vi.spyOn(document, 'removeEventListener');
    ctrl      = new CameraController(makeCamera(), makeDom(), { moveSpeed: 10, damping: 100 });
    ctrl._pointerLocked = true;
  });
  afterEach(() => { ctrl.destroy(); vi.restoreAllMocks(); });

  it('registers keydown + keyup + mousemove on document', () => {
    const events = docAdd.mock.calls.map(c=>c[0]);
    expect(events).toContain('keydown');
    expect(events).toContain('keyup');
    expect(events).toContain('mousemove');
  });
  it('removes all document listeners on destroy()', () => {
    ctrl.destroy();
    const events = docRemove.mock.calls.map(c=>c[0]);
    expect(events).toContain('keydown');
    expect(events).toContain('keyup');
    docRemove.mockReset();
  });
  it('sets key state true on keydown', () => {
    ctrl._onKeyDown({ code: 'KeyW' }); expect(ctrl._keys.KeyW).toBe(true);
  });
  it('clears key state on keyup', () => {
    ctrl._onKeyDown({ code: 'KeyW' }); ctrl._onKeyUp({ code: 'KeyW' });
    expect(ctrl._keys.KeyW).toBe(false);
  });
  it('ignores unknown key codes without throwing', () => {
    expect(() => ctrl._onKeyDown({ code: 'Space' })).not.toThrow();
  });
  it('moves camera when W is held', () => {
    ctrl._onKeyDown({ code: 'KeyW' });
    const z0 = ctrl.camera.position.z;
    ctrl.update(0.1);
    expect(ctrl.camera.position.z).not.toBe(z0);
  });
  it('does not throw on mouse move when pointer unlocked', () => {
    ctrl._pointerLocked = false;
    expect(() => ctrl._onMouseMove({ movementX: 10, movementY: 5 })).not.toThrow();
  });
  it('update() does not throw with no keys pressed', () => {
    expect(() => ctrl.update(0.016)).not.toThrow();
  });
});
