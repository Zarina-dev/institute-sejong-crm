import { Card, Descriptions, Tag } from 'antd'

import { useSession } from '../../auth/useSession'
import { PageHeader } from '../../shared/PageHeader'

export function StudentProfilePage() {
  const session = useSession()
  const student = session?.student

  return (
    <div className="page-layout">
      <PageHeader
        level={2}
        title="내 정보"
        description="학생의 기본 정보, 현재 과정, 활동 상태, TOPIK 첨부 파일 정보를 확인하는 화면입니다."
      />

      <Card className="surface-card">
        <Descriptions column={{ xs: 1, md: 2 }} bordered size="middle">
          <Descriptions.Item label="이름">{student?.name ?? session?.displayName ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="학번">{student?.studentId ?? session?.studentId ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="이메일">{student?.email ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="전화번호">{student?.phone ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="과정">{student?.course ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="TOPIK 레벨">{student?.level ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="입학 날짜">{student?.admissionDate ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="상태">
            {student?.status === 'active' ? <Tag color="green">활동 중</Tag> : student?.status === 'inactive' ? <Tag>비활동</Tag> : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="TOPIK 파일" span={2}>
            {student?.topikFiles?.length ? student.topikFiles.map((file) => <Tag key={file.id}>{file.name}</Tag>) : '첨부 없음'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  )
}
