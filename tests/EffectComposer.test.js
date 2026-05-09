import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('three', () => {
  const LinearFilter=1, RGBAFormat=2, HalfFloatType=3, UnsignedByteType=4;
  class WebGLRenderTarget {
    constructor(w,h){ this.width=w; this.height=h; this.disposed=false; }
    setSize(w,h){ this.width=w; this.height=h; }
    dispose(){ this.disposed=true; }
  }
  return { LinearFilter, RGBAFormat, HalfFloatType, UnsignedByteType, WebGLRenderTarget };
});

import { EffectComposer } from '../src/postprocessing/EffectComposer.js';

const makeRenderer = () => ({ setRenderTarget: vi.fn(), render: vi.fn() });
const makePass = (name, enabled=true) => ({ name, enabled, render: vi.fn(), setSize: vi.fn(), dispose: vi.fn() });

describe('EffectComposer', () => {
  let renderer, composer;
  beforeEach(() => { renderer = makeRenderer(); composer = new EffectComposer(renderer, 800, 600); });

  it('addPass() is chainable and stores the pass', () => {
    const p = makePass('bloom');
    expect(composer.addPass(p)).toBe(composer);
    expect(composer._passes).toContain(p);
  });
  it('removePass() removes the pass', () => {
    const p = makePass('bloom'); composer.addPass(p); composer.removePass(p);
    expect(composer._passes).not.toContain(p);
  });
  it('render() calls every enabled pass', () => {
    const p1 = makePass('a'), p2 = makePass('b');
    composer.addPass(p1).addPass(p2);
    composer.render({ texture: {} });
    expect(p1.render).toHaveBeenCalledOnce();
    expect(p2.render).toHaveBeenCalledOnce();
  });
  it('render() skips disabled passes', () => {
    const off = makePass('off', false), on = makePass('on', true);
    composer.addPass(off).addPass(on);
    composer.render({ texture: {} });
    expect(off.render).not.toHaveBeenCalled();
    expect(on.render).toHaveBeenCalledOnce();
  });
  it('last pass always receives null outputRT (screen)', () => {
    const p = makePass('bloom'); composer.addPass(p);
    composer.render({ texture: {} });
    expect(p.render.mock.calls[0][1]).toBeNull();
  });
  it('setSize() propagates to all passes', () => {
    const p = makePass('bloom'); composer.addPass(p);
    composer.setSize(1920, 1080);
    expect(p.setSize).toHaveBeenCalledWith(1920, 1080);
  });
  it('dispose() calls dispose on all passes and clears the list', () => {
    const p1 = makePass('a'), p2 = makePass('b');
    composer.addPass(p1).addPass(p2);
    composer.dispose();
    expect(p1.dispose).toHaveBeenCalled(); expect(p2.dispose).toHaveBeenCalled();
    expect(composer._passes).toHaveLength(0);
  });
  it('dispose() disposes both internal RTs', () => {
    composer.dispose();
    expect(composer._rtA.disposed).toBe(true); expect(composer._rtB.disposed).toBe(true);
  });
});
