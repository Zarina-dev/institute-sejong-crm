import { CalendarOutlined, DeleteOutlined, EditOutlined, LockOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Empty, Form, Input, Modal, Skeleton, Typography } from 'antd'
import { useCallback, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import { useCreateMeeting, useDeleteMeeting, useMeetings, useUpdateMeeting } from '../../features/meetings/queries'
import type { Meeting } from '../../features/meetings/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatDate } from '../../shared/format'
import { PageHeader } from '../../shared/PageHeader'
import { RichContent } from '../../shared/RichContent'
import { RichTextEditor } from '../../shared/RichTextEditor'
import { useConfirmDelete } from '../../shared/useConfirmDelete'

const { Title, Text } = Typography

type MeetingFormValues = {
  title: string
  heldOn: string
  attendees?: string
  body?: string
  decisions?: string
}

const NO_MEETINGS: Meeting[] = []

/**
 * 회의록 — minutes of staff meetings. They are read as a diary rather than a
 * table: each entry shows what was discussed and what was decided, newest
 * first. Nothing here is published to the site.
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
  const [form] = Form.useForm<MeetingFormValues>()
  const saving = createMeeting.isPending || updateMeeting.isPending

  const rows = meetings.data ?? NO_MEETINGS

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldValue('heldOn', new Date().toISOString().slice(0, 10))
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

  return (
    <div className="page-layout">
      <PageHeader kicker={t('adminNav.meetingsSection')} title={t('meetings.adminTitle')} description={t('meetings.adminSubtitle')} />

      <Alert type="info" showIcon icon={<LockOutlined />} message={t('meetings.internalOnly')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>{t('meetings.count', { count: rows.length })}</Text>
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
        </Form>
      </Modal>
    </div>
  )
}
