import { BookOutlined, DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, LinkOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { App, Button, Card, Dropdown, Form, Input, Modal, Space, Switch, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { assetUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import { useAllTextbooks, useCreateTextbook, useDeleteTextbook, useReorderTextbooks, useUpdateTextbook } from '../../features/textbooks/queries'
import type { Textbook } from '../../features/textbooks/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { ImageUploadField } from '../../shared/ImageUploadField'
import { PageHeader } from '../../shared/PageHeader'
import { DragHandle, SortableRow } from '../../shared/SortableRow'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

type TextbookFormValues = {
  title: string
  description?: string
  coverImage: string | null
  purchasePlace?: string
  purchaseUrl?: string | null
  isPublished: boolean
}

const NO_TEXTBOOKS: Textbook[] = []

/**
 * 교재 안내 — every textbook is registered through the same four questions
 * (cover, title, description, where to buy), so the public page can present
 * them all in one style.
 */
export function TextbooksAdminPage() {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions } = useTableLayout()

  const textbooks = useAllTextbooks()
  const createTextbook = useCreateTextbook()
  const updateTextbook = useUpdateTextbook()
  const deleteTextbook = useDeleteTextbook()
  const reorderTextbooks = useReorderTextbooks()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<TextbookFormValues>()
  const saving = createTextbook.isPending || updateTextbook.isPending

  const rows = textbooks.data ?? NO_TEXTBOOKS
  const rowIds = useMemo(() => rows.map((textbook) => textbook.id), [rows])

  // A small distance threshold keeps a plain click on the handle from starting a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) {
        return
      }

      const next = arrayMove(rowIds, rowIds.indexOf(String(active.id)), rowIds.indexOf(String(over.id)))

      reorderTextbooks.mutate(next, {
        onSuccess: () => message.success(t('textbooks.reordered')),
        onError: (err) => message.error(getErrorMessage(err, t('textbooks.reorderFailed'))),
      })
    },
    [message, reorderTextbooks, rowIds, t],
  )

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (textbook: Textbook) => {
      setEditingId(textbook.id)
      form.setFieldsValue({
        title: textbook.title,
        description: textbook.description,
        coverImage: textbook.coverImage,
        purchasePlace: textbook.purchasePlace,
        purchaseUrl: textbook.purchaseUrl ?? '',
        isPublished: textbook.isPublished,
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

    const payload = { ...values, purchaseUrl: values.purchaseUrl?.trim() || null, description: values.description ?? '' }

    try {
      if (editingId) {
        await updateTextbook.mutateAsync({ id: editingId, payload })
        message.success(t('textbooks.updated'))
      } else {
        await createTextbook.mutateAsync(payload)
        message.success(t('textbooks.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('textbooks.saveFailed')))
    }
  }

  const handleTogglePublished = useCallback(
    (textbook: Textbook) => {
      updateTextbook.mutate(
        { id: textbook.id, payload: { isPublished: !textbook.isPublished } },
        { onError: (err) => message.error(getErrorMessage(err, t('textbooks.saveFailed'))) },
      )
    },
    [message, t, updateTextbook],
  )

  const handleDelete = useCallback(
    (textbook: Textbook) => {
      confirmDelete({
        target: textbook.title,
        onConfirm: () =>
          deleteTextbook.mutateAsync(textbook.id).then(
            () => message.success(t('textbooks.deleted')),
            (err) => message.error(getErrorMessage(err, t('textbooks.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteTextbook, message, t],
  )

  const columns = useMemo<NonNullable<TableProps<Textbook>['columns']>>(
    () => [
      {
        key: 'drag',
        width: 44,
        align: 'center',
        render: () => <DragHandle label={t('staff.dragHandle')} />,
      },
      {
        title: t('textbooks.columns.textbook'),
        dataIndex: 'title',
        key: 'title',
        render: (value: string, textbook) => (
          <Space size={12}>
            {textbook.coverImage ? (
              <img className="textbook-thumb" src={assetUrl(textbook.coverImage)} alt="" />
            ) : (
              <span className="textbook-thumb textbook-thumb--empty" aria-hidden="true">
                <BookOutlined />
              </span>
            )}
            <span>
              <strong>{value}</strong>
              <br />
              <Text type="secondary" className="textbook-row__description">
                {textbook.description || t('textbooks.noDescription')}
              </Text>
            </span>
          </Space>
        ),
      },
      {
        title: t('textbooks.form.purchasePlace'),
        key: 'purchase',
        width: 220,
        responsive: ['md'],
        render: (_, textbook) =>
          textbook.purchaseUrl ? (
            <a href={textbook.purchaseUrl} target="_blank" rel="noopener noreferrer">
              <LinkOutlined /> {textbook.purchasePlace || textbook.purchaseUrl}
            </a>
          ) : (
            textbook.purchasePlace || <Text type="secondary">—</Text>
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
        render: (_, textbook) => (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', icon: <EditOutlined />, label: t('common.edit'), onClick: () => openEditModal(textbook) },
                {
                  key: 'publish',
                  icon: textbook.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />,
                  label: textbook.isPublished ? t('common.unpublish') : t('common.publish'),
                  onClick: () => handleTogglePublished(textbook),
                },
                { type: 'divider' },
                { key: 'delete', icon: <DeleteOutlined />, label: t('common.delete'), danger: true, onClick: () => handleDelete(textbook) },
              ],
            }}
          >
            <Button
              size="small"
              icon={<MoreOutlined />}
              aria-label={t('common.actions')}
              loading={updateTextbook.isPending && updateTextbook.variables?.id === textbook.id}
            />
          </Dropdown>
        ),
      },
    ],
    [handleDelete, handleTogglePublished, openEditModal, pinActions, t, updateTextbook.isPending, updateTextbook.variables?.id],
  )

  return (
    <div className="page-layout">
      <PageHeader kicker={t('common.admin')} title={t('textbooks.adminTitle')} description={t('textbooks.adminSubtitle')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>{t('textbooks.count', { count: rows.length })}</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('textbooks.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={textbooks.error} fallback={t('textbooks.loadFailed')} />

      <Card className="surface-card">
        <Text type="secondary" className="table-hint">
          {t('textbooks.dragHint')}
        </Text>
        <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            <Table
              className="admin-table staff-table"
              components={{ body: { row: SortableRow } }}
              columns={columns}
              dataSource={rows}
              rowKey="id"
              loading={textbooks.isPending}
              pagination={false}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: t('textbooks.empty') }}
            />
          </SortableContext>
        </DndContext>
      </Card>

      <Modal
        title={editingId ? t('textbooks.editTitle') : t('textbooks.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={640}
      >
        {/* The same four questions for every textbook — that is what keeps
            the public page uniform. */}
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ isPublished: true, coverImage: null }}>
          <Form.Item name="coverImage" label={t('textbooks.form.cover')}>
            <ImageUploadField shape="wide" hint={t('textbooks.form.coverHint')} />
          </Form.Item>
          <Form.Item name="title" label={t('textbooks.form.title')} rules={[{ required: true, whitespace: true, message: t('textbooks.form.titleRequired') }]}>
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="description" label={t('textbooks.form.description')} extra={t('textbooks.form.descriptionHint')}>
            <Input.TextArea rows={4} maxLength={4000} showCount />
          </Form.Item>
          <Form.Item name="purchasePlace" label={t('textbooks.form.purchasePlace')} extra={t('textbooks.form.purchasePlaceHint')}>
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="purchaseUrl" label={t('textbooks.form.purchaseUrl')}>
            <Input placeholder="https://" maxLength={500} />
          </Form.Item>
          <Form.Item name="isPublished" label={t('textbooks.form.published')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
