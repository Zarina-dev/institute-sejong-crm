import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  PictureOutlined,
  RedoOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { Color, FontSize, TextStyle } from '@tiptap/extension-text-style'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { App, Button, ColorPicker, Divider, Input, Popover, Segmented, Select, Tooltip } from 'antd'
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'

import { assetUrl } from '../api/client'
import { usePreferences } from '../app/preferences'
import { IMAGE_ACCEPT, uploadImage } from '../features/uploads/api'
import { getErrorMessage } from './errors'
import { collapseAssetUrls, ensureHtml, expandAssetUrls } from './richText'

type ImageAlign = 'left' | 'center' | 'right'
type ImageSize = 'small' | 'medium' | 'full'

/**
 * Image node with two extra attributes the admin can change from the
 * toolbar. They are serialised as classes (`align-right size-small`) plus
 * data attributes, which is what the API's sanitize allow-list and the
 * `.rich-content` CSS understand — no inline styles needed.
 */
const AlignedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'center' as ImageAlign,
        parseHTML: (element) => (element.getAttribute('data-align') as ImageAlign | null) ?? 'center',
        renderHTML: () => ({}),
      },
      size: {
        default: 'full' as ImageSize,
        parseHTML: (element) => (element.getAttribute('data-size') as ImageSize | null) ?? 'full',
        renderHTML: () => ({}),
      },
    }
  },
  renderHTML({ node, HTMLAttributes }) {
    // HTMLAttributes only holds attributes that render themselves; align/size
    // are read from the node and serialised as classes here.
    const align = node.attrs.align as ImageAlign
    const size = node.attrs.size as ImageSize
    return ['img', { ...HTMLAttributes, 'data-align': align, 'data-size': size, class: `align-${align} size-${size}` }]
  },
})

const FONT_SIZES = ['14px', '16px', '18px', '20px', '24px', '28px', '32px']

type RichTextEditorProps = {
  /** Stored HTML (site-relative image paths). Undefined/empty renders an empty editor. */
  value?: string
  onChange?: (html: string) => void
  disabled?: boolean
  placeholder?: string
  minHeight?: number
}

/**
 * TipTap-based editor for announcements: headings, inline styles, font
 * size and colour, alignment, lists, links and uploaded images that can be
 * floated left/right or centred and resized. Emits HTML; the API sanitizes
 * it on save and `RichContent` sanitizes it again on display.
 *
 * Works as an antd `Form.Item` control via `value`/`onChange`.
 */
export function RichTextEditor({ value, onChange, disabled, minHeight = 320 }: RichTextEditorProps) {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  // The last HTML we emitted — lets us tell "form set a new value" apart from our own echo.
  const lastEmitted = useRef<string>('')

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
        codeBlock: false,
        code: false,
      }),
      TextStyle,
      FontSize,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      AlignedImage.configure({ allowBase64: false }),
    ],
    content: expandAssetUrls(ensureHtml(value ?? '')),
    editable: !disabled,
    editorProps: { attributes: { class: 'rich-content rich-editor__content', style: `min-height:${minHeight}px` } },
    onUpdate: ({ editor: instance }) => {
      const html = instance.isEmpty ? '' : collapseAssetUrls(instance.getHTML())
      lastEmitted.current = html
      onChange?.(html)
    },
  })

  // External value changes (opening the edit modal, reset) → replace content.
  useEffect(() => {
    if (!editor) {
      return
    }

    const next = value ?? ''

    if (next !== lastEmitted.current) {
      lastEmitted.current = next
      editor.commands.setContent(expandAssetUrls(ensureHtml(next)), { emitUpdate: false })
    }
  }, [editor, value])

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [editor, disabled])

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''

      if (!file || !editor) {
        return
      }

      setUploading(true)

      try {
        const uploaded = await uploadImage(file)
        // Absolute for display; collapseAssetUrls in onUpdate stores it relative.
        editor
          .chain()
          .focus()
          .setImage({ src: assetUrl(uploaded.url), alt: file.name.replace(/\.[^.]+$/, '') })
          .run()
      } catch (err) {
        message.error(getErrorMessage(err, t('editor.imageFailed')))
      } finally {
        setUploading(false)
      }
    },
    [editor, message, t],
  )

  if (!editor) {
    return null
  }

  return (
    <div className={disabled ? 'rich-editor rich-editor--disabled' : 'rich-editor'}>
      <Toolbar editor={editor} disabled={Boolean(disabled)} uploading={uploading} onPickImage={() => fileInputRef.current?.click()} />
      <EditorContent editor={editor} />
      <input ref={fileInputRef} type="file" accept={IMAGE_ACCEPT} hidden onChange={handleFileChange} />
    </div>
  )
}

