import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BOOKS, getBook } from '../data/books.js'
import { ACTIVITIES } from '../data/scaffolds.js'
import { loadBook, getAspect, renderPage, describeError } from '../lib/pdf.js'
import {
  useStore,
  setPref,
  setLastPage,
  toggleBookmark,
  setMemo,
  getMemo,
} from '../lib/storage.js'
import {
  nextPage as nextOf,
  prevPage as prevOf,
  canGoNext,
  canGoPrev,
  clampZoom,
  spreadPages,
} from '../lib/paging.js'
import BookStage from './BookStage.jsx'
import ThumbnailRail from './ThumbnailRail.jsx'
import ThinkingPanel from './ThinkingPanel.jsx'
import ClassQuestion from './ClassQuestion.jsx'
import {
  IconHome,
  IconLeft,
  IconRight,
  IconPlus,
  IconMinus,
  IconFit,
  IconFullscreen,
  IconGrid,
  IconSpread,
  IconSingle,
  IconBookmark,
  IconBulb,
  IconPresent,
  IconClose,
} from './Icons.jsx'

function useMedia(query) {
  const [match, setMatch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = (e) => setMatch(e.matches)
    mq.addEventListener('change', fn)
    setMatch(mq.matches)
    return () => mq.removeEventListener('change', fn)
  }, [query])
  return match
}

