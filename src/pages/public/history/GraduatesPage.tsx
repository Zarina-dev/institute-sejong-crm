import { Card, Empty, Skeleton, Typography } from 'antd'
import { useMemo, useState } from 'react'

import { usePreferences } from '../../../app/preferences'
import { useGraduates } from '../../../features/graduates/queries'
import { graduateText, otherGraduateName, type Graduate } from '../../../features/graduates/types'
import { BackToTop } from '../../../shared/BackToTop'
import { ErrorAlert } from '../../../shared/ErrorAlert'
import { HeaderSearch, matchesQuery } from '../../../shared/HeaderSearch'
import { PageHeader } from '../../../shared/PageHeader'

const { Text } = Typography

const NO_GRADUATES: Graduate[] = []

type Entry = { graduate: Graduate; number: number }

/**
 * 졸업생 현황 — everyone who finished 세종한국어 8책, by the term they
 * graduated in, the way the institute keeps the list: oldest term first.
 * The 졸업생 번호 is the position in the whole list, so a search keeps each
 * graduate's own number.
 */
export function GraduatesPage() {
  const { t, language } = usePreferences()
  const graduates = useGraduates()
  const all = graduates.data ?? NO_GRADUATES
  const [search, setSearch] = useState('')

  const terms = useMemo(() => {
    const byTerm = new Map<string, { year: number; term: number; entries: Entry[] }>()

    all.forEach((graduate, index) => {
      if (!matchesQuery(search, [graduate.name, graduate.nameKy, graduate.note, graduate.noteKy, graduate.year])) return
      const key = `${graduate.year}-${graduate.term}`
      const group = byTerm.get(key) ?? { year: graduate.year, term: graduate.term, entries: [] }
      group.entries.push({ graduate, number: index + 1 })
      byTerm.set(key, group)
    })

    return [...byTerm.values()]
  }, [all, search])

  const found = terms.reduce((total, group) => total + group.entries.length, 0)
  const searching = search.trim().length > 0
  const span = all.length > 0 ? { from: all[0].year, to: all[all.length - 1].year } : null

  return (
    <div className="page-layout">
      <PageHeader
        kicker={t('siteNav.history')}
        title={t('graduates.title')}
        description={t('graduates.subtitle')}
        extra={all.length > 0 ? <HeaderSearch value={search} onChange={setSearch} placeholder={t('graduates.searchPlaceholder')} /> : null}
      />

      <ErrorAlert error={graduates.error} fallback={t('graduates.loadFailed')} />

      {graduates.isPending ? (
        <Card className="surface-card">
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      ) : all.length > 0 ? (
        <>
          <Card className="surface-card filter-card">
            <div className="filter-footer">
              <Text type="secondary">
                {searching ? t('graduates.found', { count: found, total: all.length }) : t('graduates.count', { count: all.length })}
              </Text>
              {span ? <Text type="secondary">{t('studies.range', span)}</Text> : null}
            </div>
          </Card>

          {searching && found === 0 ? (
            <Card className="surface-card empty-card">
              <Empty description={t('common.noMatches', { query: search.trim() })} />
            </Card>
          ) : null}

          <div className="graduate-terms">
            {terms.map((group) => (
              <section className="graduate-term" key={`${group.year}-${group.term}`}>
                <h2 className="graduate-term__label">
                  {t('graduates.termLabel', { year: group.year, term: group.term })}
                  <span className="graduate-term__count">{t('graduates.count', { count: group.entries.length })}</span>
                </h2>

                <Card className="surface-card graduate-list">
                  <ol className="graduate-list__rows">
                    {group.entries.map(({ graduate, number }) => {
                      const alias = otherGraduateName(graduate, language)
                      const note = graduateText(graduate, 'note', language)

                      return (
                        <li className="graduate-row" key={graduate.id}>
                          <span className="graduate-row__number" title={t('graduates.numberLabel')}>
                            {number}
                          </span>
                          <span className="graduate-row__name">
                            <strong>{graduateText(graduate, 'name', language)}</strong>
                            {alias ? <span className="graduate-row__alias">{alias}</span> : null}
                          </span>
                          {note ? <span className="graduate-row__note">{note}</span> : null}
                        </li>
                      )
                    })}
                  </ol>
                </Card>
              </section>
            ))}
          </div>
        </>
      ) : (
        <Card className="surface-card empty-card">
          <Empty description={t('graduates.empty')} />
        </Card>
      )}

      <BackToTop />
    </div>
  )
}
