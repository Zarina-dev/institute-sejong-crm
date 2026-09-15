import { CalendarOutlined, EnvironmentOutlined, FilterOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Col, Empty, Row, Select, Tag, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { usePreferences } from '../../app/preferences'

const { Title, Text } = Typography
const scheduleItems = [
  { day: 'MON', date: '14', month: 'September', time: '09:00 - 10:30', subject: 'Mathematics', teacher: 'Dr. Harper', room: 'A-101', group: 'Group A', tone: 'blue' },
  { day: 'MON', date: '14', month: 'September', time: '11:00 - 12:30', subject: 'Physics', teacher: 'Prof. Lewis', room: 'B-204', group: 'Group B', tone: 'violet' },
  { day: 'TUE', date: '15', month: 'September', time: '10:00 - 11:30', subject: 'Literature', teacher: 'Ms. Rivera', room: 'C-305', group: 'Group A', tone: 'orange' },
]

export function SchedulePage() {
  const { t } = usePreferences()
  const [group, setGroup] = useState('all')
  const [subject, setSubject] = useState('all')
  const filteredItems = useMemo(() => scheduleItems.filter((item) => (group === 'all' || item.group === group) && (subject === 'all' || item.subject === subject)), [group, subject])
  const groupedItems = useMemo(() => {
    const groups = new Map<string, typeof scheduleItems>()
    filteredItems.forEach((item) => {
      const key = `${item.day}-${item.date}-${item.month}`
      groups.set(key, [...(groups.get(key) ?? []), item])
    })
    return [...groups.values()]
  }, [filteredItems])
  const resetFilters = () => { setGroup('all'); setSubject('all') }

  return <div className="page-layout">
    <header className="page-heading"><Text className="section-kicker">STUDENT TOOLS</Text><Title level={1}>{t('scheduleTitle')}</Title><Text>{t('scheduleSubtitle')}</Text></header>
    <Card className="surface-card filter-card"><Row gutter={[16, 16]} align="bottom">
      <Col xs={24} md={8}><Text strong>Course / group</Text><Select value={group} onChange={setGroup} options={[{ value: 'all', label: 'All groups' }, { value: 'Group A', label: 'Group A' }, { value: 'Group B', label: 'Group B' }]} /></Col>
      <Col xs={24} md={8}><Text strong>Week</Text><Select defaultValue="current" options={[{ value: 'current', label: '14-18 September 2026' }]} /></Col>
      <Col xs={24} md={8}><Text strong>Subject</Text><Select value={subject} onChange={setSubject} options={[{ value: 'all', label: 'All subjects' }, { value: 'Mathematics', label: 'Mathematics' }, { value: 'Physics', label: 'Physics' }, { value: 'Literature', label: 'Literature' }]} /></Col>
    </Row><div className="filter-footer"><Text type="secondary"><FilterOutlined /> {filteredItems.length} classes shown</Text>{(group !== 'all' || subject !== 'all') && <Button type="link" onClick={resetFilters}>Clear filters</Button>}</div></Card>
    {groupedItems.length ? groupedItems.map((items) => { const first = items[0]; return <section className="schedule-list" key={`${first.day}-${first.date}`}><div className="schedule-date"><span>{first.day}</span><strong>{first.date}</strong><div><b>{first.month}</b><Text type="secondary">{items.length} {items.length === 1 ? 'class' : 'classes'} planned</Text></div></div>{items.map((item) => <Card className={`surface-card lesson-card ${item.tone}`} key={`${item.subject}-${item.time}`}><div className="lesson-time"><CalendarOutlined />{item.time}</div><div className="lesson-main"><Tag>{item.group}</Tag><Title level={4}>{item.subject}</Title><span><UserOutlined /> {item.teacher}</span></div><div className="lesson-room"><EnvironmentOutlined /><span><Text type="secondary">Room</Text><b>{item.room}</b></span></div></Card>)}</section> }) : <Card className="surface-card empty-card"><Empty description="No classes match these filters."><Button onClick={resetFilters}>Show all classes</Button></Empty></Card>}
  </div>
}
