// 세 권의 사전 정의.
// file 은 public/books/ 안의 내부 파일명이다.
// 원본 PDF 파일명(한글 + 공백)을 그대로 쓰면 배포 환경에 따라 경로 오류가 나므로
// 영문 ASCII 파일명으로 정리해서 넣는다.

export const BOOKS = [
  {
    id: 'goyueo',
    no: '01',
    title: '고유어',
    subtitle: '오래 이어져 온 우리의 말',
    question: '옛날부터 사용한 말에는 어떤 삶의 모습이 담겨 있을까?',
    concept: '예로부터 내려온 우리의 생각, 문화, 정체성',
    file: 'book1-goyueo.pdf',
    expectedPages: 17,
    accent: '#A4813C',
    accentSoft: '#F6EEDC',
    scaffoldId: 'story-goyueo',
  },
  {
    id: 'jiyeogeo',
    no: '02',
    title: '지역어(방언)',
    shortTitle: '지역어',
    subtitle: '지역마다 다른 우리의 말',
    question: '지역마다 다른 말에는 어떤 생활과 문화가 담겨 있을까?',
    concept: '그 지역 사람들의 생각, 문화, 정체성',
    file: 'book2-jiyeogeo.pdf',
    expectedPages: 14,
    accent: '#5A7D66',
    accentSoft: '#E9F0EA',
    scaffoldId: 'story-jiyeogeo',
  },
  {
    id: 'hyundaeeo',
    no: '03',
    title: '현대어(2026)',
    shortTitle: '현대어',
    subtitle: '지금 우리가 사용하는 말',
    question: '2026년 우리가 사용하는 말은 우리의 어떤 모습을 보여 줄까?',
    concept: '2026년 6학년의 생각, 문화, 정체성',
    file: 'book3-hyundaeeo.pdf',
    expectedPages: 17,
    accent: '#56698F',
    accentSoft: '#E8ECF4',
    scaffoldId: 'story-hyundaeeo',
  },
]

export function getBook(id) {
  return BOOKS.find((b) => b.id === id) || null
}
