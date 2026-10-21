// 세 권의 PDF가 제자리에 있는지, 쪽수가 기대와 맞는지 확인한다.
//   npm run check:pdf
import { readFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const booksDir = join(root, 'public', 'books')

const EXPECTED = [
  { file: 'book1-goyueo.pdf', title: '1부 고유어', pages: 17 },
  { file: 'book2-jiyeogeo.pdf', title: '2부 지역어(방언)', pages: 15 },
  { file: 'book3-hyundaeeo.pdf', title: '3부 현대어(2026)', pages: 17 },
]

// pdfjs 없이 /Type /Page 오브젝트를 세어 쪽수를 구한다.
function countPages(buf) {
  const text = buf.toString('latin1')
  const direct = text.match(/\/Type\s*\/Page[^s]/g)
  if (direct && direct.length) return direct.length
  // 선형화·객체스트림 PDF 대비: /Count N 중 가장 큰 값
  const counts = [...text.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]))
  return counts.length ? Math.max(...counts) : 0
}

let ok = true
for (const e of EXPECTED) {
  const path = join(booksDir, e.file)
  try {
    await access(path)
  } catch {
    console.log(`✗ ${e.title.padEnd(16)} 파일 없음 — public/books/${e.file}`)
    ok = false
    continue
  }
  const buf = await readFile(path)
  const n = countPages(buf)
  const sizeMB = (buf.length / 1024 / 1024).toFixed(1)
  const mark = n === e.pages ? '✓' : '△'
  if (n !== e.pages) ok = false
  console.log(
    `${mark} ${e.title.padEnd(16)} ${String(n).padStart(2)}쪽 (기대 ${e.pages}쪽) · ${sizeMB}MB`
  )
}

console.log(ok ? '\n모든 사전이 준비되었습니다.' : '\n확인이 필요한 항목이 있습니다.')
process.exit(ok ? 0 : 1)
