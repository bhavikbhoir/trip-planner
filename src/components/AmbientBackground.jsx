import { useEffect, useRef } from 'react'

// Fixed canvas behind the whole app: glowing "route arcs" between nodes with
// traveling light pulses, like a live flight tracker. Freezes on a static
// frame if the OS has reduced-motion set.
const NODES = [
  { x: 0.06, y: 0.78 }, { x: 0.20, y: 0.28 }, { x: 0.40, y: 0.58 },
  { x: 0.58, y: 0.18 }, { x: 0.76, y: 0.64 }, { x: 0.93, y: 0.30 },
]
const ARC_PAIRS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [0, 4]]

// A small aircraft silhouette (nose at the top) traveling each arc in place
// of a plain dot — fuselage, swept wings, tail fins, same shape family as a
// standard flight-tracker icon. Drawn as a canvas path, not an image asset.
const PLANE_PATH = [
  [0, -7], [1.3, -3], [6, 0.5], [6, 2], [1.3, 0.8], [0.9, 4.5], [2.6, 6], [2.6, 7],
  [0, 6], [-2.6, 7], [-2.6, 6], [-0.9, 4.5], [-1.3, 0.8], [-6, 2], [-6, 0.5], [-1.3, -3],
]

function hexToRgb(hex) {
  const h = hex.replace('#', '').trim()
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function pointAt(p0, p1, cp, t, W, H) {
  const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * cp.x + t * t * p1.x
  const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * cp.y + t * t * p1.y
  return { x: x * W, y: y * H }
}

export default function AmbientBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let W, H
    let raf

    function resize() {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    window.addEventListener('resize', resize)
    resize()

    const arcs = ARC_PAIRS.map(([a, b], i) => ({
      a, b, t: i * 0.15, speed: 0.0016 + (i % 3) * 0.0004,
    }))

    function dataColor() {
      return getComputedStyle(document.documentElement).getPropertyValue('--data').trim()
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)
      const [r, g, b] = hexToRgb(dataColor())
      ctx.lineWidth = 1

      arcs.forEach((arc) => {
        const p0 = NODES[arc.a]
        const p1 = NODES[arc.b]
        const cp = { x: (p0.x + p1.x) / 2, y: Math.min(p0.y, p1.y) - 0.14 }

        ctx.beginPath()
        ctx.strokeStyle = `rgba(${r},${g},${b},0.16)`
        for (let s = 0; s <= 24; s++) {
          const pt = pointAt(p0, p1, cp, s / 24, W, H)
          if (s === 0) ctx.moveTo(pt.x, pt.y)
          else ctx.lineTo(pt.x, pt.y)
        }
        ctx.stroke()

        if (!reduceMotion) {
          const pt = pointAt(p0, p1, cp, arc.t, W, H)
          const ptNext = pointAt(p0, p1, cp, Math.min(arc.t + 0.01, 1), W, H)
          const heading = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x)

          ctx.save()
          ctx.translate(pt.x, pt.y)
          ctx.rotate(heading + Math.PI / 2)
          ctx.scale(0.9, 0.9)
          ctx.beginPath()
          PLANE_PATH.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)))
          ctx.closePath()
          ctx.fillStyle = `rgba(${r},${g},${b},0.9)`
          ctx.shadowColor = `rgba(${r},${g},${b},0.8)`
          ctx.shadowBlur = 8
          ctx.fill()
          ctx.restore()

          arc.t += arc.speed
          if (arc.t > 1) arc.t = 0
        }
      })

      NODES.forEach((n) => {
        ctx.beginPath()
        ctx.fillStyle = `rgba(${r},${g},${b},0.55)`
        ctx.arc(n.x * W, n.y * H, 2.4, 0, Math.PI * 2)
        ctx.fill()
      })

      if (!reduceMotion) raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return <canvas id="ambient-bg-canvas" ref={canvasRef} />
}
