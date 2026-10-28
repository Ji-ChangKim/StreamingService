import { useEffect } from 'react';
import { PORTAL_GUIDES, currentDebutWeek, profileExcerpt } from '../../../shared/portalEditorial';
import { PORTAL_PLATFORMS, type PortalProfile } from '../../../shared/portal';
import { PortalHeading, PortalLink, portalSchedule, PortalAvatar, PlatformBadge } from './PortalUi';
import { t, usePortalLocale } from './portalLocale';
import { ArrowRightIcon } from '@animateicons/react/lucide';
import { Calendar, BookOpen } from 'lucide-react';
import './portalLearning.css';

// 이번 주 일정의 실제 분포와 바로 활용할 수 있는 안내 글을 연결한다.
export function PortalHomeLearning({ profiles, timezone, loading, error, onNavigate }: { profiles: PortalProfile[]; timezone: string; loading: boolean; error: string; onNavigate: (path: string) => void }) {
  usePortalLocale();
  const week = currentDebutWeek(profiles, timezone);
  return <section className="vd-learning vd-section">
    {!loading && !error && <section className="vd-weekly-board">
      <div className="vd-weekly-header">
        <div className="vd-weekly-title-wrap">
          <div className="vd-weekly-badge">
            <Calendar size={13} />
            <span>{t('위클리 스케줄')}</span>
          </div>
          <h2>{t('이번 주 등록된 데뷔 소식')}</h2>
          <p className="vd-weekly-dates">{week.from} — {week.to} · {timezone}</p>
        </div>
        {week.profiles.length > 0 && <div className="vd-weekly-platform-chips">
          {PORTAL_PLATFORMS.filter((platform) => week.profiles.some((profile) => profile.platform === platform.id)).map((platform) => {
            const count = week.profiles.filter((profile) => profile.platform === platform.id).length;
            return <div key={platform.id} className="vd-weekly-chip"><img src={platform.icon} alt="" width={14} height={14} /><span>{platform.label}</span><strong>{count}</strong></div>;
          })}
        </div>}
      </div>
      {week.profiles.length ? <>
        <div className="vd-weekly-grid">
          {week.profiles.slice(0, 6).map((profile) => (
            <article key={profile.slug} className="vd-weekly-item">
              <PortalAvatar profile={profile} />
              <div className="vd-weekly-info">
                <div className="vd-weekly-item-top">
                  <PlatformBadge platform={profile.platform} />
                  <time className="vd-weekly-time">{portalSchedule(profile, timezone)}</time>
                </div>
                <PortalLink to={`/creator/${encodeURIComponent(profile.slug)}`} onNavigate={onNavigate} className="vd-weekly-name">
                  <h3>{profile.displayName}</h3>
                </PortalLink>
                {profileExcerpt(profile) && <p className="vd-weekly-desc">{profileExcerpt(profile, 80)}</p>}
              </div>
            </article>
          ))}
        </div>
        <p className="vd-weekly-note">{t('※ 방송 일정이 변경될 수 있으니 상세 소개 및 공식 공지를 확인해 주세요.')}</p>
      </> : <p className="vd-weekly-empty">{t('이번 주에 등록된 데뷔 일정이 없어요. 달력에서 다른 주를 살펴보세요.')}</p>}
    </section>}
    <div className="vd-section-heading">
      <div>
        <h2>{t('첫 방송을 만나고 준비하는 방법')}</h2>
      </div>
      <PortalLink to="/guide" onNavigate={onNavigate} className="vd-text-button">
        <span>{t('전체 가이드')}</span>
        <ArrowRightIcon size={14} />
      </PortalLink>
    </div>
    <div className="vd-learning-grid">
      {PORTAL_GUIDES.filter((guide) => ['calendar', 'profiling', 'update'].includes(guide.id)).map((guide) => (
        <article className="vd-guide-card" key={guide.id}>
          <div className="vd-guide-card-icon">
            <BookOpen size={18} />
          </div>
          <h3>{t(guide.title)}</h3>
          <p>{t(guide.paragraphs[0])}</p>
          <PortalLink to={`/guide#${guide.id}`} onNavigate={onNavigate} className="vd-guide-link">
            <span>{t('자세히 읽기')}</span>
            <ArrowRightIcon size={14} />
          </PortalLink>
        </article>
      ))}
    </div>
  </section>;
}

// 4대 스트리밍 플랫폼별 서치 기준 데이터
interface SearchPlatformSpec {
  id: string;
  name: string;
  icon: string;
  targetTags: string[];
  inPlatformSearch: string;
}

