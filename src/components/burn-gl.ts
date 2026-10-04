/**
 * The newspaper fire, in WebGL2, at full resolution. A canvas laid over the sheet (and a
 * margin around it) draws what the paper turns into as the front passes: scorch, curling
 * char, a glowing edge, flames licking upward, heat haze, and through the hole whatever
 * is behind the sheet (pre-rendered by the caller into `behind`, in sheet coordinates).
 * It also draws the sheet's drop shadow, so the shadow burns away with the paper instead
 * of hanging in the air.
 *
 * `field` holds, per point of the sheet, how far the fire must travel to reach it (px).
 */
const VERT = `#version 300 es
in vec2 p;
out vec2 vUv;
void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uField;
uniform sampler2D uBehind;
uniform vec2 uSize;
uniform vec2 uGrid;
uniform float uCell;
uniform float uMargin;
uniform float uFront;
uniform float uTime;

float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
}
float coarse(vec2 px) { return texture(uField, (clamp(px, vec2(0.0), uSize) / uCell + 0.5) / uGrid).r; }
float field(vec2 px) { return coarse(px) + (n(px / 7.0) - 0.5) * 10.0 + (n(px / 2.3) - 0.5) * 3.0; }

float erf(float x) {
  float x2 = x * x;
  return sign(x) * sqrt(1.0 - exp(-x2 * (1.2732 + 0.147 * x2) / (1.0 + 0.147 * x2)));
}
/** a CSS box-shadow of the sheet (offset y, blur radius), as coverage at px */
float boxShadow(vec2 px, float oy, float blur) {
  float s = blur * 0.5 * 1.4142;
  vec2 q = px - vec2(0.0, oy);
  float cx = 0.5 * (erf((uSize.x - q.x) / s) - erf(-q.x / s));
  float cy = 0.5 * (erf((uSize.y - q.y) / s) - erf(-q.y / s));
  return cx * cy;
}

void main() {
  vec2 cs = uSize + 2.0 * uMargin;
  vec2 px = vec2(vUv.x, 1.0 - vUv.y) * cs - uMargin;
  // a hair past the sheet's edge, so its antialiased border never peeks through the hole
  bool inside = px.x >= -2.0 && px.y >= -2.0 && px.x <= uSize.x + 2.0 && px.y <= uSize.y + 2.0;
  float e = inside ? field(px) - uFront : -1000.0;

  // the sheet's shadow (matches .paper's box-shadow), only where paper is left to cast it
  float alive1 = smoothstep(-70.0, 25.0, coarse(px - vec2(0.0, 50.0)) - uFront);
  float alive2 = smoothstep(-16.0, 8.0, coarse(px - vec2(0.0, 8.0)) - uFront);
  float sh1 = 0.6 * boxShadow(px, 50.0, 90.0) * alive1;
  float sh2 = 0.4 * boxShadow(px, 8.0, 20.0) * alive2;
  float shade = 1.0 - (1.0 - sh1) * (1.0 - sh2);

  // flames: find the front below and lick upward from it
  float fs = 0.0;
  float jit = h(px + fract(uTime * 7.0));
  for (int k = 0; k < 12; k++) {
    float dy = (float(k) + jit) * 8.0;
    vec2 q = px + vec2(0.0, dy);
    if (q.x < 0.0 || q.y < 0.0 || q.x > uSize.x || q.y > uSize.y) continue;
    float eq = field(q) - uFront;
    fs = max(fs, exp(-abs(eq) / 9.0) * (1.0 - dy / 100.0));
  }
  float t1 = n(vec2(px.x / 13.0, px.y / 17.0 + uTime * 5.0));
  float t2 = n(vec2(px.x / 31.0 + 4.0, px.y / 42.0 + uTime * 2.8));
  float t3 = n(vec2(px.x / 6.0 + 9.0, px.y / 8.0 + uTime * 8.0));
  float heat = fs * (0.2 + 1.5 * t1 * t2 + 0.35 * t3);
  float flame = smoothstep(0.12, 0.62, heat);
  float core = smoothstep(0.55, 0.95, heat);

  vec3 col = vec3(0.0);
  float a = 0.0;

  if (e < 0.0 && inside) {
    // burnt through: the wall behind, wobbling in the heat above the flames
    vec2 haze = (vec2(n(px / 9.0 + uTime * 2.0), n(px / 9.0 - uTime * 2.0)) - 0.5) * 6.0 * flame;
    col = texture(uBehind, (px + haze) / uSize).rgb * (1.0 - shade);
    a = 1.0;
    float g = smoothstep(-8.0, 0.0, e);
    col += vec3(1.0, 0.42, 0.08) * g * g * n(px / 3.5 + uTime * 3.0) * 0.9;
  } else if (inside) {
    // scorch, browning ahead of the fire
    float sc = (1.0 - smoothstep(16.0, 140.0, e)) * 0.34 * (0.65 + 0.7 * n(px / 46.0));
    col = vec3(0.40, 0.24, 0.08) * sc;
    a = sc;
    // char, curling back from the edge
    float reach = 24.0 + 18.0 * n(px / 20.0);
    float ch = 1.0 - smoothstep(2.0, reach, e);
    ch *= 0.86 + 0.14 * n(px / 1.6);
    vec3 chC = mix(vec3(0.02, 0.015, 0.01), vec3(0.20, 0.11, 0.045), smoothstep(5.0, reach, e));
    col = chC * ch + col * (1.0 - ch);
    a = ch + a * (1.0 - ch);
    // embers still alive in the char
    float sp = smoothstep(0.72, 0.97, n(px / 2.8 + vec2(0.0, uTime * 0.5))) * (1.0 - smoothstep(1.0, 18.0, e));
    col += vec3(1.0, 0.38, 0.06) * sp * (0.6 + 0.4 * sin(uTime * 11.0 + px.x * 0.37 + px.y * 0.21));
    // firelight on the paper ahead
    col += vec3(1.0, 0.52, 0.16) * exp(-e / 90.0) * 0.16;
  } else {
    // around the sheet: just its shadow
    a = shade;
  }

  // the burning line, and the hot glow around it
  if (inside) {
    float line = exp(-abs(e) / 1.6);
    float fl = 0.6 + 0.55 * n(px / 8.0 + vec2(uTime * 2.0, -uTime * 6.0));
    col += mix(vec3(1.0, 0.30, 0.03), vec3(1.0, 0.9, 0.62), line * line) * line * fl * 1.8;
    col += vec3(1.0, 0.42, 0.1) * exp(-abs(e) / 26.0) * 0.28 * fl;
  }

  // flames: deep red tips, orange body, a white-hot core at the root
  vec3 flC = mix(vec3(0.75, 0.12, 0.02), vec3(1.0, 0.55, 0.1), smoothstep(0.15, 0.6, heat));
  flC = mix(flC, vec3(1.0, 0.93, 0.7), core);
  col += flC * flame * 1.1;
  a = max(a, flame * 0.45);

  o = vec4(col, a);
}`;

