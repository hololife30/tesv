import { useEffect, useRef, useState, type CSSProperties } from 'react'

const NAME = 'Untitled blend'
const STOPS = ['#007BBB', '#A0D8EF', '#1E50A2', '#007BBB']
const TONES = {
  main: [0, 0.4823529411764706, 0.7333333333333333],
  low: [0.11764705882352941, 0.3137254901960784, 0.6352941176470588],
  mid: [0, 0.4823529411764706, 0.7333333333333333],
  high: [0.6274509803921569, 0.8470588235294118, 0.9372549019607843],
}
const VERTEX_SHADER = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'
const FRAGMENT_SHADER = `precision highp float;
uniform vec2 u_res;
uniform float u_t;
uniform vec3 u_main;
uniform vec3 u_low;
uniform vec3 u_mid;
uniform vec3 u_high;
uniform float u_wind;
uniform float u_warp;
uniform float u_nscale;
uniform sampler2D u_noise;

const float FBM_STRENGTH = 0.912;
const float BLUR_RADIUS = 1.2673;
const float ZOOM = 0.3971;
const float GRAIN_SCALE = 2.5;
const float GRAIN_STRENGTH = 0.014;

vec3 burn(vec3 base, vec3 blend, float op){
  return max(base + blend - vec3(1.0), vec3(0.0))*op + base*(1.0-op);
}
float rand2(vec2 n){ return fract(sin(dot(n, vec2(12.9898, 4.1414)))*43758.5453); }
float noise2(vec2 p){
  vec2 ip = floor(p); vec2 u = fract(p);
  u = u*u*(3.0-2.0*u);
  float m = mix(mix(rand2(ip), rand2(ip+vec2(1.,0.)), u.x), mix(rand2(ip+vec2(0.,1.)), rand2(ip+vec2(1.,1.)), u.x), u.y);
  return m*m;
}
float fbm4(vec2 x){
  float v = 0.0; float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; i++) { v += a*noise2(x); x = rot*x*2.0 + shift; a *= 0.5; }
  return v;
}
vec4 permute4(vec4 x){ return mod((x*34.0 + 1.0)*x, 289.0); }
vec4 tisqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }
vec3 fade3(vec3 t){ return t*t*t*(t*(t*6.0-15.0)+10.0); }
float cnoise(vec3 P){
  vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = vec4(Pi0.z); vec4 iz1 = vec4(Pi1.z);
  vec4 ixy = permute4(permute4(ix) + iy);
  vec4 ixy0 = permute4(ixy + iz0); vec4 ixy1 = permute4(ixy + iz1);
  vec4 gx0 = ixy0/7.0; vec4 gy0 = fract(floor(gx0)/7.0) - 0.5; gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0); vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0*(step(vec4(0.0), gx0) - 0.5); gy0 -= sz0*(step(vec4(0.0), gy0) - 0.5);
  vec4 gx1 = ixy1/7.0; vec4 gy1 = fract(floor(gx1)/7.0) - 0.5; gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1); vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1*(step(vec4(0.0), gx1) - 0.5); gy1 -= sz1*(step(vec4(0.0), gy1) - 0.5);
  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x); vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z); vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x); vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z); vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
  vec4 n0 = tisqrt(vec4(dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
  g000 *= n0.x; g010 *= n0.y; g100 *= n0.z; g110 *= n0.w;
  vec4 n1 = tisqrt(vec4(dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
  g001 *= n1.x; g011 *= n1.y; g101 *= n1.z; g111 *= n1.w;
  float n000 = dot(g000, Pf0); float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z)); float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z)); float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz)); float n111 = dot(g111, Pf1);
  vec3 fx = fade3(Pf0);
  vec4 nz = mix(vec4(n000,n100,n010,n110), vec4(n001,n101,n011,n111), fx.z);
  vec2 ny = mix(nz.xy, nz.zw, fx.y);
  return 2.2*mix(ny.x, ny.y, fx.x);
}
uniform vec2 u_dirv;
void main(){
  vec2 st = gl_FragCoord.xy/u_res - 0.5;
  st.x *= u_res.x/u_res.y;
  st = mat2(u_dirv.x, u_dirv.y, -u_dirv.y, u_dirv.x)*st;
  float time = u_t*0.85;
  vec2 uv = st*(1.0/(2.0*ZOOM)) + 0.5;
  float noiseX = cnoise(vec3(uv*u_nscale + vec2(0.0, 74.8572), time*0.3));
  float noiseY = cnoise(vec3(uv*u_nscale + vec2(203.91282, 10.0), time*0.3));
  uv += vec2(noiseX*2.0, noiseY)*u_warp;
  float noiseA = cnoise(vec3(uv*18.0 + vec2(344.91282, 0.0), time*0.3))
               + cnoise(vec3(uv*39.6 + vec2(723.937, 0.0), time*0.4))*0.5;
  uv += noiseA*0.02;
  uv.y -= 0.09;
  float xf = (sin(time) + 1.0)*0.5;
  vec2 texUv = uv*GRAIN_SCALE;
  float d0 = mix(texture2D(u_noise, texUv).r - 0.5, texture2D(u_noise, vec2(texUv.x, 1.0-texUv.y)).g - 0.5, xf)*GRAIN_STRENGTH;
  texUv += vec2(63.861, 368.937);
  float d1 = mix(texture2D(u_noise, texUv).r - 0.5, texture2D(u_noise, vec2(texUv.x, 1.0-texUv.y)).g - 0.5, xf)*GRAIN_STRENGTH;
  texUv += vec2(453.163, 1649.808);
  float d3 = mix(texture2D(u_noise, texUv).r - 0.5, texture2D(u_noise, vec2(texUv.x, 1.0-texUv.y)).g - 0.5, xf)*GRAIN_STRENGTH;
  uv += d0;
  vec2 stF = uv*u_nscale;
  vec2 q = vec2(fbm4(stF*0.5 + u_wind*time));
  vec2 r = vec2(fbm4(stF + q + vec2(0.3, 9.2) + 0.15*time), fbm4(stF + q + vec2(8.3, 0.8) + 0.126*time));
  float fv = fbm4(stF + r - q);
  float full = (fv + 0.6*fv*fv + 0.7*fv + 0.5)*0.5;
  full = pow(full, 0.55)*FBM_STRENGTH;
  float blurR = BLUR_RADIUS*1.5;
  vec2 uvA = uv + vec2((full-0.5)*1.2) + vec2(0.0, 0.025) + d0;
  float snA = noise2(uvA*2.0 + vec2(0.0, time*0.5))*3.0;
  float lA = pow(smoothstep(snA - 1.2*blurR, snA + 1.2*blurR, (uvA.y - 0.5)*5.0 + 0.5), 0.8);
  vec2 uvB = uv + vec2((full-0.5)*0.85) + vec2(0.0, 0.025) + d1;
  float snB = noise2(uvB*4.0 + vec2(293.0, time))*2.8;
  float lB = pow(smoothstep(snB - 0.9*blurR, snB + 0.9*blurR, (uvB.y - 0.6)*5.0 + 0.5), 0.9);
  vec2 uvC = uv + vec2((full-0.5)*1.1) + d3;
  float snC = noise2(uvC*6.0 + vec2(153.0, time*1.2))*2.6;
  float lC = smoothstep(snC - 0.7*blurR, snC + 0.7*blurR, (uvC.y - 0.9)*6.0 + 0.5);
  vec3 col = burn(u_main, u_low, 1.0 - lA);
  col = burn(col, mix(u_main, u_mid, 1.0 - lB), lA);
  col = mix(col, mix(u_main, u_high, 1.0 - lC), lA*lB);
  gl_FragColor = vec4(col, 1.0);
}`
const DEFAULT_SPEED = 22
const START_T = 22.280001919999453
const SCALE = 45
const DISTORTION = 50
const SWIRL = 40
const DIRECTION = 0
const BLUR = 0
const GRAIN = 4
const WIDTH = 2048
const HEIGHT = 1178
const FLOW_SPEED_RATE = 1.2
const MAX_WIDTH = 2560

