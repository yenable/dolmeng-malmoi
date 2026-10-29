// 사전별 "~에 담긴 이야기" 답변을 선생님(관리자 화면)이 볼 수 있도록 Firestore 에 올린다.
// 학생 화면은 그대로 localStorage 로 동작하고, 여기서는 바뀐 내용을 조금 모았다가 뒤따라 보낸다.
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase.js'
import { BOOKS } from '../data/books.js'
import { subscribe, getSnapshot } from './storage.js'

const COL = 'storyAnswers'
const FIELDS = ['word', 's1', 's2', 's3']
const MAX_LEN = 2000 // firestore.rules 와 맞춘다
const DELAY = 1500

function clip(v) {
  return String(v || '').slice(0, MAX_LEN)
}

function buildPayload(state) {
  const books = {}
  let hasAny = false
  for (const b of BOOKS) {
    const a = state.storyAnswers[b.id] || {}
    const entry = { completedAt: typeof a.completedAt === 'number' ? a.completedAt : null }
    for (const f of FIELDS) {
      entry[f] = clip(a[f])
      if (entry[f].trim()) hasAny = true
    }
    books[b.id] = entry
  }
  return {
    hasAny,
    data: {
      // 이름·번호는 편지 쓰기 화면에서 처음 적는다. 그 전까지는 빈 값으로 올라간다.
      name: state.letter.draft.name.trim().slice(0, 40),
      number: state.letter.draft.number.trim().slice(0, 10),
      books,
    },
  }
}

let started = false

/** 앱 시작 시 한 번 호출한다. 답변이 바뀔 때마다 잠깐 기다렸다가 이 학생의 문서를 덮어쓴다. */
export function startAnswerSync() {
  if (started) return
  started = true

  let lastSent = '' // `${sessionId}|${json}`
  let timer = null

  const flush = () => {
    timer = null
    const state = getSnapshot()
    const { hasAny, data } = buildPayload(state)
    if (!hasAny) return
    const key = `${state.sessionId}|${JSON.stringify(data)}`
    if (key === lastSent) return
    lastSent = key
    setDoc(doc(db, COL, state.sessionId), { ...data, updatedAt: serverTimestamp() }).catch(
      (err) => {
        console.error(err)
        lastSent = '' // 다음 변경 때 다시 시도
      }
    )
  }

  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(flush, DELAY)
  }

  subscribe(schedule)
  schedule()
  window.addEventListener('pagehide', () => {
    if (timer) {
      clearTimeout(timer)
      flush()
    }
  })
}

/** 관리자 전용: 모든 학생의 답변을 실시간으로 받는다. */
export function watchAllAnswers(onData, onError) {
  return onSnapshot(
    collection(db, COL),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  )
}

export function deleteAnswers(id) {
  return deleteDoc(doc(db, COL, id))
}
