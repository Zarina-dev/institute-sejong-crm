import {
  AlignmentType,
  BorderStyle,
  Document,
  HeightRule,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  type ParagraphChild,
} from 'docx'

import { htmlToBlocks, rasterize, saveBlob, type Align, type Block, type Run } from './documentBlocks'
import { attendanceLine, documentModel, type DocumentMeeting } from './documentModel'

/** A4 with 15 mm margins, in twips (1/1440 inch). */
const PAGE = { width: 11906, height: 16838, margin: 850 }
const CONTENT = PAGE.width - PAGE.margin * 2
/** The form's six columns, as on screen (MeetingDocument). */
const COLUMNS = [0.11, 0.14, 0.27, 0.12, 0.18, 0.18].map((share) => Math.round(CONTENT * share))
const FONT = { ascii: 'Malgun Gothic', hAnsi: 'Malgun Gothic', eastAsia: '맑은 고딕', cs: 'Malgun Gothic' }
const RULE = { style: BorderStyle.SINGLE, size: 6, color: '222222' }
const OUTER = { style: BorderStyle.SINGLE, size: 14, color: '222222' }
/** Widest an image may be inside 회의 내용, in pixels (twips / 15). */
const IMAGE_MAX = Math.floor((COLUMNS.slice(1).reduce((a, b) => a + b, 0) - 400) / 15)

const ALIGN = { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT } as const

/** Labels and values may hold line breaks ("회 의\n방 식"). */
function lines(value: string, options: { bold?: boolean; size?: number; align?: Align } = {}) {
  const parts = value.split('\n')
  return new Paragraph({
    alignment: ALIGN[options.align ?? 'left'],
    children: parts.map((part, index) => new TextRun({ text: part, bold: options.bold, size: options.size, break: index > 0 ? 1 : undefined })),
  })
}

