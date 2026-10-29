// 로그인은 없다. 읽던 위치·사전별 탐구 답변을 브라우저에 남긴다.
// (탐구 답변은 선생님이 볼 수 있도록 answers.js 가 Firestore 에도 따로 올린다.)
import { useSyncExternalStore } from 'react'

const KEY = 'dolmeng-malmoi:v1'

const EMPTY_STORY = { word: '', s1: '', s2: '', s3: '', completedAt: null }

/** 이 기기에서 지금 활동 중인 학생 한 명을 가리키는 무작위 id. 다른 학생으로 넘길 때 바뀐다. */
function newSessionId() {
  try {
    return crypto.randomUUID().replace(/-/g, '')
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random()
      .toString(36)
      .slice(2)}`
  }
}

const DEFAULTS = {
  sessionId: null,
  lastBook: null,
  lastPage: {}, // bookId -> page
  prefs: {
    spread: true, // PC 펼침 보기
    panelOpen: false, // 생각 도우미는 접힌 상태로 시작
    thumbsOpen: false,
    activity: 'memorable',
  },
  visited: {}, // bookId -> true
  // 사전별 "~에 담긴 이야기" 단계 답변. 다음 사전 잠금 해제 조건이기도 하다.
  storyAnswers: {
    goyueo: { ...EMPTY_STORY },
    jiyeogeo: { ...EMPTY_STORY },
    hyundaeeo: { ...EMPTY_STORY },
  },
  letter: {
    draft: { name: '', number: '', title: '', text: '' },
    submittedId: null,
    submittedAt: null,
  },
}

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS, sessionId: newSessionId() }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULTS,
      ...parsed,
      sessionId: parsed.sessionId || newSessionId(),
      prefs: { ...DEFAULTS.prefs, ...(parsed.prefs || {}) },
      storyAnswers: {
        goyueo: { ...EMPTY_STORY, ...(parsed.storyAnswers?.goyueo || {}) },
        jiyeogeo: { ...EMPTY_STORY, ...(parsed.storyAnswers?.jiyeogeo || {}) },
        hyundaeeo: { ...EMPTY_STORY, ...(parsed.storyAnswers?.hyundaeeo || {}) },
      },
      letter: {
        ...DEFAULTS.letter,
        ...(parsed.letter || {}),
        draft: { ...DEFAULTS.letter.draft, ...(parsed.letter?.draft || {}) },
      },
    }
  } catch {
    return { ...DEFAULTS, sessionId: newSessionId() }
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

export function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function getSnapshot() {
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

export function setStoryAnswer(bookId, field, value) {
  const prev = state.storyAnswers[bookId] || { ...EMPTY_STORY }
  commit({
    ...state,
    storyAnswers: { ...state.storyAnswers, [bookId]: { ...prev, [field]: value } },
  })
}

export function completeStory(bookId) {
  const prev = state.storyAnswers[bookId] || { ...EMPTY_STORY }
  if (prev.completedAt) return
  commit({
    ...state,
    storyAnswers: {
      ...state.storyAnswers,
      [bookId]: { ...prev, completedAt: Date.now() },
    },
  })
}

/** 다음 학생이 같은 기기로 이어서 할 때 한 사전의 답변만 비운다. */
export function resetStory(bookId) {
  commit({ ...state, storyAnswers: { ...state.storyAnswers, [bookId]: { ...EMPTY_STORY } } })
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
  commit({
    ...state,
    sessionId: newSessionId(),
    letter: { ...DEFAULTS.letter, draft: { ...DEFAULTS.letter.draft } },
  })
}

export function resetAll() {
  commit({
    ...DEFAULTS,
    sessionId: newSessionId(),
    prefs: { ...DEFAULTS.prefs },
    storyAnswers: {
      goyueo: { ...EMPTY_STORY },
      jiyeogeo: { ...EMPTY_STORY },
      hyundaeeo: { ...EMPTY_STORY },
    },
  })
}
