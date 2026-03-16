"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const vertexShaderSource = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const fragmentShaderSource = `
precision highp float;

uniform vec2 iResolution;
uniform float iTime;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = (gl_FragCoord.xy / iResolution.xy) * 2.0 - 1.0;
  uv.x *= iResolution.x / iResolution.y;

  float t = iTime * 0.25;
  float n = noise(uv * 2.0 + t);
  float d = length(uv);

  float breathing = 0.5 + 0.5 * sin(iTime * 1.5);
  float pulseRadius = 0.075 * sin(iTime * 1.5);
  float intensity = exp(-10.0 * pow(d - 0.3 * n - pulseRadius, 2.0)) * (0.52 + 0.95 * breathing);
  float glow = exp(-3.0 * d) * (1.05 + 0.95 * breathing);
  vec3 color = vec3(0.16 + 0.62 * n, 0.44 + 0.42 * n, 1.0) * (intensity + glow);
  color += pow(color, vec3(2.0)) * 0.26;
  color = color / (1.0 + color * 0.28);

  float energy = intensity + glow * 0.52;
  float alpha = smoothstep(0.04, 1.05, energy);
  alpha *= smoothstep(1.1, 0.16, d);
  alpha = pow(clamp(alpha, 0.0, 1.0), 1.08);

  gl_FragColor = vec4(color, alpha);
}
`

export interface EvaLauncherOrbProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  assistantName?: string
}

const LABEL_SEQUENCE = [
  {
    text: "EVA",
    durationMs: 30_000,
    className: "text-[0.55rem] tracking-[0.42em]",
  },
  {
    text: "your",
    durationMs: 600,
    className: "text-[0.47rem] tracking-[0.14em]",
  },
  {
    text: "Everything",
    durationMs: 800,
    className: "text-[0.34rem] tracking-[0.03em]",
  },
  {
    text: "Assistant",
    durationMs: 800,
    className: "text-[0.38rem] tracking-[0.07em]",
  },
] as const

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader
  }

  console.error(gl.getShaderInfoLog(shader))
  gl.deleteShader(shader)
  return null
}

export const EvaLauncherOrb = React.forwardRef<
  HTMLButtonElement,
  EvaLauncherOrbProps
>(function EvaLauncherOrb(
  { assistantName = "Eva", className, type = "button", ...props },
  ref
) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [showFallback, setShowFallback] = React.useState(false)
  const [labelIndex, setLabelIndex] = React.useState(0)

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLabelIndex((current) => (current + 1) % LABEL_SEQUENCE.length)
    }, LABEL_SEQUENCE[labelIndex].durationMs)

    return () => window.clearTimeout(timeoutId)
  }, [labelIndex])

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    })

    if (!gl) {
      setShowFallback(true)
      return
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

    if (!vertexShader || !fragmentShader) {
      setShowFallback(true)
      return
    }

    const program = gl.createProgram()
    const positionBuffer = gl.createBuffer()
    if (!program || !positionBuffer) {
      setShowFallback(true)
      return
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program))
      setShowFallback(true)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      gl.deleteBuffer(positionBuffer)
      return
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1,
      ]),
      gl.STATIC_DRAW
    )

    const positionLoc = gl.getAttribLocation(program, "a_position")
    const resolutionLoc = gl.getUniformLocation(program, "iResolution")
    const timeLoc = gl.getUniformLocation(program, "iTime")

    gl.useProgram(program)
    gl.enableVertexAttribArray(positionLoc)
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0)

    let animationFrame = 0

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const dpr = Math.min((window.devicePixelRatio || 1) * 2, 4)
      const width = Math.max(1, Math.round(bounds.width * dpr))
      const height = Math.max(1, Math.round(bounds.height * dpr))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    }

    const render = (time: number) => {
      resize()

      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)

      if (resolutionLoc) {
        gl.uniform2f(resolutionLoc, canvas.width, canvas.height)
      }
      if (timeLoc) {
        gl.uniform1f(timeLoc, time * 0.001)
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationFrame = window.requestAnimationFrame(render)
    }

    const resizeObserver = new ResizeObserver(() => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(render)
    })

    resizeObserver.observe(canvas)

    animationFrame = window.requestAnimationFrame(render)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()

      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      gl.deleteBuffer(positionBuffer)
    }
  }, [])

  const activeLabel = LABEL_SEQUENCE[labelIndex]

  return (
    <button
      ref={ref}
      type={type}
      aria-label={`Open ${assistantName} chat`}
      className={cn(
        "group relative isolate flex size-[5rem] items-center justify-center rounded-full bg-transparent p-0 text-white transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/45 focus-visible:ring-offset-0 active:scale-[0.985]",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="eva-halo absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.28)_0%,rgba(59,130,246,0.18)_28%,rgba(37,99,235,0.08)_50%,transparent_76%)] opacity-95 blur-2xl transition-all duration-300 group-hover:scale-[1.06] group-hover:opacity-100"
      />

      <span
        aria-hidden
        className="eva-halo-secondary absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(165,243,252,0.24)_0%,rgba(96,165,250,0.16)_34%,transparent_72%)] opacity-90 blur-xl transition-all duration-300 group-hover:opacity-95"
      />

      <span
        aria-hidden
        className="absolute inset-0 rounded-full opacity-90"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.16) 0%, rgba(191,219,254,0.08) 16%, rgba(255,255,255,0.0) 36%)",
        }}
      />

      <span
        aria-hidden
        className="eva-core relative z-10 block size-[4.45rem]"
      >
        <span
          className="absolute inset-0 rounded-full"
          style={{
            WebkitMaskImage:
              "radial-gradient(circle at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0.98) 26%, rgba(0,0,0,0.86) 50%, rgba(0,0,0,0.44) 70%, rgba(0,0,0,0.12) 82%, transparent 96%)",
            maskImage:
              "radial-gradient(circle at center, rgba(0,0,0,1) 0%, rgba(0,0,0,0.98) 26%, rgba(0,0,0,0.86) 50%, rgba(0,0,0,0.44) 70%, rgba(0,0,0,0.12) 82%, transparent 96%)",
          }}
        >
          {showFallback ? (
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(165,243,252,0.94)_0%,rgba(125,211,252,0.72)_22%,rgba(59,130,246,0.34)_42%,transparent_82%)] blur-[4px]" />
          ) : (
            <canvas
              ref={canvasRef}
              className="block size-full"
              style={{ filter: "blur(2px) saturate(1.12) brightness(1.04)" }}
            />
          )}
        </span>

        <span className="absolute inset-[16%] rounded-full bg-[radial-gradient(circle,rgba(147,197,253,0.24)_0%,rgba(96,165,250,0.1)_42%,transparent_78%)] blur-md" />
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_38%_24%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_20%,transparent_34%)]" />
      </span>

      <span
        aria-hidden
        className={cn(
          "absolute bottom-[1.06rem] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap font-medium text-white transition-[font-size,letter-spacing] duration-200",
          activeLabel.className
        )}
        style={{ mixBlendMode: "difference" }}
      >
        {activeLabel.text}
      </span>

      <style jsx>{`
        @keyframes evaLauncherBreathe {
          0%, 100% {
            transform: scale(0.96);
            opacity: 0.88;
          }
          50% {
            transform: scale(1.04);
            opacity: 1;
          }
        }

        @keyframes evaLauncherGlow {
          0%, 100% {
            transform: scale(0.92);
            opacity: 0.72;
          }
          50% {
            transform: scale(1.12);
            opacity: 1;
          }
        }

        .eva-core {
          animation: evaLauncherBreathe 3.4s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .eva-halo {
          animation: evaLauncherGlow 3.4s ease-in-out infinite;
          will-change: transform, opacity;
        }

        .eva-halo-secondary {
          animation: evaLauncherGlow 3.4s ease-in-out infinite reverse;
          will-change: transform, opacity;
        }
      `}</style>
    </button>
  )
})
