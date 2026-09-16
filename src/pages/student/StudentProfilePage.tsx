import { InfoCircleOutlined, PaperClipOutlined } from '@ant-design/icons'
import { Alert, Card, Descriptions, Space, Tag } from 'antd'

import { assetUrl } from '../../api/client'
import { usePreferences } from '../../app/preferences'
import { useCurrentStudent } from '../../auth/useCurrentStudent'
import { formatLevel } from '../../features/students/level'
import { PageHeader } from '../../shared/PageHeader'

export function StudentProfilePage() {
  const { t } = usePreferences()
  const { session, student } = useCurrentStudent()

  return (
    <div className="page-layout">
      <PageHeader level={2} title={t('profile.title')} description={t('profile.subtitle')} />

      {/* Students cannot edit their record; corrections go through the office. */}
      <Alert type="info" showIcon icon={<InfoCircleOutlined />} message={t('profile.contactNote')} />

      <Card className="surface-card">
        <Descriptions column={{ xs: 1, md: 2 }} bordered size="middle">
          <Descriptions.Item label={t('profile.name')}>{student?.name ?? session?.displayName ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('profile.studentId')}>{student?.studentId ?? session?.studentId ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('profile.email')}>{student?.email ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('profile.phone')}>{student?.phone ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('profile.course')}>{student?.course ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('profile.level')}>{formatLevel(student?.level, t)}</Descriptions.Item>
          <Descriptions.Item label={t('profile.admissionDate')}>{student?.admissionDate ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('profile.status')}>
            {student?.status === 'active' ? (
              <Tag color="green">{t('students.statusActive')}</Tag>
            ) : student?.status === 'inactive' ? (
              <Tag>{t('students.statusInactive')}</Tag>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t('profile.topikFiles')} span={2}>
            {student?.topikFiles?.length ? (
              <Space wrap>
                {student.topikFiles.map((file) =>
                  file.url ? (
                    <a key={file.id} href={assetUrl(file.url)} target="_blank" rel="noreferrer">
                      <PaperClipOutlined /> {file.name}
                    </a>
                  ) : (
                    <Tag key={file.id}>{file.name}</Tag>
                  ),
                )}
              </Space>
            ) : (
              t('profile.noFiles')
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}
