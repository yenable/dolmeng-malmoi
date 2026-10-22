import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { db, auth, googleProvider, ADMIN_EMAIL } from './firebase.js'

const COL = 'letters'

export function countChars(text) {
  return (text || '').length
}

export async function submitLetter({ name, number, title, text }) {
  const charCount = countChars(text)
  return addDoc(collection(db, COL), {
    name: name.trim(),
    number: number.trim(),
    title: title.trim(),
    text: text.trim(),
    charCount,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

/** 글쓴이 본인(이 기기)이 제목·내용을 고친다. 다시 선생님 승인을 받아야 보드에 보인다. */
export async function editLetter(id, { title, text }) {
  const charCount = countChars(text)
  return updateDoc(doc(db, COL, id), {
    title: title.trim(),
    text: text.trim(),
    charCount,
    status: 'pending',
    editedAt: serverTimestamp(),
  })
}

/** 승인된 글만 실시간으로 받아 본다(전체 공개 보드용). 로그인 필요 없음. */
export function watchApproved(onData, onError) {
  const q = query(collection(db, COL), where('status', '==', 'approved'))
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      onData(list)
    },
    onError
  )
}

/** 심사 대기 중인 글(관리자 전용). 로그인 + 관리자 이메일이어야 규칙상 읽힌다. */
export function watchPending(onData, onError) {
  const q = query(collection(db, COL), where('status', '==', 'pending'))
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
      onData(list)
    },
    onError
  )
}

export function approveLetter(id) {
  return updateDoc(doc(db, COL, id), { status: 'approved', reviewedAt: serverTimestamp() })
}

export function rejectLetter(id) {
  return deleteDoc(doc(db, COL, id))
}

export function watchAdminAuth(cb) {
  return onAuthStateChanged(auth, cb)
}

export function isAdminUser(user) {
  return !!user && user.email === ADMIN_EMAIL && user.emailVerified
}

export function adminSignIn() {
  return signInWithPopup(auth, googleProvider)
}

export function adminSignOut() {
  return signOut(auth)
}
