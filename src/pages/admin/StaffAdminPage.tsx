import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { TableProps } from 'antd'
import { App, Avatar, Button, Card, Form, Input, Modal, Space, Switch, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { assetUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import { useAllStaff, useCreateStaff, useDeleteStaff, useReorderStaff, useUpdateStaff } from '../../features/staff/queries'
import { staffStatus } from '../../features/staff/status'
import type { StaffMember } from '../../features/staff/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { ImageUploadField } from '../../shared/ImageUploadField'
import { PageHeader } from '../../shared/PageHeader'
import { DragHandle, SortableRow } from '../../shared/SortableRow'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

type StaffFormValues = {
  name: string
  position: string
  bio?: string
  email?: string
  photoUrl: string | null
  sortOrder: number
  isPublished: boolean
  startDate?: string
  endDate?: string
}

const NO_STAFF: StaffMember[] = []

const STATUS_LABEL = { current: 'staff.current', upcoming: 'staff.upcoming', former: 'staff.former' } as const
const STATUS_COLOUR = { current: 'green', upcoming: 'blue', former: 'default' } as const

/** Admin CRUD for the people shown on the About page. */
export function StaffAdminPage() {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions, compactActions } = useTableLayout()

  const staff = useAllStaff()
  const createStaff = useCreateStaff()
  const updateStaff = useUpdateStaff()
  const deleteStaff = useDeleteStaff()
  const reorderStaff = useReorderStaff()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<StaffFormValues>()
  const saving = createStaff.isPending || updateStaff.isPending

  // Those who have left go to the bottom, in their own order — as soon as
  // their last day has passed, since the status is read off the dates. The
  // dragged order applies within each group, and saving it keeps them there.
  const rows = useMemo(() => {
    const all = staff.data ?? NO_STAFF
    return [...all.filter((member) => staffStatus(member) !== 'former'), ...all.filter((member) => staffStatus(member) === 'former')]
  }, [staff.data])
  const rowIds = useMemo(() => rows.map((member) => member.id), [rows])

  // A small distance threshold keeps a plain click on the handle from starting a drag.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) {
        return
      }

      const next = arrayMove(rowIds, rowIds.indexOf(String(active.id)), rowIds.indexOf(String(over.id)))

      reorderStaff.mutate(next, {
        onSuccess: () => message.success(t('staff.reordered')),
        onError: (err) => message.error(getErrorMessage(err, t('staff.reorderFailed'))),
      })
    },
    [message, reorderStaff, rowIds, t],
  )

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    // Order is set by dragging rows, not typed in — a new member goes last.
    form.setFieldValue('sortOrder', rows.length ? Math.max(...rows.map((member) => member.sortOrder)) + 1 : 0)
    setModalOpen(true)
  }, [form, rows])

  const openEditModal = useCallback(
    (member: StaffMember) => {
      setEditingId(member.id)
      form.setFieldsValue({
        name: member.name,
        position: member.position,
        bio: member.bio,
        email: member.email ?? '',
        photoUrl: member.photoUrl,
        sortOrder: member.sortOrder,
        isPublished: member.isPublished,
        startDate: member.startDate ?? undefined,
        endDate: member.endDate ?? undefined,
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

    // A cleared date input gives '' — sent as null, which clears the date.
    const payload = {
      ...values,
      email: values.email?.trim() || null,
      bio: values.bio ?? '',
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    }

    try {
      if (editingId) {
        await updateStaff.mutateAsync({ id: editingId, payload })
        message.success(t('staff.updated'))
      } else {
        await createStaff.mutateAsync(payload)
        message.success(t('staff.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('staff.saveFailed')))
    }
  }

  const handleTogglePublished = useCallback(
    (member: StaffMember) => {
      updateStaff.mutate(
        { id: member.id, payload: { isPublished: !member.isPublished } },
        { onError: (err) => message.error(getErrorMessage(err, t('staff.saveFailed'))) },
      )
    },
    [message, t, updateStaff],
  )

  const handleDelete = useCallback(
    (member: StaffMember) => {
      confirmDelete({
        target: member.name,
        onConfirm: () =>
          deleteStaff.mutateAsync(member.id).then(
            () => message.success(t('staff.deleted')),
            (err) => message.error(getErrorMessage(err, t('staff.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteStaff, message, t],
  )

  const columns = useMemo<NonNullable<TableProps<StaffMember>['columns']>>(
    () => [
      {
        key: 'drag',
        width: 44,
        align: 'center',
        render: () => <DragHandle label={t('staff.dragHandle')} />,
      },
      {
        title: t('staff.columns.member'),
        dataIndex: 'name',
        key: 'name',
        render: (value: string, member) => (
          <Space size={10}>
            <Avatar size={40} src={member.photoUrl ? assetUrl(member.photoUrl) : undefined} icon={<UserOutlined />} />
            <span>
              <strong>{value}</strong>
              {member.email ? (
                <>
                  <br />
                  <Text type="secondary">{member.email}</Text>
                </>
              ) : null}
            </span>
          </Space>
        ),
      },
      {
        title: t('staff.columns.position'),
        dataIndex: 'position',
        key: 'position',
        responsive: ['md'],
      },
      {
        // 재직 중 · 입사 예정 · 퇴직, read off the dates — what visitors see on
        // the card, which is not the same as whether the card is shown.
        title: t('staff.columns.employment'),
        key: 'employment',
        width: 190,
        render: (_, member) => {
          const status = staffStatus(member)

          return (
            <div className="cell-stack">
              <Tag color={STATUS_COLOUR[status]}>{t(STATUS_LABEL[status])}</Tag>
              {member.startDate ? (
                <Text type="secondary">
                  {member.startDate} ~ {member.endDate ?? ''}
                </Text>
              ) : null}
            </div>
          )
        },
      },
      {
        title: t('staff.columns.status'),
        dataIndex: 'isPublished',
        key: 'isPublished',
        width: 120,
        render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? t('common.published') : t('staff.hidden')}</Tag>,
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: pinActions,
        width: compactActions ? 120 : 260,
        render: (_, member) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} aria-label={t('common.edit')} onClick={() => openEditModal(member)}>
              {compactActions ? null : t('common.edit')}
            </Button>
            <Button
              size="small"
              icon={member.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              loading={updateStaff.isPending && updateStaff.variables?.id === member.id}
              onClick={() => handleTogglePublished(member)}
              aria-label={member.isPublished ? t('common.unpublish') : t('common.publish')}
            >
              {compactActions ? null : member.isPublished ? t('common.unpublish') : t('common.publish')}
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={t('common.delete')} onClick={() => handleDelete(member)}>
              {compactActions ? null : t('common.delete')}
            </Button>
          </Space>
        ),
      },
    ],
    [compactActions, handleDelete, handleTogglePublished, openEditModal, pinActions, t, updateStaff.isPending, updateStaff.variables?.id],
  )

  return (
    <div className="page-layout">
      <PageHeader kicker={t('common.admin')} title={t('staff.adminTitle')} description={t('staff.adminSubtitle')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>{t('staff.count', { count: rows.length })}</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('staff.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={staff.error} fallback={t('staff.loadFailed')} />

      <Card className="surface-card">
        <Text type="secondary" className="table-hint">
          {t('staff.dragHint')}
        </Text>
        <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            <Table
              className="admin-table staff-table"
              components={{ body: { row: SortableRow } }}
              columns={columns}
              dataSource={rows}
              rowKey="id"
              loading={staff.isPending}
              pagination={false}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: t('staff.empty') }}
            />
          </SortableContext>
        </DndContext>
      </Card>

      <Modal
        title={editingId ? t('staff.editTitle') : t('staff.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={640}
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ isPublished: true, sortOrder: 0, photoUrl: null }}>
          <Form.Item name="photoUrl" label={t('staff.form.photo')}>
            <ImageUploadField shape="square" hint={t('staff.form.photoHint')} />
          </Form.Item>
          <Form.Item name="name" label={t('staff.form.name')} rules={[{ required: true, whitespace: true, message: t('staff.form.nameRequired') }]}>
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item name="position" label={t('staff.form.position')} rules={[{ required: true, whitespace: true, message: t('staff.form.positionRequired') }]}>
            <Input maxLength={160} />
          </Form.Item>
          <Form.Item name="bio" label={t('staff.form.bio')}>
            <Input.TextArea rows={4} maxLength={4000} showCount />
          </Form.Item>
          <Form.Item name="email" label={t('staff.form.email')} rules={[{ type: 'email', message: t('staff.form.emailInvalid') }]}>
            <Input type="email" maxLength={255} />
          </Form.Item>
          {/* Whether they work here follows from these two dates — a start
              ahead is 입사 예정, an end behind is 퇴직 — so it turns over on
              the day by itself. Leaving never removes anyone from the page. */}
          <div className="form-row">
            <Form.Item name="startDate" label={t('staff.form.startDate')} extra={t('staff.form.startHint')}>
              <Input type="date" />
            </Form.Item>
            <Form.Item
              name="endDate"
              label={t('staff.form.endDate')}
              extra={t('staff.form.endHint')}
              dependencies={['startDate']}
              rules={[
                ({ getFieldValue }) => ({
                  validator: (_, value?: string) =>
                    !value || !getFieldValue('startDate') || value >= getFieldValue('startDate')
                      ? Promise.resolve()
                      : Promise.reject(new Error(t('staff.form.endBeforeStart'))),
                }),
              ]}
            >
              <Input type="date" />
            </Form.Item>
          </div>
          <Form.Item name="isPublished" label={t('staff.form.published')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
