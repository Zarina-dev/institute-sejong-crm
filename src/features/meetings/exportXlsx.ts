import writeXlsxFile, { type Cell, type Row } from 'write-excel-file/browser'

import { blockText, htmlToBlocks, rasterize, saveBlob } from './documentBlocks'
import { attendanceLine, documentModel, type DocumentMeeting } from './documentModel'

const FONT = '맑은 고딕'
/** The form's six columns, in characters — the same shares as on screen. */
const COLUMNS = [10, 13, 26, 11, 17, 17].map((width) => ({ width }))
/** Characters that fit on one line of the merged body cell, roughly. */
const BODY_LINE = 80
const LINE_HEIGHT = 16

const base = { fontFamily: FONT, fontSize: 10, borderStyle: 'thin', borderColor: '#222222', wrap: true, alignVertical: 'center' } as const

const label = (value: string, extra: Partial<Cell> = {}): Cell => ({ ...base, value, fontWeight: 'bold', align: 'center', ...extra }) as Cell
const text = (value: string, extra: Partial<Cell> = {}): Cell => ({ ...base, value, ...extra }) as Cell
/** A cell another one spans over: the library wants it empty (null) and gives it the spanning cell's style itself. */
const covered = () => null

/** Lines a wrapped body takes, to size its row. */
const linesOf = (value: string) => value.split('\n').reduce((total, line) => total + Math.max(1, Math.ceil(line.length / BODY_LINE)), 0)

/**
 * 회의록 as a spreadsheet laid out like the form: the same merged grid, the
 * body as wrapped text in its cell, and the body's images placed under the
 * table (a cell cannot hold a picture).
 */
export async function downloadMeetingXlsx(meeting: DocumentMeeting, fileName: string) {
  const model = documentModel(meeting)
  const body = htmlToBlocks(model.body)
  const decisions = model.decisions ? htmlToBlocks(model.decisions) : []
  const bodyText = body.map(blockText).filter(Boolean).join('\n')
  const decisionsText = decisions.map(blockText).filter(Boolean).join('\n')

  const rows: Row[] = [
    [
      text(`${model.year}\n${model.heading}`, { columnSpan: 4, rowSpan: 2, align: 'center', fontSize: 13, fontWeight: 'bold' }),
      covered(),
      covered(),
      covered(),
      label('기 안'),
      label('결 재'),
    ],
    [covered(), covered(), covered(), covered(), text(model.drafter, { align: 'center', height: 40 }), text(model.approver, { align: 'center' })],
    [
      label('회의명', { height: 30 }),
      text(model.title, { columnSpan: 2 }),
      covered(),
      label('회 의\n방 식'),
      text(model.method, { columnSpan: 2, align: 'center' }),
      covered(),
    ],
    [
      label('일  자', { height: 24 }),
      text(model.date, { columnSpan: 2, align: 'center' }),
      covered(),
      label('장  소'),
      text(model.place, { columnSpan: 2, align: 'center' }),
      covered(),
    ],
    ...model.attendance.map((row, index): Row => [
      index === 0 ? label('참  석\n현  황', { rowSpan: model.attendance.length + 1 }) : covered(),
      label(row.label, { height: 22 }),
      text(attendanceLine(row.names), { columnSpan: 4 }),
      covered(),
      covered(),
      covered(),
    ]),
    [
      covered(),
      label('총 참석인원', { height: 22 }),
      text(`총   ${model.total} 명`, { columnSpan: 4, align: 'right', fontWeight: 'bold' }),
      covered(),
      covered(),
      covered(),
    ],
    [
      label('회  의\n내  용', { height: Math.max(220, linesOf(bodyText) * LINE_HEIGHT + 20) }),
      text(bodyText, { columnSpan: 5, alignVertical: 'top' }),
      covered(),
      covered(),
      covered(),
      covered(),
    ],
  ]

  if (decisionsText) {
    rows.push([
      label('결  정\n사  항', { height: Math.max(60, linesOf(decisionsText) * LINE_HEIGHT + 20) }),
      text(decisionsText, { columnSpan: 5, alignVertical: 'top' }),
      covered(),
      covered(),
      covered(),
      covered(),
    ])
  }

  // The body's pictures, one under another below the table.
  const images = []
  let offsetY = 0

  for (const block of [...body, ...decisions]) {
    if (block.kind !== 'image') continue
    try {
      const image = await rasterize(block.src)
      const scale = Math.min(1, 640 / image.width)
      const width = Math.round(image.width * scale)
      const height = Math.round(image.height * scale)
      images.push({
        content: new Blob([image.data], { type: 'image/png' }),
        contentType: 'image/png',
        width,
        height,
        dpi: 96,
        anchor: { row: rows.length + 2, column: 2 },
        offsetY,
      })
      offsetY += height + 12
    } catch {
      // An image that cannot be fetched is left out rather than failing the file.
    }
  }

  // Saved like the Word file, through a link: one way for every download.
  const blob = await writeXlsxFile(rows, { columns: COLUMNS, sheet: '회의록', images }, { fontFamily: FONT, fontSize: 10 }).toBlob()
  saveBlob(blob, fileName)
}