type ToolbarProps = {
  editor: Editor
  disabled: boolean
  uploading: boolean
  onPickImage: () => void
}

function Toolbar({ editor, disabled, uploading, onPickImage }: ToolbarProps) {
  const { t } = usePreferences()
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')

  // Re-render the toolbar only when one of these flags changes, not on every keystroke.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      alignLeft: e.isActive({ textAlign: 'left' }),
      alignCenter: e.isActive({ textAlign: 'center' }),
      alignRight: e.isActive({ textAlign: 'right' }),
      link: e.isActive('link'),
      linkHref: (e.getAttributes('link').href as string | undefined) ?? '',
      fontSize: (e.getAttributes('textStyle').fontSize as string | undefined) ?? '',
      color: (e.getAttributes('textStyle').color as string | undefined) ?? '',
      image: e.isActive('image'),
      imageAlign: (e.getAttributes('image').align as ImageAlign | undefined) ?? 'center',
      imageSize: (e.getAttributes('image').size as ImageSize | undefined) ?? 'full',
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })

  const chain = () => editor.chain().focus()

  const blockValue = state.h2 ? 'h2' : state.h3 ? 'h3' : 'p'

  const setBlock = (block: string) => {
    if (block === 'h2') {
      chain().setHeading({ level: 2 }).run()
    } else if (block === 'h3') {
      chain().setHeading({ level: 3 }).run()
    } else {
      chain().setParagraph().run()
    }
  }

  const applyLink = () => {
    const href = linkValue.trim()

    if (href) {
      chain().extendMarkRange('link').setLink({ href }).run()
    } else {
      chain().extendMarkRange('link').unsetLink().run()
    }

    setLinkOpen(false)
  }

  const tool = (label: string, icon: ReactNode, active: boolean, onClick: () => void, extraDisabled = false) => (
    <Tooltip title={label} key={label}>
      <Button
        size="small"
        type={active ? 'primary' : 'text'}
        icon={icon}
        aria-label={label}
        aria-pressed={active}
        disabled={disabled || extraDisabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
      />
    </Tooltip>
  )

  return (
    <div className="rich-editor__toolbar" role="toolbar" aria-label={t('news.form.body')}>
      <div className="rich-editor__group">
        {tool(t('editor.undo'), <UndoOutlined />, false, () => chain().undo().run(), !state.canUndo)}
        {tool(t('editor.redo'), <RedoOutlined />, false, () => chain().redo().run(), !state.canRedo)}
      </div>
      <Divider type="vertical" />

      <div className="rich-editor__group">
        <Select
          size="small"
          className="rich-editor__select"
          value={blockValue}
          disabled={disabled}
          onChange={setBlock}
          options={[
            { value: 'p', label: t('editor.paragraph') },
            { value: 'h2', label: t('editor.heading2') },
            { value: 'h3', label: t('editor.heading3') },
          ]}
        />
        <Select
          size="small"
          className="rich-editor__select rich-editor__select--size"
          value={state.fontSize || ''}
          disabled={disabled}
          aria-label={t('editor.fontSize')}
          onChange={(size: string) => (size ? chain().setFontSize(size).run() : chain().unsetFontSize().run())}
          options={[{ value: '', label: t('editor.fontSizeDefault') }, ...FONT_SIZES.map((size) => ({ value: size, label: size.replace('px', '') }))]}
        />
        <Tooltip title={t('editor.textColor')}>
          <ColorPicker
            size="small"
            value={state.color || undefined}
            disabled={disabled}
            allowClear
            onChangeComplete={(color) => chain().setColor(color.toHexString()).run()}
            onClear={() => chain().unsetColor().run()}
          />
        </Tooltip>
      </div>
      <Divider type="vertical" />

      <div className="rich-editor__group">
        {tool(t('editor.bold'), <BoldOutlined />, state.bold, () => chain().toggleBold().run())}
        {tool(t('editor.italic'), <ItalicOutlined />, state.italic, () => chain().toggleItalic().run())}
        {tool(t('editor.underline'), <UnderlineOutlined />, state.underline, () => chain().toggleUnderline().run())}
        {tool(t('editor.strike'), <StrikethroughOutlined />, state.strike, () => chain().toggleStrike().run())}
      </div>
      <Divider type="vertical" />

      <div className="rich-editor__group">
        {tool(t('editor.alignLeft'), <AlignLeftOutlined />, state.alignLeft, () => chain().setTextAlign('left').run())}
        {tool(t('editor.alignCenter'), <AlignCenterOutlined />, state.alignCenter, () => chain().setTextAlign('center').run())}
        {tool(t('editor.alignRight'), <AlignRightOutlined />, state.alignRight, () => chain().setTextAlign('right').run())}
      </div>
      <Divider type="vertical" />

      <div className="rich-editor__group">
        {tool(t('editor.bulletList'), <UnorderedListOutlined />, state.bullet, () => chain().toggleBulletList().run())}
        {tool(t('editor.orderedList'), <OrderedListOutlined />, state.ordered, () => chain().toggleOrderedList().run())}
        {tool(t('editor.quote'), <span aria-hidden>❝</span>, state.quote, () => chain().toggleBlockquote().run())}
      </div>
      <Divider type="vertical" />

      <div className="rich-editor__group">
        <Popover
          open={linkOpen}
          onOpenChange={(open) => {
            if (open) {
              setLinkValue(state.linkHref)
            }
            setLinkOpen(open)
          }}
          trigger="click"
          content={
            <div className="rich-editor__link">
              <Input
                size="small"
                value={linkValue}
                placeholder="https://"
                onChange={(event) => setLinkValue(event.target.value)}
                onPressEnter={applyLink}
                autoFocus
              />
              <Button size="small" type="primary" onClick={applyLink}>
                {t('common.save')}
              </Button>
            </div>
          }
          title={t('editor.linkPrompt')}
        >
          <Tooltip title={t('editor.link')}>
            <Button size="small" type={state.link ? 'primary' : 'text'} icon={<LinkOutlined />} aria-label={t('editor.link')} disabled={disabled} />
          </Tooltip>
        </Popover>
        {state.link ? tool(t('editor.unlink'), <DisconnectOutlined />, false, () => chain().unsetLink().run()) : null}
        <Tooltip title={t('editor.image')}>
          <Button size="small" type="text" icon={<PictureOutlined />} aria-label={t('editor.image')} loading={uploading} disabled={disabled} onClick={onPickImage} />
        </Tooltip>
      </div>

      {state.image ? (
        <div className="rich-editor__image-tools">
          <span className="rich-editor__image-label">{t('editor.imageAlign')}</span>
          <Segmented
            size="small"
            value={state.imageAlign}
            onChange={(align) => chain().updateAttributes('image', { align }).run()}
            options={[
              { value: 'left', icon: <AlignLeftOutlined />, title: t('editor.imageLeft') },
              { value: 'center', icon: <AlignCenterOutlined />, title: t('editor.imageCenter') },
              { value: 'right', icon: <AlignRightOutlined />, title: t('editor.imageRight') },
            ]}
          />
          <span className="rich-editor__image-label">{t('editor.imageSize')}</span>
          <Segmented
            size="small"
            value={state.imageSize}
            onChange={(size) => chain().updateAttributes('image', { size }).run()}
            options={[
              { value: 'small', label: t('editor.imageSmall') },
              { value: 'medium', label: t('editor.imageMedium') },
              { value: 'full', label: t('editor.imageFull') },
            ]}
          />
          <Button size="small" danger type="text" icon={<DeleteOutlined />} onClick={() => chain().deleteSelection().run()}>
            {t('editor.removeImage')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