export default function Reader() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const book = getBook(bookId)
  const store = useStore()

  const isNarrow = useMedia('(max-width: 900px)')
  const rootRef = useRef(null)

  const [pdf, setPdf] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [aspect, setAspect] = useState(0.75)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [classMode, setClassMode] = useState(false)
  const [showQuestion, setShowQuestion] = useState(false)
  const [isFull, setIsFull] = useState(false)

  const prefs = store.prefs
  const spread = !isNarrow && prefs.spread
  const panelOpen = prefs.panelOpen
  const thumbsOpen = prefs.thumbsOpen
  const activityId = prefs.activity
  const bookmarks = (book && store.bookmarks[book.id]) || []

  // ── 사전 불러오기 ─────────────────────────
  useEffect(() => {
    if (!book) {
      navigate('/', { replace: true })
      return
    }
    let alive = true
    setLoading(true)
    setError(null)
    setPdf(null)
    setNumPages(0)
    setZoom(1)

    loadBook(book.file)
      .then(async (doc) => {
        if (!alive) return
        const a = await getAspect(doc, 1)
        if (!alive) return
        setPdf(doc)
        setNumPages(doc.numPages)
        setAspect(a)
        setLoading(false)
        if (import.meta.env.DEV && doc.numPages !== book.expectedPages) {
          console.warn(
            `[말모이] ${book.title}: 예상 ${book.expectedPages}쪽 / 실제 ${doc.numPages}쪽`
          )
        }
      })
      .catch((err) => {
        if (!alive) return
        console.error(err)
        setError(describeError(err))
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [book, navigate])

  // ── 마지막으로 읽은 위치 복원 ─────────────────────────
  const restoredFor = useRef(null)
  useEffect(() => {
    if (!book || !numPages) return
    if (restoredFor.current === book.id) return
    restoredFor.current = book.id
    const saved = store.lastPage[book.id]
    setPage(saved && saved >= 1 && saved <= numPages ? saved : 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, numPages])

  // ── 위치 저장 ─────────────────────────
  useEffect(() => {
    if (!book || !numPages) return
    setLastPage(book.id, page)
  }, [book, page, numPages])

  // ── 사전을 바꾸면 그 사전의 탐구 질문을 기본으로 ─────────────────────────
  const lastBookRef = useRef(null)
  useEffect(() => {
    if (!book) return
    if (lastBookRef.current === book.id) return
    lastBookRef.current = book.id
    setPref('activity', book.scaffoldId)
  }, [book])

  // ── 이웃 페이지 미리 그려 두기 ─────────────────────────
  useEffect(() => {
    if (!pdf || !book || !numPages) return
    const t = setTimeout(() => {
      const around = new Set()
      const [l, r] = spread ? spreadPages(page, numPages) : [null, page]
      for (const base of [l, r]) {
        if (!base) continue
        for (const d of [-2, -1, 1, 2]) {
          const n = base + d
          if (n >= 1 && n <= numPages) around.add(n)
        }
      }
      around.forEach((n) => {
        renderPage(pdf, book.file, n, 520).catch(() => {})
      })
    }, 320)
    return () => clearTimeout(t)
  }, [pdf, book, page, numPages, spread])

  // ── 페이지 이동 ─────────────────────────
  const goNext = useCallback(() => {
    setPage((p) => nextOf(p, numPages, spread))
  }, [numPages, spread])

  const goPrev = useCallback(() => {
    setPage((p) => prevOf(p, numPages, spread))
  }, [numPages, spread])

  const goTo = useCallback(
    (n) => setPage(Math.min(Math.max(1, n), numPages || 1)),
    [numPages]
  )

  // ── 전체 화면 ─────────────────────────
  const toggleFull = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen?.()
    else el.requestFullscreen?.().catch(() => {})
  }, [])

  useEffect(() => {
    const fn = () => setIsFull(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', fn)
    return () => document.removeEventListener('fullscreenchange', fn)
  }, [])

  // ── 키보드 ─────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault()
          goNext()
          break
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          goPrev()
          break
        case 'Home':
          e.preventDefault()
          goTo(1)
          break
        case 'End':
          e.preventDefault()
          goTo(numPages)
          break
        case '+':
        case '=':
          e.preventDefault()
          setZoom((z) => clampZoom(z * 1.25))
          break
        case '-':
        case '_':
          e.preventDefault()
          setZoom((z) => clampZoom(z / 1.25))
          break
        case '0':
          e.preventDefault()
          setZoom(1)
          break
        case 'f':
        case 'F':
          toggleFull()
          break
        case 'b':
        case 'B':
          if (book) toggleBookmark(book.id, page)
          break
        case 'Escape':
          if (showQuestion) setShowQuestion(false)
          else if (classMode) setClassMode(false)
          else if (panelOpen) setPref('panelOpen', false)
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, goTo, numPages, toggleFull, book, page, showQuestion, classMode, panelOpen])

  const activity = useMemo(
    () => ACTIVITIES.find((a) => a.id === activityId) || ACTIVITIES[0],
    [activityId]
  )

  if (!book) return null

  const atLast = !canGoNext(page, numPages, spread)
  const memo = getMemo(store, book.id, page)
  const isBookmarked = bookmarks.includes(page)

  return (
    <div
      ref={rootRef}
      className={`reader ${classMode ? 'class-mode' : ''}`}
      style={{ '--book-accent': book.accent, '--book-soft': book.accentSoft }}
    >
      {/* ── 수업 모드 바 ───────────────── */}
      {classMode && (
        <div className="cm-bar">
          <span className="cm-title">
            <span className="pill">수업 모드</span>
            {book.title} · 돌멩민국 말모이 프로젝트
          </span>
          <span className="spacer" />
          <button
            type="button"
            className={`btn ${showQuestion ? 'on' : ''}`}
            onClick={() => setShowQuestion((v) => !v)}
          >
            질문 띄우기
          </button>
          <button type="button" className="btn" onClick={toggleFull}>
            {isFull ? '전체 화면 끄기' : '전체 화면'}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setClassMode(false)
              setShowQuestion(false)
            }}
          >
            <IconClose /> 일반 모드
          </button>
        </div>
      )}

      {/* ── 상단 바 ───────────────── */}
      {!classMode && (
        <header className="topbar">
          <Link className="home-link" to="/">
            <IconHome />
            <span className="label">말모이</span>
          </Link>

          <nav className="book-switch" aria-label="사전 바꾸기">
            {BOOKS.map((b) => (
              <button
                key={b.id}
                type="button"
                aria-current={b.id === book.id}
                onClick={() => navigate(`/read/${b.id}`)}
              >
                <span className="dot" style={{ background: b.accent }} aria-hidden="true" />
                {b.shortTitle || b.title}
              </button>
            ))}
          </nav>

          <span className="spacer" />

          <div className="topbar-tools">
            {!isNarrow && (
              <button
                type="button"
                className="btn icon"
                onClick={() => setPref('spread', !prefs.spread)}
                aria-label={spread ? '한 쪽 집중 보기로 전환' : '두 쪽 펼쳐 보기로 전환'}
                title={spread ? '한 쪽 집중 보기' : '두 쪽 펼쳐 보기'}
              >
                {spread ? <IconSingle /> : <IconSpread />}
              </button>
            )}
            <button
              type="button"
              className={`btn icon ${thumbsOpen ? 'on' : ''}`}
              onClick={() => setPref('thumbsOpen', !thumbsOpen)}
              aria-pressed={thumbsOpen}
              aria-label="페이지 목록 보기"
              title="페이지 목록"
            >
              <IconGrid />
            </button>
            <button
              type="button"
              className="btn icon"
              onClick={() => setClassMode(true)}
              aria-label="수업 모드로 전환"
              title="수업 모드"
            >
              <IconPresent />
            </button>
            <button
              type="button"
              className={`btn ${panelOpen ? 'on' : ''}`}
              onClick={() => setPref('panelOpen', !panelOpen)}
              aria-pressed={panelOpen}
            >
              <IconBulb />
              생각 도우미
            </button>
          </div>
        </header>
      )}

      {/* ── 본문 ───────────────── */}
      <div className="reader-body">
        <div className="stage-column">
          <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex' }}>
            {pdf && !error && (
              <BookStage
                pdf={pdf}
                docId={book.file}
                numPages={numPages}
                aspect={aspect}
                page={page}
                spread={spread}
                zoom={zoom}
                setZoom={setZoom}
                flipEnabled={prefs.flip}
                bookmarks={bookmarks}
                onNext={goNext}
                onPrev={goPrev}
              />
            )}

            {(loading || error) && (
              <div className="stage-msg">
                <div className="box">
                  {loading && !error ? (
                    <>
                      <div className="spinner" />
                      <h3>{book.title} 사전을 펼치는 중입니다</h3>
                      <p>잠시만 기다려 주세요.</p>
                    </>
                  ) : (
                    <>
                      <h3>사전을 열 수 없습니다</h3>
                      <p>{error}</p>
                      <p style={{ marginTop: 10 }}>
                        확인할 파일: <code>public/books/{book.file}</code>
                      </p>
                      <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button type="button" className="btn" onClick={() => window.location.reload()}>
                          다시 시도
                        </button>
                        <Link className="btn" to="/">
                          처음으로
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 수업 모드용 큰 넘김 버튼 */}
            {classMode && pdf && (
              <>
                <button
                  type="button"
                  className="cm-nav prev"
                  onClick={goPrev}
                  disabled={!canGoPrev(page, numPages, spread)}
                  aria-label="이전 페이지"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="cm-nav next"
                  onClick={goNext}
                  disabled={atLast}
                  aria-label="다음 페이지"
                >
                  ›
                </button>
              </>
            )}

            {classMode && showQuestion && (
              <ClassQuestion activity={activity} onClose={() => setShowQuestion(false)} />
            )}
          </div>

          {/* ── 썸네일 ───────────────── */}
          {thumbsOpen && pdf && !classMode && (
            <ThumbnailRail
              pdf={pdf}
              docId={book.file}
              numPages={numPages}
              page={page}
              bookmarks={bookmarks}
              onPick={goTo}
            />
          )}

          {/* ── 하단 컨트롤 ───────────────── */}
          <div className="controls">
            <div className="pager">
              <button
                type="button"
                className="btn icon"
                onClick={goPrev}
                disabled={!canGoPrev(page, numPages, spread)}
                aria-label="이전 페이지"
              >
                <IconLeft />
              </button>
              <span className="pageinfo">
                <b>
                  {spread
                    ? spreadPages(page, numPages).filter(Boolean).join('–')
                    : page}
                </b>
                {' / '}
                {numPages || '—'}쪽
              </span>
              <button
                type="button"
                className="btn icon"
                onClick={goNext}
                disabled={atLast}
                aria-label="다음 페이지"
              >
                <IconRight />
              </button>
            </div>

            <span className="divider-v" aria-hidden="true" />

            <button
              type="button"
              className="btn icon"
              onClick={() => setZoom((z) => clampZoom(z / 1.25))}
              disabled={zoom <= 1}
              aria-label="축소"
            >
              <IconMinus />
            </button>
            <span className="zoomlevel">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className="btn icon"
              onClick={() => setZoom((z) => clampZoom(z * 1.25))}
              disabled={zoom >= 5}
              aria-label="확대"
            >
              <IconPlus />
            </button>
            <button
              type="button"
              className="btn icon"
              onClick={() => setZoom(1)}
              disabled={zoom === 1}
              aria-label="원래 크기로"
              title="원래 크기로"
            >
              <IconFit />
            </button>

            <span className="divider-v" aria-hidden="true" />

            <button
              type="button"
              className={`btn icon ${isBookmarked ? 'on' : ''}`}
              onClick={() => toggleBookmark(book.id, page)}
              aria-pressed={isBookmarked}
              aria-label={isBookmarked ? '북마크 해제' : '이 쪽 북마크'}
              title="북마크 (B)"
            >
              <IconBookmark filled={isBookmarked} />
            </button>
            <button
              type="button"
              className="btn icon"
              onClick={toggleFull}
              aria-label={isFull ? '전체 화면 끄기' : '전체 화면'}
              title="전체 화면 (F)"
            >
              <IconFullscreen />
            </button>
            {!classMode && (
              <button
                type="button"
                className={`btn ${prefs.flip ? 'on' : ''}`}
                onClick={() => setPref('flip', !prefs.flip)}
                aria-pressed={prefs.flip}
                title="책장 넘김 효과를 끄면 더 빠릅니다"
              >
                책장 넘김
              </button>
            )}

            {atLast && numPages > 0 && (
              <Link className="btn solid" to="/closing" style={{ textDecoration: 'none' }}>
                2056년의 어린이들에게 →
              </Link>
            )}

            {!classMode && (
              <div className="memo-row">
                <label htmlFor="memo">한 줄 메모</label>
                <input
                  id="memo"
                  type="text"
                  maxLength={100}
                  value={memo}
                  placeholder="이 쪽에서 눈에 띈 말을 짧게 적어 두세요 (학습지에 옮겨 적기용)"
                  onChange={(e) => setMemo(book.id, page, e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── 생각 도우미 ───────────────── */}
        {panelOpen && isNarrow && (
          <div className="panel-backdrop" onClick={() => setPref('panelOpen', false)} />
        )}
        {panelOpen && (
          <ThinkingPanel
            activityId={activityId}
            setActivityId={(id) => setPref('activity', id)}
            onClose={() => setPref('panelOpen', false)}
            accent={book.accent}
            isMobile={isNarrow}
          />
        )}
      </div>
    </div>
  )
}
