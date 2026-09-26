import { DeleteOutlined, EditOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined, PushpinFilled } from '@ant-design/icons'
import type { TableProps } from 'antd'
import { App, Button, Card, Form, Input, Modal, Segmented, Select, Space, Switch, Table, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { usePreferences } from '../../app/preferences'
import { useAllNews, useCreateNews, useDeleteNews, useSetNewsPublished, useUpdateNews } from '../../features/news/queries'
import { NEWS_CATEGORIES, type NewsCategory, type NewsPost } from '../../features/news/types'
import { ErrorAlert } from '../../shared/ErrorAlert'
import { getErrorMessage } from '../../shared/errors'
import { formatDate } from '../../shared/format'
import { ImageUploadField } from '../../shared/ImageUploadField'
import { PageHeader } from '../../shared/PageHeader'
import { RichTextEditor } from '../../shared/RichTextEditor'
import { useConfirmDelete } from '../../shared/useConfirmDelete'
import { useTableLayout } from '../../shared/useTableLayout'

const { Text } = Typography

type NewsFormValues = {
  title: string
  body: string
  coverImage: string | null
  category: NewsCategory
  isPublished: boolean
  isFeatured: boolean
}

/** The two public pages a post can appear on. */
type NewsView = 'notices' | 'press'

export function NewsAdminPage() {
  const { t, language } = usePreferences()
  const { message } = App.useApp()
  const confirmDelete = useConfirmDelete()
  const { pinActions, compactActions } = useTableLayout()

  const news = useAllNews()
  const createNews = useCreateNews()
  const updateNews = useUpdateNews()
  const deleteNews = useDeleteNews()
  const setPublished = useSetNewsPublished()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form] = Form.useForm<NewsFormValues>()
  const saving = createNews.isPending || updateNews.isPending

  // 공지사항 and 보도 자료 are one table split by category, exactly as the
  // public site splits them; the view is in the URL so the menu can link to it.
  const [params, setParams] = useSearchParams()
  const requested = params.get('view') as NewsView | null
  const view: NewsView = requested === 'press' ? 'press' : 'notices'

  useEffect(() => {
    if (requested !== view) {
      setParams({ view }, { replace: true })
    }
  }, [requested, setParams, view])

  const posts = useMemo(
    () => (news.data ?? []).filter((post) => (view === 'press' ? post.category === 'press' : post.category !== 'press')),
    [news.data, view],
  )

  const categoryOptions = useMemo(
    () => NEWS_CATEGORIES.map((value) => ({ value, label: t(`news.category.${value}`) })),
    [t],
  )

  const openCreateModal = useCallback(() => {
    setEditingId(null)
    form.resetFields()
    // A post written on the 보도 자료 view belongs there.
    form.setFieldValue('category', view === 'press' ? 'press' : 'campus')
    setModalOpen(true)
  }, [form, view])

  const openEditModal = useCallback(
    (post: NewsPost) => {
      setEditingId(post.id)
      form.setFieldsValue({
        title: post.title,
        body: post.body,
        coverImage: post.coverImage,
        category: post.category,
        isPublished: post.isPublished,
        isFeatured: post.isFeatured,
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
        await updateNews.mutateAsync({ id: editingId, payload: values })
        message.success(t('news.updated'))
      } else {
        await createNews.mutateAsync(values)
        message.success(t('news.created'))
      }

      setModalOpen(false)
      form.resetFields()
    } catch (err) {
      message.error(getErrorMessage(err, t('news.saveFailed')))
    }
  }

  const handleTogglePublished = useCallback(
    (post: NewsPost) => {
      setPublished.mutate(
        { id: post.id, published: !post.isPublished },
        { onError: (err) => message.error(getErrorMessage(err, t('news.publishFailed'))) },
      )
    },
    [message, setPublished, t],
  )

  const handleDelete = useCallback(
    (post: NewsPost) => {
      confirmDelete({
        target: post.title,
        onConfirm: () =>
          deleteNews.mutateAsync(post.id).then(
            () => message.success(t('news.deleted')),
            (err) => message.error(getErrorMessage(err, t('news.deleteFailed'))),
          ),
      })
    },
    [confirmDelete, deleteNews, message, t],
  )

  const columns = useMemo<NonNullable<TableProps<NewsPost>['columns']>>(
    () => [
      {
        title: t('news.columns.title'),
        dataIndex: 'title',
        key: 'title',
        render: (value: string, post) => (
          <Space size={6}>
            {post.isFeatured ? <PushpinFilled style={{ color: 'var(--color-primary)' }} aria-label={t('news.featured')} /> : null}
            <strong>{value}</strong>
          </Space>
        ),
      },
      {
        title: t('news.columns.category'),
        dataIndex: 'category',
        key: 'category',
        width: 140,
        responsive: ['md'],
        render: (value: NewsCategory) => <Tag>{t(`news.category.${value}`)}</Tag>,
      },
      {
        title: t('news.columns.publishedAt'),
        dataIndex: 'publishedAt',
        key: 'publishedAt',
        width: 170,
        responsive: ['lg'],
        render: (value: string | null) => (value ? formatDate(value, language) : <Text type="secondary">—</Text>),
      },
      {
        title: t('news.columns.status'),
        dataIndex: 'isPublished',
        key: 'isPublished',
        width: 120,
        render: (value: boolean) => <Tag color={value ? 'green' : 'gold'}>{value ? t('common.published') : t('news.draft')}</Tag>,
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: pinActions,
        width: compactActions ? 120 : 260,
        render: (_, post) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} aria-label={t('common.edit')} onClick={() => openEditModal(post)}>
              {compactActions ? null : t('common.edit')}
            </Button>
            <Button
              size="small"
              icon={post.isPublished ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              loading={setPublished.isPending && setPublished.variables?.id === post.id}
              onClick={() => handleTogglePublished(post)}
              aria-label={post.isPublished ? t('common.unpublish') : t('common.publish')}
            >
              {compactActions ? null : post.isPublished ? t('common.unpublish') : t('common.publish')}
            </Button>
            <Button size="small" danger icon={<DeleteOutlined />} aria-label={t('common.delete')} onClick={() => handleDelete(post)}>
              {compactActions ? null : t('common.delete')}
            </Button>
          </Space>
        ),
      },
    ],
    [compactActions, handleDelete, handleTogglePublished, language, openEditModal, pinActions, setPublished.isPending, setPublished.variables?.id, t],
  )

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('common.admin')}
        title={t(view === 'press' ? 'siteNav.noticesPress' : 'siteNav.noticesNotice')}
        description={t('news.adminSubtitle')}
      />

      <Card className="surface-card filter-card">
        <div className="filter-footer">
          <Segmented
            value={view}
            onChange={(value) => setParams({ view: value as NewsView })}
            options={[
              { value: 'notices', label: t('siteNav.noticesNotice') },
              { value: 'press', label: t('siteNav.noticesPress') },
            ]}
          />
          <Space wrap>
            <Text>{t('news.count', { count: posts.length })}</Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              {t('news.add')}
            </Button>
          </Space>
        </div>
      </Card>

      <ErrorAlert error={news.error} fallback={t('news.loadFailed')} />

      <Card className="surface-card">
        <Table
          className="admin-table"
          columns={columns}
          dataSource={posts}
          rowKey="id"
          loading={news.isPending}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('news.empty') }}
        />
      </Card>

      <Modal
        title={editingId ? t('news.editTitle') : t('news.addTitle')}
        open={modalOpen}
        onOk={submitForm}
        onCancel={() => setModalOpen(false)}
        okText={editingId ? t('common.save') : t('common.add')}
        cancelText={t('common.cancel')}
        confirmLoading={saving}
        forceRender
        width={920}
        className="editor-modal"
      >
        <Form form={form} layout="vertical" disabled={saving} initialValues={{ category: 'campus', isPublished: false, isFeatured: false, coverImage: null }}>
          <Form.Item name="title" label={t('news.form.title')} rules={[{ required: true, message: t('news.form.titleRequired') }]}>
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="coverImage" label={t('news.form.cover')}>
            <ImageUploadField shape="wide" hint={t('news.form.coverHint')} />
          </Form.Item>
          {/* The editor is a controlled Form.Item child: it emits '' when empty so equired works. */}
          <Form.Item name="body" label={t('news.form.body')} extra={t('news.form.bodyHelp')} rules={[{ required: true, message: t('news.form.bodyRequired') }]}>
            <RichTextEditor />
          </Form.Item>
          <Form.Item name="category" label={t('news.form.category')}>
            <Select options={categoryOptions} />
          </Form.Item>
          <Form.Item name="isFeatured" label={t('news.form.featured')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isPublished" label={t('news.form.visibility')}>
            <Select
              options={[
                { value: true, label: t('common.published') },
                { value: false, label: t('news.draft') },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
