// 펼침 보기의 쪽 짝짓기.
// 실제 책처럼 1쪽은 표지로 혼자 오른쪽에 놓고, 그다음부터 (2,3) (4,5) … 로 묶는다.

export function spreadPages(page, numPages) {
  if (page <= 1) return [null, 1]
  const left = page % 2 === 0 ? page : page - 1
  const right = left + 1
  return [left, right <= numPages ? right : null]
}

export function nextPage(page, numPages, spread) {
  if (!spread) return Math.min(page + 1, numPages)
  if (page <= 1) return numPages >= 2 ? 2 : 1
  const [left] = spreadPages(page, numPages)
  const target = left + 2
  return target <= numPages ? target : page
}

export function prevPage(page, numPages, spread) {
  if (!spread) return Math.max(page - 1, 1)
  if (page <= 1) return 1
  const [left] = spreadPages(page, numPages)
  return left - 2 >= 2 ? left - 2 : 1
}

export function canGoNext(page, numPages, spread) {
  return nextPage(page, numPages, spread) !== page
}

export function canGoPrev(page, numPages, spread) {
  return prevPage(page, numPages, spread) !== page
}

export const MIN_ZOOM = 1
export const MAX_ZOOM = 5

export function clampZoom(z) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))
}