const SEARCH_PLATFORMS: SearchPlatformSpec[] = [
  {
    id: 'chzzk',
    name: '치지직 (CHZZK)',
    icon: '/icons/chzzk_icon.png',
    targetTags: ['#치지직_데뷔', '#치지직_버튜버', '#치지직_신입', '"치지직 첫방송"', '"치지직 데뷔"'],
    inPlatformSearch: '치지직 루키 채널 및 방송국 라운지(게시판) 공지사항의 첫 방송 안내문 및 일정표 이미지 직접 서치'
  },
  {
    id: 'soop',
    name: 'SOOP (숲)',
    icon: '/icons/soop/soop_symbol_blue.svg',
    targetTags: ['#SOOP_데뷔', '#숲_데뷔', '#SOOP_버튜버', '"SOOP 첫방송"', '"숲 데뷔"'],
    inPlatformSearch: '버추얼 카테고리 신규 방송국 및 크루/클럽 알림판에 등록된 첫 방송 공지글과 주간 시간표 이미지 직접 서치'
  },
  {
    id: 'youtube',
    name: 'YouTube (유튜브)',
    icon: '/icons/youtube_icon.png',
    targetTags: ['#유튜브_데뷔', '#유튜브_버튜버', '#YoutubeDebut', '"유튜브 첫방송"', '"유튜브 데뷔"'],
    inPlatformSearch: '유튜브 검색 필터(실시간 대기방 및 최초 공개 예정)를 활용해 사전에 생성된 라이브 대기실의 공식 예정 일시 추출'
  },
  {
    id: 'twitch',
    name: 'Twitch (트위치)',
    icon: '/icons/twitch_icon.svg',
    targetTags: ['#트위치_데뷔', '#트위치_버튜버', '#TwitchDebut', '"트위치 첫방송"'],
    inPlatformSearch: '버추얼 스트리머 카테고리 태그 및 채널 스케줄러(Schedule) 탭에 등록된 첫 방송 예정 일시 직접 서치'
  }
];

