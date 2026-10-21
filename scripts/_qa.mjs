// 임시 QA 스크립트. 검증 후 삭제한다.
export default async function run(page, ui) {
  const out = {}

  // ── 1. 메인 화면 ─────────────────────
  await page.waitForSelector('.book-card', { timeout: 15000 })
  out.home = {
    title: await page.title(),
    h1: await page.locator('.hero h1').innerText(),
    sub: await page.locator('.hero .sub').innerText(),
    books: await page.locator('.cover .title').allInnerTexts(),
    covers: await page.locator('.book-card').count(),
    steps: await page.locator('.step h4').allInnerTexts(),
  }

  // ── 2. 고유어 사전 열기 ─────────────────────
  await page.goto('http://localhost:5173/#/read/goyueo')
  await page.waitForSelector('.leafslot canvas', { timeout: 20000 })
  await page.waitForTimeout(900)

  const readPageInfo = () => page.locator('.pageinfo').innerText()
  out.book1 = { initial: (await readPageInfo()).replace(/\s+/g, ' ') }

  // 캔버스가 실제로 그려졌는지 (흰 종이 이상인지)
  out.book1.canvasSize = await page.evaluate(() => {
    const c = document.querySelector('.leafslot canvas')
    return c ? { w: c.width, h: c.height } : null
  })

  // ── 3. 페이지 넘기기 (키보드) ─────────────────────
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(800)
  out.book1.afterNext = (await readPageInfo()).replace(/\s+/g, ' ')
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(800)
  out.book1.afterNext2 = (await readPageInfo()).replace(/\s+/g, ' ')
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(800)
  out.book1.afterPrev = (await readPageInfo()).replace(/\s+/g, ' ')

  // 끝으로
  await page.keyboard.press('End')
  await page.waitForTimeout(800)
  out.book1.atEnd = (await readPageInfo()).replace(/\s+/g, ' ')
  out.book1.closingLinkShown = await page.locator('a.btn.solid', { hasText: '2056' }).isVisible()

  await page.keyboard.press('Home')
  await page.waitForTimeout(600)

  // ── 4. 확대 ─────────────────────
  await page.locator('button[aria-label="확대"]').click()
  await page.locator('button[aria-label="확대"]').click()
  await page.waitForTimeout(900)
  out.zoom = {
    level: await page.locator('.zoomlevel').innerText(),
    canvasAfterZoom: await page.evaluate(() => {
      const c = document.querySelector('.leafslot canvas')
      return c ? { w: c.width, h: c.height } : null
    }),
    grabbable: await page.locator('.stage.grabbable').count(),
  }
  await page.locator('button[aria-label="원래 크기로"]').click()
  await page.waitForTimeout(400)
  out.zoom.reset = await page.locator('.zoomlevel').innerText()

  // ── 5. 한 쪽 / 두 쪽 전환 ─────────────────────
  out.spreadSlots = await page.locator('.leafslot').count()
  await page.locator('button[aria-label="한 쪽 집중 보기로 전환"]').click()
  await page.waitForTimeout(900)
  out.singleSlots = await page.locator('.leafslot').count()
  await page.locator('button[aria-label="두 쪽 펼쳐 보기로 전환"]').click()
  await page.waitForTimeout(600)

  // ── 6. 썸네일 ─────────────────────
  await page.locator('button[aria-label="페이지 목록 보기"]').click()
  await page.waitForTimeout(1600)
  out.thumbs = {
    count: await page.locator('.thumb').count(),
    rendered: await page.evaluate(
      () => document.querySelectorAll('.thumbs .ph canvas').length
    ),
  }
  await page.locator('.thumb').nth(8).click()
  await page.waitForTimeout(900)
  out.thumbs.afterPick = (await page.locator('.pageinfo').innerText()).replace(/\s+/g, ' ')
  await page.locator('button[aria-label="페이지 목록 보기"]').click()

  // ── 7. 생각 도우미 ─────────────────────
  await page.getByRole('button', { name: '생각 도우미' }).click()
  await page.waitForSelector('.panel', { timeout: 5000 })
  out.panelGoyueo = {
    sheet: await page.locator('.sheet-badge').innerText(),
    title: await page.locator('.act-title').innerText(),
    core: await page.locator('.core-q p').innerText(),
    tabs: await page.locator('.activity-tabs button').allInnerTexts(),
    discsVisible: await page.locator('.disc > button').allInnerTexts(),
    // 기본 상태에서 답/힌트가 노출되지 않아야 한다
    openBodies: await page.locator('.disc-body').count(),
  }

  // 단계별 힌트가 하나씩 열리는지
  await page.locator('.disc > button', { hasText: '단계별로 생각하기' }).click()
  await page.waitForTimeout(300)
  out.panelGoyueo.stepsLockedFirst = await page.locator('.step-card.locked').count()
  await page.locator('.more-btn').first().click()
  await page.waitForTimeout(250)
  out.panelGoyueo.stepsLockedAfterOne = await page.locator('.step-card.locked').count()

  // ── 8. 사전 전환 → 질문 자동 전환 ─────────────────────
  await page.locator('.book-switch button', { hasText: '지역어' }).click()
  await page.waitForTimeout(2500)
  out.panelJiyeogeo = {
    sheet: await page.locator('.sheet-badge').innerText(),
    title: await page.locator('.act-title').innerText(),
    core: await page.locator('.core-q p').innerText(),
    pageinfo: (await page.locator('.pageinfo').innerText()).replace(/\s+/g, ' '),
  }

  await page.locator('.book-switch button', { hasText: '현대어' }).click()
  await page.waitForTimeout(2500)
  out.panelHyundaeeo = {
    title: await page.locator('.act-title').innerText(),
    core: await page.locator('.core-q p').innerText(),
    extra: await page.locator('.extra-q').innerText(),
    pageinfo: (await page.locator('.pageinfo').innerText()).replace(/\s+/g, ' '),
  }

  // 학습지 3번 탭
  await page.locator('.activity-tabs button', { hasText: '언어생활 다짐' }).click()
  await page.waitForTimeout(300)
  out.pledge = {
    sheet: await page.locator('.sheet-badge').innerText(),
    title: await page.locator('.act-title').innerText(),
    discs: await page.locator('.disc > button').allInnerTexts(),
  }
  // 내 언어 탭
  await page.locator('.activity-tabs button', { hasText: '내 언어' }).click()
  await page.waitForTimeout(300)
  out.myLang = {
    sheet: await page.locator('.sheet-badge').innerText(),
    title: await page.locator('.act-title').innerText(),
  }

  await page.locator('button[aria-label="생각 도우미 닫기"]').click()

  // ── 9. 북마크 + 메모 + 새로고침 복원 ─────────────────────
  await page.goto('http://localhost:5173/#/read/jiyeogeo')
  await page.waitForSelector('.leafslot canvas', { timeout: 20000 })
  await page.waitForTimeout(600)
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(900)
  const beforeReload = (await page.locator('.pageinfo').innerText()).replace(/\s+/g, ' ')
  await page.locator('button[aria-label="이 쪽 북마크"]').click()
  await page.locator('#memo').fill('테스트 메모')
  await page.waitForTimeout(400)

  await page.reload()
  await page.waitForSelector('.leafslot canvas', { timeout: 20000 })
  await page.waitForTimeout(1200)
  out.persistence = {
    beforeReload,
    afterReload: (await page.locator('.pageinfo').innerText()).replace(/\s+/g, ' '),
    memo: await page.locator('#memo').inputValue(),
    bookmarked: (await page.locator('button[aria-label="북마크 해제"]').count()) > 0,
    storage: await page.evaluate(() => localStorage.getItem('dolmeng-malmoi:v1')),
  }

  // ── 10. 수업 모드 ─────────────────────
  await page.locator('button[aria-label="수업 모드로 전환"]').click()
  await page.waitForTimeout(700)
  out.classMode = {
    barVisible: await page.locator('.cm-bar').isVisible(),
    bigNav: await page.locator('.cm-nav').count(),
    topbarHidden: (await page.locator('.topbar').count()) === 0,
  }
  await page.getByRole('button', { name: '질문 띄우기' }).click()
  await page.waitForTimeout(500)
  out.classMode.question = await page.locator('.cm-question h2').innerText()
  out.classMode.qLabel = await page.locator('.cm-question .label').innerText()
  await page.locator('.cm-question').getByRole('button', { name: /다음 질문/ }).click()
  await page.waitForTimeout(300)
  out.classMode.question2 = await page.locator('.cm-question h2').innerText()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  out.classMode.backToNormal = (await page.locator('.topbar').count()) > 0

  // ── 11. 마지막 화면 ─────────────────────
  await page.goto('http://localhost:5173/#/closing')
  await page.waitForSelector('.closing h1', { timeout: 8000 })
  out.closing = {
    h1: await page.locator('.closing h1').innerText(),
    finalQ: (await page.locator('.final-q').innerText()).replace(/\s+/g, ' '),
    note: await page.locator('.last-note').innerText(),
  }

  // ── 12. 모바일 폭 ─────────────────────
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://localhost:5173/#/read/hyundaeeo')
  await page.waitForSelector('.leafslot canvas', { timeout: 20000 })
  await page.waitForTimeout(1200)
  out.mobile = {
    slots: await page.locator('.leafslot').count(),
    canvas: await page.evaluate(() => {
      const c = document.querySelector('.leafslot canvas')
      const r = c?.getBoundingClientRect()
      return c ? { bitmapW: c.width, cssW: Math.round(r.width), cssH: Math.round(r.height) } : null
    }),
    pageinfo: (await page.locator('.pageinfo').innerText()).replace(/\s+/g, ' '),
    bodyScrollX: await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    ),
  }
  await page.getByRole('button', { name: '생각 도우미' }).click()
  await page.waitForTimeout(600)
  out.mobile.sheetPanel = await page.evaluate(() => {
    const p = document.querySelector('.panel')
    if (!p) return null
    const r = p.getBoundingClientRect()
    return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) }
  })

  return out
}
