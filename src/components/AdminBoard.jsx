import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  watchAdminAuth,
  isAdminUser,
  adminSignIn,
  adminSignOut,
  watchPending,
  approveLetter,
  rejectLetter,
} from '../lib/letters.js'
import { watchAllAnswers, deleteAnswers } from '../lib/answers.js'
import { BOOKS } from '../data/books.js'
import { ACTIVITIES } from '../data/scaffolds.js'

function fmtTime(ts) {
  if (!ts?.seconds) return ''
  return new Date(ts.seconds * 1000).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function useBusy(setError) {
  const [busyId, setBusyId] = useState(null)
  const act = async (id, fn) => {
    setBusyId(id)
    setError('')
    try {
      await fn(id)
    } catch (err) {
      console.error(err)
      setError('처리 중 문제가 생겼습니다. 다시 시도해 주세요.')
    } finally {
      setBusyId(null)
    }
  }
  return [busyId, act]
}

function LetterReview() {
  const [pending, setPending] = useState(null)
  const [error, setError] = useState('')
  const [busyId, act] = useBusy(setError)

  useEffect(
    () =>
      watchPending(setPending, (err) => {
        console.error(err)
        setError('목록을 불러오지 못했습니다. 새로고침해 보세요.')
      }),
    []
  )

  return (
    <>
      {error && <p className="letter-error">{error}</p>}

      {pending === null && <p className="admin-note">불러오는 중…</p>}

      {pending && pending.length === 0 && (
        <p className="admin-note">승인을 기다리는 글이 없습니다.</p>
      )}

      <ul className="admin-list">
        {pending?.map((l) => (
          <li className="admin-card" key={l.id}>
            <div className="admin-card-head">
              <div>
                <span className="admin-who">
                  {l.number}번 {l.name}
                </span>
                <h3>{l.title}</h3>
              </div>
              <span className="admin-meta">
                {l.charCount}자 · {fmtTime(l.createdAt)}
              </span>
            </div>
            <p className="admin-text">{l.text}</p>
            <div className="admin-actions">
              <button
                type="button"
                className="btn solid"
                disabled={busyId === l.id}
                onClick={() => act(l.id, approveLetter)}
              >
                승인하고 보드에 올리기
              </button>
              <button
                type="button"
                className="btn ghost"
                disabled={busyId === l.id}
                onClick={() => {
                  if (window.confirm(`${l.name} 학생의 글을 반려(삭제)할까요?`)) {
                    act(l.id, rejectLetter)
                  }
                }}
              >
                반려
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

const STORY_ACTS = Object.fromEntries(
  ACTIVITIES.filter((a) => a.bookId).map((a) => [a.bookId, a])
)

function hasBookAnswer(b) {
  return !!b && ['word', 's1', 's2', 's3'].some((f) => b[f]?.trim())
}

/** 번호순(숫자로), 이름을 아직 안 적은 학생은 맨 뒤 */
function byNumber(a, b) {
  const na = parseInt(a.number, 10)
  const nb = parseInt(b.number, 10)
  const ka = Number.isNaN(na) ? Infinity : na
  const kb = Number.isNaN(nb) ? Infinity : nb
  if (ka !== kb) return ka - kb
  return (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)
}

function BookAnswer({ book, answer }) {
  const act = STORY_ACTS[book.id]
  if (!hasBookAnswer(answer)) {
    return (
      <div className="ans-book empty">
        <p className="ans-book-title">{book.title}</p>
        <p className="ans-empty">아직 적지 않았어요</p>
      </div>
    )
  }
  return (
    <div className="ans-book">
      <p className="ans-book-title">
        {book.title}
        {answer.completedAt ? (
          <span className="ans-badge done">완성</span>
        ) : (
          <span className="ans-badge">작성 중</span>
        )}
      </p>
      <dl className="ans-rows">
        <div className="ans-row">
          <dt>마음에 남은 말</dt>
          <dd className="ans-word">{answer.word || '—'}</dd>
        </div>
        {act?.steps?.slice(0, 3).map((s, i) => (
          <div key={s.n} className="ans-row">
            <dt>
              {s.n}단계 · {s.label}
            </dt>
            <dd>{answer[`s${i + 1}`] || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function AnswersView() {
  const [list, setList] = useState(null)
  const [bookFilter, setBookFilter] = useState('all')
  const [error, setError] = useState('')
  const [busyId, act] = useBusy(setError)

  useEffect(
    () =>
      watchAllAnswers(setList, (err) => {
        console.error(err)
        setError('답변을 불러오지 못했습니다. 새로고침해 보세요.')
      }),
    []
  )

  const books = bookFilter === 'all' ? BOOKS : BOOKS.filter((b) => b.id === bookFilter)

  const rows = useMemo(() => {
    if (!list) return null
    return list
      .filter((r) => books.some((b) => hasBookAnswer(r.books?.[b.id])))
      .sort(byNumber)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, bookFilter])

  return (
    <>
      <div className="activity-tabs ans-filter" role="tablist" aria-label="사전 고르기">
        {[{ id: 'all', title: '전체' }, ...BOOKS].map((b) => (
          <button
            key={b.id}
            type="button"
            aria-pressed={bookFilter === b.id}
            onClick={() => setBookFilter(b.id)}
          >
            {b.shortTitle || b.title}
          </button>
        ))}
      </div>

      {error && <p className="letter-error">{error}</p>}

      {rows === null && <p className="admin-note">불러오는 중…</p>}

      {rows && rows.length === 0 && <p className="admin-note">아직 올라온 답변이 없습니다.</p>}

      {rows && rows.length > 0 && (
        <p className="ans-count">
          {rows.length}명 · 이름은 학생이 편지 쓰기 화면에서 이름·번호를 적으면 나타나요.
        </p>
      )}

      <ul className="admin-list">
        {rows?.map((r) => (
          <li className="admin-card" key={r.id}>
            <div className="admin-card-head">
              <span className="admin-who ans-who">
                {r.name || r.number ? (
                  `${r.number ? `${r.number}번 ` : ''}${r.name}`
                ) : (
                  <span className="ans-noname">이름 아직 안 적음 · {r.id.slice(0, 6)}</span>
                )}
              </span>
              <span className="admin-meta">{fmtTime(r.updatedAt)}</span>
            </div>
            <div className="ans-books">
              {books.map((b) => (
                <BookAnswer key={b.id} book={b} answer={r.books?.[b.id]} />
              ))}
            </div>
            <div className="admin-actions">
              <button
                type="button"
                className="wall-delete"
                disabled={busyId === r.id}
                onClick={() => {
                  if (window.confirm('이 학생의 사전 답변 기록을 삭제할까요?')) {
                    act(r.id, deleteAnswers)
                  }
                }}
              >
                기록 삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}

export default function AdminBoard() {
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('letters')

  useEffect(() => watchAdminAuth((u) => {
    setUser(u)
    setAuthReady(true)
  }), [])

  const admin = isAdminUser(user)

  return (
    <div className="admin paper-grain">
      <div className="admin-inner">
        <header className="admin-head">
          <Link className="home-link" to="/">
            ← 처음으로
          </Link>
          <h1>관리자 · {tab === 'letters' ? '글 승인' : '사전 답변'}</h1>
        </header>

        {!authReady && <p className="admin-note">확인하는 중…</p>}

        {authReady && !user && (
          <div className="admin-gate">
            <p>선생님 구글 계정으로 로그인하면 학생들이 제출한 글을 확인할 수 있어요.</p>
            <button type="button" className="btn solid" onClick={() => adminSignIn()}>
              구글 계정으로 로그인
            </button>
          </div>
        )}

        {authReady && user && !admin && (
          <div className="admin-gate">
            <p>
              <b>{user.email}</b> 계정은 관리자 권한이 없습니다. 선생님 계정으로 다시 로그인해
              주세요.
            </p>
            <button type="button" className="btn" onClick={() => adminSignOut()}>
              로그아웃
            </button>
          </div>
        )}

        {admin && (
          <>
            <div className="admin-toolbar">
              <span>
                <b>{user.email}</b>로 로그인됨
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link className="btn" to="/board">
                  공개 보드 보기
                </Link>
                <button type="button" className="btn ghost" onClick={() => adminSignOut()}>
                  로그아웃
                </button>
              </div>
            </div>

            <div className="admin-tabs" role="tablist" aria-label="관리 메뉴">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'letters'}
                onClick={() => setTab('letters')}
              >
                편지 승인
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'answers'}
                onClick={() => setTab('answers')}
              >
                사전 답변
              </button>
            </div>

            {tab === 'letters' ? <LetterReview /> : <AnswersView />}
          </>
        )}
      </div>
    </div>
  )
}
