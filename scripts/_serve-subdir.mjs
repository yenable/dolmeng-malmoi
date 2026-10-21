// GitHub Pages 하위 경로(/malmoi/) 배포를 흉내 내는 임시 서버. 검증 후 삭제한다.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const PREFIX = '/malmoi'
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown',
}

createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (!p.startsWith(PREFIX)) {
    res.writeHead(404).end('outside prefix')
    return
  }
  p = p.slice(PREFIX.length) || '/'
  if (p === '/' || p === '') p = '/index.html'
  try {
    const buf = await readFile(join(root, p))
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' })
    res.end(buf)
  } catch {
    res.writeHead(404).end('not found: ' + p)
  }
}).listen(4178, () => console.log('http://localhost:4178/malmoi/'))
