// 특정 PDF에서 지정한 쪽을 영구 삭제한다. 나머지 쪽은 원본 그대로 유지되고 순서만 당겨진다.
// 사용: node scripts/_remove-page.mjs <pdf파일명> <1부터 센 쪽번호>
import { readFile, writeFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const [, , file, pageArg] = process.argv
if (!file || !pageArg) {
  console.error('사용법: node scripts/_remove-page.mjs <파일명> <쪽번호>')
  process.exit(1)
}
const pageNum = Number(pageArg)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = join(root, 'public', 'books', file)

const bytes = await readFile(target)
const doc = await PDFDocument.load(bytes)
const before = doc.getPageCount()

doc.removePage(pageNum - 1) // pdf-lib는 0부터 센다

const after = doc.getPageCount()
await writeFile(target, await doc.save())

console.log(`${file}: ${before}쪽 → ${after}쪽 (${pageNum}쪽 삭제)`)
