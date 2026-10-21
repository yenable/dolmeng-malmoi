import { useEffect, useState } from 'react'
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

function fmtTime(ts) {
  if (!ts?.seconds) return ''
  return new Date(ts.seconds * 1000).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminBoard() {
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState(null)
  const [pending, setPending] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => watchAdminAuth((u) => {
    setUser(u)
    setAuthReady(true)
  }), [])

  const admin = isAdminUser(user)

  useEffect(() => {
    if (!admin) {
      setPending(null)
      return
    }
    return watchPending(setPending, (err) => {
      console.error(err)
      setError('목록을 불러오지 못했습니다. 새로고침해 보세요.')
    })
  }, [admin])

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

  return (
    <div className="admin paper-grain">
      <div className="admin-inner">
        <header className="admin-head">
          <Link className="home-link" to="/">
            ← 처음으로
          </Link>
          <h1>관리자 · 글 승인</h1>
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
        )}
      </div>
    </div>
  )
}
