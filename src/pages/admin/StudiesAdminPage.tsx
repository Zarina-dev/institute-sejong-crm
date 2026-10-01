import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, MoreOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, AutoComplete, Avatar, Button, Card, Dropdown, Form, Input, InputNumber, Modal, Switch, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { assetUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import { useAllStudies, useCreateStudy, useDeleteStudy, useUpdateStudy } from '../../features/studies/queries'
import type { StudyAbroad } from '../../features/studies/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { ImageUploadField } from '../../shared/ImageUploadField'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

type StudyFormValues = {
  year: number
  name: string
  university?: string
  major?: string
  programme?: string
  duration?: string
  photo: string | null
  note?: string
  isPublished: boolean
}

const NO_STUDENTS: StudyAbroad[] = []

/** Suggested rather than fixed: the institute knows its own programmes. */
const PROGRAMME_SUGGESTIONS = ['정부초청장학생(GKS)', '교환학생', '어학연수', '대학 장학생', '자비 유학']
const DURATION_SUGGESTIONS = ['6개월', '1년', '2년', '4년 (학사)', '2년 (석사)']

/**
 * 한국 유학 현황 — the record of everyone the institute has sent to Korea.
 * The table is read in the order it is published: earliest year first, a new
 * student at the end. The number is the position, so there is nothing to
 * renumber when a student is added.
 */
export function StudiesAdminPage() {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions } = useTableLayout()

  const studies = useAllStudies()
  const createStudy = useCreateStudy()
  const updateStudy = useUpdateStudy()
  const deleteStudy = useDeleteStudy()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<StudyFormValues>()
  const saving = createStudy.isPending || updateStudy.isPending

  const rows = studies.data ?? NO_STUDENTS

  // What the institute has already written, offered before the defaults.
  const options = useCallback(
    (field: 'programme' | 'duration', suggestions: string[]) => {
      const used = rows.map((student) => student[field]).filter(Boolean)

      return [...new Set([...used, ...suggestions])].map((value) => ({ value }))
    },
    [rows],
  )

  const programmeOptions = useMemo(() => options('programme', PROGRAMME_SUGGESTIONS), [options])
  const durationOptions = useMemo(() => options('duration', DURATION_SUGGESTIONS), [options])

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldValue('year', new Date().getFullYear())
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (student: StudyAbroad) => {
      setEditingId(student.id)
      form.setFieldsValue({
        year: student.year,
        name: student.name,
        university: student.university,
        major: student.major,
        programme: student.programme,
        duration: student.duration,
        photo: student.photo,
        note: student.note,
        isPublished: student.isPublished,
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
        await updateStudy.mutateAsync({ id: editingId, payload: values })
        message.success(t('studies.updated'))
      } else {
        await createStudy.mutateAsync(values)
        message.success(t('studies.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('studies.saveFailed')))
    }
  }

  const handleTogglePublished = useCallback(
    (student: StudyAbroad) => {
      updateStudy.mutate(
        { id: student.id, payload: { isPublished: !student.isPublished } },
        { onError: (err) => message.error(getErrorMessage(err, t('studies.saveFailed'))) },
      )
    },
    [message, t, updateStudy],
  )

  const handleDelete = useCallback(
    (student: StudyAbroad) => {
      confirmDelete({
        target: student.name,
        onConfirm: () =>
          deleteStudy.mutateAsync(student.id).then(
            () => message.success(t('studies.deleted')),
            (err) => message.error(getErrorMessage(err, t('studies.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteStudy, message, t],
  )

  const columns = useMemo<NonNullable<TableProps<StudyAbroad>['columns']>>(
    () => [
      {
        title: t('studies.columns.number'),
        key: 'number',
        width: 64,
        align: 'center',
        render: (_, __, index) => <Text type="secondary">{index + 1}</Text>,
      },
      {
        title: t('studies.form.photo'),
        dataIndex: 'photo',
        key: 'photo',
        width: 76,
        align: 'center',
        responsive: ['sm'],
        render: (photo: string | null) => <Avatar size={44} src={photo ? assetUrl(photo) : undefined} icon={<UserOutlined />} alt="" />,
      },
      { title: t('studies.form.year'), dataIndex: 'year', key: 'year', width: 90 },
      {
        title: t('studies.form.name'),
        dataIndex: 'name',
        key: 'name',
        render: (name: string, student) => (
          <div className="cell-stack">
            <Text strong>{name}</Text>
            {student.note ? <Text type="secondary">{student.note}</Text> : null}
          </div>
        ),
      },
      {
        title: t('studies.form.university'),
        dataIndex: 'university',
        key: 'university',
        render: (university: string, student) => (
          <div className="cell-stack">
            <Text>{university || '—'}</Text>
            {student.major ? <Text type="secondary">{student.major}</Text> : null}
          </div>
        ),
      },
      {
        title: t('studies.form.programme'),
        key: 'programme',
        width: 200,
        responsive: ['lg'],
        render: (_, student) => (
          <div className="cell-stack">
            {student.programme ? <Tag color="blue">{student.programme}</Tag> : <Text type="secondary">—</Text>}
            {student.duration ? <Text type="secondary">{student.duration}</Text> : null}
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
        render: (_, student) => (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', icon: <EditOutlined />, label: t('common.edit'), onClick: () => openEditModal(student) },
                {
                  key: 'publish',
                  icon: student.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />,
                  label: student.isPublished ? t('common.unpublish') : t('common.publish'),
                  onClick: () => handleTogglePublished(student),
                },
                { type: 'divider' },
                { key: 'delete', icon: <DeleteOutlined />, label: t('common.delete'), danger: true, onClick: () => handleDelete(student) },
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
      <PageHeader kicker={t('siteNav.history')} title={t('studies.adminTitle')} description={t('studies.adminSubtitle')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>{t('studies.count', { count: rows.length })}</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('studies.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={studies.error} fallback={t('studies.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={studies.isPending}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('studies.empty') }}
        />
      </Card>

      <Modal
        title={editingId ? t('studies.editTitle') : t('studies.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={720}
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ isPublished: true, photo: null }}>
          <Form.Item name="photo" label={t('studies.form.photo')} extra={t('studies.form.photoHint')}>
            <ImageUploadField shape="square" />
          </Form.Item>

          <div className="form-row">
            <Form.Item
              name="year"
              label={t('studies.form.year')}
              extra={t('studies.form.yearHint')}
              rules={[{ required: true, message: t('studies.form.yearRequired') }]}
            >
              <InputNumber min={1990} max={2100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="name"
              label={t('studies.form.name')}
              rules={[{ required: true, whitespace: true, message: t('studies.form.nameRequired') }]}
            >
              <Input maxLength={150} placeholder="Азимова Гулжан" />
            </Form.Item>
          </div>

          <div className="form-row">
            <Form.Item name="university" label={t('studies.form.university')}>
              <Input maxLength={255} placeholder="Кёнхи унив." />
            </Form.Item>
            <Form.Item name="major" label={t('studies.form.major')}>
              <Input maxLength={255} placeholder="Менеджмент" />
            </Form.Item>
          </div>

          {/* How they went, and for how long — what the next student asks. */}
          <div className="form-row">
            <Form.Item name="programme" label={t('studies.form.programme')} extra={t('studies.form.programmeHint')}>
              <AutoComplete
                options={programmeOptions}
                placeholder="정부초청장학생(GKS)"
                filterOption={(input, option) => String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
            <Form.Item name="duration" label={t('studies.form.duration')} extra={t('studies.form.durationHint')}>
              <AutoComplete
                options={durationOptions}
                placeholder="4년 (학사)"
                filterOption={(input, option) => String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
          </div>

          <Form.Item name="note" label={t('studies.form.note')}>
            <Input maxLength={255} />
          </Form.Item>

          <Form.Item name="isPublished" label={t('courses.form.visibility')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
