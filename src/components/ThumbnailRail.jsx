import { useEffect, useRef, useState } from 'react'
import { renderPage } from '../lib/pdf.js'

const THUMB_W = 84

function Thumb({ pdf, docId, pageNum, current, onPick }) {
  const hostRef = useRef(null)
  const btnRef = useRef(null)
  const [seen, setSeen] = useState(false)

  // 화면에 들어온 썸네일만 그린다
  useEffect(() => {
    const el = btnRef.current
    if (!el || seen) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { root: el.parentElement, rootMargin: '220px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen])

  useEffect(() => {
    if (!seen || !pdf) return
    let alive = true
    renderPage(pdf, docId, pageNum, THUMB_W, { thumb: true })
      .then((c) => {
        if (alive && hostRef.current) hostRef.current.replaceChildren(c)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [seen, pdf, docId, pageNum])

  // 현재 쪽이면 가로 스크롤을 따라오게 한다
  useEffect(() => {
    if (current && btnRef.current) {
      btnRef.current.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    }
  }, [current])

  return (
    <button
      ref={btnRef}
      className="thumb"
      aria-current={current}
      aria-label={`${pageNum}쪽으로 이동`}
      onClick={() => onPick(pageNum)}
    >
      <div ref={hostRef} className="ph" />
      <span className="n">{pageNum}</span>
    </button>
  )
}

export default function ThumbnailRail({ pdf, docId, numPages, page, onPick }) {
  const pages = Array.from({ length: numPages }, (_, i) => i + 1)
  return (
    <div className="thumbs" role="list" aria-label="페이지 목록">
      {pages.map((n) => (
        <Thumb key={n} pdf={pdf} docId={docId} pageNum={n} current={n === page} onPick={onPick} />
      ))}
    </div>
  )
}
