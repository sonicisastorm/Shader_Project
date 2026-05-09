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
  class Vector2 { constructor(x=0,y=0){ this.x=x; this.y=y; } set(x,y){ this.x=x; this.y=y; } }
  class ShaderMaterial { constructor(o){ this.uniforms=o.uniforms||{}; } dispose(){} }
  class Mesh { constructor(g,m){ this.geometry=g; this.material=m; } }
  return { LinearFilter, RGBAFormat, HalfFloatType, UnsignedByteType,
           WebGLRenderTarget, Scene, OrthographicCamera, PlaneGeometry, Vector2, ShaderMaterial, Mesh };
});

import { BlurPass } from '../src/postprocessing/BlurPass.js';

const makeRenderer = () => ({ setRenderTarget: vi.fn(), render: vi.fn() });

describe('BlurPass', () => {
  let renderer, blur;
  beforeEach(() => { renderer = makeRenderer(); blur = new BlurPass(renderer, 800, 600, { passes: 2 }); });

  it('creates two internal ping-pong render targets', () => {
    expect(blur._rtA).toBeDefined(); expect(blur._rtB).toBeDefined();
  });
  it('render() calls setRenderTarget at least 4 times for 2 passes', () => {
    blur.render({ texture: {} });
    expect(renderer.setRenderTarget.mock.calls.length).toBeGreaterThanOrEqual(4);
  });
  it('render() returns _rtB', () => {
    expect(blur.render({ texture: {} })).toBe(blur._rtB);
  });
  it('setSize() resizes both render targets', () => {
    blur.setSize(1920, 1080);
    expect(blur._rtA.width).toBe(1920); expect(blur._rtB.height).toBe(1080);
  });
  it('setSize() updates resolution uniform', () => {
    blur.setSize(1280, 720);
    expect(blur._uniforms.uResolution.value.x).toBe(1280);
    expect(blur._uniforms.uResolution.value.y).toBe(720);
  });
  it('dispose() marks both RTs as disposed', () => {
    blur.dispose();
    expect(blur._rtA.disposed).toBe(true); expect(blur._rtB.disposed).toBe(true);
  });
});
