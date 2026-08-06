"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { toCanvas } from "html-to-image";
import { useLocation } from "react-router-dom";

export type PeelSide = "left" | "right" | "top" | "bottom";
export type PeelMode = "cursor" | "hover";

export interface PeelOptions {
  side?: PeelSide;
  mode?: PeelMode;
  reveal?: number;
  zone?: number;
  curl?: number;
  bow?: number;
  shade?: number;
  shine?: number;
  shineDistance?: number;
  shineColor?: [number, number, number] | "auto";
  bulge?: number;
  perspective?: number;
  smoothing?: number;
}

const DEFAULTS: Required<PeelOptions> = {
  side: "left",
  mode: "cursor",
  reveal: 250,
  zone: 200,
  curl: 300,
  bow: 75,
  shade: 0.25,
  shine: 1,
  shineDistance: 1200,
  shineColor: "auto",
  bulge: 50,
  perspective: 2000,
  smoothing: 0.3,
};

const SIDE_INDEX: Record<PeelSide, number> = {
  left: 0,
  right: 1,
  top: 2,
  bottom: 3,
};

const SHEET_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aGrid;
uniform vec2 uRes;
uniform float uSide;
uniform float uPeel;
uniform float uReveal;
uniform float uCurl;
uniform float uBow;
uniform float uFocal;
uniform float uZone;
uniform float uBulge;
uniform vec2 uPointer;
out vec2 vUv;
out float vShade;
out vec2 vSide;

const float PI = 3.1415926;

void main () {
  vUv = aGrid;
  vec2 p = aGrid * uRes;
  float crossLen = (uSide < 1.5) ? uRes.y : uRes.x;
  float u; float v;
  if (uSide < 0.5) { u = p.x; v = p.y; }
  else if (uSide < 1.5) { u = uRes.x - p.x; v = p.y; }
  else if (uSide < 2.5) { u = p.y; v = p.x; }
  else { u = uRes.y - p.y; v = p.x; }

  float A = clamp(uPeel, 0.0, 1.0);
  float f = A * uReveal;
  float R = max(uCurl * A, 0.001);
  float c0 = f + R;

  float dvB = (uPointer.y - v) / max(crossLen * 0.28, 1.0);
  float prox = clamp(1.0 - uPointer.x / max(c0 + uZone, 1.0), 0.0, 1.0);
  float c = c0 + uBulge * A * prox * prox * exp(-dvB * dvB);

  float x = u;
  float z = 0.0;
  float sh = 0.0;
  if (A > 0.001 && u < c) {
    float theta = (c - u) / R;
    if (theta <= PI) {
      x = c - R * sin(theta);
      z = R * (1.0 - cos(theta));
    } else {
      x = c + (theta - PI) * R;
      z = 2.0 * R;
    }
    sh = sin(clamp(theta, 0.0, PI));
  }
  z += uBow * A * sin(PI * v / max(crossLen, 1.0)) * clamp(z / max(R, 1.0), 0.0, 1.5);
  z = clamp(z, -uFocal * 0.2, uFocal * 0.45);
  vShade = sh * smoothstep(0.0, 0.08, A);
  vSide = vec2(u, v);

  vec2 q;
  if (uSide < 0.5) q = vec2(x, v);
  else if (uSide < 1.5) q = vec2(uRes.x - x, v);
  else if (uSide < 2.5) q = vec2(v, x);
  else q = vec2(v, uRes.y - x);

  vec2 ndc = (q / uRes) * 2.0 - 1.0;
  ndc.y = -ndc.y;
  float w = (uFocal - z) / uFocal;
  gl_Position = vec4(ndc, -z / uFocal, w);
}`;

const SHEET_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
in float vShade;
in vec2 vSide;
out vec4 outColor;
uniform sampler2D uContent;
uniform float uShade;
uniform float uMaxX;
uniform float uShine;
uniform vec3 uShineColor;
uniform float uCross;
uniform float uSpan;
uniform vec2 uPointer;

void main () {
  vec2 uv = clamp(vUv, vec2(0.001), vec2(uMaxX - 0.001, 0.999));
  vec4 tex = texture(uContent, uv);
  float sh = 1.0 - clamp(uShade, 0.0, 1.0) * 0.7 * pow(max(vShade, 0.0), 1.3);
  float du = max(vSide.x, 0.0);
  float line = exp(-du / 2.5) + exp(-du / 18.0) * 0.25;
  float dv = (vSide.y - uPointer.y) / max(uCross * 0.45, 1.0);
  float prox = clamp(1.0 - uPointer.x / max(uSpan, 1.0), 0.0, 1.0);
  float shine = uShine * line * exp(-dv * dv) * prox * prox;
  vec3 rgb = mix(tex.rgb * sh, uShineColor, clamp(shine, 0.0, 1.0));
  outColor = vec4(rgb * tex.a, tex.a);
}`;

