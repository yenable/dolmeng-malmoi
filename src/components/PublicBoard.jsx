import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  watchApproved,
  watchAdminAuth,
  isAdminUser,
  rejectLetter,
} from '../lib/letters.js'

function fmtTime(ts) {
  if (!ts?.seconds) return ''
  return new Date(ts.seconds * 1000).toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  })
}

export default function PublicBoard() {
  const [letters, setLetters] = useState(null)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(
    () =>
      watchApproved(setLetters, (err) => {
        console.error(err)
        setError('글을 불러오지 못했습니다. 새로고침해 보세요.')
      }),
    []
  )

  useEffect(() => watchAdminAuth(setUser), [])

  const admin = isAdminUser(user)

  const handleDelete = async (l) => {
    if (!window.confirm(`${l.number}번 ${l.name} 학생의 글을 보드에서 지울까요?`)) return
    setBusyId(l.id)
    try {
      await rejectLetter(l.id)
    } catch (err) {
      console.error(err)
      window.alert('삭제 중 문제가 생겼습니다. 다시 시도해 주세요.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="board paper-grain">
      <div className="board-inner">
        <header className="board-head">
          <Link className="home-link" to="/">
            ← 처음으로
          </Link>
          <span className="eyebrow">2056년의 어린이들에게</span>
          <h1>우리 반의 편지 모음</h1>
          <p>선생님이 승인한 글이 이곳에 모입니다.</p>
          {admin && <span className="board-admin-badge">관리자 보기 · 글을 지울 수 있어요</span>}
        </header>

        {error && <p className="letter-error">{error}</p>}
        {letters === null && !error && <p className="admin-note">불러오는 중…</p>}
        {letters && letters.length === 0 && (
          <p className="admin-note">아직 공개된 글이 없습니다. 조금만 기다려 주세요.</p>
        )}

        <div className="board-wall">
          {letters?.map((l) => (
            <article className="wall-card" key={l.id}>
              <div className="wall-card-head">
                <div>
                  <span className="board-who">
                    {l.number}번 {l.name}
                  </span>
                  <h2>{l.title}</h2>
                </div>
                <span className="board-date">{fmtTime(l.createdAt)}</span>
              </div>
              <p className="wall-text">{l.text}</p>
              {admin && (
                <button
                  type="button"
                  className="wall-delete"
                  disabled={busyId === l.id}
                  onClick={() => handleDelete(l)}
                  aria-label={`${l.name} 학생 글 삭제`}
                >
                  {busyId === l.id ? '지우는 중…' : '글 삭제'}
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
