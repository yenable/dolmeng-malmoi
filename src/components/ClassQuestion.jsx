import { useState } from 'react'
import { TEACHER_PROMPTS } from '../data/scaffolds.js'
import { IconLeft, IconRight, IconClose } from './Icons.jsx'

/** 수업 모드: 질문만 화면 가운데에 크게 띄운다. */
export default function ClassQuestion({ activity, onClose }) {
  // 현재 활동의 핵심 질문을 맨 앞에 두고, 교사용 발문을 뒤에 잇는다.
  const list = [activity?.core, ...TEACHER_PROMPTS].filter(Boolean)
  const [i, setI] = useState(0)

  return (
    <div className="cm-question" role="dialog" aria-modal="true" aria-label="수업 발문">
      <span className="label">{i === 0 ? activity?.sheetLabel || '핵심 질문' : '교사 발문'}</span>
      <h2>{list[i]}</h2>
      <div className="cm-q-nav">
        <button
          type="button"
          className="btn"
          onClick={() => setI((v) => Math.max(0, v - 1))}
          disabled={i === 0}
        >
          <IconLeft /> 이전 질문
        </button>
        <span className="idx">
          {i + 1} / {list.length}
        </span>
        <button
          type="button"
          className="btn"
          onClick={() => setI((v) => Math.min(list.length - 1, v + 1))}
          disabled={i === list.length - 1}
        >
          다음 질문 <IconRight />
        </button>
        <button type="button" className="btn" onClick={onClose}>
          <IconClose /> 닫기
        </button>
      </div>
    </div>
  )
}
