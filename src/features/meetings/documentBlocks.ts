import { sanitizeRichHtml } from '../../shared/richText'

export type Run = { text: string; bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; lineBreak?: boolean }
export type Align = 'left' | 'center' | 'right'

/**
 * The rich text of 회의 내용 / 결정 사항 as a flat list of blocks — what a
 * Word or Excel file can be built from, since neither takes HTML. Covers
 * what the editor writes: paragraphs, headings, quotes, bullet and numbered
 * lists (nested), images, and bold / italic / underline / strike.
 */
export type Block =
  | { kind: 'text'; style: 'p' | 'h2' | 'h3' | 'quote'; align: Align; runs: Run[] }
  | { kind: 'item'; ordered: boolean; level: number; index: number; list: number; runs: Run[] }
  | { kind: 'image'; src: string; align: Align }

type Marks = Omit<Run, 'text' | 'lineBreak'>

function alignOf(element: Element): Align {
  const value = (element as HTMLElement).style?.textAlign || element.getAttribute('data-align') || ''
  return value === 'center' || value === 'right' ? value : 'left'
}

function runsOf(node: Node, marks: Marks = {}): Run[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ''
    return text ? [{ text, ...marks }] : []
  }

  if (!(node instanceof Element)) {
    return []
  }

  const tag = node.tagName.toLowerCase()

  if (tag === 'br') return [{ text: '', lineBreak: true }]
  // Images and nested lists are blocks of their own, not runs.
  if (tag === 'img' || tag === 'ul' || tag === 'ol') return []

  const next: Marks = {
    ...marks,
    ...(tag === 'strong' || tag === 'b' ? { bold: true } : {}),
    ...(tag === 'em' || tag === 'i' ? { italic: true } : {}),
    ...(tag === 'u' ? { underline: true } : {}),
    ...(tag === 's' || tag === 'strike' || tag === 'del' ? { strike: true } : {}),
  }

  return [...node.childNodes].flatMap((child) => runsOf(child, next))
}

export function htmlToBlocks(html: string): Block[] {
  const root = new DOMParser().parseFromString(`<body>${sanitizeRichHtml(html)}</body>`, 'text/html').body
  const blocks: Block[] = []
  let lists = 0

  const images = (element: Element, align: Align) => {
    for (const image of element.querySelectorAll('img')) {
      blocks.push({
        kind: 'image',
        src: image.getAttribute('src') ?? '',
        align: image.parentElement === element ? align : alignOf(image.parentElement ?? element),
      })
    }
  }

  const list = (element: Element, level: number) => {
    const ordered = element.tagName.toLowerCase() === 'ol'
    const id = (lists += 1)
    let index = 0

    for (const item of element.children) {
      if (item.tagName.toLowerCase() !== 'li') continue
      index += 1
      blocks.push({ kind: 'item', ordered, level, index, list: id, runs: runsOf(item) })

      for (const nested of item.children) {
        const tag = nested.tagName.toLowerCase()
        if (tag === 'ul' || tag === 'ol') list(nested, level + 1)
      }
    }
  }

  for (const element of root.children) {
    const tag = element.tagName.toLowerCase()
    const align = alignOf(element)

    if (tag === 'ul' || tag === 'ol') {
      list(element, 0)
    } else if (tag === 'img') {
      blocks.push({ kind: 'image', src: element.getAttribute('src') ?? '', align })
    } else if (tag === 'hr') {
      continue
    } else {
      const style = tag === 'h2' ? 'h2' : tag === 'h3' ? 'h3' : tag === 'blockquote' ? 'quote' : 'p'
      const runs = runsOf(element)
      if (runs.some((run) => run.text.trim() || run.lineBreak)) blocks.push({ kind: 'text', style, align, runs })
      images(element, align)
    }
  }

  return blocks
}

/** A block as plain text — for a spreadsheet cell. */
export function blockText(block: Block) {
  if (block.kind === 'image') return ''
  const text = block.runs.map((run) => (run.lineBreak ? '\n' : run.text)).join('')
  if (block.kind === 'item') return `${'   '.repeat(block.level)}${block.ordered ? `${block.index}.` : '•'} ${text}`
  return text
}

/**
 * An image from the body as PNG bytes and its size — Word takes PNG, not
 * WebP, and needs the dimensions. Fetched fresh with CORS (see main.ts).
 */
export async function rasterize(src: string) {
  const response = await fetch(src, { mode: 'cors', cache: 'reload' })
  const bitmap = await createImageBitmap(await response.blob())
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0)
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('png'))), 'image/png'),
  )
  return { data: await blob.arrayBuffer(), width: bitmap.width, height: bitmap.height }
}

/** Hands a generated file to the browser as a download. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