const SEG = 96;

export interface PeelProps extends PeelOptions {
  children: ReactNode;
  under?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Peel({
  children,
  under,
  className,
  style,
  ...options
}: PeelProps) {
  const config = { ...DEFAULTS, ...options };
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const underRef = useRef<HTMLDivElement>(null);

  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const progInfoRef = useRef<any>(null);
  const vaoRef = useRef<WebGLVertexArrayObject | null>(null);
  const texRef = useRef<WebGLTexture | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const location = useLocation();
  
  const peelRef = useRef({ a: 0, target: 0 });
  const FAR = 1e4;
  const pointerRef = useRef({ u: FAR, v: 0, su: FAR, sv: 0 });
  const rafRef = useRef(0);
  const contentMaxXRef = useRef(1);
  const shineRgbRef = useRef<[number, number, number]>([1, 1, 1]);

  useEffect(() => {
    const canvas = outputRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      depth: true,
      antialias: true,
      premultipliedAlpha: true,
    });
    if (!gl) return;
    glRef.current = gl;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const vert = compile(gl.VERTEX_SHADER, SHEET_VERT);
    const frag = compile(gl.FRAGMENT_SHADER, SHEET_FRAG);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);

    const uniforms: Record<string, WebGLUniformLocation> = {};
    const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(prog, i)!;
      uniforms[info.name] = gl.getUniformLocation(prog, info.name)!;
    }
    progInfoRef.current = { program: prog, uniforms };

    const gridVerts = new Float32Array((SEG + 1) * (SEG + 1) * 2);
    for (let y = 0; y <= SEG; y++) {
      for (let x = 0; x <= SEG; x++) {
        const i = (y * (SEG + 1) + x) * 2;
        gridVerts[i] = x / SEG;
        gridVerts[i + 1] = y / SEG;
      }
    }
    const gridIndices = new Uint32Array(SEG * SEG * 6);
    let offset = 0;
    for (let y = 0; y < SEG; y++) {
      for (let x = 0; x < SEG; x++) {
        const a = y * (SEG + 1) + x;
        const b = a + 1;
        const c = a + SEG + 1;
        const d = c + 1;
        gridIndices[offset++] = a;
        gridIndices[offset++] = c;
        gridIndices[offset++] = b;
        gridIndices[offset++] = b;
        gridIndices[offset++] = c;
        gridIndices[offset++] = d;
      }
    }

    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const gb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gb);
    gl.bufferData(gl.ARRAY_BUFFER, gridVerts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, gridIndices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    vaoRef.current = vao;

    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    texRef.current = tex;

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const captureContent = useCallback(() => {
    const content = contentRef.current;
    const gl = glRef.current;
    if (!content || !gl) return;
    
    toCanvas(content, {
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      skipAutoScale: true,
      style: {
        opacity: "1",
        pointerEvents: "auto"
      }
    }).then(canvas => {
      gl.bindTexture(gl.TEXTURE_2D, texRef.current);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      contentMaxXRef.current = Math.min(1, Math.max(0.05, content.clientWidth / Math.max(outputRef.current?.clientWidth || 1, 1)));
      setIsReady(true);
      wake();
    }).catch(err => {
      console.error("html-to-image failed to render canvas:", err);
      // Fallback: if it fails, make sure content is visible
      setIsReady(false);
      if (contentRef.current) {
        contentRef.current.style.opacity = "1";
        contentRef.current.style.pointerEvents = "auto";
      }
    });
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    // Initial capture
    captureContent();

    const ro = new ResizeObserver(() => captureContent());
    if (contentRef.current) ro.observe(contentRef.current);

    // Watch for actual DOM insertions/deletions (like route transitions completing)
    const mo = new MutationObserver((mutations) => {
      const hasStructuralChanges = mutations.some(m => m.type === 'childList' && m.addedNodes.length > 0);
      if (hasStructuralChanges) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          captureContent();
        }, 150);
      }
    });

    if (contentRef.current) {
      mo.observe(contentRef.current, { childList: true, subtree: true });
    }

    return () => {
      ro.disconnect();
      mo.disconnect();
      clearTimeout(timeout);
    };
  }, [captureContent]);

  const wake = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      
      const tau = Math.max(config.smoothing, 1e-4);
      const k = 1 - Math.exp(-dt / tau);
      const kp = 1 - Math.exp(-dt / (tau * 0.45));
      
      const p = pointerRef.current;
      p.su += (p.u - p.su) * kp;
      p.sv += (p.v - p.sv) * kp;

      const peel = peelRef.current;

      peel.a += (peel.target - peel.a) * k;

      const A = peel.a;
      const R = Math.max(config.curl * A, 0.001);
      const c = A * config.reveal + R + Math.max(config.bulge, 0) * A;
      const tailEnd = Math.max(c, 2 * c - Math.PI * R);
      const blocked = A > 0.02 && p.u < tailEnd;
      if (contentRef.current) {
        contentRef.current.style.opacity = blocked || A > 0.01 ? "0" : "1";
        contentRef.current.style.pointerEvents = blocked ? "none" : "auto";
      }

      if (outputRef.current) {
        outputRef.current.style.visibility = A > 0.01 ? "visible" : "hidden";
      }

      render();

      const settle = 0.5 / Math.max(config.reveal + config.curl, 1);
      if (
        Math.abs(peel.target - peel.a) < settle &&
        Math.abs(p.u - p.su) < 0.5 &&
        Math.abs(p.v - p.sv) < 0.5
      ) {
        peel.a = peel.target;
        p.su = p.u;
        p.sv = p.v;
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);
  }, [config]);

  const render = () => {
    const gl = glRef.current;
    const prog = progInfoRef.current;
    const output = outputRef.current;
    if (!gl || !prog || !output) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(output.clientWidth * dpr));
    const h = Math.max(1, Math.round(output.clientHeight * dpr));
    if (output.width !== w || output.height !== h) {
      output.width = w;
      output.height = h;
    }

    const side = SIDE_INDEX[config.side] ?? 0;
    const peel = peelRef.current;
    const p = pointerRef.current;

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, output.width, output.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    gl.useProgram(prog.program);
    gl.bindVertexArray(vaoRef.current);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texRef.current);
    
    gl.uniform1i(prog.uniforms.uContent, 0);
    gl.uniform2f(prog.uniforms.uRes, output.clientWidth, output.clientHeight);
    gl.uniform1f(prog.uniforms.uSide, side);
    gl.uniform1f(prog.uniforms.uPeel, peel.a);
    gl.uniform1f(prog.uniforms.uReveal, Math.max(config.reveal, 0));
    gl.uniform1f(prog.uniforms.uCurl, Math.max(config.curl, 1));
    gl.uniform1f(prog.uniforms.uBow, config.bow);
    gl.uniform1f(prog.uniforms.uFocal, Math.max(config.perspective, 200));
    gl.uniform1f(prog.uniforms.uShade, config.shade);
    gl.uniform1f(prog.uniforms.uZone, Math.max(config.zone, 1));
    gl.uniform1f(prog.uniforms.uBulge, Math.max(config.bulge, 0));
    gl.uniform1f(prog.uniforms.uShine, Math.max(config.shine, 0));
    gl.uniform3f(prog.uniforms.uShineColor, 1, 1, 1);
    gl.uniform1f(prog.uniforms.uCross, side < 1.5 ? output.clientHeight : output.clientWidth);
    gl.uniform1f(prog.uniforms.uSpan, config.shineDistance > 0 ? config.shineDistance : (side < 1.5 ? output.clientWidth : output.clientHeight));
    gl.uniform2f(prog.uniforms.uPointer, p.su, p.sv);
    gl.uniform1f(prog.uniforms.uMaxX, contentMaxXRef.current);
    
    gl.drawElements(gl.TRIANGLES, SEG * SEG * 6, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);
    gl.disable(gl.DEPTH_TEST);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const p = pointerRef.current;
      const peel = peelRef.current;

      p.targetU = x;
      p.targetV = y;
      
      const isOpen = peel.target === 1;
      const openLine = 100;
      const closeLine = 150;

      if (!isOpen && x < openLine) {
        peel.target = 1; // Open peel
      } else if (isOpen && x > closeLine) {
        peel.target = 0; // Close peel
      }
      
      p.u = config.side === "right" ? rect.width - x : config.side === "top" ? y : config.side === "bottom" ? rect.height - y : x;
      p.v = config.side === "top" || config.side === "bottom" ? x : y;
      wake();
    };
    const onLeave = () => {
      const p = pointerRef.current;
      const peel = peelRef.current;
      peel.target = 0;
      p.u = FAR;
      wake();
    };
    const p = pointerRef.current;
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [config.side, wake]);

  return (
    <div ref={containerRef} className={className} style={{ position: "relative", ...style }}>
      {/* ── Under layer ── */}
      <div
        ref={underRef}
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          visibility: isReady ? "visible" : "hidden",
        }}
      >
        {under}
      </div>
      
      {/* ── Content (hidden visually when peeled, but captures events) ── */}
      <div
        ref={contentRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflowY: "auto",
          overflowX: "hidden",
          pointerEvents: "auto",
        }}
      >
        {children}
      </div>

      {/* ── WebGL Peel Output ── */}
      <canvas
        ref={outputRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          display: isReady ? "block" : "none"
        }}
      />
    </div>
  );
}

export default Peel;
