import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('three', () => {
  const LinearFilter=1, RGBAFormat=2, HalfFloatType=3, UnsignedByteType=4;
  class WebGLRenderTarget {
    constructor(w,h){ this.width=w; this.height=h; this.texture={}; this.disposed=false; }
    setSize(w,h){ this.width=w; this.height=h; }
    dispose(){ this.disposed=true; }
  }
  class Scene { add(){} }
  class OrthographicCamera {}
  class PlaneGeometry { dispose(){} }
  class Vector2 { constructor(x=0,y=0){ this.x=x;this.y=y; } set(x,y){ this.x=x;this.y=y; } }
  class ShaderMaterial { constructor(o){ this.uniforms=o.uniforms||{}; } dispose(){} }
  class Mesh { constructor(g,m){ this.geometry=g; this.material=m; } }
  return { LinearFilter, RGBAFormat, HalfFloatType, UnsignedByteType,
           WebGLRenderTarget, Scene, OrthographicCamera, PlaneGeometry, Vector2, ShaderMaterial, Mesh };
});

import { BloomPass } from '../src/postprocessing/BloomPass.js';

const makeRenderer = () => ({ setRenderTarget: vi.fn(), render: vi.fn() });

describe('BloomPass', () => {
  let renderer, bloom;
  beforeEach(() => {
    renderer = makeRenderer();
    bloom    = new BloomPass(renderer, 800, 600, { threshold: 0.8, intensity: 1.5, blurPasses: 2 });
  });

  it('exposes threshold via getter/setter', () => {
    expect(bloom.threshold).toBe(0.8); bloom.threshold = 0.5; expect(bloom.threshold).toBe(0.5);
  });
  it('exposes intensity via getter/setter', () => {
    expect(bloom.intensity).toBe(1.5); bloom.intensity = 2.0; expect(bloom.intensity).toBe(2.0);
  });
  it('starts enabled by default', () => { expect(bloom.enabled).toBe(true); });
  it('render() calls setRenderTarget at least once', () => {
    bloom.render({ texture: {} }, null);
    expect(renderer.setRenderTarget).toHaveBeenCalled();
  });
  it('render() calls renderer.render at least twice (extract + composite)', () => {
    bloom.render({ texture: {} }, null);
    expect(renderer.render.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
  it('when disabled, render() calls renderer.render once (passthrough)', () => {
    bloom.enabled = false;
    bloom.render({ texture: {} }, null);
    expect(renderer.render).toHaveBeenCalledTimes(1);
  });
  it('setSize() updates brightRT dimensions', () => {
    bloom.setSize(1920, 1080);
    expect(bloom._brightRT.width).toBe(1920); expect(bloom._brightRT.height).toBe(1080);
  });
  it('dispose() marks brightRT as disposed', () => {
    bloom.dispose(); expect(bloom._brightRT.disposed).toBe(true);
  });
});