type SkyGradientProps = {
  className?: string
  style?: CSSProperties
  speed?: number
  paused?: boolean
}

type Resources = {
  program: WebGLProgram
  vertex: WebGLShader
  fragment: WebGLShader
  buffer: WebGLBuffer
  texture: WebGLTexture
  resolution: WebGLUniformLocation | null
  time: WebGLUniformLocation | null
}

function compile(gl: WebGLRenderingContext, kind: number, source: string): WebGLShader {
  const shader = gl.createShader(kind)
  if (!shader) throw new Error('Could not create the Sky shader.')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'Sky shader failed to compile.'
    gl.deleteShader(shader)
    throw new Error(message)
  }
  return shader
}

export default function SkyGradient({ className, style, speed = DEFAULT_SPEED, paused = false }: SkyGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const grainRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef({ speed, paused })
  const syncRef = useRef<(() => void) | null>(null)
  const [failed, setFailed] = useState(false)
  controlsRef.current = { speed, paused }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = (canvas.getContext('webgl', { alpha: false, antialias: false }) ||
      canvas.getContext('experimental-webgl', { alpha: false, antialias: false })) as WebGLRenderingContext | null
    if (!gl) {
      setFailed(true)
      return
    }

    let resources: Resources | null = null
    let frame = 0
    let last = 0
    let t = START_T
    let visible = true
    let lost = false
    let disposed = false
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const destroy = () => {
      if (!resources || lost) { resources = null; return }
      gl.deleteTexture(resources.texture)
      gl.deleteBuffer(resources.buffer)
      gl.deleteProgram(resources.program)
      gl.deleteShader(resources.vertex)
      gl.deleteShader(resources.fragment)
      resources = null
    }

    const setup = () => {
      const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
      let fragment: WebGLShader | null = null
      let program: WebGLProgram | null = null
      let buffer: WebGLBuffer | null = null
      let texture: WebGLTexture | null = null
      try {
        fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
        program = gl.createProgram()
        if (!program) throw new Error('Could not create the Sky program.')
        gl.attachShader(program, vertex)
        gl.attachShader(program, fragment)
        gl.bindAttribLocation(program, 0, 'p')
        gl.linkProgram(program)
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          throw new Error(gl.getProgramInfoLog(program) || 'Sky program failed to link.')
        }
        gl.useProgram(program)
        buffer = gl.createBuffer()
        if (!buffer) throw new Error('Could not create the Sky geometry.')
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        gl.enableVertexAttribArray(0)
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

        texture = gl.createTexture()
        if (!texture) throw new Error('Could not create the Sky noise texture.')
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        const noise = new Uint8Array(256 * 256 * 4)
        for (let i = 0; i < 256 * 256; i++) {
          const value = (Math.random() * 256) | 0
          noise[i * 4] = value
          noise[i * 4 + 1] = value
          noise[i * 4 + 2] = value
          noise[i * 4 + 3] = 255
        }
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, noise)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.uniform1i(gl.getUniformLocation(program, 'u_noise'), 0)
        gl.uniform3fv(gl.getUniformLocation(program, 'u_main'), TONES.main)
        gl.uniform3fv(gl.getUniformLocation(program, 'u_low'), TONES.low)
        gl.uniform3fv(gl.getUniformLocation(program, 'u_mid'), TONES.mid)
        gl.uniform3fv(gl.getUniformLocation(program, 'u_high'), TONES.high)
        gl.uniform1f(gl.getUniformLocation(program, 'u_nscale'), 0.35 + SCALE / 100 * 1.15)
        gl.uniform1f(gl.getUniformLocation(program, 'u_warp'), DISTORTION / 100 * 0.47)
        gl.uniform1f(gl.getUniformLocation(program, 'u_wind'), SWIRL / 100 * 0.36)
        const angle = (DIRECTION % 4) * Math.PI / 2
        gl.uniform2f(gl.getUniformLocation(program, 'u_dirv'), Math.cos(angle), Math.sin(angle))
        resources = {
          program, vertex, fragment, buffer, texture,
          resolution: gl.getUniformLocation(program, 'u_res'),
          time: gl.getUniformLocation(program, 'u_t'),
        }
      } catch (error) {
        if (texture) gl.deleteTexture(texture)
        if (buffer) gl.deleteBuffer(buffer)
        if (program) gl.deleteProgram(program)
        if (fragment) gl.deleteShader(fragment)
        gl.deleteShader(vertex)
        throw error
      }
    }

    const paint = () => {
      if (!resources || lost || disposed || canvas.width < 1 || canvas.height < 1) return
      gl.useProgram(resources.program)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(resources.resolution, canvas.width, canvas.height)
      gl.uniform1f(resources.time, t)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const active = () => !disposed && !lost && !!resources && visible && !document.hidden &&
      !motion.matches && !controlsRef.current.paused && controlsRef.current.speed > 0
    const tick = (now: number) => {
      frame = 0
      if (!active()) { last = 0; return }
      if (last) t += Math.min(0.05, (now - last) / 1000) *
        (Math.min(100, Math.max(0, controlsRef.current.speed)) / 100) * FLOW_SPEED_RATE
      last = now
      paint()
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      if (!active()) {
        if (frame) cancelAnimationFrame(frame)
        frame = 0
        last = 0
        paint()
      } else if (!frame) {
        last = 0
        paint()
        frame = requestAnimationFrame(tick)
      }
    }
    syncRef.current = sync

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(3, window.devicePixelRatio || 1)
      const scale = Math.min(1, MAX_WIDTH / Math.max(1, rect.width * dpr))
      const width = Math.max(1, Math.round(rect.width * dpr * scale))
      const height = Math.max(1, Math.round(rect.height * dpr * scale))
      if (canvas.width !== width) canvas.width = width
      if (canvas.height !== height) canvas.height = height
      paint()
    }
    const onLost = (event: Event) => {
      event.preventDefault()
      lost = true
      resources = null
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      last = 0
      setFailed(true)
    }
    const onRestored = () => {
      lost = false
      try {
        setup()
        setFailed(false)
        resize()
        sync()
      } catch (error) {
        console.warn('Sky WebGL restore failed:', error)
        setFailed(true)
      }
    }
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
    observer?.observe(canvas)
    window.addEventListener('resize', resize)
    const intersection = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      sync()
    })
    intersection?.observe(canvas)
    document.addEventListener('visibilitychange', sync)
    motion.addEventListener('change', sync)

    if (GRAIN > 0 && grainRef.current) {
      const tile = document.createElement('canvas')
      tile.width = tile.height = 256
      const context = tile.getContext('2d')
      if (context) {
        const image = context.createImageData(256, 256)
        for (let i = 0; i < image.data.length; i += 4) {
          const value = Math.round((Math.random() + Math.random()) * 127.5)
          image.data[i] = image.data[i + 1] = image.data[i + 2] = value
          image.data[i + 3] = 255
        }
        context.putImageData(image, 0, 0)
        grainRef.current.style.backgroundImage = 'url(' + tile.toDataURL() + ')'
      }
    }

    try {
      setup()
      setFailed(false)
      resize()
      sync()
    } catch (error) {
      console.warn('Sky WebGL unavailable:', error)
      setFailed(true)
    }

    return () => {
      disposed = true
      syncRef.current = null
      if (frame) cancelAnimationFrame(frame)
      observer?.disconnect()
      intersection?.disconnect()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', sync)
      motion.removeEventListener('change', sync)
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      destroy()
    }
  }, [])

  useEffect(() => { syncRef.current?.() }, [speed, paused])

  return (
    <div className={className} style={{
      position: 'relative', display: 'block', overflow: 'hidden',
      width: '100%', aspectRatio: String(WIDTH) + ' / ' + String(HEIGHT),
      background: 'linear-gradient(180deg, ' + STOPS.join(', ') + ')',
      ...style,
    }}>
      <canvas ref={canvasRef} role="img" aria-label={NAME} style={{
        position: 'absolute', inset: 0, display: 'block', width: '100%', height: '100%',
        visibility: failed ? 'hidden' : 'visible',
        transform: BLUR > 0 ? 'scale(' + String(1 + BLUR / 200) + ')' : undefined,
        filter: BLUR > 0 ? 'blur(' + String(BLUR) + 'px)' : undefined,
      }} />
      {GRAIN > 0 && <div ref={grainRef} aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundSize: '256px 256px', imageRendering: 'pixelated',
        mixBlendMode: 'overlay', opacity: GRAIN / 200,
      }} />}
      {failed && <span role="status" style={{
        position: 'absolute', right: 12, bottom: 12, padding: '5px 8px',
        borderRadius: 4, color: '#fff', background: 'rgba(0,0,0,.55)',
        font: '12px system-ui, sans-serif',
      }}>WebGL unavailable; showing palette preview.</span>}
    </div>
  )
}