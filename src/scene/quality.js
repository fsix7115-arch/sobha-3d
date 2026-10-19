/**
 * Detect GPU capability so we can scale the 3D scene, and detect whether
 * WebGL is available at all so we never try to load a 1MB 3D bundle onto a
 * machine that cannot run it.
 */
export function hasWebGL() {
  if (typeof document === 'undefined') return false
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function detectQuality() {
  if (typeof document === 'undefined') return 'high'
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') || c.getContext('webgl')
    if (!gl) return 'light'
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : ''
    const soft = /swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(renderer)
    const mobile = /android|iphone|ipad/i.test(navigator.userAgent)
    if (soft) return 'light'
    if (mobile) return 'medium'
    return 'high'
  } catch {
    return 'medium'
  }
}

export const QUALITY = {
  // dpr caps at 1.5 rather than 2: on a 2x retina laptop, dpr 2 means 4x the
  // pixels of a 1x display and is the difference between smooth and stutter.
  // PerformanceMonitor lowers it further if the frame rate still can't hold.
  high: { dpr: [1, 1.5], antialias: true, sparkles: 60, env: true, clearcoat: true, shadows: false },
  medium: { dpr: [1, 1.25], antialias: true, sparkles: 30, env: false, clearcoat: true, shadows: false },
  light: { dpr: 0.7, antialias: false, sparkles: 0, env: false, clearcoat: false, shadows: false },
}
