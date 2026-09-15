import { ArrowRightOutlined, CalendarOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, Tag, Typography } from 'antd'
import { usePreferences } from '../../app/preferences'
const { Title, Paragraph, Text } = Typography
const news = [
  { title: 'Semester registration is now open', body: 'Choose your classes and confirm your place for the coming semester through the student portal.', category: 'Academic', date: '10 Sep 2026', featured: true },
  { title: 'Career workshop series begins next Monday', body: 'Meet employers, refine your CV, and practice the conversations that matter.', category: 'Events', date: '8 Sep 2026', featured: false },
  { title: 'Library hours extended for exam preparation', body: 'More quiet study time is available throughout the exam preparation week.', category: 'Campus', date: '3 Sep 2026', featured: false },
]
export function NewsPage() { const { t } = usePreferences(); return <div className="page-layout"><header className="page-heading"><Text className="section-kicker">CAMPUS LIFE</Text><Title level={1}>{t('newsTitle')}</Title><Text>{t('newsSubtitle')}</Text></header><Row gutter={[18, 18]}>{news.map((item) => <Col xs={24} md={item.featured ? 24 : 12} key={item.title}><Card className={`surface-card announcement-card ${item.featured ? 'featured' : ''}`}><div><Tag color={item.featured ? 'blue' : 'default'}>{item.category}</Tag><Text type="secondary"><CalendarOutlined /> {item.date}</Text></div><Title level={item.featured ? 2 : 3}>{item.title}</Title><Paragraph>{item.body}</Paragraph><Button type="link" icon={<ArrowRightOutlined />} iconPosition="end">Read announcement</Button></Card></Col>)}</Row></div> }
