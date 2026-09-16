import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, Avatar, Button, Card, Form, Input, InputNumber, Modal, Space, Switch, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { assetUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import { useAllStaff, useCreateStaff, useDeleteStaff, useUpdateStaff } from '../../features/staff/queries'
import type { StaffMember } from '../../features/staff/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { ImageUploadField } from '../../shared/ImageUploadField'
import { PageHeader } from '../../shared/PageHeader'
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
}

const NO_STAFF: StaffMember[] = []

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

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<StaffFormValues>()
  const saving = createStaff.isPending || updateStaff.isPending

  const rows = staff.data ?? NO_STAFF

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    // New members go to the end of the list by default.
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

    const payload = { ...values, email: values.email?.trim() || null, bio: values.bio ?? '' }

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
        title: t('staff.columns.order'),
        dataIndex: 'sortOrder',
        key: 'sortOrder',
        width: 90,
        align: 'center',
        responsive: ['lg'],
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
        <Table
          className="admin-table"
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={staff.isPending}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('staff.empty') }}
        />
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
          <Form.Item name="sortOrder" label={t('staff.form.sortOrder')} extra={t('staff.form.sortOrderHint')}>
            <InputNumber min={0} max={999} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="isPublished" label={t('staff.form.published')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
