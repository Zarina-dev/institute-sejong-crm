import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  FileOutlined,
  LockOutlined,
  PaperClipOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Alert, App, Button, Card, Empty, Form, Input, Modal, Skeleton, Space, Tag, Typography, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { assetUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import { useCreateMeeting, useDeleteMeeting, useMeetings, useUpdateMeeting } from '../../features/meetings/queries'
import type { Meeting, MeetingAttachment } from '../../features/meetings/types'
import { DOCUMENT_ACCEPT, MAX_DOCUMENT_SIZE, uploadDocument } from '../../features/uploads/api'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatDate, formatFileSize } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'
import { RichContent } from '../../shared/RichContent'
import { RichTextEditor } from '../../shared/RichTextEditor'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { YearSelect } from '../../shared/YearSelect'

const { Title, Text } = Typography

type MeetingFormValues = {
  title: string
  heldOn: string
  attendees?: string
  body?: string
  decisions?: string
  attachments?: MeetingAttachment[]
}

const NO_MEETINGS: Meeting[] = []

/** ISO week number — the minutes are written weekly, so each one is labelled with its week. */
function weekOfYear(date: string): number {
  const day = new Date(`${date}T00:00:00Z`)
  const thursday = new Date(day)
  thursday.setUTCDate(day.getUTCDate() + 3 - ((day.getUTCDay() + 6) % 7))
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4))
  const diff = thursday.getTime() - firstThursday.getTime()

  return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000) - ((firstThursday.getUTCDay() + 6) % 7) / 7)
}

/**
 * 회의록 — weekly minutes, read one year at a time. Each entry shows what was
 * discussed, what was decided and the files handed out (usually .hwp).
 * Nothing here is published to the site.
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
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm<MeetingFormValues>()
  const saving = createMeeting.isPending || updateMeeting.isPending

  const all = meetings.data ?? NO_MEETINGS

  const years = useMemo(() => [...new Set(all.map((meeting) => meeting.heldOn.slice(0, 4)))].sort().reverse(), [all])
  const [year, setYear] = useState<string | null>(null)
  const activeYear = year && years.includes(year) ? year : years[0] ?? null
  const rows = useMemo(() => all.filter((meeting) => meeting.heldOn.startsWith(activeYear ?? '')), [activeYear, all])

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ heldOn: new Date().toISOString().slice(0, 10), attachments: [] })
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (meeting: Meeting) => {
      setEditingId(meeting.id)
      form.setFieldsValue({
        title: meeting.title,
        heldOn: meeting.heldOn,
        attendees: meeting.attendees,
        body: meeting.body,
        decisions: meeting.decisions,
        attachments: meeting.attachments ?? [],
      })
      setModalOpen(true)
    },
    [form],
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
    (meeting: Meeting) => {
      confirmDelete({
        target: meeting.title,
        onConfirm: () =>
          deleteMeeting.mutateAsync(meeting.id).then(
            () => message.success(t('meetings.deleted')),
            (err) => message.error(getErrorMessage(err, t('meetings.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteMeeting, message, t],
  )

  /**
   * The file is uploaded as soon as it is picked and only its stored path
   * travels with the form — the same shape the images use.
   */
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
          {years.length > 1 ? (
            <Space size={12}>
              <YearSelect years={years} value={activeYear} onChange={setYear} />
              <Text type="secondary">{t('meetings.count', { count: rows.length })}</Text>
            </Space>
          ) : (
            <Text>{t('meetings.count', { count: rows.length })}</Text>
          )}

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
            <Card className="surface-card meeting-card" key={meeting.id}>
              <div className="meeting-card__head">
                <div>
                  <Tag className="meeting-card__week">{t('meetings.week', { week: weekOfYear(meeting.heldOn) })}</Tag>
                  <Title level={3}>{meeting.title}</Title>
                  <ul className="meeting-card__facts">
                    <li>
                      <CalendarOutlined /> {formatDate(meeting.heldOn, language)}
                    </li>
                    {meeting.attendees ? (
                      <li>
                        <TeamOutlined /> {meeting.attendees}
                      </li>
                    ) : null}
                  </ul>
                </div>

                <div className="meeting-card__actions">
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(meeting)}>
                    {t('common.edit')}
                  </Button>
                  <Button size="small" danger icon={<DeleteOutlined />} aria-label={t('common.delete')} onClick={() => handleDelete(meeting)} />
                </div>
              </div>

              {meeting.body ? (
                <section>
                  <Text className="section-kicker">{t('meetings.notes')}</Text>
                  <RichContent html={meeting.body} />
                </section>
              ) : null}

              <section className="meeting-card__decisions">
                <Text className="section-kicker">{t('meetings.decisions')}</Text>
                {meeting.decisions ? <RichContent html={meeting.decisions} /> : <Text type="secondary">{t('meetings.noDecisions')}</Text>}
              </section>

              {meeting.attachments?.length ? (
                <section className="meeting-card__files">
                  <Text className="section-kicker">{t('meetings.attachments')}</Text>
                  <div className="attachment-row">
                    {meeting.attachments.map((file) => (
                      <a className="attachment-chip" key={file.url} href={assetUrl(file.url)} download={file.name}>
                        <FileOutlined />
                        <span>{file.name}</span>
                        <Text type="secondary">{formatFileSize(file.size)}</Text>
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('meetings.empty')} />
        </Card>
      )}

      <Modal
        title={editingId ? t('meetings.editTitle') : t('meetings.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={860}
        className="editor-modal"
      >
        <Form form={form} layout="vertical" disabled={saving}>
          <Form.Item
            name="title"
            label={t('meetings.form.title')}
            rules={[{ required: true, whitespace: true, message: t('meetings.form.titleRequired') }]}
          >
            <Input maxLength={255} />
          </Form.Item>

          <div className="form-row">
            <Form.Item name="heldOn" label={t('meetings.form.heldOn')} rules={[{ required: true, message: t('meetings.form.heldOnRequired') }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="attendees" label={t('meetings.form.attendees')} extra={t('meetings.form.attendeesHint')}>
              <Input maxLength={500} />
            </Form.Item>
          </div>

          <Form.Item name="body" label={t('meetings.form.body')}>
            <RichTextEditor minHeight={260} />
          </Form.Item>

          <Form.Item name="decisions" label={t('meetings.form.decisions')} extra={t('meetings.form.decisionsHint')}>
            <RichTextEditor minHeight={180} />
          </Form.Item>

          {/* Files are uploaded on pick; the form only carries their paths. */}
          <Form.Item label={t('meetings.attachments')} extra={t('meetings.form.filesHint')}>
            <Form.Item name="attachments" noStyle>
              <AttachmentList />
            </Form.Item>
            <Upload accept={DOCUMENT_ACCEPT} beforeUpload={beforeUpload} showUploadList={false} multiple>
              <Button icon={<PaperClipOutlined />} loading={uploading}>
                {t('meetings.form.addFile')}
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

/** Controlled by `Form.Item`: shows what is attached and lets a file be dropped. */
function AttachmentList({ value = [], onChange }: { value?: MeetingAttachment[]; onChange?: (value: MeetingAttachment[]) => void }) {
  const { t } = usePreferences()

  if (value.length === 0) {
    return null
  }

  return (
    <div className="attachment-row attachment-row--editable">
      {value.map((file) => (
        <span className="attachment-chip" key={file.url}>
          <FileOutlined />
          <span>{file.name}</span>
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
