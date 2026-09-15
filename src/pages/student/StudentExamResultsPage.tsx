import { Card, Empty } from 'antd'

import { PageHeader } from '../../shared/PageHeader'

/** No exam-results API exists yet; this is an honest placeholder, not fake data. */
export function StudentExamResultsPage() {
  return (
    <div className="page-layout">
      <PageHeader level={2} title="시험 결과" description="최근 시험 성적과 평가 결과를 한눈에 확인할 수 있는 화면입니다." />
      <Card className="surface-card empty-card">
        <Empty description="아직 등록된 시험 결과가 없습니다." />
      </Card>
    </div>
  )
}