function cell(children: Paragraph[], span: number[], options: { columnSpan?: number; rowSpan?: number; align?: 'top' | 'center' } = {}) {
  return new TableCell({
    children,
    columnSpan: options.columnSpan,
    rowSpan: options.rowSpan,
    verticalAlign: options.align === 'top' ? VerticalAlign.TOP : VerticalAlign.CENTER,
    width: { size: span.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    margins: { top: 90, bottom: 90, left: 140, right: 140 },
  })
}

/** The attendance rows' labels (전담/현지교원 …) run a size smaller, as on the 한글 form, so they fit their column. */
const ROLE_SIZE = 18

const label = (content: string, columns: number[], options: { rowSpan?: number; size?: number } = {}) =>
  cell([lines(content, { bold: true, align: 'center', size: options.size })], columns, { rowSpan: options.rowSpan })

const value = (content: string, columns: number[], options: { align?: Align } = {}) =>
  cell([lines(content, { align: options.align ?? 'left' })], columns, { columnSpan: columns.length > 1 ? columns.length : undefined })

function runOf(run: Run): ParagraphChild {
  if (run.lineBreak) return new TextRun({ text: '', break: 1 })
  return new TextRun({
    text: run.text,
    bold: run.bold,
    italics: run.italic,
    underline: run.underline ? {} : undefined,
    strike: run.strike,
  })
}

/** The body's blocks as Word paragraphs; images are drawn and embedded. */
async function bodyParagraphs(html: string) {
  const blocks: Block[] = htmlToBlocks(html)
  const paragraphs: Paragraph[] = []

  for (const block of blocks) {
    if (block.kind === 'image') {
      try {
        const image = await rasterize(block.src)
        const scale = Math.min(1, IMAGE_MAX / image.width)
        paragraphs.push(
          new Paragraph({
            alignment: ALIGN[block.align],
            spacing: { after: 120 },
            children: [
              new ImageRun({
                type: 'png',
                data: image.data,
                transformation: { width: Math.round(image.width * scale), height: Math.round(image.height * scale) },
              }),
            ],
          }),
        )
      } catch {
        // An image that cannot be fetched is left out rather than failing the file.
      }
      continue
    }

    if (block.kind === 'item') {
      paragraphs.push(
        new Paragraph({
          numbering: {
            reference: block.ordered ? 'numbers' : 'bullets',
            level: Math.min(block.level, 2),
            instance: block.ordered ? block.list : undefined,
          },
          spacing: { after: 60 },
          children: block.runs.map(runOf),
        }),
      )
      continue
    }

    paragraphs.push(
      new Paragraph({
        alignment: ALIGN[block.align],
        spacing: { after: 120 },
        indent: block.style === 'quote' ? { left: 360 } : undefined,
        children: block.runs.map((run) => (block.style === 'p' || block.style === 'quote' ? runOf(run) : runOf({ ...run, bold: true }))),
      }),
    )
  }

  return paragraphs.length > 0 ? paragraphs : [new Paragraph('')]
}

/**
 * 회의록 as a Word document laid out like the institute's form: the same
 * merged table, the body as real paragraphs and lists (editable, not a
 * picture), images embedded. 한글 opens .docx as well.
 */
export async function downloadMeetingDocx(meeting: DocumentMeeting, fileName: string) {
  const model = documentModel(meeting)
  const [c1, c2, c3, c4, c5, c6] = COLUMNS
  const rest = [c2, c3, c4, c5, c6]

  const rows: TableRow[] = [
    new TableRow({
      height: { value: 520, rule: HeightRule.ATLEAST },
      children: [
        cell([lines(model.year, { align: 'center' }), lines(model.heading, { bold: true, size: 30, align: 'center' })], [c1, c2, c3, c4], {
          columnSpan: 4,
          rowSpan: 2,
        }),
        label('기 안', [c5]),
        label('결 재', [c6]),
      ],
    }),
    new TableRow({
      height: { value: 1000, rule: HeightRule.ATLEAST },
      children: [value(model.drafter, [c5], { align: 'center' }), value(model.approver, [c6], { align: 'center' })],
    }),
    new TableRow({
      height: { value: 620, rule: HeightRule.ATLEAST },
      children: [
        label('회의명', [c1]),
        value(model.title, [c2, c3]),
        label('회 의\n방 식', [c4]),
        value(model.method, [c5, c6], { align: 'center' }),
      ],
    }),
    new TableRow({
      height: { value: 520, rule: HeightRule.ATLEAST },
      children: [
        label('일  자', [c1]),
        value(model.date, [c2, c3], { align: 'center' }),
        label('장  소', [c4]),
        value(model.place, [c5, c6], { align: 'center' }),
      ],
    }),
    ...model.attendance.map(
      (row, index) =>
        new TableRow({
          height: { value: 420, rule: HeightRule.ATLEAST },
          children: [
            ...(index === 0 ? [label('참  석\n현  황', [c1], { rowSpan: model.attendance.length + 1 })] : []),
            label(row.label, [c2], { size: ROLE_SIZE }),
            value(attendanceLine(row.names), [c3, c4, c5, c6]),
          ],
        }),
    ),
    new TableRow({
      height: { value: 420, rule: HeightRule.ATLEAST },
      children: [label('총 참석인원', [c2], { size: ROLE_SIZE }), value(`총   ${model.total} 명`, [c3, c4, c5, c6], { align: 'right' })],
    }),
    new TableRow({
      height: { value: 4200, rule: HeightRule.ATLEAST },
      children: [label('회  의\n내  용', [c1]), cell(await bodyParagraphs(model.body), rest, { columnSpan: 5, align: 'top' })],
    }),
  ]

  if (model.decisions) {
    rows.push(
      new TableRow({
        height: { value: 1400, rule: HeightRule.ATLEAST },
        children: [label('결  정\n사  항', [c1]), cell(await bodyParagraphs(model.decisions), rest, { columnSpan: 5, align: 'top' })],
      }),
    )
  }

  const bullet = (level: number, symbol: string) => ({
    level,
    format: LevelFormat.BULLET,
    text: symbol,
    alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 360 + level * 360, hanging: 240 } } },
  })
  const number = (level: number) => ({
    level,
    format: LevelFormat.DECIMAL,
    text: `%${level + 1}.`,
    alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 400 + level * 360, hanging: 300 } } },
  })

  const document = new Document({
    creator: meeting.drafter || undefined,
    title: `${meeting.heldOn} ${meeting.title || '회의록'}`,
    styles: { default: { document: { run: { font: FONT, size: 21 } } } },
    numbering: {
      config: [
        { reference: 'bullets', levels: [bullet(0, '•'), bullet(1, '◦'), bullet(2, '▪')] },
        { reference: 'numbers', levels: [number(0), number(1), number(2)] },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE.width, height: PAGE.height },
            margin: { top: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, right: PAGE.margin },
          },
        },
        children: [
          new Table({
            width: { size: CONTENT, type: WidthType.DXA },
            columnWidths: COLUMNS,
            borders: { top: OUTER, bottom: OUTER, left: OUTER, right: OUTER, insideHorizontal: RULE, insideVertical: RULE },
            rows,
          }),
        ],
      },
    ],
  })

  saveBlob(await Packer.toBlob(document), fileName)
}
