import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { renderPage, cloneCanvas } from '../lib/pdf.js'
import { spreadPages, clampZoom } from '../lib/paging.js'

const FLIP_MS = 540
const PAD_DESKTOP = 34
const PAD_MOBILE = 12

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** 한 쪽을 캔버스로 그려 넣는 칸 */
function PageSlot({ pdf, docId, pageNum, width, height, side }) {
  const hostRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!pdf || !pageNum || !width) return
    let alive = true
    setReady(false)
    renderPage(pdf, docId, pageNum, width)
      .then((canvas) => {
        if (!alive || !hostRef.current) return
        hostRef.current.replaceChildren(canvas)
        setReady(true)
      })
      .catch(() => {
        if (alive) setReady(true)
      })
    return () => {
      alive = false
    }
  }, [pdf, docId, pageNum, width])

  if (!pageNum) {
    return <div className="leafslot empty" style={{ width, height }} aria-hidden="true" />
  }

  return (
    <div
      className={`leafslot ${side}`}
      style={{ width, height }}
      role="img"
      aria-label={`${pageNum}쪽`}
    >
      <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
      {!ready && <div className="page-skeleton" />}
      <span className="page-no-badge">{pageNum}</span>
    </div>
  )
}

export default function BookStage({
  pdf,
  docId,
  numPages,
  aspect,
  page,
  spread,
  zoom,
  setZoom,
  flipEnabled,
  onNext,
  onPrev,
}) {
  const viewportRef = useRef(null)
  const [vp, setVp] = useState({ w: 0, h: 0 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [liveScale, setLiveScale] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [flip, setFlip] = useState(null)

  // ── 크기 측정 ─────────────────────────
  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setVp({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pad = vp.w < 760 ? PAD_MOBILE : PAD_DESKTOP
  const slots = spread ? spreadPages(page, numPages) : [null, page]
  const visible = spread ? slots : [page]

  // 한 쪽의 기본 폭(화면에 꽉 맞춘 크기)
  let baseW = 0
  if (vp.w && vp.h && aspect) {
    const availW = Math.max(80, vp.w - pad * 2)
    const availH = Math.max(80, vp.h - pad * 2)
    const byWidth = spread ? availW / 2 : availW
    const byHeight = availH * aspect
    baseW = Math.max(60, Math.min(byWidth, byHeight))
  }
  const pageW = Math.round(baseW * zoom)
  const pageH = Math.round(pageW / (aspect || 0.75))

  // 확대가 풀리면 위치도 가운데로 되돌린다
  useEffect(() => {
    if (zoom === 1) setPan({ x: 0, y: 0 })
  }, [zoom])

  const clampPan = useCallback(
    (p, scale = 1) => {
      const contentW = (spread ? 2 : 1) * pageW * scale
      const contentH = pageH * scale
      const maxX = Math.max(0, (contentW - vp.w) / 2 + pad)
      const maxY = Math.max(0, (contentH - vp.h) / 2 + pad)
      return {
        x: Math.min(maxX, Math.max(-maxX, p.x)),
        y: Math.min(maxY, Math.max(-maxY, p.y)),
      }
    },
    [spread, pageW, pageH, vp.w, vp.h, pad]
  )

  useEffect(() => {
    setPan((p) => clampPan(p))
  }, [clampPan])

  // ── 책장 넘김 ─────────────────────────
  const prevPageRef = useRef(page)
  useEffect(() => {
    const from = prevPageRef.current
    prevPageRef.current = page
    if (from === page || !pdf || !pageW) return
    if (!flipEnabled || prefersReducedMotion() || zoom !== 1) return
    // 표지(1쪽)는 혼자 가운데 놓이므로 칸 수가 달라진다. 이 전환만 효과를 건너뛴다.
    if (spread && (from <= 1 || page <= 1)) return

    const dir = page > from ? 'fwd' : 'back'
    let frontNum = null
    let backNum = null
    let fromHadLeft = true

    if (spread) {
      const [fromLeft, fromRight] = spreadPages(from, numPages)
      const [toLeft, toRight] = spreadPages(page, numPages)
      if (dir === 'fwd') {
        frontNum = fromRight
        backNum = toLeft
      } else {
        frontNum = fromLeft
        backNum = toRight
      }
      // 표지(1쪽)처럼 왼쪽 칸이 없는 펼침에서는 넘기는 장이 x=0에서 시작한다
      fromHadLeft = !!fromLeft
    } else {
      frontNum = from
      backNum = null
    }
    if (!frontNum) return

    let alive = true
    Promise.all([
      renderPage(pdf, docId, frontNum, pageW),
      backNum ? renderPage(pdf, docId, backNum, pageW) : Promise.resolve(null),
    ])
      .then(([f, b]) => {
        if (!alive) return
        setFlip({
          dir,
          front: cloneCanvas(f),
          back: b ? cloneCanvas(b) : null,
          w: pageW,
          h: pageH,
          spread,
          fromHadLeft,
        })
      })
      .catch(() => {})

    return () => {
      alive = false
    }
    // page가 바뀔 때만 돈다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  useEffect(() => {
    if (!flip) return
    const t = setTimeout(() => setFlip(null), FLIP_MS + 30)
    return () => clearTimeout(t)
  }, [flip])

  // ── 휠 확대 ─────────────────────────
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      const factor = e.deltaY > 0 ? 1 / 1.14 : 1.14
      setZoom((z) => clampZoom(z * factor))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [setZoom])

  // ── 포인터: 드래그 이동 / 스와이프 / 핀치 줌 ─────────────────────────
  const pointers = useRef(new Map())
  const gesture = useRef(null)

  const onPointerDown = (e) => {
    const el = viewportRef.current
    if (!el) return
    el.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 1) {
      gesture.current = {
        type: zoom > 1 ? 'pan' : 'swipe',
        startX: e.clientX,
        startY: e.clientY,
        startPan: { ...pan },
        moved: false,
      }
      if (zoom > 1) setDragging(true)
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = {
        type: 'pinch',
        startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        startPan: { ...pan },
      }
      setDragging(false)
    }
  }

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return

    if (g.type === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1
      const ratio = dist / g.startDist
      setLiveScale(Math.min(3, Math.max(0.4, ratio)))
      return
    }

    if (g.type === 'pan') {
      const next = {
        x: g.startPan.x + (e.clientX - g.startX),
        y: g.startPan.y + (e.clientY - g.startY),
      }
      setPan(clampPan(next))
      g.moved = true
      return
    }

    if (g.type === 'swipe') {
      if (Math.abs(e.clientX - g.startX) > 8) g.moved = true
    }
  }

  const endGesture = (e) => {
    pointers.current.delete(e.pointerId)
    const g = gesture.current

    if (g?.type === 'pinch' && pointers.current.size < 2) {
      setZoom((z) => clampZoom(z * liveScale))
      setLiveScale(1)
      gesture.current = null
      return
    }

    if (g?.type === 'swipe') {
      const dx = e.clientX - g.startX
      const dy = e.clientY - g.startY
      if (Math.abs(dx) > 55 && Math.abs(dy) < 70) {
        if (dx < 0) onNext()
        else onPrev()
      }
    }

    if (pointers.current.size === 0) {
      gesture.current = null
      setDragging(false)
    }
  }

  const onDoubleClick = () => {
    setZoom((z) => (z > 1.05 ? 1 : 2))
  }

  // 펼침 보기에서 한 쪽만 있는 펼침(표지·마지막 홑쪽)은 가운데로 당겨 놓는다
  const soloOffset =
    spread && (!slots[0] || !slots[1]) ? (slots[0] ? pageW / 2 : -pageW / 2) : 0

  const contentTransform = `translate(-50%, -50%) translate(${pan.x + soloOffset}px, ${pan.y}px) scale(${liveScale})`

  return (
    <div
      ref={viewportRef}
      className={`stage ${zoom > 1 ? (dragging ? 'grabbing' : 'grabbable') : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onDoubleClick={onDoubleClick}
    >
      {pageW > 0 && (
        <div className="stage-content" style={{ transform: contentTransform }}>
          {spread ? (
            <>
              <PageSlot
                pdf={pdf}
                docId={docId}
                pageNum={slots[0]}
                width={pageW}
                height={pageH}
                side="left"
              />
              <PageSlot
                pdf={pdf}
                docId={docId}
                pageNum={slots[1]}
                width={pageW}
                height={pageH}
                side="right"
              />
              {slots[0] && slots[1] && <div className="spine-shadow" />}
            </>
          ) : (
            <PageSlot
              pdf={pdf}
              docId={docId}
              pageNum={page}
              width={pageW}
              height={pageH}
              side="solo"
            />
          )}

          {flip && (
            <Leaf
              flip={flip}
              left={flip.spread && flip.dir === 'fwd' && flip.fromHadLeft ? flip.w : 0}
            />
          )}
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {visible.filter(Boolean).join(', ')}쪽 / 전체 {numPages}쪽
      </span>
    </div>
  )
}

function Leaf({ flip, left }) {
  const frontRef = useRef(null)
  const backRef = useRef(null)

  useLayoutEffect(() => {
    if (frontRef.current && flip.front) frontRef.current.replaceChildren(flip.front)
    if (backRef.current && flip.back) backRef.current.replaceChildren(flip.back)
  }, [flip])

  return (
    <div
      className={`leaf ${flip.dir === 'fwd' ? 'fwd' : 'back'}`}
      style={{
        left,
        width: flip.w,
        height: flip.h,
        '--flip-ms': `${FLIP_MS}ms`,
      }}
      aria-hidden="true"
    >
      <div className="leaf-face front" ref={frontRef} />
      <div className="leaf-face back" ref={backRef} />
    </div>
  )
}
