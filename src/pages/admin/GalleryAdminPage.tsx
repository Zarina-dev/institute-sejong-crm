import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, LinkOutlined, PictureOutlined, PlusOutlined } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, Button, Card, Col, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Table, Tag, Typography } from 'antd'
import { useCallback, useMemo, useState } from 'react'

import { assetUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import { useAllAlbums, useCreateAlbum, useDeleteAlbum, useUpdateAlbum } from '../../features/gallery/queries'
import { EVENT_TAGS, type EventTag, type GalleryAlbum } from '../../features/gallery/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { ImageUploadField } from '../../shared/ImageUploadField'
import { PageHeader } from '../../shared/PageHeader'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

type AlbumFormValues = {
  year: number
  title: string
  eventTag: EventTag
  description?: string
  albumUrl?: string | null
  coverImage: string | null
  heldOn?: string | null
  isPublished: boolean
}

const NO_ALBUMS: GalleryAlbum[] = []

/** 행사 사진첩 — one row per event album; the photos themselves live in Google Photos. */
export function GalleryAdminPage() {
  const { t } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions, compactActions } = useTableLayout()

  const albums = useAllAlbums()
  const createAlbum = useCreateAlbum()
  const updateAlbum = useUpdateAlbum()
  const deleteAlbum = useDeleteAlbum()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<AlbumFormValues>()
  const saving = createAlbum.isPending || updateAlbum.isPending

  const rows = albums.data ?? NO_ALBUMS
  const tagOptions = useMemo(() => EVENT_TAGS.map((value) => ({ value, label: t(`gallery.tags.${value}`) })), [t])

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    form.setFieldValue('year', new Date().getFullYear())
    setModalOpen(true)
  }, [form])

  const openEditModal = useCallback(
    (album: GalleryAlbum) => {
      setEditingId(album.id)
      form.setFieldsValue({
        year: album.year,
        title: album.title,
        eventTag: album.eventTag,
        description: album.description,
        albumUrl: album.albumUrl ?? '',
        coverImage: album.coverImage,
        heldOn: album.heldOn ?? '',
        isPublished: album.isPublished,
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
      albumUrl: values.albumUrl?.trim() || null,
      heldOn: values.heldOn?.trim() || null,
      description: values.description ?? '',
    }

    try {
      if (editingId) {
        await updateAlbum.mutateAsync({ id: editingId, payload })
        message.success(t('gallery.updated'))
      } else {
        await createAlbum.mutateAsync(payload)
        message.success(t('gallery.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('gallery.saveFailed')))
    }
  }

  const handleTogglePublished = useCallback(
    (album: GalleryAlbum) => {
      updateAlbum.mutate(
        { id: album.id, payload: { isPublished: !album.isPublished } },
        { onError: (err) => message.error(getErrorMessage(err, t('gallery.saveFailed'))) },
      )
    },
    [message, t, updateAlbum],
  )

  const handleDelete = useCallback(
    (album: GalleryAlbum) => {
      confirmDelete({
        target: album.title,
        onConfirm: () =>
          deleteAlbum.mutateAsync(album.id).then(
            () => message.success(t('gallery.deleted')),
            (err) => message.error(getErrorMessage(err, t('gallery.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteAlbum, message, t],
  )

  const columns = useMemo<NonNullable<TableProps<GalleryAlbum>['columns']>>(
    () => [
      {
        title: t('gallery.columns.album'),
        dataIndex: 'title',
        key: 'title',
        render: (value: string, album) => (
          <Space size={10}>
            {album.coverImage ? (
              <img className="album-thumb" src={assetUrl(album.coverImage)} alt="" />
            ) : (
              <span className="album-thumb album-thumb--empty" aria-hidden="true">
                <PictureOutlined />
              </span>
            )}
            <span>
              <strong>{value}</strong>
              <br />
              {album.albumUrl ? (
                <a href={album.albumUrl} target="_blank" rel="noopener noreferrer">
                  <LinkOutlined /> {t('gallery.openAlbum')}
                </a>
              ) : (
                <Text type="secondary">{t('gallery.noLink')}</Text>
              )}
            </span>
          </Space>
        ),
      },
      {
        title: t('gallery.columns.event'),
        dataIndex: 'eventTag',
        key: 'eventTag',
        width: 200,
        responsive: ['md'],
        render: (value: EventTag) => <Tag>{t(`gallery.tags.${value}`)}</Tag>,
      },
      {
        title: t('gallery.columns.year'),
        dataIndex: 'year',
        key: 'year',
        width: 110,
        align: 'center',
        sorter: (a, b) => a.year - b.year,
        render: (value: number, album) => album.heldOn ?? value,
      },
      {
        title: t('gallery.columns.status'),
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
        render: (_, album) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} aria-label={t('common.edit')} onClick={() => openEditModal(album)}>
              {compactActions ? null : t('common.edit')}
            </Button>
            <Button
              size="small"
              icon={album.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              loading={updateAlbum.isPending && updateAlbum.variables?.id === album.id}
              onClick={() => handleTogglePublished(album)}
              aria-label={album.isPublished ? t('common.unpublish') : t('common.publish')}
            >
              {compactActions ? null : album.isPublished ? t('common.unpublish') : t('common.publish')}
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={t('common.delete')} onClick={() => handleDelete(album)}>
              {compactActions ? null : t('common.delete')}
            </Button>
          </Space>
        ),
      },
    ],
    [compactActions, handleDelete, handleTogglePublished, openEditModal, pinActions, t, updateAlbum.isPending, updateAlbum.variables?.id],
  )

  return (
    <div className="page-layout">
      <PageHeader kicker={t('common.admin')} title={t('gallery.adminTitle')} description={t('gallery.adminSubtitle')} />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Text>{t('gallery.albumCount', { count: rows.length })}</Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            {t('gallery.add')}
          </Button>
        </div>
      </Card>

      <ErrorAlert error={albums.error} fallback={t('gallery.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={rows}
          rowKey="id"
          loading={albums.isPending}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('gallery.empty') }}
        />
      </Card>

      <Modal
        title={editingId ? t('gallery.editTitle') : t('gallery.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={680}
      >
        <Form
          form={form}
          layout="vertical"
          disabled={saving}
          initialValues={{ eventTag: 'other', isPublished: true, coverImage: null, year: new Date().getFullYear() }}
        >
          <Form.Item name="title" label={t('gallery.form.title')} rules={[{ required: true, whitespace: true, message: t('gallery.form.titleRequired') }]}>
            <Input maxLength={255} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="year" label={t('gallery.form.year')} rules={[{ required: true }]}>
                <InputNumber min={1990} max={2100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="heldOn" label={t('gallery.form.heldOn')}>
                <Input placeholder="2025-05-17" maxLength={10} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="eventTag" label={t('gallery.form.event')}>
                <Select options={tagOptions} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="albumUrl" label={t('gallery.form.albumUrl')} extra={t('gallery.form.albumUrlHint')}>
            <Input placeholder="https://photos.app.goo.gl/…" maxLength={500} />
          </Form.Item>
          <Form.Item name="description" label={t('gallery.form.description')}>
            <Input.TextArea rows={3} maxLength={4000} showCount />
          </Form.Item>
          <Form.Item name="coverImage" label={t('gallery.form.cover')}>
            <ImageUploadField shape="wide" hint={t('gallery.form.coverHint')} />
          </Form.Item>
          <Form.Item name="isPublished" label={t('gallery.form.published')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
