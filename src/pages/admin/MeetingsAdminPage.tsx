import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  LockOutlined,
  PaperClipOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Alert, App, Button, Card, Drawer, Empty, Form, Input, Modal, Skeleton, Space, Tag, Typography, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { useQueryClient } from '@tanstack/react-query'

import { getMeeting } from '../../features/meetings/api'
import { meetingKeys, useCreateMeeting, useDeleteMeeting, useMeeting, useMeetings, useUpdateMeeting } from '../../features/meetings/queries'
import type { MeetingAttachment, MeetingSummary } from '../../features/meetings/types'
import { DOCUMENT_ACCEPT, MAX_DOCUMENT_SIZE, uploadDocument } from '../../features/uploads/api'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatDate, formatFileSize } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'
import { RichContent } from '../../shared/RichContent'
import { RichTextEditor } from '../../shared/RichTextEditor'
import { FilePreview, type PreviewFile } from '../../shared/FilePreview'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { YearSelect } from '../../shared/YearSelect'

const { Text } = Typography

type MeetingFormValues = {
  heldOn: string
  attendees?: string
  body?: string
  decisions?: string
  attachments?: MeetingAttachment[]
}

const NO_MEETINGS: MeetingSummary[] = []

/** ISO week number — the minutes are written weekly, so each carries its week. */
function weekOfYear(date: string): number {
  const day = new Date(`${date}T00:00:00Z`)
  const thursday = new Date(day)
  thursday.setUTCDate(day.getUTCDate() + 3 - ((day.getUTCDay() + 6) % 7))
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4))
  const diff = thursday.getTime() - firstThursday.getTime()

  return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000) - ((firstThursday.getUTCDay() + 6) % 7) / 7)
}

/**
 * 회의록 — weekly minutes, read one year at a time. The page is a list, not a
 * stack of documents: one line per meeting with its date, who was there and
 * its files, and the minutes themselves in a drawer. Every entry is named
 * after the day it was written, so nobody types a subject.
 */
