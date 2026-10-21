import { useEffect, useMemo, useState } from 'react'
import { ACTIVITIES, CONCEPTS, WRITE_IT_DOWN } from '../data/scaffolds.js'
import { IconCaret, IconClose, IconPencil } from './Icons.jsx'

/** 접었다 펴는 도움말 블록 */
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

/** 한 번에 하나씩만 열리는 단계 공개 */
function useStaged(total, key) {
  const [shown, setShown] = useState(1)
  useEffect(() => {
    setShown(1)
  }, [key, total])
  return [Math.min(shown, total), () => setShown((s) => Math.min(s + 1, total))]
}

function StagedHints({ hints, actId }) {
  const [shown, more] = useStaged(hints.length, actId)
  return (
    <div className="hint-stack">
      {hints.slice(0, shown).map((h, i) => (
        <div className="hint-card" key={i}>
          <span className="lab">힌트 {i + 1}</span>
          <p>{h}</p>
        </div>
      ))}
      {shown < hints.length ? (
        <button type="button" className="more-btn" onClick={more}>
          조금 더 막힌다면 — 힌트 {shown + 1} 열기
        </button>
      ) : (
        <p className="all-shown">힌트는 여기까지예요. 이제 내 생각을 적어 봅시다.</p>
      )}
    </div>
  )
}

function StagedSteps({ steps, actId }) {
  const [shown, more] = useStaged(steps.length, actId)
  return (
    <div className="steps-list">
      {steps.map((s, i) => {
        const locked = i >= shown
        return (
          <div className={`step-card ${locked ? 'locked' : ''}`} key={s.n}>
            <span className="lab">
              {s.n}단계 · {s.label}
            </span>
            <p>{locked ? '앞 단계를 먼저 생각해 보세요.' : s.text}</p>
            {!locked && s.note && <p className="sub">예: {s.note}</p>}
          </div>
        )
      })}
      {shown < steps.length && (
        <button type="button" className="more-btn" onClick={more}>
          {shown + 1}단계 열기
        </button>
      )}
    </div>
  )
}

