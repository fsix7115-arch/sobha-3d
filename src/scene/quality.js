/**
 * Detect GPU capability so we can scale the 3D scene.
 * Software renderers (SwiftShader / llvmpipe / Mesa) get the LIGHT tier.
 */
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
  high: { dpr: [1, 2], antialias: true, sparkles: 80, env: true, clearcoat: true, shadows: true },
  medium: { dpr: [1, 1.5], antialias: true, sparkles: 45, env: true, clearcoat: true, shadows: false },
  light: { dpr: 0.75, antialias: false, sparkles: 0, env: false, clearcoat: false, shadows: false },
}
