import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { watchApproved } from '../lib/letters.js'

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
  const [openId, setOpenId] = useState(null)

  useEffect(
    () =>
      watchApproved(setLetters, (err) => {
        console.error(err)
        setError('글을 불러오지 못했습니다. 새로고침해 보세요.')
      }),
    []
  )

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
        </header>

        {error && <p className="letter-error">{error}</p>}
        {letters === null && !error && <p className="admin-note">불러오는 중…</p>}
        {letters && letters.length === 0 && (
          <p className="admin-note">아직 공개된 글이 없습니다. 조금만 기다려 주세요.</p>
        )}

        <ul className="board-list">
          {letters?.map((l) => {
            const open = openId === l.id
            return (
              <li className="board-card" key={l.id}>
                <button
                  type="button"
                  className="board-card-btn"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : l.id)}
                >
                  <div>
                    <span className="board-who">
                      {l.number}번 {l.name}
                    </span>
                    <h2>{l.title}</h2>
                  </div>
                  <span className="board-date">{fmtTime(l.createdAt)}</span>
                </button>
                {open && <p className="board-text">{l.text}</p>}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
