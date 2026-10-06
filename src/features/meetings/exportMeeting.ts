import documentCss from './meetingDocument.css?inline'

const PRINT_CSS = `
  @page { size: A4; margin: 12mm; }
  html, body { margin: 0; background: #fff; }
  .meeting-doc { max-width: none; padding: 0; }
  .meeting-doc__table tr { break-inside: avoid; }
`

/** Resolves once every image in `root` has loaded or failed. */
function imagesSettled(root: ParentNode) {
  return Promise.all(
    [...root.querySelectorAll('img')].map((image) =>
      image.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            image.addEventListener('load', () => resolve(), { once: true })
            image.addEventListener('error', () => resolve(), { once: true })
          }),
    ),
  )
}

/**
 * Prints the document alone — not the panel around it — through a hidden
 * frame holding just its markup and its own stylesheet. The browser's print
 * dialog also offers "PDF로 저장".
 */
export async function printMeeting(element: HTMLElement, title: string) {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(frame)

  const doc = frame.contentDocument!
  doc.open()
  doc.write(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escapeText(title)}</title><style>${documentCss}${PRINT_CSS}</style></head><body>${element.outerHTML}</body></html>`,
  )
  doc.close()

  await imagesSettled(doc)
  frame.contentWindow!.focus()
  frame.contentWindow!.print()
  // The dialog blocks until closed in most browsers; give the rest a moment.
  setTimeout(() => frame.remove(), 1000)
}

const A4 = { width: 210, height: 297, margin: 12 }

/**
 * The document as an A4 PDF, drawn from the same markup. Images are fetched
 * fresh and inlined first: a cached copy loaded without CORS headers would
 * taint the canvas. The two libraries load only when a PDF is asked for.
 */
export async function downloadMeetingPdf(element: HTMLElement, fileName: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')])

  // An off-screen copy at A4 width, so the PDF does not depend on how wide
  // the drawer happens to be.
  const host = document.createElement('div')
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;background:#fff;'
  const copy = element.cloneNode(true) as HTMLElement
  host.appendChild(copy)
  document.body.appendChild(host)

  const blobs: string[] = []

  try {
    await Promise.all(
      [...copy.querySelectorAll('img')].map(async (image) => {
        try {
          const response = await fetch(image.src, { mode: 'cors', cache: 'reload' })
          const url = URL.createObjectURL(await response.blob())
          blobs.push(url)
          image.src = url
        } catch {
          image.remove()
        }
      }),
    )
    await imagesSettled(copy)

    const canvas = await html2canvas(copy, { scale: 2, backgroundColor: '#ffffff' })
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    const contentWidth = A4.width - A4.margin * 2
    const contentHeight = A4.height - A4.margin * 2
    // Canvas pixels per page of content.
    const pageSlice = Math.floor((canvas.width * contentHeight) / contentWidth)
    const breaks = rowBreaks(copy, canvas.width / copy.offsetWidth)

    let top = 0
    let first = true

    while (top < canvas.height) {
      // End the page at the last table row that fits, rather than through one.
      const limit = top + pageSlice
      const fitting = breaks.filter((at) => at > top + pageSlice * 0.3 && at <= limit)
      const bottom = limit >= canvas.height ? canvas.height : fitting.length ? fitting[fitting.length - 1] : limit

      const page = document.createElement('canvas')
      page.width = canvas.width
      page.height = bottom - top
      page.getContext('2d')!.drawImage(canvas, 0, top, canvas.width, page.height, 0, 0, canvas.width, page.height)

      if (!first) {
        pdf.addPage()
      }
      pdf.addImage(page.toDataURL('image/jpeg', 0.92), 'JPEG', A4.margin, A4.margin, contentWidth, (page.height * contentWidth) / canvas.width)

      first = false
      top = bottom
    }

    pdf.save(fileName)
  } finally {
    host.remove()
    blobs.forEach((url) => URL.revokeObjectURL(url))
  }
}

/** The bottom edge of every table row, in canvas pixels — where a page may end. */
function rowBreaks(root: HTMLElement, scale: number) {
  const origin = root.getBoundingClientRect().top
  return [...root.querySelectorAll('tr')].map((row) => Math.round((row.getBoundingClientRect().bottom - origin) * scale))
}

function escapeText(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
