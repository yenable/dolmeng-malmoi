// 서버도 로그인도 없다. 읽던 위치·북마크·한 줄 메모만 브라우저에 남긴다.
import { useSyncExternalStore } from 'react'

const KEY = 'dolmeng-malmoi:v1'

const DEFAULTS = {
  lastBook: null,
  lastPage: {}, // bookId -> page
  bookmarks: {}, // bookId -> [page]
  memos: {}, // `${bookId}:${page}` -> string
  prefs: {
    spread: true, // PC 펼침 보기
    flip: true, // 책장 넘김 효과
    panelOpen: false, // 생각 도우미는 접힌 상태로 시작
    thumbsOpen: false,
    activity: 'memorable',
  },
  visited: {}, // bookId -> true
  letter: {
    draft: { name: '', number: '', title: '', text: '' },
    submittedId: null,
    submittedAt: null,
  },
}

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULTS,
      ...parsed,
      prefs: { ...DEFAULTS.prefs, ...(parsed.prefs || {}) },
      letter: {
        ...DEFAULTS.letter,
        ...(parsed.letter || {}),
        draft: { ...DEFAULTS.letter.draft, ...(parsed.letter?.draft || {}) },
      },
    }
  } catch {
    return DEFAULTS
  }
}

let state = read()
const listeners = new Set()

function commit(next) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* 사생활 보호 모드 등에서 저장이 막혀도 앱은 계속 동작해야 한다 */
  }
  listeners.forEach((l) => l())
}

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

function getSnapshot() {
  return state
}

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function setPref(key, value) {
  commit({ ...state, prefs: { ...state.prefs, [key]: value } })
}

export function setLastPage(bookId, page) {
  if (state.lastPage[bookId] === page && state.lastBook === bookId) return
  commit({
    ...state,
    lastBook: bookId,
    lastPage: { ...state.lastPage, [bookId]: page },
    visited: { ...state.visited, [bookId]: true },
  })
}

export function toggleBookmark(bookId, page) {
  const list = state.bookmarks[bookId] || []
  const next = list.includes(page)
    ? list.filter((p) => p !== page)
    : [...list, page].sort((a, b) => a - b)
  commit({ ...state, bookmarks: { ...state.bookmarks, [bookId]: next } })
}

export function setMemo(bookId, page, text) {
  const k = `${bookId}:${page}`
  const memos = { ...state.memos }
  if (text && text.trim()) memos[k] = text.slice(0, 100)
  else delete memos[k]
  commit({ ...state, memos })
}

export function getMemo(snapshot, bookId, page) {
  return snapshot.memos[`${bookId}:${page}`] || ''
}

export function setLetterDraft(patch) {
  commit({ ...state, letter: { ...state.letter, draft: { ...state.letter.draft, ...patch } } })
}

export function markLetterSubmitted(id) {
  commit({
    ...state,
    letter: { ...state.letter, submittedId: id, submittedAt: Date.now() },
  })
}

/** 같은 기기를 다른 학생이 이어서 쓸 때 초안과 제출 상태를 비운다. */
export function resetLetter() {
  commit({ ...state, letter: { ...DEFAULTS.letter, draft: { ...DEFAULTS.letter.draft } } })
}

export function resetAll() {
  commit({ ...DEFAULTS, prefs: { ...DEFAULTS.prefs } })
}
