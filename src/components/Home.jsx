import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BOOKS, isBookUnlocked } from '../data/books.js'
import { ACTIVITIES } from '../data/scaffolds.js'
import { useStore } from '../lib/storage.js'
import Splash from './Splash.jsx'
import { IconLock } from './Icons.jsx'

const SPLASH_KEY = 'dolmeng-malmoi:splash-seen'

function reducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

const FLOW = [
  { h: '사전 고르기', p: '세 권 중 한 권을 골라 전자책을 엽니다.' },
  { h: '천천히 넘겨 읽기', p: '친구들이 쓴 뜻풀이와 예문, 그림을 살펴봅니다.' },
  { h: '생각 도우미 열기', p: '막히면 질문과 문장 틀을 단계별로 열어 봅니다.' },
  { h: '학습지에 적기', p: '떠오른 생각은 종이 학습지에 직접 적습니다.' },
]

export default function Home() {
  const store = useStore()
  const shelfRef = useRef(null)

  // 탭(세션)당 한 번만 스플래시를 보여 준다. 사전을 읽다가 처음으로 돌아왔을 때는 다시 뜨지 않는다.
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem(SPLASH_KEY) !== '1'
    } catch {
      return true
    }
  })

  const dismissSplash = () => {
    try {
      sessionStorage.setItem(SPLASH_KEY, '1')
    } catch {
      /* 사생활 보호 모드 등에서는 매번 다시 보여도 무방하다 */
    }
    setShowSplash(false)
    window.setTimeout(() => {
      shelfRef.current?.scrollIntoView({
        behavior: reducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      })
    }, 60)
  }

  return (
    <div className="home paper-grain">
      {showSplash && <Splash onDone={dismissSplash} />}

      <button
        type="button"
        className="home-pin"
        onClick={() =>
          window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })
        }
      >
        돌멩민국 말모이 프로젝트
      </button>

      <div className="home-inner">
        <header className="hero">
          <span className="eyebrow">2026 우리말 큰사전</span>
          <h1>돌멩민국 말모이 프로젝트</h1>
          <p className="sub">우리가 만든 사전 속에서 우리의 이야기를 발견합니다.</p>
          <p className="tag">말을 모으고, 삶을 읽고, 우리를 발견하다.</p>
        </header>

        <hr className="rule" />

        <section className="intro" aria-labelledby="intro-h">
          <h2 id="intro-h" className="sr-only">
            활동 안내
          </h2>
          <p className="lead">우리가 직접 만든 2026 우리말 큰사전이 완성되었습니다.</p>
          <p>
            세 권의 사전을 넘겨 보며 기억에 남는 말을 찾고, 그 말에 담긴 사람들의 생각과 생활
            모습을 발견해 봅시다.
          </p>
          <p className="note">떠오른 생각은 종이 학습지에 직접 적어 주세요.</p>
        </section>

        <hr className="rule" />

        <section id="shelf" ref={shelfRef} aria-labelledby="shelf-h">
          <h2 id="shelf-h" className="section-title">
            세 권의 사전
          </h2>
          <p className="section-desc">읽고 싶은 사전을 골라 펼쳐 보세요.</p>

          <div className="shelf">
            {BOOKS.map((b) => {
              const last = store.lastPage[b.id]
              const locked = !isBookUnlocked(b.id, store.storyAnswers)
              return (
                <article
                  key={b.id}
                  className={`book-card ${locked ? 'locked' : ''}`}
                  style={{ '--book-accent': b.accent, '--book-soft': b.accentSoft }}
                >
                  <div className="cover">
                    <span className="no">{b.no}</span>
                    <span className="seal" aria-hidden="true">
                      말모이
                    </span>
                    <div className="mark" aria-hidden="true" />
                    <h3 className="title">{b.title}</h3>
                    <p className="cover-sub">{b.subtitle}</p>
                    {locked && (
                      <span className="cover-lock" aria-hidden="true">
                        <IconLock width="16" height="16" />
                      </span>
                    )}
                  </div>

                  <div className="book-body">
                    <p className="q">
                      <strong>탐구 질문</strong>
                      {b.question}
                    </p>

                    <div className="book-meta">
                      <span>
                        {locked
                          ? '앞 사전을 먼저 완성하세요'
                          : last
                            ? `${last}쪽까지 읽음`
                            : '아직 펼치지 않음'}
                      </span>
                    </div>

                    {locked ? (
                      <span className="btn enter" aria-disabled="true">
                        <IconLock width="14" height="14" /> 잠겨 있음
                      </span>
                    ) : (
                      <Link
                        className="btn solid enter"
                        to={`/read/${b.id}`}
                        aria-label={`${b.title} 사전 ${last ? '이어 읽기' : '펼치기'}`}
                      >
                        {last ? '이어 읽기' : '사전 펼치기'}
                      </Link>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <hr className="rule" />

        <section aria-labelledby="flow-h">
          <h2 id="flow-h" className="section-title">
            활동 순서
          </h2>
          <p className="section-desc">
            전자책은 읽는 곳, 생각 도우미는 생각하는 곳, 종이 학습지는 내 생각을 남기는 곳입니다.
          </p>
          <ol className="steps">
            {FLOW.map((s, i) => (
              <li className="step" key={s.h}>
                <span className="n">{i + 1}</span>
                <h4>{s.h}</h4>
                <p>{s.p}</p>
              </li>
            ))}
          </ol>
        </section>

        <hr className="rule" />

        <section aria-labelledby="helper-h">
          <div className="helper-note">
            <div>
              <h3 id="helper-h">생각 도우미</h3>
              <p>
                전자책 화면 오른쪽 위의 <b>생각 도우미</b> 버튼을 누르면 탐구 질문이 열립니다.
                답을 알려 주지 않습니다. 막힐 때 힌트와 문장 틀을 한 단계씩 열어 보세요.
              </p>
              <div className="sheet-list">
                {ACTIVITIES.filter((a, i, arr) => arr.findIndex((x) => x.nav === a.nav) === i).map(
                  (a) => (
                    <span className="chip" key={a.id}>
                      {a.sheet} · {a.nav}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="home-foot">
          <Link className="btn" to="/closing">
            2056년의 어린이들에게 →
          </Link>
          <p className="credit">
            돌멩민국 말모이 프로젝트 · 6학년 국어 · 최종 기록은 종이 학습지에 남깁니다.
          </p>
        </div>
      </div>
    </div>
  )
}
