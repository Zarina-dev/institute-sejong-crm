import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons'
import { Button, Card, Tag, Typography } from 'antd'
import { memo } from 'react'

import { apiUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import { formatDate, formatFileSize } from '../../shared/format'
import type { MaterialItem } from './types'

const { Title, Paragraph, Text } = Typography

/**
 * One material in a grid. Memoised: a grid of 12–20 cards would otherwise
 * re-render on every keystroke in the filter bar above it.
 */
export const MaterialCard = memo(function MaterialCard({ item }: { item: MaterialItem }) {
  const { t, language } = usePreferences()

  return (
    <Card className="surface-card material-card">
      <div className="file-icon blue" aria-hidden="true">
        <FileTextOutlined />
      </div>
      <Tag>{item.subject}</Tag>
      <Title level={4}>{item.title}</Title>
      <Paragraph type="secondary" ellipsis={{ rows: 3, tooltip: item.description ?? undefined }}>
        {item.description || t('materials.noDescription')}
      </Paragraph>
      <div className="material-meta">
        <Tag>{item.course}</Tag>
        <Text type="secondary">{formatDate(item.createdAt, language)}</Text>
        <Text type="secondary">{formatFileSize(item.fileSize)}</Text>
      </div>
      <div className="material-footer">
        <Text type="secondary" ellipsis={{ tooltip: item.originalFileName ?? undefined }}>
          {item.originalFileName ?? t('materials.noFile')}
        </Text>
        <Button
          type="primary"
          size="small"
          icon={<DownloadOutlined />}
          disabled={!item.storageKey}
          href={item.storageKey ? apiUrl(`/materials/${item.id}/download`) : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('materials.download')}
        </Button>
      </div>
    </Card>
  )
})
