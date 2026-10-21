import { Link } from 'react-router-dom'
import { BOOKS } from '../data/books.js'
import LetterWriter from './LetterWriter.jsx'

export default function Closing() {
  return (
    <div className="closing paper-grain">
      <div className="closing-inner">
        <span className="eyebrow">마지막 쪽</span>
        <h1>2056년의 어린이들에게</h1>

        <div className="lines">
          <p>우리는 2026년에 사용하던 말들을 모아 한 권의 사전을 만들었습니다.</p>
          <p>
            이 사전에는 우리가 무엇을 좋아했는지, 어떤 말을 사용했는지, 어떤 모습으로 살아갔는지가
            남아 있습니다.
          </p>
          <p>30년 뒤 이 사전을 펼쳐 볼 어린이들은 우리의 모습을 어떻게 생각할까요?</p>
        </div>

        <p className="final-q">
          우리가 만든 사전은 단어를 모아 놓은 책일까요,<br />
          2026년의 우리를 기록한 책일까요?
        </p>

        <p className="last-note">
          학습지 1·2·3번은 종이에 적고, 아래에서 2056년 친구들에게 보낼 글을 써 보세요.
        </p>

        <div className="closing-actions">
          <Link className="btn" to="/">
            처음으로
          </Link>
          {BOOKS.map((b) => (
            <Link className="btn" key={b.id} to={`/read/${b.id}`}>
              {b.shortTitle || b.title} 다시 보기
            </Link>
          ))}
          <Link className="btn" to="/board">
            우리 반의 편지 모음 보기
          </Link>
        </div>
      </div>

      <LetterWriter />
    </div>
  )
}