export function MeetingsAdminPage() {
  const { t, language } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()

  const meetings = useMeetings()
  const createMeeting = useCreateMeeting()
  const updateMeeting = useUpdateMeeting()
  const deleteMeeting = useDeleteMeeting()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm<MeetingFormValues>()
  const queryClient = useQueryClient()
  const [loadingMeeting, setLoadingMeeting] = useState(false)
  const saving = createMeeting.isPending || updateMeeting.isPending

  const all = meetings.data ?? NO_MEETINGS
  const titleOf = useCallback((meeting: MeetingSummary) => t('meetings.titleOf', { date: formatDate(meeting.heldOn, language) }), [language, t])

  const years = useMemo(() => [...new Set(all.map((meeting) => meeting.heldOn.slice(0, 4)))].sort().reverse(), [all])
  const [year, setYear] = useState<string | null>(null)
  const activeYear = year && years.includes(year) ? year : (years[0] ?? null)
  const rows = useMemo(() => all.filter((meeting) => meeting.heldOn.startsWith(activeYear ?? '')), [activeYear, all])

  const open = rows.find((meeting) => meeting.id === openId) ?? null
  // The list has no notes or decisions; the open meeting brings its own.
  const openDetail = useMeeting(openId)

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ heldOn: new Date().toISOString().slice(0, 10), attachments: [] })
    setModalOpen(true)
  }, [form])

  /**
   * The form opens at once with what the row has, disabled until the notes
   * and decisions are fetched — nothing typed can be overwritten by them.
   */
  const openEditModal = useCallback(
    (meeting: MeetingSummary) => {
      setEditingId(meeting.id)
      form.setFieldsValue({
        heldOn: meeting.heldOn,
        attendees: meeting.attendees,
        body: '',
        decisions: '',
        attachments: meeting.attachments ?? [],
      })
      setModalOpen(true)
      setLoadingMeeting(true)

      queryClient
        .fetchQuery({ queryKey: meetingKeys.detail(meeting.id), queryFn: () => getMeeting(meeting.id) })
        .then((full) => form.setFieldsValue({ body: full.body, decisions: full.decisions }))
        .catch((err) => {
          message.error(getErrorMessage(err, t('meetings.loadFailed')))
          setModalOpen(false)
        })
        .finally(() => setLoadingMeeting(false))
    },
    [form, message, queryClient, t],
  )

  const submitForm = async () => {
    const values = await form.validateFields().catch(() => null)

    if (!values) {
      return
    }

    try {
      if (editingId) {
        await updateMeeting.mutateAsync({ id: editingId, payload: values })
        message.success(t('meetings.updated'))
      } else {
        await createMeeting.mutateAsync(values)
        message.success(t('meetings.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('meetings.saveFailed')))
    }
  }

  const handleDelete = useCallback(
    (meeting: MeetingSummary) => {
      confirmDelete({
        target: t('meetings.titleOf', { date: formatDate(meeting.heldOn, language) }),
        onConfirm: () =>
          deleteMeeting.mutateAsync(meeting.id).then(
            () => {
              setOpenId(null)
              message.success(t('meetings.deleted'))
            },
            (err) => message.error(getErrorMessage(err, t('meetings.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteMeeting, language, message, t],
  )

  /** Uploaded on pick; only the stored path travels with the form. */
  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    if (file.size > MAX_DOCUMENT_SIZE) {
      message.error(t('meetings.form.fileTooLarge', { max: formatFileSize(MAX_DOCUMENT_SIZE) }))
      return Upload.LIST_IGNORE
    }

    setUploading(true)

    try {
      const uploaded = await uploadDocument(file)
      const current = form.getFieldValue('attachments') ?? []
      form.setFieldValue('attachments', [...current, uploaded])
    } catch (err) {
      message.error(getErrorMessage(err, t('meetings.form.uploadFailed')))
    } finally {
      setUploading(false)
    }

    return Upload.LIST_IGNORE
  }

  return (
    <div className="page-layout">
      <PageHeader kicker={t('adminNav.meetingsSection')} title={t('meetings.adminTitle')} description={t('meetings.adminSubtitle')} />

      <Alert type="info" showIcon icon={<LockOutlined />} message={t('meetings.internalOnly')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Space size={12}>
            {years.length > 1 ? <YearSelect years={years} value={activeYear} onChange={setYear} /> : null}
            <Text type="secondary">{t('meetings.count', { count: rows.length })}</Text>
          </Space>

          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('meetings.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={meetings.error} fallback={t('meetings.loadFailed')} />

      {meetings.isPending ? (
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      ) : rows.length > 0 ? (
        <div className="meeting-list">
          {rows.map((meeting) => (
            <Card className="surface-card meeting-row" key={meeting.id} onClick={() => setOpenId(meeting.id)}>
              <Tag className="meeting-row__week">{t('meetings.week', { week: weekOfYear(meeting.heldOn) })}</Tag>

              <div className="meeting-row__main">
                <strong>{titleOf(meeting)}</strong>
                <span className="meeting-row__facts">
                  {meeting.attendees ? (
                    <span>
                      <TeamOutlined /> {meeting.attendees}
                    </span>
                  ) : null}
                  {meeting.attachments?.length ? (
                    <span>
                      <PaperClipOutlined /> {t('meetings.fileCount', { count: meeting.attachments.length })}
                    </span>
                  ) : null}
                </span>
              </div>

              {/* Files are one click from the list — no need to open the entry.
                  They open for reading; the download is in the preview. */}
              <div className="meeting-row__files" onClick={(event) => event.stopPropagation()} role="presentation">
                {(meeting.attachments ?? []).map((file) => (
                  <button type="button" className="attachment-chip" key={file.url} title={file.name} onClick={() => setPreview(file)}>
                    <EyeOutlined />
                    <span>{file.name}</span>
                  </button>
                ))}
              </div>

              <div className="meeting-row__actions" onClick={(event) => event.stopPropagation()} role="presentation">
                <Button size="small" icon={<EditOutlined />} aria-label={t('common.edit')} onClick={() => openEditModal(meeting)} />
                <Button size="small" danger icon={<DeleteOutlined />} aria-label={t('common.delete')} onClick={() => handleDelete(meeting)} />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('meetings.empty')} />
        </Card>
      )}

      {/* The minutes themselves open in a drawer, so the list stays a list. */}
      <Drawer
        open={Boolean(open)}
        onClose={() => setOpenId(null)}
        width={640}
        title={open ? titleOf(open) : ''}
        className="meeting-drawer"
        extra={
          open ? (
            <Button icon={<EditOutlined />} onClick={() => openEditModal(open)}>
              {t('common.edit')}
            </Button>
          ) : null
        }
      >
        {open ? (
          <div className="meeting-detail">
            <ul className="meeting-detail__facts">
              <li>
                <CalendarOutlined /> {formatDate(open.heldOn, language)}
              </li>
              {open.attendees ? (
                <li>
                  <TeamOutlined /> {open.attendees}
                </li>
              ) : null}
            </ul>

            {/* The texts arrive with the meeting, a moment after the drawer opens. */}
            {openDetail.isPending ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : (
              <>
                {openDetail.data?.body ? (
                  <section>
                    <Text className="section-kicker">{t('meetings.notes')}</Text>
                    <RichContent html={openDetail.data.body} />
                  </section>
                ) : null}

                <section className="meeting-detail__decisions">
                  <Text className="section-kicker">{t('meetings.decisions')}</Text>
                  {openDetail.data?.decisions ? (
                    <RichContent html={openDetail.data.decisions} />
                  ) : (
                    <Text type="secondary">{t('meetings.noDecisions')}</Text>
                  )}
                </section>
              </>
            )}

            {open.attachments?.length ? (
              <section>
                <Text className="section-kicker">{t('meetings.attachments')}</Text>
                <div className="attachment-row">
                  {open.attachments.map((file) => (
                    <button type="button" className="attachment-chip" key={file.url} title={t('preview.open')} onClick={() => setPreview(file)}>
                      <EyeOutlined />
                      <span>{file.name}</span>
                      <Text type="secondary">{formatFileSize(file.size)}</Text>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <Modal
        title={editingId ? t('meetings.editTitle') : t('meetings.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        okButtonProps={{ disabled: loadingMeeting }}
        forceRender
        width={860}
        className="editor-modal"
      >
        {/* No subject field: the minutes are named after their date. */}
        <Form form={form} layout="vertical" disabled={saving || loadingMeeting}>
          <div className="form-row">
            <Form.Item name="heldOn" label={t('meetings.form.heldOn')} rules={[{ required: true, message: t('meetings.form.heldOnRequired') }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="attendees" label={t('meetings.form.attendees')} extra={t('meetings.form.attendeesHint')}>
              <Input maxLength={500} />
            </Form.Item>
          </div>

          <Form.Item name="body" label={t('meetings.form.body')}>
            <RichTextEditor minHeight={240} />
          </Form.Item>

          <Form.Item name="decisions" label={t('meetings.form.decisions')} extra={t('meetings.form.decisionsHint')}>
            <RichTextEditor minHeight={160} />
          </Form.Item>

          <Form.Item label={t('meetings.attachments')} extra={t('meetings.form.filesHint')}>
            <Form.Item name="attachments" noStyle>
              <AttachmentList onPreview={setPreview} />
            </Form.Item>
            <Upload accept={DOCUMENT_ACCEPT} beforeUpload={beforeUpload} showUploadList={false} multiple>
              <Button icon={<PaperClipOutlined />} loading={uploading}>
                {t('meetings.form.addFile')}
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Last, so it opens over the form when a file is checked while editing. */}
      <FilePreview file={preview} onClose={() => setPreview(null)} />
    </div>
  )
}

/**
 * Controlled by `Form.Item`: what is attached, a look at each file — so the
 * right one is checked before saving — and a way to drop one.
 */
function AttachmentList({
  value = [],
  onChange,
  onPreview,
}: {
  value?: MeetingAttachment[]
  onChange?: (value: MeetingAttachment[]) => void
  onPreview: (file: MeetingAttachment) => void
}) {
  const { t } = usePreferences()

  if (value.length === 0) {
    return null
  }

  return (
    <div className="attachment-row attachment-row--editable">
      {value.map((file) => (
        <span className="attachment-chip" key={file.url}>
          <button type="button" className="attachment-chip__open" title={t('preview.open')} onClick={() => onPreview(file)}>
            <EyeOutlined />
            <span>{file.name}</span>
          </button>
          <Text type="secondary">{formatFileSize(file.size)}</Text>
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            aria-label={t('common.remove')}
            onClick={() => onChange?.(value.filter((item) => item.url !== file.url))}
          />
        </span>
      ))}
    </div>
  )
}
