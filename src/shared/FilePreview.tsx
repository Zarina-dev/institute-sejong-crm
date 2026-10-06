import { DownloadOutlined, FileUnknownOutlined } from '@ant-design/icons'
import { Button, Modal, Result, Segmented, Spin } from 'antd'
import DOMPurify from 'dompurify'
import { useEffect, useRef, useState } from 'react'

import { assetUrl, authedUrl } from '../api/client'
import { usePreferences } from '../app/preferences'

export type PreviewFile = { url: string; name: string }

type Kind = 'pdf' | 'image' | 'text' | 'csv' | 'hwp' | 'docx' | 'xlsx' | 'none'

const KIND_BY_EXTENSION: Record<string, Kind> = {
  pdf: 'pdf',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  txt: 'text',
  csv: 'csv',
  hwp: 'hwp',
  docx: 'docx',
  xlsx: 'xlsx',
}

const extensionOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

/**
 * 회의록 attachments are not public files: the API hands them to the admin
 * only, with the token in the query since an iframe or a link sends no
 * header. Anything else stored by the API is a plain asset.
 */
const sourceOf = (url: string) => (url.startsWith('/uploads/documents/') ? authedUrl(url) : assetUrl(url))

/** The same file as a download under its original name — the API names it, as a cross-origin <a download> cannot. */
function downloadOf(url: string, name: string) {
  const link = new URL(sourceOf(url))
  link.searchParams.set('name', name)
  return link.toString()
}

/**
 * Read a file without downloading it: the minutes' attachments are mostly
 * .hwp, and opening each one in 한글 just to see which it is wastes the
 * admin's time. Every format is drawn in the page; the readers for .hwp,
 * .docx and .xlsx are loaded only when such a file is opened.
 */
export function FilePreview({ file, onClose }: { file: PreviewFile | null; onClose: () => void }) {
  const { t } = usePreferences()
  const href = file ? sourceOf(file.url) : ''

  return (
    <Modal
      open={Boolean(file)}
      onCancel={onClose}
      title={file?.name}
      width="min(1100px, 96vw)"
      className="file-preview"
      destroyOnHidden
      footer={
        file ? (
          <>
            <Button onClick={onClose}>{t('preview.close')}</Button>
            <a href={downloadOf(file.url, file.name)} download={file.name}>
              <Button type="primary" icon={<DownloadOutlined />}>
                {t('preview.download')}
              </Button>
            </a>
          </>
        ) : null
      }
    >
      {file ? <PreviewBody key={file.url} file={file} href={href} /> : null}
    </Modal>
  )
}

/** The same reader set into a page rather than a dialog — 회의록's original, shown as soon as it is opened. */
export function FileView({ file }: { file: PreviewFile }) {
  return (
    <div className="file-view">
      <PreviewBody key={file.url} file={file} href={sourceOf(file.url)} />
    </div>
  )
}

/** A link that downloads the file under its own name. */
export const fileDownloadUrl = (file: PreviewFile) => downloadOf(file.url, file.name)

function PreviewBody({ file, href }: { file: PreviewFile; href: string }) {
  const { t } = usePreferences()
  const extension = extensionOf(file.name)
  const kind = KIND_BY_EXTENSION[extension] ?? 'none'

  switch (kind) {
    case 'pdf':
      return <iframe className="file-preview__frame" src={href} title={file.name} />
    case 'image':
      return (
        <div className="file-preview__image">
          <img src={href} alt={file.name} />
        </div>
      )
    case 'text':
    case 'csv':
    case 'hwp':
    case 'docx':
    case 'xlsx':
      return <LoadedPreview kind={kind} href={href} />
    default:
      return <Unavailable message={t('preview.unsupported', { ext: extension.toUpperCase() || '?' })} />
  }
}

function Unavailable({ message }: { message: string }) {
  return <Result className="file-preview__status" icon={<FileUnknownOutlined />} subTitle={message} />
}

type Loaded =
  | { status: 'loading' }
  | { status: 'failed' }
  | { status: 'text'; text: string }
  | { status: 'table'; sheets: Array<{ name: string; rows: string[][] }> }
  | { status: 'html'; html: string }
  | { status: 'hwp'; data: Uint8Array }

