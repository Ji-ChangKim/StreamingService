// 정책 화면과 서버 초기 HTML이 같은 본문을 사용하도록 한곳에서 관리한다.
export interface PolicySection {
  heading: string;
  paragraphs: string[];
  links?: { href: string; label: string }[];
}

export const PRIVACY_INTRO = 'VDébut은 데뷔 일정과 소개 공개, 문의 처리 및 서비스 이용 현황 분석에 필요한 정보를 사용합니다.';
export const POLICY_CONTACT_EMAIL = 'ru_0120@naver.com';

export const PRIVACY_SECTIONS: PolicySection[] = [
  { heading: '등록·문의 정보', paragraphs: ['활동명, 소개, 방송 채널, 일정과 등록한 이미지는 소개 공개에 사용됩니다. 문의에 입력한 이메일과 내용은 문의 처리에 사용되며 공개 소개에 표시하지 않습니다.'] },
  { heading: '브라우저 저장 정보', paragraphs: ['언어와 일정 표시 설정, 관심 목록, 문의 답변 조회용 확인 키는 사용한 브라우저에 저장됩니다. 브라우저 설정에서 저장 정보를 삭제할 수 있습니다.'] },
  { heading: '접속 정보', paragraphs: ['서비스 요청 처리와 과도한 접수 제한을 위해 접속 정보를 처리합니다. 문의 확인 키와 접수 제한에 사용하는 접속 주소는 해시로 저장합니다.'] },
  {
    heading: 'Google Analytics',
    paragraphs: ['운영 사이트에는 Google Analytics 방문 분석 태그가 포함되어 있습니다. Google은 이용 현황 분석을 위해 쿠키, IP 주소, 기기 및 브라우저 정보 등을 처리할 수 있습니다.'],
    links: [{ href: 'https://policies.google.com/technologies/partner-sites?hl=ko', label: 'Google의 파트너 사이트 데이터 사용 안내' }],
  },
  {
    heading: '광고 서비스',
    paragraphs: [
      'VDébut은 서비스 운영을 위해 Google AdSense 등 제3자 광고 서비스를 이용해 광고를 게재할 수 있습니다.',
      'Google을 포함한 제3자 광고 사업자는 쿠키를 사용해 이용자의 이 사이트 및 다른 웹사이트 방문 기록을 바탕으로 광고를 제공할 수 있습니다. Google은 광고 쿠키를 사용해 이용자에게 이 사이트와 다른 사이트 방문 정보를 바탕으로 한 광고를 표시할 수 있습니다.',
      'Google 광고 설정에서 맞춤 광고를 사용 중지할 수 있으며, aboutads.info에서 제3자 광고 사업자의 맞춤 광고 쿠키 사용을 거부할 수 있습니다.',
    ],
    links: [
      { href: 'https://adssettings.google.com/', label: 'Google 광고 설정' },
      { href: 'https://policies.google.com/technologies/ads?hl=ko', label: 'Google의 광고 쿠키 사용 안내' },
      { href: 'https://www.aboutads.info/choices/', label: '제3자 맞춤 광고 거부(aboutads.info)' },
    ],
  },
  {
    heading: '운영 주체 및 개인정보 보호책임자',
    paragraphs: [
      'VDébut은 사업자 등록이 없는 개인이 운영하는 독립 서비스입니다.',
      '개인정보 보호책임자: VDébut 운영자 (이메일 ru_0120@naver.com). 개인정보 관련 문의·열람·정정·삭제 요청은 이 이메일 또는 문의 화면으로 접수하며, 확인 후 지체 없이 처리합니다.',
    ],
  },
  { heading: '정보 열람·정정·삭제 문의', paragraphs: ['정보의 열람·정정·삭제 요청은 문의 화면 또는 아래 이메일로 접수할 수 있습니다.'] },
  { heading: '시행일', paragraphs: ['이 개인정보처리방침은 2026년 11월 12일부터 시행합니다. 내용이 바뀌면 이 페이지에 변경 내용과 새 시행일을 안내합니다.'] },
];

export const TERMS_SECTIONS: PolicySection[] = [
  { heading: '서비스 이용 목적', paragraphs: ['VDébut은 버튜버의 데뷔 일정, 소개와 방송 활동 정보를 제공하는 독립 서비스입니다. 서비스 운영을 위해 광고가 표시될 수 있습니다.'] },
  { heading: '등록 콘텐츠의 공개 기준', paragraphs: ['등록 신청은 운영자 검토 후 공개됩니다. 허위 정보, 사칭, 권리 침해 또는 공개 기준에 맞지 않는 콘텐츠는 보완 요청, 공개 보류 또는 삭제할 수 있습니다.', '소개·이미지·영상과 외부 링크도 검토 대상입니다. 팬 제보에는 확인 가능한 공식 출처를 함께 남겨 주세요.'] },
  { heading: '이미지·소개글과 브랜드', paragraphs: ['등록하는 이미지·소개글·영상에는 필요한 사용 권한이 있어야 합니다. 크리에이터의 저작물과 각 플랫폼의 상표는 해당 권리자에게 귀속됩니다.'] },
  { heading: '정보 수정·콘텐츠 신고', paragraphs: ['정보나 이미지의 정정·삭제, 사칭과 부적절한 콘텐츠 신고는 문의 화면 또는 ru_0120@naver.com으로 접수합니다. 운영자가 요청 내용과 권리를 확인한 뒤 처리합니다.'] },
  { heading: '방송 일정 변경', paragraphs: ['방송 일정은 변경·연기·취소될 수 있습니다. 최신 일정은 크리에이터의 공지를 함께 확인해 주세요. 저장한 일정은 변경된 공지와 대조해 수정해 주세요.'] },
];

// 서비스 소개 화면(PortalAbout)과 같은 문구를 초기 HTML에도 제공한다.
export const ABOUT_INTRO = { heading: '누가 데뷔하는지, 어떤 방송을 하는지.', text: '여러 나라와 방송 플랫폼에서 새로운 버튜버가 첫 방송을 시작합니다. VDébut에서는 데뷔 일정과 소개를 함께 살펴보고, 마음이 가는 버튜버의 방송 채널로 찾아갈 수 있어요.' };
export const ABOUT_CARDS = [
  { title: '언제 만날까요?', text: '달력에서 데뷔 날짜와 시간, 방송 플랫폼을 확인하세요.', to: '/', link: '데뷔 일정 보기' },
  { title: '어떤 버튜버일까요?', text: '소개와 주요 콘텐츠를 살펴보며 내 취향의 방송을 찾아보세요.', to: '/creators', link: '버튜버 둘러보기' },
  { title: '나를 소개하고 싶어요', text: '신규 데뷔 소식이나 활동 중인 나의 소개를 직접 등록하세요.', to: '/upload', link: '데뷔 소식 등록' },
];
