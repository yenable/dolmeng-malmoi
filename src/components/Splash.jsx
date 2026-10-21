import { useEffect, useRef, useState } from 'react'

const AUTO_MS = 2200

function reducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** 접속 시 한 번 보여 주는 타이틀 화면. 끝나면 Home이 세 권의 사전으로 스크롤된다. */
export default function Splash({ onDone }) {
  const [closing, setClosing] = useState(false)
  const done = useRef(false)

  const finish = () => {
    if (done.current) return
    done.current = true
    if (reducedMotion()) {
      onDone()
      return
    }
    setClosing(true)
    window.setTimeout(onDone, 460)
  }

  useEffect(() => {
    const t = window.setTimeout(finish, reducedMotion() ? 500 : AUTO_MS)
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className={`splash ${closing ? 'closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="돌멩민국 말모이 프로젝트 시작 화면"
      onClick={finish}
    >
      <div className="splash-inner">
        <span className="eyebrow">2026 우리말 큰사전</span>
        <h1>돌멩민국 말모이 프로젝트</h1>
        <p className="sub">우리가 만든 사전 속에서 우리의 이야기를 발견합니다.</p>
      </div>
      <button type="button" className="splash-skip" onClick={finish}>
        시작하기 →
      </button>
    </div>
  )
}
