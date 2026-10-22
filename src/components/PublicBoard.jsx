import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  watchApproved,
  watchAdminAuth,
  isAdminUser,
  rejectLetter,
  editLetter,
  countChars,
} from '../lib/letters.js'
import { useStore } from '../lib/storage.js'

function fmtTime(ts) {
  if (!ts?.seconds) return ''
  return new Date(ts.seconds * 1000).toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  })
}

function EditForm({ letter, onCancel, onSaved }) {
  const [title, setTitle] = useState(letter.title)
  const [text, setText] = useState(letter.text)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const ready = title.trim().length > 0 && text.trim().length > 0

  const save = async () => {
    if (!ready || saving) return
    setSaving(true)
    setErr('')
    try {
      await editLetter(letter.id, { title, text })
      onSaved()
    } catch (e) {
      console.error(e)
      setErr('저장하지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="wall-edit">
      <input
        type="text"
        className="wall-edit-title"
        maxLength={60}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="wall-edit-text"
        rows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p className="wall-edit-note">
        {countChars(text)}자 · 저장하면 선생님이 다시 확인한 뒤에 보드에 보여요.
      </p>
      {err && <p className="letter-error">{err}</p>}
      <div className="wall-edit-actions">
        <button type="button" className="btn ghost" onClick={onCancel} disabled={saving}>
          취소
        </button>
        <button type="button" className="btn solid" onClick={save} disabled={!ready || saving}>
          {saving ? '저장하는 중…' : '저장하기'}
        </button>
      </div>
    </div>
  )
}

export default function PublicBoard() {
  const store = useStore()
  const [letters, setLetters] = useState(null)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [savedNote, setSavedNote] = useState(false)

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
  const myLetterId = store.letter.submittedId

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
        {savedNote && (
          <p className="admin-note">
            수정한 내용을 저장했어요. 선생님이 다시 승인하면 보드에 보여요.
          </p>
        )}

        <div className="board-wall">
          {letters?.map((l) => {
            const mine = l.id === myLetterId
            const editing = editingId === l.id
            return (
              <article className={`wall-card ${mine ? 'mine' : ''}`} key={l.id}>
                <div className="wall-card-head">
                  <div>
                    <span className="board-who">
                      {l.number}번 {l.name}
                      {mine && <span className="wall-mine-badge">내 글</span>}
                    </span>
                    {!editing && <h2>{l.title}</h2>}
                  </div>
                  <span className="board-date">{fmtTime(l.createdAt)}</span>
                </div>

                {editing ? (
                  <EditForm
                    letter={l}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => {
                      setEditingId(null)
                      setSavedNote(true)
                      window.setTimeout(() => setSavedNote(false), 5000)
                    }}
                  />
                ) : (
                  <p className="wall-text">{l.text}</p>
                )}

                <div className="wall-actions">
                  {mine && !editing && (
                    <button
                      type="button"
                      className="wall-edit-btn"
                      onClick={() => setEditingId(l.id)}
                    >
                      내 글 수정하기
                    </button>
                  )}
                  {admin && !editing && (
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
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