/** The formats that need the file's bytes, read and turned into something to show. */
function LoadedPreview({ kind, href }: { kind: 'text' | 'csv' | 'hwp' | 'docx' | 'xlsx'; href: string }) {
  const { t } = usePreferences()
  const [state, setState] = useState<Loaded>({ status: 'loading' })
  const [sheet, setSheet] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async (): Promise<Loaded> => {
      const response = await fetch(href)

      if (!response.ok) {
        throw new Error(String(response.status))
      }

      const buffer = await response.arrayBuffer()

      switch (kind) {
        case 'text':
          return { status: 'text', text: decodeText(buffer) }
        case 'csv':
          return { status: 'table', sheets: [{ name: '', rows: parseCsv(decodeText(buffer)) }] }
        case 'hwp':
          return { status: 'hwp', data: new Uint8Array(buffer) }
        case 'docx': {
          const mammoth = await import('mammoth')
          const { value } = await mammoth.convertToHtml({ arrayBuffer: buffer })
          return { status: 'html', html: DOMPurify.sanitize(value) }
        }
        case 'xlsx': {
          const { default: readXlsxFile } = await import('read-excel-file/browser')
          const sheets = await readXlsxFile(new Blob([buffer]))
          return {
            status: 'table',
            sheets: sheets.map(({ sheet: name, data }) => ({ name, rows: data.map((row) => row.map(cellText)) })),
          }
        }
      }
    }

    load().then(
      (loaded) => !cancelled && setState(loaded),
      () => !cancelled && setState({ status: 'failed' }),
    )

    return () => {
      cancelled = true
    }
  }, [href, kind])

  switch (state.status) {
    case 'loading':
      return (
        <div className="file-preview__status">
          <Spin />
        </div>
      )
    case 'failed':
      return <Unavailable message={t('preview.failed')} />
    case 'text':
      return <pre className="file-preview__text">{state.text}</pre>
    case 'html':
      return <div className="file-preview__document rich-content" dangerouslySetInnerHTML={{ __html: state.html }} />
    case 'hwp':
      return <HwpPreview data={state.data} />
    case 'table': {
      const current = state.sheets[Math.min(sheet, state.sheets.length - 1)]

      return (
        <div className="file-preview__sheets">
          {state.sheets.length > 1 ? (
            <Segmented
              options={state.sheets.map((entry, index) => ({ value: index, label: entry.name || String(index + 1) }))}
              value={sheet}
              onChange={(value) => setSheet(Number(value))}
            />
          ) : null}
          {current && current.rows.length ? <SheetTable rows={current.rows} /> : <Unavailable message={t('preview.empty')} />}
        </div>
      )
    }
  }
}

/**
 * hwp.js lays the document out page by page, as 한글 would. It is an early
 * reader: a file it cannot follow throws, and the dialog then offers the
 * download instead.
 */
function HwpPreview({ data }: { data: Uint8Array }) {
  const { t } = usePreferences()
  const container = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const host = container.current
    let cancelled = false

    if (!host) {
      return
    }

    import('hwp.js')
      .then(({ Viewer }) => {
        if (!cancelled) {
          // The viewer draws into the element it is given and owns it after.
          // The type must be stated: left to guess, it reads the bytes as a path.
          new Viewer(host, data, { type: 'array' })
        }
      })
      .catch(() => !cancelled && setFailed(true))

    return () => {
      cancelled = true
      host.replaceChildren()
    }
  }, [data])

  return failed ? <Unavailable message={t('preview.failed')} /> : <div className="file-preview__hwp" ref={container} />
}

function SheetTable({ rows }: { rows: string[][] }) {
  const width = Math.max(...rows.map((row) => row.length))

  return (
    <div className="file-preview__table">
      <table>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: width }, (_, column) => (
                <td key={column}>{row[column] ?? ''}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value)
}

/** UTF-8 first; files saved by older Korean Windows tools are EUC-KR. */
function decodeText(buffer: ArrayBuffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    return new TextDecoder('euc-kr').decode(buffer)
  }
}

/** Enough CSV for reading: quoted fields, doubled quotes, commas and newlines inside quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') {
        index += 1
      }
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  return rows
}