export type BurnGL = {
  frame: (front: number, time: number) => void;
  clear: () => void;
  destroy: () => void;
};

export function createBurnGL(
  canvas: HTMLCanvasElement,
  size: { w: number; h: number; dpr: number; margin: number },
  field: { data: Float32Array; cols: number; rows: number; cell: number },
  behind: HTMLCanvasElement,
): BurnGL | null {
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: true, antialias: false });
  if (!gl) return null;
  canvas.width = Math.round((size.w + size.margin * 2) * size.dpr);
  canvas.height = Math.round((size.h + size.margin * 2) * size.dpr);

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  // the field: float, linearly filtered (R32F where the GPU can filter it, else R16F)
  const linear32 = !!gl.getExtension("OES_texture_float_linear");
  const tf = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tf);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, linear32 ? gl.R32F : gl.R16F, field.cols, field.rows, 0, gl.RED, gl.FLOAT, field.data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const tb = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, tb);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, behind);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const u = (name: string) => gl.getUniformLocation(prog, name);
  gl.uniform1i(u("uField"), 0);
  gl.uniform1i(u("uBehind"), 1);
  gl.uniform2f(u("uSize"), size.w, size.h);
  gl.uniform2f(u("uGrid"), field.cols, field.rows);
  gl.uniform1f(u("uCell"), field.cell);
  gl.uniform1f(u("uMargin"), size.margin);
  const uFront = u("uFront"), uTime = u("uTime");
  gl.viewport(0, 0, canvas.width, canvas.height);

  return {
    frame(front, time) {
      gl.uniform1f(uFront, front);
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    clear() {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    destroy() {
      gl.deleteTexture(tf);
      gl.deleteTexture(tb);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
