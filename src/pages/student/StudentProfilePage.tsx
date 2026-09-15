import { Card, Descriptions, Tag } from 'antd'

import { usePreferences } from '../../app/preferences'
import { useCurrentStudent } from '../../auth/useCurrentStudent'
import { PageHeader } from '../../shared/PageHeader'

export function StudentProfilePage() {
  const { t } = usePreferences()
  const { session, student } = useCurrentStudent()

  return (
    <div className="page-layout">
      <PageHeader level={2} title={t('profile.title')} description={t('profile.subtitle')} />

      <Card className="surface-card">
        <Descriptions column={{ xs: 1, md: 2 }} bordered size="middle">
          <Descriptions.Item label={t('profile.name')}>{student?.name ?? session?.displayName ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('profile.studentId')}>{student?.studentId ?? session?.studentId ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('profile.email')}>{student?.email ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('profile.phone')}>{student?.phone ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('profile.course')}>{student?.course ?? '-'}</Descriptions.Item>
          <Descriptions.Item label={t('profile.level')}>{student?.level ?? '-'}</Descriptions.Item>
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
            {student?.topikFiles?.length ? student.topikFiles.map((file) => <Tag key={file.id}>{file.name}</Tag>) : t('profile.noFiles')}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}
