import { useEffect, useRef, useState } from 'react'
import { LETTER_SCAFFOLD } from '../data/scaffolds.js'
import { useStore, setLetterDraft, markLetterSubmitted, resetLetter } from '../lib/storage.js'
import { submitLetter, countChars, MIN_CHARS } from '../lib/letters.js'
import { IconCaret } from './Icons.jsx'

function Disc({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="disc" data-open={open}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <IconCaret className="caret" />
      </button>
      {open && <div className="disc-body">{children}</div>}
    </div>
  )
}

/**
 * 최신 크롬의 "오버레이 스크롤바"는 ::-webkit-scrollbar 를 무시하고 화면에
 * 아무것도 그리지 않는다. 브라우저에 기대지 않고 항상 보이는 스크롤바를 직접 그린다.
 */
function GuideScroller({ children }) {
  const colRef = useRef(null)
  const [thumb, setThumb] = useState({ show: false, h: 100, top: 0 })

  const recompute = () => {
    const el = colRef.current
    if (!el) return
    const { scrollHeight, clientHeight, scrollTop } = el
    if (scrollHeight <= clientHeight + 1) {
      setThumb((t) => (t.show ? { show: false, h: 100, top: 0 } : t))
      return
    }
    const h = Math.max(12, (clientHeight / scrollHeight) * 100)
    const top = (scrollTop / (scrollHeight - clientHeight)) * (100 - h)
    setThumb({ show: true, h, top })
  }

  useEffect(() => {
    recompute()
    const el = colRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(recompute)
    ro.observe(el)
    // 아코디언을 여닫을 때도 내용 높이가 바뀌므로 다시 계산한다
    const mo = new MutationObserver(recompute)
    mo.observe(el, { childList: true, subtree: true })
    window.addEventListener('resize', recompute)
    return () => {
      ro.disconnect()
      mo.disconnect()
      window.removeEventListener('resize', recompute)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onThumbPointerDown = (e) => {
    e.preventDefault()
    const el = colRef.current
    const track = e.currentTarget.parentElement
    if (!el || !track) return
    const startY = e.clientY
    const startScroll = el.scrollTop
    const trackH = track.getBoundingClientRect().height
    const thumbH = (trackH * thumb.h) / 100
    const ratio = (el.scrollHeight - el.clientHeight) / Math.max(1, trackH - thumbH)

    const onMove = (ev) => {
      el.scrollTop = startScroll + (ev.clientY - startY) * ratio
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div className="letter-guide-wrap">
      <div className="letter-guide-col" ref={colRef} onScroll={recompute}>
        {children}
      </div>
      {thumb.show && (
        <div className="guide-scrollbar-track" aria-hidden="true">
          <div
            className="guide-scrollbar-thumb"
            style={{ height: `${thumb.h}%`, top: `${thumb.top}%` }}
            onPointerDown={onThumbPointerDown}
          />
        </div>
      )}
    </div>
  )
}

export default function LetterWriter() {
  const store = useStore()
  const draft = store.letter.draft
  const submitted = !!store.letter.submittedId

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const chars = countChars(draft.text)
  const ready =
    draft.name.trim().length > 0 &&
    draft.number.trim().length > 0 &&
    draft.title.trim().length > 0 &&
    chars >= MIN_CHARS

  const field = (key) => ({
    value: draft[key],
    onChange: (e) => setLetterDraft({ [key]: e.target.value }),
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!ready || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const ref = await submitLetter(draft)
      markLetterSubmitted(ref.id)
    } catch (err) {
      console.error(err)
      setError('제출 중 문제가 생겼습니다. 인터넷 연결을 확인하고 다시 눌러 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <section className="letter-wrap" aria-labelledby="letter-done-h">
        <div className="letter-done">
          <span className="eyebrow">제출 완료</span>
          <h2 id="letter-done-h">글이 선생님께 전달되었습니다</h2>
          <p>
            선생님이 확인하고 승인하면 <b>모두의 글 보드</b>에서 반 친구들과 함께 볼 수 있어요.
          </p>
          <button type="button" className="btn ghost letter-reset" onClick={resetLetter}>
            다른 학생이 이 기기로 쓸게요
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="letter-stage" aria-labelledby="letter-h">
      <div className="letter-head">
        <span className="eyebrow">마지막 쪽 쓰기</span>
        <h2 id="letter-h">{LETTER_SCAFFOLD.title}</h2>
        <p className="letter-guide">{LETTER_SCAFFOLD.guide}</p>
      </div>

      <div className="letter-split">
        <GuideScroller>
          <div className="core-q">
            <span className="q-mark">핵심 질문</span>
            <p>{LETTER_SCAFFOLD.core}</p>
          </div>

          <Disc title="단계별로 생각하기" defaultOpen>
            <div className="steps-list">
              {LETTER_SCAFFOLD.steps.map((s) => (
                <div className="step-card" key={s.n}>
                  <span className="lab">
                    {s.n}단계 · {s.label}
                  </span>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </Disc>

          <Disc title="생각 키워드 보기">
            <div className="keywords">
              {LETTER_SCAFFOLD.keywords.map((k) => (
                <span className="kw" key={k}>
                  {k}
                </span>
              ))}
            </div>
          </Disc>

          <Disc title="문장 틀 보기">
            <div className="frames">
              {LETTER_SCAFFOLD.frames.map((f, i) => (
                <p className="frame" key={i}>
                  {f.split('______').map((part, j, arr) => (
                    <span key={j}>
                      {part}
                      {j < arr.length - 1 && <span className="blank">______</span>}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </Disc>

          <p className="caution">
            <b>잠깐!</b> {LETTER_SCAFFOLD.caution}
          </p>
        </GuideScroller>

        <div className="letter-form-col">
          <form className="letter-form" onSubmit={handleSubmit}>
            <div className="letter-row">
              <label>
                이름
                <input
                  type="text"
                  maxLength={20}
                  required
                  autoComplete="off"
                  {...field('name')}
                />
              </label>
              <label>
                번호
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoComplete="off"
                  {...field('number')}
                />
              </label>
            </div>

            <label className="letter-title">
              제목
              <input type="text" maxLength={60} required autoComplete="off" {...field('title')} />
            </label>

            <label className="letter-body">
              <span className="letter-body-label">
                2056년 친구들에게 쓰는 글
                <span className={`letter-counter ${chars >= MIN_CHARS ? 'ok' : ''}`}>
                  {chars} / {MIN_CHARS}자 이상
                </span>
              </span>
              <textarea
                required
                placeholder="왼쪽 질문과 문장 틀을 참고해서 2056년 어린이들에게 들려줄 이야기를 써 보세요."
                {...field('text')}
              />
            </label>

            {error && <p className="letter-error">{error}</p>}

            <div className="letter-submit-row">
              <p className="letter-hint">
                {ready
                  ? '제출 준비가 되었어요. 제출 후에는 고치실 수 없으니 다시 한번 읽어 보세요.'
                  : `이름·번호·제목을 채우고 ${MIN_CHARS}자 이상 써야 제출할 수 있어요.`}
              </p>
              <button type="submit" className="btn solid" disabled={!ready || submitting}>
                {submitting ? '제출하는 중…' : '선생님께 제출하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
