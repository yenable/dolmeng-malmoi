// 세 권의 PDF가 제자리에 있는지, 쪽수가 기대와 맞는지 확인한다.
//   npm run check:pdf
import { readFile, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { PDFDocument } from 'pdf-lib'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const booksDir = join(root, 'public', 'books')

const EXPECTED = [
  { file: 'book1-goyueo.pdf', title: '1부 고유어', pages: 17 },
  { file: 'book2-jiyeogeo.pdf', title: '2부 지역어(방언)', pages: 14 },
  { file: 'book3-hyundaeeo.pdf', title: '3부 현대어(2026)', pages: 17 },
]

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
  const n = (await PDFDocument.load(buf)).getPageCount()
  const sizeMB = (buf.length / 1024 / 1024).toFixed(1)
  const mark = n === e.pages ? '✓' : '△'
  if (n !== e.pages) ok = false
  console.log(
    `${mark} ${e.title.padEnd(16)} ${String(n).padStart(2)}쪽 (기대 ${e.pages}쪽) · ${sizeMB}MB`
  )
}

console.log(ok ? '\n모든 사전이 준비되었습니다.' : '\n확인이 필요한 항목이 있습니다.')
process.exit(ok ? 0 : 1)
