import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, MinusCircleOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, Button, Card, Dropdown, Form, Input, InputNumber, Modal, Segmented, Space, Switch, Table, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { usePreferences } from '../../app/preferences'
import {
  useAllCompetitions,
  useCreateCompetition,
  useDeleteCompetition,
  useUpdateCompetition,
} from '../../features/competitions/queries'
import type { Competition, CompetitionKind, CompetitionWinner } from '../../features/competitions/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatDate } from '../../shared/format'
import { ImageListField } from '../../shared/ImageListField'
import { ImageUploadField } from '../../shared/ImageUploadField'
import { PageHeader } from '../../shared/PageHeader'
import { RichTextEditor } from '../../shared/RichTextEditor'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'
import { ALL_YEARS, YearSelect } from '../../shared/YearSelect'

const { Text } = Typography

type CompetitionFormValues = {
  kind: CompetitionKind
  title: string
  year: number
  heldOn?: string
  venue?: string
  participants?: number | null
  summary?: string
  winners?: CompetitionWinner[]
  coverImage: string | null
  images?: string[]
  albumUrl?: string | null
  isPublished: boolean
}

const NO_RECORDS: Competition[] = []

/**
 * 대회 기록 — the admin side of 말하기 대회 and 백일장. The list is filtered
 * by competition the same way the menu splits them, so the entry the admin
 * clicked is the one they land on.
 */
