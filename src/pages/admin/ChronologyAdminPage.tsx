import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, FlagFilled, MoreOutlined, PlusOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, Button, Card, Dropdown, Form, Input, InputNumber, Modal, Space, Switch, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { usePreferences } from '../../app/preferences'
import {
  useAllChronology,
  useCreateChronologyEntry,
  useDeleteChronologyEntry,
  useUpdateChronologyEntry,
} from '../../features/chronology/queries'
import type { ChronologyEntry } from '../../features/chronology/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

type ChronologyFormValues = {
  year: number
  month?: number | null
  day?: number | null
  title: string
  description?: string
  isMilestone: boolean
  isPublished: boolean
}

const NO_ENTRIES: ChronologyEntry[] = []

/**
 * 연혁 — the admin side of the timeline on 학당 소개. The month and the day
 * are optional on purpose: an institute knows the year of everything, the
 * month of most things and the day of a few.
 */
export function ChronologyAdminPage() {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions } = useTableLayout()

  const chronology = useAllChronology()
  const createEntry = useCreateChronologyEntry()
  const updateEntry = useUpdateChronologyEntry()
  const deleteEntry = useDeleteChronologyEntry()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<ChronologyFormValues>()
  const saving = createEntry.isPending || updateEntry.isPending

  const rows = chronology.data ?? NO_ENTRIES

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (entry: ChronologyEntry) => {
      setEditingId(entry.id)
      form.setFieldsValue({
        year: entry.year,
        month: entry.month,
        day: entry.day,
        title: entry.title,
        description: entry.description,
        isMilestone: entry.isMilestone,
        isPublished: entry.isPublished,
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

    const payload = { ...values, month: values.month ?? null, day: values.day ?? null }

    try {
      if (editingId) {
        await updateEntry.mutateAsync({ id: editingId, payload })
        message.success(t('chronology.updated'))
      } else {
        await createEntry.mutateAsync(payload)
        message.success(t('chronology.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('chronology.saveFailed')))
    }
  }

  const handleTogglePublished = useCallback(
    (entry: ChronologyEntry) => {
      updateEntry.mutate(
        { id: entry.id, payload: { isPublished: !entry.isPublished } },
        { onError: (err) => message.error(getErrorMessage(err, t('chronology.saveFailed'))) },
      )
    },
    [message, t, updateEntry],
  )

  const handleDelete = useCallback(
    (entry: ChronologyEntry) => {
      confirmDelete({
        target: entry.title,
        onConfirm: () =>
          deleteEntry.mutateAsync(entry.id).then(
            () => message.success(t('chronology.deleted')),
            (err) => message.error(getErrorMessage(err, t('chronology.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteEntry, message, t],
  )

  const columns = useMemo<NonNullable<TableProps<ChronologyEntry>['columns']>>(
    () => [
      {
        title: t('chronology.form.date'),
        key: 'date',
        width: 130,
        render: (_, entry) => (
          <Text strong className="chronology-date">
            {entry.year}
            {entry.month ? `. ${String(entry.month).padStart(2, '0')}` : ''}
            {entry.day ? `. ${String(entry.day).padStart(2, '0')}` : ''}
          </Text>
        ),
      },
      {
        title: t('chronology.form.title'),
        key: 'title',
        render: (_, entry) => (
          <div className="cell-stack">
            <Space size={6}>
              {entry.isMilestone ? <FlagFilled style={{ color: 'var(--color-primary)' }} aria-label={t('chronology.milestone')} /> : null}
              <Text strong>{entry.title}</Text>
            </Space>
            {entry.description ? <Text type="secondary">{entry.description}</Text> : null}
          </div>
        ),
      },
      {
        title: t('courses.columns.visibility'),
        dataIndex: 'isPublished',
        key: 'isPublished',
        width: 110,
        render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? t('common.published') : t('staff.hidden')}</Tag>,
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: pinActions,
        width: 90,
        align: 'center',
        render: (_, entry) => (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', icon: <EditOutlined />, label: t('common.edit'), onClick: () => openEditModal(entry) },
                {
                  key: 'publish',
                  icon: entry.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />,
                  label: entry.isPublished ? t('common.unpublish') : t('common.publish'),
                  onClick: () => handleTogglePublished(entry),
                },
                { type: 'divider' },
                { key: 'delete', icon: <DeleteOutlined />, label: t('common.delete'), danger: true, onClick: () => handleDelete(entry) },
              ],
            }}
          >
            <Button size="small" icon={<MoreOutlined />} aria-label={t('common.actions')} />
          </Dropdown>
        ),
      },
    ],
    [handleDelete, handleTogglePublished, openEditModal, pinActions, t],
  )

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.about')} title={t('chronology.adminTitle')} description={t('chronology.adminSubtitle')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>{t('chronology.count', { count: rows.length })}</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('chronology.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={chronology.error} fallback={t('chronology.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={chronology.isPending}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('chronology.empty') }}
        />
      </Card>

      <Modal
        title={editingId ? t('chronology.editTitle') : t('chronology.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={620}
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ isPublished: true, isMilestone: false }}>
          {/* Year required, month and day only where the institute knows them. */}
          <div className="form-row">
            <Form.Item name="year" label={t('chronology.form.year')} rules={[{ required: true, message: t('chronology.form.yearRequired') }]}>
              <InputNumber min={1900} max={2100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="month" label={t('chronology.form.month')}>
              <InputNumber min={1} max={12} placeholder="—" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="day" label={t('chronology.form.day')}>
              <InputNumber min={1} max={31} placeholder="—" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="title"
            label={t('chronology.form.title')}
            rules={[{ required: true, whitespace: true, message: t('chronology.form.titleRequired') }]}
          >
            <Input maxLength={255} placeholder={t('chronology.form.titlePlaceholder')} />
          </Form.Item>

          <Form.Item name="description" label={t('chronology.form.description')}>
            <Input.TextArea rows={3} maxLength={2000} showCount />
          </Form.Item>

          <div className="form-row">
            <Form.Item name="isMilestone" label={t('chronology.milestone')} extra={t('chronology.milestoneHint')} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isPublished" label={t('courses.form.visibility')} valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