function Frames({ frames }) {
  return (
    <div className="frames">
      {frames.map((f, i) => (
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
  )
}

function Keywords({ list, actId }) {
  const [picked, setPicked] = useState([])
  useEffect(() => setPicked([]), [actId])
  return (
    <>
      <div className="keywords">
        {list.map((k) => {
          const on = picked.includes(k)
          return (
            <button
              type="button"
              className="kw"
              key={k}
              aria-pressed={on}
              onClick={() => setPicked((p) => (on ? p.filter((x) => x !== k) : [...p, k]))}
            >
              {k}
            </button>
          )
        })}
      </div>
      <p className="kw-note">
        {picked.length > 0
          ? `고른 말: ${picked.join(', ')} — 이 말이 왜 어울리는지 근거를 찾아 학습지에 적어 보세요.`
          : '어울리는 말을 눌러 표시해 보세요. 고르기만 해도 생각이 정리됩니다.'}
      </p>
    </>
  )
}

function Planner({ planner, actId }) {
  const [picks, setPicks] = useState({})
  useEffect(() => setPicks({}), [actId])
  const parts = planner.map((g) => picks[g.key]).filter(Boolean)

  return (
    <>
      <div className="planner">
        {planner.map((g) => (
          <div className="planner-group" key={g.key}>
            <span className="lab">{g.label}</span>
            <div className="keywords">
              {g.items.map((it) => {
                const on = picks[g.key] === it
                return (
                  <button
                    type="button"
                    className="kw"
                    key={it}
                    aria-pressed={on}
                    onClick={() =>
                      setPicks((p) => ({ ...p, [g.key]: on ? undefined : it }))
                    }
                  >
                    {it}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="kw-note">
        {parts.length > 0
          ? `내가 고른 조각 — ${parts.join(' · ')}. 이 조각을 이어서 한 문장으로 학습지에 써 보세요.`
          : '네 가지를 하나씩 골라 보면 다짐이 구체적으로 변합니다.'}
      </p>
    </>
  )
}

function ConceptCards() {
  const [open, setOpen] = useState(null)
  return (
    <div className="concept-cards">
      {CONCEPTS.map((c) => {
        const on = open === c.id
        return (
          <div className="concept-card" key={c.id}>
            <button
              type="button"
              aria-expanded={on}
              onClick={() => setOpen(on ? null : c.id)}
            >
              <span>{c.label}</span>
              <IconCaret className="caret" style={on ? { transform: 'rotate(180deg)' } : null} />
            </button>
            {on && (
              <div className="cc-body">
                <p>{c.body}</p>
                <p className="ex">예: {c.example}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ThinkingPanel({ activityId, setActivityId, onClose, accent, isMobile }) {
  const act = useMemo(
    () => ACTIVITIES.find((a) => a.id === activityId) || ACTIVITIES[0],
    [activityId]
  )

  return (
    <aside
      className="panel"
      aria-label="생각 도우미"
      style={accent ? { '--book-accent': accent } : undefined}
    >
      {isMobile && <div className="panel-grip" aria-hidden="true" />}

      <div className="panel-head">
        <div className="row">
          <span className="kicker">생각 도우미</span>
          <button type="button" className="btn icon ghost" onClick={onClose} aria-label="생각 도우미 닫기">
            <IconClose />
          </button>
        </div>
        <span className="sheet-badge">
          <IconPencil width="14" height="14" />
          {act.sheetLabel}
        </span>
      </div>

      <div className="activity-tabs" role="tablist" aria-label="탐구 활동 선택">
        {ACTIVITIES.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-pressed={a.id === act.id}
            aria-selected={a.id === act.id}
            onClick={() => setActivityId(a.id)}
          >
            {a.nav}
          </button>
        ))}
      </div>

      <div className="panel-scroll">
        <h2 className="act-title">{act.title}</h2>
        <p className="act-guide">{act.guide}</p>
        {act.concept && <p className="act-concept">핵심 개념 · {act.concept}</p>}

        {/* 기본 상태에서는 핵심 질문 하나만 보인다 */}
        <div className="core-q">
          <span className="q-mark">핵심 질문</span>
          <p>{act.core}</p>
        </div>

        {act.steps && (
          <Disc title="단계별로 생각하기">
            <StagedSteps steps={act.steps} actId={act.id} />
          </Disc>
        )}

        {act.hints && (
          <Disc title="생각 힌트 보기">
            <StagedHints hints={act.hints} actId={act.id} />
          </Disc>
        )}

        {act.questions && (
          <Disc title="더 생각할 질문 보기">
            <ul className="qlist">
              {act.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </Disc>
        )}

        {act.planner && (
          <Disc title="실천 계획 조각 맞추기">
            <Planner planner={act.planner} actId={act.id} />
          </Disc>
        )}

        {act.keywords && (
          <Disc title="생각 키워드 보기">
            <Keywords list={act.keywords} actId={act.id} />
          </Disc>
        )}

        {act.frames && (
          <Disc title="문장 틀 보기">
            <Frames frames={act.frames} />
          </Disc>
        )}

        {act.extra && (
          <div className="extra-q">
            <span className="q-mark" style={{ display: 'block', marginBottom: 8 }}>
              한 걸음 더
            </span>
            {act.extra}
          </div>
        )}

        {act.checks && (
          <Disc title="내 다짐이 구체적인지 점검하기">
            <ul className="qlist">
              {act.checks.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </Disc>
        )}

        <Disc title="생각 · 문화 · 정체성이 무슨 말일까?">
          <ConceptCards />
        </Disc>

        {act.caution && (
          <p className="caution">
            <b>잠깐!</b> {act.caution}
          </p>
        )}

        <p className="write-down">
          <span className="ico" aria-hidden="true">
            ✎
          </span>
          {WRITE_IT_DOWN}
        </p>
      </div>
    </aside>
  )
}
