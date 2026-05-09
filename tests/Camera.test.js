import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('three', () => {
  class PerspectiveCamera {
    constructor(fov, aspect, near, far) {
      this.fov = fov; this.aspect = aspect; this.near = near; this.far = far;
      this.position = { set: vi.fn(), copy: vi.fn() };
      this._projUpdates = 0;
    }
    updateProjectionMatrix() { this._projUpdates++; }
    lookAt() {}
  }
  class Vector3 { constructor(x=0,y=0,z=0){ this.x=x; this.y=y; this.z=z; } }
  return { PerspectiveCamera, Vector3 };
});

import { Camera } from '../src/camera/Camera.js';

describe('Camera', () => {
  let addSpy, removeSpy;
  beforeEach(() => {
    addSpy    = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');
    Object.defineProperty(window, 'innerWidth',  { configurable: true, value: 800 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 });
  });
  afterEach(() => vi.restoreAllMocks());

  it('creates camera with default FOV of 60', () => {
    const c = new Camera(); expect(c.instance.fov).toBe(60); c.destroy();
  });
  it('sets aspect ratio from window dimensions', () => {
    const c = new Camera(); expect(c.instance.aspect).toBeCloseTo(800/600, 4); c.destroy();
  });
  it('respects custom fov, near, far', () => {
    const c = new Camera({ fov: 75, near: 0.5, far: 500 });
    expect(c.instance.fov).toBe(75); expect(c.instance.near).toBe(0.5); c.destroy();
  });
  it('registers a resize listener', () => {
    const c = new Camera();
    expect(addSpy.mock.calls.map(x=>x[0])).toContain('resize'); c.destroy();
  });
  it('removes resize listener on destroy()', () => {
    const c = new Camera(); c.destroy();
    expect(removeSpy.mock.calls.map(x=>x[0])).toContain('resize');
    removeSpy.mockReset();
  });
  it('updates aspect + projection matrix on resize', () => {
    const c = new Camera();
    Object.defineProperty(window, 'innerWidth',  { configurable: true, value: 1920 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1080 });
    c._onResize();
    expect(c.instance.aspect).toBeCloseTo(1920/1080, 4);
    expect(c.instance._projUpdates).toBe(1); c.destroy();
  });
});
