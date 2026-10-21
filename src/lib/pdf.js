import * as pdfjsLib from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc

// 캔버스 한 변의 최대 픽셀. 확대해도 메모리가 터지지 않도록 상한을 둔다.
const MAX_CANVAS_SIDE = 4000
const CACHE_LIMIT = 14

const docCache = new Map() // file -> Promise<PDFDocumentProxy>
const canvasCache = new Map() // key -> HTMLCanvasElement (삽입 순서 = LRU)

export function bookUrl(file) {
  // BASE_URL은 항상 '/'로 끝난다. base:'./' 이면 './'.
  return `${import.meta.env.BASE_URL}books/${file}`
}

export function loadBook(file) {
  if (!docCache.has(file)) {
    const task = pdfjsLib.getDocument({
      url: bookUrl(file),
      // 손글씨 스캔본이라 폰트/주석 부담이 거의 없다. 기본 옵션으로 충분.
      isEvalSupported: false,
    })
    const promise = task.promise.catch((err) => {
      docCache.delete(file)
      throw err
    })
    docCache.set(file, promise)
  }
  return docCache.get(file)
}

export async function getAspect(pdf, pageNumber = 1) {
  const page = await pdf.getPage(pageNumber)
  const vp = page.getViewport({ scale: 1 })
  return vp.width / vp.height
}

function remember(key, canvas) {
  canvasCache.set(key, canvas)
  while (canvasCache.size > CACHE_LIMIT) {
    const oldest = canvasCache.keys().next().value
    const c = canvasCache.get(oldest)
    canvasCache.delete(oldest)
    // 캔버스 메모리 즉시 회수
    if (c) {
      c.width = 0
      c.height = 0
    }
  }
}

/**
 * 페이지를 CSS 폭(cssWidth)에 맞춰 캔버스로 렌더링한다.
 * 확대 중이면 cssWidth가 커지므로 자연히 더 높은 해상도로 다시 그려진다.
 */
export async function renderPage(pdf, docId, pageNumber, cssWidth, { thumb = false } = {}) {
  const width = Math.max(40, Math.round(cssWidth))
  const key = `${docId}:${pageNumber}:${width}${thumb ? ':t' : ''}`
  const cached = canvasCache.get(key)
  if (cached) {
    // LRU 갱신
    canvasCache.delete(key)
    canvasCache.set(key, cached)
    return cached
  }

  const page = await pdf.getPage(pageNumber)
  const unit = page.getViewport({ scale: 1 })
  const dpr = thumb ? 1 : Math.min(window.devicePixelRatio || 1, 2)
  let scale = (width / unit.width) * dpr

  // 상한 보정
  const maxScale = MAX_CANVAS_SIDE / Math.max(unit.width, unit.height)
  if (scale > maxScale) scale = maxScale

  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  canvas.style.width = '100%'
  canvas.style.height = 'auto'
  canvas.style.display = 'block'

  const ctx = canvas.getContext('2d', { alpha: false })
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  await page.render({ canvasContext: ctx, viewport }).promise

  if (thumb) remember(key, canvas)
  else remember(key, canvas)
  return canvas
}

/** 플립 애니메이션용 복사본. 같은 캔버스를 두 곳에 붙일 수 없어서 복사한다. */
export function cloneCanvas(source) {
  const c = document.createElement('canvas')
  c.width = source.width
  c.height = source.height
  c.style.width = '100%'
  c.style.height = '100%'
  c.style.display = 'block'
  const ctx = c.getContext('2d', { alpha: false })
  ctx.drawImage(source, 0, 0)
  return c
}

export function describeError(err) {
  const name = err?.name || ''
  if (name === 'MissingPDFException') {
    return 'PDF 파일을 찾을 수 없습니다. public/books/ 폴더에 사전 파일이 들어 있는지 확인해 주세요.'
  }
  if (name === 'InvalidPDFException') {
    // 개발 서버는 없는 파일에도 index.html을 돌려주므로 '없음'과 '손상'이 같은 오류로 보인다.
    return '사전 파일이 없거나 PDF로 읽히지 않습니다. 아래 경로에 파일이 들어 있는지 확인해 주세요.'
  }
  if (name === 'UnexpectedResponseException') {
    return '파일을 불러오는 중 네트워크 오류가 발생했습니다. 새로고침해 주세요.'
  }
  return '사전을 불러오는 중 문제가 생겼습니다. 새로고침해 주세요.'
}