// 서비스 소개와 별개 주소에서 저장·작성·변경·통계 읽기의 실제 절차를 제공한다.
export function PortalGuide({ onNavigate }: { onNavigate: (path: string) => void }) {
  usePortalLocale();
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const legacyMap: Record<string, string> = {
      investigation: 'search',
      save: 'calendar',
      timezone: 'calendar',
      introduction: 'profiling',
      announcement: 'update',
      statistics: 'analytics'
    };
    const targetId = legacyMap[hash] || hash;
    if (PORTAL_GUIDES.some((guide) => guide.id === targetId)) {
      document.getElementById(targetId)?.scrollIntoView();
    }
  }, []);

  return (
    <div className="vd-learning vd-guide-container">
      <PortalHeading
        title={t('VDébut 이용 가이드')}
        description={t('신입 버튜버 데뷔 일정 조사부터 캘린더 등록, 상세 프로필 작성, 정보 수정 및 방송 통계 활용까지의 전체 프로세스를 안내합니다.')}
      />

      {/* 가이드 상단 6단계 라이프사이클 퀵 네비게이션 */}
      <nav className="vd-guide-index-grid" aria-label={t('가이드 목차')}>
        {PORTAL_GUIDES.map((guide, idx) => (
          <a href={`#${guide.id}`} key={guide.id} className="vd-guide-index-card">
            <span className="vd-guide-index-badge">{idx + 1}. {t(guide.category)}</span>
            <span className="vd-guide-index-title">{t(guide.title)}</span>
            <ArrowRightIcon size={14} className="vd-guide-index-arrow" />
          </a>
        ))}
      </nav>

      {/* 6대 가이드 아티클 본문 목록 */}
      <div className="vd-guide-list">
        {PORTAL_GUIDES.map((guide, guideIdx) => {
          const isSearchSection = guide.id === 'search';
          const isRegistrationSection = guide.id === 'registration';

          return (
            <article id={guide.id} className="vd-panel vd-guide-article" key={guide.id}>
              {/* 카드 상단 헤더: 카테고리 뱃지 & 타이틀 & 리드문 */}
              <div className="vd-guide-card-head">
                <span className="vd-guide-category-badge">{guideIdx + 1}. {t(guide.category)}</span>
                <h2>{t(guide.title)}</h2>
                <p className="vd-guide-lead">{t(guide.lead)}</p>
              </div>

              {/* [섹션 1] 조사 방법 전용: 4대 플랫폼 서치 매트릭스 */}
              {isSearchSection && (
                <>
                  <div className="vd-search-platform-grid">
                    {SEARCH_PLATFORMS.map((platform) => (
                      <div className="vd-search-platform-card" key={platform.id}>
                        <div className="vd-search-platform-header">
                          <img src={platform.icon} alt={platform.name} width="22" height="22" className="vd-platform-icon-pure" />
                          <h3>{t(platform.name)}</h3>
                        </div>

                        <div className="vd-search-platform-body">
                          <div className="vd-search-tags-wrap">
                            <span className="vd-search-field-label">{t('X(트위터) 타깃 검색어 & 해시태그')}:</span>
                            <div className="vd-search-tag-chips">
                              {platform.targetTags.map((tag, tIdx) => (
                                <span className="vd-search-tag-chip" key={tIdx}>{tag}</span>
                              ))}
                            </div>
                          </div>

                          <div className="vd-search-inner-wrap">
                            <span className="vd-search-field-label">{t('플랫폼 내부 직접 서치 경로')}:</span>
                            <p className="vd-search-inner-text">{t(platform.inPlatformSearch)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 세부 4대 조사 기준 목록 */}
                  <div className="vd-guide-steps-wrap">
                    <ul className="vd-step-list vd-standard-steps">
                      {guide.steps.map((step, idx) => (
                        <li className="vd-step-item" key={idx}>
                          <span className="vd-step-badge highlight">{idx + 1}</span>
                          <span className="vd-step-text">{t(step)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {guide.tip && (
                    <div className="vd-tip-box">
                      <strong>{t('운영진 검증 원칙')}:</strong> {t(guide.tip)}
                    </div>
                  )}
                </>
              )}

              {/* [섹션 2] 등록 방법 전용: 자동 등록 vs 수동 제보 2-Branch 대조 */}
              {isRegistrationSection && (
                <>
                  <div className="vd-registration-branches">
                    <div className="vd-branch-card">
                      <div className="vd-branch-header">
                        <span className="vd-branch-pill">{t('경로 A')}</span>
                        <h3>{t('운영 서치 기반 자동 등록')}</h3>
                      </div>
                      <p className="vd-branch-desc">
                        {t('1단계 정밀 서치를 통해 공식 공지와 대기방이 확인된 일정을 운영진이 데이터베이스에 1차 등록하며, 방송국 고유 ID 기준으로 중복을 방지하고 데뷔 일정 큐에 안전하게 적재합니다.')}
                      </p>
                    </div>

                    <div className="vd-branch-card highlight">
                      <div className="vd-branch-header">
                        <span className="vd-branch-pill accent">{t('경로 B')}</span>
                        <h3>{t('버튜버 및 팬 직접 수동 제보')}</h3>
                      </div>
                      <p className="vd-branch-desc">
                        {t('버튜버 본인 또는 데뷔를 응원하는 팬이 [데뷔 일정 등록] 페이지에서 방송 플랫폼, 채널 주소, 데뷔 예정 일시, 공식 공지 출처 링크를 직접 입력하여 신청합니다.')}
                      </p>
                    </div>
                  </div>

                  <div className="vd-guide-steps-wrap">
                    <ul className="vd-step-list vd-standard-steps">
                      {guide.steps.map((step, idx) => (
                        <li className="vd-step-item" key={idx}>
                          <span className="vd-step-badge highlight">{idx + 1}</span>
                          <span className="vd-step-text">{t(step)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {guide.image && (
                    <div className="vd-guide-media-wrap">
                      <figure className="vd-guide-figure">
                        <img
                          src={guide.image}
                          alt={t(guide.imageCaption || guide.title)}
                          className="vd-guide-screenshot"
                          loading="lazy"
                        />
                        {guide.imageCaption && (
                          <figcaption className="vd-guide-caption">
                            {t(guide.imageCaption)}
                          </figcaption>
                        )}
                      </figure>
                    </div>
                  )}

                  {guide.tip && (
                    <div className="vd-tip-box">
                      <strong>{t('참고사항')}:</strong> {t(guide.tip)}
                    </div>
                  )}
                </>
              )}

              {/* [섹션 3~6] 일반 세부 등록/수정/캘린더/통계 섹션 */}
              {!isSearchSection && !isRegistrationSection && (
                <>
                  <div className="vd-guide-content-body">
                    <div className="vd-guide-steps-wrap">
                      <ul className="vd-step-list vd-standard-steps">
                        {guide.steps.map((step, idx) => (
                          <li className="vd-step-item" key={idx}>
                            <span className="vd-step-badge highlight">{idx + 1}</span>
                            <span className="vd-step-text">{t(step)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {guide.image && (
                      <div className="vd-guide-media-wrap">
                        <figure className="vd-guide-figure">
                          <img
                            src={guide.image}
                            alt={t(guide.imageCaption || guide.title)}
                            className="vd-guide-screenshot"
                            loading="lazy"
                          />
                          {guide.imageCaption && (
                            <figcaption className="vd-guide-caption">
                              {t(guide.imageCaption)}
                            </figcaption>
                          )}
                        </figure>
                      </div>
                    )}
                  </div>

                  {guide.tip && (
                    <div className="vd-tip-box">
                      <strong>{t('실전 팁 & 주의사항')}:</strong> {t(guide.tip)}
                    </div>
                  )}
                </>
              )}

              {/* 카드 하단 액션 버튼 */}
              <div className="vd-guide-card-footer">
                <PortalLink to={guide.to} onNavigate={onNavigate} className="vd-button vd-primary">
                  {t(guide.action)}
                </PortalLink>
              </div>
            </article>
          );
        })}
      </div>

      {/* 하단 문의 안내 링크 */}
      <footer className="vd-guide-page-footer">
        <p>
          {t('잘못된 소개나 변경된 일정을 발견하면 관련 페이지와 공식 출처를 알려주세요.')}{' '}
          <PortalLink to="/contact" onNavigate={onNavigate} className="vd-text-button">
            {t('문의하기')}
          </PortalLink>
        </p>
      </footer>
    </div>
  );
}

