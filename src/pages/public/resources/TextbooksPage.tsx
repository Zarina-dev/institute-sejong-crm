import { BookOutlined, ShopOutlined } from '@ant-design/icons'
import { Card, Col, Empty, Row, Skeleton, Typography } from 'antd'

import { assetUrl } from '../../../api/client'
import { usePreferences } from '../../../app/preferences'
import { usePublishedTextbooks } from '../../../features/textbooks/queries'
import type { Textbook } from '../../../features/textbooks/types'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { PageHeader } from '../../../shared/PageHeader'

const { Title, Paragraph, Text } = Typography

const NO_TEXTBOOKS: Textbook[] = []

/** Every entry shows the same four facts, so the list reads as one set. */
function TextbookCard({ textbook }: { textbook: Textbook }) {
  const { t } = usePreferences()

  return (
    <Card className="surface-card textbook-card">
      {textbook.coverImage ? (
        <img className="textbook-card__cover" src={assetUrl(textbook.coverImage)} alt="" loading="lazy" />
      ) : (
        <div className="textbook-card__cover textbook-card__cover--empty" aria-hidden="true">
          <BookOutlined />
        </div>
      )}

      <div className="textbook-card__body">
        <Title level={3}>{textbook.title}</Title>
        <Paragraph className="textbook-card__description">{textbook.description || t('textbooks.noDescription')}</Paragraph>

        <div className="textbook-card__purchase">
          <Text type="secondary">
            <ShopOutlined /> {t('textbooks.form.purchasePlace')}
          </Text>
          {textbook.purchaseUrl ? (
            <a href={textbook.purchaseUrl} target="_blank" rel="noopener noreferrer">
              {textbook.purchasePlace || textbook.purchaseUrl}
            </a>
          ) : (
            <Text strong>{textbook.purchasePlace || t('textbooks.askOffice')}</Text>
          )}
        </div>
      </div>
    </Card>
  )
}

/** 교재 안내 — the institute's textbooks, each described the same way. */
export function TextbooksPage() {
  const { t } = usePreferences()
  const textbooks = usePublishedTextbooks()
  const list = textbooks.data ?? NO_TEXTBOOKS

  return (
    <div className="page-layout">
      <PageHeader kicker={t('siteNav.resources')} title={t('pageCopy.textbooksTitle')} description={t('pageCopy.textbooksSubtitle')} />

      <ErrorAlert error={textbooks.error} fallback={t('textbooks.loadFailed')} />

      {textbooks.isPending ? (
        <Row gutter={[18, 18]}>
          {Array.from({ length: 3 }, (_, index) => (
            <Col xs={24} md={12} key={index}>
              <Card className="surface-card textbook-card">
                <Skeleton active paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : list.length > 0 ? (
        <Row gutter={[18, 18]}>
          {list.map((textbook) => (
            <Col xs={24} md={12} key={textbook.id}>
              <TextbookCard textbook={textbook} />
            </Col>
          ))}
        </Row>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('textbooks.empty')} />
        </Card>
      )}
    </div>
  )
}