export function CompetitionsAdminPage() {
  const { t, language } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions } = useTableLayout()

  const competitions = useAllCompetitions()
  const createCompetition = useCreateCompetition()
  const updateCompetition = useUpdateCompetition()
  const deleteCompetition = useDeleteCompetition()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<CompetitionFormValues>()
  const saving = createCompetition.isPending || updateCompetition.isPending

  const [params, setParams] = useSearchParams()
  const requested = params.get('kind') as CompetitionKind | null
  const kind: CompetitionKind = requested === 'writing' ? 'writing' : 'speech'

  useEffect(() => {
    if (requested !== kind) {
      setParams({ kind }, { replace: true })
    }
  }, [kind, requested, setParams])

  const ofKind = useMemo(() => (competitions.data ?? NO_RECORDS).filter((record) => record.kind === kind), [competitions.data, kind])

  // Same year filter as the public page, so the admin sees what visitors see.
  const years = useMemo(() => [...new Set(ofKind.map((record) => record.year))].sort((a, b) => b - a), [ofKind])
  const [year, setYear] = useState<number | null>(null)
  const activeYear = year != null && years.includes(year) ? year : null
  const rows = useMemo(() => (activeYear == null ? ofKind : ofKind.filter((record) => record.year === activeYear)), [activeYear, ofKind])

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({ kind, year: new Date().getFullYear() })
    setModalOpen(true)
  }, [form, kind])

  const openEditModal = useCallback(
    (record: Competition) => {
      setEditingId(record.id)
      form.setFieldsValue({
        kind: record.kind,
        title: record.title,
        year: record.year,
        heldOn: record.heldOn ?? undefined,
        venue: record.venue,
        participants: record.participants,
        summary: record.summary,
        winners: record.winners,
        coverImage: record.coverImage,
        images: record.images ?? [],
        albumUrl: record.albumUrl ?? '',
        isPublished: record.isPublished,
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

    const payload = {
      ...values,
      heldOn: values.heldOn || null,
      albumUrl: values.albumUrl?.trim() || null,
      winners: (values.winners ?? []).filter((winner) => winner?.name?.trim()),
    }

    try {
      if (editingId) {
        await updateCompetition.mutateAsync({ id: editingId, payload })
        message.success(t('competitions.updated'))
      } else {
        await createCompetition.mutateAsync(payload)
        message.success(t('competitions.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('competitions.saveFailed')))
    }
  }

  const handleTogglePublished = useCallback(
    (record: Competition) => {
      updateCompetition.mutate(
        { id: record.id, payload: { isPublished: !record.isPublished } },
        { onError: (err) => message.error(getErrorMessage(err, t('competitions.saveFailed'))) },
      )
    },
    [message, t, updateCompetition],
  )

  const handleDelete = useCallback(
    (record: Competition) => {
      confirmDelete({
        target: record.title,
        onConfirm: () =>
          deleteCompetition.mutateAsync(record.id).then(
            () => message.success(t('competitions.deleted')),
            (err) => message.error(getErrorMessage(err, t('competitions.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteCompetition, message, t],
  )

  const columns = useMemo<NonNullable<TableProps<Competition>['columns']>>(
    () => [
      { title: t('competitions.form.year'), dataIndex: 'year', key: 'year', width: 90 },
      {
        title: t('competitions.form.title'),
        dataIndex: 'title',
        key: 'title',
        render: (value: string, record) => (
          <div className="cell-stack">
            <Text strong>{value}</Text>
            {record.heldOn ? <Text type="secondary">{formatDate(record.heldOn, language)}</Text> : null}
          </div>
        ),
      },
      {
        title: t('competitions.participants'),
        dataIndex: 'participants',
        key: 'participants',
        width: 100,
        align: 'center',
        responsive: ['md'],
        render: (value: number | null) => value ?? <Text type="secondary">—</Text>,
      },
      {
        title: t('competitions.winners'),
        key: 'winners',
        width: 110,
        align: 'center',
        render: (_, record) => record.winners.length || <Text type="secondary">—</Text>,
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
        render: (_, record) => (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', icon: <EditOutlined />, label: t('common.edit'), onClick: () => openEditModal(record) },
                {
                  key: 'publish',
                  icon: record.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />,
                  label: record.isPublished ? t('common.unpublish') : t('common.publish'),
                  onClick: () => handleTogglePublished(record),
                },
                { type: 'divider' },
                { key: 'delete', icon: <DeleteOutlined />, label: t('common.delete'), danger: true, onClick: () => handleDelete(record) },
              ],
            }}
          >
            <Button size="small" icon={<MoreOutlined />} aria-label={t('common.actions')} />
          </Dropdown>
        ),
      },
    ],
    [handleDelete, handleTogglePublished, language, openEditModal, pinActions, t],
  )

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('competitions.adminTitle')}
        title={t(kind === 'speech' ? 'competitions.speechTitle' : 'competitions.writingTitle')}
        description={t('competitions.adminSubtitle')}
      />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Segmented
            value={kind}
            onChange={(value) => setParams({ kind: value as CompetitionKind })}
            options={[
              { value: 'speech', label: t('competitions.speechTitle') },
              { value: 'writing', label: t('competitions.writingTitle') },
            ]}
          />
          <Space wrap>
            {years.length > 1 ? (
              <YearSelect
                years={years}
                value={activeYear}
                onChange={(value) => setYear(value === ALL_YEARS ? null : Number(value))}
                allowAll
              />
            ) : null}
            <Text>{t('competitions.count', { count: rows.length })}</Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              {t('competitions.add')}
            </Button>
          </Space>
        </div>
      </Card>

      <ErrorAlert error={competitions.error} fallback={t('competitions.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={competitions.isPending}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('competitions.empty') }}
        />
      </Card>

      <Modal
        title={editingId ? t('competitions.editTitle') : t('competitions.addTitle')}
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
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ kind, isPublished: true, coverImage: null, images: [], winners: [] }}>
          <Form.Item name="kind" label={t('competitions.form.kind')}>
            <Segmented
              options={[
                { value: 'speech', label: t('competitions.speechTitle') },
                { value: 'writing', label: t('competitions.writingTitle') },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label={t('competitions.form.title')}
            rules={[{ required: true, whitespace: true, message: t('competitions.form.titleRequired') }]}
          >
            <Input maxLength={255} placeholder="제10회 한국어 말하기 대회" />
          </Form.Item>

          <div className="form-row">
            <Form.Item name="year" label={t('competitions.form.year')} rules={[{ required: true, message: t('competitions.form.yearRequired') }]}>
              <InputNumber min={1990} max={2100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="heldOn" label={t('competitions.form.heldOn')}>
              <Input type="date" />
            </Form.Item>
            <Form.Item name="participants" label={t('competitions.form.participants')}>
              <InputNumber min={0} max={10000} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item name="venue" label={t('competitions.form.venue')}>
            <Input maxLength={255} />
          </Form.Item>

          <Form.Item name="coverImage" label={t('competitions.form.cover')}>
            <ImageUploadField shape="wide" />
          </Form.Item>

          <Form.Item name="images" label={t('competitions.form.photos')} extra={t('upload.listHint')}>
            <ImageListField disabled={saving} />
          </Form.Item>

          <Form.Item name="summary" label={t('competitions.form.summary')} extra={t('competitions.form.summaryHint')}>
            <RichTextEditor minHeight={220} />
          </Form.Item>

          {/* 수상자 — the results table, one row per place. */}
          <Form.Item label={t('competitions.form.winners')}>
            <Form.List name="winners">
              {(fields, { add, remove }) => (
                <div className="winner-rows">
                  {fields.map((field) => (
                    <div className="winner-row" key={field.key}>
                      <Form.Item name={[field.name, 'rank']} rules={[{ required: true, message: t('competitions.rank') }]} noStyle>
                        <InputNumber min={1} max={99} placeholder={t('competitions.rank')} />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'name']}
                        rules={[{ required: true, whitespace: true, message: t('competitions.form.winnerName') }]}
                        noStyle
                      >
                        <Input placeholder={t('competitions.form.winnerName')} maxLength={150} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'note']} noStyle>
                        <Input placeholder={t('competitions.form.winnerNote')} maxLength={255} />
                      </Form.Item>
                      <Button type="text" icon={<MinusCircleOutlined />} aria-label={t('common.remove')} onClick={() => remove(field.name)} />
                    </div>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ rank: fields.length + 1, name: '', note: '' })} block>
                    {t('competitions.form.addWinner')}
                  </Button>
                </div>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item name="albumUrl" label={t('competitions.form.album')}>
            <Input placeholder="https://photos.app.goo.gl/…" maxLength={500} />
          </Form.Item>

          <Form.Item name="isPublished" label={t('competitions.form.visibility')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
