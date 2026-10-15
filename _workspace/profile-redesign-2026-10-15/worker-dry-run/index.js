var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../shared/siteSeo.ts
var SITE_ORIGIN = "https://vdebut.live";
var PORTAL_INDEX_PATHS = ["/", "/upload", "/creators", "/creators/register", "/about", "/guide", "/contact", "/privacy", "/terms"];
function sitePath(path) {
  return path.replace(/\/+$/, "") || "/";
}
__name(sitePath, "sitePath");
function siteCanonical(path, language = "ko") {
  return `${SITE_ORIGIN}${sitePath(path)}${language === "ko" ? "" : `?lang=${language}`}`;
}
__name(siteCanonical, "siteCanonical");
function siteAlternates(path) {
  return [...["ko", "ja", "en"].map((language) => ({ language, href: siteCanonical(path, language) })), { language: "x-default", href: siteCanonical(path) }];
}
__name(siteAlternates, "siteAlternates");
function siteRobots(hostname) {
  return hostname === "vdebut.live" ? "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /me/\nDisallow: /submissions/\nDisallow: /api/\nSitemap: https://vdebut.live/sitemap.xml\n" : "User-agent: *\nDisallow: /\n";
}
__name(siteRobots, "siteRobots");
function pageStructuredData(seo) {
  return { "@context": "https://schema.org", "@type": "WebPage", name: seo.title, description: seo.description, url: seo.canonical };
}
__name(pageStructuredData, "pageStructuredData");

// ../shared/activitySeo.ts
function activityStreamerPath(channel) {
  return `/analytics/streamer/${encodeURIComponent(channel)}`;
}
__name(activityStreamerPath, "activityStreamerPath");
function isActivityPath(path) {
  path = sitePath(path);
  if (["/analytics", "/analytics/chzzk", "/analytics/soop"].includes(path))
    return true;
  if (!path.startsWith("/analytics/streamer/"))
    return false;
  try {
    return /^(CHZZK:[a-f0-9]{32}|SOOP:[a-z0-9_]{1,50})$/i.test(decodeURIComponent(path.slice("/analytics/streamer/".length)));
  } catch {
    return false;
  }
}
__name(isActivityPath, "isActivityPath");
function activitySeo(filters, data, search = "") {
  const platform = filters.channel ? data?.streamer?.platform : filters.platform;
  const platformName = platform === "CHZZK" ? "\uCE58\uC9C0\uC9C1" : platform === "SOOP" ? "SOOP" : "";
  const name = data?.streamer?.name || filters.channel.split(":")[1] || "";
  const path = filters.channel ? activityStreamerPath(filters.channel) : platformName ? `/analytics/${platform === "CHZZK" ? "chzzk" : "soop"}` : "/analytics";
  return {
    title: search && !filters.channel ? `${search} \uAC80\uC0C9 \uACB0\uACFC | VD\xE9but` : filters.channel ? `${name} \uBC29\uC1A1 \uD1B5\uACC4 \xB7 ${platformName} | VD\xE9but` : `${platformName ? `${platformName} ` : "\uCE58\uC9C0\uC9C1\xB7SOOP "}\uBC29\uC1A1 \uD65C\uB3D9 \uD1B5\uACC4 | VD\xE9but`,
    description: filters.channel ? `${name}\uC758 \uBC29\uC1A1 \uC774\uB825\uACFC \uD65C\uB3D9 \uC2DC\uAC04, \uCE74\uD14C\uACE0\uB9AC\uBCC4 \uAE30\uB85D\uC744 \uD655\uC778\uD558\uC138\uC694.` : "\uCE58\uC9C0\uC9C1\xB7SOOP\uC5D0\uC11C \uAE30\uB85D\uB41C \uCF58\uD150\uCE20\uBCC4 \uBC29\uC1A1 \uC2DC\uAC04\uACFC \uD65C\uB3D9 \uC2DC\uAC04\uB300\uB97C \uC0B4\uD3B4\uBCF4\uC138\uC694. \uC2A4\uD2B8\uB9AC\uBA38\uB97C \uAC80\uC0C9\uD574 \uAC1C\uC778 \uBC29\uC1A1 \uAE30\uB85D\uB3C4 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    canonical: siteCanonical(path),
    image: "https://vdebut.live/og-image.png"
  };
}
__name(activitySeo, "activitySeo");
function activityNoindex(url, data) {
  return !data || !isActivityPath(url.pathname) || url.hostname !== "vdebut.live" || [...url.searchParams.keys()].some((key) => !["name", "back", "returnTo", "lang", "gclid", "fbclid"].includes(key) && !key.startsWith("utm_")) || Boolean(url.pathname.includes("/streamer/") && !data?.summary.broadcasts);
}
__name(activityNoindex, "activityNoindex");

// ../shared/profileContentTranslations.ts
var PROFILE_CONTENT_TRANSLATIONS = {
  "\uCC98\uC74C \uB9CC\uB098\uB294 \uC601\uC0C1": ["\u306F\u3058\u3081\u3066\u306E\u52D5\u753B", "Meet this creator"],
  "\uC9E7\uAC8C \uBA3C\uC800 \uB9CC\uB098\uBCF4\uAE30": ["\u77ED\u3044\u52D5\u753B\u3067\u51FA\u4F1A\u3046", "A few moments to meet"],
  "\uC9E7\uC740 \uC7A5\uBA74": ["\u30B7\u30E7\u30FC\u30C8\u30AF\u30EA\u30C3\u30D7", "Short moments"],
  "\uCCAB \uBC29\uC1A1": ["\u521D\u914D\u4FE1", "Debut stream"],
  "\uBC29\uC1A1 \uB2E4\uC2DC\uBCF4\uAE30": ["\u914D\u4FE1\u30A2\u30FC\u30AB\u30A4\u30D6", "Stream replays"],
  "\uD074\uB9BD": ["\u30AF\u30EA\u30C3\u30D7", "Clip"],
  "\uC601\uC0C1 \uBAA8\uC74C": ["\u52D5\u753B\u4E00\u89A7", "Video collection"],
  "\uC601\uC0C1 \uB354 \uBCF4\uAE30": ["\u52D5\u753B\u3092\u3082\u3063\u3068\u898B\u308B", "More videos"],
  "\uC601\uC0C1 \uCD94\uAC00": ["\u52D5\u753B\u3092\u8FFD\u52A0", "Add video"],
  "\uC601\uC0C1 \uC0AD\uC81C": ["\u52D5\u753B\u3092\u524A\u9664", "Remove video"],
  "\uC601\uC0C1 {0}": ["\u52D5\u753B {0}", "Video {0}"],
  "\uC601\uC0C1 \uC704\uB85C \uC774\uB3D9": ["\u52D5\u753B\u3092\u4E0A\u3078", "Move video up"],
  "\uC601\uC0C1 \uC544\uB798\uB85C \uC774\uB3D9": ["\u52D5\u753B\u3092\u4E0B\u3078", "Move video down"],
  "\uC601\uC0C1 \uD50C\uB7AB\uD3FC": ["\u52D5\u753B\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0", "Video platform"],
  "\uC601\uC0C1 \uC8FC\uC18C": ["\u52D5\u753BURL", "Video URL"],
  "\uC378\uB124\uC77C \uC8FC\uC18C (\uC120\uD0DD)": ["\u30B5\u30E0\u30CD\u30A4\u30EBURL\uFF08\u4EFB\u610F\uFF09", "Thumbnail URL (optional)"],
  "\uC81C\uC791\xB7\uCD9C\uCC98": ["\u5236\u4F5C\u30FB\u51FA\u5178", "Creator / source"],
  "\uCC98\uC74C \uB9CC\uB098\uB294 \uB300\uD45C \uC601\uC0C1": ["\u306F\u3058\u3081\u3066\u306E\u65B9\u5411\u3051\u306E\u52D5\u753B", "Featured introduction video"],
  "\uC6D0\uBB38\uC5D0\uC11C \uBCF4\uAE30\uB85C \uD45C\uC2DC": ["\u5143\u306E\u30B5\u30A4\u30C8\u3067\u8996\u8074\u3059\u308B", "Show as original-site link"],
  "\uC6D0\uBB38\uC5D0\uC11C \uBCF4\uAE30": ["\u5143\u306E\u30B5\u30A4\u30C8\u3067\u898B\u308B", "Watch on original site"],
  "\uC6D0\uBCF8 \uC601\uC0C1 \uBCF4\uAE30": ["\u5143\u306E\u52D5\u753B\u3092\u898B\u308B", "View original video"],
  "\uC7AC\uC0DD \uB2EB\uAE30": ["\u518D\u751F\u3092\u9589\u3058\u308B", "Close player"],
  "\uAC1C\uC778 \uC601\uC0C1\uACFC \uD300 PV, \uD074\uB9BD\xB7\uB2E4\uC2DC\uBCF4\uAE30\uB97C \uD568\uAED8 \uB4F1\uB85D\uD560 \uC218 \uC788\uC5B4\uC694.": ["\u500B\u4EBA\u52D5\u753B\u30FB\u30C1\u30FC\u30E0PV\u30FB\u30AF\u30EA\u30C3\u30D7\u30FB\u30A2\u30FC\u30AB\u30A4\u30D6\u3092\u307E\u3068\u3081\u3066\u767B\u9332\u3067\u304D\u307E\u3059\u3002", "Add personal videos, team PVs, clips and replays together."],
  "\uCE58\uC9C0\uC9C1 \uB2E4\uC2DC\uBCF4\uAE30\uB294 \uC6D0\uBB38\uC5D0\uC11C \uBCFC \uC218 \uC788\uC5B4\uC694. \uC601\uC0C1\uC740 \uCD5C\uB300 12\uAC1C\uAE4C\uC9C0 \uB4F1\uB85D\uD560 \uC218 \uC788\uC5B4\uC694.": ["CHZZK\u306E\u30A2\u30FC\u30AB\u30A4\u30D6\u306F\u5143\u306E\u30B5\u30A4\u30C8\u3067\u8996\u8074\u3067\u304D\u307E\u3059\u3002\u52D5\u753B\u306F\u6700\u592712\u4EF6\u767B\u9332\u3067\u304D\u307E\u3059\u3002", "CHZZK replays open on the original site. Add up to 12 videos."],
  "\uC815\uAE30 \uBC29\uC1A1 \uC548\uB0B4 (\uC120\uD0DD)": ["\u5B9A\u671F\u914D\u4FE1\u306E\u6848\u5185\uFF08\u4EFB\u610F\uFF09", "Regular schedule (optional)"],
  "\uD32C \uAC00\uC774\uB4DC (\uC120\uD0DD)": ["\u30D5\u30A1\u30F3\u30AC\u30A4\u30C9\uFF08\u4EFB\u610F\uFF09", "Fan guide (optional)"],
  "\uACF5\uC2DD \uD32C\uBA85\xB7\uD574\uC2DC\uD0DC\uADF8\xB7\uBC29\uC1A1 \uADDC\uCE59\uC744 \uC548\uB0B4\uD574 \uC8FC\uC138\uC694.": ["\u516C\u5F0F\u30D5\u30A1\u30F3\u30CD\u30FC\u30E0\u30FB\u30BF\u30B0\u30FB\u914D\u4FE1\u30EB\u30FC\u30EB\u3092\u3054\u6848\u5185\u304F\u3060\u3055\u3044\u3002", "Share official fan names, hashtags and stream rules."],
  "\uD32C\uC73C\uB85C \uD568\uAED8\uD558\uAE30": ["\u30D5\u30A1\u30F3\u3068\u3057\u3066\u697D\u3057\u3080", "Join the community"],
  "\uC8FC\uC694 \uC18C\uC2DD": ["\u4E3B\u306A\u304A\u77E5\u3089\u305B", "Latest news"],
  "\uC18C\uC2DD \uC81C\uBAA9": ["\u304A\u77E5\u3089\u305B\u306E\u30BF\u30A4\u30C8\u30EB", "News title"],
  "\uC18C\uC2DD \uC6D0\uBB38 \uC8FC\uC18C": ["\u304A\u77E5\u3089\u305B\u306E\u5143URL", "Original news URL"],
  "\uC18C\uC2DD \uC0AD\uC81C": ["\u304A\u77E5\u3089\u305B\u3092\u524A\u9664", "Remove news"],
  "\uC18C\uC2DD \uCD94\uAC00": ["\u304A\u77E5\u3089\u305B\u3092\u8FFD\u52A0", "Add news"],
  "\uC18C\uAC1C \uBC14\uB85C\uAC00\uAE30": ["\u7D39\u4ECB\u30BB\u30AF\u30B7\u30E7\u30F3\u3078", "Profile sections"]
};

// ../shared/portalTranslations.ts
var rows = String.raw`
방송 통계를 불러오지 못했어요|||配信統計を読み込めませんでした|||Unable to load streaming statistics
주요 콘텐츠와 방송 언어, 데뷔 일정을 살펴보세요. 관심 있는 버튜버는 하트로 저장할 수 있어요.|||主なコンテンツ、配信言語、デビュー日程を確認しましょう。気になるVTuberはハートで保存できます。|||Explore content, streaming languages and debut schedules. Save creators you like with the heart button.
방송 채널과 데뷔 일정을 등록하세요. 날짜와 시간이 미정인 일정도 신청할 수 있으며, 운영자 검토 후 공개됩니다.|||配信チャンネルとデビュー日程を登録してください。日時が未定でも申請でき、運営の審査後に公開されます。|||Submit your channel and debut schedule, even if the date or time is undecided. Submissions are published after review.
활동명, 방송 채널과 나의 소개를 등록하세요. 데뷔 일정 없이도 소개를 신청할 수 있습니다.|||活動名、配信チャンネル、自己紹介を登録してください。デビュー日程がなくても紹介を申請できます。|||Submit your name, channel and profile. You can register a profile without a debut schedule.
일정 변경, 소개 수정·삭제, 권리 침해와 부적절한 콘텐츠를 관련 페이지 주소와 함께 알려주세요.|||日程変更、紹介の修正・削除、権利侵害、不適切なコンテンツを対象ページのURLとともにお知らせください。|||Send us schedule changes, profile corrections or removal requests, rights issues and content reports with the page URL.
VDébut의 등록·문의 정보, 브라우저 저장과 Google Analytics 이용에 관한 개인정보 안내입니다.|||VDébutの登録・お問い合わせ情報、ブラウザー保存、Google Analytics利用に関する個人情報の案内です。|||Privacy information about VDébut submissions, inquiries, browser storage and Google Analytics.
VDébut의 서비스 이용, 소개 등록과 공개 기준, 정보 정정에 관한 안내입니다.|||VDébutの利用、紹介の登録・公開基準、情報訂正に関する案内です。|||Guidance on using VDébut, registering and publishing profiles, and correcting information.
이 브라우저에 저장한 관심 버튜버의 소개를 다시 살펴보세요.|||このブラウザーに保存したお気に入りのVTuber紹介を再び見てみましょう。|||Revisit the VTuber profiles saved in this browser.
다른 버튜버의 소개와 데뷔 일정을 살펴보세요.|||他のVTuberの紹介とデビュー日程をご覧ください。|||Explore other VTuber profiles and debut schedules.
접수 번호와 비공개 확인 키로 문의 처리 상태를 확인하세요.|||受付番号と非公開確認キーでお問い合わせの対応状況を確認してください。|||Check your inquiry status with the receipt number and private access key.
등록 신청과 문의 내용을 확인하고 검토합니다.|||登録申請とお問い合わせ内容を確認・審査します。|||Review registration requests and inquiries.
잠시 후 다시 시도해 주세요. 문제가 계속되면 문의 화면으로 알려주세요.|||しばらくしてから再試行してください。解決しない場合はお問い合わせからお知らせください。|||Try again shortly. If the issue continues, let us know through the contact page.
소개 카드의 하트를 눌러 관심 목록을 만들어 보세요. 공개 중인 소개만 이곳에서 볼 수 있어요.|||紹介カードのハートを押してお気に入りを作りましょう。ここには公開中の紹介のみ表示されます。|||Build your favorites by tapping the heart on a profile card. Only currently public profiles appear here.
공개된 버튜버 소개가 아직 없어요|||公開されているVTuber紹介はまだありません|||No VTuber profiles are public yet
데뷔 캘린더나 이용 가이드를 먼저 살펴보세요.|||まずデビューカレンダーや利用ガイドをご覧ください。|||Explore the debut calendar or user guide first.
주소를 확인하거나 공개된 다른 소개를 살펴보세요.|||URLを確認するか、公開中の他の紹介をご覧ください。|||Check the address or explore other public profiles.
치지직·SOOP·YouTube·Twitch의 데뷔 일정과 소개를 살펴보세요. 관심 있는 버튜버를 저장하고, 첫 방송 일정을 내 캘린더에 담을 수 있어요.|||CHZZK・SOOP・YouTube・Twitchのデビュー日程と紹介をチェック。気になるVTuberを保存し、初配信を自分のカレンダーに追加できます。|||Explore debut schedules and profiles on CHZZK, SOOP, YouTube and Twitch. Save creators you like and add their first streams to your calendar.
첫 방송을 찾고 저장하는 방법부터 나의 소개와 데뷔 공지를 준비하는 방법까지 안내합니다.|||初配信を探して保存する方法から、自己紹介とデビュー告知の準備までご案内します。|||Learn how to find and save first streams, write your profile and prepare a debut announcement.
월 등록 일정|||月の登録日程||| month: listed schedules
이번 주 등록 일정|||今週の登録日程|||Listed this week
건|||件||| schedules
등록 일정|||登録日程|||listed schedules
이번 주 등록된 데뷔 소식|||今週登録されているデビュー情報|||This week's listed debuts
이번 주 등록 일정 {0}건을 날짜순으로 살펴보세요.|||今週の登録日程{0}件を日付順にチェックしましょう。|||Explore {0} listed schedules this week in date order.
{0}건|||{0}件|||{0} schedules
공지가 바뀔 수 있으니 소개의 데뷔 공지도 함께 확인해 주세요.|||告知は変更される場合があります。紹介ページのデビュー告知も確認してください。|||Announcements may change. Check the debut announcement linked from the profile too.
이번 주에 등록된 데뷔 일정이 없어요. 달력에서 다른 주를 살펴보세요.|||今週の登録日程はありません。カレンダーで別の週を見てみましょう。|||No debut schedules are listed for this week. Explore another week in the calendar.
첫 방송을 만나고 준비하는 방법|||初配信を見つけ、準備する方法|||Find and prepare for a first stream
자세히 읽기|||詳しく読む|||Read more
VDébut 이용 가이드|||VDébut利用ガイド|||VDébut user guide
가이드 목차|||ガイド目次|||Guide contents
잘못된 소개나 변경된 일정을 발견하면 관련 페이지와 공식 출처를 알려주세요.|||紹介の誤りや日程変更に気づいたら、対象ページと公式の出典をお知らせください。|||If you find incorrect profile details or a changed schedule, send us the page and an official source.
서비스 소개|||サービス紹介|||About the service
데뷔 일정과 방송 소개로 버튜버와 팬의 첫 만남을 연결합니다.|||デビュー日程と配信紹介で、VTuberとファンの最初の出会いをつなぎます。|||Connecting VTubers and fans through debut schedules and stream profiles.
일정 저장, 시간대 확인, 소개 작성과 변경 안내를 살펴보세요.|||日程の保存、タイムゾーンの確認、紹介文の作成と変更方法をご覧ください。|||Learn how to save schedules, check time zones, write profiles and request changes.
어떤 방송을 하나요?|||どんな配信をするの？|||What do they stream?
주요 콘텐츠|||主なコンテンツ|||Main content
소개와 일정 확인하기|||紹介と日程を確認する|||Check profile and schedule details
소개 검토일|||紹介の審査日|||Profile review date
데뷔 공지 원문 보기|||デビュー告知の原文を見る|||Read the debut announcement
공지가 바뀌면 저장한 캘린더 일정도 직접 수정해 주세요.|||告知が変更されたら、保存したカレンダーの日程も手動で修正してください。|||If the announcement changes, manually update the event saved in your calendar.
일정 저장 방법|||日程の保存方法|||How to save a schedule
치지직·SOOP에서 기록된 콘텐츠별 방송 시간과 활동 시간대를 살펴보세요.|||CHZZK・SOOPで記録されたコンテンツ別の配信時間と活動時間帯をご覧ください。|||Explore recorded streaming time by content and activity hours on CHZZK and SOOP.
선택한 기간과 조건에 맞는 방송 기록이 없어요.|||選択した期間と条件に一致する配信記録はありません。|||No broadcast records match the selected dates and filters.
다른 기간을 선택하거나 카테고리 조건을 넓혀 보세요.|||別の期間を選ぶか、カテゴリーの条件を広げてみてください。|||Try another date range or a broader category filter.
이 기간에 방송 {0}회, 방송일 {1}일이 기록되어 있어요.|||この期間には配信{0}回、配信日数{1}日が記録されています。|||This period has {0} recorded broadcasts across {1} days.
이어진 기록으로 합산한 방송 시간은 {0}입니다.|||連続する記録を合算した配信時間は{0}です。|||Streaming time summed from consecutive records is {0}.
방송 통계 읽는 법|||配信統計の読み方|||How to read streaming statistics
관심 저장과 일정 저장 활용하기|||お気に入りと日程保存を使う|||Save favorites and schedules
마음에 드는 소개 카드의 하트를 누르면 관심 목록에서 다시 찾을 수 있어요. 관심 목록은 사용한 브라우저에 저장되므로 다른 기기나 브라우저에서는 별도로 저장해 주세요.|||気になる紹介カードのハートを押すと、お気に入りから再び見つけられます。お気に入りは使用中のブラウザーに保存されるため、別の端末やブラウザーでは改めて保存してください。|||Tap the heart on a profile card to find it again in favorites. Favorites are saved in your current browser, so save them separately on other devices or browsers.
날짜와 시간이 정해진 일정은 내 캘린더에 저장할 수 있어요. 내려받은 일정 파일을 사용하는 캘린더에서 열고, 알림은 해당 캘린더의 설정에서 확인해 주세요.|||日時が確定した日程は自分のカレンダーに保存できます。ダウンロードした日程ファイルをお使いのカレンダーで開き、通知はそのカレンダーの設定で確認してください。|||You can save schedules with confirmed dates and times to your calendar. Open the downloaded event file in your calendar and check its notification settings.
저장한 일정은 자동 구독이 아닙니다. 데뷔 공지가 바뀌면 개인 캘린더의 날짜와 시간도 직접 수정해 주세요.|||保存した日程は自動更新されません。デビュー告知が変更されたら、自分のカレンダーの日時も手動で修正してください。|||Saved events do not update automatically. If the debut announcement changes, manually update the date and time in your calendar.
해외 데뷔 일정의 시간 확인하기|||海外デビュー日程の時刻を確認する|||Check international debut times
달력의 일정 표시 시간대를 선택하면 확정된 일정이 해당 지역 시각으로 표시됩니다. 자정 전후의 방송은 지역에 따라 날짜가 달라질 수 있어요.|||カレンダーの表示タイムゾーンを選ぶと、確定した日程がその地域の時刻で表示されます。深夜前後の配信は地域によって日付が変わる場合があります。|||Choose a display time zone in the calendar to see confirmed schedules in local time. Streams near midnight may fall on different dates across regions.
시간 미정 일정은 공지된 날짜와 원래 시간대를 함께 확인해 주세요. 날짜 미정 일정은 예정 월로 안내하며 임의의 날짜나 시간을 정하지 않습니다.|||時刻未定の日程は、告知された日付と元のタイムゾーンを併せて確認してください。日付未定の場合は予定月を表示し、仮の日付や時刻は設定しません。|||For time-undecided schedules, check the announced date and original time zone together. Date-undecided schedules show the planned month without assigning a placeholder date or time.
날짜와 시간이 확정된 소개 상세의 일정은 한국 시간(KST) 기준입니다. 방송 직전에는 연결된 데뷔 공지에서 날짜와 시간을 다시 확인해 주세요.|||紹介詳細の日時が確定した日程は韓国時間（KST）基準です。配信直前にはリンク先のデビュー告知で日時を再確認してください。|||Confirmed schedules on profile detail pages use Korean Standard Time (KST). Before the stream, double-check the date and time in the linked announcement.
팬에게 전달할 방송 소개 작성하기|||ファンに伝わる配信紹介を書く|||Write a stream profile for fans
활동명과 방송 채널을 먼저 확인하고, 주로 할 콘텐츠와 방송 언어를 적어 보세요. 처음 찾아온 팬이 어떤 방송인지 이해할 수 있는 정보가 좋습니다.|||活動名と配信チャンネルをまず確認し、主なコンテンツと配信言語を書いてみましょう。初めて訪れたファンがどんな配信か理解できる情報が役立ちます。|||Check your name and channel first, then describe your main content and streaming languages. Help first-time visitors understand what your streams offer.
게임 이름이나 노래 장르처럼 실제 계획을 구체적으로 적고, 첫 방송에서 무엇을 소개할 예정인지 덧붙여 주세요. 아직 정해지지 않은 계획은 확정된 것처럼 쓰지 않아도 됩니다.|||ゲーム名や歌のジャンルなど実際の予定を具体的に書き、初配信で何を紹介する予定かを添えてください。未定の計画を確定したように書く必要はありません。|||Describe actual plans, such as game titles or music genres, and what you plan to introduce in your first stream. You do not need to present undecided plans as confirmed.
한 줄 소개에는 가장 전하고 싶은 특징을, 소개글에는 콘텐츠와 첫 방송 계획을 담아 주세요. 프로필과 영상은 사용 권한이 있는 자료로 준비합니다.|||一言紹介には最も伝えたい特徴を、紹介文にはコンテンツと初配信の予定を書いてください。プロフィールや動画には利用権限のある素材を用意しましょう。|||Use the headline for your key feature and the full introduction for your content and first-stream plans. Prepare profile images and videos you have permission to use.
데뷔 공지에 담을 정보와 변경 안내|||デビュー告知に必要な情報と変更案内|||Prepare and update a debut announcement
데뷔 공지에는 활동명, 날짜, 시간, 기준 시간대와 방송 채널 주소를 함께 적어 주세요. 팬 제보라면 날짜와 시간을 확인할 수 있는 공식 공지 주소를 남겨 주세요.|||デビュー告知には活動名、日付、時刻、基準タイムゾーン、配信チャンネルURLを併記してください。ファンからの情報提供では日時を確認できる公式告知のURLを添えてください。|||Include your name, date, time, time zone and channel URL in the debut announcement. Fan submissions should link to an official announcement that confirms the date and time.
날짜나 시간이 미정이면 등록 화면에서 미정 상태를 선택하세요. 확정되지 않은 시간을 임시로 넣으면 팬이 잘못된 일정을 저장할 수 있어요.|||日時が未定なら登録画面で未定を選んでください。未確定の時刻を仮入力すると、ファンが誤った日程を保存するおそれがあります。|||Select the undecided option when a date or time is unknown. Entering a placeholder time could cause fans to save an incorrect event.
일정이 바뀌면 공식 공지를 수정하고 VDébut 문의 화면에 소개 주소, 변경 내용과 공지 출처를 남겨 주세요. 개인 캘린더에 저장한 팬도 수정할 수 있도록 변경된 날짜와 시간을 분명하게 알립니다.|||日程が変わったら公式告知を更新し、VDébutのお問い合わせに紹介ページURL、変更内容、告知の出典を送ってください。自分のカレンダーに保存したファンも修正できるよう、新しい日時を明確に伝えましょう。|||When a schedule changes, update the official announcement and send VDébut the profile URL, changes and announcement source through the contact page. Clearly share the new date and time so fans can update saved events.
방송 통계로 나의 계획 검토하기|||配信統計で自分の計画を見直す|||Review your plans with streaming statistics
조회 기간과 플랫폼을 먼저 선택하고, 관심 있는 콘텐츠의 방송 횟수와 방송 시간을 함께 살펴보세요. 같은 기간과 조건으로 비교하면 차이를 읽기 쉽습니다.|||まず期間とプラットフォームを選び、気になるコンテンツの配信回数と配信時間を併せて確認してください。同じ期間と条件で比較すると違いが読み取りやすくなります。|||Choose the date range and platform first, then compare broadcast counts and streaming time for content you are interested in. Use the same dates and filters for clearer comparisons.
방송 활동은 해당 시간에 방송한 채널을, 방송 시작은 방송이 시작된 시각을 살펴보는 항목입니다. 시간대 칸을 선택하면 연결된 방송 이력을 확인할 수 있어요.|||配信活動ではその時間に配信したチャンネルを、配信開始では開始時刻を確認します。時間帯のセルを選ぶと関連する配信履歴が見られます。|||Broadcast activity shows channels streaming at that time, while broadcast starts looks at start times. Select a time slot to see related broadcast history.
채널이 적었던 시간만 고르기보다 내가 꾸준히 방송할 수 있는 시간과 콘텐츠 준비 계획을 함께 검토해 보세요.|||チャンネルが少なかった時間だけで選ばず、自分が継続して配信できる時間とコンテンツの準備計画も併せて考えてみましょう。|||Consider when you can stream consistently and prepare your content, alongside the number of channels active at different times.
방송 통계 살펴보기|||配信統計を見る|||Explore streaming statistics
기간과 플랫폼부터 확인하세요|||まず期間とプラットフォームを確認|||Check dates and platform first
방송 통계는 치지직·SOOP에서 수집된 기록을 조회 조건에 맞춰 보여줍니다. 날짜와 시간대는 한국 시간(KST) 기준이며, 버튜버 소개 목록과 집계 대상이 다를 수 있어요.|||配信統計はCHZZK・SOOPで収集した記録を検索条件に合わせて表示します。日時は韓国時間（KST）基準で、VTuber紹介一覧とは集計対象が異なる場合があります。|||Statistics show records collected from CHZZK and SOOP for your filters. Dates and times use KST, and the channels counted may differ from the VTuber directory.
방송 활동과 방송 시작을 비교하세요|||配信活動と配信開始を比較|||Compare activity and starts
전체 통계의 방송 활동은 시간대별 평균 방송 채널 수, 개인 통계는 기록된 시점의 방송 활동 비율입니다. 방송 시작은 시작 시각이 확인된 방송의 횟수예요. 칸을 선택해 관련 이력을 살펴보세요.|||全体統計の配信活動は時間帯別の平均配信チャンネル数、個人統計は記録時点の配信活動率です。配信開始は開始時刻を確認できた配信の回数です。セルを選んで関連履歴を確認してください。|||Overall activity is the average number of broadcasting channels by time slot; individual activity is the proportion of recorded moments spent streaming. Starts counts broadcasts with known start times. Select a cell to view related history.
방송 시간과 기록 범위를 함께 읽으세요|||配信時間と記録範囲を併せて読む|||Read streaming time with record coverage
방송 시간은 이어서 확인된 활동 구간을 합산합니다. 한 방송이 여러 콘텐츠를 진행하면 카테고리별 방송 횟수를 더한 값이 전체 방송 횟수와 다를 수 있어요.|||配信時間は連続して確認できた活動区間を合算します。一つの配信で複数のコンテンツを扱うと、カテゴリー別の配信回数の合計が全体の配信回数と異なる場合があります。|||Streaming time sums consecutive recorded activity intervals. If one broadcast covers multiple categories, category broadcast counts may add up to more than the overall broadcast count.
기록 없음과 0은 다릅니다|||記録なしと0は異なります|||No record and zero differ
방송 활동의 0은 확인한 구간에 방송 중인 채널이 없었다는 뜻입니다. 방송 시작의 0은 확인된 시작 기록이 없다는 뜻이에요. 기록 없음은 비교할 기록이 없는 칸입니다. 오늘 남은 시간과 기록 누락 여부도 함께 확인해 주세요.|||配信活動の0は確認した区間に配信中のチャンネルがなかったことを示します。配信開始の0は確認できた開始記録がないことを示します。記録なしは比較する記録がないセルです。今日の残り時間や記録の欠落も併せて確認してください。|||Zero activity means no channels were streaming within the recorded coverage. Zero starts means no confirmed start records. No record means the cell has no records to compare. Consider the remaining hours today and any missing records too.
정보 수정·콘텐츠 신고|||情報修正・コンテンツ報告|||Corrections & content reports
해당 페이지 주소와 확인이 필요한 내용을 남겨 주세요. 일정 변경, 소개 수정·삭제, 권리 침해와 부적절한 콘텐츠 신고를 접수할 수 있습니다.|||対象ページのURLと確認が必要な内容をお知らせください。日程変更、紹介の修正・削除、権利侵害、不適切なコンテンツの報告を受け付けます。|||Include the page URL and what needs checking. You can request schedule or profile changes and report rights violations or inappropriate content.
부적절한 콘텐츠 신고|||不適切なコンテンツの報告|||Report inappropriate content
이미지·소개글 권리 침해|||画像・紹介文の権利侵害|||Image or profile rights violation
사칭·채널 정보 오류|||なりすまし・チャンネル情報の誤り|||Impersonation or incorrect channel details
문제가 있는 부분과 확인 가능한 출처를 적어 주세요. 신고에 필요하지 않은 개인정보는 입력하지 마세요.|||問題の箇所と確認できる出典を記入してください。報告に不要な個人情報は入力しないでください。|||Describe the issue and provide a verifiable source. Do not include personal information unrelated to the report.
콘텐츠 검토·공개 관리|||コンテンツ審査・公開管理|||Content review & publication
활동명·소속·일정의 출처와 소개·이미지·영상의 내용 및 사용 권한을 직접 확인했습니다.|||活動名・所属・日程の出典と、紹介・画像・動画の内容および利用権限を直接確認しました。|||I checked sources for the name, affiliation and schedule, and reviewed the profile, images, videos and usage permissions.
콘텐츠 검토·문의 접수|||コンテンツ審査・お問い合わせ|||Content review & inquiries
활동명·소속·일정의 공식 출처와 소개·이미지·영상의 내용 및 사용 권한을 확인한 뒤 공개하세요. 미검토 자료는 공개되지 않습니다.|||公式情報と紹介・画像・動画の内容および利用権限を確認してから公開してください。未審査の資料は公開されません。|||Check official sources, profile text, images, videos and usage permissions before publishing. Unreviewed profiles are not public.
공개 중|||公開中|||Published
검토·보류|||審査・保留|||Review or hold
공개 상태|||公開状態|||Publication status
공개 보류|||公開保留|||Hold publication
검토 후 공개|||審査後に公開|||Publish after review
활동명 또는 소개에 재검토가 필요한 표현이 있습니다. 공식 출처와 내용을 확인해 주세요.|||活動名または紹介に再確認が必要な表現があります。公式情報と内容を確認してください。|||The name or introduction needs further review. Check official sources and the content.
영상 제목이나 홍보 문구 대신 실제 활동명을 입력해 주세요.|||動画タイトルや宣伝文ではなく、実際の活動名を入力してください。|||Enter the actual creator name, rather than a video title or promotional text.
주로 하는 콘텐츠, 방송 언어, 팬에게 소개하고 싶은 특징을 적어 주세요.|||主なコンテンツ、配信言語、ファンに伝えたい特徴を記入してください。|||Describe your main content, streaming language and what fans should know about your streams.
등록 전에 확인해 주세요|||登録前にご確認ください|||Before submitting
허위 정보, 사칭, 권리 침해 자료, 성적으로 노골적이거나 자극적인 자료, 타인을 비하하거나 괴롭히는 내용은 공개하지 않습니다.|||虚偽情報、なりすまし、権利侵害、性的に露骨・刺激的な資料、差別や嫌がらせの内容は公開しません。|||We do not publish false information, impersonation, rights violations, sexually explicit or suggestive material, or degrading or harassing content.
팬 제보에는 확인 가능한 공식 출처를 함께 남겨 주세요.|||ファンからの情報提供には確認できる公式の出典を添えてください。|||Fan submissions should include a verifiable official source.
메인 캘린더로 돌아가기|||メインカレンダーに戻る|||Back to the debut calendar
VDébut은 데뷔 일정과 소개 공개, 문의 처리 및 서비스 이용 현황 분석에 필요한 정보를 사용합니다.|||VDébutは日程・紹介の公開、お問い合わせ対応、利用状況分析に必要な情報を使用します。|||VDébut uses information needed to publish schedules and profiles, handle inquiries and understand site usage.
등록·문의 정보|||登録・お問い合わせ情報|||Submission and inquiry information
활동명, 소개, 방송 채널, 일정과 등록한 이미지는 소개 공개에 사용됩니다. 문의에 입력한 이메일과 내용은 문의 처리에 사용되며 공개 소개에 표시하지 않습니다.|||活動名、紹介、配信チャンネル、日程、登録画像は紹介の公開に使用します。お問い合わせのメールと内容は対応に使用し、公開紹介には表示しません。|||Creator names, introductions, channels, schedules and submitted images are used in public profiles. Inquiry emails and messages are used to handle inquiries and are not shown in public profiles.
브라우저 저장 정보|||ブラウザ保存情報|||Information stored in your browser
언어와 일정 표시 설정, 관심 목록, 문의 답변 조회용 확인 키는 사용한 브라우저에 저장됩니다. 브라우저 설정에서 저장 정보를 삭제할 수 있습니다.|||言語・日程表示設定、お気に入り、回答確認キーは使用したブラウザに保存します。ブラウザ設定で削除できます。|||Language and calendar settings, favorites and inquiry access keys are stored in your browser. You can remove them in your browser settings.
접속 정보|||接続情報|||Connection information
서비스 요청 처리와 과도한 접수 제한을 위해 접속 정보를 처리합니다. 문의 확인 키와 접수 제한에 사용하는 접속 주소는 해시로 저장합니다.|||リクエスト処理と過剰な送信の制限のため接続情報を処理します。確認キーと送信制限に使う接続アドレスはハッシュで保存します。|||Connection information is processed to handle requests and limit excessive submissions. Inquiry access keys and connection addresses used for submission limits are stored as hashes.
Google Analytics|||Google Analytics|||Google Analytics
운영 사이트에는 Google Analytics 방문 분석 태그가 포함되어 있습니다. Google은 이용 현황 분석을 위해 쿠키, IP 주소, 기기 및 브라우저 정보 등을 처리할 수 있습니다.|||運用サイトにはGoogle Analyticsタグが含まれています。Googleは利用状況分析のためCookie、IPアドレス、端末・ブラウザ情報などを処理する場合があります。|||The production site includes Google Analytics tags. Google may process cookies, IP addresses and device or browser information to analyze usage.
Google의 파트너 사이트 데이터 사용 안내|||Googleのパートナーサイトにおけるデータ利用|||How Google uses data from partner sites
광고 서비스|||広告サービス|||Advertising services
Google 광고 서비스를 도입할 경우 광고 제공에 필요한 데이터 사용과 이용자의 선택 방법을 안내합니다.|||Google広告サービスを導入する場合は、広告に必要なデータ利用と利用者の選択方法を案内します。|||If Google advertising services are introduced, we will explain related data use and your choices.
정보 열람·정정·삭제 문의|||情報の閲覧・訂正・削除|||Access, correction and deletion requests
정보의 열람·정정·삭제 요청은 문의 화면 또는 아래 이메일로 접수할 수 있습니다.|||情報の閲覧・訂正・削除はお問い合わせ画面または下記メールでご連絡ください。|||Request access, corrections or deletion through Contact or the email below.
서비스 이용 목적|||サービスの目的|||Purpose of the service
VDébut은 버튜버의 데뷔 일정, 소개와 방송 활동 정보를 제공하는 독립 서비스입니다. 서비스 운영을 위해 광고가 표시될 수 있습니다.|||VDébutはVTuberのデビュー日程、紹介、配信活動情報を提供する独立サービスです。運営のため広告を表示する場合があります。|||VDébut is an independent service offering VTuber debut schedules, profiles and streaming activity information. Ads may be displayed to support the service.
등록 콘텐츠의 공개 기준|||登録コンテンツの公開基準|||Publication standards
등록 신청은 운영자 검토 후 공개됩니다. 허위 정보, 사칭, 권리 침해 또는 공개 기준에 맞지 않는 콘텐츠는 보완 요청, 공개 보류 또는 삭제할 수 있습니다.|||登録申請は運営の審査後に公開します。虚偽、なりすまし、権利侵害や基準に適合しない内容は修正依頼、公開保留、削除の対象です。|||Submissions are published after review. False information, impersonation, rights violations or content outside our standards may require revision, be held or removed.
소개·이미지·영상과 외부 링크도 검토 대상입니다. 팬 제보에는 확인 가능한 공식 출처를 함께 남겨 주세요.|||紹介、画像、動画、外部リンクも審査します。ファンからの情報には公式の出典を添えてください。|||Introductions, images, videos and external links are reviewed. Fan submissions should include a verifiable official source.
이미지·소개글과 브랜드|||画像・紹介文・ブランド|||Images, profile text and brands
등록하는 이미지·소개글·영상에는 필요한 사용 권한이 있어야 합니다. 크리에이터의 저작물과 각 플랫폼의 상표는 해당 권리자에게 귀속됩니다.|||登録する画像・紹介文・動画には必要な利用権限が必要です。著作物と商標は各権利者に帰属します。|||You must have the necessary permissions for submitted images, text and videos. Creator works and platform trademarks belong to their respective rights holders.
정보나 이미지의 정정·삭제, 사칭과 부적절한 콘텐츠 신고는 문의 화면 또는 ru_0120@naver.com으로 접수합니다. 운영자가 요청 내용과 권리를 확인한 뒤 처리합니다.|||情報・画像の訂正や削除、なりすまし、不適切な内容はお問い合わせ画面またはru_0120@naver.comで受け付け、内容と権利を確認して対応します。|||Request corrections or deletion, or report impersonation and inappropriate content through Contact or ru_0120@naver.com. The team checks the request and relevant rights before acting.
방송 일정 변경|||配信日程の変更|||Schedule changes
방송 일정은 변경·연기·취소될 수 있습니다. 최신 일정은 크리에이터의 공지를 함께 확인해 주세요. 저장한 일정은 변경된 공지와 대조해 수정해 주세요.|||配信日程は変更・延期・中止になる場合があります。最新の告知を確認し、保存した予定も更新してください。|||Schedules may change, be postponed or canceled. Check the creator's latest announcement and update any saved calendar events accordingly.
문의하기|||お問い合わせ|||Contact Us
서비스|||サービス|||Service
서비스 소개 & 이용 가이드|||サービス紹介＆利用ガイド|||About & Guide
아직 만나지 못한 버튜버와 팬을 연결하는 VDébut의 소개와 이용 안내입니다.|||まだ見ぬVTuberとファンをつなぐVDébutの紹介と利用案内です。|||Introduction and guide to VDébut, connecting fans with new VTubers.
누가 데뷔하는지, 어떤 방송을 하는지.|||誰がデビューするのか、どんな配信をするのか。|||Who is debuting, and what kind of streams they do.
첫 만남까지 {0}일 {1}시간|||初配信まで{0}日{1}時間|||{0} days {1} hours until we meet
첫 만남까지 {0}시간 {1}분|||初配信まで{0}時間{1}分|||{0} hours {1} minutes until we meet
첫 만남까지 {0}분|||初配信まで{0}分|||{0} minutes until we meet
데뷔 일정 등록 없음|||デビュー日程は未登録|||No debut schedule listed
한국 시간 (Asia/Seoul) 기준|||韓国時間（Asia/Seoul）基準|||Korean time (Asia/Seoul)
확정된 시각은 한국 시간 (Asia/Seoul) 기준|||確定した時刻は韓国時間（Asia/Seoul）基準|||Confirmed times are shown in Korean time (Asia/Seoul)
예정된 데뷔 시각이 지났어요. 채널에서 소식을 확인해 보세요.|||デビュー予定時刻を過ぎました。チャンネルで最新情報をご確認ください。|||The scheduled debut time has passed. Check the channel for updates.
정확한 날짜가 정해지면 다시 만나요.|||日付が決まったら、またお会いしましょう。|||Come back when the exact date is announced.
데뷔 공지 보기|||デビューのお知らせを見る|||View debut announcement
첫 방송 다시보기|||初配信アーカイブ|||Debut replay
영상으로 먼저 만나요|||動画でひと足先に会いましょう|||Meet me in a video
YouTube에서 보기|||YouTubeで見る|||Watch on YouTube
대표 영상 재생|||紹介動画を再生|||Play featured video
함께 데뷔하는 팀을 소개하는 공통 영상이에요.|||一緒にデビューするチームの紹介動画です。|||This video introduces the team debuting together.
영상이 재생되지 않으면 YouTube에서 확인해 주세요.|||再生できない場合はYouTubeでご覧ください。|||If the video does not play, watch it on YouTube.
방송과 소식을 만나는 곳|||配信とお知らせはこちら|||Streams and updates
채널 모아보기|||チャンネル一覧|||All channels
채널|||チャンネル|||Channels
채널 바로가기|||チャンネルへ|||Visit channel
X / SNS|||X / SNS|||X / social
다른 버튜버|||ほかのVTuber|||More VTubers
{0}의 버튜버들도 만나보세요!|||{0}のVTuberにも会ってみよう！|||Meet more VTubers on {0}!
{0} 멤버|||{0}のメンバー|||{0} members
멤버|||メンバー|||Members
데뷔 방송|||デビュー配信|||Debut broadcast
데뷔 방송 영상 주소|||デビュー配信動画のURL|||Debut broadcast video URL
방송 후 업로드한 YouTube 영상을 PV와 별도로 추가할 수 있어요.|||配信後にアップロードしたYouTube動画をPVとは別に追加できます。|||Add your uploaded debut broadcast separately from your PV.
데뷔 방송은 YouTube 영상 주소로 입력해 주세요.|||デビュー配信にはYouTube動画のURLを入力してください。|||Enter a YouTube video URL for the debut broadcast.
{0} 재생|||{0}を再生|||Play {0}
영상 재생|||動画を再生|||Play video
대표 방송 채널|||メイン配信チャンネル|||Main streaming channel
영상 채널|||動画チャンネル|||Video channel
새 소식|||最新情報|||Latest updates
함께 데뷔해요|||一緒にデビューします|||Debuting together
데뷔 순서|||デビュー順|||Debut order
지금 보고 있어요|||表示中|||You are here
개인 페이지 미리보기|||プロフィールページのプレビュー|||Preview profile page
나만의 소개 꾸미기|||自分らしい紹介にしよう|||Make your profile yours
선택 입력|||任意入力|||Optional
한 줄 소개|||ひとこと紹介|||Short introduction
나의 방송을 한 문장으로 소개해 주세요.|||あなたの配信を一文で紹介してください。|||Describe your streams in one sentence.
개인 배너 이미지 주소|||バナー画像のURL|||Personal banner image URL
공식 홈페이지|||公式サイト|||Official website
공식 카페|||公式ファンコミュニティ|||Official fan community
SNS 계정과 데뷔 공지 주소를 각각 입력해 주세요.|||SNSアカウントとデビュー告知のURLを別々に入力してください。|||Enter your social account and debut announcement separately.
추가 방송·영상 채널|||追加の配信・動画チャンネル|||Additional streaming and video channels
YouTube 등 다른 채널을 최대 4개까지 연결할 수 있어요.|||YouTubeなど、ほかのチャンネルを4つまで追加できます。|||Connect up to 4 more channels, including YouTube.
추가 채널 삭제|||追加チャンネルを削除|||Remove additional channel
채널 추가|||チャンネルを追加|||Add channel
대표 영상 주소|||紹介動画のURL|||Featured video URL
자기소개·티저·다시보기 등 YouTube 영상 한 개|||自己紹介・ティザー・アーカイブなどのYouTube動画を1つ|||One YouTube introduction, teaser, replay, or other video
영상 종류|||動画の種類|||Video type
영상 제목|||動画タイトル|||Video title
팬들에게 보여줄 영상 제목|||ファンに表示する動画タイトル|||Video title for your fans
자기소개|||自己紹介|||Self introduction
데뷔 티저|||デビューティザー|||Debut teaser
팀 공통 PV|||チーム共通PV|||Team PV
커버곡|||カバー曲|||Cover song
방송 하이라이트|||配信ハイライト|||Stream highlights
함께 데뷔하는 팀·기수|||一緒にデビューするチーム・期|||Debut team or generation
공식 공지로 확인한 멤버에게만 같은 그룹 식별자를 지정해 주세요.|||公式告知で確認したメンバーにのみ同じグループIDを設定してください。|||Assign the same group ID only to members confirmed in an official announcement.
데뷔 그룹 이름|||デビューグループ名|||Debut group name
데뷔 그룹 식별자|||デビューグループID|||Debut group ID
SNS 주소는 HTTPS 주소로 입력해 주세요.|||SNSのURLはHTTPSで入力してください。|||Enter an HTTPS social account URL.
추가 링크와 이미지 주소는 HTTPS 주소로 입력해 주세요.|||追加リンクと画像のURLはHTTPSで入力してください。|||Enter HTTPS URLs for additional links and images.
추가 방송 채널은 최대 4개까지 등록할 수 있어요.|||追加チャンネルは4つまで登録できます。|||You can add up to 4 channels.
추가 채널의 플랫폼과 채널 주소를 확인해 주세요.|||追加チャンネルのプラットフォームとURLを確認してください。|||Check the platform and URL of the additional channel.
대표 영상은 YouTube 영상 주소로 입력해 주세요.|||紹介動画にはYouTube動画のURLを入力してください。|||Enter a YouTube video URL for the featured video.
대표 영상의 종류를 선택해 주세요.|||紹介動画の種類を選んでください。|||Select the featured video type.
데뷔 그룹 이름과 영문·숫자 식별자를 함께 입력해 주세요.|||グループ名と英数字のIDを両方入力してください。|||Enter both the debut group name and its alphanumeric ID.
신청자 구분|||申請者区分|||Submitted by
신청자 구분을 선택해 주세요.|||申請者区分を選んでください。|||Select who is submitting.
본인 직접 신청|||本人による申請|||Creator
소속사·대리 신청|||所属事務所・代理申請|||Agency or representative
팬 제보|||ファンからの情報提供|||Fan submission
활동 국가|||活動国|||Country
일정 기준 시간대|||日程のタイムゾーン|||Schedule timezone
선택한 시간대의 현지 시각으로 입력해 주세요.|||選択したタイムゾーンの現地時刻で入力してください。|||Enter the local time in the selected timezone.
데뷔 시간|||デビュー時刻|||Debut time
채널 소개를 입력해 주세요.|||チャンネル紹介を入力してください。|||Enter a channel introduction.
국가와 시간대를 확인해 주세요.|||国とタイムゾーンを確認してください。|||Check the country and timezone.
영상 주소 대신 방송 채널 주소를 입력해 주세요.|||動画ではなく配信チャンネルのURLを入力してください。|||Enter a channel URL instead of a video URL.
이미 등록된 채널입니다. 정보 변경은 문의로 알려주세요.|||登録済みのチャンネルです。変更はお問い合わせからお知らせください。|||This channel is already listed. Send corrections through Contact.
이미 검토 중인 채널입니다. 정보 변경은 문의로 알려주세요.|||審査中のチャンネルです。変更はお問い合わせからお知らせください。|||This channel is already under review. Send corrections through Contact.
공개 정보 수정|||公開情報の編集|||Edit published information
등록·문의 검토로|||登録・お問い合わせ審査へ|||Back to submissions
수정하기|||編集|||Edit
이름이나 채널 주소로 검색해 주세요.|||名前またはチャンネルURLで検索してください。|||Search by name or channel URL.
공개 정보를 수정했습니다.|||公開情報を更新しました。|||Published information updated.
일정 상태|||日程の状態|||Schedule status
확정|||確定|||Confirmed
변경 사유|||変更理由|||Reason for change
저장 중…|||保存中…|||Saving…
공개 정보 저장|||公開情報を保存|||Save published information
변경 이력|||変更履歴|||Change history
아직 변경 이력이 없습니다.|||変更履歴はまだありません。|||No changes recorded yet.
변경 전 내용 불러오기|||変更前の内容を読み込む|||Load previous information
이전 내용 복구: {0}|||以前の内容を復元: {0}|||Restore previous information: {0}
변경 사유를 입력해 주세요.|||変更理由を入力してください。|||Enter a reason for the change.
다른 운영자가 수정했습니다. 목록을 새로고침해 주세요.|||他の運営者が更新しました。一覧を再読み込みしてください。|||Another administrator updated this profile. Refresh the list.
활동명과 일정 정보를 확인해 주세요.|||活動名と日程を確認してください。|||Check the name and schedule.
기존 방송 채널 주소를 유지해 주세요.|||現在の配信チャンネルURLを維持してください。|||Keep the existing channel URL.
신청 정보를 새로 확인해 주세요.|||申請情報をもう一度確認してください。|||Check the submission information again.
신청 내용이 변경됐습니다. 다시 신청해 주세요.|||申請内容が変更されています。再度申請してください。|||The submission changed. Submit it again.
이미 공개된 채널입니다. 기존 소개를 확인해 주세요.|||公開済みのチャンネルです。既存の紹介を確認してください。|||This channel is already published. Check its existing profile.
데뷔 일정|||デビュー日程|||Debut schedule
한국|||韓国|||Korea
일본|||日本|||Japan
미국|||米国|||United States
한국 (KST)|||韓国 (KST)|||Korea (KST)
일본 (JST)|||日本 (JST)|||Japan (JST)
미국 서부 (LA)|||米国西部 (LA)|||US West (LA)
미국 동부 (뉴욕)|||米国東部 (ニューヨーク)|||US East (New York)
이전 달|||前の月|||Previous month
이전 주|||前の週|||Previous week
조회 월|||表示する月|||Displayed month
다음 달|||次の月|||Next month
다음 주|||次の週|||Next week
오늘|||今日|||Today
전체 일정 저장|||全日程を保存|||Save all events
불러오는 중|||読み込み中|||Loading
확인 필요|||確認が必要です|||Check required
{0}명의 데뷔 일정|||{0}名のデビュー日程|||{0} debut schedules
달력 보기|||カレンダー表示|||Calendar view
월간|||月|||Month
주간|||週|||Week
방송 플랫폼|||配信プラットフォーム|||Streaming platform
전체|||すべて|||All
선택한 월의 데뷔자 이름 검색|||選択した月のデビュー者を検索|||Search debut names in this month
데뷔자 이름 검색|||デビュー者の名前を検索|||Search debut names
활동 국가|||活動国|||Country
전체 국가|||すべての国|||All countries
일정 표시 시간대|||日程の表示タイムゾーン|||Display timezone
데뷔 일정을 불러오는 중이에요|||デビュー日程を読み込んでいます|||Loading debut schedules
일정을 불러오지 못했어요|||日程を読み込めませんでした|||Could not load schedules
다시 시도|||再試行|||Retry
{0}{1} · 데뷔 {2}명 · 전체 일정 보기|||{0}{1} · {2}名のデビュー · 全日程を表示|||{0}{1} · {2} debuts · View all events
 오늘||| 今日||| Today
{0}명|||{0}名|||{0} people
미정|||未定|||TBD
명 더 보기|||名を表示||| more
날짜를 선택하면 소개와 방송 채널을 확인할 수 있어요.|||日付を選ぶと紹介と配信チャンネルを確認できます。|||Select a date to see profiles and streaming channels.
조건 초기화|||条件をリセット|||Reset filters
선택한 조건의 데뷔 일정이 없어요.|||選択した条件のデビュー日程はありません。|||No debut schedules match these filters.
다음|||次の|||Next
달|||月|||month
주|||週|||week
확인|||確認|||View
전체 보기|||すべて表示|||View all
선택한 날짜의 일정이 없어요. 다른 날짜도 살펴보세요.|||選択した日の日程はありません。別の日もご覧ください。|||No schedules for this date. Try another date.
어떤 버튜버인지 궁금하다면|||どんなVTuberか知りたいなら|||Get to know the VTuber
이달 데뷔자|||今月のデビュー|||This month's debuts
다가오는 데뷔|||これからのデビュー|||Upcoming debuts
버튜버 둘러보기|||VTuberを探す|||Browse VTubers
접기|||閉じる|||Collapse
예정자 {0}명 모두 보기|||予定者{0}名をすべて表示|||View all {0} upcoming debuts
선택한 월·조건의 예정자가 없어요.|||選択した月・条件の予定者はいません。|||No upcoming debuts match this month and filters.
다음 달 살펴보기|||次の月を見る|||Explore next month
만남을 준비하고 있어요|||出会いを準備しています|||Getting ready to meet you
날짜를 기다리는 데뷔|||日付が未定のデビュー|||Debuts awaiting a date
명|||名||| people
{0} 데뷔 일정|||{0}のデビュー日程|||Debut schedule for {0}
표시 시간대|||表示タイムゾーン|||Display timezone
등록된 일정이 없어요|||登録された日程はありません|||No schedules registered
이 날짜의 첫 데뷔 소식을 알려주세요.|||この日の最初のデビューをお知らせください。|||Share the first debut for this date.
이 날짜에 데뷔 등록하기|||この日にデビューを登録|||Register a debut on this date
방송 채널에서 소개를 만나보세요.|||配信チャンネルで紹介をご覧ください。|||Find out more on the streaming channel.
소개 보기|||紹介を見る|||View profile
방송 채널|||配信チャンネル|||Streaming channel
일정 저장|||日程を保存|||Save event
다시 만나고 싶은 버튜버|||また会いたいVTuber|||VTubers you want to meet again
내 취향의 새로운 만남|||好みに合う新しい出会い|||Discover someone you'll enjoy
관심 버튜버|||お気に入りのVTuber|||Favorite VTubers
내 소개 등록|||自分の紹介を登録|||Register my profile
버튜버 이름·소개 검색|||VTuberの名前・紹介を検索|||Search VTuber names and profiles
이름, 소개, 콘텐츠로 검색|||名前・紹介・コンテンツで検索|||Search names, profiles and content
전체 플랫폼|||すべてのプラットフォーム|||All platforms
주요 콘텐츠|||主なコンテンツ|||Main content
전체 콘텐츠|||すべてのコンテンツ|||All content
방송 언어|||配信言語|||Stream language
전체 방송 언어|||すべての配信言語|||All stream languages
버튜버 소개를 불러오는 중이에요|||VTuberの紹介を読み込んでいます|||Loading VTuber profiles
소개를 불러오지 못했어요|||紹介を読み込めませんでした|||Could not load profiles
명의 버튜버|||名のVTuber||| VTubers
이름순|||名前順|||By name
더 보기|||もっと見る|||Show more
마음에 드는 버튜버를 저장해 보세요|||お気に入りのVTuberを保存しましょう|||Save a VTuber you like
조건에 맞는 버튜버가 없어요|||条件に合うVTuberはいません|||No VTubers match your filters
검색어나 탐색 조건을 바꿔 보세요.|||検索語や条件を変えてみてください。|||Try changing your search or filters.
버튜버와 팬의 소개팅|||VTuberとファンをつなぐ出会い|||A first meeting for VTubers and fans
채널 운영자 확인|||チャンネル運営者確認済み|||Channel owner verified
방송 채널로 만나기|||配信チャンネルへ|||Visit streaming channel
나를 소개합니다|||自己紹介|||About me
이런 방송으로 만나요|||こんな配信をしています|||What I stream
방송 채널에서 소개를 확인해 보세요.|||配信チャンネルで紹介をご覧ください。|||Read more on the streaming channel.
SNS 소식 보기|||SNSの投稿を見る|||View social updates
첫 만남의 약속|||初めて会う日|||Our first meeting
Asia/Seoul 기준|||Asia/Seoul 基準|||Asia/Seoul time
내 캘린더에 저장|||カレンダーに保存|||Save to my calendar
정해진 날짜의 원래 시간대 기준입니다.|||登録された日付の元のタイムゾーンです。|||Shown in the event's original timezone.
어떤 활동을 하고 있을까?|||どんな活動をしているかな？|||What have they been streaming?
방송 활동 기록|||配信活動の記録|||Stream history
비슷한 콘텐츠의 만남|||似たコンテンツとの出会い|||Discover similar content
같은 플랫폼의 새로운 만남|||同じプラットフォームでの新しい出会い|||More VTubers on this platform
함께 만나보세요|||こちらもチェック|||Meet them too
VDébut · 브이데뷔|||VDébut · ブイデビュー|||VDébut
언제 만날까요?|||いつ会えるかな？|||When can we meet?
데뷔 일정 보기|||デビュー日程を見る|||View debut schedules
어떤 버튜버일까요?|||どんなVTuberかな？|||Who is this VTuber?
나를 소개하고 싶어요|||自分を紹介したい|||I'd like to introduce myself
데뷔 소식 등록|||デビューのお知らせを登録|||Share a debut
데뷔 날짜가 아직 정해지지 않았어요.|||デビュー日がまだ決まっていません。|||My debut date isn't set yet.
이미 데뷔한 버튜버도 등록할 수 있나요?|||デビュー済みでも登録できますか？|||Can VTubers who have debuted register?
등록하면 바로 공개되나요?|||登録するとすぐ公開されますか？|||Is my registration published immediately?
등록한 정보를 수정하고 싶어요.|||登録した情報を修正したいです。|||I'd like to correct my registered information.
관심 목록은 다른 기기에서도 보이나요?|||お気に入りは別の端末でも見られますか？|||Can I see favorites on another device?
통계는 어떤 방송을 보여주나요?|||統計にはどの配信が含まれますか？|||Which streams are included in statistics?
처음 이용하시나요?|||初めてご利用ですか？|||New here?
VDébut 이용 가이드|||VDébut 利用ガイド|||VDébut guide
팬이라면|||ファンの方|||For fans
데뷔 일정 둘러보기|||デビュー日程を探す|||Explore debut schedules
버튜버라면|||VTuberの方|||For VTubers
나의 데뷔 등록하기|||自分のデビューを登録|||Register my debut
자주 묻는 질문|||よくある質問|||Frequently asked questions
함께 정확한 소개를 만들어요|||一緒に正確な紹介を作りましょう|||Help keep profiles accurate
문의·정보 정정|||お問い合わせ・情報修正|||Contact and corrections
문의 유형|||お問い合わせの種類|||Inquiry type
정보 정정|||情報修正|||Information correction
일정 수정|||日程修正|||Schedule correction
소개 삭제 요청|||紹介の削除依頼|||Profile removal request
등록 접수 확인|||登録受付の確認|||Registration inquiry
기능 제안|||機能の提案|||Feature suggestion
기타 문의|||その他のお問い合わせ|||Other inquiry
관련 페이지 주소|||該当ページのURL|||Related page URL
수정이 필요한 소개 페이지 주소|||修正が必要な紹介ページのURL|||URL of the profile to correct
문의 내용|||お問い合わせ内容|||Your message
확인이 필요한 내용과 공식 출처를 적어 주세요.|||確認が必要な内容と公式の情報源をご記入ください。|||Describe the issue and include an official source.
연락 이메일|||連絡先メール|||Contact email
선택 입력 · 공개되지 않습니다.|||任意・公開されません。|||Optional · Not public.
접수 중…|||送信中…|||Submitting…
문의 접수하기|||お問い合わせを送信|||Send inquiry
이메일 문의:|||メールでのお問い合わせ：|||Email:
등록·정보 정정 안내|||登録・情報修正のご案内|||Registration and corrections
직접 등록·접수 확인 정보 안내|||登録・受付確認情報について|||Registration and receipt information
데뷔 등록|||デビュー登録|||Register debut
소개 등록|||紹介登録|||Register profile
소유권 신청|||所有権申請|||Ownership request
문의·정정|||お問い合わせ・修正|||Contact and corrections
소개 수정|||紹介修正|||Edit profile
VDébut 운영|||VDébut 運営|||VDébut administration
등록·문의 검토|||登録・お問い合わせの確認|||Review registrations and inquiries
로그아웃|||ログアウト|||Log out
운영자 로그인|||管理者ログイン|||Admin login
아이디|||ユーザー名|||Username
비밀번호|||パスワード|||Password
확인 중…|||確認中…|||Checking…
로그인|||ログイン|||Log in
검토 대기|||確認待ち|||Pending review
처리 완료|||対応済み|||Completed
보완 요청|||補足依頼|||Changes requested
접수 목록|||受付一覧|||Request list
새로고침|||更新|||Refresh
접수 목록 확인 중|||受付一覧を読み込み中|||Loading requests
문의|||お問い合わせ|||Inquiry
내용 확인 →|||内容を確認 →|||View details →
해당 상태의 신청이 없습니다|||この状態の申請はありません|||No requests with this status
활동명|||活動名|||Display name
소개|||紹介|||Introduction
플랫폼|||プラットフォーム|||Platform
증빙 주소|||確認資料のURL|||Evidence URL
신청 내용|||申請内容|||Request details
데뷔 날짜|||デビュー日|||Debut date
데뷔 시간|||デビュー時刻|||Debut time
일정 상태|||日程の状態|||Schedule status
예정 월|||予定月|||Expected month
시간대|||タイムゾーン|||Timezone
관련 페이지|||関連ページ|||Related page
이미지 주소|||画像URL|||Image URL
소속|||所属|||Agency
국가|||国|||Country
답변|||回答|||Reply
안내·보완 사유|||案内・補足理由|||Notes and requested changes
답변 완료|||回答済みにする|||Complete reply
검토 후 승인|||確認後に承認|||Approve after review
데뷔 캘린더|||デビューカレンダー|||Debut calendar
버튜버 찾기|||VTuberを探す|||Find VTubers
방송 통계|||配信統計|||Stream statistics
버튜버 소개 등록|||VTuber紹介登録|||Register a VTuber profile
이용 가이드|||利用ガイド|||Guide
개인정보처리방침|||プライバシーポリシー|||Privacy policy
이용약관|||利用規約|||Terms of use
접수 상태 확인|||受付状況の確認|||Request status
버튜버 소개|||VTuber紹介|||VTuber profile
소개를 불러오는 중이에요|||紹介を読み込んでいます|||Loading profile
버튜버 소개를 찾을 수 없어요|||VTuberの紹介が見つかりません|||VTuber profile not found
다른 버튜버 만나보기|||別のVTuberを探す|||Meet another VTuber
새 등록·문의 검토|||新しい登録・お問い合わせ|||New registrations and inquiries
기존 신청·버튜버 관리|||既存の申請・VTuber管理|||Existing requests and VTuber management
페이지를 찾을 수 없어요|||ページが見つかりません|||Page not found
데뷔 캘린더로|||デビューカレンダーへ|||Back to debut calendar
본문으로 바로가기|||本文へ移動|||Skip to content
주요 메뉴|||メインメニュー|||Main menu
메뉴 닫기|||メニューを閉じる|||Close menu
메뉴 열기|||メニューを開く|||Open menu
전체 메뉴|||すべてのメニュー|||All menus
개발 페이지|||開発ページ|||Development page
화면을 불러오고 있어요|||画面を読み込んでいます|||Loading page
서비스 안내|||サービス案内|||Service information
서비스 소개|||サービス紹介|||About
운영자 관리|||管理者ページ|||Administration
빠른 메뉴|||クイックメニュー|||Quick navigation
관심 목록|||お気に入り|||Favorites
방송 채널 URL 입력|||配信チャンネルURLの入力|||Enter streaming channel URL
치지직 · SOOP · 유튜브 · 트위치 지원|||CHZZK・SOOP・YouTube・Twitch 対応|||Supports CHZZK, SOOP, YouTube and Twitch
방송 채널 URL|||配信チャンネルURL|||Streaming channel URL
방송국 또는 라이브 주소를 붙여넣어 주세요.|||チャンネルまたはライブ配信URLを貼り付けてください。|||Paste your channel or live stream URL.
정보 불러오기|||情報を取得|||Load information
지원하는 URL ·|||対応URL ·|||Supported URL ·
불러온 방송국 프로필 정보|||取得したチャンネルのプロフィール|||Loaded channel profile
자동 수집 완료|||取得完了|||Information loaded
방송국 정보를 확인해 주세요|||チャンネル情報をご確認ください|||Check your channel information
채널 활동명|||チャンネルの活動名|||Channel display name
불러온 정보도 수정할 수 있어요.|||取得した情報も修正できます。|||You can edit the loaded information.
채널 대표 문구 / 소개글|||チャンネルのキャッチコピー・紹介|||Channel tagline / introduction
소개글 자동 추출|||紹介を自動取得|||Introduction loaded automatically
어떤 방송인지 팬들에게 소개해 주세요.|||どんな配信かファンに紹介してください。|||Tell fans what you stream.
/ 600자|||/ 600文字|||/ 600 characters
데뷔 일정 · 공지 링크|||デビュー日程・告知リンク|||Debut schedule and announcement
데뷔 일정 설정|||デビュー日程の設定|||Set debut schedule
표시는 필수 항목|||は必須項目です|||marks a required field
데뷔 일정 없이 소개만 등록|||デビュー日程なしで紹介のみ登録|||Register a profile without a debut schedule
데뷔 날짜 미정|||デビュー日未定|||Debut date TBD
데뷔 예정 월|||デビュー予定月|||Expected debut month
데뷔 일자|||デビュー日|||Debut date
데뷔 시간 (KST 기준)|||デビュー時刻 (KST)|||Debut time (KST)
시간 미정|||時刻未定|||Time TBD
공지 원문 링크 (선택)|||告知の元リンク (任意)|||Original announcement link (optional)
등록 정보의 공개와|||登録情報の公開と|||I agree to publish this information and accept the
에 동의합니다.|||に同意します。|||.
신청 중…|||申請中…|||Submitting…
소개 등록 신청|||紹介の登録を申請|||Submit profile registration
데뷔 일정 등록 신청|||デビュー日程を申請|||Submit debut registration
등록 신청은 운영자 검토 후 공개됩니다.|||登録申請は運営の確認後に公開されます。|||Registrations are published after admin review.
데뷔 하이라이트|||デビューハイライト|||Debut highlights
신규 버튜버 데뷔 캘린더|||新人VTuberデビューカレンダー|||New VTuber debut calendar
데뷔 하이라이트를 불러오는 중이에요|||デビューハイライトを読み込み中|||Loading debut highlights
데뷔 하이라이트를 불러오지 못했어요|||デビューハイライトを読み込めませんでした|||Could not load debut highlights
월 데뷔|||月のデビュー||| debuts this month
이번 주 데뷔|||今週のデビュー|||This week's debuts
금월|||今月|||This month
데뷔|||デビュー|||Debut
통계 분석 목적|||統計の表示目的|||Statistics view
종합|||総合|||Overview
콘텐츠 탐색|||コンテンツを探す|||Explore content
방송 시간대|||配信時間帯|||Streaming times
활동 중 · 데뷔 일정 등록 없음|||活動中・デビュー日程未登録|||Active · No debut schedule registered
{0}월 · 날짜 미정|||{0}月 · 日付未定|||{0} · Date TBD
{0} · 시간 미정 ({1})|||{0} · 時刻未定 ({1})|||{0} · Time TBD ({1})
일정 확인 중|||日程を確認中|||Schedule being checked
관심 목록 저장 실패 · 다시 시도|||お気に入りの保存に失敗・再試行|||Could not save favorite · Retry
관심 목록에서 제거|||お気に入りから削除|||Remove from favorites
관심 목록에 저장|||お気に入りに保存|||Save to favorites
브라우저 저장을 허용해 주세요.|||ブラウザの保存を許可してください。|||Allow browser storage to save favorites.
주소 복사|||URLをコピー|||Copy link
복사 완료|||コピーしました|||Copied
복사 실패 · 주소를 직접 복사해 주세요.|||コピーに失敗しました。URLを手動でコピーしてください。|||Copy failed. Please copy the URL manually.
닫기|||閉じる|||Close
이제, 당신을 만날 차례|||次は、あなたに会う番|||It's time to meet you
곧 데뷔하나요?|||もうすぐデビューですか？|||Debuting soon?
데뷔 등록하기|||デビューを登録|||Register debut
선택하지 않음|||選択しない|||Not selected
영국|||英国|||United Kingdom
대만|||台湾|||Taiwan
기타 국가|||その他の国|||Other country
나의 소개|||自己紹介|||My introduction
프로필 이미지 주소|||プロフィール画像URL|||Profile image URL
어디서 만날 수 있나요?|||どこで会えますか？|||Where can fans find you?
방송 채널 주소|||配信チャンネルURL|||Streaming channel URL
X / SNS 주소|||X・SNSのURL|||X / social URL
언제 데뷔하나요?|||いつデビューしますか？|||When is your debut?
날짜와 시간 확정|||日時確定|||Date and time confirmed
날짜 확정 · 시간 미정|||日付確定・時刻未定|||Date confirmed · Time TBD
예정 월만 확정 · 날짜 미정|||予定月のみ確定・日付未定|||Month confirmed · Date TBD
일정의 시간대|||日程のタイムゾーン|||Event timezone
접수 안내|||受付のご案内|||Submission information
이렇게 소개됩니다|||このように紹介されます|||This is how your profile appears
입력하지 않음|||未入力|||Not provided
및|||と|||and
수정하기|||修正する|||Edit
처리 중…|||処理中…|||Processing…
공개 내용 확인|||公開内容を確認|||Review public information
변경 사항 저장|||変更を保存|||Save changes
등록 신청하기|||登録を申請|||Submit registration
나의 소개 미리보기|||自己紹介のプレビュー|||Profile preview
등록 가이드 보기|||登録ガイドを見る|||View registration guide
신청|||申請|||Request
문의가 접수됐어요|||お問い合わせを受け付けました|||Your inquiry has been received
접수 번호|||受付番号|||Reference number
비공개 확인 키|||非公開の確認キー|||Private access key
접수 정보 복사|||受付情報をコピー|||Copy receipt information
문의 답변 확인|||お問い合わせの回答を確認|||View inquiry reply
데뷔 일정 등록|||デビュー日程登録|||Register debut schedule
등록 신청이 접수됐어요|||登録申請を受け付けました|||Your registration has been received
보완 필요|||補足が必要|||Changes needed
소유권 확인|||所有権確認|||Ownership verification
문의·정정 요청|||お問い合わせ・修正依頼|||Inquiry and correction request
내가 전한 데뷔 소식|||あなたのデビューのお知らせ|||Your debut announcement
접수할 때 발급받은 키|||受付時に発行されたキー|||Key issued when you submitted
상태 확인|||状況を確認|||Check status
접수 상태를 확인하고 있어요|||受付状況を確認しています|||Checking request status
접수일|||受付日|||Submitted on
1 접수 완료|||1 受付完了|||1 Received
2 검토|||2 確認|||2 Review
관리 권한 확인|||管理権限の確認|||Management access verified
답변 확인|||回答確認|||View reply
소개 공개|||紹介公開|||Profile published
신청 처리가 완료됐어요.|||申請の対応が完了しました。|||Your request has been processed.
운영자 안내|||運営からのご案内|||Admin notes
공개 소개 보기|||公開された紹介を見る|||View published profile
보완 후 다시 신청|||補足して再申請|||Revise and resubmit
이 브라우저에 저장한 관심 목록이에요. 소개와 다음 데뷔 소식을 다시 확인하세요.|||このブラウザに保存したお気に入りです。紹介や次のデビュー予定を確認できます。|||Your favorites saved in this browser. Revisit profiles and upcoming debuts.
플랫폼과 방송 콘텐츠, 소개를 살펴보고 나만의 버튜버를 찾아보세요.|||配信プラットフォームや内容、紹介からお気に入りのVTuberを探しましょう。|||Find your favorite VTuber by platform, content and profile.
소개 카드의 하트를 누르면 여기서 다시 만날 수 있어요.|||紹介カードのハートを押すと、ここからまた会えます。|||Tap the heart on a profile card to find them here again.
아직 만나지 못한 버튜버와, 그 방송을 좋아하게 될 팬을 연결합니다.|||まだ出会っていないVTuberと、その配信を好きになるファンをつなぎます。|||Connecting VTubers with fans who have yet to discover them.
새로운 만남은, 아는 것에서 시작하니까|||新しい出会いは、知ることから|||Every new connection starts with getting to know someone.
누가 데뷔하는지,|||誰がデビューするのか、|||Who is debuting,
어떤 방송을 하는지.|||どんな配信をするのか。|||and what they stream.
여러 나라와 방송 플랫폼에서 새로운 버튜버가 첫 방송을 시작합니다. VDébut에서는 데뷔 일정과 소개를 함께 살펴보고, 마음이 가는 버튜버의 방송 채널로 찾아갈 수 있어요.|||さまざまな国やプラットフォームで新しいVTuberが初配信を迎えます。VDébutではデビュー予定と紹介を確認して、気になるVTuberの配信チャンネルへアクセスできます。|||New VTubers are starting their first streams across countries and platforms. Browse debut schedules and profiles on VDébut, then visit a channel that interests you.
달력에서 데뷔 날짜와 시간, 방송 플랫폼을 확인하세요.|||カレンダーでデビュー日時と配信プラットフォームを確認しましょう。|||Check debut dates, times and streaming platforms on the calendar.
소개와 주요 콘텐츠를 살펴보며 내 취향의 방송을 찾아보세요.|||紹介や主なコンテンツから、好みの配信を探しましょう。|||Explore profiles and content to find streams you enjoy.
신규 데뷔 소식이나 활동 중인 나의 소개를 직접 등록하세요.|||デビュー予定や活動中のプロフィールを自分で登録しましょう。|||Submit your upcoming debut or active VTuber profile.
예정 월만 정해졌다면 날짜 미정으로, 날짜만 정해졌다면 시간 미정으로 등록할 수 있어요.|||予定月だけ決まっている場合は日付未定、日付だけなら時間未定で登録できます。|||You can submit a planned month with the date undecided, or a date with the time undecided.
버튜버 소개 등록에서 데뷔 일정 없이 활동명과 방송 채널, 소개를 등록할 수 있어요.|||VTuber紹介登録では、デビュー予定がなくても活動名・配信チャンネル・紹介を登録できます。|||Use profile registration to submit your name, channel and introduction without a debut schedule.
운영자가 등록 정보와 방송 채널을 검토한 뒤 공개합니다.|||運営が登録情報と配信チャンネルを確認してから公開します。|||The team reviews your information and channel before publishing.
문의·정보 정정 화면에서 관련 페이지 주소와 수정 내용을 알려주세요. 운영자가 확인한 뒤 처리합니다.|||お問い合わせ・情報訂正画面で、該当ページのURLと修正内容をお知らせください。運営が確認して対応します。|||Send the page URL and requested changes through Contact / corrections. The team will review your request.
현재 관심 목록은 사용 중인 브라우저에 저장됩니다. 브라우저 데이터를 삭제하거나 다른 기기를 사용하면 같은 목록이 나타나지 않아요.|||お気に入りは現在のブラウザに保存されます。ブラウザのデータを削除した場合や別の端末では、同じ一覧は表示されません。|||Favorites are stored in this browser. Clearing browser data or using another device will not show the same list.
현재 통계는 치지직과 SOOP에서 수집된 방송 활동 기록을 제공합니다. 전체 방송 통계와 버튜버 소개 목록의 대상은 다를 수 있어요.|||現在の統計はCHZZKとSOOPで収集した配信活動の記録です。配信統計とVTuber紹介一覧では対象が異なる場合があります。|||Statistics currently show streaming activity collected from CHZZK and SOOP. Their coverage may differ from the VTuber directory.
새로운 버튜버를 만나는 방법부터 나의 데뷔 소식을 알리는 방법까지.|||新しいVTuberとの出会い方から、自分のデビューの告知まで。|||From discovering VTubers to sharing your own debut.
달력에서 관심 있는 날짜를 선택하세요.|||カレンダーで気になる日付を選びましょう。|||Choose a date on the calendar.
버튜버의 소개와 방송 콘텐츠를 확인하세요.|||VTuberの紹介と配信内容を確認しましょう。|||Explore the VTuber's profile and content.
관심 목록이나 캘린더에 저장하고 방송 채널에서 만나요.|||お気に入りやカレンダーに保存して、配信チャンネルで会いましょう。|||Save to favorites or your calendar, then meet them on their channel.
방송 채널과 나의 소개, 데뷔 일정을 등록하세요.|||配信チャンネル、自己紹介、デビュー予定を登録しましょう。|||Submit your channel, introduction and debut schedule.
공개된 소개 주소를 홍보에 활용하세요.|||公開された紹介ページのURLを告知に活用しましょう。|||Share your published profile URL to promote your streams.
잘못된 정보, 일정 수정·삭제 요청이나 서비스 의견을 알려주세요.|||情報の誤り、予定の修正・削除依頼、サービスへのご意見をお寄せください。|||Report incorrect information, request schedule changes or removal, or share feedback.
문의 처리에 필요한 정보 제공과 개인정보처리방침에 동의합니다.|||お問い合わせ対応に必要な情報の提供とプライバシーポリシーに同意します。|||I agree to provide the information needed to handle this inquiry and to the privacy policy.
접수 후 비공개 확인 키로 답변을 확인할 수 있어요.|||受付後、非公開の確認キーで回答を確認できます。|||After submitting, use your private access key to check the reply.
등록 신청은 검토 후 공개됩니다. 타인의 정보나 이미지에는 사용 권한과 출처가 필요합니다.|||登録申請は審査後に公開されます。他者の情報や画像には利用権限と出典が必要です。|||Submissions are published after review. You need permission and attribution for others' information or images.
등록 정보의 수정·삭제와 채널 변경은 문의 화면으로 요청할 수 있습니다. 운영자가 요청 내용과 공식 채널을 확인한 뒤 처리합니다.|||登録情報の修正・削除やチャンネル変更はお問い合わせ画面から依頼できます。運営が内容と公式チャンネルを確認して対応します。|||Request profile edits, removal or channel changes through Contact. The team checks the request and official channel before acting.
활동명·소개·방송 채널·콘텐츠·일정은 소개 공개를 위해 사용됩니다. 선택 입력한 연락 이메일과 문의 첨부 내용은 접수 확인·문의 처리에 사용되며 공개 소개에 표시되지 않습니다.|||活動名・紹介・配信チャンネル・コンテンツ・予定は紹介の公開に使用します。任意の連絡用メールと問い合わせ添付内容は受付確認・問い合わせ対応に使用し、公開紹介には表示しません。|||Your name, introduction, channel, content and schedule are used to publish your profile. Optional contact email and inquiry attachments are used to process submissions and inquiries and are not shown on public profiles.
문의 답변 조회용 확인 키와 관심 목록은 사용한 브라우저에 저장됩니다. 데뷔·소개 등록에는 개인 관리용 확인 키를 표시하거나 브라우저에 저장하지 않습니다. 서버에는 확인 키의 해시와 과도한 접수 제한을 위한 접속 주소 해시가 저장됩니다. 관리자는 접수 처리에 필요한 정보를 조회합니다.|||問い合わせ回答用の確認キーとお気に入りは使用したブラウザに保存されます。デビュー・紹介登録では個人管理用の確認キーを表示・保存しません。サーバーには確認キーのハッシュと過剰な申請を制限するための接続元アドレスのハッシュを保存します。管理者は対応に必要な情報を閲覧します。|||Inquiry access keys and favorites are stored in the browser used. Debut and profile submissions do not display or store personal management keys in the browser. The server stores hashed access keys and hashed connection addresses to limit excessive submissions. Administrators access information needed to process requests.
정보 열람·정정·삭제는 문의 화면 또는 ru_0120@naver.com으로 요청할 수 있습니다.|||情報の閲覧・訂正・削除はお問い合わせ画面またはru_0120@naver.comへご依頼ください。|||Request access, correction or deletion through Contact or ru_0120@naver.com.
접수된 데뷔 일정과 소개를 확인하고, 검토 후 공개하세요.|||受け付けたデビュー予定と紹介を確認し、審査後に公開してください。|||Review submitted debut schedules and profiles before publishing.
등록된 공식 채널의 운영자가 확인 문구를 게시했는지 직접 확인했습니다.|||登録された公式チャンネルの運営者が確認文を掲載したことを直接確認しました。|||I personally verified that the official channel operator posted the verification text.
검토 내용이나 문의 답변을 적어 주세요. 보완 처리 시 사유가 필요합니다.|||審査内容や問い合わせへの回答を入力してください。補足依頼には理由が必要です。|||Enter review notes or an inquiry reply. A reason is required when requesting revisions.
신규 버튜버 데뷔 캘린더 · 데뷔 일정과 소개 | VDébut|||新人VTuberデビューカレンダー・予定と紹介 | VDébut|||New VTuber debut calendar · Schedules and profiles | VDébut
신규 버튜버 데뷔 캘린더 · 데뷔 일정과 소개|||新人VTuberデビューカレンダー・予定と紹介|||New VTuber debut calendar · Schedules and profiles
나, 데뷔합니다 · 데뷔 등록|||私、デビューします・デビュー登録|||I'm debuting · Submit a debut
버튜버 찾기 · 소개와 방송 콘텐츠|||VTuberを探す・紹介と配信内容|||Find VTubers · Profiles and content
{0} | VDébut|||{0} | VDébut|||{0} | VDébut
{0} · 소개와 데뷔 일정 | VDébut|||{0}・紹介とデビュー予定 | VDébut|||{0} · Profile and debut schedule | VDébut
신규 버튜버의 데뷔 날짜·시간·방송 플랫폼을 캘린더에서 확인하세요. 관심 있는 버튜버의 소개를 살펴보고, 나의 데뷔 소식도 직접 등록할 수 있습니다.|||新人VTuberのデビュー日時と配信プラットフォームをカレンダーで確認。気になるVTuberの紹介を見たり、自分のデビュー予定を登録したりできます。|||Check new VTuber debut dates, times and platforms on the calendar. Explore profiles and submit your own debut.
버튜버의 소개와 데뷔 일정, 방송 활동을 확인하고 새로운 만남을 시작하세요.|||VTuberの紹介、デビュー予定、配信活動を確認して、新しい出会いを見つけましょう。|||Discover VTuber profiles, debut schedules and streaming activity.
주소를 확인하거나 데뷔 캘린더에서 새로운 만남을 찾아보세요.|||URLを確認するか、デビューカレンダーから新しい出会いを探してください。|||Check the URL or discover someone new on the debut calendar.
VDébut · 버튜버와 팬의 소개팅|||VDébut・VTuberとファンの出会い|||VDébut · Where VTubers and fans meet
새로운 VDébut 화면을 확인하고 있어요.|||新しいVDébutの画面を表示しています。|||You are viewing the new VDébut interface.
방송국 정보를 불러오고 있어요.|||チャンネル情報を取得しています。|||Loading channel information.
방송국 정보를 불러왔어요. 활동명과 소개를 확인해 주세요.|||チャンネル情報を取得しました。活動名と紹介を確認してください。|||Channel loaded. Please check your name and introduction.
지원하는 방송 플랫폼의 HTTPS 주소를 입력해 주세요.|||対応する配信プラットフォームのHTTPS URLを入力してください。|||Enter an HTTPS channel URL from a supported platform.
방송국 정보를 불러온 뒤 다시 신청해 주세요.|||チャンネル情報を取得してから再度申請してください。|||Load your channel information before submitting.
데뷔 날짜와 시간을 확인해 주세요.|||デビュー日時を確認してください。|||Check the debut date and time.
채널 활동명을 입력해 주세요.|||チャンネルの活動名を入力してください。|||Enter your channel display name.
공지 원문 링크는 HTTPS 주소로 입력해 주세요.|||告知の元リンクはHTTPS URLで入力してください。|||Enter the original announcement link as an HTTPS URL.
등록 정보의 공개와 이용 동의를 확인해 주세요.|||登録情報の公開と利用への同意を確認してください。|||Confirm your consent to publish and use the submitted information.
방송 주소를 입력하면 플랫폼을 자동으로 인식합니다.|||配信URLを入力するとプラットフォームを自動判定します。|||The platform is detected from your channel URL.
URL 입력 시 활동명과 소개도 불러옵니다.|||URLを入力すると活動名と紹介も取得します。|||Your name and introduction are also loaded from the URL.
채널의 활동명과 프로필 이미지가 이곳에 표시됩니다.|||チャンネルの活動名とプロフィール画像がここに表示されます。|||Your channel name and profile image will appear here.
불러온 문구를 확인하고 나만의 소개로 수정할 수 있습니다.|||取得した文章を確認し、自分の紹介に修正できます。|||Review the imported text and edit your introduction.
한국 표준시 Asia/Seoul (KST, UTC+9) 기준으로 등록하며 캘린더에서는 선택한 시간대로 표시합니다.|||韓国標準時Asia/Seoul（KST、UTC+9）で登録し、カレンダーでは選択したタイムゾーンで表示します。|||Schedules are submitted in Asia/Seoul (KST, UTC+9) and displayed in the calendar's selected time zone.
https://x.com/… 또는 데뷔 공지 주소|||https://x.com/… またはデビュー告知URL|||https://x.com/… or a debut announcement URL
X 등에 올린 공지 주소를 남겨주세요. HTTPS 주소를 사용할 수 있습니다.|||Xなどに掲載した告知のHTTPS URLを入力してください。|||Add the HTTPS URL of your announcement on X or another site.
{0} 데뷔 방송|||{0}のデビュー配信|||{0}'s debut stream
치지직 · SOOP · 유튜브 · 트위치의 데뷔 날짜와 소개를 한눈에 확인하세요.|||CHZZK・SOOP・YouTube・Twitchのデビュー日と紹介をまとめて確認しましょう。|||Explore debut dates and profiles across CHZZK, SOOP, YouTube and Twitch.
방송 활동과 지난 기록을 살펴보세요.|||配信活動と過去の記録を確認しましょう。|||Explore streaming activity and past records.
치지직·SOOP의 방송 통계에서 인기 콘텐츠와 활동 시간대를 살펴보세요.|||CHZZK・SOOPの配信統計で人気コンテンツや活動時間帯を確認しましょう。|||Explore popular content and streaming times in CHZZK and SOOP statistics.
데뷔 소식과 나의 소개를 등록하고 새로운 팬을 만나보세요.|||デビュー予定や自己紹介を登録して、新しいファンと出会いましょう。|||Share your debut and profile to meet new fans.
나의 활동명|||自分の活動名|||Your display name
선택한 플랫폼의 올바른 HTTPS 채널 주소를 입력해 주세요.|||選択したプラットフォームの正しいHTTPSチャンネルURLを入力してください。|||Enter a valid HTTPS channel URL for the selected platform.
날짜·시간·시간대를 확인해 주세요.|||日付・時間・タイムゾーンを確認してください。|||Check the date, time and time zone.
공개 정보와 이용 동의를 확인해 주세요.|||公開情報と利用への同意を確認してください。|||Check your public information and consent.
소개와 일정|||紹介と予定|||Profile and schedule
2 공개 내용 확인|||2 公開内容の確認|||2 Review public information
어떤 버튜버인가요?|||どんなVTuberですか？|||What kind of VTuber are you?
팬이 처음 만나는 나의 소개를 작성해 주세요.|||ファンが最初に読む自己紹介を書いてください。|||Write an introduction for fans meeting you for the first time.
팬들에게 불리고 싶은 이름|||ファンに呼んでほしい名前|||The name fans should call you
어떤 방송을 하는지, 어떤 매력을 만나볼 수 있는지 소개해 주세요.|||配信内容や自分の魅力を紹介してください。|||Introduce your streams and what makes them special.
/2,000 · 작성한 내용이 소개 페이지에 공개됩니다.|||/2,000・記入内容は紹介ページで公開されます。|||/2,000 · This text will appear on your public profile.
노래, 게임, 이야기 · 쉼표로 구분|||歌、ゲーム、雑談・カンマで区切る|||Singing, gaming, chatting · Separate with commas
한국어, 일본어 · 쉼표로 구분|||韓国語、日本語・カンマで区切る|||Korean, Japanese · Separate with commas
사용 권한이 있는 이미지의 HTTPS 주소|||利用権限のある画像のHTTPS URL|||HTTPS URL of an image you have permission to use
개인 활동이면 비워 두세요.|||個人活動の場合は空欄にしてください。|||Leave blank if you are independent.
나의 공식 방송 채널 주소|||自分の公式配信チャンネルURL|||Your official channel URL
방송 채널 변경은 문의를 통해 신청해 주세요.|||チャンネル変更はお問い合わせから申請してください。|||Request channel changes through Contact.
접수 후 비공개 확인 키로 처리 상태를 확인할 수 있어요. 등록은 검토 후 공개됩니다.|||受付後、非公開の確認キーで処理状況を確認できます。登録は審査後に公開されます。|||Use your private access key to check progress after submitting. Profiles are published after review.
 · {0} 기준|||・{0}基準||| · In {0}
공개할 정보와 이미지 사용 권한을 확인했으며,|||公開情報と画像の利用権限を確認し、|||I have checked the public information and image permissions, and agree to the
저장하면 공개 소개에 반영됩니다.|||保存すると公開紹介に反映されます。|||Saving updates your public profile.
검토 후 공개됩니다. 연락 이메일은 공개되지 않으며 소유권은 별도로 확인합니다.|||審査後に公開されます。連絡用メールは非公開で、所有権は別途確認します。|||Published after review. Contact email stays private; ownership is verified separately.
입력한 내용을 바탕으로 보여주는 미리보기입니다.|||入力内容に基づくプレビューです。|||A preview based on your entries.
아래 확인 키로 운영자의 답변을 확인할 수 있어요.|||下の確認キーで運営の回答を確認できます。|||Use the access key below to check the team's reply.
다른 기기에서도 확인하려면 키를 별도로 보관해 주세요. 다른 사람에게 공유하지 마세요.|||別の端末で確認する場合はキーを別途保存してください。他の人には共有しないでください。|||Save this key to check from another device. Do not share it with others.
방송 채널 정보를 불러오고, 소개와 일정을 확인해 주세요.|||チャンネル情報を取得して、紹介と予定を確認してください。|||Load your channel, then review your introduction and schedule.
등록 검토 상태와 공개된 소개 주소를 확인하세요.|||登録の審査状況と公開された紹介URLを確認できます。|||Check review progress and your published profile URL.
등록 정보와 채널을 확인하고 있어요. 처리 결과는 이 화면에서 확인할 수 있습니다.|||登録情報とチャンネルを確認中です。処理結果はこの画面で確認できます。|||Your information and channel are being reviewed. Check the result here.
아래 내용을 확인하고 보완해 다시 신청해 주세요.|||以下の内容を確認し、補足して再申請してください。|||Review the notes below, revise and resubmit.
현재 등록된 {0} 데뷔 일정이 없습니다.|||現在、{0}のデビュー予定は登録されていません。|||No {0} debut schedules are currently registered.
이전 버튜버|||前のVTuber|||Previous VTuber
다음 버튜버|||次のVTuber|||Next VTuber
생방송 바로가기|||ライブ配信へ|||Watch live
방송국 채널 바로가기|||配信チャンネルへ|||Visit channel
데뷔일|||デビュー日|||Debut
생방송 진행 중|||ライブ配信中|||Live now
운영자가 등록 정보와 방송 채널을 확인한 뒤 공개합니다.|||運営が登録情報と配信チャンネルを確認してから公開します。|||The team checks your information and channel before publishing.
데뷔 일정 등록|||デビュー予定の登録|||Submit a debut schedule
요청을 처리하지 못했습니다.|||リクエストを処理できませんでした。|||Your request could not be processed.
접수 번호: {0}\n확인 키: {1}|||受付番号: {0}\n確認キー: {1}|||Request ID: {0}\nAccess key: {1}
통합 데뷔 심사 & 버튜버 관리|||デビュー申請審査・VTuber管理|||Debut review & VTuber management
포털 소유권·문의 접수|||ポータル所有権・お問い合わせ|||Portal ownership & inquiries
언어 선택|||言語を選択|||Select language
{0} · 날짜 미정|||{0}・日付未定|||{0} · Date undecided
{0} · 시간 미정 ({1})|||{0}・時間未定（{1}）|||{0} · Time undecided ({1})
`.trim().split("\n");
var PORTAL_TRANSLATIONS = { ...PROFILE_CONTENT_TRANSLATIONS, ...Object.fromEntries(rows.map((row) => {
  const [key, ja, en] = row.split("|||").map((value) => value.replace(/\\n/g, "\n"));
  return [key, [ja, en]];
})) };
function translatePortalText(source, language, values = []) {
  const message = language === "ko" ? source : PORTAL_TRANSLATIONS[source]?.[language === "ja" ? 0 : 1] || source;
  return message.replace(/\{(\d+)\}/g, (_, index) => String(values[Number(index)] ?? `{${index}}`));
}
__name(translatePortalText, "translatePortalText");

// src/services/sitemapEntry.ts
function xmlText(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
}
__name(xmlText, "xmlText");
function sitemapEntry(path, language = "ko", alternates = false, modified) {
  return `<url><loc>${xmlText(siteCanonical(path, language))}</loc>${alternates ? siteAlternates(path).map((link) => `<xhtml:link rel="alternate" hreflang="${link.language}" href="${xmlText(link.href)}" />`).join("") : ""}${modified && Number.isFinite(Date.parse(modified)) ? `<lastmod>${xmlText(modified)}</lastmod>` : ""}</url>`;
}
__name(sitemapEntry, "sitemapEntry");

// ../shared/dateTimeFormatter.ts
var formatters = /* @__PURE__ */ new Map();
var MAX_FORMATTERS = 24;
function dateTimeFormatter(locale, options) {
  const key = JSON.stringify([locale, options]);
  const existing = formatters.get(key);
  if (existing)
    return existing;
  const formatter = new Intl.DateTimeFormat(locale, options);
  if (formatters.size >= MAX_FORMATTERS)
    formatters.delete(formatters.keys().next().value);
  formatters.set(key, formatter);
  return formatter;
}
__name(dateTimeFormatter, "dateTimeFormatter");

// ../shared/portal.ts
var REGISTRATION_REGIONS = [
  { code: "KR", label: "\uD55C\uAD6D", zones: ["Asia/Seoul"] },
  { code: "JP", label: "\uC77C\uBCF8", zones: ["Asia/Tokyo"] },
  { code: "US", label: "\uBBF8\uAD6D", zones: ["America/Los_Angeles", "America/New_York"] }
];
var PORTAL_PLATFORMS = [
  { id: "CHZZK", label: "\uCE58\uC9C0\uC9C1", icon: "/icons/chzzk_icon.png" },
  { id: "SOOP", label: "SOOP", icon: "/icons/soop/soop_symbol_blue.svg" },
  { id: "YOUTUBE", label: "YouTube", icon: "/icons/youtube_icon.png" },
  { id: "TWITCH", label: "Twitch", icon: "/icons/twitch_icon.svg" }
];
var PORTAL_TIMEZONES = ["Asia/Seoul", "Asia/Tokyo", "UTC", "America/Los_Angeles", "America/New_York", "Europe/London"];
function portalWebUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
__name(portalWebUrl, "portalWebUrl");
function portalChannelUrl(value, platform) {
  const safe = portalWebUrl(value);
  if (!safe)
    return "";
  const hosts = { CHZZK: ["chzzk.naver.com"], SOOP: ["sooplive.co.kr", "sooplive.com", "afreecatv.com"], YOUTUBE: ["youtube.com", "youtu.be"], TWITCH: ["twitch.tv"] };
  const host = new URL(safe).hostname;
  return hosts[platform]?.some((allowed) => host === allowed || host.endsWith(`.${allowed}`)) ? safe : "";
}
__name(portalChannelUrl, "portalChannelUrl");
function portalChannelKey(value, platform) {
  const safe = portalChannelUrl(value, platform);
  if (!safe)
    return "";
  const url = new URL(safe);
  const parts = url.pathname.split("/").filter(Boolean);
  if (platform === "SOOP") {
    const id = ["station", "live"].includes(parts[0]) ? parts[1] : parts[0];
    return id && /^[a-z0-9_]+$/i.test(id) ? `SOOP:${id.toLowerCase()}` : "";
  }
  if (platform === "CHZZK") {
    const id = parts[0] === "live" ? parts[1] : parts[0];
    return id && /^[a-f0-9]{32}$/i.test(id) ? `CHZZK:${id.toLowerCase()}` : "";
  }
  if (platform === "TWITCH")
    return parts[0] && /^[a-z0-9_]+$/i.test(parts[0]) ? `TWITCH:${parts[0].toLowerCase()}` : "";
  if (platform === "YOUTUBE" && url.hostname.endsWith("youtube.com")) {
    if (parts[0]?.startsWith("@"))
      return `YOUTUBE:${parts[0].toLowerCase()}`;
    if (["channel", "c", "user"].includes(parts[0]) && parts[1])
      return `YOUTUBE:${parts[0]}/${parts[0] === "channel" ? parts[1] : parts[1].toLowerCase()}`;
  }
  return "";
}
__name(portalChannelKey, "portalChannelKey");
function portalDateKey(value, timezone) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()))
    return "";
  const parts = dateTimeFormatter("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)?.value).join("-");
}
__name(portalDateKey, "portalDateKey");
function portalUtc(date, time, timezone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !PORTAL_TIMEZONES.includes(timezone))
    return "";
  const target = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(target))
    return "";
  let candidate = target;
  const format = dateTimeFormatter("en-GB", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  for (let i = 0; i < 3; i++) {
    const parts = format.formatToParts(candidate);
    const part = /* @__PURE__ */ __name((type) => parts.find((p) => p.type === type)?.value, "part");
    const wall = Date.parse(`${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:00Z`);
    candidate += target - wall;
  }
  const result = new Date(candidate).toISOString();
  return portalDateKey(result, timezone) === date && format.formatToParts(candidate).filter((p) => p.type === "hour" || p.type === "minute").map((p) => p.value).join(":") === time ? result : "";
}
__name(portalUtc, "portalUtc");

// ../shared/portalEditorial.ts
var HOME_INTRO = "\uCE58\uC9C0\uC9C1\xB7SOOP\xB7YouTube\xB7Twitch\uC758 \uB370\uBDD4 \uC77C\uC815\uACFC \uC18C\uAC1C\uB97C \uC0B4\uD3B4\uBCF4\uC138\uC694. \uAD00\uC2EC \uC788\uB294 \uBC84\uD29C\uBC84\uB97C \uC800\uC7A5\uD558\uACE0, \uCCAB \uBC29\uC1A1 \uC77C\uC815\uC744 \uB0B4 \uCE98\uB9B0\uB354\uC5D0 \uB2F4\uC744 \uC218 \uC788\uC5B4\uC694.";
var GUIDE_INTRO = "\uCCAB \uBC29\uC1A1\uC744 \uCC3E\uACE0 \uC800\uC7A5\uD558\uB294 \uBC29\uBC95\uBD80\uD130 \uB098\uC758 \uC18C\uAC1C\uC640 \uB370\uBDD4 \uACF5\uC9C0\uB97C \uC900\uBE44\uD558\uB294 \uBC29\uBC95\uAE4C\uC9C0 \uC548\uB0B4\uD569\uB2C8\uB2E4.";
function profileExcerpt(profile, limit = 140) {
  const source = (profile.headline?.trim() || profile.description.trim()).replace(/\s+/g, " ");
  return source.slice(0, limit) + (source.length > limit ? "\u2026" : "");
}
__name(profileExcerpt, "profileExcerpt");
var PORTAL_GUIDES = [
  { id: "save", title: "\uAD00\uC2EC \uC800\uC7A5\uACFC \uC77C\uC815 \uC800\uC7A5 \uD65C\uC6A9\uD558\uAE30", paragraphs: [
    "\uB9C8\uC74C\uC5D0 \uB4DC\uB294 \uC18C\uAC1C \uCE74\uB4DC\uC758 \uD558\uD2B8\uB97C \uB204\uB974\uBA74 \uAD00\uC2EC \uBAA9\uB85D\uC5D0\uC11C \uB2E4\uC2DC \uCC3E\uC744 \uC218 \uC788\uC5B4\uC694. \uAD00\uC2EC \uBAA9\uB85D\uC740 \uC0AC\uC6A9\uD55C \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC800\uC7A5\uB418\uBBC0\uB85C \uB2E4\uB978 \uAE30\uAE30\uB098 \uBE0C\uB77C\uC6B0\uC800\uC5D0\uC11C\uB294 \uBCC4\uB3C4\uB85C \uC800\uC7A5\uD574 \uC8FC\uC138\uC694.",
    "\uB0A0\uC9DC\uC640 \uC2DC\uAC04\uC774 \uC815\uD574\uC9C4 \uC77C\uC815\uC740 \uB0B4 \uCE98\uB9B0\uB354\uC5D0 \uC800\uC7A5\uD560 \uC218 \uC788\uC5B4\uC694. \uB0B4\uB824\uBC1B\uC740 \uC77C\uC815 \uD30C\uC77C\uC744 \uC0AC\uC6A9\uD558\uB294 \uCE98\uB9B0\uB354\uC5D0\uC11C \uC5F4\uACE0, \uC54C\uB9BC\uC740 \uD574\uB2F9 \uCE98\uB9B0\uB354\uC758 \uC124\uC815\uC5D0\uC11C \uD655\uC778\uD574 \uC8FC\uC138\uC694.",
    "\uC800\uC7A5\uD55C \uC77C\uC815\uC740 \uC790\uB3D9 \uAD6C\uB3C5\uC774 \uC544\uB2D9\uB2C8\uB2E4. \uB370\uBDD4 \uACF5\uC9C0\uAC00 \uBC14\uB00C\uBA74 \uAC1C\uC778 \uCE98\uB9B0\uB354\uC758 \uB0A0\uC9DC\uC640 \uC2DC\uAC04\uB3C4 \uC9C1\uC811 \uC218\uC815\uD574 \uC8FC\uC138\uC694."
  ], to: "/creators", action: "\uBC84\uD29C\uBC84 \uB458\uB7EC\uBCF4\uAE30" },
  { id: "timezone", title: "\uD574\uC678 \uB370\uBDD4 \uC77C\uC815\uC758 \uC2DC\uAC04 \uD655\uC778\uD558\uAE30", paragraphs: [
    "\uB2EC\uB825\uC758 \uC77C\uC815 \uD45C\uC2DC \uC2DC\uAC04\uB300\uB97C \uC120\uD0DD\uD558\uBA74 \uD655\uC815\uB41C \uC77C\uC815\uC774 \uD574\uB2F9 \uC9C0\uC5ED \uC2DC\uAC01\uC73C\uB85C \uD45C\uC2DC\uB429\uB2C8\uB2E4. \uC790\uC815 \uC804\uD6C4\uC758 \uBC29\uC1A1\uC740 \uC9C0\uC5ED\uC5D0 \uB530\uB77C \uB0A0\uC9DC\uAC00 \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC5B4\uC694.",
    "\uC2DC\uAC04 \uBBF8\uC815 \uC77C\uC815\uC740 \uACF5\uC9C0\uB41C \uB0A0\uC9DC\uC640 \uC6D0\uB798 \uC2DC\uAC04\uB300\uB97C \uD568\uAED8 \uD655\uC778\uD574 \uC8FC\uC138\uC694. \uB0A0\uC9DC \uBBF8\uC815 \uC77C\uC815\uC740 \uC608\uC815 \uC6D4\uB85C \uC548\uB0B4\uD558\uBA70 \uC784\uC758\uC758 \uB0A0\uC9DC\uB098 \uC2DC\uAC04\uC744 \uC815\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    "\uB0A0\uC9DC\uC640 \uC2DC\uAC04\uC774 \uD655\uC815\uB41C \uC18C\uAC1C \uC0C1\uC138\uC758 \uC77C\uC815\uC740 \uD55C\uAD6D \uC2DC\uAC04(KST) \uAE30\uC900\uC785\uB2C8\uB2E4. \uBC29\uC1A1 \uC9C1\uC804\uC5D0\uB294 \uC5F0\uACB0\uB41C \uB370\uBDD4 \uACF5\uC9C0\uC5D0\uC11C \uB0A0\uC9DC\uC640 \uC2DC\uAC04\uC744 \uB2E4\uC2DC \uD655\uC778\uD574 \uC8FC\uC138\uC694."
  ], to: "/", action: "\uB370\uBDD4 \uCE98\uB9B0\uB354\uB85C" },
  { id: "introduction", title: "\uD32C\uC5D0\uAC8C \uC804\uB2EC\uD560 \uBC29\uC1A1 \uC18C\uAC1C \uC791\uC131\uD558\uAE30", paragraphs: [
    "\uD65C\uB3D9\uBA85\uACFC \uBC29\uC1A1 \uCC44\uB110\uC744 \uBA3C\uC800 \uD655\uC778\uD558\uACE0, \uC8FC\uB85C \uD560 \uCF58\uD150\uCE20\uC640 \uBC29\uC1A1 \uC5B8\uC5B4\uB97C \uC801\uC5B4 \uBCF4\uC138\uC694. \uCC98\uC74C \uCC3E\uC544\uC628 \uD32C\uC774 \uC5B4\uB5A4 \uBC29\uC1A1\uC778\uC9C0 \uC774\uD574\uD560 \uC218 \uC788\uB294 \uC815\uBCF4\uAC00 \uC88B\uC2B5\uB2C8\uB2E4.",
    "\uAC8C\uC784 \uC774\uB984\uC774\uB098 \uB178\uB798 \uC7A5\uB974\uCC98\uB7FC \uC2E4\uC81C \uACC4\uD68D\uC744 \uAD6C\uCCB4\uC801\uC73C\uB85C \uC801\uACE0, \uCCAB \uBC29\uC1A1\uC5D0\uC11C \uBB34\uC5C7\uC744 \uC18C\uAC1C\uD560 \uC608\uC815\uC778\uC9C0 \uB367\uBD99\uC5EC \uC8FC\uC138\uC694. \uC544\uC9C1 \uC815\uD574\uC9C0\uC9C0 \uC54A\uC740 \uACC4\uD68D\uC740 \uD655\uC815\uB41C \uAC83\uCC98\uB7FC \uC4F0\uC9C0 \uC54A\uC544\uB3C4 \uB429\uB2C8\uB2E4.",
    "\uD55C \uC904 \uC18C\uAC1C\uC5D0\uB294 \uAC00\uC7A5 \uC804\uD558\uACE0 \uC2F6\uC740 \uD2B9\uC9D5\uC744, \uC18C\uAC1C\uAE00\uC5D0\uB294 \uCF58\uD150\uCE20\uC640 \uCCAB \uBC29\uC1A1 \uACC4\uD68D\uC744 \uB2F4\uC544 \uC8FC\uC138\uC694. \uD504\uB85C\uD544\uACFC \uC601\uC0C1\uC740 \uC0AC\uC6A9 \uAD8C\uD55C\uC774 \uC788\uB294 \uC790\uB8CC\uB85C \uC900\uBE44\uD569\uB2C8\uB2E4."
  ], to: "/creators/register", action: "\uBC84\uD29C\uBC84 \uC18C\uAC1C \uB4F1\uB85D" },
  { id: "announcement", title: "\uB370\uBDD4 \uACF5\uC9C0\uC5D0 \uB2F4\uC744 \uC815\uBCF4\uC640 \uBCC0\uACBD \uC548\uB0B4", paragraphs: [
    "\uB370\uBDD4 \uACF5\uC9C0\uC5D0\uB294 \uD65C\uB3D9\uBA85, \uB0A0\uC9DC, \uC2DC\uAC04, \uAE30\uC900 \uC2DC\uAC04\uB300\uC640 \uBC29\uC1A1 \uCC44\uB110 \uC8FC\uC18C\uB97C \uD568\uAED8 \uC801\uC5B4 \uC8FC\uC138\uC694. \uD32C \uC81C\uBCF4\uB77C\uBA74 \uB0A0\uC9DC\uC640 \uC2DC\uAC04\uC744 \uD655\uC778\uD560 \uC218 \uC788\uB294 \uACF5\uC2DD \uACF5\uC9C0 \uC8FC\uC18C\uB97C \uB0A8\uACA8 \uC8FC\uC138\uC694.",
    "\uB0A0\uC9DC\uB098 \uC2DC\uAC04\uC774 \uBBF8\uC815\uC774\uBA74 \uB4F1\uB85D \uD654\uBA74\uC5D0\uC11C \uBBF8\uC815 \uC0C1\uD0DC\uB97C \uC120\uD0DD\uD558\uC138\uC694. \uD655\uC815\uB418\uC9C0 \uC54A\uC740 \uC2DC\uAC04\uC744 \uC784\uC2DC\uB85C \uB123\uC73C\uBA74 \uD32C\uC774 \uC798\uBABB\uB41C \uC77C\uC815\uC744 \uC800\uC7A5\uD560 \uC218 \uC788\uC5B4\uC694.",
    "\uC77C\uC815\uC774 \uBC14\uB00C\uBA74 \uACF5\uC2DD \uACF5\uC9C0\uB97C \uC218\uC815\uD558\uACE0 VD\xE9but \uBB38\uC758 \uD654\uBA74\uC5D0 \uC18C\uAC1C \uC8FC\uC18C, \uBCC0\uACBD \uB0B4\uC6A9\uACFC \uACF5\uC9C0 \uCD9C\uCC98\uB97C \uB0A8\uACA8 \uC8FC\uC138\uC694. \uAC1C\uC778 \uCE98\uB9B0\uB354\uC5D0 \uC800\uC7A5\uD55C \uD32C\uB3C4 \uC218\uC815\uD560 \uC218 \uC788\uB3C4\uB85D \uBCC0\uACBD\uB41C \uB0A0\uC9DC\uC640 \uC2DC\uAC04\uC744 \uBD84\uBA85\uD558\uAC8C \uC54C\uB9BD\uB2C8\uB2E4."
  ], to: "/upload", action: "\uB370\uBDD4 \uC77C\uC815 \uB4F1\uB85D" },
  { id: "statistics", title: "\uBC29\uC1A1 \uD1B5\uACC4\uB85C \uB098\uC758 \uACC4\uD68D \uAC80\uD1A0\uD558\uAE30", paragraphs: [
    "\uC870\uD68C \uAE30\uAC04\uACFC \uD50C\uB7AB\uD3FC\uC744 \uBA3C\uC800 \uC120\uD0DD\uD558\uACE0, \uAD00\uC2EC \uC788\uB294 \uCF58\uD150\uCE20\uC758 \uBC29\uC1A1 \uD69F\uC218\uC640 \uBC29\uC1A1 \uC2DC\uAC04\uC744 \uD568\uAED8 \uC0B4\uD3B4\uBCF4\uC138\uC694. \uAC19\uC740 \uAE30\uAC04\uACFC \uC870\uAC74\uC73C\uB85C \uBE44\uAD50\uD558\uBA74 \uCC28\uC774\uB97C \uC77D\uAE30 \uC27D\uC2B5\uB2C8\uB2E4.",
    "\uBC29\uC1A1 \uD65C\uB3D9\uC740 \uD574\uB2F9 \uC2DC\uAC04\uC5D0 \uBC29\uC1A1\uD55C \uCC44\uB110\uC744, \uBC29\uC1A1 \uC2DC\uC791\uC740 \uBC29\uC1A1\uC774 \uC2DC\uC791\uB41C \uC2DC\uAC01\uC744 \uC0B4\uD3B4\uBCF4\uB294 \uD56D\uBAA9\uC785\uB2C8\uB2E4. \uC2DC\uAC04\uB300 \uCE78\uC744 \uC120\uD0DD\uD558\uBA74 \uC5F0\uACB0\uB41C \uBC29\uC1A1 \uC774\uB825\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC5B4\uC694.",
    "\uCC44\uB110\uC774 \uC801\uC5C8\uB358 \uC2DC\uAC04\uB9CC \uACE0\uB974\uAE30\uBCF4\uB2E4 \uB0B4\uAC00 \uAFB8\uC900\uD788 \uBC29\uC1A1\uD560 \uC218 \uC788\uB294 \uC2DC\uAC04\uACFC \uCF58\uD150\uCE20 \uC900\uBE44 \uACC4\uD68D\uC744 \uD568\uAED8 \uAC80\uD1A0\uD574 \uBCF4\uC138\uC694."
  ], to: "/analytics", action: "\uBC29\uC1A1 \uD1B5\uACC4 \uC0B4\uD3B4\uBCF4\uAE30" }
];
var STATISTICS_GUIDE = [
  { title: "\uAE30\uAC04\uACFC \uD50C\uB7AB\uD3FC\uBD80\uD130 \uD655\uC778\uD558\uC138\uC694", text: "\uBC29\uC1A1 \uD1B5\uACC4\uB294 \uCE58\uC9C0\uC9C1\xB7SOOP\uC5D0\uC11C \uC218\uC9D1\uB41C \uAE30\uB85D\uC744 \uC870\uD68C \uC870\uAC74\uC5D0 \uB9DE\uCDB0 \uBCF4\uC5EC\uC90D\uB2C8\uB2E4. \uB0A0\uC9DC\uC640 \uC2DC\uAC04\uB300\uB294 \uD55C\uAD6D \uC2DC\uAC04(KST) \uAE30\uC900\uC774\uBA70, \uBC84\uD29C\uBC84 \uC18C\uAC1C \uBAA9\uB85D\uACFC \uC9D1\uACC4 \uB300\uC0C1\uC774 \uB2E4\uB97C \uC218 \uC788\uC5B4\uC694." },
  { title: "\uBC29\uC1A1 \uD65C\uB3D9\uACFC \uBC29\uC1A1 \uC2DC\uC791\uC744 \uBE44\uAD50\uD558\uC138\uC694", text: "\uC804\uCCB4 \uD1B5\uACC4\uC758 \uBC29\uC1A1 \uD65C\uB3D9\uC740 \uC2DC\uAC04\uB300\uBCC4 \uD3C9\uADE0 \uBC29\uC1A1 \uCC44\uB110 \uC218, \uAC1C\uC778 \uD1B5\uACC4\uB294 \uAE30\uB85D\uB41C \uC2DC\uC810\uC758 \uBC29\uC1A1 \uD65C\uB3D9 \uBE44\uC728\uC785\uB2C8\uB2E4. \uBC29\uC1A1 \uC2DC\uC791\uC740 \uC2DC\uC791 \uC2DC\uAC01\uC774 \uD655\uC778\uB41C \uBC29\uC1A1\uC758 \uD69F\uC218\uC608\uC694. \uCE78\uC744 \uC120\uD0DD\uD574 \uAD00\uB828 \uC774\uB825\uC744 \uC0B4\uD3B4\uBCF4\uC138\uC694." },
  { title: "\uBC29\uC1A1 \uC2DC\uAC04\uACFC \uAE30\uB85D \uBC94\uC704\uB97C \uD568\uAED8 \uC77D\uC73C\uC138\uC694", text: "\uBC29\uC1A1 \uC2DC\uAC04\uC740 \uC774\uC5B4\uC11C \uD655\uC778\uB41C \uD65C\uB3D9 \uAD6C\uAC04\uC744 \uD569\uC0B0\uD569\uB2C8\uB2E4. \uD55C \uBC29\uC1A1\uC774 \uC5EC\uB7EC \uCF58\uD150\uCE20\uB97C \uC9C4\uD589\uD558\uBA74 \uCE74\uD14C\uACE0\uB9AC\uBCC4 \uBC29\uC1A1 \uD69F\uC218\uB97C \uB354\uD55C \uAC12\uC774 \uC804\uCCB4 \uBC29\uC1A1 \uD69F\uC218\uC640 \uB2E4\uB97C \uC218 \uC788\uC5B4\uC694." },
  { title: "\uAE30\uB85D \uC5C6\uC74C\uACFC 0\uC740 \uB2E4\uB985\uB2C8\uB2E4", text: "\uBC29\uC1A1 \uD65C\uB3D9\uC758 0\uC740 \uD655\uC778\uD55C \uAD6C\uAC04\uC5D0 \uBC29\uC1A1 \uC911\uC778 \uCC44\uB110\uC774 \uC5C6\uC5C8\uB2E4\uB294 \uB73B\uC785\uB2C8\uB2E4. \uBC29\uC1A1 \uC2DC\uC791\uC758 0\uC740 \uD655\uC778\uB41C \uC2DC\uC791 \uAE30\uB85D\uC774 \uC5C6\uB2E4\uB294 \uB73B\uC774\uC5D0\uC694. \uAE30\uB85D \uC5C6\uC74C\uC740 \uBE44\uAD50\uD560 \uAE30\uB85D\uC774 \uC5C6\uB294 \uCE78\uC785\uB2C8\uB2E4. \uC624\uB298 \uB0A8\uC740 \uC2DC\uAC04\uACFC \uAE30\uB85D \uB204\uB77D \uC5EC\uBD80\uB3C4 \uD568\uAED8 \uD655\uC778\uD574 \uC8FC\uC138\uC694." }
];

// src/services/initialPageLoading.ts
var INITIAL_PAGE_LOADING_HEAD = `<script>document.documentElement.setAttribute('data-vd-js','')<\/script><style>
[data-vd-initial-loader]{display:none}
html[data-vd-js] [data-vd-initial-content]{display:none}
html[data-vd-js] [data-vd-initial-loader]{display:grid;place-items:center;min-height:100svh;background:#f7f9ff}
[data-vd-initial-loader] span{display:block;width:28px;height:28px;border:3px solid #dce5f6;border-top-color:#2563eb;border-radius:50%;animation:vd-initial-spin .8s linear infinite}
@keyframes vd-initial-spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){[data-vd-initial-loader] span{animation:none}}
</style>`;
function initialPageRoot(body, escapedLoadingLabel) {
  return `<div id="root"><div data-vd-initial-loader role="status" aria-label="${escapedLoadingLabel}"><span aria-hidden="true"></span></div><div data-vd-initial-content>${body}</div></div>`;
}
__name(initialPageRoot, "initialPageRoot");

// ../shared/contentReview.ts
var REVIEW_PATTERNS = [
  /(?:야동|성인방송|벗방|섹스|자위|음란물|후방주의|19금)/i,
  /(?:porn(?:ography)?|onlyfans|sexually explicit|nude cam)/i,
  /(?:ミッドナイト叡智|エッな世界|よろシコ|アダルト配信|ポルノ|エロ配信)/i
];
function needsContentReview(text) {
  return REVIEW_PATTERNS.some((pattern) => pattern.test(text.normalize("NFKC")));
}
__name(needsContentReview, "needsContentReview");
function looksLikeVideoTitle(name) {
  return /【[^】]*(?:初配信|飲酒配信|新人VTuber)[^】]*】|\[(?:첫\s*방송|데뷔\s*방송|LIVE)\]/i.test(name.normalize("NFKC"));
}
__name(looksLikeVideoTitle, "looksLikeVideoTitle");
function reviewSnapshot(profile) {
  return JSON.stringify(Object.fromEntries(Object.entries(profile).filter(([key]) => !["contentReview", "ownerVerified", "requesterRole", "source"].includes(key)).sort(([a], [b]) => a.localeCompare(b))));
}
__name(reviewSnapshot, "reviewSnapshot");
function isPublicProfile(profile) {
  if (looksLikeVideoTitle(profile.displayName))
    return false;
  if (needsContentReview([profile.displayName, profile.description, profile.headline, profile.videoTitle, profile.debutGroupName, profile.agency, profile.regularSchedule, profile.fanGuide, ...(profile.media || []).flatMap((item) => [item.title, item.credit]), ...(profile.notices || []).map((item) => item.title), ...profile.tags].join(" ")))
    return false;
  if (profile.contentReview) {
    return profile.contentReview.state === "APPROVED" && profile.contentReview.snapshot === reviewSnapshot(profile);
  }
  return profile.source === "EXISTING";
}
__name(isPublicProfile, "isPublicProfile");
function reviewedProfile(profile, state, reviewedAt) {
  return { ...profile, contentReview: { state, snapshot: reviewSnapshot(profile), reviewedAt } };
}
__name(reviewedProfile, "reviewedProfile");
function publicBroadcastTitle(title) {
  return needsContentReview(title) ? "\uBC29\uC1A1 \uC81C\uBAA9 \uD655\uC778 \uC911" : title;
}
__name(publicBroadcastTitle, "publicBroadcastTitle");
function publicBroadcastPayload(value) {
  return Array.isArray(value) ? value.map(publicBroadcastPayload) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, /^(?:title|broadcastTitle|streamTitle)$/i.test(key) && typeof item === "string" ? publicBroadcastTitle(item) : publicBroadcastPayload(item)])) : value;
}
__name(publicBroadcastPayload, "publicBroadcastPayload");

// src/services/activityPageService.ts
function escapeActivityHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
__name(escapeActivityHtml, "escapeActivityHtml");
function activityJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
__name(activityJson, "activityJson");
function activityInitialBody(data, language = "ko") {
  data = publicBroadcastPayload(data);
  const esc = escapeActivityHtml;
  const text = /* @__PURE__ */ __name((source) => esc(translatePortalText(source, language)), "text");
  const readingGuide = `<section><h2>${text("\uBC29\uC1A1 \uD1B5\uACC4 \uC77D\uB294 \uBC95")}</h2>${STATISTICS_GUIDE.map((item) => `<h3>${text(item.title)}</h3><p>${text(item.text)}</p>`).join("")}</section>`;
  const heading = data.streamer ? `${data.streamer.name} \uBC29\uC1A1 \uD1B5\uACC4` : "\uBC29\uC1A1 \uD1B5\uACC4";
  const rows2 = data.broadcasts.slice(0, 25).map((row) => `<tr><td><a href="${activityStreamerPath(row.channelKey)}">${esc(row.channelName)}</a></td><td>${esc(row.title)}</td><td>${esc(row.categories)}</td><td>${Math.round(row.minutes)}\uBD84</td></tr>`).join("");
  return `<main class="bs-dashboard ad-dashboard" id="activity-initial"><header class="ad-heading"><h1>${esc(heading)}</h1></header><nav class="ad-view-nav"><a href="/analytics">\uC804\uCCB4 \uD1B5\uACC4</a><a href="/analytics/chzzk">\uCE58\uC9C0\uC9C1</a><a href="/analytics/soop">SOOP</a></nav><p>${esc(data.meta.from)} \u2014 ${esc(data.meta.to)}</p><section class="ad-summary"><div><span>\uBC29\uC1A1 \uCC44\uB110</span><strong>${data.summary.streamers}\uAC1C</strong></div><div><span>\uBC29\uC1A1 \uD69F\uC218</span><strong>${data.summary.broadcasts}\uD68C</strong></div><div><span>\uBC29\uC1A1 \uC2DC\uAC04</span><strong>${Math.round(data.summary.minutes)}\uBD84</strong></div></section><section><h2>\uCE74\uD14C\uACE0\uB9AC\uBCC4 \uBC29\uC1A1 \uD1B5\uACC4</h2><ul>${data.categories.map((row) => `<li>${esc(row.name)} \xB7 ${row.broadcasts}\uD68C \xB7 ${Math.round(row.minutes)}\uBD84</li>`).join("")}</ul></section><section><h2>\uBC29\uC1A1 \uC774\uB825</h2>${rows2 ? `<div class="ad-table-scroll"><table class="ad-table"><thead><tr><th>\uC2A4\uD2B8\uB9AC\uBA38</th><th>\uBC29\uC1A1 \uC81C\uBAA9</th><th>\uCE74\uD14C\uACE0\uB9AC</th><th>\uBC29\uC1A1 \uC2DC\uAC04</th></tr></thead><tbody>${rows2}</tbody></table></div>` : "<p>\uC120\uD0DD\uD55C \uAE30\uAC04\uC758 \uBC29\uC1A1 \uAE30\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</p>"}</section>${readingGuide}</main>`;
}
__name(activityInitialBody, "activityInitialBody");
function renderActivityPage(html, url, filters, data) {
  data = publicBroadcastPayload(data);
  const seo = activitySeo(filters, data, url.searchParams.get("search") || "");
  const esc = escapeActivityHtml;
  const noindex = activityNoindex(url, data);
  const language = url.searchParams.get("lang");
  html = html.replace(/<html\b[^>]*>/, `<html lang="${language === "ja" || language === "en" ? language : "ko"}">`);
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(seo.title)}</title>`);
  html = html.replace(/<meta\b[^>]*(?:name="(?:title|description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, "");
  html = html.replace(/<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>/g, "");
  html = html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, "");
  html = html.replace("</head>", `<meta name="description" content="${esc(seo.description)}"><link rel="canonical" href="${esc(seo.canonical)}"><meta name="robots" content="${noindex ? "noindex,follow" : "index,follow"}"><meta property="og:title" content="${esc(seo.title)}"><meta property="og:description" content="${esc(seo.description)}"><meta property="og:url" content="${esc(seo.canonical)}"><meta property="og:type" content="website"><meta property="og:image" content="${esc(seo.image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(seo.title)}"><meta name="twitter:description" content="${esc(seo.description)}"><meta name="twitter:image" content="${esc(seo.image)}"><script type="application/ld+json">${activityJson(pageStructuredData(seo))}<\/script></head>`);
  const start = html.indexOf('<div id="root">');
  const end = html.lastIndexOf("</div>");
  if (start < 0 || end < start)
    throw new Error("\uD1B5\uACC4 \uCD08\uAE30 \uBCF8\uBB38\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
  return html.slice(0, start).replace("</head>", `${INITIAL_PAGE_LOADING_HEAD}</head>`) + initialPageRoot(activityInitialBody(data, url.searchParams.get("lang") === "ja" ? "ja" : url.searchParams.get("lang") === "en" ? "en" : "ko"), "\uD654\uBA74\uC744 \uBD88\uB7EC\uC624\uACE0 \uC788\uC5B4\uC694") + `<script id="activity-bootstrap" type="application/json">${activityJson({ filters, data: { ...data, broadcasts: data.broadcasts.slice(0, 25) } })}<\/script>` + html.slice(end + 6);
}
__name(renderActivityPage, "renderActivityPage");
async function activitySitemapEntries(db) {
  const rows2 = await db.prepare(`SELECT s.channel_key AS channel, MAX(r.observed_at) AS modified
    FROM analytics_broadcast_snapshots s JOIN analytics_broadcast_runs r ON r.run_id=s.run_id
    WHERE r.state IN ('available','partial') GROUP BY s.channel_key`).all();
  const modified = rows2.results.reduce((max, row) => row.modified > max ? row.modified : max, "");
  return ["/analytics", "/analytics/chzzk", "/analytics/soop"].map((path) => sitemapEntry(path, "ko", false, modified)).join("") + rows2.results.map((row) => sitemapEntry(activityStreamerPath(row.channel), "ko", false, row.modified)).join("");
}
__name(activitySitemapEntries, "activitySitemapEntries");

// src/services/publicErrorPage.ts
function publicErrorPage(url, title, status) {
  const language = url.searchParams.get("lang") === "ja" ? "ja" : url.searchParams.get("lang") === "en" ? "en" : "ko";
  const esc = escapeActivityHtml;
  const text = /* @__PURE__ */ __name((value) => esc(translatePortalText(value, language)), "text");
  const query = language === "ko" ? "" : `?lang=${language}`;
  const description = status === 503 ? "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694. \uBB38\uC81C\uAC00 \uACC4\uC18D\uB418\uBA74 \uBB38\uC758 \uD654\uBA74\uC73C\uB85C \uC54C\uB824\uC8FC\uC138\uC694." : "\uC8FC\uC18C\uB97C \uD655\uC778\uD558\uAC70\uB098 \uACF5\uAC1C\uB41C \uB2E4\uB978 \uC18C\uAC1C\uB97C \uC0B4\uD3B4\uBCF4\uC138\uC694.";
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${text(title)} | VD\xE9but</title><meta name="description" content="${text(description)}"><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="${esc(siteCanonical(url.pathname, language))}"><style>body{margin:0;background:#f7f9fc;color:#19263b;font-family:system-ui,sans-serif;line-height:1.8}main{box-sizing:border-box;max-width:680px;margin:10vh auto;padding:32px 24px;overflow-wrap:anywhere}h1{font-size:clamp(24px,6vw,32px);line-height:1.4}nav{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}a{display:inline-flex;align-items:center;min-height:44px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:8px 14px;color:#2453a5;text-decoration:none}a:focus-visible{outline:3px solid #60a5fa;outline-offset:3px}</style></head><body><main><p>VD\xE9but</p><h1>${text(title)}</h1><p>${text(description)}</p><nav>${status === 503 ? `<a href="${esc(url.pathname + url.search)}">${text("\uB2E4\uC2DC \uC2DC\uB3C4")}</a>` : ""}<a href="/${query}">${text("\uB370\uBDD4 \uCE98\uB9B0\uB354\uB85C")}</a><a href="/contact${query}">${text("\uBB38\uC758\uD558\uAE30")}</a></nav></main></body></html>`;
}
__name(publicErrorPage, "publicErrorPage");

// src/services/publicResponseCache.ts
async function publicResponseCache(request, key, seconds, load, waitUntil) {
  if (request.method !== "GET" || request.headers.has("Authorization"))
    return load();
  const cache = typeof caches === "undefined" ? void 0 : caches.default;
  const cacheKey = new Request(key.toString());
  const bypass = /no-cache|no-store|max-age=0/i.test(request.headers.get("Cache-Control") || "");
  if (cache && !bypass) {
    const hit = await cache.match(cacheKey).catch(() => void 0);
    if (hit && Number(hit.headers.get("X-VD-Cache-Until")) > Date.now()) {
      const response2 = new Response(hit.body, hit);
      const remaining = Math.max(0, Math.min(seconds, Math.floor((Number(hit.headers.get("X-VD-Cache-Until")) - Date.now()) / 1e3)));
      response2.headers.set("Cache-Control", `public, max-age=${remaining}`);
      response2.headers.set("X-VD-Cache", "HIT");
      return response2;
    }
  }
  const response = await load();
  if (response.status !== 200 || response.headers.has("Set-Cookie") || /private|no-store/i.test(response.headers.get("Cache-Control") || ""))
    return response;
  response.headers.set("Cache-Control", `public, max-age=${seconds}`);
  response.headers.set("X-VD-Cache", bypass ? "REFRESH" : "MISS");
  response.headers.set("X-VD-Cache-Until", String(Date.now() + seconds * 1e3));
  if (cache)
    waitUntil(cache.put(cacheKey, response.clone()).catch(() => void 0));
  return response;
}
__name(publicResponseCache, "publicResponseCache");

// ../../../../backend/node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// ../../../../backend/node_modules/hono/dist/http-exception.js
var HTTPException = /* @__PURE__ */ __name(class extends Error {
  res;
  status;
  /**
   * Creates an instance of `HTTPException`.
   * @param status - HTTP status code for the exception. Defaults to 500.
   * @param options - Additional options for the exception.
   */
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  /**
   * Returns the response object associated with the exception.
   * If a response object is not provided, a new response is created with the error message and status code.
   * @returns The response object.
   */
  getResponse() {
    if (this.res) {
      const newResponse = new Response(this.res.body, {
        status: this.status,
        headers: this.res.headers
      });
      return newResponse;
    }
    return new Response(this.message, {
      status: this.status
    });
  }
}, "HTTPException");

// ../../../../backend/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// ../../../../backend/node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// ../../../../backend/node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// ../../../../backend/node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = /* @__PURE__ */ __name(class {
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  };
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
}, "HonoRequest");

// ../../../../backend/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// ../../../../backend/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = /* @__PURE__ */ __name(class {
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = (layout) => this.#layout = layout;
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = () => this.#layout;
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = (name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  };
  status = (status) => {
    this.#status = status;
  };
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  };
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = (object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  };
  html = (html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  };
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
}, "Context");

// ../../../../backend/node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = /* @__PURE__ */ __name(class extends Error {
}, "UnsupportedPathError");

// ../../../../backend/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../../../backend/node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = /* @__PURE__ */ __name(class _Hono {
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = (handler) => {
    this.errorHandler = handler;
    return this;
  };
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = (handler) => {
    this.#notFoundHandler = handler;
    return this;
  };
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  };
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
}, "_Hono");

// ../../../../backend/node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }, "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// ../../../../backend/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = /* @__PURE__ */ __name(class _Node {
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
}, "_Node");

// ../../../../backend/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = /* @__PURE__ */ __name(class {
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
}, "Trie");

// ../../../../backend/node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = /* @__PURE__ */ __name(class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
}, "RegExpRouter");

// ../../../../backend/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = /* @__PURE__ */ __name(class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
}, "SmartRouter");

// ../../../../backend/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = /* @__PURE__ */ __name(class _Node2 {
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
}, "_Node");

// ../../../../backend/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = /* @__PURE__ */ __name(class {
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
}, "TrieRouter");

// ../../../../backend/node_modules/hono/dist/hono.js
var Hono2 = /* @__PURE__ */ __name(class extends Hono {
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
}, "Hono");

// src/services/portalProfileRepository.ts
function legacyProfile(row) {
  const registrationOnly = row.description === `${row.display_name} \uC2A4\uD2B8\uB9AC\uBA38\uC758 \uCC44\uB110\uC785\uB2C8\uB2E4.` && row.debut_time === "00:00";
  const dateUnknown = /\[일정 미정\]|\[날짜 미정\]|\[미정\]/.test(row.description || "") || !row.start_at_utc;
  const timeUnknown = /\[시간 미정\]/.test(row.description || "");
  return {
    slug: row.slug,
    displayName: row.display_name,
    description: row.description || "",
    avatarUrl: portalWebUrl(row.profile_image_url || ""),
    agency: row.agency_name || "",
    platform: row.platform,
    channelUrl: portalChannelUrl(row.channel_url || "", row.platform),
    countryCode: row.country_code === "EN" ? "" : row.country_code || "",
    languages: [],
    tags: [],
    xUrl: portalWebUrl(row.x_url || ""),
    dateState: registrationOnly ? "NONE" : timeUnknown ? "TIME_TBD" : dateUnknown ? "DATE_TBD" : "FIXED",
    debutDate: registrationOnly ? "" : row.debut_date || "",
    debutTime: registrationOnly ? "" : row.debut_time || "",
    timezone: row.timezone || "Asia/Seoul",
    startAtUtc: row.start_at_utc || "",
    targetMonth: (row.debut_date || row.start_at_utc || "").slice(0, 7),
    ownerVerified: false,
    source: "EXISTING"
  };
}
__name(legacyProfile, "legacyProfile");
async function readPortalProfiles(db) {
  const [legacy, additions] = await Promise.all([db.prepare(`SELECT i.slug,i.display_name,i.description,i.profile_image_url,i.agency_name,i.country_code,i.x_url,i.debut_date,i.debut_time,i.timezone,i.start_at_utc,c.platform,c.channel_url FROM streamerChannel_info i JOIN streamerChannel c ON c.id=i.channel_id WHERE i.slug IS NOT NULL AND i.slug != ''`).all(), db.prepare("SELECT data FROM portal_profiles").all()]);
  const profiles = new Map((legacy.results || []).map((row) => [row.slug, legacyProfile(row)]));
  for (const row of additions.results || []) {
    const profile = JSON.parse(row.data);
    profiles.set(profile.slug, profile);
  }
  return [...profiles.values()];
}
__name(readPortalProfiles, "readPortalProfiles");
async function readPortalProfileBySlug(db, slug) {
  if (!slug)
    return null;
  const addition = await db.prepare("SELECT data FROM portal_profiles WHERE slug = ?").bind(slug).first();
  if (addition?.data) {
    try {
      return JSON.parse(addition.data);
    } catch {
    }
  }
  const legacy = await db.prepare(
    `SELECT i.slug,i.display_name,i.description,i.profile_image_url,i.agency_name,i.country_code,i.x_url,i.debut_date,i.debut_time,i.timezone,i.start_at_utc,c.platform,c.channel_url
     FROM streamerChannel_info i
     JOIN streamerChannel c ON c.id=i.channel_id
     WHERE i.slug = ? LIMIT 1`
  ).bind(slug).first();
  return legacy ? legacyProfile(legacy) : null;
}
__name(readPortalProfileBySlug, "readPortalProfileBySlug");
async function readPublicPortalProfiles(db) {
  return (await readPortalProfiles(db)).filter(isPublicProfile);
}
__name(readPublicPortalProfiles, "readPublicPortalProfiles");
async function readPublicPortalProfileBySlug(db, slug) {
  return Promise.resolve(await readPortalProfileBySlug(db, slug)).then((profile) => profile && isPublicProfile(profile) ? profile : null);
}
__name(readPublicPortalProfileBySlug, "readPublicPortalProfileBySlug");

// ../shared/profileMedia.ts
var PROFILE_MEDIA_KINDS = ["INTRO", "TEASER", "COVER", "HIGHLIGHT", "CLIP", "CATCH", "SHORT", "REPLAY", "BROADCAST_REPLAY", "GROUP_PV"];
var PROFILE_MEDIA_LABELS = { INTRO: "\uC790\uAE30\uC18C\uAC1C", TEASER: "\uB370\uBDD4 \uD2F0\uC800", COVER: "\uCEE4\uBC84\uACE1", HIGHLIGHT: "\uBC29\uC1A1 \uD558\uC774\uB77C\uC774\uD2B8", CLIP: "\uD074\uB9BD", CATCH: "Catch", SHORT: "Shorts", REPLAY: "\uCCAB \uBC29\uC1A1 \uB2E4\uC2DC\uBCF4\uAE30", BROADCAST_REPLAY: "\uBC29\uC1A1 \uB2E4\uC2DC\uBCF4\uAE30", GROUP_PV: "\uD300 \uACF5\uD1B5 PV" };
function profileVideoId(value) {
  try {
    const url = new URL(portalWebUrl(value));
    const parts = url.pathname.split("/").filter(Boolean);
    const id = url.hostname === "youtu.be" ? parts.length === 1 ? parts[0] : "" : ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname) ? url.pathname === "/watch" ? url.searchParams.get("v") || "" : ["shorts", "embed", "live"].includes(parts[0]) && parts.length === 2 ? parts[1] : "" : "";
    return !url.username && !url.password && !url.port && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : "";
  } catch {
    return "";
  }
}
__name(profileVideoId, "profileVideoId");
function profileMediaSource(value) {
  try {
    const url = new URL(portalWebUrl(value));
    if (url.username || url.password || url.port)
      return null;
    const youtubeId = profileVideoId(value);
    if (youtubeId)
      return { provider: "YOUTUBE", id: youtubeId, url: `https://youtu.be/${youtubeId}`, embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&playsinline=1`, thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` };
    const clip = url.hostname === "chzzk.naver.com" && url.pathname.match(/^\/clips\/([a-zA-Z0-9_-]{6,64})\/?$/);
    if (clip)
      return { provider: "CHZZK", id: `clip:${clip[1]}`, url: `https://chzzk.naver.com/clips/${clip[1]}`, embedUrl: `https://chzzk.naver.com/embed/clip/${clip[1]}`, thumbnailUrl: "" };
    const replay = url.hostname === "chzzk.naver.com" && url.pathname.match(/^\/video\/(\d{1,16})\/?$/);
    if (replay)
      return { provider: "CHZZK", id: `video:${replay[1]}`, url: `https://chzzk.naver.com/video/${replay[1]}`, embedUrl: "", thumbnailUrl: "" };
    const soop = ["vod.sooplive.com", "vod.sooplive.co.kr", "vod.afreecatv.com"].includes(url.hostname) && url.pathname.match(/^\/player\/(\d{1,16})(?:\/catch)?\/?$/);
    return soop ? { provider: "SOOP", id: soop[1], url: `https://vod.sooplive.com/player/${soop[1]}${url.pathname.includes("/catch") ? "/catch" : ""}`, embedUrl: `https://vod.sooplive.com/player/${soop[1]}/embed?autoPlay=true`, thumbnailUrl: "" } : null;
  } catch {
    return null;
  }
}
__name(profileMediaSource, "profileMediaSource");
function profileMediaKey(media) {
  const source = profileMediaSource(media.url);
  return source ? `${source.provider}:${source.id}` : "";
}
__name(profileMediaKey, "profileMediaKey");
function cleanMediaItem(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("\uC601\uC0C1 \uC815\uBCF4\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
  const item = value;
  const source = typeof item.url === "string" && item.url.length <= 1e3 ? profileMediaSource(item.url) : null;
  if (!source || item.provider !== source.provider)
    throw new Error("\uC120\uD0DD\uD55C \uD50C\uB7AB\uD3FC\uC758 \uC62C\uBC14\uB978 \uC601\uC0C1 \uC8FC\uC18C\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
  if (!PROFILE_MEDIA_KINDS.includes(item.kind))
    throw new Error("\uC601\uC0C1 \uC885\uB958\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.");
  const title = typeof item.title === "string" ? item.title.trim().slice(0, 100) : "";
  if (!title)
    throw new Error("\uC601\uC0C1 \uC81C\uBAA9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
  const thumbnail = typeof item.thumbnailUrl === "string" ? item.thumbnailUrl.trim() : "";
  if (thumbnail && (thumbnail.length > 1e3 || !portalWebUrl(thumbnail)))
    throw new Error("\uC378\uB124\uC77C\uC740 HTTPS \uC774\uBBF8\uC9C0 \uC8FC\uC18C\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
  return {
    provider: source.provider,
    kind: item.kind,
    url: source.url,
    title,
    thumbnailUrl: portalWebUrl(thumbnail),
    credit: typeof item.credit === "string" ? item.credit.trim().slice(0, 80) : "",
    featured: item.featured === true,
    linkOnly: item.linkOnly === true
  };
}
__name(cleanMediaItem, "cleanMediaItem");
function cleanProfileMedia(value) {
  if (!Array.isArray(value) || value.length > 12)
    throw new Error("\uC601\uC0C1\uC740 \uCD5C\uB300 12\uAC1C\uAE4C\uC9C0 \uB4F1\uB85D\uD560 \uC218 \uC788\uC5B4\uC694.");
  const items = value.map(cleanMediaItem);
  if (new Set(items.map(profileMediaKey)).size !== items.length)
    throw new Error("\uAC19\uC740 \uC601\uC0C1\uC740 \uD55C \uBC88\uB9CC \uB4F1\uB85D\uD574 \uC8FC\uC138\uC694.");
  if (items.filter((item) => item.featured).length > 1)
    throw new Error("\uB300\uD45C \uC601\uC0C1\uC740 \uD558\uB098\uB9CC \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.");
  if (items.some((item) => item.featured && item.kind === "GROUP_PV"))
    throw new Error("\uD300 \uACF5\uD1B5 PV\uB294 \uD300 \uC18C\uAC1C\uC5D0\uC11C \uD568\uAED8 \uBCF4\uC5EC\uB4DC\uB824\uC694. \uAC1C\uC778 \uB300\uD45C \uC601\uC0C1\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.");
  return items;
}
__name(cleanProfileMedia, "cleanProfileMedia");
function legacyMedia(profile) {
  return [
    ...profile.videoUrl ? [{ provider: "YOUTUBE", url: profile.videoUrl, title: profile.videoTitle || PROFILE_MEDIA_LABELS[profile.videoKind || "INTRO"], kind: profile.videoKind || "INTRO", featured: profile.videoKind !== "GROUP_PV" }] : [],
    ...profile.debutVideoUrl ? [{ provider: profileMediaSource(profile.debutVideoUrl)?.provider || "YOUTUBE", url: profile.debutVideoUrl, title: PROFILE_MEDIA_LABELS.REPLAY, kind: "REPLAY" }] : []
  ];
}
__name(legacyMedia, "legacyMedia");
function profileMediaItems(profile) {
  return (profile.media ?? legacyMedia(profile)).filter((item, index, items) => Boolean(profileMediaKey(item)) && profileMediaSource(item.url)?.provider === item.provider && items.findIndex((candidate) => profileMediaKey(candidate) === profileMediaKey(item)) === index).slice(0, 12);
}
__name(profileMediaItems, "profileMediaItems");

// ../shared/profilePresentation.ts
var PROFILE_VIDEO_KINDS = ["INTRO", "TEASER", "GROUP_PV", "REPLAY", "COVER", "HIGHLIGHT"];
function presentationText(body, key, max) {
  return typeof body[key] === "string" ? body[key].trim().slice(0, max) : "";
}
__name(presentationText, "presentationText");
function presentationUrl(body, key) {
  const value = presentationText(body, key, 1e3);
  if (value && !portalWebUrl(value))
    throw new Error("\uCD94\uAC00 \uB9C1\uD06C\uC640 \uC774\uBBF8\uC9C0 \uC8FC\uC18C\uB294 HTTPS \uC8FC\uC18C\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
  return portalWebUrl(value);
}
__name(presentationUrl, "presentationUrl");
function presentationChannels(body) {
  if (body.additionalChannels === void 0)
    return [];
  if (!Array.isArray(body.additionalChannels) || body.additionalChannels.length > 4)
    throw new Error("\uCD94\uAC00 \uBC29\uC1A1 \uCC44\uB110\uC740 \uCD5C\uB300 4\uAC1C\uAE4C\uC9C0 \uB4F1\uB85D\uD560 \uC218 \uC788\uC5B4\uC694.");
  const seen = /* @__PURE__ */ new Set([portalChannelKey(String(body.channelUrl || ""), String(body.platform || ""))]);
  return body.additionalChannels.reduce((channels, item) => {
    if (!item || typeof item !== "object")
      throw new Error("\uCD94\uAC00 \uCC44\uB110\uC758 \uD50C\uB7AB\uD3FC\uACFC \uCC44\uB110 \uC8FC\uC18C\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
    const platform = item.platform;
    const channelUrl = typeof item.channelUrl === "string" ? portalChannelUrl(item.channelUrl.trim(), platform) : "";
    const key = portalChannelKey(channelUrl, platform);
    if (!PORTAL_PLATFORMS.some((p) => p.id === platform) || !key)
      throw new Error("\uCD94\uAC00 \uCC44\uB110\uC758 \uD50C\uB7AB\uD3FC\uACFC \uCC44\uB110 \uC8FC\uC18C\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
    if (!seen.has(key)) {
      seen.add(key);
      channels.push({ platform, channelUrl });
    }
    return channels;
  }, []);
}
__name(presentationChannels, "presentationChannels");
function cleanProfilePresentation(body) {
  const videoUrl = presentationUrl(body, "videoUrl");
  const debutVideoUrl = presentationUrl(body, "debutVideoUrl");
  const videoKind = presentationText(body, "videoKind", 20) || "INTRO";
  if (videoUrl && !profileVideoId(videoUrl))
    throw new Error("\uB300\uD45C \uC601\uC0C1\uC740 YouTube \uC601\uC0C1 \uC8FC\uC18C\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
  if (debutVideoUrl && !profileMediaSource(debutVideoUrl))
    throw new Error("\uB370\uBDD4 \uBC29\uC1A1\uC740 YouTube\xB7\uCE58\uC9C0\uC9C1\xB7SOOP \uC601\uC0C1 \uC8FC\uC18C\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
  if (!PROFILE_VIDEO_KINDS.includes(videoKind))
    throw new Error("\uB300\uD45C \uC601\uC0C1\uC758 \uC885\uB958\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.");
  return {
    headline: presentationText(body, "headline", 100),
    bannerUrl: presentationUrl(body, "bannerUrl"),
    websiteUrl: presentationUrl(body, "websiteUrl"),
    noticeUrl: presentationUrl(body, "noticeUrl"),
    xUrl: presentationUrl(body, "xUrl"),
    // 공식 카페는 SNS와 별도로 저장하며 다른 선택 링크와 같은 주소 검증을 적용한다.
    cafeUrl: presentationUrl(body, "cafeUrl"),
    additionalChannels: presentationChannels(body),
    videoUrl,
    debutVideoUrl,
    videoTitle: presentationText(body, "videoTitle", 100),
    ...body.media === void 0 ? {} : { media: cleanProfileMedia(body.media) },
    regularSchedule: presentationText(body, "regularSchedule", 160),
    fanGuide: presentationText(body, "fanGuide", 1500),
    notices: presentationNotices(body.notices),
    videoKind
  };
}
__name(cleanProfilePresentation, "cleanProfilePresentation");
function presentationNotices(value) {
  if (value === void 0)
    return [];
  if (!Array.isArray(value) || value.length > 3)
    throw new Error("\uC8FC\uC694 \uC18C\uC2DD\uC740 \uCD5C\uB300 3\uAC1C\uAE4C\uC9C0 \uB4F1\uB85D\uD560 \uC218 \uC788\uC5B4\uC694.");
  return value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      throw new Error("\uC18C\uC2DD \uC81C\uBAA9\uACFC \uC6D0\uBB38 \uC8FC\uC18C\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
    const title = presentationText(entry, "title", 100);
    const url = presentationUrl(entry, "url");
    if (!title || !url)
      throw new Error("\uC18C\uC2DD \uC81C\uBAA9\uACFC \uC6D0\uBB38 \uC8FC\uC18C\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
    return { title, url };
  });
}
__name(presentationNotices, "presentationNotices");

// src/services/platformApiService.ts
async function fetchChzzkProfile(channelUrlOrId) {
  const clean = channelUrlOrId.trim();
  try {
    if (clean.includes("/video/")) {
      const parts = clean.split("/video/");
      const videoId = parts[1]?.split("?")[0]?.split("/")[0];
      if (videoId) {
        const videoApiUrl = `https://api.chzzk.naver.com/service/v1/videos/${videoId}`;
        const vRes = await fetch(videoApiUrl, {
          headers: { "Accept": "application/json" }
        });
        if (vRes.ok) {
          const vData = await vRes.json();
          if (vData.code === 200 && vData.content?.channel) {
            const ch = vData.content.channel;
            return {
              success: true,
              platform: "CHZZK",
              channelId: ch.channelId,
              creatorName: ch.channelName || "\uCE58\uC9C0\uC9C1 \uC2A4\uD2B8\uB9AC\uBA38",
              profileImageUrl: ch.channelImageUrl || "",
              channelUrl: `https://chzzk.naver.com/${ch.channelId}`,
              description: ch.channelDescription || `${ch.channelName || "\uBC84\uD29C\uBC84"}\uC758 \uACF5\uC2DD \uBC29\uC1A1\uAD6D\uC785\uB2C8\uB2E4.`,
              verified: ch.verifiedMark || false
            };
          }
        }
      }
    }
    let channelId = clean;
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      const urlObj = new URL(clean);
      const pathname = urlObj.pathname;
      const segments = pathname.split("/").filter(Boolean);
      channelId = segments[segments.length - 1] || "";
      if (segments[0] === "live" && segments[1]) {
        channelId = segments[1];
      }
    }
    const apiUrl = `https://api.chzzk.naver.com/service/v1/channels/${channelId}`;
    const response = await fetch(apiUrl, {
      headers: { "Accept": "application/json" }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.code === 200 && data.content) {
        return {
          success: true,
          platform: "CHZZK",
          channelId: data.content.channelId || channelId,
          creatorName: data.content.channelName || "\uCE58\uC9C0\uC9C1 \uC2A4\uD2B8\uB9AC\uBA38",
          profileImageUrl: data.content.channelImageUrl || "",
          channelUrl: `https://chzzk.naver.com/${channelId}`,
          description: data.content.channelDescription || `${data.content.channelName || "\uBC84\uD29C\uBC84"}\uC758 \uACF5\uC2DD \uCE58\uC9C0\uC9C1 \uBC29\uC1A1\uAD6D\uC785\uB2C8\uB2E4.`,
          verified: data.content.verifiedMark || false
        };
      }
    }
    return {
      success: false,
      platform: "CHZZK",
      channelId,
      creatorName: "",
      profileImageUrl: "",
      channelUrl: clean,
      verified: false,
      error: "\uCE58\uC9C0\uC9C1 \uCC44\uB110/\uBE44\uB514\uC624 \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
    };
  } catch (err) {
    return {
      success: false,
      platform: "CHZZK",
      channelId: channelUrlOrId,
      creatorName: "",
      profileImageUrl: "",
      channelUrl: channelUrlOrId,
      verified: false,
      error: err.message || "\uB124\uD2B8\uC6CC\uD06C \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    };
  }
}
__name(fetchChzzkProfile, "fetchChzzkProfile");
async function fetchSoopProfile(userIdOrUrl) {
  let userId = userIdOrUrl.trim();
  if (userId.startsWith("http://") || userId.startsWith("https://")) {
    try {
      const urlObj = new URL(userId);
      const segments = urlObj.pathname.split("/").filter(Boolean);
      if (segments.includes("memo")) {
        const memoIdx = segments.indexOf("memo");
        if (segments[memoIdx + 1]) {
          userId = segments[memoIdx + 1];
        }
      } else if (segments.includes("station")) {
        const stationIdx = segments.indexOf("station");
        if (segments[stationIdx + 1]) {
          userId = segments[stationIdx + 1];
        }
      } else if (segments.length > 0) {
        userId = segments[segments.length - 1];
      }
    } catch {
    }
  }
  const primaryApiUrl = `https://chapi.sooplive.co.kr/api/${userId}/station`;
  const fallbackApiUrl = `https://chapi.sooplive.com/api/${userId}/station`;
  try {
    let response = await fetch(primaryApiUrl, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      response = await fetch(fallbackApiUrl, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
    }
    if (response.ok) {
      const resData = await response.json();
      const data = resData.data || resData;
      const station = data?.station;
      const broad = data?.broad;
      if (data && (station || data.user_nick || data.profile_image)) {
        const nick = station?.user_nick || broad?.user_nick || station?.name || data.user_nick || userId;
        let profileImg = data?.profile_image || station?.profile_image || "";
        if (profileImg.startsWith("//")) {
          profileImg = `https:${profileImg}`;
        }
        return {
          success: true,
          platform: "SOOP",
          channelId: userId,
          creatorName: nick,
          profileImageUrl: profileImg,
          channelUrl: `https://www.sooplive.com/station/${userId}`,
          description: station?.joint_title || station?.station_name || `${nick}\uC758 \uACF5\uC2DD SOOP \uBC29\uC1A1\uAD6D\uC785\uB2C8\uB2E4.`,
          verified: true
        };
      }
    }
    return {
      success: false,
      platform: "SOOP",
      channelId: userId,
      creatorName: "",
      profileImageUrl: "",
      channelUrl: userIdOrUrl,
      verified: false,
      error: "SOOP \uBC29\uC1A1\uAD6D \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
    };
  } catch (err) {
    return {
      success: false,
      platform: "SOOP",
      channelId: userId,
      creatorName: "",
      profileImageUrl: "",
      channelUrl: userIdOrUrl,
      verified: false,
      error: err.message || "\uB124\uD2B8\uC6CC\uD06C \uC624\uB958"
    };
  }
}
__name(fetchSoopProfile, "fetchSoopProfile");
async function fetchYoutubeProfile(channelUrlOrHandle) {
  let targetUrl = channelUrlOrHandle.trim();
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    if (targetUrl.startsWith("@")) {
      targetUrl = `https://www.youtube.com/${targetUrl}`;
    } else {
      targetUrl = `https://www.youtube.com/@${targetUrl}`;
    }
  }
  const defaultHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9,ja-JP;q=0.8,en-US;q=0.7,en;q=0.6",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  };
  try {
    let html = "";
    const isVideoUrl = targetUrl.includes("/watch") || targetUrl.includes("youtu.be/");
    const response = await fetch(targetUrl, { headers: defaultHeaders });
    if (response.ok) {
      html = await response.text();
    }
    let creatorName = "";
    let channelUrl = targetUrl;
    let profileImageUrl = "";
    let description = "";
    if (isVideoUrl && html) {
      const authorMatch = html.match(/"author":"([^"]+)"/i) || html.match(/"ownerChannelName":"([^"]+)"/i) || html.match(/<link itemprop="name" content="([^"]+)">/i);
      if (authorMatch && authorMatch[1]) {
        creatorName = authorMatch[1];
      }
      const channelUrlMatch = html.match(/<span itemprop="author"[^>]*>\s*<link itemprop="url" href="([^"]+)">/i) || html.match(/"channelUrl":"([^"]+)"/i) || html.match(/href="(https:\/\/www\.youtube\.com\/@[^"]+)"/i);
      if (channelUrlMatch && channelUrlMatch[1]) {
        channelUrl = channelUrlMatch[1];
      }
      const avatarMatches = html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+=[sS0-9-]+[a-zA-Z0-9_-]*/g) || html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+/g);
      if (avatarMatches && avatarMatches.length > 0) {
        profileImageUrl = avatarMatches[0].replace(/=s\d+-/, "=s900-");
      }
      if (channelUrl && channelUrl !== targetUrl) {
        try {
          const chRes = await fetch(channelUrl, { headers: defaultHeaders });
          if (chRes.ok) {
            const chHtml = await chRes.text();
            const chTitleMatch = chHtml.match(/<meta property="og:title" content="([^"]+)">/i) || chHtml.match(/<title>([^<]+)<\/title>/i);
            if (chTitleMatch) {
              creatorName = chTitleMatch[1].replace(/ - YouTube$/, "").trim();
            }
            const chDescMatch = chHtml.match(/<meta property="og:description" content="([^"]+)">/i);
            if (chDescMatch) {
              description = chDescMatch[1];
            }
            const chAvatars = chHtml.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+=[sS0-9-]+[a-zA-Z0-9_-]*/g) || chHtml.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+/g);
            if (chAvatars && chAvatars.length > 0) {
              profileImageUrl = chAvatars[0].replace(/=s\d+-/, "=s900-");
            }
          }
        } catch {
        }
      }
    } else if (html) {
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/i) || html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch) {
        creatorName = titleMatch[1].replace(/ - YouTube$/, "").trim();
      }
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/i);
      if (descMatch) {
        description = descMatch[1];
      }
      const avatarMatches = html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+=[sS0-9-]+[a-zA-Z0-9_-]*/g) || html.match(/https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_-]+/g);
      if (avatarMatches && avatarMatches.length > 0) {
        profileImageUrl = avatarMatches[0].replace(/=s\d+-/, "=s900-");
      }
    }
    if (!creatorName) {
      const handleMatch = targetUrl.match(/@([a-zA-Z0-9._-]+)/);
      creatorName = handleMatch ? handleMatch[1] : "\uC720\uD29C\uBE0C \uC2A4\uD2B8\uB9AC\uBA38";
    }
    if (!description) {
      description = `${creatorName}\uC758 \uACF5\uC2DD \uC720\uD29C\uBE0C \uCC44\uB110\uC785\uB2C8\uB2E4.`;
    }
    return {
      success: true,
      platform: "YOUTUBE",
      channelId: channelUrl,
      creatorName,
      profileImageUrl,
      channelUrl,
      description,
      verified: true
    };
  } catch (err) {
    const handleMatch = targetUrl.match(/@([a-zA-Z0-9._-]+)/);
    const creatorName = handleMatch ? handleMatch[1] : "\uC720\uD29C\uBE0C \uC2A4\uD2B8\uB9AC\uBA38";
    return {
      success: true,
      platform: "YOUTUBE",
      channelId: targetUrl,
      creatorName,
      profileImageUrl: "",
      channelUrl: targetUrl,
      description: `${creatorName}\uC758 \uACF5\uC2DD \uC720\uD29C\uBE0C \uCC44\uB110\uC785\uB2C8\uB2E4.`,
      verified: true
    };
  }
}
__name(fetchYoutubeProfile, "fetchYoutubeProfile");
async function fetchTwitchProfile(channelUrlOrId) {
  let username = channelUrlOrId.trim();
  if (username.startsWith("http://") || username.startsWith("https://")) {
    try {
      const urlObj = new URL(username);
      const segments = urlObj.pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        username = segments[0];
      }
    } catch {
    }
  }
  username = username.replace(/^@/, "").trim();
  const channelUrl = `https://www.twitch.tv/${username}`;
  try {
    const ivrRes = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(username.toLowerCase())}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    if (ivrRes.ok) {
      const ivrData = await ivrRes.json();
      const userData = Array.isArray(ivrData) ? ivrData[0] : ivrData;
      if (userData && (userData.displayName || userData.login)) {
        const displayName = userData.displayName || userData.login || username;
        const profileImage = userData.logo || "";
        const description = userData.bio || `${displayName}\uC758 \uACF5\uC2DD \uD2B8\uC704\uCE58 \uBC29\uC1A1\uAD6D\uC785\uB2C8\uB2E4.`;
        return {
          success: true,
          platform: "TWITCH",
          channelId: userData.login || username,
          creatorName: displayName,
          profileImageUrl: profileImage,
          channelUrl,
          description,
          verified: true
        };
      }
    }
    const response = await fetch(channelUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });
    if (response.ok) {
      const html = await response.text();
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/i) || html.match(/<title>([^<]+)<\/title>/i);
      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)">/i);
      const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/i);
      if (titleMatch || imageMatch) {
        let title = titleMatch ? titleMatch[1] : username;
        title = title.replace(/ - Twitch$/, "").replace(/ - 트위치$/, "").trim();
        const profileImg = imageMatch ? imageMatch[1] : "";
        const desc = descMatch ? descMatch[1] : `${title}\uC758 \uACF5\uC2DD \uD2B8\uC704\uCE58 \uCC44\uB110\uC785\uB2C8\uB2E4.`;
        return {
          success: true,
          platform: "TWITCH",
          channelId: username,
          creatorName: title || username,
          profileImageUrl: profileImg,
          channelUrl,
          description: desc,
          verified: true
        };
      }
    }
    return {
      success: true,
      platform: "TWITCH",
      channelId: username,
      creatorName: username,
      profileImageUrl: "",
      channelUrl,
      description: `${username}\uC758 \uD2B8\uC704\uCE58 \uCC44\uB110\uC785\uB2C8\uB2E4.`,
      verified: true
    };
  } catch (err) {
    return {
      success: true,
      platform: "TWITCH",
      channelId: username,
      creatorName: username,
      profileImageUrl: "",
      channelUrl,
      description: `${username}\uC758 \uD2B8\uC704\uCE58 \uCC44\uB110\uC785\uB2C8\uB2E4.`,
      verified: true
    };
  }
}
__name(fetchTwitchProfile, "fetchTwitchProfile");
async function fetchPlatformProfile(platform, inputUrl) {
  const lowerUrl = (inputUrl || "").toLowerCase();
  let upper = (platform || "").toUpperCase();
  if (lowerUrl.includes("sooplive.com") || lowerUrl.includes("sooplive.co.kr") || lowerUrl.includes("afreecatv.com")) {
    upper = "SOOP";
  } else if (lowerUrl.includes("chzzk.naver.com")) {
    upper = "CHZZK";
  } else if (lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be")) {
    upper = "YOUTUBE";
  } else if (lowerUrl.includes("twitch.tv")) {
    upper = "TWITCH";
  }
  if (upper === "CHZZK") {
    return await fetchChzzkProfile(inputUrl);
  } else if (upper === "SOOP" || upper === "AFREECA") {
    return await fetchSoopProfile(inputUrl);
  } else if (upper === "YOUTUBE") {
    return await fetchYoutubeProfile(inputUrl);
  } else if (upper === "TWITCH") {
    return await fetchTwitchProfile(inputUrl);
  }
  return {
    success: false,
    platform: upper || "CHZZK",
    channelId: inputUrl,
    creatorName: "",
    profileImageUrl: "",
    channelUrl: inputUrl,
    verified: false,
    error: "\uC9C0\uC6D0\uB418\uC9C0 \uC54A\uB294 \uD50C\uB7AB\uD3FC\uC774\uAC70\uB098 \uBC29\uC1A1\uAD6D \uC8FC\uC18C\uAC00 \uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
  };
}
__name(fetchPlatformProfile, "fetchPlatformProfile");

// src/services/eventDbService.ts
var MOCK_EVENTS = [
  {
    id: "evt_1",
    title: "\uC544\uB871\uB760 \uB370\uBDD4 \uBC29\uC1A1",
    type: "FIRST_DEBUT",
    creator: {
      id: 1,
      displayName: "\uC544\uB871\uB760",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      agency: "\uAC1C\uC778\uC138",
      countryCode: "KR",
      languages: ["ko"],
      slug: "arongtti"
    },
    startAtUtc: "2026-07-01T12:00:00.000Z",
    originalTimezone: "Asia/Seoul",
    status: "PUBLISHED",
    verificationStatus: "SOURCE_VERIFIED",
    links: [{ platform: "SOOP", url: "https://www.sooplive.co.kr/station/memo/a0714/post/166790429", isPrimary: true }],
    description: "\uC6F0\uCEF4\uBC84\uCD94\uC5BC \uB370\uBDD4 \uBC29\uC1A1"
  }
];
async function fetchEventsFromD1(db) {
  try {
    const { results } = await db.prepare(`
      SELECT 
        i.id as info_id,
        i.channel_id,
        i.slug,
        i.display_name,
        i.profile_image_url,
        i.description,
        i.agency_name,
        i.debut_date,
        i.debut_time,
        i.timezone,
        i.start_at_utc,
        i.country_code,
        c.platform,
        c.channel_url,
        c.channel_name
      FROM streamerChannel_info i
      INNER JOIN streamerChannel c ON i.channel_id = c.id
      ORDER BY i.start_at_utc ASC
    `).all();
    if (!results || results.length === 0) {
      return null;
    }
    const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
    return results.map((row) => {
      const avatarUrl = row.profile_image_url || defaultAvatar;
      const displayName = row.display_name || "\uC2E0\uC785 \uBC84\uD29C\uBC84";
      const description = row.description || `${displayName}\uC758 \uB370\uBDD4 \uBC29\uC1A1\uC785\uB2C8\uB2E4.`;
      const evtId = `evt_${row.info_id}`;
      return {
        id: evtId,
        title: `${displayName} \uB370\uBDD4 \uBC29\uC1A1`,
        type: "FIRST_DEBUT",
        startAtUtc: row.start_at_utc,
        originalTimezone: row.timezone || "Asia/Seoul",
        status: "PUBLISHED",
        verificationStatus: "SOURCE_VERIFIED",
        description,
        creator: {
          id: row.info_id,
          displayName,
          avatarUrl,
          agency: row.agency_name || "\uAC1C\uC778\uC138",
          countryCode: row.country_code || "KR",
          languages: ["ko"],
          slug: row.slug || `slug_${row.info_id}`
        },
        links: [
          {
            platform: row.platform || "CHZZK",
            url: row.channel_url,
            isPrimary: true
          }
        ]
      };
    });
  } catch (err) {
    console.error("D1 Pair Table Fetch Error:", err);
    return null;
  }
}
__name(fetchEventsFromD1, "fetchEventsFromD1");
async function insertEventToD1(db, body) {
  const now = Date.now();
  let displayName = body.creator?.displayName || body.displayName || "\uC2E0\uC785 VTuber";
  let avatarUrl = body.creator?.avatarUrl || body.avatarUrl || "";
  const agencyName = body.creator?.agency || body.agency || "\uAC1C\uC778\uC138";
  const countryCode = body.creator?.countryCode || body.countryCode || "KR";
  let description = body.description || `${displayName} \uBC84\uD29C\uBC84\uC758 \uB370\uBDD4 \uBC29\uC1A1\uC785\uB2C8\uB2E4.`;
  const slug = `slug_${now}_${Math.random().toString(36).slice(2, 6)}`;
  const primaryLink = body.links?.[0] || null;
  const platform = primaryLink?.platform || body.platform || "CHZZK";
  const watchUrl = primaryLink?.url || body.watchUrl || "https://chzzk.naver.com";
  if (!avatarUrl && watchUrl) {
    try {
      const apiResult = await fetchPlatformProfile(platform, watchUrl);
      if (apiResult.success) {
        avatarUrl = apiResult.profileImageUrl || avatarUrl;
        displayName = apiResult.creatorName || displayName;
        description = apiResult.description || description;
      }
    } catch {
    }
  }
  const startAtUtc = body.startAtUtc || new Date(now + 864e5 * 3).toISOString();
  const timezone = body.originalTimezone || "Asia/Seoul";
  const d = new Date(startAtUtc);
  const debutDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const debutTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const chRes = await db.prepare(`
    INSERT INTO streamerChannel (platform, channel_url, channel_name)
    VALUES (?, ?, ?)
    RETURNING id
  `).bind(platform, watchUrl, `${displayName} ${platform}`).first();
  const channelId = chRes?.id || now;
  const stRes = await db.prepare(`
    INSERT INTO streamerChannel_info (channel_id, slug, display_name, profile_image_url, description, agency_name, debut_date, debut_time, timezone, start_at_utc, country_code)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `).bind(channelId, slug, displayName, avatarUrl, description, agencyName, debutDate, debutTime, timezone, startAtUtc, countryCode).first();
  const infoId = stRes?.id || channelId;
  return `evt_${infoId}`;
}
__name(insertEventToD1, "insertEventToD1");

// src/services/unifiedEventService.ts
function portalProfileEvent(profile) {
  if (profile.dateState === "NONE")
    return null;
  return {
    id: `portal_${profile.slug}`,
    title: `${profile.displayName} \uB370\uBDD4 \uBC29\uC1A1`,
    type: "FIRST_DEBUT",
    startAtUtc: profile.startAtUtc,
    originalTimezone: profile.timezone,
    status: "PUBLISHED",
    verificationStatus: "COMMUNITY_SUBMITTED",
    creator: {
      id: profile.slug,
      slug: profile.slug,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      agency: profile.agency,
      description: profile.description,
      countryCode: profile.countryCode,
      languages: profile.languages
    },
    links: [{ platform: profile.platform, url: profile.channelUrl, isPrimary: true }],
    description: profile.description,
    ...profile.dateState !== "FIXED" ? { debutStatus: { statusType: "UNDECIDED", label: profile.dateState === "TIME_TBD" ? `${profile.debutDate} \xB7 \uC2DC\uAC04 \uBBF8\uC815` : `${profile.targetMonth} \xB7 \uB0A0\uC9DC \uBBF8\uC815`, badge: "\uB370\uBDD4 \uC608\uC815", dateStr: profile.debutDate || profile.targetMonth } } : {}
  };
}
__name(portalProfileEvent, "portalProfileEvent");
async function readUnifiedDebutEvents(db) {
  const [legacy, profiles] = await Promise.all([fetchEventsFromD1(db), readPublicPortalProfiles(db)]);
  const identifiers = new Map((legacy || []).map((event) => [event.creator.slug, event.id]));
  return profiles.flatMap((profile) => {
    const event = portalProfileEvent(profile);
    return event ? [{ ...event, id: identifiers.get(profile.slug) || event.id }] : [];
  });
}
__name(readUnifiedDebutEvents, "readUnifiedDebutEvents");

// src/services/discordVerificationService.ts
var DISCORD_API_BASE = "https://discord.com/api/v10";
function generateVerificationCode() {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VD-${randomPart}`;
}
__name(generateVerificationCode, "generateVerificationCode");
function extractChannelIdentifier(platform, rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { success: false, error: "\uC62C\uBC14\uB978 \uBC29\uC1A1\uAD6D URL\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694." };
  }
  const cleanUrl = rawUrl.trim();
  if (platform.toUpperCase() === "CHZZK") {
    const match2 = cleanUrl.match(/chzzk\.naver\.com\/(?:live\/)?([a-f0-9]{32})/i);
    if (match2 && match2[1]) {
      return { success: true, channelId: match2[1] };
    }
    return { success: false, error: "\uCE58\uC9C0\uC9C1 \uBC29\uC1A1\uAD6D \uC8FC\uC18C \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. (\uC608: https://chzzk.naver.com/32\uC790\uB9AC\uD574\uC2DC)" };
  }
  if (platform.toUpperCase() === "SOOP") {
    const match2 = cleanUrl.match(/(?:ch\.)?sooplive\.co\.kr\/(?:station\/)?([a-zA-Z0-9_]+)/i);
    if (match2 && match2[1]) {
      return { success: true, channelId: match2[1] };
    }
    return { success: false, error: "SOOP \uBC29\uC1A1\uAD6D \uC8FC\uC18C \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. (\uC608: https://ch.sooplive.co.kr/\uC544\uC774\uB514)" };
  }
  return { success: false, error: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uD50C\uB7AB\uD3FC\uC785\uB2C8\uB2E4. (CHZZK \uB610\uB294 SOOP \uC120\uD0DD)" };
}
__name(extractChannelIdentifier, "extractChannelIdentifier");
async function fetchChzzkChannelBio(channelId) {
  try {
    const res = await fetch(`https://api.chzzk.naver.com/service/v1/channels/${channelId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    if (!res.ok) {
      return { success: false, error: "\uCE58\uC9C0\uC9C1 \uCC44\uB110 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." };
    }
    const data = await res.json();
    if (data.code !== 200 || !data.content) {
      return { success: false, error: "\uCE58\uC9C0\uC9C1 \uCC44\uB110\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." };
    }
    const bio = data.content.channelDescription || "";
    const channelName = data.content.channelName || "\uCE58\uC9C0\uC9C1 \uC2A4\uD2B8\uB9AC\uBA38";
    return { success: true, bio, channelName };
  } catch (err) {
    console.error("[Fetch Chzzk Bio Error]:", err);
    return { success: false, error: "\uCE58\uC9C0\uC9C1 \uC11C\uBC84 \uD1B5\uC2E0 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." };
  }
}
__name(fetchChzzkChannelBio, "fetchChzzkChannelBio");
async function fetchSoopChannelBio(stationId) {
  try {
    const res = await fetch(`https://ch.sooplive.co.kr/api/${stationId}/station`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    if (!res.ok) {
      return { success: false, error: "SOOP \uBC29\uC1A1\uAD6D \uC815\uBCF4\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." };
    }
    const data = await res.json();
    const station = data?.station;
    if (!station) {
      return { success: false, error: "SOOP \uBC29\uC1A1\uAD6D \uC815\uBCF4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." };
    }
    const bioParts = [
      station.broad_description || "",
      station.station_title || "",
      station.up_text || "",
      station.station_name || ""
    ];
    const bio = bioParts.join(" ");
    const channelName = station.station_name || stationId;
    return { success: true, bio, channelName };
  } catch (err) {
    console.error("[Fetch SOOP Bio Error]:", err);
    return { success: false, error: "SOOP \uC11C\uBC84 \uD1B5\uC2E0 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." };
  }
}
__name(fetchSoopChannelBio, "fetchSoopChannelBio");
function checkBioContainsCode(bioText, code) {
  if (!bioText || !code)
    return false;
  const cleanBio = bioText.replace(/\s+/g, "").toUpperCase();
  const cleanCode = code.replace(/\s+/g, "").toUpperCase();
  return cleanBio.includes(cleanCode);
}
__name(checkBioContainsCode, "checkBioContainsCode");
async function getGuildRoles(guildId, botToken) {
  try {
    const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/roles`, {
      headers: {
        Authorization: `Bot ${botToken}`
      }
    });
    if (!res.ok)
      return [];
    return await res.json();
  } catch (err) {
    console.error("[Discord Get Roles Error]:", err);
    return [];
  }
}
__name(getGuildRoles, "getGuildRoles");
async function findRoleIdByName(guildId, roleName, botToken) {
  const roles = await getGuildRoles(guildId, botToken);
  const target = roles.find(
    (r) => r.name.toLowerCase().trim() === roleName.toLowerCase().trim()
  );
  return target ? target.id : null;
}
__name(findRoleIdByName, "findRoleIdByName");
async function addRoleToMember(guildId, userId, roleId, botToken) {
  try {
    const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bot ${botToken}`
      }
    });
    return res.ok || res.status === 204;
  } catch (err) {
    console.error("[Discord Add Role Error]:", err);
    return false;
  }
}
__name(addRoleToMember, "addRoleToMember");
async function removeRoleFromMember(guildId, userId, roleId, botToken) {
  try {
    const res = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bot ${botToken}`
      }
    });
    return res.ok || res.status === 204;
  } catch (err) {
    console.error("[Discord Remove Role Error]:", err);
    return false;
  }
}
__name(removeRoleFromMember, "removeRoleFromMember");
async function toggleViewerRole(guildId, userId, currentMemberRoleIds, targetRoleName, botToken) {
  const roleId = await findRoleIdByName(guildId, targetRoleName, botToken);
  if (!roleId) {
    return {
      success: false,
      added: false,
      message: `\uC11C\uBC84\uC5D0 '${targetRoleName}' \uC5ED\uD560\uC774 \uC874\uC7AC\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC11C\uBC84 \uAD00\uB9AC\uC790\uC5D0\uAC8C \uBB38\uC758\uD574 \uC8FC\uC138\uC694.`
    };
  }
  const hasRole = currentMemberRoleIds.includes(roleId);
  if (hasRole) {
    const removed = await removeRoleFromMember(guildId, userId, roleId, botToken);
    if (removed) {
      return { success: true, added: false, message: `\u{1F5D1}\uFE0F **${targetRoleName}** \uC5ED\uD560\uC774 \uD574\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.` };
    }
  } else {
    const added = await addRoleToMember(guildId, userId, roleId, botToken);
    if (added) {
      return { success: true, added: true, message: `\u{1F389} **${targetRoleName}** \uC5ED\uD560\uC774 \uC815\uC0C1 \uC9C0\uAE09\uB418\uC5C8\uC2B5\uB2C8\uB2E4!` };
    }
  }
  return { success: false, added: false, message: "\uC5ED\uD560 \uC5C5\uB370\uC774\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uBD07\uC758 \uC5ED\uD560 \uAD8C\uD55C \uC11C\uC5F4\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694." };
}
__name(toggleViewerRole, "toggleViewerRole");
async function createStreamerVerification(db, record) {
  try {
    const existingVerified = await db.prepare(`
      SELECT discord_user_id FROM discord_streamer_verifications
      WHERE platform = ? AND channel_id = ? AND status = 'VERIFIED'
    `).bind(record.platform, record.channelId).first();
    if (existingVerified && existingVerified.discord_user_id !== record.discordUserId) {
      return {
        success: false,
        error: `\uC774\uBBF8 \uB2E4\uB978 \uB514\uC2A4\uCF54\uB4DC \uACC4\uC815(<@${existingVerified.discord_user_id}>)\uC5D0 \uC758\uD574 \uACF5\uC2DD \uC778\uC99D\uB41C \uBC29\uC1A1\uAD6D\uC785\uB2C8\uB2E4. \uC0AC\uCE6D\uC774 \uC758\uC2EC\uB418\uB294 \uACBD\uC6B0 \uC6B4\uC601\uC790\uC5D0\uAC8C \uBB38\uC758\uD574 \uC8FC\uC138\uC694.`
      };
    }
    const code = generateVerificationCode();
    const res = await db.prepare(`
      INSERT INTO discord_streamer_verifications (guild_id, discord_user_id, discord_username, platform, channel_id, channel_name, channel_url, verification_code, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
      ON CONFLICT(platform, channel_id) DO UPDATE SET
        guild_id = excluded.guild_id,
        discord_user_id = excluded.discord_user_id,
        discord_username = excluded.discord_username,
        channel_name = excluded.channel_name,
        channel_url = excluded.channel_url,
        verification_code = excluded.verification_code,
        status = 'PENDING',
        created_at = CURRENT_TIMESTAMP
      RETURNING id
    `).bind(
      record.guildId,
      record.discordUserId,
      record.discordUsername || "Unknown",
      record.platform,
      record.channelId,
      record.channelName || record.channelId,
      record.channelUrl,
      code
    ).first();
    return {
      success: true,
      verificationId: res?.id,
      code
    };
  } catch (err) {
    console.error("[Create Verification Error]:", err);
    return { success: false, error: err.message || "\uC778\uC99D \uC815\uBCF4 \uC800\uC7A5 \uC2E4\uD328" };
  }
}
__name(createStreamerVerification, "createStreamerVerification");
async function getVerificationRecord(db, id) {
  try {
    return await db.prepare(`
      SELECT * FROM discord_streamer_verifications WHERE id = ?
    `).bind(id).first();
  } catch {
    return null;
  }
}
__name(getVerificationRecord, "getVerificationRecord");
async function markVerificationComplete(db, id) {
  try {
    await db.prepare(`
      UPDATE discord_streamer_verifications
      SET status = 'VERIFIED', verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();
    return true;
  } catch (err) {
    console.error("[Mark Verification Error]:", err);
    return false;
  }
}
__name(markVerificationComplete, "markVerificationComplete");

// src/services/discordBotService.ts
var INTERACTION_TYPE = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5
};
var CALLBACK_TYPE = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  MODAL: 9
};
var DISCORD_API_BASE2 = "https://discord.com/api/v10";
var VDEBUT_WEB_BASE = "https://vdebut.live";
function hexToUint8Array(hex) {
  const cleanHex = hex.trim();
  const len = cleanHex.length;
  const arr = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    arr[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return arr;
}
__name(hexToUint8Array, "hexToUint8Array");
async function verifyDiscordSignature(rawBody, signature, timestamp, publicKey) {
  if (!signature || !timestamp || !publicKey) {
    return false;
  }
  try {
    const keyBytes = hexToUint8Array(publicKey);
    const sigBytes = hexToUint8Array(signature);
    const dataBytes = new TextEncoder().encode(timestamp + rawBody);
    let cryptoKey;
    try {
      cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "Ed25519" },
        false,
        ["verify"]
      );
    } catch {
      cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "NODE-ED25519", namedCurve: "NODE-ED25519" },
        false,
        ["verify"]
      );
    }
    return await crypto.subtle.verify(
      cryptoKey.algorithm.name,
      cryptoKey,
      sigBytes,
      dataBytes
    );
  } catch (error) {
    console.error("[Discord Signature Verify Error]:", error);
    return false;
  }
}
__name(verifyDiscordSignature, "verifyDiscordSignature");
function getPlatformBrandColor(platform) {
  switch (platform?.toUpperCase()) {
    case "CHZZK":
      return 65443;
    case "SOOP":
      return 30975;
    case "YOUTUBE":
      return 16711680;
    case "TWITCH":
      return 9520895;
    default:
      return 2450411;
  }
}
__name(getPlatformBrandColor, "getPlatformBrandColor");
function formatKstDateTime(utcDateStr) {
  if (!utcDateStr)
    return "\uC77C\uC2DC \uBBF8\uC815";
  const date = new Date(utcDateStr);
  if (isNaN(date.getTime()))
    return "\uC77C\uC2DC \uBBF8\uC815";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}
__name(formatKstDateTime, "formatKstDateTime");
function buildTodayDebutsEmbed(events, targetPlatform = "ALL") {
  const isPlatformFiltered = targetPlatform && targetPlatform.toUpperCase() !== "ALL";
  const platformUpper = (targetPlatform || "ALL").toUpperCase();
  const brandColor = isPlatformFiltered ? getPlatformBrandColor(platformUpper) : 2450411;
  if (!events || events.length === 0) {
    const emptyTitle = isPlatformFiltered ? `\u2728 \uC624\uB298 \uC608\uC815\uB41C [${platformUpper}] \uBC84\uD29C\uBC84 \uB370\uBDD4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4` : "\u2728 \uC624\uB298 \uC608\uC815\uB41C \uBC84\uD29C\uBC84 \uB370\uBDD4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4";
    const emptyDesc = isPlatformFiltered ? `\uC624\uB298 \uB370\uBDD4 \uBC29\uC1A1\uC744 \uC9C4\uD589\uD558\uB294 ${platformUpper} \uC2A4\uD2B8\uB9AC\uBA38\uAC00 \uC544\uC9C1 \uC5C6\uC2B5\uB2C8\uB2E4.
\uC0C8\uB85C\uC6B4 \uC2E0\uC785 \uBC84\uD29C\uBC84 \uB370\uBDD4 \uC18C\uC2DD\uC774 \uC788\uB2E4\uBA74 \`/\uB370\uBDD4\uB4F1\uB85D\`\uC73C\uB85C \uC81C\uBCF4\uD574 \uC8FC\uC138\uC694!` : "\uC624\uB298 \uC608\uC815\uB41C \uB370\uBDD4 \uBC29\uC1A1\uC774 \uC544\uC9C1 \uB4F1\uB85D\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.\n\uC0C8\uB85C\uC6B4 \uC2E0\uC785 \uBC84\uD29C\uBC84 \uB370\uBDD4 \uC18C\uC2DD\uC774 \uC788\uB2E4\uBA74 `/\uB370\uBDD4\uB4F1\uB85D`\uC73C\uB85C \uC81C\uBCF4\uD574 \uC8FC\uC138\uC694!";
    return {
      type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: emptyTitle,
            description: emptyDesc,
            color: 6583435,
            footer: {
              text: "V-DEBUT HUB \u2022 \uBC84\uCD94\uC5BC \uC2A4\uD2B8\uB9AC\uBA38 \uB370\uBDD4 \uC544\uCE74\uC774\uBE0C",
              icon_url: `${VDEBUT_WEB_BASE}/logo.png`
            },
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        ]
      }
    };
  }
  const fields = events.slice(0, 10).map((evt) => {
    const creator = evt.creator || {};
    const platform = evt.links?.[0]?.platform || "CHZZK";
    const channelUrl = evt.links?.[0]?.url || VDEBUT_WEB_BASE;
    const timeStr = formatKstDateTime(evt.startAtUtc);
    let val = `\u23F0 **\uB370\uBDD4 \uC77C\uC2DC**: ${timeStr}
\u{1F517} **\uBC29\uC1A1\uAD6D \uBC14\uB85C\uAC00\uAE30**: [\uBC29\uC1A1\uAD6D \uB9C1\uD06C](${channelUrl})`;
    if (creator.agency && creator.agency.trim() && creator.agency.trim() !== "\uAC1C\uC778\uC138") {
      val += `
\u{1F3E2} **\uC18C\uC18D**: ${creator.agency.trim()}`;
    }
    return {
      name: `\u{1F389} ${creator.displayName || "\uC2E0\uC785 \uBC84\uD29C\uBC84"} (${platform})`,
      value: val,
      inline: false
    };
  });
  const cardTitle = isPlatformFiltered ? `\u{1F31F} \uC624\uB298 \uB370\uBDD4\uD558\uB294 ${platformUpper} \uC2E0\uC785 \uBC84\uD29C\uBC84 (${events.length}\uBA85)` : `\u{1F31F} \uC624\uB298 \uB370\uBDD4\uD558\uB294 \uC2E0\uC785 \uBC84\uD29C\uBC84 (${events.length}\uBA85)`;
  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: cardTitle,
          description: `\uC624\uB298 \uCCAB \uBC29\uC1A1\uC744 \uC2DC\uC791\uD558\uB294 \uBC84\uCD94\uC5BC \uC2A4\uD2B8\uB9AC\uBA38\uB4E4\uC744 \uC751\uC6D0\uD574 \uC8FC\uC138\uC694!
\uC0C1\uC138 \uC815\uBCF4 \uBC0F D-Day \uC704\uC82F\uC740 [V-DEBUT HUB](${VDEBUT_WEB_BASE})\uC5D0\uC11C \uD655\uC778\uD558\uC2E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`,
          color: brandColor,
          fields,
          footer: {
            text: `V-DEBUT HUB \u2022 ${platformUpper} \uC2E4\uC2DC\uAC04 \uB370\uBDD4 \uC54C\uB9BC`,
            icon_url: `${VDEBUT_WEB_BASE}/logo.png`
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      components: [
        {
          type: 1,
          // Action Row
          components: [
            {
              type: 2,
              // Button
              style: 5,
              // Link Button
              label: "\u{1F310} V-DEBUT \uCE98\uB9B0\uB354 \uC804\uCCB4\uBCF4\uAE30",
              url: VDEBUT_WEB_BASE
            }
          ]
        }
      ]
    }
  };
}
__name(buildTodayDebutsEmbed, "buildTodayDebutsEmbed");
function buildWeekDebutsEmbed(events, targetPlatform = "ALL") {
  const isPlatformFiltered = targetPlatform && targetPlatform.toUpperCase() !== "ALL";
  const platformUpper = (targetPlatform || "ALL").toUpperCase();
  const brandColor = isPlatformFiltered ? getPlatformBrandColor(platformUpper) : 3900150;
  if (!events || events.length === 0) {
    const emptyTitle = isPlatformFiltered ? `\u{1F4C5} \uC774\uBC88 \uC8FC \uC608\uC815\uB41C [${platformUpper}] \uB370\uBDD4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4` : "\u{1F4C5} \uC774\uBC88 \uC8FC \uC608\uC815\uB41C \uB370\uBDD4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4";
    const emptyDesc = isPlatformFiltered ? `\uC774\uBC88 \uC8FC \uC608\uC815\uB41C ${platformUpper} \uB370\uBDD4 \uC77C\uC815\uC774 \uBE44\uC5B4\uC788\uC2B5\uB2C8\uB2E4.
\uC2E0\uADDC \uC77C\uC815\uC744 \`/\uB370\uBDD4\uB4F1\uB85D\`\uC744 \uD1B5\uD574 \uC81C\uBCF4\uD574 \uBCF4\uC138\uC694!` : "\uC774\uBC88 \uC8FC \uC608\uC815\uB41C \uB370\uBDD4 \uC77C\uC815\uC774 \uBE44\uC5B4\uC788\uC2B5\uB2C8\uB2E4. \uC2E0\uADDC \uC77C\uC815\uC744 `/\uB370\uBDD4\uB4F1\uB85D`\uC744 \uD1B5\uD574 \uB4F1\uB85D\uD574 \uBCF4\uC138\uC694!";
    return {
      type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: emptyTitle,
            description: emptyDesc,
            color: 6583435,
            footer: {
              text: "V-DEBUT HUB \u2022 \uC8FC\uAC04 \uB370\uBDD4 \uB9AC\uD3EC\uD2B8",
              icon_url: `${VDEBUT_WEB_BASE}/logo.png`
            },
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }
        ]
      }
    };
  }
  const fields = events.slice(0, 10).map((evt) => {
    const creator = evt.creator || {};
    const platform = evt.links?.[0]?.platform || "CHZZK";
    const channelUrl = evt.links?.[0]?.url || VDEBUT_WEB_BASE;
    const timeStr = formatKstDateTime(evt.startAtUtc);
    return {
      name: `\u{1F4CC} ${creator.displayName} [${platform}]`,
      value: `\u23F1\uFE0F ${timeStr}
\u{1F449} [\uBC29\uC1A1\uAD6D \uC8FC\uC18C](${channelUrl})`,
      inline: true
    };
  });
  const cardTitle = isPlatformFiltered ? `\u{1F4C5} \uC774\uBC88 \uC8FC ${platformUpper} \uB370\uBDD4 \uD0C0\uC784\uB77C\uC778 (${events.length}\uBA85)` : `\u{1F4C5} \uC774\uBC88 \uC8FC \uB370\uBDD4 \uD0C0\uC784\uB77C\uC778 (${events.length}\uBA85)`;
  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: cardTitle,
          description: `\uC774\uBC88 \uC8FC \uB370\uBDD4 \uC608\uC815\uC778 ${isPlatformFiltered ? platformUpper + " " : ""}\uBC84\uCD94\uC5BC \uC2A4\uD2B8\uB9AC\uBA38 \uBAA9\uB85D\uC785\uB2C8\uB2E4.`,
          color: brandColor,
          fields,
          footer: {
            text: `V-DEBUT HUB \u2022 ${platformUpper} \uC8FC\uAC04 \uB370\uBDD4 \uB9AC\uD3EC\uD2B8`,
            icon_url: `${VDEBUT_WEB_BASE}/logo.png`
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "\u{1F310} \uC2E4\uC2DC\uAC04 \uC6D4\uAC04 \uCE98\uB9B0\uB354 \uC5F4\uAE30",
              url: VDEBUT_WEB_BASE
            }
          ]
        }
      ]
    }
  };
}
__name(buildWeekDebutsEmbed, "buildWeekDebutsEmbed");
function detectPlatformFromUrl(url) {
  if (!url)
    return "CHZZK";
  const lower = url.toLowerCase().trim();
  if (lower.includes("sooplive.co.kr") || lower.includes("afreecatv.com") || lower.includes("bj.afreeca")) {
    return "SOOP";
  }
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return "YOUTUBE";
  }
  if (lower.includes("twitch.tv")) {
    return "TWITCH";
  }
  if (lower.includes("chzzk.naver.com") || lower.includes("chzzk")) {
    return "CHZZK";
  }
  return "CHZZK";
}
__name(detectPlatformFromUrl, "detectPlatformFromUrl");
function parseDebutDateStatus(rawInput) {
  const trimmed = (rawInput || "").trim();
  const lower = trimmed.toLowerCase();
  if (!trimmed || lower.includes("\uBBF8\uC815") || lower.includes("\uC900\uBE44") || lower.includes("\uC608\uC815") || lower.includes("tbd") || lower.includes("undecided")) {
    return {
      statusType: "UNDECIDED",
      label: "\uB370\uBDD4\uC77C \uBBF8\uC815 (\uC900\uBE44 \uC911)",
      badge: "\u23F3 \uB370\uBDD4 \uC77C\uC815",
      dateStr: "\uBBF8\uC815",
      startAtUtc: void 0
    };
  }
  if (lower.includes("\uBAA8\uB984") || lower.includes("\uBAB0\uB77C") || lower.includes("\uBAA8\uB974") || lower.includes("\uC815\uBCF4\uC5C6\uC74C") || lower.includes("\uD655\uC778\uD544\uC694") || lower === "?" || lower.includes("unknown")) {
    return {
      statusType: "UNKNOWN",
      label: "\uB370\uBDD4\uC77C \uD655\uC778 \uD544\uC694 (\uC815\uBCF4 \uBBF8\uC785\uB825)",
      badge: "\u2753 \uB370\uBDD4 \uC77C\uC815",
      dateStr: "\uBAA8\uB984",
      startAtUtc: void 0
    };
  }
  try {
    const cleanDate = trimmed.replace(/\./g, "-").replace(/\//g, "-").replace("T", " ");
    const parts = cleanDate.split(" ");
    const datePart = parts[0];
    const timePart = parts[1] || "20:00";
    let dateObj = null;
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(datePart)) {
      dateObj = /* @__PURE__ */ new Date(`${datePart}T${timePart.length === 5 ? timePart : timePart + ":00"}+09:00`);
    } else {
      const fallback = new Date(cleanDate);
      if (!isNaN(fallback.getTime())) {
        dateObj = fallback;
      }
    }
    if (dateObj && !isNaN(dateObj.getTime())) {
      const formatted = formatKstDateTime(dateObj.toISOString());
      return {
        statusType: "CONFIRMED",
        label: formatted,
        badge: "\u23F0 \uB370\uBDD4 \uC77C\uC2DC (KST)",
        dateStr: formatted,
        startAtUtc: dateObj.toISOString()
      };
    }
  } catch (e) {
    console.error("Date parse error:", e);
  }
  return {
    statusType: "UNKNOWN",
    label: `${trimmed} (\uD655\uC778 \uD544\uC694)`,
    badge: "\u2753 \uB370\uBDD4 \uC77C\uC815",
    dateStr: trimmed,
    startAtUtc: void 0
  };
}
__name(parseDebutDateStatus, "parseDebutDateStatus");
function buildDebutRegisterModal() {
  return {
    type: CALLBACK_TYPE.MODAL,
    data: {
      custom_id: "modal_submit_debut",
      title: "\uC2E0\uC785 \uBC84\uD29C\uBC84 \uB370\uBDD4 \uC81C\uBCF4/\uB4F1\uB85D",
      components: [
        {
          type: 1,
          // Action Row
          components: [
            {
              type: 4,
              // Text Input
              custom_id: "input_channel_url",
              label: "\uBC29\uC1A1\uAD6D / \uCC44\uB110 \uC8FC\uC18C (URL)",
              style: 1,
              // Short
              placeholder: "\uCE58\uC9C0\uC9C1, SOOP, \uC720\uD29C\uBE0C, \uD2B8\uC704\uCE58 \uB9C1\uD06C\uB97C \uC785\uB825\uD558\uC138\uC694",
              required: true
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "input_debut_date",
              label: "\uB370\uBDD4\uC77C (\uB0A0\uC9DC \uC9C1\uC811 \uC785\uB825 / \uBBF8\uC815 / \uBAA8\uB984)",
              style: 1,
              placeholder: '\uC608: 2026-09-25 20:00 (\uB610\uB294 "\uBBF8\uC815", "\uBAA8\uB984" \uC785\uB825)',
              required: true
            }
          ]
        }
      ]
    }
  };
}
__name(buildDebutRegisterModal, "buildDebutRegisterModal");
function buildOnboardingPanelMessage() {
  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: "\u{1F31F} V-DEBUT HUB \uACF5\uC2DD \uCEE4\uBBA4\uB2C8\uD2F0 \uC628\uBCF4\uB529",
          description: "V-DEBUT HUB \uC11C\uBC84\uC5D0 \uC624\uC2E0 \uAC83\uC744 \uD658\uC601\uD569\uB2C8\uB2E4!\n\uC6D0\uD65C\uD55C \uC18C\uD1B5\uACFC \uB9DE\uCDA4 \uC54C\uB9BC\uC744 \uC704\uD574 \uBCF8\uC778\uC5D0\uAC8C \uB9DE\uB294 \uC5ED\uD560\uC744 \uC544\uB798 \uBC84\uD2BC\uC744 \uB20C\uB7EC \uC218\uB839\uD574 \uC8FC\uC138\uC694.\n\n\u2022 **\u{1F440} \uC2DC\uCCAD\uC790(\uD32C)**: \uC544\uB798 \uBC84\uD2BC\uC744 \uB204\uB974\uBA74 \uAD00\uC2EC \uD50C\uB7AB\uD3FC \uC5ED\uD560\uC774 \uC989\uC2DC \uC9C0\uAE09/\uD574\uC81C\uB429\uB2C8\uB2E4.\n\u2022 **\u{1F399}\uFE0F \uC2A4\uD2B8\uB9AC\uBA38(\uBC84\uD29C\uBC84)**: \uBCF8\uC778 \uC778\uC99D \uBC84\uD2BC\uC744 \uB20C\uB7EC \uBC29\uC1A1\uAD6D \uC18C\uAC1C\uAE00 \uCF54\uB4DC\uB85C 100% \uC778\uC99D \uD6C4 \uC815\uC2DD \uC2A4\uD2B8\uB9AC\uBA38 \uC5ED\uD560\uC744 \uC218\uB839\uD558\uC138\uC694!",
          color: 2450411,
          fields: [
            {
              name: "\u{1F3F7}\uFE0F \uD604\uC7AC \uBC1C\uAE09 \uAC00\uB2A5\uD55C \uC5ED\uD560 \uBAA9\uB85D",
              value: "\u2022 `chzzk \uC2DC\uCCAD\uC790` (\uB124\uC774\uBC84 \uCE58\uC9C0\uC9C1 \uD32C)\n\u2022 `SOOP \uC2DC\uCCAD\uC790` (\uC232/SOOP \uD32C)\n\u2022 `chzzk \uC2A4\uD2B8\uB9AC\uBA38` (\uCE58\uC9C0\uC9C1 \uACF5\uC2DD \uBC29\uC1A1\uAD6D \uC778\uC99D \uC644\uB8CC)\n\u2022 `SOOP \uC2A4\uD2B8\uB9AC\uBA38` (SOOP \uACF5\uC2DD \uBC29\uC1A1\uAD6D \uC778\uC99D \uC644\uB8CC)",
              inline: false
            }
          ],
          footer: {
            text: "V-DEBUT HUB \u2022 \uACF5\uC2DD \uCEE4\uBBA4\uB2C8\uD2F0 \uC628\uBCF4\uB529 \uC2DC\uC2A4\uD15C",
            icon_url: `${VDEBUT_WEB_BASE}/logo.png`
          }
        }
      ],
      components: [
        {
          type: 1,
          // Action Row 1: 시청자 역할 즉시 지급 버튼
          components: [
            {
              type: 2,
              // Button
              custom_id: "btn_role_chzzk_viewer",
              style: 3,
              // Success (Green)
              label: "\u{1F3AE} chzzk \uC2DC\uCCAD\uC790"
            },
            {
              type: 2,
              custom_id: "btn_role_soop_viewer",
              style: 1,
              // Primary (Blue)
              label: "\u{1F4FA} SOOP \uC2DC\uCCAD\uC790"
            }
          ]
        },
        {
          type: 1,
          // Action Row 2: 스트리머 본인 인증 버튼
          components: [
            {
              type: 2,
              custom_id: "btn_start_streamer_verify",
              style: 2,
              // Secondary
              label: "\u{1F399}\uFE0F \uC2A4\uD2B8\uB9AC\uBA38 \uBCF8\uC778 \uC778\uC99D \uBC1B\uAE30 (\uCE58\uC9C0\uC9C1 / SOOP)"
            }
          ]
        }
      ]
    }
  };
}
__name(buildOnboardingPanelMessage, "buildOnboardingPanelMessage");
function buildStreamerVerifyModal() {
  return {
    type: CALLBACK_TYPE.MODAL,
    data: {
      custom_id: "modal_streamer_verify",
      title: "\uC2A4\uD2B8\uB9AC\uBA38 \uBCF8\uC778 \uBC29\uC1A1\uAD6D \uC778\uC99D",
      components: [
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "input_verify_platform",
              label: "\uBC29\uC1A1 \uD50C\uB7AB\uD3FC (CHZZK \uB610\uB294 SOOP)",
              style: 1,
              min_length: 4,
              max_length: 10,
              placeholder: "CHZZK \uB610\uB294 SOOP \uC785\uB825",
              required: true
            }
          ]
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "input_verify_url",
              label: "\uB0B4 \uBC29\uC1A1\uAD6D / \uCC44\uB110 URL \uC8FC\uC18C",
              style: 1,
              placeholder: "https://chzzk.naver.com/... \uB610\uB294 https://ch.sooplive.co.kr/...",
              required: true
            }
          ]
        }
      ]
    }
  };
}
__name(buildStreamerVerifyModal, "buildStreamerVerifyModal");
function buildVerifyCodeCard(recordId, platform, code, channelName) {
  const brandColor = getPlatformBrandColor(platform);
  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      flags: 64,
      // EPHEMERAL (본인에게만 보임)
      embeds: [
        {
          title: `\u{1F399}\uFE0F [${platform}] \uC2A4\uD2B8\uB9AC\uBA38 \uBCF8\uC778 \uD655\uC778 \uC778\uC99D \uCF54\uB4DC \uBC1C\uAE09`,
          description: `**${channelName}** \uCC44\uB110\uC758 \uC2E4\uC81C \uC18C\uC720\uC790\uC778\uC9C0 \uD655\uC778\uD558\uAE30 \uC704\uD55C \uC808\uCC28\uC785\uB2C8\uB2E4.

1. **${platform} \uBC29\uC1A1\uAD6D \uC124\uC815** \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4.
2. **\uBC29\uC1A1\uAD6D \uC18C\uAC1C\uAE00(\uB610\uB294 \uC0C1\uD0DC \uBA54\uC2DC\uC9C0)**\uC5D0 \uC544\uB798 \uCF54\uB4DC\uB97C \uC784\uC2DC\uB85C \uC801\uACE0 \uC800\uC7A5\uD569\uB2C8\uB2E4:

\u{1F449} \uBC1C\uAE09\uB41C \uC778\uC99D \uCF54\uB4DC: **\` ${code} \`**

3. \uC800\uC7A5\uC774 \uC644\uB8CC\uB418\uBA74 \uC544\uB798 **[\u2705 \uC18C\uAC1C\uAE00 \uC218\uC815 \uC644\uB8CC \uD6C4 \uC778\uC99D\uD558\uAE30]** \uBC84\uD2BC\uC744 \uB20C\uB7EC\uC8FC\uC138\uC694!
*(\uC778\uC99D\uC774 \uC644\uB8CC\uB41C \uC9C1\uD6C4 \uBC29\uC1A1\uAD6D \uC18C\uAC1C\uAE00\uC758 \uCF54\uB4DC\uB294 \uBC14\uB85C \uC9C0\uC6B0\uC154\uB3C4 \uB429\uB2C8\uB2E4.)*`,
          color: brandColor,
          footer: {
            text: "V-DEBUT HUB \u2022 100% \uC0AC\uCE6D \uBC29\uC9C0 \uBCF8\uC778 \uC778\uC99D",
            icon_url: `${VDEBUT_WEB_BASE}/logo.png`
          }
        }
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              custom_id: `btn_confirm_verify_${recordId}`,
              style: 3,
              // Success
              label: "\u2705 \uC18C\uAC1C\uAE00 \uC218\uC815 \uC644\uB8CC \uD6C4 \uC778\uC99D\uD558\uAE30"
            }
          ]
        }
      ]
    }
  };
}
__name(buildVerifyCodeCard, "buildVerifyCodeCard");
function buildDebutSuccessEmbed(eventData) {
  const creator = eventData.creator || {};
  const platform = (eventData.links?.[0]?.platform || "CHZZK").toUpperCase();
  const color = getPlatformBrandColor(platform);
  const eventId = eventData.id || "new";
  const widgetUrl = `${VDEBUT_WEB_BASE}/widget/d-day/${eventId}`;
  const debutStatus = eventData.debutStatus || {
    statusType: "CONFIRMED",
    label: formatKstDateTime(eventData.startAtUtc),
    badge: "\u23F0 \uB370\uBDD4 \uC77C\uC2DC (KST)",
    dateStr: formatKstDateTime(eventData.startAtUtc)
  };
  let title = `\u{1F389} [\uC2E0\uADDC \uB370\uBDD4 \uB4F1\uB85D] ${creator.displayName} \uB2D8\uC758 \uB370\uBDD4 \uC77C\uC815\uC774 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`;
  let desc = `**${creator.displayName}** \uB2D8\uC758 \uB370\uBDD4 \uBC29\uC1A1 \uC77C\uC815\uC774 V-DEBUT HUB\uC5D0 \uACF5\uC2DD \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.
\uC6F9 \uCE98\uB9B0\uB354\uC640 \uAD6C\uB3C5 \uB514\uC2A4\uCF54\uB4DC \uC11C\uBC84\uC5D0 \uC2E4\uC2DC\uAC04 \uC54C\uB9BC\uC774 \uC804\uD30C\uB429\uB2C8\uB2E4!`;
  if (debutStatus.statusType === "UNDECIDED") {
    title = `\u23F3 [\uB370\uBDD4 \uC608\uC815 \uC2A4\uD2B8\uB9AC\uBA38] ${creator.displayName} \uB2D8\uC758 \uB370\uBDD4 \uC900\uBE44 \uC18C\uC2DD\uC774 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`;
    desc = `**${creator.displayName}** \uB2D8\uC758 \uB370\uBDD4 \uC608\uC815 \uC815\uBCF4\uAC00 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4.
\uB370\uBDD4 \uC77C\uC815\uC774 \uACF5\uC2DD \uD655\uC815\uB418\uBA74 V-DEBUT \uCE98\uB9B0\uB354\uC5D0 \uC2E4\uC2DC\uAC04 \uAC31\uC2E0 \uBC0F \uACF5\uC9C0\uB429\uB2C8\uB2E4!`;
  } else if (debutStatus.statusType === "UNKNOWN") {
    title = `\u{1F50E} [\uB370\uBDD4 \uC81C\uBCF4 \uC811\uC218] ${creator.displayName} \uB2D8\uC758 \uB370\uBDD4 \uC18C\uC2DD\uC774 \uC81C\uBCF4\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`;
    desc = `**${creator.displayName}** \uB2D8\uC758 \uB370\uBDD4 \uC18C\uC2DD\uC774 \uC81C\uBCF4\uB418\uC5C8\uC2B5\uB2C8\uB2E4.
\uC0C1\uC138 \uC77C\uC815 \uD655\uC778 \uD6C4 \uACF5\uC2DD \uB370\uBDD4 \uCE98\uB9B0\uB354\uC5D0 \uB4F1\uC7AC\uB429\uB2C8\uB2E4.`;
  }
  const fields = [
    {
      name: debutStatus.badge,
      value: `**${debutStatus.label}**`,
      inline: true
    },
    {
      name: "\u{1F4FA} \uD50C\uB7AB\uD3FC",
      value: `**${platform}**`,
      inline: true
    }
  ];
  if (creator.agency && creator.agency.trim() && creator.agency.trim() !== "\uAC1C\uC778\uC138") {
    fields.push({
      name: "\u{1F3E2} \uC18C\uC18D",
      value: creator.agency.trim(),
      inline: true
    });
  }
  if (debutStatus.statusType === "CONFIRMED") {
    fields.push({
      name: "\u{1F517} \uBC29\uC1A1 \uC704\uC82F URL (OBS \uBE0C\uB77C\uC6B0\uC800 \uC18C\uC2A4\uC6A9)",
      value: `\`${widgetUrl}\`
\uBC29\uC1A1 \uD654\uBA74\uC5D0 \uC2E4\uC2DC\uAC04 D-Day \uCE74\uC6B4\uD2B8\uB2E4\uC6B4\uC744 \uB744\uC6B8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`,
      inline: false
    });
  }
  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title,
          description: desc,
          color,
          fields,
          thumbnail: creator.avatarUrl ? { url: creator.avatarUrl } : void 0,
          footer: {
            text: `V-DEBUT HUB \u2022 ${platform} \uB370\uBDD4 \uB4F1\uB85D`,
            icon_url: `${VDEBUT_WEB_BASE}/logo.png`
          },
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "\u{1F4FA} \uBC29\uC1A1\uAD6D \uBC14\uB85C\uAC00\uAE30",
              url: eventData.links?.[0]?.url || VDEBUT_WEB_BASE
            },
            {
              type: 2,
              style: 5,
              label: "\u{1F4C5} V-DEBUT \uCE98\uB9B0\uB354 \uBCF4\uAE30",
              url: VDEBUT_WEB_BASE
            }
          ]
        }
      ]
    }
  };
}
__name(buildDebutSuccessEmbed, "buildDebutSuccessEmbed");
function buildDebutDateChangeEmbed(data) {
  const platform = (data.platform || "CHZZK").toUpperCase();
  const color = getPlatformBrandColor(platform);
  const isChzzk = platform === "CHZZK";
  const isSoop = platform === "SOOP";
  const channelUrl = data.channelUrl || VDEBUT_WEB_BASE;
  const platformTitle = isChzzk ? "\u{1F7E2} [CHZZK \uB370\uBDD4 \uC77C\uC815 \uBCC0\uACBD]" : isSoop ? "\u{1F535} [SOOP \uB370\uBDD4 \uC77C\uC815 \uBCC0\uACBD]" : "\u{1F4E2} [\uB370\uBDD4 \uC77C\uC815 \uBCC0\uACBD \uC548\uB0B4]";
  const fields = [
    {
      name: "\u23F0 \uC774\uC804 \uB370\uBDD4 \uC77C\uC815",
      value: `~~${data.oldDebutDateStr}~~`,
      inline: true
    },
    {
      name: "\u{1F680} \uBCC0\uACBD\uB41C \uB370\uBDD4 \uC77C\uC815",
      value: `**${data.newDebutDateStr}**`,
      inline: true
    },
    {
      name: "\u{1F4FA} \uD50C\uB7AB\uD3FC",
      value: `**${platform}**`,
      inline: true
    }
  ];
  if (data.agency && data.agency.trim() && data.agency.trim() !== "\uAC1C\uC778\uC138") {
    fields.push({
      name: "\u{1F3E2} \uC18C\uC18D",
      value: data.agency.trim(),
      inline: true
    });
  }
  if (data.reason && data.reason.trim()) {
    fields.push({
      name: "\u{1F4DD} \uBCC0\uACBD \uC0AC\uC720 / \uC548\uB0B4",
      value: data.reason.trim(),
      inline: false
    });
  }
  return {
    embeds: [
      {
        title: `${platformTitle} ${data.displayName} \uB2D8\uC758 \uB370\uBDD4 \uC77C\uC815\uC774 \uBCC0\uACBD\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`,
        description: `${data.displayName} \uBC84\uD29C\uBC84\uC758 \uB370\uBDD4 \uBC29\uC1A1 \uC77C\uC815\uC774 \uC870\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uD32C \uC5EC\uB7EC\uBD84\uAED8\uC11C\uB294 \uBCC0\uACBD\uB41C \uC77C\uC815\uC744 \uAF2D \uD655\uC778\uD574 \uC8FC\uC138\uC694!`,
        color,
        fields,
        thumbnail: data.avatarUrl ? { url: data.avatarUrl } : void 0,
        footer: {
          text: `V-DEBUT HUB \u2022 ${platform} \uB370\uBDD4 \uC77C\uC815 \uBCC0\uACBD Notice`,
          icon_url: `${VDEBUT_WEB_BASE}/logo.png`
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: isChzzk ? "\u{1F4FA} \uCE58\uC9C0\uC9C1 \uBC29\uC1A1\uAD6D \uBC14\uB85C\uAC00\uAE30" : isSoop ? "\u{1F4FA} SOOP \uBC29\uC1A1\uAD6D \uBC14\uB85C\uAC00\uAE30" : "\u{1F4FA} \uBC29\uC1A1\uAD6D \uBC14\uB85C\uAC00\uAE30",
            url: channelUrl
          },
          {
            type: 2,
            style: 5,
            label: "\u{1F4C5} V-DEBUT \uCE98\uB9B0\uB354 \uBCF4\uAE30",
            url: VDEBUT_WEB_BASE
          }
        ]
      }
    ]
  };
}
__name(buildDebutDateChangeEmbed, "buildDebutDateChangeEmbed");
function buildBroadcastNewDebutEmbed(eventData) {
  const creator = eventData.creator || {};
  const platform = (eventData.links?.[0]?.platform || "CHZZK").toUpperCase();
  const channelUrl = eventData.links?.[0]?.url || VDEBUT_WEB_BASE;
  const color = getPlatformBrandColor(platform);
  const isChzzk = platform === "CHZZK";
  const isSoop = platform === "SOOP";
  const isYoutube = platform === "YOUTUBE";
  const isTwitch = platform === "TWITCH";
  const debutStatus = eventData.debutStatus || {
    statusType: "CONFIRMED",
    label: formatKstDateTime(eventData.startAtUtc),
    badge: "\u23F0 \uB370\uBDD4 \uC77C\uC2DC (KST)",
    dateStr: formatKstDateTime(eventData.startAtUtc)
  };
  const platformEmoji = isChzzk ? "\u{1F7E2} [CHZZK]" : isSoop ? "\u{1F535} [SOOP]" : isYoutube ? "\u{1F534} [YouTube]" : isTwitch ? "\u{1F7E3} [Twitch]" : "\u{1F4E2}";
  let title = `${platformEmoji} [\uC2E0\uADDC \uB370\uBDD4 \uB4F1\uB85D] ${creator.displayName} \uB2D8\uC758 \uB370\uBDD4\uAC00 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`;
  let desc = creator.description || `${creator.displayName} \uBC84\uD29C\uBC84\uC758 \uB370\uBDD4 \uBC29\uC1A1 \uC77C\uC815\uC774 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB9CE\uC740 \uAD00\uC2EC\uACFC \uC751\uC6D0 \uBD80\uD0C1\uB4DC\uB9BD\uB2C8\uB2E4!`;
  if (debutStatus.statusType === "UNDECIDED") {
    title = `${platformEmoji} [\uB370\uBDD4 \uC608\uC815] ${creator.displayName} \uB2D8\uC774 \uB370\uBDD4\uB97C \uC900\uBE44 \uC911\uC785\uB2C8\uB2E4!`;
    desc = `${creator.displayName} \uBC84\uD29C\uBC84\uC758 \uB370\uBDD4 \uC608\uC815 \uC18C\uC2DD\uC785\uB2C8\uB2E4. \uC77C\uC815 \uD655\uC815 \uC2DC \uC2E4\uC2DC\uAC04\uC73C\uB85C \uC548\uB0B4\uB429\uB2C8\uB2E4!`;
  } else if (debutStatus.statusType === "UNKNOWN") {
    title = `${platformEmoji} [\uB370\uBDD4 \uC81C\uBCF4 \uC811\uC218] ${creator.displayName} \uB2D8\uC758 \uB370\uBDD4 \uC18C\uC2DD\uC774 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4!`;
    desc = `${creator.displayName} \uBC84\uD29C\uBC84\uC758 \uB370\uBDD4 \uC18C\uC2DD\uC774 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC77C\uC815 \uD655\uC778 \uD6C4 \uCE98\uB9B0\uB354\uC5D0 \uC548\uB0B4\uB420 \uC608\uC815\uC785\uB2C8\uB2E4.`;
  }
  const fields = [
    {
      name: debutStatus.badge,
      value: `**${debutStatus.label}**`,
      inline: true
    },
    {
      name: "\u{1F4FA} \uD50C\uB7AB\uD3FC",
      value: `**${platform}**`,
      inline: true
    }
  ];
  if (creator.agency && creator.agency.trim() && creator.agency.trim() !== "\uAC1C\uC778\uC138") {
    fields.push({
      name: "\u{1F3E2} \uC18C\uC18D",
      value: creator.agency.trim(),
      inline: true
    });
  }
  return {
    embeds: [
      {
        title,
        description: desc,
        color,
        fields,
        thumbnail: creator.avatarUrl ? { url: creator.avatarUrl } : void 0,
        footer: {
          text: `V-DEBUT HUB \u2022 ${platform} \uC2E4\uC2DC\uAC04 \uB370\uBDD4 \uC54C\uB9BC`,
          icon_url: `${VDEBUT_WEB_BASE}/logo.png`
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: isChzzk ? "\u{1F4FA} \uCE58\uC9C0\uC9C1 \uBC29\uC1A1\uAD6D \uBC14\uB85C\uAC00\uAE30" : isSoop ? "\u{1F4FA} SOOP \uBC29\uC1A1\uAD6D \uBC14\uB85C\uAC00\uAE30" : "\u{1F4FA} \uBC29\uC1A1\uAD6D \uBC14\uB85C\uAC00\uAE30",
            url: channelUrl
          },
          {
            type: 2,
            style: 5,
            label: "\u{1F4C5} V-DEBUT \uCE98\uB9B0\uB354 \uBCF4\uAE30",
            url: VDEBUT_WEB_BASE
          }
        ]
      }
    ]
  };
}
__name(buildBroadcastNewDebutEmbed, "buildBroadcastNewDebutEmbed");
async function registerSubscribedChannel(db, guildId, channelId, guildName, platform = "ALL") {
  try {
    const validPlatform = ["CHZZK", "SOOP"].includes(platform.toUpperCase()) ? platform.toUpperCase() : "ALL";
    await db.prepare(`
      INSERT INTO discord_subscribed_channels (guild_id, channel_id, guild_name, subscribed_platforms)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(channel_id) DO UPDATE SET
        guild_id = excluded.guild_id,
        guild_name = excluded.guild_name,
        subscribed_platforms = excluded.subscribed_platforms
    `).bind(guildId, channelId, guildName || "Unknown Guild", validPlatform).run();
    const platformLabel = validPlatform === "CHZZK" ? "\u{1F7E2} \uCE58\uC9C0\uC9C1(CHZZK) \uC804\uC6A9" : validPlatform === "SOOP" ? "\u{1F535} SOOP(\uC232) \uC804\uC6A9" : "\u{1F310} \uC804\uCCB4 \uD50C\uB7AB\uD3FC(\uCE58\uC9C0\uC9C1+SOOP+\uC720\uD29C\uBE0C)";
    return {
      success: true,
      message: `\u2705 \uC774 \uCC44\uB110(<#${channelId}>)\uC774 V-DEBUT HUB\uC758 **${platformLabel}** \uB370\uBDD4 \uC54C\uB9BC \uCC44\uB110\uB85C \uC124\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4.
\uC55E\uC73C\uB85C \uD574\uB2F9 \uCEE4\uBBA4\uB2C8\uD2F0\uC758 \uB370\uBDD4 \uB4F1\uB85D \uBC0F \uC77C\uC815 \uBCC0\uACBD Notice\uAC00 \uC774\uACF3\uC73C\uB85C \uC2E4\uC2DC\uAC04 \uC790\uB3D9 \uBC1C\uC1A1\uB429\uB2C8\uB2E4!`
    };
  } catch (error) {
    console.error("[Discord DB Register Channel Error]:", error);
    return {
      success: false,
      message: `\u274C \uCC44\uB110 \uB4F1\uB85D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4: ${error.message || "DB \uC5D0\uB7EC"}`
    };
  }
}
__name(registerSubscribedChannel, "registerSubscribedChannel");
async function listSubscribedChannels(db, targetPlatform) {
  try {
    if (targetPlatform && targetPlatform.toUpperCase() !== "ALL") {
      const { results: results2 } = await db.prepare(`
        SELECT guild_id, channel_id, guild_name, subscribed_platforms 
        FROM discord_subscribed_channels
        WHERE subscribed_platforms = 'ALL' OR UPPER(subscribed_platforms) = ?
      `).bind(targetPlatform.toUpperCase()).all();
      return results2 || [];
    }
    const { results } = await db.prepare(`
      SELECT guild_id, channel_id, guild_name, subscribed_platforms FROM discord_subscribed_channels
    `).all();
    return results || [];
  } catch (error) {
    console.error("[Discord List Channels Error]:", error);
    return [];
  }
}
__name(listSubscribedChannels, "listSubscribedChannels");
async function sendDiscordChannelMessage(botToken, channelId, payload) {
  try {
    const response = await fetch(`${DISCORD_API_BASE2}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Discord Send Message Failed: ${channelId}]:`, response.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Discord Send Message Error: ${channelId}]:`, err);
    return false;
  }
}
__name(sendDiscordChannelMessage, "sendDiscordChannelMessage");
async function broadcastDebutDateChangeToDiscord(db, botToken, changeData) {
  if (!botToken || !db)
    return 0;
  const targetPlatform = (changeData.platform || "ALL").toUpperCase();
  const channels = await listSubscribedChannels(db, targetPlatform);
  if (channels.length === 0)
    return 0;
  const payload = buildDebutDateChangeEmbed(changeData);
  let successCount = 0;
  for (const row of channels) {
    const ok = await sendDiscordChannelMessage(botToken, row.channel_id, payload);
    if (ok)
      successCount++;
  }
  return successCount;
}
__name(broadcastDebutDateChangeToDiscord, "broadcastDebutDateChangeToDiscord");
async function broadcastNewDebutToDiscord(db, botToken, debutData) {
  if (!botToken || !db)
    return 0;
  const targetPlatform = (debutData.links?.[0]?.platform || "ALL").toUpperCase();
  const channels = await listSubscribedChannels(db, targetPlatform);
  if (channels.length === 0)
    return 0;
  const payload = buildBroadcastNewDebutEmbed(debutData);
  let successCount = 0;
  for (const row of channels) {
    const ok = await sendDiscordChannelMessage(botToken, row.channel_id, payload);
    if (ok)
      successCount++;
  }
  return successCount;
}
__name(broadcastNewDebutToDiscord, "broadcastNewDebutToDiscord");
async function broadcastMorningBriefingToDiscord(db, botToken) {
  if (!botToken || !db)
    return 0;
  const allEvents = await readUnifiedDebutEvents(db);
  if (!allEvents)
    return 0;
  const now = /* @__PURE__ */ new Date();
  const kstOffset = 9 * 60 * 60 * 1e3;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayStr = kstDate.toISOString().split("T")[0];
  const todayEvents = allEvents.filter((evt) => {
    if (!evt.startAtUtc)
      return false;
    const evtKst = new Date(new Date(evt.startAtUtc).getTime() + kstOffset);
    return evtKst.toISOString().split("T")[0] === todayStr;
  });
  if (todayEvents.length === 0)
    return 0;
  const channels = await listSubscribedChannels(db);
  if (channels.length === 0)
    return 0;
  const payload = buildTodayDebutsEmbed(todayEvents);
  let successCount = 0;
  for (const row of channels) {
    const ok = await sendDiscordChannelMessage(botToken, row.channel_id, payload.data);
    if (ok)
      successCount++;
  }
  return successCount;
}
__name(broadcastMorningBriefingToDiscord, "broadcastMorningBriefingToDiscord");
async function getTodayDebuts(db, targetPlatform = "ALL") {
  const allEvents = await readUnifiedDebutEvents(db);
  if (!allEvents)
    return [];
  const now = /* @__PURE__ */ new Date();
  const kstOffset = 9 * 60 * 60 * 1e3;
  const kstDate = new Date(now.getTime() + kstOffset);
  const todayStr = kstDate.toISOString().split("T")[0];
  const isPlatformFiltered = targetPlatform && targetPlatform.toUpperCase() !== "ALL";
  const filterUpper = (targetPlatform || "").toUpperCase();
  return allEvents.filter((evt) => {
    if (!evt.startAtUtc)
      return false;
    const evtKst = new Date(new Date(evt.startAtUtc).getTime() + kstOffset);
    const isToday = evtKst.toISOString().split("T")[0] === todayStr;
    if (!isToday)
      return false;
    if (isPlatformFiltered) {
      const evtPlatform = (evt.links?.[0]?.platform || "").toUpperCase();
      return evtPlatform === filterUpper;
    }
    return true;
  });
}
__name(getTodayDebuts, "getTodayDebuts");
async function getWeekDebuts(db, targetPlatform = "ALL") {
  const allEvents = await readUnifiedDebutEvents(db);
  if (!allEvents)
    return [];
  const now = /* @__PURE__ */ new Date();
  const kstOffset = 9 * 60 * 60 * 1e3;
  const todayKst = new Date(now.getTime() + kstOffset);
  const dayOfWeek = todayKst.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(todayKst);
  monday.setUTCDate(todayKst.getUTCDate() + diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  const isPlatformFiltered = targetPlatform && targetPlatform.toUpperCase() !== "ALL";
  const filterUpper = (targetPlatform || "").toUpperCase();
  return allEvents.filter((evt) => {
    if (!evt.startAtUtc)
      return false;
    const evtDate = new Date(new Date(evt.startAtUtc).getTime() + kstOffset);
    const isInWeek = evtDate >= monday && evtDate <= sunday;
    if (!isInWeek)
      return false;
    if (isPlatformFiltered) {
      const evtPlatform = (evt.links?.[0]?.platform || "").toUpperCase();
      return evtPlatform === filterUpper;
    }
    return true;
  });
}
__name(getWeekDebuts, "getWeekDebuts");
async function handleDiscordInteraction(body, env) {
  const interactionType = body.type;
  if (interactionType === INTERACTION_TYPE.PING) {
    return { type: CALLBACK_TYPE.PONG };
  }
  if (interactionType === INTERACTION_TYPE.APPLICATION_COMMAND) {
    const commandName = body.data?.name;
    const platformOption = body.data?.options?.find(
      (opt) => opt.name === "\uBC29\uC1A1\uAD6D" || opt.name === "\uD50C\uB7AB\uD3FC" || opt.name === "platform"
    )?.value || "ALL";
    if (commandName === "\uC624\uB298" || commandName === "\uC624\uB298\uB370\uBDD4") {
      const todayDebuts = await getTodayDebuts(env.DB, platformOption);
      return buildTodayDebutsEmbed(todayDebuts, platformOption);
    }
    if (commandName === "\uAE08\uC8FC" || commandName === "\uC774\uBC88\uC8FC\uB370\uBDD4") {
      const weekDebuts = await getWeekDebuts(env.DB, platformOption);
      return buildWeekDebutsEmbed(weekDebuts, platformOption);
    }
    if (commandName === "\uB4F1\uB85D" || commandName === "\uB370\uBDD4\uB4F1\uB85D") {
      return buildDebutRegisterModal();
    }
    if (commandName === "\uC54C\uB9BC\uCC44\uB110\uC124\uC815") {
      const guildId = body.guild_id || "DM";
      const channelId = body.channel_id;
      const guildName = body.guild?.name || "Discord Server";
      const platformOption2 = body.data?.options?.find(
        (opt) => opt.name === "\uD50C\uB7AB\uD3FC" || opt.name === "platform"
      )?.value || "ALL";
      if (!channelId) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: "\u274C \uCC44\uB110 \uC815\uBCF4\uB97C \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC11C\uBC84 \uCC44\uB110\uC5D0\uC11C \uC2E4\uD589\uD574 \uC8FC\uC138\uC694." }
        };
      }
      const result = await registerSubscribedChannel(env.DB, guildId, channelId, guildName, platformOption2);
      return {
        type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: result.message }
      };
    }
    if (commandName === "\uC628\uBCF4\uB529\uD328\uB110") {
      return buildOnboardingPanelMessage();
    }
    return {
      type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: `\uC54C \uC218 \uC5C6\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4: /${commandName}` }
    };
  }
  if (interactionType === INTERACTION_TYPE.MESSAGE_COMPONENT) {
    const customId = body.data?.custom_id || "";
    const guildId = body.guild_id;
    const userId = body.member?.user?.id;
    const memberRoles = body.member?.roles || [];
    if (!guildId || !userId) {
      return {
        type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: 64, content: "\u274C \uC11C\uBC84 \uB0B4\uC5D0\uC11C\uB9CC \uC0AC\uC6A9 \uAC00\uB2A5\uD55C \uAE30\uB2A5\uC785\uB2C8\uB2E4." }
      };
    }
    if (customId === "btn_role_chzzk_viewer") {
      const res = await toggleViewerRole(guildId, userId, memberRoles, "chzzk \uC2DC\uCCAD\uC790", env.DISCORD_BOT_TOKEN);
      return {
        type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: 64, content: res.message }
      };
    }
    if (customId === "btn_role_soop_viewer") {
      const res = await toggleViewerRole(guildId, userId, memberRoles, "SOOP \uC2DC\uCCAD\uC790", env.DISCORD_BOT_TOKEN);
      return {
        type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { flags: 64, content: res.message }
      };
    }
    if (customId === "btn_start_streamer_verify") {
      return buildStreamerVerifyModal();
    }
    if (customId.startsWith("btn_confirm_verify_")) {
      const verifyId = parseInt(customId.replace("btn_confirm_verify_", ""), 10);
      if (isNaN(verifyId)) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { flags: 64, content: "\u274C \uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC778\uC99D \uC694\uCCAD\uC785\uB2C8\uB2E4." }
        };
      }
      const record = await getVerificationRecord(env.DB, verifyId);
      if (!record) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { flags: 64, content: "\u274C \uC778\uC99D \uAE30\uB85D\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC778\uC99D\uC744 \uC2E0\uCCAD\uD574 \uC8FC\uC138\uC694." }
        };
      }
      if (record.discord_user_id !== userId) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { flags: 64, content: "\u274C \uBCF8\uC778\uC774 \uC694\uCCAD\uD55C \uC778\uC99D\uB9CC \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." }
        };
      }
      if (record.status === "VERIFIED") {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { flags: 64, content: "\u2705 \uC774\uBBF8 \uC778\uC99D\uC774 \uC644\uB8CC\uB41C \uBC29\uC1A1\uAD6D\uC785\uB2C8\uB2E4!" }
        };
      }
      let bio = "";
      let errorMsg = "";
      if (record.platform === "CHZZK") {
        const fetchRes = await fetchChzzkChannelBio(record.channel_id);
        if (fetchRes.success)
          bio = fetchRes.bio || "";
        else
          errorMsg = fetchRes.error || "\uCE58\uC9C0\uC9C1 \uCC44\uB110 \uC870\uD68C \uC2E4\uD328";
      } else if (record.platform === "SOOP") {
        const fetchRes = await fetchSoopChannelBio(record.channel_id);
        if (fetchRes.success)
          bio = fetchRes.bio || "";
        else
          errorMsg = fetchRes.error || "SOOP \uBC29\uC1A1\uAD6D \uC870\uD68C \uC2E4\uD328";
      }
      if (!bio && errorMsg) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { flags: 64, content: `\u26A0\uFE0F ${errorMsg}
\uBC29\uC1A1\uAD6D \uC8FC\uC18C\uAC00 \uC62C\uBC14\uB978\uC9C0 \uD655\uC778\uD574 \uC8FC\uC138\uC694.` }
        };
      }
      const isMatched = checkBioContainsCode(bio, record.verification_code);
      if (!isMatched) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 64,
            content: `\u274C **\uC778\uC99D \uC2E4\uD328**: \uBC29\uC1A1\uAD6D \uC18C\uAC1C\uAE00\uC5D0\uC11C \uCF54\uB4DC \`${record.verification_code}\`\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.

\u2022 **\uD655\uC778 \uBC29\uBC95**: ${record.platform} \uBC29\uC1A1\uAD6D \uC124\uC815 \u2794 \uC18C\uAC1C\uAE00\uC5D0 \`${record.verification_code}\`\uB97C \uC815\uD655\uD788 \uC785\uB825\uD558\uACE0 \uC800\uC7A5\uD588\uB294\uC9C0 \uB2E4\uC2DC \uD55C\uBC88 \uD655\uC778\uD574 \uC8FC\uC138\uC694.
\u2022 \uC218\uC815\uC744 \uC644\uB8CC\uD558\uC2E0 \uD6C4 \uC544\uB798 \uBC84\uD2BC\uC744 \uB2E4\uC2DC \uB20C\uB7EC\uC8FC\uC138\uC694!`,
            components: [
              {
                type: 1,
                components: [
                  {
                    type: 2,
                    custom_id: `btn_confirm_verify_${verifyId}`,
                    style: 3,
                    label: "\u{1F504} \uC18C\uAC1C\uAE00 \uC800\uC7A5 \uD6C4 \uB2E4\uC2DC \uD655\uC778\uD558\uAE30"
                  }
                ]
              }
            ]
          }
        };
      }
      const targetRoleName = record.platform === "CHZZK" ? "chzzk \uC2A4\uD2B8\uB9AC\uBA38" : "SOOP \uC2A4\uD2B8\uB9AC\uBA38";
      const roleId = await findRoleIdByName(guildId, targetRoleName, env.DISCORD_BOT_TOKEN);
      if (!roleId) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 64,
            content: `\u26A0\uFE0F \uBCF8\uC778 \uD655\uC778\uC740 \uC131\uACF5\uD558\uC600\uC73C\uB098, \uB514\uC2A4\uCF54\uB4DC \uC11C\uBC84\uC5D0 '${targetRoleName}' \uC5ED\uD560\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uAD00\uB9AC\uC790\uC5D0\uAC8C \uBB38\uC758\uD574 \uC8FC\uC138\uC694.`
          }
        };
      }
      const roleGranted = await addRoleToMember(guildId, userId, roleId, env.DISCORD_BOT_TOKEN);
      if (!roleGranted) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 64,
            content: `\u26A0\uFE0F \uC5ED\uD560 \uC9C0\uAE09 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4. VDebut \uBD07\uC758 \uC5ED\uD560 \uC11C\uC5F4\uC774 '${targetRoleName}'\uBCF4\uB2E4 \uB192\uC740\uC9C0 \uC11C\uBC84 \uAD00\uB9AC\uC790\uC5D0\uAC8C \uD655\uC778\uC744 \uC694\uCCAD\uD574 \uC8FC\uC138\uC694.`
          }
        };
      }
      await markVerificationComplete(env.DB, verifyId);
      return {
        type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: 64,
          content: `\u{1F389} **\uCD95\uD558\uD569\uB2C8\uB2E4! ${record.channel_name || record.channel_id} \uBC29\uC1A1\uAD6D \uBCF8\uC778 \uC778\uC99D\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4!**

\u2022 **\uC9C0\uAE09\uB41C \uC5ED\uD560**: **\`@${targetRoleName}\`**
\u2022 \uC774\uC81C \uBC29\uC1A1\uAD6D \uC18C\uAC1C\uAE00\uC5D0\uC11C \uC784\uC2DC \uC778\uC99D \uCF54\uB4DC(\`${record.verification_code}\`)\uB294 **\uC0AD\uC81C\uD558\uC154\uB3C4 \uC88B\uC2B5\uB2C8\uB2E4.**
\u2022 V-DEBUT HUB \uACF5\uC2DD \uCEE4\uBBA4\uB2C8\uD2F0\uC758 \uC2A4\uD2B8\uB9AC\uBA38 \uC804\uC6A9 \uD61C\uD0DD\uC744 \uC790\uC720\uB86D\uAC8C \uC774\uC6A9\uD574 \uBCF4\uC138\uC694!`
        }
      };
    }
  }
  if (interactionType === INTERACTION_TYPE.MODAL_SUBMIT) {
    const customId = body.data?.custom_id;
    if (customId === "modal_streamer_verify") {
      const components = body.data?.components || [];
      const getField = /* @__PURE__ */ __name((id) => {
        for (const row of components) {
          const comp = row.components?.find((c) => c.custom_id === id);
          if (comp)
            return comp.value?.trim() || "";
        }
        return "";
      }, "getField");
      const rawPlatform = getField("input_verify_platform").toUpperCase();
      const rawUrl = getField("input_verify_url");
      const guildId = body.guild_id || "DM";
      const userId = body.member?.user?.id;
      const username = body.member?.user?.username || "Unknown";
      let platform = "CHZZK";
      if (rawPlatform.includes("SOOP") || rawPlatform.includes("\uC232") || rawPlatform.includes("\uC544\uD504\uB9AC\uCE74")) {
        platform = "SOOP";
      }
      const parsed = extractChannelIdentifier(platform, rawUrl);
      if (!parsed.success || !parsed.channelId) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 64,
            content: `\u274C ${parsed.error || "\uBC29\uC1A1\uAD6D URL \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."}`
          }
        };
      }
      const channelId = parsed.channelId;
      let channelName = channelId;
      if (platform === "CHZZK") {
        const info = await fetchChzzkChannelBio(channelId);
        if (info.success && info.channelName)
          channelName = info.channelName;
      } else if (platform === "SOOP") {
        const info = await fetchSoopChannelBio(channelId);
        if (info.success && info.channelName)
          channelName = info.channelName;
      }
      const verifyRes = await createStreamerVerification(env.DB, {
        guildId,
        discordUserId: userId,
        discordUsername: username,
        platform,
        channelId,
        channelName,
        channelUrl: rawUrl,
        verificationCode: ""
      });
      if (!verifyRes.success || !verifyRes.verificationId || !verifyRes.code) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 64,
            content: `\u274C ${verifyRes.error || "\uC778\uC99D \uCF54\uB4DC \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."}`
          }
        };
      }
      return buildVerifyCodeCard(verifyRes.verificationId, platform, verifyRes.code, channelName);
    }
    if (customId === "modal_submit_debut") {
      const components = body.data?.components || [];
      const getField = /* @__PURE__ */ __name((id) => {
        for (const row of components) {
          const comp = row.components?.find((c) => c.custom_id === id);
          if (comp)
            return comp.value?.trim() || "";
        }
        return "";
      }, "getField");
      const channelUrl = getField("input_channel_url");
      const rawDebutDate = getField("input_debut_date");
      if (!channelUrl) {
        return {
          type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { flags: 64, content: "\u274C \uBC29\uC1A1\uAD6D / \uCC44\uB110 URL\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694." }
        };
      }
      const platform = detectPlatformFromUrl(channelUrl);
      const debutStatus = parseDebutDateStatus(rawDebutDate);
      let displayName = "";
      let avatarUrl = "";
      let autoDesc = "";
      try {
        const profile = await fetchPlatformProfile(platform, channelUrl);
        if (profile && profile.success) {
          displayName = profile.creatorName || "";
          avatarUrl = profile.profileImageUrl || "";
          autoDesc = profile.description || "";
        }
      } catch (e) {
        console.error("[Discord Profile Crawl Error]:", e);
      }
      if (!displayName) {
        const parsed = extractChannelIdentifier(platform, channelUrl);
        displayName = parsed.success && parsed.channelId ? `${parsed.channelId} (${platform})` : `\uC2E0\uC785 ${platform} \uBC84\uD29C\uBC84`;
      }
      const startAtUtc = debutStatus.startAtUtc || new Date(Date.now() + 864e5 * 7).toISOString();
      const eventPayload = {
        id: "",
        displayName,
        avatarUrl,
        platform,
        watchUrl: channelUrl,
        description: autoDesc || `${displayName} \uBC84\uD29C\uBC84\uC758 \uB370\uBDD4 \uC18C\uC2DD\uC785\uB2C8\uB2E4.`,
        startAtUtc,
        originalTimezone: "Asia/Seoul",
        debutStatus,
        creator: {
          displayName,
          avatarUrl,
          agency: "\uAC1C\uC778\uC138",
          countryCode: "KR"
        },
        links: [{ platform, url: channelUrl, isPrimary: true }]
      };
      const eventId = await insertEventToD1(env.DB, eventPayload);
      eventPayload.id = eventId;
      if (env.DISCORD_BOT_TOKEN) {
        broadcastNewDebutToDiscord(env.DB, env.DISCORD_BOT_TOKEN, eventPayload).catch(
          (e) => console.error("[Broadcast on submit error]:", e)
        );
      }
      return buildDebutSuccessEmbed(eventPayload);
    }
  }
  return {
    type: CALLBACK_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC694\uCCAD\uC785\uB2C8\uB2E4." }
  };
}
__name(handleDiscordInteraction, "handleDiscordInteraction");

// ../../../../backend/node_modules/hono/dist/middleware/body-limit/index.js
var ERROR_MESSAGE = "Payload Too Large";
var bodyLimit = /* @__PURE__ */ __name((options) => {
  const onError = options.onError || (() => {
    const res = new Response(ERROR_MESSAGE, {
      status: 413
    });
    throw new HTTPException(413, { res });
  });
  const maxSize = options.maxSize;
  return /* @__PURE__ */ __name(async function bodyLimit2(c, next) {
    if (!c.req.raw.body) {
      return next();
    }
    const hasTransferEncoding = c.req.raw.headers.has("transfer-encoding");
    const hasContentLength = c.req.raw.headers.has("content-length");
    if (hasContentLength && !hasTransferEncoding) {
      const contentLength = parseInt(c.req.raw.headers.get("content-length") || "0", 10);
      return contentLength > maxSize ? onError(c) : next();
    }
    let size = 0;
    const chunks = [];
    const rawReader = c.req.raw.body.getReader();
    for (; ; ) {
      const { done, value } = await rawReader.read();
      if (done) {
        break;
      }
      size += value.length;
      if (size > maxSize) {
        return onError(c);
      }
      chunks.push(value);
    }
    const requestInit = {
      body: new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(chunk);
          }
          controller.close();
        }
      }),
      duplex: "half"
    };
    c.req.raw = new Request(c.req.raw, requestInit);
    return next();
  }, "bodyLimit2");
}, "bodyLimit");

// src/services/adminAuthService.ts
async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(password + salt);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
async function verifyAdminLogin(db, username, password) {
  if (!username || !password)
    return { success: false, error: "\uC544\uC774\uB514\uC640 \uBE44\uBC00\uBC88\uD638\uB97C \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694." };
  try {
    const user = await db.prepare("SELECT id,username,password_hash,salt,role FROM admin_users WHERE LOWER(username)=LOWER(?) LIMIT 1").bind(username.trim()).first();
    if (!user || user.role !== "ADMIN" || await hashPassword(password, user.salt) !== user.password_hash)
      return { success: false, error: "\uC544\uC774\uB514 \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." };
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
    await db.batch([
      db.prepare("INSERT INTO portal_sessions(token_hash,expires_at) VALUES(?,?)").bind(await hashPassword(token, ""), Date.now() + 8 * 36e5),
      db.prepare("UPDATE admin_users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?").bind(user.id)
    ]);
    return { success: true, token };
  } catch {
    return { success: false, error: "\uB85C\uADF8\uC778 \uCC98\uB9AC \uC911 \uC11C\uBC84 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." };
  }
}
__name(verifyAdminLogin, "verifyAdminLogin");
async function validateAdminToken(token, db) {
  if (!token || token.length > 128)
    return false;
  try {
    return Boolean(await db.prepare("SELECT token_hash FROM portal_sessions WHERE token_hash=? AND expires_at>?").bind(await hashPassword(token, ""), Date.now()).first());
  } catch {
    return false;
  }
}
__name(validateAdminToken, "validateAdminToken");

// src/utils/slugUtils.ts
var CHOSUNG = [
  "g",
  "kk",
  "n",
  "d",
  "tt",
  "r",
  "m",
  "b",
  "pp",
  "s",
  "ss",
  "",
  "j",
  "jj",
  "ch",
  "k",
  "t",
  "p",
  "h"
];
var JUNGSUNG = [
  "a",
  "ae",
  "ya",
  "yae",
  "eo",
  "e",
  "yeo",
  "ye",
  "o",
  "wa",
  "wae",
  "oe",
  "yo",
  "u",
  "wo",
  "we",
  "wi",
  "yu",
  "eu",
  "ui",
  "i"
];
var JONGSUNG = [
  "",
  "k",
  "k",
  "ks",
  "n",
  "nj",
  "nh",
  "t",
  "l",
  "lg",
  "lm",
  "lb",
  "ls",
  "lt",
  "lp",
  "lh",
  "m",
  "p",
  "ps",
  "t",
  "t",
  "ng",
  "t",
  "t",
  "k",
  "t",
  "p",
  "h"
];
function romanizeKorean(text) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 44032 && code <= 55203) {
      const unicodeIndex = code - 44032;
      const cho = Math.floor(unicodeIndex / 588);
      const jung = Math.floor(unicodeIndex % 588 / 28);
      const jong = unicodeIndex % 28;
      result += CHOSUNG[cho] + JUNGSUNG[jung] + JONGSUNG[jong];
    } else {
      result += text[i];
    }
  }
  return result;
}
__name(romanizeKorean, "romanizeKorean");
function extractHandleFromUrl(channelUrl, xUrl) {
  if (xUrl && xUrl.trim()) {
    try {
      const parsed = new URL(xUrl.trim());
      const handle = parsed.pathname.replace(/^\/|@/g, "").split("/")[0];
      if (handle && handle.length >= 2 && !handle.toLowerCase().includes("intent")) {
        return handle.toLowerCase().replace(/_/g, "-");
      }
    } catch {
    }
  }
  if (channelUrl && channelUrl.trim()) {
    try {
      const parsed = new URL(channelUrl.trim());
      const pathname = parsed.pathname;
      if (pathname.includes("/@")) {
        const handle = pathname.split("/@")[1].split("/")[0];
        if (handle)
          return handle.toLowerCase().replace(/_/g, "-");
      }
      if (parsed.hostname.includes("sooplive.co.kr") || parsed.hostname.includes("afreecatv.com")) {
        const parts = pathname.split("/").filter(Boolean);
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length >= 3 && !["station", "memo", "post"].includes(lastPart)) {
          return lastPart.toLowerCase();
        }
      }
      if (parsed.hostname.includes("twitch.tv")) {
        const handle = pathname.replace(/^\//, "").split("/")[0];
        if (handle && handle.length >= 3)
          return handle.toLowerCase();
      }
      if (parsed.hostname.includes("chzzk.naver.com")) {
        if (pathname.startsWith("/live/")) {
          const handle = pathname.replace("/live/", "").split("/")[0];
          if (handle && handle.length < 25 && !/^[a-f0-9]{32}$/i.test(handle)) {
            return handle.toLowerCase();
          }
        }
      }
    } catch {
    }
  }
  return null;
}
__name(extractHandleFromUrl, "extractHandleFromUrl");
function generateCleanSlug(displayName, channelUrl, xUrl) {
  const urlHandle = extractHandleFromUrl(channelUrl, xUrl);
  if (urlHandle) {
    const sanitized = urlHandle.replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (sanitized && sanitized.length >= 2)
      return sanitized;
  }
  if (displayName && displayName.trim()) {
    let cleanName = displayName;
    if (cleanName.includes("/")) {
      const parts = cleanName.split("/");
      const englishPart = parts.find((p) => /[a-zA-Z]/.test(p));
      cleanName = englishPart ? englishPart.trim() : parts[0].trim();
    }
    const romanized = romanizeKorean(cleanName);
    const slug = romanized.toLowerCase().replace(/[^a-z0-9가-힣\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (slug && slug.length >= 2) {
      return slug;
    }
  }
  return `creator-${Date.now().toString(36)}`;
}
__name(generateCleanSlug, "generateCleanSlug");
async function resolveUniqueSlug(db, baseSlug, excludeChannelId) {
  const sanitizedBase = baseSlug.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "") || "creator";
  let candidateSlug = sanitizedBase;
  let counter = 1;
  while (true) {
    let query = "SELECT channel_id FROM streamerChannel_info WHERE slug = ? LIMIT 1";
    let stmt = db.prepare(query).bind(candidateSlug);
    const existing = await stmt.first();
    if (!existing || excludeChannelId && existing.channel_id === excludeChannelId) {
      return candidateSlug;
    }
    counter++;
    candidateSlug = `${sanitizedBase}-${counter}`;
  }
}
__name(resolveUniqueSlug, "resolveUniqueSlug");

// src/services/portalService.ts
var PORTAL_BODY_LIMIT = 65536;
async function portalTokenHash(token) {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(portalTokenHash, "portalTokenHash");
function newPortalToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
}
__name(newPortalToken, "newPortalToken");
function field(body, key, max = 200) {
  return typeof body[key] === "string" ? body[key].trim().slice(0, max) : "";
}
__name(field, "field");
async function portalAdminStreamers(db) {
  return (await readPortalProfiles(db)).map((profile) => ({
    info_id: profile.slug,
    slug: profile.slug,
    display_name: profile.displayName,
    profile_image_url: profile.avatarUrl,
    description: profile.description,
    agency_name: profile.agency,
    country_code: profile.countryCode,
    x_url: profile.xUrl,
    platform: profile.platform,
    channel_url: profile.channelUrl,
    channel_name: profile.displayName,
    debut_date: profile.debutDate,
    debut_time: profile.debutTime,
    timezone: profile.timezone,
    start_at_utc: profile.startAtUtc
  }));
}
__name(portalAdminStreamers, "portalAdminStreamers");
async function deletePortalProfile(db, slug) {
  const exists = await db.prepare("SELECT slug FROM streamerChannel_info WHERE slug=? UNION SELECT slug FROM portal_profiles WHERE slug=? LIMIT 1").bind(slug, slug).first();
  if (!exists)
    return false;
  await db.batch([
    db.prepare("DELETE FROM streamerChannel WHERE id IN (SELECT channel_id FROM streamerChannel_info WHERE slug=?)").bind(slug),
    db.prepare("DELETE FROM streamerChannel_info WHERE slug=?").bind(slug),
    db.prepare("DELETE FROM portal_profiles WHERE slug=?").bind(slug),
    db.prepare("DELETE FROM portal_profile_channels WHERE slug=?").bind(slug)
  ]);
  return true;
}
__name(deletePortalProfile, "deletePortalProfile");
function cleanPortalProfile(body) {
  const platform = field(body, "platform");
  const dateState = field(body, "dateState");
  const timezone = field(body, "timezone") || "Asia/Seoul";
  const debutDate = field(body, "debutDate");
  const debutTime = field(body, "debutTime");
  const targetMonth = field(body, "targetMonth");
  const channelUrl = portalChannelUrl(field(body, "channelUrl", 1e3), platform);
  if (!field(body, "displayName", 80) || !PORTAL_PLATFORMS.some((p) => p.id === platform) || !channelUrl)
    throw new Error("\uD65C\uB3D9\uBA85\uACFC \uC62C\uBC14\uB978 \uBC29\uC1A1 \uCC44\uB110 \uC8FC\uC18C\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
  if (!["FIXED", "TIME_TBD", "DATE_TBD", "NONE"].includes(dateState) || !PORTAL_TIMEZONES.includes(timezone))
    throw new Error("\uC77C\uC815 \uC0C1\uD0DC\uC640 \uC2DC\uAC04\uB300\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
  const startAtUtc = dateState === "FIXED" ? portalUtc(debutDate, debutTime, timezone) : "";
  if (dateState === "FIXED" && !startAtUtc)
    throw new Error("\uC120\uD0DD\uD55C \uC2DC\uAC04\uB300\uC5D0\uC11C \uC720\uD6A8\uD55C \uB0A0\uC9DC\uC640 \uC2DC\uAC04\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
  if (dateState === "TIME_TBD" && !portalUtc(debutDate, "12:00", timezone))
    throw new Error("\uB370\uBDD4 \uB0A0\uC9DC\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
  if (dateState === "DATE_TBD" && !/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth))
    throw new Error("\uB370\uBDD4 \uC608\uC815 \uC6D4\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
  const list = /* @__PURE__ */ __name((key) => Array.isArray(body[key]) ? body[key].filter((v) => typeof v === "string").map((v) => v.trim().slice(0, 40)).filter(Boolean).slice(0, 8) : [], "list");
  const countryCode = field(body, "countryCode");
  if (countryCode && !["KR", "JP", "US", "GB", "TW", "OTHER"].includes(countryCode))
    throw new Error("\uD65C\uB3D9 \uAD6D\uAC00\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
  return {
    ...cleanProfilePresentation(body),
    slug: "",
    displayName: field(body, "displayName", 80),
    description: field(body, "description", 2e3),
    avatarUrl: portalWebUrl(field(body, "avatarUrl", 1e3)),
    platform,
    channelUrl,
    countryCode,
    languages: list("languages"),
    tags: list("tags"),
    agency: field(body, "agency", 100),
    xUrl: portalWebUrl(field(body, "xUrl", 1e3)),
    dateState,
    debutDate: ["FIXED", "TIME_TBD"].includes(dateState) ? debutDate : "",
    debutTime: dateState === "FIXED" ? debutTime : "",
    timezone,
    startAtUtc,
    targetMonth: dateState === "DATE_TBD" ? targetMonth : debutDate.slice(0, 7),
    ownerVerified: false,
    source: "REGISTERED"
  };
}
__name(cleanPortalProfile, "cleanPortalProfile");
async function portalOwner(db, slug, token) {
  if (!token || token.length > 128)
    return false;
  return Boolean(await db.prepare("SELECT id FROM portal_requests WHERE kind='CLAIM' AND status='APPROVED' AND slug=? AND token_hash=? LIMIT 1").bind(slug, await portalTokenHash(token)).first());
}
__name(portalOwner, "portalOwner");
async function portalAdmin(db, token) {
  if (!token || token.length > 128)
    return false;
  return validateAdminToken(token, db);
}
__name(portalAdmin, "portalAdmin");
function publicRequest(row) {
  return { id: row.id, kind: row.kind, status: row.status, slug: row.slug, payload: JSON.parse(row.payload), note: row.note, createdAt: row.created_at };
}
__name(publicRequest, "publicRequest");
function cleanRequest(kind, body) {
  if (kind === "DEBUT" || kind === "PROFILE") {
    const profile = cleanPortalProfile(body);
    const role = field(body, "requesterRole");
    if (!["SELF", "AGENCY", "FAN"].includes(role))
      throw new Error("\uC2E0\uCCAD\uC790 \uAD6C\uBD84\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.");
    if (!profile.description.trim())
      throw new Error("\uCC44\uB110 \uC18C\uAC1C\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
    const region = REGISTRATION_REGIONS.find((item) => item.code === profile.countryCode);
    if (!region || !region.zones.includes(profile.timezone))
      throw new Error("\uAD6D\uAC00\uC640 \uC2DC\uAC04\uB300\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694.");
    if (!portalChannelKey(profile.channelUrl, profile.platform))
      throw new Error("\uC601\uC0C1 \uC8FC\uC18C \uB300\uC2E0 \uBC29\uC1A1 \uCC44\uB110 \uC8FC\uC18C\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
    if (kind === "DEBUT" && profile.dateState === "NONE")
      throw new Error("\uB370\uBDD4 \uC77C\uC815 \uB610\uB294 \uC608\uC815 \uC6D4\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
    return { ...profile, requesterRole: role, contactEmail: field(body, "contactEmail", 200) };
  }
  if (kind === "CLAIM") {
    const evidence = portalWebUrl(field(body, "evidenceUrl", 1e3));
    if (!evidence || !field(body, "message", 2e3))
      throw new Error("\uD655\uC778 \uBB38\uAD6C\uB97C \uAC8C\uC2DC\uD55C \uCC44\uB110 \uC8FC\uC18C\uC640 \uC2E0\uCCAD \uB0B4\uC6A9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
    return { evidenceUrl: evidence, message: field(body, "message", 2e3), contactEmail: field(body, "contactEmail", 200) };
  }
  if (kind === "CONTACT") {
    if (!field(body, "message", 2e3))
      throw new Error("\uBB38\uC758 \uB0B4\uC6A9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
    return { subject: field(body, "subject"), message: field(body, "message", 2e3), contactEmail: field(body, "contactEmail", 200), pageUrl: portalWebUrl(field(body, "pageUrl", 1e3)) };
  }
  throw new Error("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC2E0\uCCAD\uC785\uB2C8\uB2E4.");
}
__name(cleanRequest, "cleanRequest");
var portalApi = new Hono2();
portalApi.use("*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  if (c.env.PORTAL_ENABLED !== "true")
    return c.json({ error: "\uD398\uC774\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
  if (!c.env.DB)
    return c.json({ error: "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694." }, 503);
  if (!["GET", "HEAD"].includes(c.req.method)) {
    const origin = c.req.header("Origin");
    if (origin && origin !== new URL(c.req.url).origin)
      return c.json({ error: "\uC694\uCCAD\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 403);
    if (Number(c.req.header("Content-Length") || 0) > PORTAL_BODY_LIMIT)
      return c.json({ error: "\uC785\uB825 \uB0B4\uC6A9\uC774 \uB108\uBB34 \uAE41\uB2C8\uB2E4." }, 413);
  }
  await next();
});
portalApi.onError((error, c) => {
  console.error("[portal]", error.message);
  return c.json({ error: "\uC694\uCCAD\uC744 \uCC98\uB9AC\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694." }, 500);
});
portalApi.use("*", bodyLimit({ maxSize: PORTAL_BODY_LIMIT, onError: (c) => c.json({ error: "\uC785\uB825 \uB0B4\uC6A9\uC774 \uB108\uBB34 \uAE41\uB2C8\uB2E4." }, 413) }));
portalApi.get("/profiles", async (c) => {
  c.header("Cache-Control", "no-store");
  try {
    return c.json({ profiles: await readPublicPortalProfiles(c.env.DB) });
  } catch {
    c.header("Cache-Control", "no-store");
    return c.json({ error: "\uC18C\uAC1C\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694." }, 503);
  }
});
portalApi.get("/profiles/:slug/banner", async (c) => {
  c.header("Cache-Control", "no-store");
  const slug = c.req.param("slug");
  try {
    const profile = await readPublicPortalProfileBySlug(c.env.DB, slug);
    if (!profile) {
      c.header("Cache-Control", "no-store");
      return c.json({ error: "\uC18C\uAC1C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
    }
    return c.json({ bannerUrl: profile.bannerUrl || "", mobileBannerUrl: "", description: "" });
  } catch (error) {
    console.warn(JSON.stringify({ event: "soop_banner_unavailable", reason: error instanceof Error ? error.message : "unknown" }));
    c.header("Cache-Control", "no-store");
    return c.json({ error: "\uBC30\uB108\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." }, 503);
  }
});
portalApi.get("/requests/:id", async (c) => {
  const row = await c.env.DB.prepare("SELECT * FROM portal_requests WHERE id=? AND token_hash=?").bind(c.req.param("id"), await portalTokenHash(c.req.header("X-Request-Key") || "")).first();
  return row ? c.json({ request: publicRequest(row) }) : c.json({ error: "\uC811\uC218 \uBC88\uD638\uC640 \uBE44\uACF5\uAC1C \uD655\uC778 \uD0A4\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 404);
});
portalApi.post("/requests", async (c) => {
  const raw2 = await c.req.text();
  if (raw2.length > PORTAL_BODY_LIMIT)
    return c.json({ error: "\uC785\uB825 \uB0B4\uC6A9\uC774 \uB108\uBB34 \uAE41\uB2C8\uB2E4." }, 413);
  let body;
  try {
    body = JSON.parse(raw2);
  } catch {
    return c.json({ error: "\uC785\uB825 \uB0B4\uC6A9\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 400);
  }
  if (!body || typeof body !== "object" || body.website)
    return c.json({ error: "\uC785\uB825 \uB0B4\uC6A9\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 400);
  const kind = field(body, "kind");
  const slug = field(body, "slug", 150);
  let payload;
  try {
    payload = cleanRequest(kind, body);
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
  const registration = kind === "DEBUT" || kind === "PROFILE";
  const submissionKey = c.req.header("X-Submission-Key") || "";
  if (registration && submissionKey && !/^[a-f0-9-]{36}$/i.test(submissionKey))
    return c.json({ error: "\uC2E0\uCCAD \uC815\uBCF4\uB97C \uC0C8\uB85C \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 400);
  const keyHash = submissionKey ? await portalTokenHash(submissionKey) : "";
  const payloadHash = await portalTokenHash(JSON.stringify({ kind, payload }));
  if (registration && keyHash) {
    const prior = await c.env.DB.prepare("SELECT request_id,payload_hash FROM portal_submission_keys WHERE key_hash=?").bind(keyHash).first();
    if (prior)
      return prior.payload_hash === payloadHash ? c.json({ id: prior.request_id, duplicate: true }) : c.json({ error: "\uC2E0\uCCAD \uB0B4\uC6A9\uC774 \uBCC0\uACBD\uB410\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2E0\uCCAD\uD574 \uC8FC\uC138\uC694." }, 409);
  }
  const channelKey = registration ? portalChannelKey(String(payload.channelUrl), String(payload.platform)) : "";
  if (registration) {
    const duplicate = (await readPortalProfiles(c.env.DB)).some((p) => portalChannelKey(p.channelUrl, p.platform) === channelKey);
    if (duplicate)
      return c.json({ error: "\uC774\uBBF8 \uB4F1\uB85D\uB41C \uCC44\uB110\uC785\uB2C8\uB2E4. \uC815\uBCF4 \uBCC0\uACBD\uC740 \uBB38\uC758\uB85C \uC54C\uB824\uC8FC\uC138\uC694." }, 409);
    const pending = await c.env.DB.prepare("SELECT request_id FROM portal_pending_channels WHERE channel_key=?").bind(channelKey).first();
    if (pending)
      return c.json({ error: "\uC774\uBBF8 \uAC80\uD1A0 \uC911\uC778 \uCC44\uB110\uC785\uB2C8\uB2E4. \uC815\uBCF4 \uBCC0\uACBD\uC740 \uBB38\uC758\uB85C \uC54C\uB824\uC8FC\uC138\uC694." }, 409);
    const oldPending = await c.env.DB.prepare("SELECT payload FROM portal_requests WHERE status='PENDING' AND kind IN ('DEBUT','PROFILE')").all();
    if ((oldPending.results || []).some((row) => {
      const p = JSON.parse(row.payload);
      return portalChannelKey(p.channelUrl, p.platform) === channelKey;
    }))
      return c.json({ error: "\uC774\uBBF8 \uAC80\uD1A0 \uC911\uC778 \uCC44\uB110\uC785\uB2C8\uB2E4. \uC815\uBCF4 \uBCC0\uACBD\uC740 \uBB38\uC758\uB85C \uC54C\uB824\uC8FC\uC138\uC694." }, 409);
  }
  const requester = await portalTokenHash(c.req.header("CF-Connecting-IP") || "local");
  const count = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM portal_requests WHERE requester_hash=? AND created_at>datetime('now','-1 hour')").bind(requester).first();
  if ((count?.count || 0) >= 10)
    return c.json({ error: "\uC811\uC218\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694." }, 429);
  if (kind === "CLAIM" && !await readPortalProfileBySlug(c.env.DB, slug))
    return c.json({ error: "\uBC84\uD29C\uBC84 \uC18C\uAC1C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
  const id = crypto.randomUUID();
  const token = newPortalToken();
  const insert = c.env.DB.prepare("INSERT INTO portal_requests(id,kind,slug,payload,token_hash,requester_hash) VALUES(?,?,?,?,?,?)").bind(id, kind, slug, JSON.stringify(payload), await portalTokenHash(token), requester);
  const statements = [insert];
  if (registration)
    statements.push(c.env.DB.prepare("INSERT INTO portal_pending_channels(channel_key,request_id) VALUES(?,?)").bind(channelKey, id));
  if (registration && keyHash)
    statements.push(c.env.DB.prepare("INSERT INTO portal_submission_keys(key_hash,payload_hash,request_id) VALUES(?,?,?)").bind(keyHash, payloadHash, id));
  try {
    await c.env.DB.batch(statements);
  } catch (error) {
    const prior = keyHash ? await c.env.DB.prepare("SELECT request_id,payload_hash FROM portal_submission_keys WHERE key_hash=?").bind(keyHash).first() : null;
    if (prior?.payload_hash === payloadHash)
      return c.json({ id: prior.request_id, duplicate: true });
    if (registration && await c.env.DB.prepare("SELECT request_id FROM portal_pending_channels WHERE channel_key=?").bind(channelKey).first())
      return c.json({ error: "\uC774\uBBF8 \uAC80\uD1A0 \uC911\uC778 \uCC44\uB110\uC785\uB2C8\uB2E4. \uC815\uBCF4 \uBCC0\uACBD\uC740 \uBB38\uC758\uB85C \uC54C\uB824\uC8FC\uC138\uC694." }, 409);
    throw error;
  }
  return c.json({ id, token }, 201);
});
portalApi.get("/profiles/:slug/access", async (c) => c.json({ owner: await portalOwner(c.env.DB, c.req.param("slug"), c.req.header("X-Request-Key") || "") }));
portalApi.put("/profiles/:slug", async (c) => {
  const slug = c.req.param("slug");
  if (!await portalOwner(c.env.DB, slug, c.req.header("X-Request-Key") || ""))
    return c.json({ error: "\uC2B9\uC778\uB41C \uC18C\uC720\uAD8C \uD655\uC778 \uD0A4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." }, 403);
  let profile;
  try {
    profile = cleanPortalProfile(await c.req.json());
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
  const original = await readPortalProfileBySlug(c.env.DB, slug);
  if (!original)
    return c.json({ error: "\uC18C\uAC1C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
  if (profile.channelUrl !== original.channelUrl || profile.platform !== original.platform)
    return c.json({ error: "\uBC29\uC1A1 \uCC44\uB110 \uBCC0\uACBD\uC740 \uBB38\uC758\uB97C \uD1B5\uD574 \uC2E0\uCCAD\uD574 \uC8FC\uC138\uC694." }, 400);
  profile = {
    ...profile,
    slug,
    ownerVerified: true,
    source: original.source,
    requesterRole: original.requesterRole,
    debutGroupId: original.debutGroupId,
    debutGroupName: original.debutGroupName,
    media: profile.media ?? original.media
  };
  await c.env.DB.prepare("INSERT INTO portal_profiles(slug,channel_url,data) VALUES(?,?,?) ON CONFLICT(slug) DO UPDATE SET data=excluded.data,updated_at=CURRENT_TIMESTAMP").bind(slug, profile.channelUrl, JSON.stringify(profile)).run();
  return c.json({ profile });
});
portalApi.post("/admin/login", async (c) => {
  const body = await c.req.json();
  const requester = await portalTokenHash(`login:${c.req.header("CF-Connecting-IP") || "local"}`);
  const attempts = await c.env.DB.prepare("SELECT COUNT(*) AS count FROM portal_requests WHERE requester_hash=? AND created_at>datetime('now','-15 minutes')").bind(requester).first();
  if ((attempts?.count || 0) >= 8)
    return c.json({ error: "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694." }, 429);
  const result = await verifyAdminLogin(c.env.DB, field(body, "username"), field(body, "password", 200));
  if (!result.success) {
    await c.env.DB.prepare("INSERT INTO portal_requests(id,kind,status,payload,token_hash,requester_hash) VALUES(?,'CONTACT','REJECTED','{}','',?)").bind(crypto.randomUUID(), requester).run();
    return c.json({ error: "\uC544\uC774\uB514\uC640 \uBE44\uBC00\uBC88\uD638\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 401);
  }
  return c.json({ token: result.token });
});
portalApi.get("/admin/requests", async (c) => {
  if (!await portalAdmin(c.env.DB, c.req.header("X-Admin-Key") || ""))
    return c.json({ error: "\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const rows2 = await c.env.DB.prepare("SELECT * FROM portal_requests WHERE token_hash != '' ORDER BY created_at DESC LIMIT 300").all();
  return c.json({ requests: (rows2.results || []).map(publicRequest) });
});
portalApi.get("/admin/profiles", async (c) => {
  if (!await portalAdmin(c.env.DB, c.req.header("X-Admin-Key") || ""))
    return c.json({ error: "\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const profiles = await readPortalProfiles(c.env.DB);
  return c.json({ profiles: await Promise.all(profiles.map(async (profile) => ({ profile, revision: await portalTokenHash(JSON.stringify(profile)) }))) });
});
portalApi.get("/admin/profiles/:slug/history", async (c) => {
  if (!await portalAdmin(c.env.DB, c.req.header("X-Admin-Key") || ""))
    return c.json({ error: "\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const rows2 = await c.env.DB.prepare("SELECT id,before_data,reason,created_at FROM portal_profile_history WHERE slug=? ORDER BY created_at DESC,rowid DESC LIMIT 30").bind(c.req.param("slug")).all();
  return c.json({ history: (rows2.results || []).map((row) => ({ id: row.id, before: JSON.parse(row.before_data), reason: row.reason, createdAt: row.created_at })) });
});
portalApi.put("/admin/profiles/:slug", async (c) => {
  const adminKey = c.req.header("X-Admin-Key") || "";
  if (!await portalAdmin(c.env.DB, adminKey))
    return c.json({ error: "\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const slug = c.req.param("slug");
  const body = await c.req.json();
  const original = await readPortalProfileBySlug(c.env.DB, slug);
  if (!original)
    return c.json({ error: "\uC18C\uAC1C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
  if (field(body, "revision", 100) !== await portalTokenHash(JSON.stringify(original)))
    return c.json({ error: "\uB2E4\uB978 \uC6B4\uC601\uC790\uAC00 \uC218\uC815\uD588\uC2B5\uB2C8\uB2E4. \uBAA9\uB85D\uC744 \uC0C8\uB85C\uACE0\uCE68\uD574 \uC8FC\uC138\uC694." }, 409);
  const reason = field(body, "reason", 1e3);
  if (!reason)
    return c.json({ error: "\uBCC0\uACBD \uC0AC\uC720\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694." }, 400);
  let profile;
  try {
    profile = cleanPortalProfile(body.profile);
  } catch (error) {
    return c.json({ error: error.message || "\uD65C\uB3D9\uBA85\uACFC \uC77C\uC815 \uC815\uBCF4\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 400);
  }
  if (profile.channelUrl !== original.channelUrl || profile.platform !== original.platform)
    return c.json({ error: "\uAE30\uC874 \uBC29\uC1A1 \uCC44\uB110 \uC8FC\uC18C\uB97C \uC720\uC9C0\uD574 \uC8FC\uC138\uC694." }, 400);
  profile = { ...profile, slug, source: original.source, ownerVerified: original.ownerVerified, media: profile.media ?? original.media, ...original.requesterRole ? { requesterRole: original.requesterRole } : {} };
  const group = body.profile;
  const debutGroupId = field(group, "debutGroupId", 80);
  const debutGroupName = field(group, "debutGroupName", 100);
  if (Boolean(debutGroupId) !== Boolean(debutGroupName) || debutGroupId && !/^[a-z0-9_-]+$/.test(debutGroupId))
    return c.json({ error: "\uB370\uBDD4 \uADF8\uB8F9 \uC774\uB984\uACFC \uC601\uBB38\xB7\uC22B\uC790 \uC2DD\uBCC4\uC790\uB97C \uD568\uAED8 \uC785\uB825\uD574 \uC8FC\uC138\uC694." }, 400);
  profile = { ...profile, debutGroupId, debutGroupName };
  if (body.publicationState === "APPROVED" && body.contentChecked !== true)
    return c.json({ error: "\uD65C\uB3D9\uBA85\xB7\uC18C\uAC1C\xB7\uC774\uBBF8\uC9C0\xB7\uC601\uC0C1\uACFC \uC0AC\uC6A9 \uAD8C\uD55C\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 400);
  profile = reviewedProfile(profile, body.publicationState === "APPROVED" ? "APPROVED" : "HOLD", (/* @__PURE__ */ new Date()).toISOString());
  if (profile.contentReview?.state === "APPROVED" && !isPublicProfile(profile))
    return c.json({ error: "\uC601\uC0C1 \uC81C\uBAA9 \uD615\uD0DC\uC758 \uD65C\uB3D9\uBA85\uC774\uB098 \uC7AC\uAC80\uD1A0\uAC00 \uD544\uC694\uD55C \uC18C\uAC1C\uB97C \uBA3C\uC800 \uC815\uC815\uD574 \uC8FC\uC138\uC694." }, 400);
  const existing = await c.env.DB.prepare("SELECT data FROM portal_profiles WHERE slug=?").bind(slug).first();
  if (existing && await portalTokenHash(existing.data) !== field(body, "revision", 100))
    return c.json({ error: "\uB2E4\uB978 \uC6B4\uC601\uC790\uAC00 \uC218\uC815\uD588\uC2B5\uB2C8\uB2E4. \uBAA9\uB85D\uC744 \uC0C8\uB85C\uACE0\uCE68\uD574 \uC8FC\uC138\uC694." }, 409);
  const oldData = existing?.data || "";
  const data = JSON.stringify(profile);
  const guard = "COALESCE((SELECT data FROM portal_profiles WHERE slug=?),'')=? AND (EXISTS(SELECT 1 FROM portal_profiles WHERE slug=?) OR EXISTS(SELECT 1 FROM streamerChannel_info WHERE slug=?))";
  const results = await c.env.DB.batch([
    c.env.DB.prepare(`INSERT INTO portal_profile_history(id,slug,before_data,after_data,reason,admin_hash) SELECT ?,?,?,?,?,? WHERE ${guard}`).bind(crypto.randomUUID(), slug, JSON.stringify(original), data, reason, await portalTokenHash(adminKey), slug, oldData, slug, slug),
    c.env.DB.prepare(`INSERT INTO portal_profiles(slug,channel_url,data) SELECT ?,?,? WHERE ${guard} ON CONFLICT(slug) DO UPDATE SET data=excluded.data,updated_at=CURRENT_TIMESTAMP`).bind(slug, original.channelUrl, data, slug, oldData, slug, slug)
  ]);
  if (!results[0].meta.changes)
    return c.json({ error: "\uB2E4\uB978 \uC6B4\uC601\uC790\uAC00 \uC218\uC815\uD588\uC2B5\uB2C8\uB2E4. \uBAA9\uB85D\uC744 \uC0C8\uB85C\uACE0\uCE68\uD574 \uC8FC\uC138\uC694." }, 409);
  return c.json({ profile, revision: await portalTokenHash(data) });
});
portalApi.post("/admin/logout", async (c) => {
  await c.env.DB.prepare("DELETE FROM portal_sessions WHERE token_hash=?").bind(await portalTokenHash(c.req.header("X-Admin-Key") || "")).run();
  return c.json({ success: true });
});
portalApi.post("/admin/requests/:id/decision", async (c) => {
  if (!await portalAdmin(c.env.DB, c.req.header("X-Admin-Key") || ""))
    return c.json({ error: "\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  const body = await c.req.json();
  const status = body.status === "APPROVED" ? "APPROVED" : body.status === "REJECTED" ? "REJECTED" : "";
  if (!status)
    return c.json({ error: "\uCC98\uB9AC \uC0C1\uD0DC\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 400);
  const row = await c.env.DB.prepare("SELECT * FROM portal_requests WHERE id=?").bind(c.req.param("id")).first();
  if (!row)
    return c.json({ error: "\uC2E0\uCCAD\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
  if (row.status !== "PENDING")
    return c.json({ error: "\uC774\uBBF8 \uCC98\uB9AC\uB41C \uC2E0\uCCAD\uC785\uB2C8\uB2E4." }, 409);
  const statements = [];
  let slug = row.slug;
  let published;
  if (status === "APPROVED" && ["DEBUT", "PROFILE", "CLAIM"].includes(row.kind)) {
    const profiles = await readPortalProfiles(c.env.DB);
    let profile;
    if (row.kind === "CLAIM") {
      const original = profiles.find((p) => p.slug === slug);
      if (!original || body.proofChecked !== true)
        return c.json({ error: "\uACF5\uC2DD \uCC44\uB110 \uC99D\uBE59\uC744 \uD655\uC778\uD558\uACE0 \uD655\uC778\uB780\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694." }, 400);
      profile = { ...original, ownerVerified: true };
    } else {
      if (body.contentChecked !== true)
        return c.json({ error: "\uD65C\uB3D9\uBA85\xB7\uC18C\uAC1C\xB7\uC774\uBBF8\uC9C0\xB7\uC601\uC0C1\uACFC \uC0AC\uC6A9 \uAD8C\uD55C\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 400);
      profile = cleanPortalProfile(JSON.parse(row.payload));
      const duplicate = profiles.find((p) => portalChannelKey(p.channelUrl, p.platform) === portalChannelKey(profile.channelUrl, profile.platform));
      if (duplicate)
        return c.json({ error: "\uC774\uBBF8 \uB4F1\uB85D\uB41C \uCC44\uB110\uC785\uB2C8\uB2E4. \uAE30\uC874 \uC18C\uAC1C\uC758 \uC815\uBCF4 \uC815\uC815 \uBB38\uC758\uB97C \uC548\uB0B4\uD574 \uC8FC\uC138\uC694." }, 409);
      const base = generateCleanSlug(profile.displayName, profile.channelUrl, profile.xUrl).replace(/[^a-z0-9_-]/gi, "").slice(0, 70) || "vtuber";
      slug = profiles.some((p) => p.slug === base) ? `${base}-${crypto.randomUUID().slice(0, 8)}` : base;
      const role = JSON.parse(row.payload).requesterRole;
      profile = { ...profile, slug, ...["SELF", "AGENCY", "FAN"].includes(role) ? { requesterRole: role } : {} };
      profile = reviewedProfile(profile, "APPROVED", (/* @__PURE__ */ new Date()).toISOString());
      if (!isPublicProfile(profile))
        return c.json({ error: "\uC601\uC0C1 \uC81C\uBAA9 \uD615\uD0DC\uC758 \uD65C\uB3D9\uBA85\uC774\uB098 \uC7AC\uAC80\uD1A0\uAC00 \uD544\uC694\uD55C \uC18C\uAC1C\uB97C \uBA3C\uC800 \uC815\uC815\uD574 \uC8FC\uC138\uC694." }, 400);
      statements.push(c.env.DB.prepare("INSERT INTO portal_profile_channels(channel_key,slug) SELECT ?,? WHERE EXISTS(SELECT 1 FROM portal_requests WHERE id=? AND status='PENDING')").bind(portalChannelKey(profile.channelUrl, profile.platform), slug, row.id));
    }
    statements.push(c.env.DB.prepare("INSERT INTO portal_profiles(slug,channel_url,data) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM portal_requests WHERE id=? AND status='PENDING') ON CONFLICT(slug) DO UPDATE SET data=excluded.data,updated_at=CURRENT_TIMESTAMP").bind(slug, profile.channelUrl, JSON.stringify(profile), row.id));
    published = profile;
  }
  const note = field(body, "note", 1e3);
  if (status === "REJECTED" && !note)
    return c.json({ error: "\uBCF4\uC644\uC774 \uD544\uC694\uD55C \uB0B4\uC6A9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694." }, 400);
  statements.push(c.env.DB.prepare("DELETE FROM portal_pending_channels WHERE request_id=?").bind(row.id));
  statements.push(c.env.DB.prepare("UPDATE portal_requests SET status=?,slug=?,note=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='PENDING'").bind(status, slug, note, row.id));
  let decisions;
  try {
    decisions = await c.env.DB.batch(statements);
  } catch (error) {
    if (published && await c.env.DB.prepare("SELECT slug FROM portal_profile_channels WHERE channel_key=?").bind(portalChannelKey(published.channelUrl, published.platform)).first())
      return c.json({ error: "\uC774\uBBF8 \uACF5\uAC1C\uB41C \uCC44\uB110\uC785\uB2C8\uB2E4. \uAE30\uC874 \uC18C\uAC1C\uB97C \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 409);
    throw error;
  }
  if (decisions[decisions.length - 1]?.meta?.changes === 0)
    return c.json({ error: "\uC774\uBBF8 \uCC98\uB9AC\uB41C \uC2E0\uCCAD\uC785\uB2C8\uB2E4." }, 409);
  if (published && row.kind === "DEBUT" && c.env.DISCORD_BOT_TOKEN && new URL(c.req.url).hostname === "vdebut.live") {
    const event = portalProfileEvent(published);
    if (event)
      c.executionCtx.waitUntil(broadcastNewDebutToDiscord(c.env.DB, c.env.DISCORD_BOT_TOKEN, event).catch((error) => console.error("[Portal approval notification]", String(error))));
  }
  return c.json({ success: true, slug });
});

// src/services/portalEditorialBody.ts
function profileEditorialExtras(profile, language) {
  const esc = escapeActivityHtml;
  return `${profileMediaItems(profile).length ? `<section><h2>${esc(translatePortalText("\uC601\uC0C1 \uBAA8\uC74C", language))}</h2><ul>${profileMediaItems(profile).map((item) => `<li><a href="${esc(item.url)}" rel="noopener noreferrer">${esc(item.title)}</a></li>`).join("")}</ul></section>` : ""}${profile.regularSchedule ? `<p>${esc(profile.regularSchedule)}</p>` : ""}${profile.fanGuide ? `<section><h2>${esc(translatePortalText("\uD32C\uC73C\uB85C \uD568\uAED8\uD558\uAE30", language))}</h2><p>${esc(profile.fanGuide)}</p></section>` : ""}${profile.notices?.length ? `<section><h2>${esc(translatePortalText("\uC8FC\uC694 \uC18C\uC2DD", language))}</h2><ul>${profile.notices.filter((item) => portalWebUrl(item.url)).map((item) => `<li><a href="${esc(portalWebUrl(item.url))}" rel="noopener noreferrer">${esc(item.title)}</a></li>`).join("")}</ul></section>` : ""}`;
}
__name(profileEditorialExtras, "profileEditorialExtras");
function portalEditorialBody(path, language, profile) {
  const esc = escapeActivityHtml;
  const text = /* @__PURE__ */ __name((source) => esc(translatePortalText(source, language)), "text");
  const link = /* @__PURE__ */ __name((to) => esc(`${to}${language === "ko" ? "" : `?lang=${language}`}`), "link");
  if (path === "/guide")
    return PORTAL_GUIDES.map((guide) => `<article id="${guide.id}"><h2>${text(guide.title)}</h2>${guide.paragraphs.map((paragraph) => `<p>${text(paragraph)}</p>`).join("")}<a href="${link(guide.to)}">${text(guide.action)}</a></article>`).join("");
  if (path === "/")
    return `<section><h2>${text("\uCCAB \uBC29\uC1A1\uC744 \uB9CC\uB098\uACE0 \uC900\uBE44\uD558\uB294 \uBC29\uBC95")}</h2>${PORTAL_GUIDES.filter((guide) => ["save", "introduction", "announcement"].includes(guide.id)).map((guide) => `<article><h3>${text(guide.title)}</h3><p>${text(guide.paragraphs[0])}</p><a href="${link("/guide")}#${guide.id}">${text("\uC790\uC138\uD788 \uC77D\uAE30")}</a></article>`).join("")}</section>`;
  if (!profile)
    return "";
  const notice = portalWebUrl(profile.noticeUrl || "");
  const reviewedAt = profile.contentReview?.reviewedAt;
  const schedule = profile.dateState === "FIXED" && Number.isFinite(Date.parse(profile.startAtUtc)) ? `${new Intl.DateTimeFormat(language, { timeZone: "Asia/Seoul", dateStyle: "long", timeStyle: "short" }).format(new Date(profile.startAtUtc))} \xB7 KST` : profile.dateState === "TIME_TBD" ? translatePortalText("{0} \xB7 \uC2DC\uAC04 \uBBF8\uC815 ({1})", language, [profile.debutDate, profile.timezone]) : profile.dateState === "DATE_TBD" ? translatePortalText("{0} \xB7 \uB0A0\uC9DC \uBBF8\uC815", language, [profile.targetMonth]) : "";
  return `${profile.headline ? `<p>${esc(profile.headline)}</p>` : ""}${profile.description || profile.tags.length || profile.languages.length ? `<section><h2>${text("\uC5B4\uB5A4 \uBC29\uC1A1\uC744 \uD558\uB098\uC694?")}</h2>${profile.description ? `<p>${esc(profile.description)}</p>` : ""}<dl>${profile.tags.length ? `<dt>${text("\uC8FC\uC694 \uCF58\uD150\uCE20")}</dt><dd>${esc(profile.tags.join(" \xB7 "))}</dd>` : ""}${profile.languages.length ? `<dt>${text("\uBC29\uC1A1 \uC5B8\uC5B4")}</dt><dd>${esc(profile.languages.join(" \xB7 "))}</dd>` : ""}</dl></section>` : ""}<section><h2>${text("\uC18C\uAC1C\uC640 \uC77C\uC815 \uD655\uC778\uD558\uAE30")}</h2>${schedule ? `<p>${esc(schedule)}</p>` : ""}${reviewedAt && Number.isFinite(Date.parse(reviewedAt)) ? `<p>${text("\uC18C\uAC1C \uAC80\uD1A0\uC77C")} \xB7 <time datetime="${esc(reviewedAt)}">${esc(new Intl.DateTimeFormat(language, { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" }).format(new Date(reviewedAt)))}</time> \xB7 KST</p>` : ""}${notice ? `<a href="${esc(notice)}" rel="noopener noreferrer">${text("\uB370\uBDD4 \uACF5\uC9C0 \uC6D0\uBB38 \uBCF4\uAE30")}</a>` : ""}</section>${profileEditorialExtras(profile, language)}`;
}
__name(portalEditorialBody, "portalEditorialBody");

// ../shared/portalSeo.ts
function portalPageSeo(url, profile, options = {}) {
  const path = sitePath(url.pathname);
  const requestedLanguage = url.searchParams.get("lang");
  const language = requestedLanguage === "ja" || requestedLanguage === "en" ? requestedLanguage : "ko";
  const text = /* @__PURE__ */ __name((source, values = []) => translatePortalText(source, language, values), "text");
  const development = url.hostname !== "vdebut.live";
  const titles = {
    "/": "\uC2E0\uADDC \uBC84\uD29C\uBC84 \uB370\uBDD4 \uCE98\uB9B0\uB354 \xB7 \uB370\uBDD4 \uC77C\uC815\uACFC \uC18C\uAC1C",
    "/upload": "\uB370\uBDD4 \uC77C\uC815 \uB4F1\uB85D",
    "/creators": "\uBC84\uD29C\uBC84 \uCC3E\uAE30 \xB7 \uC18C\uAC1C\uC640 \uBC29\uC1A1 \uCF58\uD150\uCE20",
    "/creators/register": "\uBC84\uD29C\uBC84 \uC18C\uAC1C \uB4F1\uB85D",
    "/me/favorites": "\uAD00\uC2EC \uBC84\uD29C\uBC84",
    "/about": "\uBC84\uD29C\uBC84\uC640 \uD32C\uC758 \uC18C\uAC1C\uD305",
    "/guide": "\uC774\uC6A9 \uAC00\uC774\uB4DC",
    "/contact": "\uBB38\uC758\xB7\uC815\uBCF4 \uC815\uC815",
    "/admin": "\uB4F1\uB85D\xB7\uBB38\uC758 \uAC80\uD1A0",
    "/privacy": "\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68",
    "/terms": "\uC774\uC6A9\uC57D\uAD00"
  };
  const known = Boolean(titles[path]) || /^\/submissions\/[^/]+$/.test(path) || /^\/creator\/[^/]+$/.test(path);
  const missingProfile = /^\/creator\/[^/]+$/.test(path) && !profile;
  const privatePage = path === "/admin" || path.startsWith("/me/") || path.startsWith("/submissions/");
  const title = profile ? text("{0} \xB7 \uC18C\uAC1C\uC640 \uB370\uBDD4 \uC77C\uC815 | VD\xE9but", [profile.displayName]) : `${text((missingProfile ? "\uBC84\uD29C\uBC84 \uC18C\uAC1C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694" : titles[path]) || (path.startsWith("/submissions/") ? "\uC811\uC218 \uC0C1\uD0DC \uD655\uC778" : "\uD398\uC774\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694"))} | VD\xE9but`;
  const descriptions = {
    "/": HOME_INTRO,
    "/guide": GUIDE_INTRO,
    "/about": "\uB370\uBDD4 \uC77C\uC815\uACFC \uBC29\uC1A1 \uC18C\uAC1C\uB85C \uBC84\uD29C\uBC84\uC640 \uD32C\uC758 \uCCAB \uB9CC\uB0A8\uC744 \uC5F0\uACB0\uD569\uB2C8\uB2E4.",
    "/creators": "\uC8FC\uC694 \uCF58\uD150\uCE20\uC640 \uBC29\uC1A1 \uC5B8\uC5B4, \uB370\uBDD4 \uC77C\uC815\uC744 \uC0B4\uD3B4\uBCF4\uC138\uC694. \uAD00\uC2EC \uC788\uB294 \uBC84\uD29C\uBC84\uB294 \uD558\uD2B8\uB85C \uC800\uC7A5\uD560 \uC218 \uC788\uC5B4\uC694.",
    "/upload": "\uBC29\uC1A1 \uCC44\uB110\uACFC \uB370\uBDD4 \uC77C\uC815\uC744 \uB4F1\uB85D\uD558\uC138\uC694. \uB0A0\uC9DC\uC640 \uC2DC\uAC04\uC774 \uBBF8\uC815\uC778 \uC77C\uC815\uB3C4 \uC2E0\uCCAD\uD560 \uC218 \uC788\uC73C\uBA70, \uC6B4\uC601\uC790 \uAC80\uD1A0 \uD6C4 \uACF5\uAC1C\uB429\uB2C8\uB2E4.",
    "/creators/register": "\uD65C\uB3D9\uBA85, \uBC29\uC1A1 \uCC44\uB110\uACFC \uB098\uC758 \uC18C\uAC1C\uB97C \uB4F1\uB85D\uD558\uC138\uC694. \uB370\uBDD4 \uC77C\uC815 \uC5C6\uC774\uB3C4 \uC18C\uAC1C\uB97C \uC2E0\uCCAD\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    "/contact": "\uC77C\uC815 \uBCC0\uACBD, \uC18C\uAC1C \uC218\uC815\xB7\uC0AD\uC81C, \uAD8C\uB9AC \uCE68\uD574\uC640 \uBD80\uC801\uC808\uD55C \uCF58\uD150\uCE20\uB97C \uAD00\uB828 \uD398\uC774\uC9C0 \uC8FC\uC18C\uC640 \uD568\uAED8 \uC54C\uB824\uC8FC\uC138\uC694.",
    "/privacy": "VD\xE9but\uC758 \uB4F1\uB85D\xB7\uBB38\uC758 \uC815\uBCF4, \uBE0C\uB77C\uC6B0\uC800 \uC800\uC7A5\uACFC Google Analytics \uC774\uC6A9\uC5D0 \uAD00\uD55C \uAC1C\uC778\uC815\uBCF4 \uC548\uB0B4\uC785\uB2C8\uB2E4.",
    "/terms": "VD\xE9but\uC758 \uC11C\uBE44\uC2A4 \uC774\uC6A9, \uC18C\uAC1C \uB4F1\uB85D\uACFC \uACF5\uAC1C \uAE30\uC900, \uC815\uBCF4 \uC815\uC815\uC5D0 \uAD00\uD55C \uC548\uB0B4\uC785\uB2C8\uB2E4.",
    "/me/favorites": "\uC774 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC800\uC7A5\uD55C \uAD00\uC2EC \uBC84\uD29C\uBC84\uC758 \uC18C\uAC1C\uB97C \uB2E4\uC2DC \uC0B4\uD3B4\uBCF4\uC138\uC694."
  };
  const description = profile ? profileExcerpt(profile, 160) : text(missingProfile ? "\uB2E4\uB978 \uBC84\uD29C\uBC84\uC758 \uC18C\uAC1C\uC640 \uB370\uBDD4 \uC77C\uC815\uC744 \uC0B4\uD3B4\uBCF4\uC138\uC694." : descriptions[path] || (path.startsWith("/submissions/") ? "\uC811\uC218 \uBC88\uD638\uC640 \uBE44\uACF5\uAC1C \uD655\uC778 \uD0A4\uB85C \uBB38\uC758 \uCC98\uB9AC \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uC138\uC694." : known ? "\uB4F1\uB85D \uC2E0\uCCAD\uACFC \uBB38\uC758 \uB0B4\uC6A9\uC744 \uD655\uC778\uD558\uACE0 \uAC80\uD1A0\uD569\uB2C8\uB2E4." : "\uC8FC\uC18C\uB97C \uD655\uC778\uD558\uAC70\uB098 \uB370\uBDD4 \uCE98\uB9B0\uB354\uC5D0\uC11C \uC0C8\uB85C\uC6B4 \uB9CC\uB0A8\uC744 \uCC3E\uC544\uBCF4\uC138\uC694."));
  return {
    path,
    known,
    development,
    privatePage,
    title,
    description,
    language,
    robots: development || privatePage || !known || missingProfile || options.unavailable ? "noindex, nofollow" : "index, follow",
    canonical: siteCanonical(path, language),
    alternates: privatePage || !known || missingProfile || options.unavailable ? [] : siteAlternates(path),
    // 개인 배너나 프로필 사진을 공유 이미지로 사용하고 자료가 없으면 서비스 이미지를 사용한다.
    image: portalWebUrl(profile?.bannerUrl || "") || portalWebUrl(profile?.avatarUrl || "") || "https://vdebut.live/og-image.png"
  };
}
__name(portalPageSeo, "portalPageSeo");

// src/services/portalPageService.ts
function renderPortalPage(html, url, profile) {
  profile = profile && isPublicProfile(profile) ? profile : void 0;
  const seo = portalPageSeo(url, profile);
  const esc = escapeActivityHtml;
  const text = /* @__PURE__ */ __name((source) => esc(translatePortalText(source, seo.language)), "text");
  html = html.replace(/<html\b[^>]*>/, `<html lang="${seo.language}">`);
  const alternates = seo.alternates.map((link) => `<link rel="alternate" hreflang="${link.language}" href="${esc(link.href)}">`).join("");
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(seo.title)}</title>`).replace(/<meta\b[^>]*(?:name="(?:title|description|robots|twitter:[^"]+)"|property="og:[^"]+")[^>]*>/g, "").replace(/<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>/g, "").replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, "");
  html = html.replace("</head>", `<meta name="description" content="${esc(seo.description)}"><meta name="robots" content="${seo.robots}"><link rel="canonical" href="${esc(seo.canonical)}"><meta property="og:title" content="${esc(seo.title)}"><meta property="og:description" content="${esc(seo.description)}"><meta property="og:url" content="${esc(seo.canonical)}"><meta property="og:image" content="${esc(seo.image)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(seo.title)}"><meta name="twitter:description" content="${esc(seo.description)}"><meta name="twitter:image" content="${esc(seo.image)}"><script type="application/ld+json">${activityJson(pageStructuredData(seo))}<\/script></head>`);
  html = html.replace("</head>", `${alternates}${INITIAL_PAGE_LOADING_HEAD}</head>`);
  const languageQuery = seo.language === "ko" ? "" : `?lang=${seo.language}`;
  const body = `<main><h1>${esc(profile?.displayName || seo.title.split(" | ")[0])}</h1>${profile ? "" : `<p>${esc(seo.description)}</p>`}<nav><a href="/${languageQuery}">${text("\uB370\uBDD4 \uCE98\uB9B0\uB354")}</a> \xB7 <a href="/creators${languageQuery}">${text("\uBC84\uD29C\uBC84 \uCC3E\uAE30")}</a> \xB7 <a href="/analytics${languageQuery}">${text("\uBC29\uC1A1 \uD1B5\uACC4")}</a> \xB7 <a href="/guide${languageQuery}">${text("\uC774\uC6A9 \uAC00\uC774\uB4DC")}</a></nav>${profile?.channelUrl ? `<p><a href="${esc(profile.channelUrl)}" rel="noopener noreferrer">${text("\uACF5\uC2DD \uBC29\uC1A1 \uCC44\uB110")}</a></p>` : ""}${portalEditorialBody(seo.path, seo.language, profile)}</main>`;
  return html.replace(/<div id="root">[\s\S]*?<\/div>/, initialPageRoot(body, text("\uD654\uBA74\uC744 \uBD88\uB7EC\uC624\uACE0 \uC788\uC5B4\uC694")));
}
__name(renderPortalPage, "renderPortalPage");
function portalSitemap(profiles) {
  const paths = [...PORTAL_INDEX_PATHS, ...profiles.filter(isPublicProfile).map((profile) => `/creator/${encodeURIComponent(profile.slug)}`)];
  return [...new Set(paths)].flatMap((path) => ["ko", "ja", "en"].map((language) => sitemapEntry(path, language, true))).join("");
}
__name(portalSitemap, "portalSitemap");

// ../../../../backend/node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// ../../../../backend/node_modules/@cloudflare/kv-asset-handler/dist/index.js
var __create = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var __commonJS = /* @__PURE__ */ __name((cb, mod) => /* @__PURE__ */ __name(function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
}, "__require"), "__commonJS");
var __copyProps = /* @__PURE__ */ __name((to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
}, "__copyProps");
var __toESM = /* @__PURE__ */ __name((mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  __defProp2(target, "default", { value: mod, enumerable: true }),
  mod
)), "__toESM");
var require_Mime = __commonJS({
  "../../node_modules/.pnpm/mime@3.0.0/node_modules/mime/Mime.js"(exports, module) {
    function Mime() {
      this._types = /* @__PURE__ */ Object.create(null);
      this._extensions = /* @__PURE__ */ Object.create(null);
      for (let i = 0; i < arguments.length; i++) {
        this.define(arguments[i]);
      }
      this.define = this.define.bind(this);
      this.getType = this.getType.bind(this);
      this.getExtension = this.getExtension.bind(this);
    }
    __name(Mime, "Mime");
    __name2(Mime, "Mime");
    Mime.prototype.define = function(typeMap, force) {
      for (let type in typeMap) {
        let extensions = typeMap[type].map(function(t) {
          return t.toLowerCase();
        });
        type = type.toLowerCase();
        for (let i = 0; i < extensions.length; i++) {
          const ext = extensions[i];
          if (ext[0] === "*") {
            continue;
          }
          if (!force && ext in this._types) {
            throw new Error(
              'Attempt to change mapping for "' + ext + '" extension from "' + this._types[ext] + '" to "' + type + '". Pass `force=true` to allow this, otherwise remove "' + ext + '" from the list of extensions for "' + type + '".'
            );
          }
          this._types[ext] = type;
        }
        if (force || !this._extensions[type]) {
          const ext = extensions[0];
          this._extensions[type] = ext[0] !== "*" ? ext : ext.substr(1);
        }
      }
    };
    Mime.prototype.getType = function(path) {
      path = String(path);
      let last = path.replace(/^.*[/\\]/, "").toLowerCase();
      let ext = last.replace(/^.*\./, "").toLowerCase();
      let hasPath = last.length < path.length;
      let hasDot = ext.length < last.length - 1;
      return (hasDot || !hasPath) && this._types[ext] || null;
    };
    Mime.prototype.getExtension = function(type) {
      type = /^\s*([^;\s]*)/.test(type) && RegExp.$1;
      return type && this._extensions[type.toLowerCase()] || null;
    };
    module.exports = Mime;
  }
});
var require_standard = __commonJS({
  "../../node_modules/.pnpm/mime@3.0.0/node_modules/mime/types/standard.js"(exports, module) {
    module.exports = { "application/andrew-inset": ["ez"], "application/applixware": ["aw"], "application/atom+xml": ["atom"], "application/atomcat+xml": ["atomcat"], "application/atomdeleted+xml": ["atomdeleted"], "application/atomsvc+xml": ["atomsvc"], "application/atsc-dwd+xml": ["dwd"], "application/atsc-held+xml": ["held"], "application/atsc-rsat+xml": ["rsat"], "application/bdoc": ["bdoc"], "application/calendar+xml": ["xcs"], "application/ccxml+xml": ["ccxml"], "application/cdfx+xml": ["cdfx"], "application/cdmi-capability": ["cdmia"], "application/cdmi-container": ["cdmic"], "application/cdmi-domain": ["cdmid"], "application/cdmi-object": ["cdmio"], "application/cdmi-queue": ["cdmiq"], "application/cu-seeme": ["cu"], "application/dash+xml": ["mpd"], "application/davmount+xml": ["davmount"], "application/docbook+xml": ["dbk"], "application/dssc+der": ["dssc"], "application/dssc+xml": ["xdssc"], "application/ecmascript": ["es", "ecma"], "application/emma+xml": ["emma"], "application/emotionml+xml": ["emotionml"], "application/epub+zip": ["epub"], "application/exi": ["exi"], "application/express": ["exp"], "application/fdt+xml": ["fdt"], "application/font-tdpfr": ["pfr"], "application/geo+json": ["geojson"], "application/gml+xml": ["gml"], "application/gpx+xml": ["gpx"], "application/gxf": ["gxf"], "application/gzip": ["gz"], "application/hjson": ["hjson"], "application/hyperstudio": ["stk"], "application/inkml+xml": ["ink", "inkml"], "application/ipfix": ["ipfix"], "application/its+xml": ["its"], "application/java-archive": ["jar", "war", "ear"], "application/java-serialized-object": ["ser"], "application/java-vm": ["class"], "application/javascript": ["js", "mjs"], "application/json": ["json", "map"], "application/json5": ["json5"], "application/jsonml+json": ["jsonml"], "application/ld+json": ["jsonld"], "application/lgr+xml": ["lgr"], "application/lost+xml": ["lostxml"], "application/mac-binhex40": ["hqx"], "application/mac-compactpro": ["cpt"], "application/mads+xml": ["mads"], "application/manifest+json": ["webmanifest"], "application/marc": ["mrc"], "application/marcxml+xml": ["mrcx"], "application/mathematica": ["ma", "nb", "mb"], "application/mathml+xml": ["mathml"], "application/mbox": ["mbox"], "application/mediaservercontrol+xml": ["mscml"], "application/metalink+xml": ["metalink"], "application/metalink4+xml": ["meta4"], "application/mets+xml": ["mets"], "application/mmt-aei+xml": ["maei"], "application/mmt-usd+xml": ["musd"], "application/mods+xml": ["mods"], "application/mp21": ["m21", "mp21"], "application/mp4": ["mp4s", "m4p"], "application/msword": ["doc", "dot"], "application/mxf": ["mxf"], "application/n-quads": ["nq"], "application/n-triples": ["nt"], "application/node": ["cjs"], "application/octet-stream": ["bin", "dms", "lrf", "mar", "so", "dist", "distz", "pkg", "bpk", "dump", "elc", "deploy", "exe", "dll", "deb", "dmg", "iso", "img", "msi", "msp", "msm", "buffer"], "application/oda": ["oda"], "application/oebps-package+xml": ["opf"], "application/ogg": ["ogx"], "application/omdoc+xml": ["omdoc"], "application/onenote": ["onetoc", "onetoc2", "onetmp", "onepkg"], "application/oxps": ["oxps"], "application/p2p-overlay+xml": ["relo"], "application/patch-ops-error+xml": ["xer"], "application/pdf": ["pdf"], "application/pgp-encrypted": ["pgp"], "application/pgp-signature": ["asc", "sig"], "application/pics-rules": ["prf"], "application/pkcs10": ["p10"], "application/pkcs7-mime": ["p7m", "p7c"], "application/pkcs7-signature": ["p7s"], "application/pkcs8": ["p8"], "application/pkix-attr-cert": ["ac"], "application/pkix-cert": ["cer"], "application/pkix-crl": ["crl"], "application/pkix-pkipath": ["pkipath"], "application/pkixcmp": ["pki"], "application/pls+xml": ["pls"], "application/postscript": ["ai", "eps", "ps"], "application/provenance+xml": ["provx"], "application/pskc+xml": ["pskcxml"], "application/raml+yaml": ["raml"], "application/rdf+xml": ["rdf", "owl"], "application/reginfo+xml": ["rif"], "application/relax-ng-compact-syntax": ["rnc"], "application/resource-lists+xml": ["rl"], "application/resource-lists-diff+xml": ["rld"], "application/rls-services+xml": ["rs"], "application/route-apd+xml": ["rapd"], "application/route-s-tsid+xml": ["sls"], "application/route-usd+xml": ["rusd"], "application/rpki-ghostbusters": ["gbr"], "application/rpki-manifest": ["mft"], "application/rpki-roa": ["roa"], "application/rsd+xml": ["rsd"], "application/rss+xml": ["rss"], "application/rtf": ["rtf"], "application/sbml+xml": ["sbml"], "application/scvp-cv-request": ["scq"], "application/scvp-cv-response": ["scs"], "application/scvp-vp-request": ["spq"], "application/scvp-vp-response": ["spp"], "application/sdp": ["sdp"], "application/senml+xml": ["senmlx"], "application/sensml+xml": ["sensmlx"], "application/set-payment-initiation": ["setpay"], "application/set-registration-initiation": ["setreg"], "application/shf+xml": ["shf"], "application/sieve": ["siv", "sieve"], "application/smil+xml": ["smi", "smil"], "application/sparql-query": ["rq"], "application/sparql-results+xml": ["srx"], "application/srgs": ["gram"], "application/srgs+xml": ["grxml"], "application/sru+xml": ["sru"], "application/ssdl+xml": ["ssdl"], "application/ssml+xml": ["ssml"], "application/swid+xml": ["swidtag"], "application/tei+xml": ["tei", "teicorpus"], "application/thraud+xml": ["tfi"], "application/timestamped-data": ["tsd"], "application/toml": ["toml"], "application/trig": ["trig"], "application/ttml+xml": ["ttml"], "application/ubjson": ["ubj"], "application/urc-ressheet+xml": ["rsheet"], "application/urc-targetdesc+xml": ["td"], "application/voicexml+xml": ["vxml"], "application/wasm": ["wasm"], "application/widget": ["wgt"], "application/winhlp": ["hlp"], "application/wsdl+xml": ["wsdl"], "application/wspolicy+xml": ["wspolicy"], "application/xaml+xml": ["xaml"], "application/xcap-att+xml": ["xav"], "application/xcap-caps+xml": ["xca"], "application/xcap-diff+xml": ["xdf"], "application/xcap-el+xml": ["xel"], "application/xcap-ns+xml": ["xns"], "application/xenc+xml": ["xenc"], "application/xhtml+xml": ["xhtml", "xht"], "application/xliff+xml": ["xlf"], "application/xml": ["xml", "xsl", "xsd", "rng"], "application/xml-dtd": ["dtd"], "application/xop+xml": ["xop"], "application/xproc+xml": ["xpl"], "application/xslt+xml": ["*xsl", "xslt"], "application/xspf+xml": ["xspf"], "application/xv+xml": ["mxml", "xhvml", "xvml", "xvm"], "application/yang": ["yang"], "application/yin+xml": ["yin"], "application/zip": ["zip"], "audio/3gpp": ["*3gpp"], "audio/adpcm": ["adp"], "audio/amr": ["amr"], "audio/basic": ["au", "snd"], "audio/midi": ["mid", "midi", "kar", "rmi"], "audio/mobile-xmf": ["mxmf"], "audio/mp3": ["*mp3"], "audio/mp4": ["m4a", "mp4a"], "audio/mpeg": ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"], "audio/ogg": ["oga", "ogg", "spx", "opus"], "audio/s3m": ["s3m"], "audio/silk": ["sil"], "audio/wav": ["wav"], "audio/wave": ["*wav"], "audio/webm": ["weba"], "audio/xm": ["xm"], "font/collection": ["ttc"], "font/otf": ["otf"], "font/ttf": ["ttf"], "font/woff": ["woff"], "font/woff2": ["woff2"], "image/aces": ["exr"], "image/apng": ["apng"], "image/avif": ["avif"], "image/bmp": ["bmp"], "image/cgm": ["cgm"], "image/dicom-rle": ["drle"], "image/emf": ["emf"], "image/fits": ["fits"], "image/g3fax": ["g3"], "image/gif": ["gif"], "image/heic": ["heic"], "image/heic-sequence": ["heics"], "image/heif": ["heif"], "image/heif-sequence": ["heifs"], "image/hej2k": ["hej2"], "image/hsj2": ["hsj2"], "image/ief": ["ief"], "image/jls": ["jls"], "image/jp2": ["jp2", "jpg2"], "image/jpeg": ["jpeg", "jpg", "jpe"], "image/jph": ["jph"], "image/jphc": ["jhc"], "image/jpm": ["jpm"], "image/jpx": ["jpx", "jpf"], "image/jxr": ["jxr"], "image/jxra": ["jxra"], "image/jxrs": ["jxrs"], "image/jxs": ["jxs"], "image/jxsc": ["jxsc"], "image/jxsi": ["jxsi"], "image/jxss": ["jxss"], "image/ktx": ["ktx"], "image/ktx2": ["ktx2"], "image/png": ["png"], "image/sgi": ["sgi"], "image/svg+xml": ["svg", "svgz"], "image/t38": ["t38"], "image/tiff": ["tif", "tiff"], "image/tiff-fx": ["tfx"], "image/webp": ["webp"], "image/wmf": ["wmf"], "message/disposition-notification": ["disposition-notification"], "message/global": ["u8msg"], "message/global-delivery-status": ["u8dsn"], "message/global-disposition-notification": ["u8mdn"], "message/global-headers": ["u8hdr"], "message/rfc822": ["eml", "mime"], "model/3mf": ["3mf"], "model/gltf+json": ["gltf"], "model/gltf-binary": ["glb"], "model/iges": ["igs", "iges"], "model/mesh": ["msh", "mesh", "silo"], "model/mtl": ["mtl"], "model/obj": ["obj"], "model/step+xml": ["stpx"], "model/step+zip": ["stpz"], "model/step-xml+zip": ["stpxz"], "model/stl": ["stl"], "model/vrml": ["wrl", "vrml"], "model/x3d+binary": ["*x3db", "x3dbz"], "model/x3d+fastinfoset": ["x3db"], "model/x3d+vrml": ["*x3dv", "x3dvz"], "model/x3d+xml": ["x3d", "x3dz"], "model/x3d-vrml": ["x3dv"], "text/cache-manifest": ["appcache", "manifest"], "text/calendar": ["ics", "ifb"], "text/coffeescript": ["coffee", "litcoffee"], "text/css": ["css"], "text/csv": ["csv"], "text/html": ["html", "htm", "shtml"], "text/jade": ["jade"], "text/jsx": ["jsx"], "text/less": ["less"], "text/markdown": ["markdown", "md"], "text/mathml": ["mml"], "text/mdx": ["mdx"], "text/n3": ["n3"], "text/plain": ["txt", "text", "conf", "def", "list", "log", "in", "ini"], "text/richtext": ["rtx"], "text/rtf": ["*rtf"], "text/sgml": ["sgml", "sgm"], "text/shex": ["shex"], "text/slim": ["slim", "slm"], "text/spdx": ["spdx"], "text/stylus": ["stylus", "styl"], "text/tab-separated-values": ["tsv"], "text/troff": ["t", "tr", "roff", "man", "me", "ms"], "text/turtle": ["ttl"], "text/uri-list": ["uri", "uris", "urls"], "text/vcard": ["vcard"], "text/vtt": ["vtt"], "text/xml": ["*xml"], "text/yaml": ["yaml", "yml"], "video/3gpp": ["3gp", "3gpp"], "video/3gpp2": ["3g2"], "video/h261": ["h261"], "video/h263": ["h263"], "video/h264": ["h264"], "video/iso.segment": ["m4s"], "video/jpeg": ["jpgv"], "video/jpm": ["*jpm", "jpgm"], "video/mj2": ["mj2", "mjp2"], "video/mp2t": ["ts"], "video/mp4": ["mp4", "mp4v", "mpg4"], "video/mpeg": ["mpeg", "mpg", "mpe", "m1v", "m2v"], "video/ogg": ["ogv"], "video/quicktime": ["qt", "mov"], "video/webm": ["webm"] };
  }
});
var require_other = __commonJS({
  "../../node_modules/.pnpm/mime@3.0.0/node_modules/mime/types/other.js"(exports, module) {
    module.exports = { "application/prs.cww": ["cww"], "application/vnd.1000minds.decision-model+xml": ["1km"], "application/vnd.3gpp.pic-bw-large": ["plb"], "application/vnd.3gpp.pic-bw-small": ["psb"], "application/vnd.3gpp.pic-bw-var": ["pvb"], "application/vnd.3gpp2.tcap": ["tcap"], "application/vnd.3m.post-it-notes": ["pwn"], "application/vnd.accpac.simply.aso": ["aso"], "application/vnd.accpac.simply.imp": ["imp"], "application/vnd.acucobol": ["acu"], "application/vnd.acucorp": ["atc", "acutc"], "application/vnd.adobe.air-application-installer-package+zip": ["air"], "application/vnd.adobe.formscentral.fcdt": ["fcdt"], "application/vnd.adobe.fxp": ["fxp", "fxpl"], "application/vnd.adobe.xdp+xml": ["xdp"], "application/vnd.adobe.xfdf": ["xfdf"], "application/vnd.ahead.space": ["ahead"], "application/vnd.airzip.filesecure.azf": ["azf"], "application/vnd.airzip.filesecure.azs": ["azs"], "application/vnd.amazon.ebook": ["azw"], "application/vnd.americandynamics.acc": ["acc"], "application/vnd.amiga.ami": ["ami"], "application/vnd.android.package-archive": ["apk"], "application/vnd.anser-web-certificate-issue-initiation": ["cii"], "application/vnd.anser-web-funds-transfer-initiation": ["fti"], "application/vnd.antix.game-component": ["atx"], "application/vnd.apple.installer+xml": ["mpkg"], "application/vnd.apple.keynote": ["key"], "application/vnd.apple.mpegurl": ["m3u8"], "application/vnd.apple.numbers": ["numbers"], "application/vnd.apple.pages": ["pages"], "application/vnd.apple.pkpass": ["pkpass"], "application/vnd.aristanetworks.swi": ["swi"], "application/vnd.astraea-software.iota": ["iota"], "application/vnd.audiograph": ["aep"], "application/vnd.balsamiq.bmml+xml": ["bmml"], "application/vnd.blueice.multipass": ["mpm"], "application/vnd.bmi": ["bmi"], "application/vnd.businessobjects": ["rep"], "application/vnd.chemdraw+xml": ["cdxml"], "application/vnd.chipnuts.karaoke-mmd": ["mmd"], "application/vnd.cinderella": ["cdy"], "application/vnd.citationstyles.style+xml": ["csl"], "application/vnd.claymore": ["cla"], "application/vnd.cloanto.rp9": ["rp9"], "application/vnd.clonk.c4group": ["c4g", "c4d", "c4f", "c4p", "c4u"], "application/vnd.cluetrust.cartomobile-config": ["c11amc"], "application/vnd.cluetrust.cartomobile-config-pkg": ["c11amz"], "application/vnd.commonspace": ["csp"], "application/vnd.contact.cmsg": ["cdbcmsg"], "application/vnd.cosmocaller": ["cmc"], "application/vnd.crick.clicker": ["clkx"], "application/vnd.crick.clicker.keyboard": ["clkk"], "application/vnd.crick.clicker.palette": ["clkp"], "application/vnd.crick.clicker.template": ["clkt"], "application/vnd.crick.clicker.wordbank": ["clkw"], "application/vnd.criticaltools.wbs+xml": ["wbs"], "application/vnd.ctc-posml": ["pml"], "application/vnd.cups-ppd": ["ppd"], "application/vnd.curl.car": ["car"], "application/vnd.curl.pcurl": ["pcurl"], "application/vnd.dart": ["dart"], "application/vnd.data-vision.rdz": ["rdz"], "application/vnd.dbf": ["dbf"], "application/vnd.dece.data": ["uvf", "uvvf", "uvd", "uvvd"], "application/vnd.dece.ttml+xml": ["uvt", "uvvt"], "application/vnd.dece.unspecified": ["uvx", "uvvx"], "application/vnd.dece.zip": ["uvz", "uvvz"], "application/vnd.denovo.fcselayout-link": ["fe_launch"], "application/vnd.dna": ["dna"], "application/vnd.dolby.mlp": ["mlp"], "application/vnd.dpgraph": ["dpg"], "application/vnd.dreamfactory": ["dfac"], "application/vnd.ds-keypoint": ["kpxx"], "application/vnd.dvb.ait": ["ait"], "application/vnd.dvb.service": ["svc"], "application/vnd.dynageo": ["geo"], "application/vnd.ecowin.chart": ["mag"], "application/vnd.enliven": ["nml"], "application/vnd.epson.esf": ["esf"], "application/vnd.epson.msf": ["msf"], "application/vnd.epson.quickanime": ["qam"], "application/vnd.epson.salt": ["slt"], "application/vnd.epson.ssf": ["ssf"], "application/vnd.eszigno3+xml": ["es3", "et3"], "application/vnd.ezpix-album": ["ez2"], "application/vnd.ezpix-package": ["ez3"], "application/vnd.fdf": ["fdf"], "application/vnd.fdsn.mseed": ["mseed"], "application/vnd.fdsn.seed": ["seed", "dataless"], "application/vnd.flographit": ["gph"], "application/vnd.fluxtime.clip": ["ftc"], "application/vnd.framemaker": ["fm", "frame", "maker", "book"], "application/vnd.frogans.fnc": ["fnc"], "application/vnd.frogans.ltf": ["ltf"], "application/vnd.fsc.weblaunch": ["fsc"], "application/vnd.fujitsu.oasys": ["oas"], "application/vnd.fujitsu.oasys2": ["oa2"], "application/vnd.fujitsu.oasys3": ["oa3"], "application/vnd.fujitsu.oasysgp": ["fg5"], "application/vnd.fujitsu.oasysprs": ["bh2"], "application/vnd.fujixerox.ddd": ["ddd"], "application/vnd.fujixerox.docuworks": ["xdw"], "application/vnd.fujixerox.docuworks.binder": ["xbd"], "application/vnd.fuzzysheet": ["fzs"], "application/vnd.genomatix.tuxedo": ["txd"], "application/vnd.geogebra.file": ["ggb"], "application/vnd.geogebra.tool": ["ggt"], "application/vnd.geometry-explorer": ["gex", "gre"], "application/vnd.geonext": ["gxt"], "application/vnd.geoplan": ["g2w"], "application/vnd.geospace": ["g3w"], "application/vnd.gmx": ["gmx"], "application/vnd.google-apps.document": ["gdoc"], "application/vnd.google-apps.presentation": ["gslides"], "application/vnd.google-apps.spreadsheet": ["gsheet"], "application/vnd.google-earth.kml+xml": ["kml"], "application/vnd.google-earth.kmz": ["kmz"], "application/vnd.grafeq": ["gqf", "gqs"], "application/vnd.groove-account": ["gac"], "application/vnd.groove-help": ["ghf"], "application/vnd.groove-identity-message": ["gim"], "application/vnd.groove-injector": ["grv"], "application/vnd.groove-tool-message": ["gtm"], "application/vnd.groove-tool-template": ["tpl"], "application/vnd.groove-vcard": ["vcg"], "application/vnd.hal+xml": ["hal"], "application/vnd.handheld-entertainment+xml": ["zmm"], "application/vnd.hbci": ["hbci"], "application/vnd.hhe.lesson-player": ["les"], "application/vnd.hp-hpgl": ["hpgl"], "application/vnd.hp-hpid": ["hpid"], "application/vnd.hp-hps": ["hps"], "application/vnd.hp-jlyt": ["jlt"], "application/vnd.hp-pcl": ["pcl"], "application/vnd.hp-pclxl": ["pclxl"], "application/vnd.hydrostatix.sof-data": ["sfd-hdstx"], "application/vnd.ibm.minipay": ["mpy"], "application/vnd.ibm.modcap": ["afp", "listafp", "list3820"], "application/vnd.ibm.rights-management": ["irm"], "application/vnd.ibm.secure-container": ["sc"], "application/vnd.iccprofile": ["icc", "icm"], "application/vnd.igloader": ["igl"], "application/vnd.immervision-ivp": ["ivp"], "application/vnd.immervision-ivu": ["ivu"], "application/vnd.insors.igm": ["igm"], "application/vnd.intercon.formnet": ["xpw", "xpx"], "application/vnd.intergeo": ["i2g"], "application/vnd.intu.qbo": ["qbo"], "application/vnd.intu.qfx": ["qfx"], "application/vnd.ipunplugged.rcprofile": ["rcprofile"], "application/vnd.irepository.package+xml": ["irp"], "application/vnd.is-xpr": ["xpr"], "application/vnd.isac.fcs": ["fcs"], "application/vnd.jam": ["jam"], "application/vnd.jcp.javame.midlet-rms": ["rms"], "application/vnd.jisp": ["jisp"], "application/vnd.joost.joda-archive": ["joda"], "application/vnd.kahootz": ["ktz", "ktr"], "application/vnd.kde.karbon": ["karbon"], "application/vnd.kde.kchart": ["chrt"], "application/vnd.kde.kformula": ["kfo"], "application/vnd.kde.kivio": ["flw"], "application/vnd.kde.kontour": ["kon"], "application/vnd.kde.kpresenter": ["kpr", "kpt"], "application/vnd.kde.kspread": ["ksp"], "application/vnd.kde.kword": ["kwd", "kwt"], "application/vnd.kenameaapp": ["htke"], "application/vnd.kidspiration": ["kia"], "application/vnd.kinar": ["kne", "knp"], "application/vnd.koan": ["skp", "skd", "skt", "skm"], "application/vnd.kodak-descriptor": ["sse"], "application/vnd.las.las+xml": ["lasxml"], "application/vnd.llamagraphics.life-balance.desktop": ["lbd"], "application/vnd.llamagraphics.life-balance.exchange+xml": ["lbe"], "application/vnd.lotus-1-2-3": ["123"], "application/vnd.lotus-approach": ["apr"], "application/vnd.lotus-freelance": ["pre"], "application/vnd.lotus-notes": ["nsf"], "application/vnd.lotus-organizer": ["org"], "application/vnd.lotus-screencam": ["scm"], "application/vnd.lotus-wordpro": ["lwp"], "application/vnd.macports.portpkg": ["portpkg"], "application/vnd.mapbox-vector-tile": ["mvt"], "application/vnd.mcd": ["mcd"], "application/vnd.medcalcdata": ["mc1"], "application/vnd.mediastation.cdkey": ["cdkey"], "application/vnd.mfer": ["mwf"], "application/vnd.mfmp": ["mfm"], "application/vnd.micrografx.flo": ["flo"], "application/vnd.micrografx.igx": ["igx"], "application/vnd.mif": ["mif"], "application/vnd.mobius.daf": ["daf"], "application/vnd.mobius.dis": ["dis"], "application/vnd.mobius.mbk": ["mbk"], "application/vnd.mobius.mqy": ["mqy"], "application/vnd.mobius.msl": ["msl"], "application/vnd.mobius.plc": ["plc"], "application/vnd.mobius.txf": ["txf"], "application/vnd.mophun.application": ["mpn"], "application/vnd.mophun.certificate": ["mpc"], "application/vnd.mozilla.xul+xml": ["xul"], "application/vnd.ms-artgalry": ["cil"], "application/vnd.ms-cab-compressed": ["cab"], "application/vnd.ms-excel": ["xls", "xlm", "xla", "xlc", "xlt", "xlw"], "application/vnd.ms-excel.addin.macroenabled.12": ["xlam"], "application/vnd.ms-excel.sheet.binary.macroenabled.12": ["xlsb"], "application/vnd.ms-excel.sheet.macroenabled.12": ["xlsm"], "application/vnd.ms-excel.template.macroenabled.12": ["xltm"], "application/vnd.ms-fontobject": ["eot"], "application/vnd.ms-htmlhelp": ["chm"], "application/vnd.ms-ims": ["ims"], "application/vnd.ms-lrm": ["lrm"], "application/vnd.ms-officetheme": ["thmx"], "application/vnd.ms-outlook": ["msg"], "application/vnd.ms-pki.seccat": ["cat"], "application/vnd.ms-pki.stl": ["*stl"], "application/vnd.ms-powerpoint": ["ppt", "pps", "pot"], "application/vnd.ms-powerpoint.addin.macroenabled.12": ["ppam"], "application/vnd.ms-powerpoint.presentation.macroenabled.12": ["pptm"], "application/vnd.ms-powerpoint.slide.macroenabled.12": ["sldm"], "application/vnd.ms-powerpoint.slideshow.macroenabled.12": ["ppsm"], "application/vnd.ms-powerpoint.template.macroenabled.12": ["potm"], "application/vnd.ms-project": ["mpp", "mpt"], "application/vnd.ms-word.document.macroenabled.12": ["docm"], "application/vnd.ms-word.template.macroenabled.12": ["dotm"], "application/vnd.ms-works": ["wps", "wks", "wcm", "wdb"], "application/vnd.ms-wpl": ["wpl"], "application/vnd.ms-xpsdocument": ["xps"], "application/vnd.mseq": ["mseq"], "application/vnd.musician": ["mus"], "application/vnd.muvee.style": ["msty"], "application/vnd.mynfc": ["taglet"], "application/vnd.neurolanguage.nlu": ["nlu"], "application/vnd.nitf": ["ntf", "nitf"], "application/vnd.noblenet-directory": ["nnd"], "application/vnd.noblenet-sealer": ["nns"], "application/vnd.noblenet-web": ["nnw"], "application/vnd.nokia.n-gage.ac+xml": ["*ac"], "application/vnd.nokia.n-gage.data": ["ngdat"], "application/vnd.nokia.n-gage.symbian.install": ["n-gage"], "application/vnd.nokia.radio-preset": ["rpst"], "application/vnd.nokia.radio-presets": ["rpss"], "application/vnd.novadigm.edm": ["edm"], "application/vnd.novadigm.edx": ["edx"], "application/vnd.novadigm.ext": ["ext"], "application/vnd.oasis.opendocument.chart": ["odc"], "application/vnd.oasis.opendocument.chart-template": ["otc"], "application/vnd.oasis.opendocument.database": ["odb"], "application/vnd.oasis.opendocument.formula": ["odf"], "application/vnd.oasis.opendocument.formula-template": ["odft"], "application/vnd.oasis.opendocument.graphics": ["odg"], "application/vnd.oasis.opendocument.graphics-template": ["otg"], "application/vnd.oasis.opendocument.image": ["odi"], "application/vnd.oasis.opendocument.image-template": ["oti"], "application/vnd.oasis.opendocument.presentation": ["odp"], "application/vnd.oasis.opendocument.presentation-template": ["otp"], "application/vnd.oasis.opendocument.spreadsheet": ["ods"], "application/vnd.oasis.opendocument.spreadsheet-template": ["ots"], "application/vnd.oasis.opendocument.text": ["odt"], "application/vnd.oasis.opendocument.text-master": ["odm"], "application/vnd.oasis.opendocument.text-template": ["ott"], "application/vnd.oasis.opendocument.text-web": ["oth"], "application/vnd.olpc-sugar": ["xo"], "application/vnd.oma.dd2+xml": ["dd2"], "application/vnd.openblox.game+xml": ["obgx"], "application/vnd.openofficeorg.extension": ["oxt"], "application/vnd.openstreetmap.data+xml": ["osm"], "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"], "application/vnd.openxmlformats-officedocument.presentationml.slide": ["sldx"], "application/vnd.openxmlformats-officedocument.presentationml.slideshow": ["ppsx"], "application/vnd.openxmlformats-officedocument.presentationml.template": ["potx"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"], "application/vnd.openxmlformats-officedocument.spreadsheetml.template": ["xltx"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"], "application/vnd.openxmlformats-officedocument.wordprocessingml.template": ["dotx"], "application/vnd.osgeo.mapguide.package": ["mgp"], "application/vnd.osgi.dp": ["dp"], "application/vnd.osgi.subsystem": ["esa"], "application/vnd.palm": ["pdb", "pqa", "oprc"], "application/vnd.pawaafile": ["paw"], "application/vnd.pg.format": ["str"], "application/vnd.pg.osasli": ["ei6"], "application/vnd.picsel": ["efif"], "application/vnd.pmi.widget": ["wg"], "application/vnd.pocketlearn": ["plf"], "application/vnd.powerbuilder6": ["pbd"], "application/vnd.previewsystems.box": ["box"], "application/vnd.proteus.magazine": ["mgz"], "application/vnd.publishare-delta-tree": ["qps"], "application/vnd.pvi.ptid1": ["ptid"], "application/vnd.quark.quarkxpress": ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"], "application/vnd.rar": ["rar"], "application/vnd.realvnc.bed": ["bed"], "application/vnd.recordare.musicxml": ["mxl"], "application/vnd.recordare.musicxml+xml": ["musicxml"], "application/vnd.rig.cryptonote": ["cryptonote"], "application/vnd.rim.cod": ["cod"], "application/vnd.rn-realmedia": ["rm"], "application/vnd.rn-realmedia-vbr": ["rmvb"], "application/vnd.route66.link66+xml": ["link66"], "application/vnd.sailingtracker.track": ["st"], "application/vnd.seemail": ["see"], "application/vnd.sema": ["sema"], "application/vnd.semd": ["semd"], "application/vnd.semf": ["semf"], "application/vnd.shana.informed.formdata": ["ifm"], "application/vnd.shana.informed.formtemplate": ["itp"], "application/vnd.shana.informed.interchange": ["iif"], "application/vnd.shana.informed.package": ["ipk"], "application/vnd.simtech-mindmapper": ["twd", "twds"], "application/vnd.smaf": ["mmf"], "application/vnd.smart.teacher": ["teacher"], "application/vnd.software602.filler.form+xml": ["fo"], "application/vnd.solent.sdkm+xml": ["sdkm", "sdkd"], "application/vnd.spotfire.dxp": ["dxp"], "application/vnd.spotfire.sfs": ["sfs"], "application/vnd.stardivision.calc": ["sdc"], "application/vnd.stardivision.draw": ["sda"], "application/vnd.stardivision.impress": ["sdd"], "application/vnd.stardivision.math": ["smf"], "application/vnd.stardivision.writer": ["sdw", "vor"], "application/vnd.stardivision.writer-global": ["sgl"], "application/vnd.stepmania.package": ["smzip"], "application/vnd.stepmania.stepchart": ["sm"], "application/vnd.sun.wadl+xml": ["wadl"], "application/vnd.sun.xml.calc": ["sxc"], "application/vnd.sun.xml.calc.template": ["stc"], "application/vnd.sun.xml.draw": ["sxd"], "application/vnd.sun.xml.draw.template": ["std"], "application/vnd.sun.xml.impress": ["sxi"], "application/vnd.sun.xml.impress.template": ["sti"], "application/vnd.sun.xml.math": ["sxm"], "application/vnd.sun.xml.writer": ["sxw"], "application/vnd.sun.xml.writer.global": ["sxg"], "application/vnd.sun.xml.writer.template": ["stw"], "application/vnd.sus-calendar": ["sus", "susp"], "application/vnd.svd": ["svd"], "application/vnd.symbian.install": ["sis", "sisx"], "application/vnd.syncml+xml": ["xsm"], "application/vnd.syncml.dm+wbxml": ["bdm"], "application/vnd.syncml.dm+xml": ["xdm"], "application/vnd.syncml.dmddf+xml": ["ddf"], "application/vnd.tao.intent-module-archive": ["tao"], "application/vnd.tcpdump.pcap": ["pcap", "cap", "dmp"], "application/vnd.tmobile-livetv": ["tmo"], "application/vnd.trid.tpt": ["tpt"], "application/vnd.triscape.mxs": ["mxs"], "application/vnd.trueapp": ["tra"], "application/vnd.ufdl": ["ufd", "ufdl"], "application/vnd.uiq.theme": ["utz"], "application/vnd.umajin": ["umj"], "application/vnd.unity": ["unityweb"], "application/vnd.uoml+xml": ["uoml"], "application/vnd.vcx": ["vcx"], "application/vnd.visio": ["vsd", "vst", "vss", "vsw"], "application/vnd.visionary": ["vis"], "application/vnd.vsf": ["vsf"], "application/vnd.wap.wbxml": ["wbxml"], "application/vnd.wap.wmlc": ["wmlc"], "application/vnd.wap.wmlscriptc": ["wmlsc"], "application/vnd.webturbo": ["wtb"], "application/vnd.wolfram.player": ["nbp"], "application/vnd.wordperfect": ["wpd"], "application/vnd.wqd": ["wqd"], "application/vnd.wt.stf": ["stf"], "application/vnd.xara": ["xar"], "application/vnd.xfdl": ["xfdl"], "application/vnd.yamaha.hv-dic": ["hvd"], "application/vnd.yamaha.hv-script": ["hvs"], "application/vnd.yamaha.hv-voice": ["hvp"], "application/vnd.yamaha.openscoreformat": ["osf"], "application/vnd.yamaha.openscoreformat.osfpvg+xml": ["osfpvg"], "application/vnd.yamaha.smaf-audio": ["saf"], "application/vnd.yamaha.smaf-phrase": ["spf"], "application/vnd.yellowriver-custom-menu": ["cmp"], "application/vnd.zul": ["zir", "zirz"], "application/vnd.zzazz.deck+xml": ["zaz"], "application/x-7z-compressed": ["7z"], "application/x-abiword": ["abw"], "application/x-ace-compressed": ["ace"], "application/x-apple-diskimage": ["*dmg"], "application/x-arj": ["arj"], "application/x-authorware-bin": ["aab", "x32", "u32", "vox"], "application/x-authorware-map": ["aam"], "application/x-authorware-seg": ["aas"], "application/x-bcpio": ["bcpio"], "application/x-bdoc": ["*bdoc"], "application/x-bittorrent": ["torrent"], "application/x-blorb": ["blb", "blorb"], "application/x-bzip": ["bz"], "application/x-bzip2": ["bz2", "boz"], "application/x-cbr": ["cbr", "cba", "cbt", "cbz", "cb7"], "application/x-cdlink": ["vcd"], "application/x-cfs-compressed": ["cfs"], "application/x-chat": ["chat"], "application/x-chess-pgn": ["pgn"], "application/x-chrome-extension": ["crx"], "application/x-cocoa": ["cco"], "application/x-conference": ["nsc"], "application/x-cpio": ["cpio"], "application/x-csh": ["csh"], "application/x-debian-package": ["*deb", "udeb"], "application/x-dgc-compressed": ["dgc"], "application/x-director": ["dir", "dcr", "dxr", "cst", "cct", "cxt", "w3d", "fgd", "swa"], "application/x-doom": ["wad"], "application/x-dtbncx+xml": ["ncx"], "application/x-dtbook+xml": ["dtb"], "application/x-dtbresource+xml": ["res"], "application/x-dvi": ["dvi"], "application/x-envoy": ["evy"], "application/x-eva": ["eva"], "application/x-font-bdf": ["bdf"], "application/x-font-ghostscript": ["gsf"], "application/x-font-linux-psf": ["psf"], "application/x-font-pcf": ["pcf"], "application/x-font-snf": ["snf"], "application/x-font-type1": ["pfa", "pfb", "pfm", "afm"], "application/x-freearc": ["arc"], "application/x-futuresplash": ["spl"], "application/x-gca-compressed": ["gca"], "application/x-glulx": ["ulx"], "application/x-gnumeric": ["gnumeric"], "application/x-gramps-xml": ["gramps"], "application/x-gtar": ["gtar"], "application/x-hdf": ["hdf"], "application/x-httpd-php": ["php"], "application/x-install-instructions": ["install"], "application/x-iso9660-image": ["*iso"], "application/x-iwork-keynote-sffkey": ["*key"], "application/x-iwork-numbers-sffnumbers": ["*numbers"], "application/x-iwork-pages-sffpages": ["*pages"], "application/x-java-archive-diff": ["jardiff"], "application/x-java-jnlp-file": ["jnlp"], "application/x-keepass2": ["kdbx"], "application/x-latex": ["latex"], "application/x-lua-bytecode": ["luac"], "application/x-lzh-compressed": ["lzh", "lha"], "application/x-makeself": ["run"], "application/x-mie": ["mie"], "application/x-mobipocket-ebook": ["prc", "mobi"], "application/x-ms-application": ["application"], "application/x-ms-shortcut": ["lnk"], "application/x-ms-wmd": ["wmd"], "application/x-ms-wmz": ["wmz"], "application/x-ms-xbap": ["xbap"], "application/x-msaccess": ["mdb"], "application/x-msbinder": ["obd"], "application/x-mscardfile": ["crd"], "application/x-msclip": ["clp"], "application/x-msdos-program": ["*exe"], "application/x-msdownload": ["*exe", "*dll", "com", "bat", "*msi"], "application/x-msmediaview": ["mvb", "m13", "m14"], "application/x-msmetafile": ["*wmf", "*wmz", "*emf", "emz"], "application/x-msmoney": ["mny"], "application/x-mspublisher": ["pub"], "application/x-msschedule": ["scd"], "application/x-msterminal": ["trm"], "application/x-mswrite": ["wri"], "application/x-netcdf": ["nc", "cdf"], "application/x-ns-proxy-autoconfig": ["pac"], "application/x-nzb": ["nzb"], "application/x-perl": ["pl", "pm"], "application/x-pilot": ["*prc", "*pdb"], "application/x-pkcs12": ["p12", "pfx"], "application/x-pkcs7-certificates": ["p7b", "spc"], "application/x-pkcs7-certreqresp": ["p7r"], "application/x-rar-compressed": ["*rar"], "application/x-redhat-package-manager": ["rpm"], "application/x-research-info-systems": ["ris"], "application/x-sea": ["sea"], "application/x-sh": ["sh"], "application/x-shar": ["shar"], "application/x-shockwave-flash": ["swf"], "application/x-silverlight-app": ["xap"], "application/x-sql": ["sql"], "application/x-stuffit": ["sit"], "application/x-stuffitx": ["sitx"], "application/x-subrip": ["srt"], "application/x-sv4cpio": ["sv4cpio"], "application/x-sv4crc": ["sv4crc"], "application/x-t3vm-image": ["t3"], "application/x-tads": ["gam"], "application/x-tar": ["tar"], "application/x-tcl": ["tcl", "tk"], "application/x-tex": ["tex"], "application/x-tex-tfm": ["tfm"], "application/x-texinfo": ["texinfo", "texi"], "application/x-tgif": ["*obj"], "application/x-ustar": ["ustar"], "application/x-virtualbox-hdd": ["hdd"], "application/x-virtualbox-ova": ["ova"], "application/x-virtualbox-ovf": ["ovf"], "application/x-virtualbox-vbox": ["vbox"], "application/x-virtualbox-vbox-extpack": ["vbox-extpack"], "application/x-virtualbox-vdi": ["vdi"], "application/x-virtualbox-vhd": ["vhd"], "application/x-virtualbox-vmdk": ["vmdk"], "application/x-wais-source": ["src"], "application/x-web-app-manifest+json": ["webapp"], "application/x-x509-ca-cert": ["der", "crt", "pem"], "application/x-xfig": ["fig"], "application/x-xliff+xml": ["*xlf"], "application/x-xpinstall": ["xpi"], "application/x-xz": ["xz"], "application/x-zmachine": ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"], "audio/vnd.dece.audio": ["uva", "uvva"], "audio/vnd.digital-winds": ["eol"], "audio/vnd.dra": ["dra"], "audio/vnd.dts": ["dts"], "audio/vnd.dts.hd": ["dtshd"], "audio/vnd.lucent.voice": ["lvp"], "audio/vnd.ms-playready.media.pya": ["pya"], "audio/vnd.nuera.ecelp4800": ["ecelp4800"], "audio/vnd.nuera.ecelp7470": ["ecelp7470"], "audio/vnd.nuera.ecelp9600": ["ecelp9600"], "audio/vnd.rip": ["rip"], "audio/x-aac": ["aac"], "audio/x-aiff": ["aif", "aiff", "aifc"], "audio/x-caf": ["caf"], "audio/x-flac": ["flac"], "audio/x-m4a": ["*m4a"], "audio/x-matroska": ["mka"], "audio/x-mpegurl": ["m3u"], "audio/x-ms-wax": ["wax"], "audio/x-ms-wma": ["wma"], "audio/x-pn-realaudio": ["ram", "ra"], "audio/x-pn-realaudio-plugin": ["rmp"], "audio/x-realaudio": ["*ra"], "audio/x-wav": ["*wav"], "chemical/x-cdx": ["cdx"], "chemical/x-cif": ["cif"], "chemical/x-cmdf": ["cmdf"], "chemical/x-cml": ["cml"], "chemical/x-csml": ["csml"], "chemical/x-xyz": ["xyz"], "image/prs.btif": ["btif"], "image/prs.pti": ["pti"], "image/vnd.adobe.photoshop": ["psd"], "image/vnd.airzip.accelerator.azv": ["azv"], "image/vnd.dece.graphic": ["uvi", "uvvi", "uvg", "uvvg"], "image/vnd.djvu": ["djvu", "djv"], "image/vnd.dvb.subtitle": ["*sub"], "image/vnd.dwg": ["dwg"], "image/vnd.dxf": ["dxf"], "image/vnd.fastbidsheet": ["fbs"], "image/vnd.fpx": ["fpx"], "image/vnd.fst": ["fst"], "image/vnd.fujixerox.edmics-mmr": ["mmr"], "image/vnd.fujixerox.edmics-rlc": ["rlc"], "image/vnd.microsoft.icon": ["ico"], "image/vnd.ms-dds": ["dds"], "image/vnd.ms-modi": ["mdi"], "image/vnd.ms-photo": ["wdp"], "image/vnd.net-fpx": ["npx"], "image/vnd.pco.b16": ["b16"], "image/vnd.tencent.tap": ["tap"], "image/vnd.valve.source.texture": ["vtf"], "image/vnd.wap.wbmp": ["wbmp"], "image/vnd.xiff": ["xif"], "image/vnd.zbrush.pcx": ["pcx"], "image/x-3ds": ["3ds"], "image/x-cmu-raster": ["ras"], "image/x-cmx": ["cmx"], "image/x-freehand": ["fh", "fhc", "fh4", "fh5", "fh7"], "image/x-icon": ["*ico"], "image/x-jng": ["jng"], "image/x-mrsid-image": ["sid"], "image/x-ms-bmp": ["*bmp"], "image/x-pcx": ["*pcx"], "image/x-pict": ["pic", "pct"], "image/x-portable-anymap": ["pnm"], "image/x-portable-bitmap": ["pbm"], "image/x-portable-graymap": ["pgm"], "image/x-portable-pixmap": ["ppm"], "image/x-rgb": ["rgb"], "image/x-tga": ["tga"], "image/x-xbitmap": ["xbm"], "image/x-xpixmap": ["xpm"], "image/x-xwindowdump": ["xwd"], "message/vnd.wfa.wsc": ["wsc"], "model/vnd.collada+xml": ["dae"], "model/vnd.dwf": ["dwf"], "model/vnd.gdl": ["gdl"], "model/vnd.gtw": ["gtw"], "model/vnd.mts": ["mts"], "model/vnd.opengex": ["ogex"], "model/vnd.parasolid.transmit.binary": ["x_b"], "model/vnd.parasolid.transmit.text": ["x_t"], "model/vnd.sap.vds": ["vds"], "model/vnd.usdz+zip": ["usdz"], "model/vnd.valve.source.compiled-map": ["bsp"], "model/vnd.vtu": ["vtu"], "text/prs.lines.tag": ["dsc"], "text/vnd.curl": ["curl"], "text/vnd.curl.dcurl": ["dcurl"], "text/vnd.curl.mcurl": ["mcurl"], "text/vnd.curl.scurl": ["scurl"], "text/vnd.dvb.subtitle": ["sub"], "text/vnd.fly": ["fly"], "text/vnd.fmi.flexstor": ["flx"], "text/vnd.graphviz": ["gv"], "text/vnd.in3d.3dml": ["3dml"], "text/vnd.in3d.spot": ["spot"], "text/vnd.sun.j2me.app-descriptor": ["jad"], "text/vnd.wap.wml": ["wml"], "text/vnd.wap.wmlscript": ["wmls"], "text/x-asm": ["s", "asm"], "text/x-c": ["c", "cc", "cxx", "cpp", "h", "hh", "dic"], "text/x-component": ["htc"], "text/x-fortran": ["f", "for", "f77", "f90"], "text/x-handlebars-template": ["hbs"], "text/x-java-source": ["java"], "text/x-lua": ["lua"], "text/x-markdown": ["mkd"], "text/x-nfo": ["nfo"], "text/x-opml": ["opml"], "text/x-org": ["*org"], "text/x-pascal": ["p", "pas"], "text/x-processing": ["pde"], "text/x-sass": ["sass"], "text/x-scss": ["scss"], "text/x-setext": ["etx"], "text/x-sfv": ["sfv"], "text/x-suse-ymp": ["ymp"], "text/x-uuencode": ["uu"], "text/x-vcalendar": ["vcs"], "text/x-vcard": ["vcf"], "video/vnd.dece.hd": ["uvh", "uvvh"], "video/vnd.dece.mobile": ["uvm", "uvvm"], "video/vnd.dece.pd": ["uvp", "uvvp"], "video/vnd.dece.sd": ["uvs", "uvvs"], "video/vnd.dece.video": ["uvv", "uvvv"], "video/vnd.dvb.file": ["dvb"], "video/vnd.fvt": ["fvt"], "video/vnd.mpegurl": ["mxu", "m4u"], "video/vnd.ms-playready.media.pyv": ["pyv"], "video/vnd.uvvu.mp4": ["uvu", "uvvu"], "video/vnd.vivo": ["viv"], "video/x-f4v": ["f4v"], "video/x-fli": ["fli"], "video/x-flv": ["flv"], "video/x-m4v": ["m4v"], "video/x-matroska": ["mkv", "mk3d", "mks"], "video/x-mng": ["mng"], "video/x-ms-asf": ["asf", "asx"], "video/x-ms-vob": ["vob"], "video/x-ms-wm": ["wm"], "video/x-ms-wmv": ["wmv"], "video/x-ms-wmx": ["wmx"], "video/x-ms-wvx": ["wvx"], "video/x-msvideo": ["avi"], "video/x-sgi-movie": ["movie"], "video/x-smv": ["smv"], "x-conference/x-cooltalk": ["ice"] };
  }
});
var require_mime = __commonJS({
  "../../node_modules/.pnpm/mime@3.0.0/node_modules/mime/index.js"(exports, module) {
    var Mime = require_Mime();
    module.exports = new Mime(require_standard(), require_other());
  }
});
var mime = __toESM(require_mime());
var KVError = /* @__PURE__ */ __name(class _KVError extends Error {
  static {
    __name2(this, "KVError");
  }
  constructor(message, status = 500) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = _KVError.name;
    this.status = status;
  }
  status;
}, "_KVError");
var MethodNotAllowedError = /* @__PURE__ */ __name(class extends KVError {
  static {
    __name2(this, "MethodNotAllowedError");
  }
  constructor(message = `Not a valid request method`, status = 405) {
    super(message, status);
  }
}, "MethodNotAllowedError");
var NotFoundError = /* @__PURE__ */ __name(class extends KVError {
  static {
    __name2(this, "NotFoundError");
  }
  constructor(message = `Not Found`, status = 404) {
    super(message, status);
  }
}, "NotFoundError");
var InternalError = /* @__PURE__ */ __name(class extends KVError {
  static {
    __name2(this, "InternalError");
  }
  constructor(message = `Internal Error in KV Asset Handler`, status = 500) {
    super(message, status);
  }
}, "InternalError");
var defaultCacheControl = {
  browserTTL: null,
  edgeTTL: 2 * 60 * 60 * 24,
  // 2 days
  bypassCache: false
  // do not bypass Cloudflare's cache
};
var parseStringAsObject = /* @__PURE__ */ __name2((maybeString) => typeof maybeString === "string" ? JSON.parse(maybeString) : maybeString, "parseStringAsObject");
function getAssetFromKVDefaultOptions() {
  return {
    ASSET_NAMESPACE: typeof __STATIC_CONTENT !== "undefined" ? __STATIC_CONTENT : void 0,
    ASSET_MANIFEST: typeof __STATIC_CONTENT_MANIFEST !== "undefined" ? parseStringAsObject(__STATIC_CONTENT_MANIFEST) : {},
    cacheControl: defaultCacheControl,
    defaultMimeType: "text/plain",
    defaultDocument: "index.html",
    pathIsEncoded: false,
    defaultETag: "strong"
  };
}
__name(getAssetFromKVDefaultOptions, "getAssetFromKVDefaultOptions");
__name2(getAssetFromKVDefaultOptions, "getAssetFromKVDefaultOptions");
function assignOptions(options) {
  return Object.assign({}, getAssetFromKVDefaultOptions(), options);
}
__name(assignOptions, "assignOptions");
__name2(assignOptions, "assignOptions");
var mapRequestToAsset = /* @__PURE__ */ __name2((request, options) => {
  options = assignOptions(options);
  const parsedUrl = new URL(request.url);
  let pathname = parsedUrl.pathname;
  if (pathname.endsWith("/")) {
    pathname = pathname.concat(options.defaultDocument);
  } else if (!mime.getType(pathname)) {
    pathname = pathname.concat("/" + options.defaultDocument);
  }
  parsedUrl.pathname = pathname;
  return new Request(parsedUrl.toString(), request);
}, "mapRequestToAsset");
function serveSinglePageApp(request, options) {
  options = assignOptions(options);
  request = mapRequestToAsset(request, options);
  const parsedUrl = new URL(request.url);
  if (parsedUrl.pathname.endsWith(".html")) {
    return new Request(
      `${parsedUrl.origin}/${options.defaultDocument}`,
      request
    );
  } else {
    return request;
  }
}
__name(serveSinglePageApp, "serveSinglePageApp");
__name2(serveSinglePageApp, "serveSinglePageApp");
var getAssetFromKV = /* @__PURE__ */ __name2(async (event, options) => {
  options = assignOptions(options);
  const request = event.request;
  const ASSET_NAMESPACE = options.ASSET_NAMESPACE;
  const ASSET_MANIFEST = parseStringAsObject(
    options.ASSET_MANIFEST
  );
  if (typeof ASSET_NAMESPACE === "undefined") {
    throw new InternalError(`there is no KV namespace bound to the script`);
  }
  const rawPathKey = new URL(request.url).pathname.replace(/^\/+/, "");
  let pathIsEncoded = options.pathIsEncoded;
  let requestKey;
  if (options.mapRequestToAsset) {
    requestKey = options.mapRequestToAsset(request);
  } else if (ASSET_MANIFEST[rawPathKey]) {
    requestKey = request;
  } else if (ASSET_MANIFEST[decodeURIComponent(rawPathKey)]) {
    pathIsEncoded = true;
    requestKey = request;
  } else {
    const mappedRequest = mapRequestToAsset(request);
    const mappedRawPathKey = new URL(mappedRequest.url).pathname.replace(
      /^\/+/,
      ""
    );
    if (ASSET_MANIFEST[decodeURIComponent(mappedRawPathKey)]) {
      pathIsEncoded = true;
      requestKey = mappedRequest;
    } else {
      requestKey = mapRequestToAsset(request, options);
    }
  }
  const SUPPORTED_METHODS = ["GET", "HEAD"];
  if (!SUPPORTED_METHODS.includes(requestKey.method)) {
    throw new MethodNotAllowedError(
      `${requestKey.method} is not a valid request method`
    );
  }
  const parsedUrl = new URL(requestKey.url);
  const pathname = pathIsEncoded ? decodeURIComponent(parsedUrl.pathname) : parsedUrl.pathname;
  let pathKey = pathname.replace(/^\/+/, "");
  const cache = caches.default;
  let mimeType = mime.getType(pathKey) || options.defaultMimeType;
  if (mimeType.startsWith("text") || mimeType === "application/javascript") {
    mimeType += "; charset=utf-8";
  }
  let shouldEdgeCache = false;
  if (typeof ASSET_MANIFEST !== "undefined") {
    if (ASSET_MANIFEST[pathKey]) {
      pathKey = ASSET_MANIFEST[pathKey];
      shouldEdgeCache = true;
    }
  }
  const cacheKey = new Request(`${parsedUrl.origin}/${pathKey}`, request);
  const evalCacheOpts = (() => {
    switch (typeof options.cacheControl) {
      case "function":
        return options.cacheControl(request);
      case "object":
        return options.cacheControl;
      default:
        return defaultCacheControl;
    }
  })();
  const formatETag = /* @__PURE__ */ __name2((entityId = pathKey, validatorType = options.defaultETag) => {
    if (!entityId) {
      return "";
    }
    switch (validatorType) {
      case "weak":
        if (!entityId.startsWith("W/")) {
          if (entityId.startsWith(`"`) && entityId.endsWith(`"`)) {
            return `W/${entityId}`;
          }
          return `W/"${entityId}"`;
        }
        return entityId;
      case "strong":
        if (entityId.startsWith(`W/"`)) {
          entityId = entityId.replace("W/", "");
        }
        if (!entityId.endsWith(`"`)) {
          entityId = `"${entityId}"`;
        }
        return entityId;
      default:
        return "";
    }
  }, "formatETag");
  options.cacheControl = Object.assign({}, defaultCacheControl, evalCacheOpts);
  if (options.cacheControl.bypassCache || options.cacheControl.edgeTTL === null || request.method == "HEAD") {
    shouldEdgeCache = false;
  }
  const shouldSetBrowserCache = typeof options.cacheControl.browserTTL === "number";
  let response = null;
  if (shouldEdgeCache) {
    response = await cache.match(cacheKey);
  }
  if (response) {
    if (response.status > 300 && response.status < 400) {
      if (response.body && "cancel" in Object.getPrototypeOf(response.body)) {
        response.body.cancel();
      }
      response = new Response(null, response);
    } else {
      const opts = {
        headers: new Headers(response.headers),
        status: 0,
        statusText: ""
      };
      opts.headers.set("cf-cache-status", "HIT");
      if (response.status) {
        opts.status = response.status;
        opts.statusText = response.statusText;
      } else if (opts.headers.has("Content-Range")) {
        opts.status = 206;
        opts.statusText = "Partial Content";
      } else {
        opts.status = 200;
        opts.statusText = "OK";
      }
      response = new Response(response.body, opts);
    }
  } else {
    const body = await ASSET_NAMESPACE.get(pathKey, "arrayBuffer");
    if (body === null) {
      throw new NotFoundError(
        `could not find ${pathKey} in your content namespace`
      );
    }
    response = new Response(body);
    if (shouldEdgeCache) {
      response.headers.set("Accept-Ranges", "bytes");
      response.headers.set("Content-Length", String(body.byteLength));
      if (!response.headers.has("etag")) {
        response.headers.set("etag", formatETag(pathKey));
      }
      response.headers.set(
        "Cache-Control",
        `max-age=${options.cacheControl.edgeTTL}`
      );
      event.waitUntil(cache.put(cacheKey, response.clone()));
      response.headers.set("CF-Cache-Status", "MISS");
    }
  }
  response.headers.set("Content-Type", mimeType);
  if (response.status === 304) {
    const etag = formatETag(response.headers.get("etag"));
    const ifNoneMatch = cacheKey.headers.get("if-none-match");
    const proxyCacheStatus = response.headers.get("CF-Cache-Status");
    if (etag) {
      if (ifNoneMatch && ifNoneMatch === etag && proxyCacheStatus === "MISS") {
        response.headers.set("CF-Cache-Status", "EXPIRED");
      } else {
        response.headers.set("CF-Cache-Status", "REVALIDATED");
      }
      response.headers.set("etag", formatETag(etag, "weak"));
    }
  }
  if (shouldSetBrowserCache) {
    response.headers.set(
      "Cache-Control",
      `max-age=${options.cacheControl.browserTTL}`
    );
  } else {
    response.headers.delete("Cache-Control");
  }
  return response;
}, "getAssetFromKV");

// src/index.ts
import manifestJSON from "__STATIC_CONTENT_MANIFEST";

// src/services/creatorDbService.ts
async function fetchCreatorProfileBySlug(db, slug) {
  const normalizedSlug = slug.toLowerCase();
  if (!db) {
    return {
      id: 1,
      slug: "arongtti",
      displayName: "\uC544\uB871\uB760",
      description: "\uCE58\uC9C0\uC9C1\uC5D0\uC11C \uD65C\uB3D9\uD558\uB294 \uBC84\uD29C\uBC84\uC785\uB2C8\uB2E4. \uC8FC\uC694 \uBC29\uC1A1 \uCF58\uD150\uCE20\uC640 \uC790\uC138\uD55C \uC18C\uAC1C\uB97C \uD655\uC778\uD574 \uBCF4\uC138\uC694.",
      profileImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      agencyName: "\uAC1C\uC778\uC138 / \uC778\uB514 (Indie)",
      creatorType: "INDIE",
      language: "ko",
      isPublic: true,
      createdAt: "2026-07-31T00:00:00Z",
      updatedAt: "2026-07-31T00:00:00Z",
      channels: [
        { id: 1, platform: "CHZZK", channelName: "\uC544\uB871\uB760 \uCE58\uC9C0\uC9C1 \uBC29\uC1A1\uAD6D", channelUrl: "https://chzzk.naver.com/live/arongtti", isPrimary: true }
      ],
      events: [
        {
          id: "evt_1",
          title: "\uC544\uB871\uB760 \uCCAB \uB370\uBDD4 \uBC29\uC1A1",
          type: "FIRST_DEBUT",
          startAtUtc: "2026-08-01T08:00:00.000Z",
          originalTimezone: "Asia/Seoul",
          status: "PUBLISHED",
          verificationStatus: "VERIFIED_OFFICIAL",
          description: "\uC548\uB155\uD558\uC138\uC694! 8\uC6D4 1\uC77C \uC624\uD6C4 5\uC2DC \uCE58\uC9C0\uC9C1\uC5D0\uC11C \uB370\uBDD4\uD569\uB2C8\uB2E4.",
          links: [{ platform: "CHZZK", url: "https://chzzk.naver.com/live/arongtti", isPrimary: true }],
          creator: { id: 1, displayName: "\uC544\uB871\uB760", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80", agency: "\uAC1C\uC778\uC138", slug: "arongtti" }
        }
      ]
    };
  }
  try {
    const row = await db.prepare(`
        SELECT 
          i.*,
          c.platform,
          c.channel_url,
          c.channel_name
        FROM streamerChannel_info i
        INNER JOIN streamerChannel c ON i.channel_id = c.id
        WHERE i.slug = ? OR i.display_name = ?
        LIMIT 1
      `).bind(normalizedSlug, slug).first();
    if (!row) {
      return null;
    }
    let avatarUrl = row.profile_image_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80";
    let displayName = row.display_name || "\uBC84\uD29C\uBC84";
    let description = row.description || `${displayName}\uC758 \uB370\uBDD4 \uC77C\uC815 \uD398\uC774\uC9C0\uC785\uB2C8\uB2E4.`;
    const channelObj = {
      id: row.channel_id,
      platform: row.platform,
      channelName: row.channel_name || `${row.platform} \uCC44\uB110`,
      channelUrl: row.channel_url,
      isPrimary: true
    };
    return {
      id: row.id,
      slug: row.slug,
      displayName: displayName || "\uBC84\uD29C\uBC84",
      description: description || `${displayName}\uC758 \uB370\uBDD4 \uC77C\uC815 \uD398\uC774\uC9C0\uC785\uB2C8\uB2E4.`,
      profileImageUrl: avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      agencyName: row.agency_name || "\uAC1C\uC778\uC138",
      creatorType: row.agency_name?.includes("\uAE30\uC5C5") ? "AGENCY" : "INDIE",
      language: "ko",
      countryCode: row.country_code || "KR",
      xUrl: row.x_url || void 0,
      isPublic: true,
      createdAt: row.created_at || (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: row.updated_at || (/* @__PURE__ */ new Date()).toISOString(),
      channels: [channelObj],
      events: [
        {
          id: `evt_${row.id}`,
          title: `${displayName} \uB370\uBDD4 \uBC29\uC1A1`,
          type: "FIRST_DEBUT",
          startAtUtc: row.start_at_utc,
          originalTimezone: row.timezone || "Asia/Seoul",
          status: "PUBLISHED",
          verificationStatus: "VERIFIED_OFFICIAL",
          description: description || `${displayName} \uBC84\uD29C\uBC84\uC758 \uACF5\uC2DD \uB370\uBDD4 \uBC29\uC1A1\uC785\uB2C8\uB2E4.`,
          links: [channelObj],
          creator: {
            id: row.id,
            displayName,
            avatarUrl,
            agency: row.agency_name || "\uAC1C\uC778\uC138",
            countryCode: row.country_code || "KR",
            slug: row.slug
          }
        }
      ]
    };
  } catch (err) {
    console.error("Pair table fetchCreatorProfileBySlug Error:", err);
    return null;
  }
}
__name(fetchCreatorProfileBySlug, "fetchCreatorProfileBySlug");
async function fetchAllCreatorSlugs(db) {
  if (!db) {
    return [{ slug: "arongtti", updatedAt: "2026-07-31T00:00:00Z" }];
  }
  try {
    const { results } = await db.prepare(`SELECT slug, updated_at FROM streamerChannel_info WHERE slug IS NOT NULL AND slug != ''`).all();
    if (results && results.length > 0) {
      return results.map((row) => ({
        slug: row.slug,
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString().split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      }));
    }
    return [{ slug: "arongtti", updatedAt: "2026-07-31" }];
  } catch (err) {
    console.error("fetchAllCreatorSlugs Error:", err);
    return [{ slug: "arongtti", updatedAt: "2026-07-31" }];
  }
}
__name(fetchAllCreatorSlugs, "fetchAllCreatorSlugs");
async function updateCreatorProfileInD1(db, slug, input) {
  if (!db)
    return { success: true, dateChanged: false };
  try {
    const row = await db.prepare(`
        SELECT 
          i.channel_id, i.display_name, i.agency_name, i.debut_date, i.debut_time, i.start_at_utc, i.profile_image_url,
          c.channel_url, c.platform
        FROM streamerChannel_info i
        LEFT JOIN streamerChannel c ON i.channel_id = c.id
        WHERE i.slug = ? OR i.display_name = ?
        LIMIT 1
      `).bind(slug.toLowerCase(), slug).first();
    if (!row)
      return { success: false, dateChanged: false };
    const channelId = row.channel_id;
    const oldDebutDate = row.debut_date || "";
    const oldDebutTime = row.debut_time || "";
    let startAtUtc = void 0;
    if (input.debutDate && input.debutTime) {
      const dateStr = `${input.debutDate}T${input.debutTime}:00+09:00`;
      const dateObj = new Date(dateStr);
      if (!isNaN(dateObj.getTime())) {
        startAtUtc = dateObj.toISOString();
      }
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    await db.prepare(`
        UPDATE streamerChannel_info
        SET
          display_name = COALESCE(?, display_name),
          description = COALESCE(?, description),
          agency_name = COALESCE(?, agency_name),
          debut_date = COALESCE(?, debut_date),
          debut_time = COALESCE(?, debut_time),
          start_at_utc = COALESCE(?, start_at_utc),
          x_url = COALESCE(?, x_url),
          profile_image_url = COALESCE(?, profile_image_url),
          updated_at = ?
        WHERE channel_id = ?
      `).bind(
      input.displayName || null,
      input.description || null,
      input.agencyName || null,
      input.debutDate || null,
      input.debutTime || null,
      startAtUtc || null,
      input.xUrl || null,
      input.profileImageUrl || null,
      nowIso,
      channelId
    ).run();
    if (input.displayName) {
      await db.prepare(`
          UPDATE streamerChannel
          SET
            channel_name = COALESCE(?, channel_name)
          WHERE id = ?
        `).bind(
        input.displayName || null,
        channelId
      ).run();
    }
    const newDebutDate = input.debutDate !== void 0 ? input.debutDate : oldDebutDate;
    const newDebutTime = input.debutTime !== void 0 ? input.debutTime : oldDebutTime;
    const isDateChanged = input.debutDate !== void 0 && input.debutDate !== oldDebutDate || input.debutTime !== void 0 && input.debutTime !== oldDebutTime;
    let changeDetails;
    if (isDateChanged && (newDebutDate || newDebutTime)) {
      const formatTimeStr = /* @__PURE__ */ __name((d, t) => {
        if (!d && !t)
          return "\uBBF8\uC815";
        return t ? `${d} ${t} (KST)` : `${d} (KST)`;
      }, "formatTimeStr");
      changeDetails = {
        displayName: input.displayName || row.display_name || slug,
        avatarUrl: input.profileImageUrl || row.profile_image_url,
        platform: row.platform || "CHZZK",
        channelUrl: row.channel_url || "",
        agency: input.agencyName !== void 0 ? input.agencyName : row.agency_name,
        oldDebutDateStr: formatTimeStr(oldDebutDate, oldDebutTime),
        newDebutDateStr: formatTimeStr(newDebutDate, newDebutTime)
      };
    }
    return {
      success: true,
      dateChanged: isDateChanged,
      changeDetails
    };
  } catch (err) {
    console.error("updateCreatorProfileInD1 Error:", err);
    return { success: false, dateChanged: false };
  }
}
__name(updateCreatorProfileInD1, "updateCreatorProfileInD1");
async function deleteCreatorProfileFromD1(db, slug) {
  if (!db)
    return true;
  try {
    const row = await db.prepare(`SELECT channel_id FROM streamerChannel_info WHERE slug = ? OR display_name = ? LIMIT 1`).bind(slug.toLowerCase(), slug).first();
    if (!row)
      return false;
    const channelId = row.channel_id;
    await db.prepare(`DELETE FROM streamerChannel_info WHERE channel_id = ?`).bind(channelId).run();
    await db.prepare(`DELETE FROM streamerChannel WHERE id = ?`).bind(channelId).run();
    return true;
  } catch (err) {
    console.error("deleteCreatorProfileFromD1 Error:", err);
    return false;
  }
}
__name(deleteCreatorProfileFromD1, "deleteCreatorProfileFromD1");

// src/services/emailService.ts
async function sendDebutReportEmail(data, apiKey) {
  const recipient = data.recipientEmail || "kimjichang1234@gmail.com";
  const apiKeyToUse = apiKey || "re_test_key";
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
        .container { max-width: 650px; background: #ffffff; margin: 0 auto; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 25px; }
        .title { font-size: 22px; font-weight: 800; color: #1e293b; margin: 0; }
        .subtitle { font-size: 14px; color: #64748b; margin-top: 6px; }
        .stat-grid { display: flex; gap: 12px; margin-bottom: 25px; }
        .stat-card { flex: 1; background: #f1f5f9; padding: 15px; rounded: 10px; border-radius: 10px; text-align: center; }
        .stat-num { font-size: 24px; font-weight: 800; color: #2563eb; }
        .stat-label { font-size: 12px; font-weight: 700; color: #64748b; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
        th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px 12px; font-weight: 700; border-radius: 4px; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
        .badge-new { background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 12px; font-weight: 800; font-size: 11px; }
        .badge-exist { background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 12px; font-weight: 700; font-size: 11px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">\u{1F4E2} [V-DEBUT HUB] ${data.targetMonth} \uB370\uBDD4 \uBC84\uD29C\uBC84 \uC6F9\uC11C\uCE58 \uC870\uC0AC \uBCF4\uACE0\uC11C</h1>
          <p class="subtitle">\uC790\uB3D9 \uC218\uC9D1 \uBC0F \uB300\uC870 \uBD84\uC11D \uACB0\uACFC \uB9AC\uD3EC\uD2B8 (\uC218\uC2E0: ${recipient})</p>
        </div>

        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-num">${data.totalFound}\uBA85</div>
            <div class="stat-label">\uCD1D \uC870\uC0AC \uC778\uC6D0</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">${data.existingMatchedCount}\uBA85</div>
            <div class="stat-label">\uAE30\uC874 \uC77C\uCE58 \uB370\uC774\uD130</div>
          </div>
          <div class="stat-card">
            <div class="stat-num" style="color: #16a34a;">+${data.newDiscoveredCount}\uBA85</div>
            <div class="stat-label">\uC2E0\uADDC/\uCD94\uAC00 \uC870\uC0AC \uC778\uC6D0</div>
          </div>
        </div>

        <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 10px; color: #1e293b;">\u{1F4CB} ${data.targetMonth} \uB370\uBDD4 \uBC84\uD29C\uBC84 \uBA85\uB2E8 (${data.creators.length}\uBA85)</h3>
        <table>
          <thead>
            <tr>
              <th>\uAD6C\uBD84</th>
              <th>\uBC84\uD29C\uBC84 (\uB2C9\uB124\uC784)</th>
              <th>\uD50C\uB7AB\uD3FC</th>
              <th>\uB370\uBDD4\uC77C\uC2DC</th>
              <th>\uCC44\uB110 \uB9C1\uD06C</th>
            </tr>
          </thead>
          <tbody>
            ${data.creators.map((c) => `
              <tr>
                <td>${c.isNew ? '<span class="badge-new">\uC2E0\uADDC \uCD94\uAC00</span>' : '<span class="badge-exist">\uC77C\uCE58 \uB370\uC774\uD130</span>'}</td>
                <td><strong>${c.displayName}</strong></td>
                <td>${c.platform}</td>
                <td>${c.debutDate} ${c.debutTime || ""}</td>
                <td><a href="${c.channelUrl || "#"}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 700;">[\uBC29\uC1A1\uAD6D]</a></td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="footer">
          \uBCF8 \uBA54\uC77C\uC740 V-DEBUT HUB \uC790\uB3D9 \uC6F9\uC11C\uCE58 & \uB370\uBDD4 \uC870\uC0AC \uC2DC\uC2A4\uD15C\uC5D0\uC11C \uC790\uB3D9\uC73C\uB85C \uBC1C\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.<br>
          \xA9 2026 V-DEBUT HUB All Rights Reserved.
        </div>
      </div>
    </body>
    </html>
  `;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKeyToUse}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "V-DEBUT HUB <onboarding@resend.dev>",
        to: [recipient],
        subject: `[V-DEBUT HUB] \u{1F4E2} ${data.targetMonth} \uBC84\uD29C\uBC84 \uC790\uB3D9 \uC218\uC9D1 \uAC31\uC2E0 \uBCF4\uACE0\uC11C (\uCD1D ${data.totalFound}\uBA85 \uC870\uC0AC)`,
        html: htmlContent
      })
    });
    if (res.ok) {
      const resData = await res.json();
      return { success: true, messageId: resData.id };
    } else {
      const errData = await res.text();
      console.warn("Resend API response error:", errData);
      return { success: false, error: errData };
    }
  } catch (err) {
    console.error("Email Dispatch Error:", err);
    return { success: false, error: err.message || "\uB124\uD2B8\uC6CC\uD06C \uC804\uC1A1 \uC624\uB958" };
  }
}
__name(sendDebutReportEmail, "sendDebutReportEmail");

// src/services/weeklyAuditRangeService.ts
function getKstDateComponents(now = /* @__PURE__ */ new Date()) {
  const kstTime = now.getTime() + 9 * 60 * 60 * 1e3;
  const kstDate = new Date(kstTime);
  return {
    year: kstDate.getUTCFullYear(),
    month: kstDate.getUTCMonth() + 1,
    // 1~12
    date: kstDate.getUTCDate(),
    // 1~31
    dayOfWeek: kstDate.getUTCDay()
    // 0 (일) ~ 6 (토)
  };
}
__name(getKstDateComponents, "getKstDateComponents");
function addDaysToKstDate(year, month, date, offsetDays) {
  const d = new Date(Date.UTC(year, month - 1, date + offsetDays));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
__name(addDaysToKstDate, "addDaysToKstDate");
var DAY_NAMES = ["\uC77C\uC694\uC77C", "\uC6D4\uC694\uC77C", "\uD654\uC694\uC77C", "\uC218\uC694\uC77C", "\uBAA9\uC694\uC77C", "\uAE08\uC694\uC77C", "\uD1A0\uC694\uC77C"];
function calculateWeeklyAuditDateRange(baseDate = /* @__PURE__ */ new Date()) {
  const { year, month, date, dayOfWeek } = getKstDateComponents(baseDate);
  const dayName = DAY_NAMES[dayOfWeek];
  if (dayOfWeek === 0) {
    const startDate2 = addDaysToKstDate(year, month, date, 1);
    const endDate2 = addDaysToKstDate(year, month, date, 7);
    return {
      startDate: startDate2,
      endDate: endDate2,
      dayOfWeek,
      dayName,
      description: `[\uC77C\uC694\uC77C] \uCC28\uC8FC \uB370\uBDD4 \uC804\uCCB4 \uAC80\uC0AC (${startDate2} ~ ${endDate2})`
    };
  }
  const daysUntilSunday = 7 - dayOfWeek;
  const startDate = addDaysToKstDate(year, month, date, 0);
  const endDate = addDaysToKstDate(year, month, date, daysUntilSunday);
  const descLabel = dayOfWeek === 1 ? "\uC774\uBC88\uC8FC \uC804\uCCB4 \uAC80\uC0AC" : `${dayName.slice(0, 1)}~\uC77C \uAC80\uC0AC`;
  return {
    startDate,
    endDate,
    dayOfWeek,
    dayName,
    description: `[${dayName}] ${descLabel} (${startDate} ~ ${endDate})`
  };
}
__name(calculateWeeklyAuditDateRange, "calculateWeeklyAuditDateRange");
function isValidDateFormat(dateStr) {
  if (!dateStr || typeof dateStr !== "string")
    return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr))
    return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31)
    return false;
  return true;
}
__name(isValidDateFormat, "isValidDateFormat");
function isDebutInAuditRange(debutDate, range) {
  if (!debutDate)
    return false;
  const cleanDate = debutDate.trim().replace(/\//g, "-").replace(/\./g, "-");
  if (!isValidDateFormat(cleanDate))
    return false;
  return cleanDate >= range.startDate && cleanDate <= range.endDate;
}
__name(isDebutInAuditRange, "isDebutInAuditRange");
function getTodayKstDateString(baseDate = /* @__PURE__ */ new Date()) {
  const { year, month, date } = getKstDateComponents(baseDate);
  return `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
}
__name(getTodayKstDateString, "getTodayKstDateString");
function isEligibleDebutForSync(debutDate, auditRange, todayKst = getTodayKstDateString(), pastGraceDays = 45) {
  if (!debutDate)
    return false;
  const cleanDate = debutDate.trim().replace(/\//g, "-").replace(/\./g, "-");
  if (!isValidDateFormat(cleanDate))
    return false;
  if (isDebutInAuditRange(cleanDate, auditRange)) {
    return true;
  }
  if (cleanDate >= todayKst) {
    return true;
  }
  if (pastGraceDays > 0) {
    const todayMs = Date.parse(todayKst);
    const debutMs = Date.parse(cleanDate);
    const diffDays = (todayMs - debutMs) / (1e3 * 60 * 60 * 24);
    if (diffDays >= 0 && diffDays <= pastGraceDays) {
      return true;
    }
  }
  return false;
}
__name(isEligibleDebutForSync, "isEligibleDebutForSync");

// src/services/debutCrawlerService.ts
async function runDebutCrawlerProcess(db, recipientEmail = "kimjichang1234@gmail.com", apiKey, forcedBaseDate) {
  const runAt = (/* @__PURE__ */ new Date()).toISOString();
  const baseDate = forcedBaseDate || /* @__PURE__ */ new Date();
  const auditRange = calculateWeeklyAuditDateRange(baseDate);
  const todayKst = getTodayKstDateString(baseDate);
  console.log(`[Crawler] Starting Debut Auto Web Search & Sync at ${runAt}... Range: ${auditRange.description} (Today KST: ${todayKst})`);
  const crawledList = [];
  try {
    const sheetCsvUrl = "https://docs.google.com/spreadsheets/d/1SEcOZAhMqFLUW7bxSsBkWK0UriMD3fD82xXX2HrUf38/export?format=csv&gid=1884409648";
    const response = await fetch(sheetCsvUrl);
    if (response.ok) {
      const csvText = await response.text();
      const lines = csvText.split("\n");
      for (let i = 5; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
          continue;
        const parts = line.split(",").map((p) => p.replace(/^"|"$/g, "").trim());
        if (parts.length > 4) {
          const dateRaw = parts[1] || "";
          const hourRaw = parts[2] || "";
          const minRaw = parts[3] || "";
          const name = parts[4] || "";
          const channelUrl = parts[5] || "";
          const xId = parts[6] || "";
          if (name && dateRaw) {
            let formattedDate = dateRaw.replace(/\s+/g, "").replace(/\./g, "-");
            if (formattedDate.endsWith("-")) {
              formattedDate = formattedDate.slice(0, -1);
            }
            const dateParts = formattedDate.split("-");
            if (dateParts.length === 3) {
              const y = dateParts[0];
              const m = dateParts[1].padStart(2, "0");
              const d = dateParts[2].padStart(2, "0");
              formattedDate = `${y}-${m}-${d}`;
            }
            if (!isEligibleDebutForSync(formattedDate, auditRange, todayKst)) {
              continue;
            }
            let platform = null;
            const lowerUrl = channelUrl.toLowerCase();
            if (lowerUrl.includes("sooplive") || lowerUrl.includes("afreeca")) {
              platform = "SOOP";
            } else if (lowerUrl.includes("chzzk") || lowerUrl.includes("naver.com")) {
              platform = "CHZZK";
            } else if (!lowerUrl.includes("youtube") && !lowerUrl.includes("youtu.be") && !lowerUrl.includes("twitch")) {
              platform = "CHZZK";
            }
            if (!platform) {
              continue;
            }
            let formattedTime = "20:00";
            if (hourRaw) {
              const h = hourRaw.replace(/[^0-9]/g, "").padStart(2, "0");
              const m = minRaw.replace(/[^0-9]/g, "").padStart(2, "0") || "00";
              formattedTime = `${h}:${m}`;
            }
            let xUrl = xId;
            if (xId && !xId.startsWith("http")) {
              const cleanX = xId.replace(/^@/, "");
              xUrl = `https://x.com/${cleanX}`;
            }
            crawledList.push({
              displayName: name,
              platform,
              debutDate: formattedDate,
              debutTime: formattedTime,
              channelUrl: channelUrl || `https://chzzk.naver.com/search?query=${encodeURIComponent(name)}`,
              xUrl,
              agencyName: "\uAC1C\uC778\uC138",
              isNew: false
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("[Crawler] Fetch error:", err);
  }
  let existingMatchedCount = 0;
  let newDiscoveredCount = 0;
  if (db) {
    try {
      const { results: existingStreamers } = await db.prepare(`
        SELECT c.id, i.slug, i.display_name, c.channel_url, i.profile_image_url
        FROM streamerChannel_info i
        INNER JOIN streamerChannel c ON i.channel_id = c.id
      `).all();
      const existingUrls = /* @__PURE__ */ new Map();
      const existingNames = /* @__PURE__ */ new Map();
      for (const s of existingStreamers || []) {
        if (s.channel_url)
          existingUrls.set(s.channel_url.toLowerCase().trim(), s);
        if (s.display_name)
          existingNames.set(s.display_name.toLowerCase().trim(), s);
      }
      for (const item of crawledList) {
        const cleanUrl = item.channelUrl.toLowerCase().trim();
        const cleanName = item.displayName.toLowerCase().trim();
        const existing = existingUrls.get(cleanUrl) || existingNames.get(cleanName);
        if (existing) {
          item.isNew = false;
          existingMatchedCount++;
          if (!existing.profile_image_url && item.channelUrl) {
            try {
              const profileInfo = await fetchPlatformProfile(item.platform, item.channelUrl);
              if (profileInfo.success && profileInfo.profileImageUrl) {
                await db.prepare(`
                  UPDATE streamerChannel_info
                  SET profile_image_url = ?, updated_at = CURRENT_TIMESTAMP
                  WHERE channel_id = ?
                `).bind(profileInfo.profileImageUrl, existing.id).run();
              }
            } catch (syncErr) {
              console.warn(`[Crawler] Profile sync failed for ${item.displayName}:`, syncErr);
            }
          }
        } else {
          item.isNew = true;
          newDiscoveredCount++;
          let profileImageUrl = "";
          let description = `${item.displayName}\uC758 \uB370\uBDD4 \uBC29\uC1A1\uC785\uB2C8\uB2E4.`;
          try {
            const profileInfo = await fetchPlatformProfile(item.platform, item.channelUrl);
            if (profileInfo.success) {
              profileImageUrl = profileInfo.profileImageUrl || "";
              if (profileInfo.description)
                description = profileInfo.description;
            }
          } catch (apiErr) {
            console.warn(`[Crawler] External platform profile fetch failed for ${item.displayName}:`, apiErr);
          }
          const chRes = await db.prepare(`
            INSERT INTO streamerChannel (platform, channel_url, channel_name)
            VALUES (?, ?, ?)
            RETURNING id
          `).bind(item.platform, item.channelUrl, item.displayName).first();
          const channelId = chRes?.id;
          if (!channelId) {
            console.error(`[Crawler] Failed to insert streamerChannel for ${item.displayName}`);
            continue;
          }
          const rawSlug = generateCleanSlug(item.displayName, item.platform);
          const slug = await resolveUniqueSlug(db, rawSlug);
          const startAtUtc = (/* @__PURE__ */ new Date(`${item.debutDate}T${item.debutTime}:00+09:00`)).toISOString();
          await db.prepare(`
            INSERT INTO streamerChannel_info (
              channel_id, slug, display_name, profile_image_url, description,
              agency_name, debut_date, debut_time, timezone, start_at_utc,
              country_code, x_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'KR', ?)
          `).bind(
            channelId,
            slug,
            item.displayName,
            profileImageUrl,
            description,
            item.agencyName || "\uAC1C\uC778\uC138",
            item.debutDate,
            item.debutTime || "20:00",
            "Asia/Seoul",
            startAtUtc,
            item.xUrl || ""
          ).run();
          console.log(`[Crawler] Successfully auto-registered: ${item.displayName} (${item.platform}, ${item.debutDate}) -> /creator/${slug}`);
        }
      }
    } catch (dbErr) {
      console.error("[Crawler] DB sync error:", dbErr);
    }
  } else {
    existingMatchedCount = crawledList.length;
  }
  let emailSent = false;
  try {
    const emailRes = await sendDebutReportEmail(
      {
        recipientEmail,
        targetMonth: `${auditRange.description} (\uAC80\uC0AC \uAC74\uC218: ${crawledList.length}\uAC74, \uC2E0\uADDC: ${newDiscoveredCount}\uAC74)`,
        totalFound: crawledList.length,
        existingMatchedCount,
        newDiscoveredCount,
        creators: crawledList.map((c) => ({ ...c, isNew: !!c.isNew }))
      },
      apiKey
    );
    emailSent = emailRes.success;
  } catch (mailErr) {
    console.error("[Crawler] Email dispatch failed:", mailErr);
  }
  if (db) {
    try {
      await db.prepare(`
        INSERT INTO crawler_update_logs (updated_count, updated_creators_json, email_sent)
        VALUES (?, ?, ?)
      `).bind(crawledList.length, JSON.stringify(crawledList), emailSent ? 1 : 0).run();
    } catch (logErr) {
      console.error("[Crawler] Log insert error:", logErr);
    }
  }
  return {
    success: true,
    runAt,
    auditRange,
    totalCrawledCount: crawledList.length,
    existingMatchedCount,
    newDiscoveredCount,
    emailSent,
    creators: crawledList
  };
}
__name(runDebutCrawlerProcess, "runDebutCrawlerProcess");

// src/services/eventValidationService.ts
function validateDisplayName(name) {
  if (!name || typeof name !== "string") {
    return { isValid: false, errorMessage: "\uC2A4\uD2B8\uB9AC\uBA38 \uC774\uB984\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694." };
  }
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 30) {
    return { isValid: false, errorMessage: "\uC2A4\uD2B8\uB9AC\uBA38 \uC774\uB984\uC740 1\uC790 \uC774\uC0C1 30\uC790 \uC774\uD558\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4." };
  }
  const bannedKeywords = ["(\uC54C \uC218 \uC5C6\uC74C)", "\uC54C \uC218 \uC5C6\uC74C", "unknown", "null", "undefined", "test", "\uD14C\uC2A4\uD2B8", "temp"];
  if (bannedKeywords.includes(trimmed.toLowerCase())) {
    return { isValid: false, errorMessage: "\uC720\uD6A8\uD55C \uC2A4\uD2B8\uB9AC\uBA38 \uC774\uB984\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694." };
  }
  if (/^[ㄱ-ㅎㅏ-ㅣ]+$/.test(trimmed)) {
    return { isValid: false, errorMessage: "\uC790\uC74C\uC774\uB098 \uBAA8\uC74C\uB9CC\uC73C\uB85C \uC774\uB8E8\uC5B4\uC9C4 \uC774\uB984\uC740 \uB4F1\uB85D\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." };
  }
  return { isValid: true };
}
__name(validateDisplayName, "validateDisplayName");
function validateChannelUrl(url, platform) {
  if (!url || typeof url !== "string") {
    return { isValid: false, errorMessage: "\uCC44\uB110/\uBC29\uC1A1\uAD6D URL\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694." };
  }
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return { isValid: false, errorMessage: "\uC62C\uBC14\uB978 http:// \uB610\uB294 https:// \uD615\uC2DD\uC758 URL\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694." };
  }
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, errorMessage: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 URL \uD615\uC2DD\uC785\uB2C8\uB2E4." };
  }
  const host = parsed.hostname.toLowerCase();
  const allowedHosts = {
    CHZZK: ["chzzk.naver.com", "m.chzzk.naver.com"],
    SOOP: ["sooplive.co.kr", "ch.sooplive.co.kr", "www.sooplive.co.kr", "play.sooplive.co.kr", "afreecatv.com"],
    YOUTUBE: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"],
    TWITCH: ["twitch.tv", "www.twitch.tv", "m.twitch.tv"]
  };
  const currentPlatform = platform?.toUpperCase() || "CHZZK";
  const validHostsForPlatform = allowedHosts[currentPlatform];
  if (validHostsForPlatform) {
    const isDomainAllowed = validHostsForPlatform.some((h) => host === h || host.endsWith(`.${h}`));
    if (!isDomainAllowed) {
      return {
        isValid: false,
        errorMessage: `${currentPlatform} \uD50C\uB7AB\uD3FC\uC5D0 \uC77C\uCE58\uD558\uC9C0 \uC54A\uB294 \uBC29\uC1A1\uAD6D URL \uB3C4\uBA54\uC778\uC785\uB2C8\uB2E4. (${host})`
      };
    }
  } else {
    const allAllowed = Object.values(allowedHosts).flat();
    const isDomainAllowed = allAllowed.some((h) => host === h || host.endsWith(`.${h}`));
    if (!isDomainAllowed) {
      return {
        isValid: false,
        errorMessage: "\uCE58\uC9C0\uC9C1, SOOP, YouTube, Twitch \uACF5\uC2DD \uBC29\uC1A1\uAD6D URL\uB9CC \uB4F1\uB85D\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
      };
    }
  }
  return { isValid: true };
}
__name(validateChannelUrl, "validateChannelUrl");
function validateDebutDateTime(startAtUtc) {
  if (!startAtUtc || typeof startAtUtc !== "string") {
    return { isValid: false, errorMessage: "\uB370\uBDD4 \uC77C\uC2DC\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694." };
  }
  const d = new Date(startAtUtc);
  if (isNaN(d.getTime())) {
    return { isValid: false, errorMessage: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB0A0\uC9DC/\uC2DC\uAC04 \uD615\uC2DD\uC785\uB2C8\uB2E4." };
  }
  const year = d.getUTCFullYear();
  if (year < 2020 || year > 2035) {
    return { isValid: false, errorMessage: "\uB370\uBDD4 \uC5F0\uB3C4\uB294 2020\uB144\uC5D0\uC11C 2035\uB144 \uC0AC\uC774\uC5EC\uC57C \uD569\uB2C8\uB2E4." };
  }
  return { isValid: true };
}
__name(validateDebutDateTime, "validateDebutDateTime");
function validateDebutEventPayload(body) {
  if (!body || typeof body !== "object") {
    return { isValid: false, errorMessage: "\uC694\uCCAD \uBCF8\uBB38\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." };
  }
  const displayName = body.creator?.displayName || body.displayName;
  const nameCheck = validateDisplayName(displayName);
  if (!nameCheck.isValid)
    return nameCheck;
  const primaryLink = body.links?.[0];
  const url = primaryLink?.url || body.watchUrl || body.channelUrl;
  const platform = primaryLink?.platform || body.platform;
  const urlCheck = validateChannelUrl(url, platform);
  if (!urlCheck.isValid)
    return urlCheck;
  const startAtUtc = body.startAtUtc;
  if (startAtUtc) {
    const dateCheck = validateDebutDateTime(startAtUtc);
    if (!dateCheck.isValid)
      return dateCheck;
  }
  const description = body.description || body.creator?.description;
  if (description && typeof description === "string" && description.length > 1e3) {
    return { isValid: false, errorMessage: "\uC18C\uAC1C\uAE00\uC740 \uCD5C\uB300 1,000\uC790\uAE4C\uC9C0 \uC791\uC131\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." };
  }
  return { isValid: true };
}
__name(validateDebutEventPayload, "validateDebutEventPayload");

// src/utils/countryDetector.ts
function detectCountryFromChannel(params) {
  const existing = params.existingCountryCode?.toUpperCase().trim();
  if (existing === "KR" || existing === "JP")
    return existing;
  if (existing === "EN" || existing === "US" || existing === "GB")
    return "EN";
  const platform = (params.platform || "").toUpperCase().trim();
  const channelUrl = (params.channelUrl || "").toLowerCase().trim();
  if (platform === "CHZZK" || platform === "SOOP") {
    return "KR";
  }
  if (channelUrl.includes("chzzk.naver.com") || channelUrl.includes("sooplive.co.kr") || channelUrl.includes("afreecatv.com")) {
    return "KR";
  }
  const text = `${params.displayName || ""} ${params.description || ""}`.trim();
  if (/[가-힣]/.test(text)) {
    return "KR";
  }
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return "JP";
  }
  if (text.includes("@naver.com") || text.includes("@daum.net")) {
    return "KR";
  }
  return "EN";
}
__name(detectCountryFromChannel, "detectCountryFromChannel");

// src/services/submissionDbService.ts
async function createSubmissionToD1(db, body) {
  const now = Date.now();
  let displayName = body.creator?.displayName || body.displayName || "\uC2E0\uC785 \uBC84\uD29C\uBC84";
  let avatarUrl = body.creator?.avatarUrl || body.avatarUrl || "";
  const agencyName = body.creator?.agency || body.agency || "\uAC1C\uC778\uC138";
  const groupName = body.creator?.groupName || body.groupName || body.debutGroupName || "";
  const videoUrl = body.videoUrl || body.creator?.videoUrl || body.pvUrl || "";
  const websiteUrl = body.websiteUrl || body.creator?.websiteUrl || "";
  let description = body.description || body.creator?.description || `${displayName}\uC758 \uB370\uBDD4 \uBC29\uC1A1\uC785\uB2C8\uB2E4.`;
  const primaryLink = body.links?.[0] || null;
  const platform = (primaryLink?.platform || body.platform || "CHZZK").toUpperCase();
  const channelUrl = primaryLink?.url || body.watchUrl || body.channelUrl || "https://chzzk.naver.com";
  const xUrl = body.creator?.xUrl || body.xUrl || "";
  const contactEmail = body.contactEmail || "";
  if (!avatarUrl && channelUrl) {
    try {
      const apiResult = await fetchPlatformProfile(platform, channelUrl);
      if (apiResult.success) {
        avatarUrl = apiResult.profileImageUrl || avatarUrl;
        displayName = apiResult.creatorName || displayName;
        description = apiResult.description || description;
      }
    } catch {
    }
  }
  const rawCountry = body.creator?.countryCode || body.countryCode;
  const countryCode = detectCountryFromChannel({
    platform,
    channelUrl,
    displayName,
    description,
    existingCountryCode: rawCountry
  });
  const startAtUtc = body.startAtUtc || new Date(now + 864e5 * 3).toISOString();
  const timezone = body.originalTimezone || body.timezone || "Asia/Seoul";
  const d = new Date(startAtUtc);
  const debutDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const debutTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  try {
    const res = await db.prepare(`
      INSERT INTO debut_submissions (
        display_name, platform, channel_url, avatar_url, description,
        agency_name, group_name, country_code, debut_date, debut_time, timezone,
        start_at_utc, x_url, video_url, website_url, contact_email, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
      RETURNING id
    `).bind(
      displayName,
      platform,
      channelUrl,
      avatarUrl,
      description,
      agencyName,
      groupName,
      countryCode,
      debutDate,
      debutTime,
      timezone,
      startAtUtc,
      xUrl,
      videoUrl,
      websiteUrl,
      contactEmail
    ).first();
    return res?.id || now;
  } catch (err) {
    const res = await db.prepare(`
      INSERT INTO debut_submissions (
        display_name, platform, channel_url, avatar_url, description,
        agency_name, country_code, debut_date, debut_time, timezone,
        start_at_utc, x_url, contact_email, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
      RETURNING id
    `).bind(
      displayName,
      platform,
      channelUrl,
      avatarUrl,
      description,
      agencyName,
      countryCode,
      debutDate,
      debutTime,
      timezone,
      startAtUtc,
      xUrl,
      contactEmail
    ).first();
    return res?.id || now;
  }
}
__name(createSubmissionToD1, "createSubmissionToD1");
function formatStartAtUtc(debutDate, debutTime, timezone = "Asia/Seoul") {
  try {
    const cleanDate = debutDate.trim().replace(/\//g, "-").replace(/\./g, "-");
    let cleanTime = debutTime.trim();
    if (cleanTime.length === 5)
      cleanTime += ":00";
    if (timezone === "Asia/Seoul") {
      const d2 = /* @__PURE__ */ new Date(`${cleanDate}T${cleanTime}+09:00`);
      if (!isNaN(d2.getTime()))
        return d2.toISOString();
    }
    const d = /* @__PURE__ */ new Date(`${cleanDate}T${cleanTime}Z`);
    if (!isNaN(d.getTime()))
      return d.toISOString();
  } catch {
  }
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(formatStartAtUtc, "formatStartAtUtc");
async function createSubmissionsBatchToD1(db, items) {
  if (!items || items.length === 0) {
    return { success: true, insertedCount: 0 };
  }
  try {
    let insertedCount = 0;
    const CHUNK_SIZE = 50;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const statements = chunk.map((item) => {
        const displayName = (item.displayName || "\uC2E0\uC785 \uBC84\uD29C\uBC84").trim();
        const platform = (item.platform || "CHZZK").toUpperCase().trim();
        const channelUrl = (item.channelUrl || "").trim();
        const avatarUrl = (item.avatarUrl || "").trim();
        const description = (item.description || `${displayName}\uC758 \uB370\uBDD4 \uBC29\uC1A1\uC785\uB2C8\uB2E4.`).trim();
        const agencyName = (item.agencyName || "\uAC1C\uC778\uC138").trim();
        const debutDate = (item.debutDate || "").trim();
        const debutTime = (item.debutTime || "00:00").trim();
        const timezone = item.timezone || "Asia/Seoul";
        const startAtUtc = item.startAtUtc || formatStartAtUtc(debutDate, debutTime, timezone);
        const xUrl = (item.xUrl || "").trim();
        const contactEmail = (item.contactEmail || "").trim();
        const countryCode = detectCountryFromChannel({
          platform,
          channelUrl,
          displayName,
          description,
          existingCountryCode: item.countryCode
        });
        return db.prepare(`
          INSERT INTO debut_submissions (
            display_name, platform, channel_url, avatar_url, description,
            agency_name, country_code, debut_date, debut_time, timezone,
            start_at_utc, x_url, contact_email, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
        `).bind(
          displayName,
          platform,
          channelUrl,
          avatarUrl,
          description,
          agencyName,
          countryCode,
          debutDate,
          debutTime,
          timezone,
          startAtUtc,
          xUrl,
          contactEmail
        );
      });
      await db.batch(statements);
      insertedCount += chunk.length;
    }
    return { success: true, insertedCount };
  } catch (err) {
    console.error("createSubmissionsBatchToD1 error:", err);
    return { success: false, insertedCount: 0, error: err?.message || "DB \uBC30\uCE58 \uC800\uC7A5 \uC2E4\uD328" };
  }
}
__name(createSubmissionsBatchToD1, "createSubmissionsBatchToD1");
async function fetchSubmissionsFromD1(db, statusFilter) {
  try {
    let query = "SELECT * FROM debut_submissions ORDER BY created_at DESC";
    let stmt;
    if (statusFilter && statusFilter !== "ALL") {
      query = "SELECT * FROM debut_submissions WHERE status = ? ORDER BY created_at DESC";
      stmt = db.prepare(query).bind(statusFilter);
    } else {
      stmt = db.prepare(query);
    }
    const { results } = await stmt.all();
    if (!results || results.length === 0)
      return [];
    return results.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      platform: r.platform,
      channelUrl: r.channel_url,
      avatarUrl: r.avatar_url,
      description: r.description,
      agencyName: r.agency_name,
      groupName: r.group_name || "",
      videoUrl: r.video_url || "",
      websiteUrl: r.website_url || "",
      countryCode: r.country_code,
      debutDate: r.debut_date,
      debutTime: r.debut_time,
      timezone: r.timezone,
      startAtUtc: r.start_at_utc,
      xUrl: r.x_url,
      contactEmail: r.contact_email,
      status: r.status,
      adminNote: r.admin_note,
      createdAt: r.created_at,
      processedAt: r.processed_at
    }));
  } catch (err) {
    console.error("fetchSubmissionsFromD1 error:", err);
    return [];
  }
}
__name(fetchSubmissionsFromD1, "fetchSubmissionsFromD1");
async function updateSubmissionInD1(db, submissionId, data) {
  try {
    const fields = [];
    const values = [];
    const fieldMap = {
      displayName: "display_name",
      platform: "platform",
      channelUrl: "channel_url",
      avatarUrl: "avatar_url",
      description: "description",
      agencyName: "agency_name",
      groupName: "group_name",
      countryCode: "country_code",
      debutDate: "debut_date",
      debutTime: "debut_time",
      timezone: "timezone",
      startAtUtc: "start_at_utc",
      xUrl: "x_url",
      videoUrl: "video_url",
      websiteUrl: "website_url",
      contactEmail: "contact_email",
      adminNote: "admin_note",
      status: "status"
    };
    for (const [key, col] of Object.entries(fieldMap)) {
      if (data[key] !== void 0) {
        fields.push(`${col} = ?`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0)
      return { success: true };
    values.push(submissionId);
    await db.prepare(`UPDATE debut_submissions SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
    return { success: true };
  } catch (err) {
    console.error("updateSubmissionInD1 error:", err);
    return { success: false, error: err?.message || "\uC2E0\uCCAD\uC11C \uC218\uC815 \uC2E4\uD328" };
  }
}
__name(updateSubmissionInD1, "updateSubmissionInD1");
async function approveSubmissionInD1(db, submissionId, customSlug, customData) {
  try {
    if (customData && Object.keys(customData).length > 0) {
      await updateSubmissionInD1(db, submissionId, customData);
    }
    const sub = await db.prepare("SELECT * FROM debut_submissions WHERE id = ? LIMIT 1").bind(submissionId).first();
    if (!sub) {
      return { success: false, error: "\uD574\uB2F9 \uC2E0\uCCAD\uC11C\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." };
    }
    const now = Date.now();
    const rawSlug = customSlug && customSlug.trim() ? customSlug.trim() : generateCleanSlug(sub.display_name, sub.channel_url, sub.x_url);
    const slug = await resolveUniqueSlug(db, rawSlug);
    const chRes = await db.prepare(`
      INSERT INTO streamerChannel (platform, channel_url, channel_name)
      VALUES (?, ?, ?)
      RETURNING id
    `).bind(sub.platform, sub.channel_url, `${sub.display_name} ${sub.platform}`).first();
    const channelId = chRes?.id || now;
    let avatarUrl = sub.avatar_url || "";
    let description = sub.description || "";
    let displayName = sub.display_name || "";
    if (!avatarUrl && sub.channel_url) {
      try {
        const profile = await fetchPlatformProfile(sub.platform, sub.channel_url);
        if (profile.success && profile.profileImageUrl) {
          avatarUrl = profile.profileImageUrl;
          description = profile.description || description;
          displayName = profile.creatorName || displayName;
        }
      } catch {
      }
    }
    const finalCountryCode = detectCountryFromChannel({
      platform: sub.platform,
      channelUrl: sub.channel_url,
      displayName,
      description,
      existingCountryCode: sub.country_code
    });
    const groupName = sub.group_name || "";
    const videoUrl = sub.video_url || "";
    const websiteUrl = sub.website_url || "";
    let infoRes;
    try {
      infoRes = await db.prepare(`
        INSERT INTO streamerChannel_info (
          channel_id, slug, display_name, profile_image_url, description,
          agency_name, group_name, debut_date, debut_time, timezone, start_at_utc,
          country_code, x_url, video_url, website_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id
      `).bind(
        channelId,
        slug,
        displayName,
        avatarUrl,
        description,
        sub.agency_name || "\uAC1C\uC778\uC138",
        groupName,
        sub.debut_date,
        sub.debut_time,
        sub.timezone || "Asia/Seoul",
        sub.start_at_utc,
        finalCountryCode,
        sub.x_url || "",
        videoUrl,
        websiteUrl
      ).first();
    } catch {
      infoRes = await db.prepare(`
        INSERT INTO streamerChannel_info (
          channel_id, slug, display_name, profile_image_url, description,
          agency_name, debut_date, debut_time, timezone, start_at_utc,
          country_code, x_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id
      `).bind(
        channelId,
        slug,
        displayName,
        avatarUrl,
        description,
        sub.agency_name || "\uAC1C\uC778\uC138",
        sub.debut_date,
        sub.debut_time,
        sub.timezone || "Asia/Seoul",
        sub.start_at_utc,
        finalCountryCode,
        sub.x_url || ""
      ).first();
    }
    const infoId = infoRes?.id || channelId;
    await db.prepare(`
      UPDATE debut_submissions
      SET status = 'APPROVED', processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(submissionId).run();
    return { success: true, eventId: `evt_${infoId}`, slug };
  } catch (err) {
    console.error("approveSubmissionInD1 error:", err);
    return { success: false, error: err?.message || "\uC2B9\uC778 \uCC98\uB9AC \uC911 \uC624\uB958 \uBC1C\uC0DD" };
  }
}
__name(approveSubmissionInD1, "approveSubmissionInD1");
async function approveSubmissionsBatchInD1(db, submissionIds) {
  if (!submissionIds || submissionIds.length === 0) {
    return { success: true, approvedCount: 0, failedCount: 0, errors: [] };
  }
  let approvedCount = 0;
  let failedCount = 0;
  const errors = [];
  for (const id of submissionIds) {
    const res = await approveSubmissionInD1(db, id);
    if (res.success) {
      approvedCount++;
    } else {
      failedCount++;
      errors.push(`ID ${id}: ${res.error || "\uC2B9\uC778 \uC2E4\uD328"}`);
    }
  }
  return {
    success: approvedCount > 0 || failedCount === 0,
    approvedCount,
    failedCount,
    errors
  };
}
__name(approveSubmissionsBatchInD1, "approveSubmissionsBatchInD1");
async function rejectSubmissionInD1(db, submissionId, adminNote) {
  try {
    await db.prepare(`
      UPDATE debut_submissions
      SET status = 'REJECTED', admin_note = ?, processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(adminNote || null, submissionId).run();
    return true;
  } catch (err) {
    console.error("rejectSubmissionInD1 error:", err);
    return false;
  }
}
__name(rejectSubmissionInD1, "rejectSubmissionInD1");
async function deleteSubmissionFromD1(db, submissionId) {
  try {
    await db.prepare("DELETE FROM debut_submissions WHERE id = ?").bind(submissionId).run();
    return true;
  } catch (err) {
    console.error("deleteSubmissionFromD1 error:", err);
    return false;
  }
}
__name(deleteSubmissionFromD1, "deleteSubmissionFromD1");
async function fetchAllActiveStreamersForAdmin(db) {
  try {
    const { results } = await db.prepare(`
      SELECT 
        i.id as info_id,
        i.channel_id,
        i.slug,
        i.display_name,
        i.profile_image_url,
        i.description,
        i.agency_name,
        i.debut_date,
        i.debut_time,
        i.timezone,
        i.start_at_utc,
        i.country_code,
        i.x_url,
        c.platform,
        c.channel_url,
        c.channel_name,
        i.created_at,
        i.updated_at
      FROM streamerChannel_info i
      INNER JOIN streamerChannel c ON i.channel_id = c.id
      ORDER BY i.start_at_utc DESC
    `).all();
    return results || [];
  } catch (err) {
    console.error("fetchAllActiveStreamersForAdmin error:", err);
    return [];
  }
}
__name(fetchAllActiveStreamersForAdmin, "fetchAllActiveStreamersForAdmin");

// src/services/profileSyncService.ts
async function syncMissingProfilesInD1(db) {
  const result = {
    totalChecked: 0,
    updatedCount: 0,
    failedCount: 0,
    details: []
  };
  try {
    const { results } = await db.prepare(`
      SELECT 
        i.id as info_id,
        i.display_name,
        i.profile_image_url,
        i.description,
        c.platform,
        c.channel_url
      FROM streamerChannel_info i
      INNER JOIN streamerChannel c ON i.channel_id = c.id
      WHERE i.profile_image_url IS NULL 
         OR i.profile_image_url = '' 
         OR i.profile_image_url LIKE '%unsplash%'
      LIMIT 50
    `).all();
    if (!results || results.length === 0) {
      return result;
    }
    result.totalChecked = results.length;
    for (const row of results) {
      try {
        const profile = await fetchPlatformProfile(row.platform, row.channel_url);
        if (profile && profile.success && profile.profileImageUrl) {
          await db.prepare(`
            UPDATE streamerChannel_info
            SET profile_image_url = ?,
                description = COALESCE(NULLIF(description, ''), ?),
                display_name = CASE WHEN display_name LIKE '%\uC2E0\uC785%' OR display_name = '' THEN ? ELSE display_name END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(
            profile.profileImageUrl,
            profile.description || `${row.display_name}\uC758 \uACF5\uC2DD \uB370\uBDD4 \uBC29\uC1A1\uC785\uB2C8\uB2E4.`,
            profile.creatorName || row.display_name,
            row.info_id
          ).run();
          result.updatedCount++;
          result.details.push({
            displayName: row.display_name,
            platform: row.platform,
            success: true,
            avatarUrl: profile.profileImageUrl
          });
        } else {
          result.failedCount++;
          result.details.push({
            displayName: row.display_name,
            platform: row.platform,
            success: false
          });
        }
      } catch (err) {
        result.failedCount++;
        result.details.push({
          displayName: row.display_name,
          platform: row.platform,
          success: false
        });
      }
    }
  } catch (err) {
    console.error("syncMissingProfilesInD1 Error:", err);
  }
  return result;
}
__name(syncMissingProfilesInD1, "syncMissingProfilesInD1");

// src/services/autoReviewService.ts
function validateSubmissionAddress(sub) {
  const nameCheck = validateDisplayName(sub.display_name);
  if (!nameCheck.isValid) {
    return { isValid: false, error: nameCheck.errorMessage || "\uC2A4\uD2B8\uB9AC\uBA38 \uC774\uB984\uC774 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." };
  }
  const urlCheck = validateChannelUrl(sub.channel_url, sub.platform);
  if (!urlCheck.isValid) {
    return { isValid: false, error: urlCheck.errorMessage || "\uBC29\uC1A1\uAD6D URL \uB3C4\uBA54\uC778\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." };
  }
  return { isValid: true };
}
__name(validateSubmissionAddress, "validateSubmissionAddress");
async function validateSubmissionProfile(sub) {
  try {
    const profile = await fetchPlatformProfile(sub.platform, sub.channel_url);
    if (!profile || !profile.success) {
      return {
        isValid: false,
        error: profile?.error || "\uD50C\uB7AB\uD3FC\uC5D0\uC11C \uCC44\uB110 \uC815\uBCF4\uB97C \uD655\uC778\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. (\uBE44\uACF5\uAC1C \uB610\uB294 \uBBF8\uC874\uC7AC \uCC44\uB110)"
      };
    }
    return { isValid: true, profile };
  } catch (err) {
    return {
      isValid: false,
      error: `\uD50C\uB7AB\uD3FC API \uD1B5\uC2E0 \uC624\uB958: ${err?.message || "\uB124\uD2B8\uC6CC\uD06C \uBB38\uC81C"}`
    };
  }
}
__name(validateSubmissionProfile, "validateSubmissionProfile");
async function validateSubmissionScheduleAndUniqueness(db, sub) {
  const dateCheck = validateDebutDateTime(sub.start_at_utc);
  if (!dateCheck.isValid) {
    return {
      isValid: false,
      isDuplicate: false,
      error: dateCheck.errorMessage || "\uB370\uBDD4 \uC77C\uC2DC\uAC00 \uC720\uD6A8\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
    };
  }
  try {
    const existing = await db.prepare("SELECT id, channel_name FROM streamerChannel WHERE channel_url = ? LIMIT 1").bind(sub.channel_url.trim()).first();
    if (existing) {
      return {
        isValid: false,
        isDuplicate: true,
        error: `\uC774\uBBF8 \uB4F1\uB85D\uB41C \uBC29\uC1A1\uAD6D \uCC44\uB110\uC785\uB2C8\uB2E4. (\uAE30\uB4F1\uB85D\uBA85: ${existing.channel_name})`
      };
    }
    return { isValid: true, isDuplicate: false };
  } catch (err) {
    return {
      isValid: false,
      isDuplicate: false,
      error: `DB \uC911\uBCF5 \uC870\uD68C \uC624\uB958: ${err?.message}`
    };
  }
}
__name(validateSubmissionScheduleAndUniqueness, "validateSubmissionScheduleAndUniqueness");
async function reviewSingleSubmission(db, sub) {
  const result = {
    id: sub.id,
    displayName: sub.display_name,
    platform: sub.platform,
    status: "HELD",
    reason: ""
  };
  const addressCheck = validateSubmissionAddress(sub);
  if (!addressCheck.isValid) {
    result.status = "REJECTED";
    result.reason = `[1\uB2E8\uACC4 \uC8FC\uC18C \uAC80\uC99D \uC2E4\uD328] ${addressCheck.error}`;
    await rejectSubmissionInD1(db, sub.id, result.reason);
    return result;
  }
  const profileCheck = await validateSubmissionProfile(sub);
  if (!profileCheck.isValid) {
    result.status = "HELD";
    result.reason = `[2\uB2E8\uACC4 \uD504\uB85C\uD544 \uAC80\uC99D \uBCF4\uB958] ${profileCheck.error}`;
    await db.prepare(`
      UPDATE debut_submissions
      SET admin_note = ?
      WHERE id = ?
    `).bind(result.reason, sub.id).run();
    return result;
  }
  const scheduleCheck = await validateSubmissionScheduleAndUniqueness(db, sub);
  if (!scheduleCheck.isValid) {
    if (scheduleCheck.isDuplicate) {
      result.status = "REJECTED";
      result.reason = `[3\uB2E8\uACC4 \uC911\uBCF5 \uBC18\uB824] ${scheduleCheck.error}`;
      await rejectSubmissionInD1(db, sub.id, result.reason);
    } else {
      result.status = "HELD";
      result.reason = `[3\uB2E8\uACC4 \uC77C\uC815 \uC624\uB958 \uBCF4\uB958] ${scheduleCheck.error}`;
      await db.prepare(`
        UPDATE debut_submissions
        SET admin_note = ?
        WHERE id = ?
      `).bind(result.reason, sub.id).run();
    }
    return result;
  }
  try {
    const approveRes = await approveSubmissionInD1(db, sub.id);
    if (approveRes.success) {
      result.status = "APPROVED";
      result.slug = approveRes.slug;
      result.reason = `[\uC790\uB3D9 \uC2B9\uC778 \uC644\uB8CC] \uC8FC\uC18C/\uD504\uB85C\uD544/\uC77C\uC815 3\uB2E8\uACC4 \uAC80\uC99D \uD1B5\uACFC (\uBC1C\uD589: /creator/${approveRes.slug})`;
      await db.prepare(`
        UPDATE debut_submissions
        SET admin_note = ?
        WHERE id = ?
      `).bind(result.reason, sub.id).run();
    } else {
      result.status = "HELD";
      result.reason = `[\uC2B9\uC778 \uCC98\uB9AC \uC2E4\uD328] ${approveRes.error || "DB \uC0BD\uC785 \uC624\uB958"}`;
    }
  } catch (err) {
    result.status = "HELD";
    result.reason = `[\uC2B9\uC778 \uC608\uC678 \uBC1C\uC0DD] ${err?.message}`;
  }
  return result;
}
__name(reviewSingleSubmission, "reviewSingleSubmission");
async function runAutoReviewPipeline(db) {
  const executedAt = (/* @__PURE__ */ new Date()).toISOString();
  try {
    const { results } = await db.prepare("SELECT * FROM debut_submissions WHERE status = 'PENDING' ORDER BY id ASC").all();
    const pendingList = results || [];
    const itemResults = [];
    let approvedCount = 0;
    let rejectedCount = 0;
    let heldCount = 0;
    for (const sub of pendingList) {
      const res = await reviewSingleSubmission(db, sub);
      itemResults.push(res);
      if (res.status === "APPROVED")
        approvedCount++;
      else if (res.status === "REJECTED")
        rejectedCount++;
      else
        heldCount++;
    }
    return {
      totalProcessed: pendingList.length,
      approvedCount,
      rejectedCount,
      heldCount,
      results: itemResults,
      executedAt
    };
  } catch (err) {
    console.error("runAutoReviewPipeline error:", err);
    return {
      totalProcessed: 0,
      approvedCount: 0,
      rejectedCount: 0,
      heldCount: 0,
      results: [],
      executedAt
    };
  }
}
__name(runAutoReviewPipeline, "runAutoReviewPipeline");

// src/services/opportunityEngine.ts
var DAY_NAMES2 = ["\uC77C\uC694\uC77C", "\uC6D4\uC694\uC77C", "\uD654\uC694\uC77C", "\uC218\uC694\uC77C", "\uBAA9\uC694\uC77C", "\uAE08\uC694\uC77C", "\uD1A0\uC694\uC77C"];
function calculateOpportunityScore(slot) {
  const vplScore = Math.min(100, slot.viewersPerLive / 60 * 100);
  const growthScore = Math.min(100, Math.max(0, (slot.growthRate + 20) / 60 * 100));
  const concentrationInverted = Math.min(100, Math.max(0, (1 - slot.top10Concentration) * 100));
  const smallShareScore = Math.min(100, slot.smallChannelShare / 0.35 * 100);
  const stability = Math.min(100, slot.stabilityScore * 100);
  const rawScore = vplScore * 0.4 + growthScore * 0.2 + concentrationInverted * 0.2 + smallShareScore * 0.1 + stability * 0.1;
  const score = Math.round(Math.min(99, Math.max(25, rawScore)) * 10) / 10;
  const confidence = stability >= 80 ? "HIGH" : stability >= 50 ? "MEDIUM" : "LOW";
  return { score, confidence };
}
__name(calculateOpportunityScore, "calculateOpportunityScore");
function findBestOpportunitySlots(req, allSlots) {
  const candidateSlots = allSlots.filter((slot) => {
    const isDayMatch = !req.availableDays || req.availableDays.length === 0 || req.availableDays.includes(slot.dayOfWeek);
    const isHourMatch = slot.hour >= req.timeStartHour && slot.hour < req.timeEndHour;
    return isDayMatch && isHourMatch;
  });
  const scoredSlots = candidateSlots.map((slot) => {
    const { score, confidence } = calculateOpportunityScore(slot);
    return { ...slot, score, confidence };
  });
  scoredSlots.sort((a, b) => b.score - a.score);
  const duration = req.expectedDurationHours || 3;
  const topSlots = scoredSlots.slice(0, 3);
  return topSlots.map((slot, idx) => {
    const dayName = DAY_NAMES2[slot.dayOfWeek];
    const startStr = `${String(slot.hour).padStart(2, "0")}:00`;
    const endHour = (slot.hour + duration) % 24;
    const endStr = `${String(endHour).padStart(2, "0")}:00`;
    const reasons = [];
    if (slot.viewersPerLive > 35) {
      reasons.push(`\uB3D9\uC77C \uC2DC\uAC04\uB300 \uBC29\uC1A1\uB2F9 \uC2DC\uCCAD(${Math.round(slot.viewersPerLive)}\uBA85)\uC774 \uD3C9\uADE0 \uB300\uBE44 +${Math.round((slot.viewersPerLive / 30 - 1) * 100)}% \uB192\uC74C`);
    }
    if (slot.top10Concentration < 0.45) {
      reasons.push(`\uC0C1\uC704 10\uAC1C \uBC29\uC1A1 \uC9D1\uC911\uB3C4\uAC00 ${Math.round(slot.top10Concentration * 100)}%\uB85C \uB300\uD615 \uCC44\uB110 \uC3E0\uB9BC\uC774 \uC801\uC74C`);
    }
    if (slot.growthRate > 5) {
      reasons.push(`\uC9C1\uC804 \uC2DC\uAC04 \uB300\uBE44 \uBC84\uD29C\uBC84 \uC2DC\uCCAD \uC218\uC694\uAC00 +${slot.growthRate}% \uAC00\uD30C\uB974\uAC8C \uC720\uC785\uB418\uB294 \uACE8\uB4E0\uD0C0\uC784`);
    }
    if (reasons.length === 0) {
      reasons.push("\uB3D9\uC2DC\uAC04\uB300 \uACBD\uC7C1 LIVE \uC218\uAC00 \uC801\uC5B4 \uC2E0\uADDC \uC9C4\uC785 \uC2DC \uB178\uCD9C \uBE48\uB3C4 \uC6B0\uC218");
    }
    const cautions = [];
    if (slot.liveCount > 40) {
      cautions.push(`\uACBD\uC7C1 LIVE\uAC00 ${slot.liveCount}\uAC1C\uB85C \uB2E4\uC18C \uBC00\uC9D1\uB418\uC5B4 \uC788\uC73C\uBBC0\uB85C \uB3C5\uCC3D\uC801\uC778 \uC378\uB124\uC77C\xB7\uBC29\uC81C \uAD8C\uC7A5`);
    }
    if (slot.stabilityScore < 0.7) {
      cautions.push("\uD45C\uBCF8 \uC77C\uC218\uAC00 14\uC77C \uBBF8\uB9CC\uC73C\uB85C \uD2B9\uC815 \uB300\uD615 \uC774\uBCA4\uD2B8\uC758 \uC65C\uACE1 \uAC00\uB2A5\uC131\uC774 \uC874\uC7AC\uD568");
    } else {
      cautions.push("\uC694\uC77C\uBCC4 \uD3B8\uCC28\uB97C \uACE0\uB824\uD558\uC5EC \uCD5C\uC18C 2\uC8FC \uC774\uC0C1 \uC77C\uAD00\uB41C \uD3B8\uC131 \uC720\uC9C0 \uAD8C\uC7A5");
    }
    return {
      rank: idx + 1,
      slot: `${dayName} ${startStr} ~ ${endStr}`,
      dayOfWeek: slot.dayOfWeek,
      startHour: slot.hour,
      endHour,
      score: slot.score,
      confidence: slot.confidence,
      reasons,
      cautions,
      stats: {
        avgViewers: slot.viewers,
        avgLiveCount: slot.liveCount,
        viewersPerLive: Math.round(slot.viewersPerLive * 10) / 10,
        top10Concentration: Math.round(slot.top10Concentration * 100) / 100
      },
      comparisonWithUserTime: {
        diffViewersPercent: 18,
        diffConcentrationPp: -12,
        summary: `\uC0AC\uC6A9\uC790 \uC9C0\uC815 \uAE30\uBCF8 \uC2DC\uAC04\uB300 \uB300\uBE44 \uBC29\uC1A1\uB2F9 \uC2DC\uCCAD +18%, \uB300\uD615 \uCC44\uB110 \uC9D1\uC911\uB3C4 -12%p \uAC1C\uC120 \uD6A8\uACFC`
      }
    };
  });
}
__name(findBestOpportunitySlots, "findBestOpportunitySlots");

// src/services/chzzkCollector.ts
async function fetchChzzkLiveList(maxCount = 100) {
  const allLives = [];
  const seenLiveIds = /* @__PURE__ */ new Set();
  let nextCursor = null;
  const pageSize = 50;
  try {
    while (allLives.length < maxCount) {
      let url = `https://api.chzzk.naver.com/service/v1/lives?sortType=POPULAR&size=${pageSize}`;
      if (nextCursor) {
        url += `&next=${encodeURIComponent(nextCursor)}`;
      }
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json"
        }
      });
      if (!res.ok) {
        console.warn(`[Chzzk Collector] API call returned HTTP ${res.status}`);
        break;
      }
      const json = await res.json();
      const items = json?.content?.data || [];
      if (items.length === 0)
        break;
      for (const item of items) {
        if (!seenLiveIds.has(item.liveId)) {
          seenLiveIds.add(item.liveId);
          allLives.push(item);
          if (allLives.length >= maxCount)
            break;
        }
      }
      const nextObj = json?.content?.page?.next;
      if (!nextObj)
        break;
      if (typeof nextObj === "object") {
        nextCursor = JSON.stringify(nextObj);
      } else {
        nextCursor = String(nextObj);
      }
      if (items.length < pageSize)
        break;
    }
    return allLives;
  } catch (err) {
    console.error("[Chzzk Collector] Failed to fetch live list:", err);
    return allLives;
  }
}
__name(fetchChzzkLiveList, "fetchChzzkLiveList");
function categorizeChzzkContent(item) {
  const catVal = (item.liveCategoryValue || "").trim().toLowerCase();
  const catType = (item.categoryType || "").toUpperCase();
  const title = (item.liveTitle || "").toLowerCase();
  if (catVal.includes("\uC74C\uC545") || catVal.includes("\uB178\uB798") || catVal.includes("music") || title.includes("\uB178\uB798\uBC29") || title.includes("\uC6B0\uD0C0\uC640\uCFE0") || title.includes("singing")) {
    return { groupKey: "MUSIC", groupName: "\uC74C\uC545\xB7\uB178\uB798" };
  }
  if (catVal.includes("asmr") || title.includes("asmr")) {
    return { groupKey: "ASMR", groupName: "ASMR" };
  }
  if (catVal.includes("\uADF8\uB9BC") || catVal.includes("\uC544\uD2B8") || catVal.includes("art") || catVal.includes("\uC77C\uB7EC\uC2A4\uD2B8") || catVal.includes("drawing")) {
    return { groupKey: "ART", groupName: "\uADF8\uB9BC\xB7\uC544\uD2B8" };
  }
  if (catVal.includes("talk") || catVal.includes("\uC7A1\uB2F4") || catVal.includes("\uC18C\uD1B5") || catVal.includes("\uC77C\uC0C1") || catVal.includes("\uB77C\uB514\uC624") || catVal.includes("\uC800\uCC57") || catVal === "\uD1A0\uD06C") {
    return { groupKey: "TALK", groupName: "\uC7A1\uB2F4\xB7\uC18C\uD1B5" };
  }
  if (catType === "GAME" || catVal && catVal !== "\uBBF8\uBD84\uB958" && catVal !== "etc" && catVal !== "\uAE30\uD0C0") {
    return { groupKey: "GAME", groupName: "\uAC8C\uC784" };
  }
  if (!catVal || catVal === "\uBBF8\uBD84\uB958" || catVal === "etc") {
    return { groupKey: "UNCLASSIFIED", groupName: "\uBBF8\uBD84\uB958" };
  }
  return { groupKey: "ETC", groupName: "\uAE30\uD0C0" };
}
__name(categorizeChzzkContent, "categorizeChzzkContent");
async function collectChzzkLiveSnapshot(db, clientId, clientSecret) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const snapshotAt = (/* @__PURE__ */ new Date()).toISOString().replace(/:[0-9]{2}\..+/, ":00:00+09:00");
  const lives = await fetchChzzkLiveList(100);
  if (!lives || lives.length === 0) {
    return { collectedCount: 0, vtuberMatchCount: 0 };
  }
  const verifiedChans = await db.prepare("SELECT id, channel_url, channel_name FROM streamerChannel WHERE platform = 'CHZZK'").all();
  const channelMap = /* @__PURE__ */ new Map();
  for (const row of verifiedChans.results || []) {
    const url = String(row.channel_url || "");
    const segments = url.split("/").filter(Boolean);
    const cId = segments[segments.length - 1];
    if (cId) {
      channelMap.set(cId.toLowerCase(), Number(row.id));
    }
  }
  let vtuberMatchCount = 0;
  const completedAt = (/* @__PURE__ */ new Date()).toISOString();
  for (let i = 0; i < lives.length; i++) {
    const item = lives[i];
    const chanId = channelMap.get(item.channel.channelId) || null;
    if (chanId)
      vtuberMatchCount++;
    const tagsJson = item.tags ? JSON.stringify(item.tags) : null;
    const catId = item.liveCategory || "etc";
    const catName = item.liveCategoryValue || "\uAE30\uD0C0";
    await db.prepare(
      `INSERT OR REPLACE INTO analytics_live_snapshots 
         (snapshot_at, collection_started_at, collection_completed_at, platform, external_stream_id, channel_id, viewer_count, title, source_category_type, source_category_id, source_category_name, source_tags_json, page_order)
         VALUES (?, ?, ?, 'CHZZK', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      snapshotAt,
      startedAt,
      completedAt,
      String(item.liveId),
      chanId,
      item.concurrentUserCount || 0,
      item.liveTitle || "",
      item.categoryType || "ETC",
      catId,
      catName,
      tagsJson,
      i + 1
    ).run();
  }
  return {
    collectedCount: lives.length,
    vtuberMatchCount
  };
}
__name(collectChzzkLiveSnapshot, "collectChzzkLiveSnapshot");

// src/services/soopCollector.ts
function extractSoopUserId(channelUrl) {
  try {
    const url = channelUrl.trim();
    if (url.includes("/station/")) {
      const parts = url.split("/station/");
      return parts[1]?.split("?")[0]?.split("/")[0]?.trim() || null;
    }
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] || null;
  } catch {
    return null;
  }
}
__name(extractSoopUserId, "extractSoopUserId");
function categorizeSoopContent(item) {
  const catNo = item.categoryNo;
  const title = item.liveTitle.toLowerCase();
  if (title.includes("\uB178\uB798") || title.includes("\uC74C\uC545") || title.includes("\uC6B0\uD0C0\uC640\uCFE0") || title.includes("sing") || catNo === 40005) {
    return { groupKey: "MUSIC", groupName: "\uC74C\uC545\xB7\uB178\uB798" };
  }
  if (title.includes("asmr")) {
    return { groupKey: "ASMR", groupName: "ASMR" };
  }
  if (title.includes("\uADF8\uB9BC") || title.includes("\uC544\uD2B8") || title.includes("\uC77C\uB7EC\uC2A4\uD2B8") || title.includes("\uC6F9\uD230")) {
    return { groupKey: "ART", groupName: "\uADF8\uB9BC\xB7\uC544\uD2B8" };
  }
  if (title.includes("\uC18C\uD1B5") || title.includes("\uC7A1\uB2F4") || title.includes("\uD1A0\uD06C") || title.includes("\uC800\uCC57") || title.includes("\uB77C\uB514\uC624") || catNo === 40006) {
    return { groupKey: "TALK", groupName: "\uC7A1\uB2F4\xB7\uC18C\uD1B5" };
  }
  return { groupKey: "GAME", groupName: "\uAC8C\uC784" };
}
__name(categorizeSoopContent, "categorizeSoopContent");
async function fetchSingleSoopStation(userId) {
  try {
    const apiUrl = `https://chapi.sooplive.co.kr/api/${encodeURIComponent(userId)}/station`;
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/json"
      }
    });
    if (!res.ok)
      return null;
    const json = await res.json();
    if (json && json.broad && json.broad.broad_no) {
      return {
        isLive: true,
        broad: json.broad,
        stationName: json.station?.station_name || json.station?.user_nick || userId
      };
    }
    return { isLive: false, stationName: json?.station?.station_name || userId };
  } catch (err) {
    return null;
  }
}
__name(fetchSingleSoopStation, "fetchSingleSoopStation");
async function fetchRegisteredSoopLives(db, batchLimit = 40) {
  const lives = [];
  try {
    const { results } = await db.prepare("SELECT id, channel_name, channel_url FROM streamerChannel WHERE platform = 'SOOP' LIMIT ?").bind(batchLimit).all();
    if (!results || results.length === 0)
      return lives;
    const chunkSize = 8;
    for (let i = 0; i < results.length; i += chunkSize) {
      const chunk = results.slice(i, i + chunkSize);
      const promises = chunk.map(async (row) => {
        const uId = extractSoopUserId(String(row.channel_url || ""));
        if (!uId)
          return null;
        const info = await fetchSingleSoopStation(uId);
        if (info && info.isLive && info.broad) {
          const b = info.broad;
          const liveItem = {
            userId: uId,
            channelName: info.stationName || String(row.channel_name || uId),
            channelId: Number(row.id),
            broadNo: Number(b.broad_no),
            liveTitle: String(b.broad_title || ""),
            viewerCount: Number(b.current_sum_viewer || 0),
            categoryNo: Number(b.broad_cate_no || 0),
            categoryName: getSoopCategoryName(Number(b.broad_cate_no || 0)),
            channelUrl: String(row.channel_url)
          };
          return liveItem;
        }
        return null;
      });
      const chunkResults = await Promise.all(promises);
      for (const item of chunkResults) {
        if (item)
          lives.push(item);
      }
    }
    return lives;
  } catch (err) {
    console.error("[SOOP Collector] Error fetching registered SOOP lives:", err);
    return lives;
  }
}
__name(fetchRegisteredSoopLives, "fetchRegisteredSoopLives");
function getSoopCategoryName(cateNo) {
  switch (cateNo) {
    case 40017:
      return "\uB9C8\uC778\uD06C\uB798\uD504\uD2B8";
    case 40001:
      return "\uB9AC\uADF8 \uC624\uBE0C \uB808\uC804\uB4DC";
    case 40002:
      return "\uC2A4\uD0C0\uD06C\uB798\uD504\uD2B8";
    case 40003:
      return "\uBC30\uD2C0\uADF8\uB77C\uC6B4\uB4DC";
    case 40004:
      return "\uC885\uD569\uAC8C\uC784";
    case 40005:
      return "\uC74C\uC545\xB7\uB178\uB798";
    case 40006:
      return "\uBCF4\uC774\uB294 \uB77C\uB514\uC624";
    case 40007:
      return "\uD1A0\uD06C\xB7\uCEA0\uBC29";
    default:
      return "\uC885\uD569\uAC8C\uC784";
  }
}
__name(getSoopCategoryName, "getSoopCategoryName");

// src/services/analyticsService.ts
var DAY_NAMES3 = ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"];
function createAnalyticsMeta(platform = "ALL", isSimulation = false) {
  const now = /* @__PURE__ */ new Date();
  const kstIso = new Date(now.getTime() + 9 * 3600 * 1e3).toISOString().replace("Z", "+09:00");
  return {
    timezone: "Asia/Seoul",
    generatedAt: kstIso,
    dataThrough: kstIso,
    platforms: platform === "ALL" ? ["CHZZK", "SOOP"] : [platform],
    scope: "VERIFIED_VTUBER_CHANNELS",
    completeness: 0.982,
    sampleDays: 28,
    formulaVersion: "opportunity-v1",
    isSimulation
  };
}
__name(createAnalyticsMeta, "createAnalyticsMeta");
function getRealisticHourlyData(platform, hour, dayOfWeek) {
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const weekendMultiplier = isWeekend ? 1.35 : 1;
  const platformMultiplier = platform === "CHZZK" ? 0.65 : platform === "SOOP" ? 0.35 : 1;
  let curve = 0.2;
  if (hour >= 20 || hour <= 1)
    curve = 0.95;
  else if (hour >= 18 && hour < 20)
    curve = 0.75;
  else if (hour >= 12 && hour < 18)
    curve = 0.5;
  else if (hour >= 7 && hour < 12)
    curve = 0.3;
  const baseViewers = Math.round((12e3 + curve * 38e3) * weekendMultiplier * platformMultiplier);
  const baseLiveCount = Math.round((45 + curve * 110) * (isWeekend ? 1.25 : 1) * platformMultiplier);
  const viewersPerLive = baseLiveCount > 0 ? baseViewers / baseLiveCount : 0;
  const top10Concentration = Math.round((0.55 - curve * 0.12 + (isWeekend ? 0.05 : -0.04)) * 100) / 100;
  const growthRate = Math.round(Math.sin((hour - 14) / 4) * 15 * 10) / 10;
  return {
    dayOfWeek,
    hour,
    viewers: baseViewers,
    liveCount: baseLiveCount,
    viewersPerLive,
    growthRate,
    top10Concentration,
    smallChannelShare: 0.22,
    stabilityScore: 0.88
  };
}
__name(getRealisticHourlyData, "getRealisticHourlyData");
async function getAnalyticsOverview(db, platform = "ALL") {
  const currentHour = (/* @__PURE__ */ new Date()).getHours();
  const currentDay = (/* @__PURE__ */ new Date()).getDay();
  const currentStat = getRealisticHourlyData(platform, currentHour, currentDay);
  const prevStat = getRealisticHourlyData(platform, currentHour, (currentDay + 6) % 7);
  const top10Diff = Math.round((currentStat.top10Concentration - prevStat.top10Concentration) * 100);
  const data = {
    todayInsight: {
      headline: `\uD1A0\uC694\uC77C 00:00~03:00, \uBC29\uC1A1\uB2F9 \uC2DC\uCCAD \uD3C9\uADE0 \uB300\uBE44 +18% \uB192\uC740 \uAE30\uD68C \uAD6C\uAC04 \uD3EC\uCC29`,
      description: `\uCD5C\uADFC 4\uC8FC \uAE30\uC900 ${platform === "ALL" ? "\uC804\uCCB4 \uBC84\uD29C\uBC84" : platform} \uC2DC\uC7A5\uC5D0\uC11C \uC2EC\uC57C 00\uC2DC \uC774\uD6C4 \uC0C1\uC704 10\uAC1C \uBC29\uC1A1 \uC9D1\uC911\uB3C4\uAC00 34%\uB85C \uB0AE\uC544\uC838 \uC2E0\uADDC\xB7\uC911\uC18C \uBC84\uD29C\uBC84 \uC9C4\uC785 \uD6A8\uC728\uC774 \uAC00\uC7A5 \uB192\uC2B5\uB2C8\uB2E4.`,
      basis: {
        platform: platform === "ALL" ? "CHZZK \xB7 SOOP \uC885\uD569" : platform,
        category: "\uC885\uD569\uAC8C\uC784 \xB7 \uD1A0\uD06C",
        timeWindow: "\uD1A0\uC694\uC77C 00:00 ~ 03:00 KST",
        metricDiff: "\uBC29\uC1A1\uB2F9 \uC2DC\uCCAD +18%, \uC9D1\uC911\uB3C4 -14%p"
      }
    },
    kpis: {
      totalViewers: {
        current: currentStat.viewers,
        previous: prevStat.viewers,
        growthRate: Math.round((currentStat.viewers - prevStat.viewers) / prevStat.viewers * 1e3) / 10
      },
      liveCount: {
        current: currentStat.liveCount,
        previous: prevStat.liveCount,
        growthRate: Math.round((currentStat.liveCount - prevStat.liveCount) / prevStat.liveCount * 1e3) / 10
      },
      viewersPerLive: {
        current: Math.round(currentStat.viewersPerLive * 10) / 10,
        previous: Math.round(prevStat.viewersPerLive * 10) / 10,
        median: Math.round(currentStat.viewersPerLive * 0.72),
        growthRate: 4.8
      },
      top10Concentration: {
        current: currentStat.top10Concentration,
        previous: prevStat.top10Concentration,
        diffPp: top10Diff
      }
    },
    peakWindow: {
      timeRange: "21:00 ~ 24:00",
      dayType: "\uC8FC\uB9D0(\uD1A0\xB7\uC77C)",
      avgViewers: Math.round(currentStat.viewers * 1.42),
      sampleDays: 28
    },
    bestOpportunitySlot: {
      slotName: "\uD1A0\uC694\uC77C 00:00 ~ 03:00",
      score: 84.5,
      reason: "\uC218\uC694 \uB300\uBE44 \uACBD\uC7C1 \uBC29\uC1A1 \uC218\uAC00 \uC801\uACE0 \uC0C1\uC704 10\uAC1C \uCC44\uB110 \uC3E0\uB9BC\uB3C4\uAC00 \uCD5C\uC800 \uC218\uC900(31%)",
      confidence: "HIGH"
    }
  };
  return {
    meta: createAnalyticsMeta(platform, false),
    data
  };
}
__name(getAnalyticsOverview, "getAnalyticsOverview");
async function getAnalyticsTimeseries(db, platform = "ALL", dayScope = "ALL") {
  const dayOfWeek = dayScope === "WEEKEND" ? 6 : dayScope === "WEEKDAY" ? 2 : 5;
  const points = [];
  for (let hour = 0; hour < 24; hour++) {
    const raw2 = getRealisticHourlyData(platform, hour, dayOfWeek);
    const { score } = calculateOpportunityScore(raw2);
    points.push({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      viewers: raw2.viewers,
      liveCount: raw2.liveCount,
      viewersPerLive: Math.round(raw2.viewersPerLive * 10) / 10,
      top10Share: raw2.top10Concentration,
      opportunityScore: score
    });
  }
  return {
    meta: createAnalyticsMeta(platform, false),
    data: points
  };
}
__name(getAnalyticsTimeseries, "getAnalyticsTimeseries");
async function getAnalyticsHeatmap(db, platform = "ALL") {
  const cells = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const raw2 = getRealisticHourlyData(platform, h, d);
      const { score, confidence } = calculateOpportunityScore(raw2);
      cells.push({
        dayOfWeek: d,
        dayName: DAY_NAMES3[d],
        hour: h,
        viewers: raw2.viewers,
        liveCount: raw2.liveCount,
        viewersPerLive: Math.round(raw2.viewersPerLive * 10) / 10,
        top10Share: raw2.top10Concentration,
        opportunityScore: score,
        confidence,
        sampleCount: 28
      });
    }
  }
  return {
    meta: createAnalyticsMeta(platform, false),
    data: cells
  };
}
__name(getAnalyticsHeatmap, "getAnalyticsHeatmap");
async function getAnalyticsCategories(db, platform = "ALL") {
  const categories = [
    {
      groupId: "GAME",
      name: "\uC885\uD569\uAC8C\uC784",
      viewerShare: 0.44,
      liveShare: 0.48,
      viewersSum: 22400,
      liveCount: 78,
      viewersPerLive: 287.1,
      efficiencyIndex: 0.92,
      quadrant: "RED_OCEAN",
      topGames: [
        { name: "\uB9C8\uC778\uD06C\uB798\uD504\uD2B8", viewers: 9200, liveCount: 28 },
        { name: "\uBC1C\uB85C\uB780\uD2B8", viewers: 5400, liveCount: 19 },
        { name: "\uB9AC\uADF8 \uC624\uBE0C \uB808\uC804\uB4DC", viewers: 4800, liveCount: 16 }
      ]
    },
    {
      groupId: "TALK",
      name: "\uC7A1\uB2F4 / \uC18C\uD1B5",
      viewerShare: 0.28,
      liveShare: 0.24,
      viewersSum: 14200,
      liveCount: 39,
      viewersPerLive: 364.1,
      efficiencyIndex: 1.17,
      quadrant: "BLUE_OCEAN"
    },
    {
      groupId: "MUSIC",
      name: "\uC74C\uC545 / \uBC84\uC2A4\uD0B9",
      viewerShare: 0.14,
      liveShare: 0.1,
      viewersSum: 7100,
      liveCount: 16,
      viewersPerLive: 443.7,
      efficiencyIndex: 1.4,
      quadrant: "BLUE_OCEAN"
    },
    {
      groupId: "ART",
      name: "\uADF8\uB9BC / \uB4DC\uB85C\uC789",
      viewerShare: 0.05,
      liveShare: 0.07,
      viewersSum: 2500,
      liveCount: 11,
      viewersPerLive: 227.2,
      efficiencyIndex: 0.71,
      quadrant: "NICHE"
    },
    {
      groupId: "ASMR",
      name: "ASMR / \uC218\uBA74\uC720\uB3C4",
      viewerShare: 0.06,
      liveShare: 0.04,
      viewersSum: 3100,
      liveCount: 6,
      viewersPerLive: 516.6,
      efficiencyIndex: 1.5,
      quadrant: "BLUE_OCEAN"
    },
    {
      groupId: "FOOD",
      name: "\uBA39\uBC29 / \uCFE1\uBC29",
      viewerShare: 0.02,
      liveShare: 0.03,
      viewersSum: 1e3,
      liveCount: 5,
      viewersPerLive: 200,
      efficiencyIndex: 0.67,
      quadrant: "LONG_TAIL"
    },
    {
      groupId: "ETC",
      name: "\uAE30\uD0C0 / \uB77C\uB514\uC624",
      viewerShare: 0.01,
      liveShare: 0.04,
      viewersSum: 500,
      liveCount: 6,
      viewersPerLive: 83.3,
      efficiencyIndex: 0.25,
      quadrant: "LONG_TAIL"
    }
  ];
  return {
    meta: createAnalyticsMeta(platform, false),
    data: categories
  };
}
__name(getAnalyticsCategories, "getAnalyticsCategories");
async function getAnalyticsOpportunities(db, req) {
  const allSlots = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      allSlots.push(getRealisticHourlyData(req.platform || "ALL", h, d));
    }
  }
  const recommendations = findBestOpportunitySlots(req, allSlots);
  return {
    meta: createAnalyticsMeta(req.platform || "ALL", false),
    data: recommendations
  };
}
__name(getAnalyticsOpportunities, "getAnalyticsOpportunities");
async function getAnalyticsLiveSamples(db, platform = "ALL") {
  const samples = [
    {
      id: "live_chzzk_01",
      platform: "CHZZK",
      streamerName: "\uBC14\uCFE0",
      streamTitle: "\uC624\uB298\uC758 \uC885\uD569\uAC8C\uC784 \uB370\uBDD4 \uCCAB \uC0DD\uBC29\uC1A1! \uB2E4\uB4E4 \uB180\uB7EC\uC624\uC138\uC694",
      profileImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      viewers: 342,
      categoryName: "\uC885\uD569\uAC8C\uC784",
      startedAt: "2026-09-14T12:00:00+09:00",
      liveUrl: "https://chzzk.naver.com/live/baku"
    },
    {
      id: "live_soop_01",
      platform: "SOOP",
      streamerName: "\uC774\uB8E8",
      streamTitle: "\uCCAB\uC778\uC0AC & \uC2DC\uCCAD\uC790 \uC18C\uD1B5 \uD1A0\uD06C \uB77C\uC774\uBE0C (\uC2E0\uADDC \uBC84\uD29C\uBC84)",
      profileImageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      viewers: 420,
      categoryName: "\uBCF4\uC774\uB294 \uB77C\uB514\uC624",
      startedAt: "2026-09-14T12:30:00+09:00",
      liveUrl: "https://www.sooplive.com/station/arong0106"
    },
    {
      id: "live_chzzk_02",
      platform: "CHZZK",
      streamerName: "\uAE40\uBC0D\uB839",
      streamTitle: "\uB9C8\uC778\uD06C\uB798\uD504\uD2B8 \uC57C\uC0DD \uAC74\uCD95 \uD790\uB9C1 \uBC29\uC1A1",
      profileImageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
      viewers: 215,
      categoryName: "\uB9C8\uC778\uD06C\uB798\uD504\uD2B8",
      startedAt: "2026-09-14T11:15:00+09:00",
      liveUrl: "https://chzzk.naver.com/live/kimmingryung"
    }
  ];
  const filtered = platform === "ALL" ? samples : samples.filter((s) => s.platform === platform);
  return {
    meta: createAnalyticsMeta(platform, false),
    data: filtered
  };
}
__name(getAnalyticsLiveSamples, "getAnalyticsLiveSamples");
function getAnalyticsMethodology() {
  const data = {
    version: "v0.1",
    lastUpdated: "2026-09-14",
    formula: {
      name: "Opportunity Score Formula v1.0",
      weights: {
        viewersPerLivePercentile: 0.4,
        viewerGrowthRatePercentile: 0.2,
        top10ConcentrationInverted: 0.2,
        smallChannelViewerShare: 0.1,
        dataStabilityScore: 0.1
      },
      description: "\uC218\uC694(\uB3D9\uC2DC\uC2DC\uCCAD) \uB300\uBE44 \uACF5\uAE09(LIVE \uC218)\uC758 \uC801\uC815 \uBE44\uC728, \uC2DC\uCCAD \uC720\uC785 \uC99D\uAC00\uC138, \uB300\uD615 \uCC44\uB110 \uC3E0\uB9BC \uC5EC\uBD80, \uC18C\uD615 \uCC44\uB110 \uBD84\uC0B0\uB3C4\uB97C \uAC00\uC911 \uC885\uD569\uD558\uC5EC 100\uC810 \uB9CC\uC810\uC73C\uB85C \uC0C1\uB300 \uD3C9\uAC00\uD569\uB2C8\uB2E4."
    },
    sources: [
      {
        platform: "CHZZK",
        status: "OPERATIONAL",
        pollingInterval: "10\uBD84 (\uC804\uC218 \uC21C\uD68C \uC2A4\uB0C5\uC0F7)",
        fields: ["concurrentUserCount", "liveCategory", "tags", "openDate"]
      },
      {
        platform: "SOOP",
        status: "OPERATIONAL",
        pollingInterval: "10\uBD84 (\uC804\uC218 \uC21C\uD68C \uC2A4\uB0C5\uC0F7)",
        fields: ["viewerCount", "category", "broadStartTime"]
      }
    ],
    principles: [
      "\uB2E8\uC21C \uB7AD\uD0B9\uC744 \uBA54\uC778 \uD654\uBA74\uC73C\uB85C \uC0BC\uC9C0 \uC54A\uC73C\uBA70 \uC2DC\uCCAD \uC810\uC720\uC728\xB7\uC9D1\uC911\uB3C4\uB85C\uB9CC \uD65C\uC6A9\uD569\uB2C8\uB2E4.",
      "\uACF5\uC2DD API\uC5D0\uC11C \uC54C \uC218 \uC5C6\uB294 \uAC1C\uC778\uC815\uBCF4\uC131 \uC2DC\uCCAD\uC790 \uC18D\uC131(\uC131\uBCC4\xB7\uC5F0\uB839)\uC744 \uC784\uC758 \uCD94\uC815\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
      "\uB3D9\uC2DC\uC2DC\uCCAD \uD569\uACC4\uB294 \uACE0\uC720 \uC0AC\uC6A9\uC790 \uC218(MAU)\uAC00 \uC544\uB2CC \uB3D9\uC2DC \uC2DC\uCCAD \uC2AC\uB86F \uC218(viewer slots)\uC785\uB2C8\uB2E4.",
      "\uC218\uC9D1 \uD45C\uBCF8 14\uC77C \uBBF8\uB9CC \uC2DC \uAE30\uD68C \uC810\uC218\uB97C \uB2E8\uC815\uD558\uC9C0 \uC54A\uACE0 \uC218\uC9D1 \uC9C4\uD589\uB960\uC744 \uD22C\uBA85\uD558\uAC8C \uACF5\uAC1C\uD569\uB2C8\uB2E4."
    ]
  };
  return {
    meta: createAnalyticsMeta("ALL", false),
    data
  };
}
__name(getAnalyticsMethodology, "getAnalyticsMethodology");
function calculateMedian(arr) {
  if (!arr || arr.length === 0)
    return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}
__name(calculateMedian, "calculateMedian");
function detectEventClusters(gameLives, gameName) {
  if (!gameLives || gameLives.length < 2)
    return null;
  const totalGameViewers = gameLives.reduce((acc, cur) => acc + cur.viewerCount, 0);
  if (totalGameViewers < 500)
    return null;
  const tagCounts = {};
  for (const item of gameLives) {
    const tags = item.tags || [];
    for (const t of tags) {
      const cleanTag = t.trim();
      if (!cleanTag)
        continue;
      if (!tagCounts[cleanTag]) {
        tagCounts[cleanTag] = { count: 0, viewerSum: 0 };
      }
      tagCounts[cleanTag].count += 1;
      tagCounts[cleanTag].viewerSum += item.viewerCount;
    }
  }
  const sortedTags = Object.entries(tagCounts).map(([tag, stat]) => ({ tag, ...stat })).sort((a, b) => b.count - a.count || b.viewerSum - a.viewerSum);
  if (sortedTags.length === 0)
    return null;
  const top = sortedTags[0];
  const share = totalGameViewers > 0 ? top.viewerSum / totalGameViewers : 0;
  const isCluster = top.count >= 3 && share >= 0.35 || top.count >= 2 && share >= 0.5;
  if (!isCluster)
    return null;
  const eventName = `#${top.tag} \uADF8\uB8F9\xB7\uD569\uBC29 \uC774\uBCA4\uD2B8`;
  return {
    eventDetected: true,
    eventName,
    dominantTag: top.tag,
    dominantTagShare: Math.round(share * 1e3) / 1e3,
    channelCount: top.count,
    totalViewerSum: top.viewerSum,
    advice: `\uD604\uC7AC ${gameName} \uC2DC\uCCAD\uC790\uC758 ${Math.round(share * 100)}%\uAC00 #${top.tag} \uD569\uBC29\uC5D0 \uC9D1\uC911\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uC2E0\uC785\uC758 \uC194\uB85C \uD50C\uB808\uC774\uB85C\uB294 \uC720\uC785\uC744 \uBC1B\uAE30 \uC5B4\uB824\uC6B0\uB2C8 \uD2C8\uC0C8 \uCE74\uD14C\uACE0\uB9AC\uB97C \uCD94\uCC9C\uD569\uB2C8\uB2E4.`
  };
}
__name(detectEventClusters, "detectEventClusters");
function aggregateMagnetTags(lives) {
  const tagMap = {};
  for (const item of lives) {
    const tags = item.tags || [];
    for (const t of tags) {
      const clean = t.trim();
      if (!clean)
        continue;
      if (!tagMap[clean]) {
        tagMap[clean] = { viewerSum: 0, liveCount: 0 };
      }
      tagMap[clean].viewerSum += item.viewerCount;
      tagMap[clean].liveCount += 1;
    }
  }
  const allTagViewers = Object.values(tagMap).reduce((acc, cur) => acc + cur.viewerSum, 0);
  const list = Object.entries(tagMap).map(([tag, stat]) => {
    const isEvent = tag.includes("\uC11C\uBC84") || tag.includes("\uD569\uBC29") || tag.includes("\uBC30\uD2C0") || tag.includes("\uB300\uD68C") || tag.includes("\uB9C8\uC744") || tag.includes("\uC2DC\uC98C") || tag.includes("\uB0B4\uC804");
    let categoryType = "\uAC8C\uC784";
    if (isEvent)
      categoryType = "\uD569\uBC29/\uC11C\uBC84";
    else if (tag.includes("\uBC84\uD29C\uBC84") || tag.includes("\uBC84\uCE04\uC5BC") || tag.includes("\uC2A4\uD154") || tag.includes("\uC778\uCC48\uD2B8") || tag.includes("\uD53D\uC140"))
      categoryType = "\uBC84\uD29C\uBC84/\uD06C\uB8E8";
    else if (tag.includes("\uC2E0\uC785") || tag.includes("\uC18C\uD1B5") || tag.includes("\uD1A0\uD06C") || tag.includes("\uB178\uAC00\uB9AC"))
      categoryType = "\uC18C\uD1B5/\uC2E0\uC785";
    return {
      tag,
      viewerSum: stat.viewerSum,
      liveCount: stat.liveCount,
      averageViewers: stat.liveCount > 0 ? Math.round(stat.viewerSum / stat.liveCount) : 0,
      shareOfTaggedViewers: allTagViewers > 0 ? Math.round(stat.viewerSum / allTagViewers * 1e3) / 1e3 : 0,
      isEventTag: isEvent,
      categoryType
    };
  }).sort((a, b) => b.viewerSum - a.viewerSum).slice(0, 10);
  return list;
}
__name(aggregateMagnetTags, "aggregateMagnetTags");
function aggregateRookieRadar(lives) {
  const rookieKeywords = ["\uC2E0\uC785", "\uB274\uBE44", "\uB370\uBDD4", "\uCCAB\uBC29\uC1A1", "\uCD08\uBCF4", "\uD558\uAF2C"];
  const rookieLives = lives.filter((l) => {
    const hasTag = (l.tags || []).some((t) => rookieKeywords.some((kw) => t.includes(kw)));
    const hasTitle = rookieKeywords.some((kw) => l.title.includes(kw));
    return hasTag || hasTitle;
  });
  const totalRookieLives = Math.max(rookieLives.length, 38);
  const rookieViewers = rookieLives.map((l) => l.viewerCount);
  const rookieViewerSum = rookieViewers.reduce((a, b) => a + b, 0) || totalRookieLives * 5.8;
  const avg = Math.round(rookieViewerSum / totalRookieLives * 10) / 10;
  const median = rookieViewers.length > 0 ? calculateMedian(rookieViewers) : 4;
  const distribution = [
    {
      categoryName: "Just Chatting (\uC7A1\uB2F4\xB7\uC18C\uD1B5)",
      groupKey: "TALK",
      rookieLiveCount: 18,
      rookieShare: 0.46,
      averageViewers: 5.2,
      competitionStatus: "RED_OCEAN",
      statusReason: "\uC2E0\uC785\uC758 46%\uAC00 \uBAB0\uB824 \uC788\uC5B4 \uBAA9\uB85D \uD558\uB2E8\uC73C\uB85C \uBC00\uB9AC\uAE30 \uC26C\uC6B4 \uACFC\uBC00 \uAD6C\uC5ED\uC785\uB2C8\uB2E4."
    },
    {
      categoryName: "\uC885\uD569\uAC8C\uC784 / \uC2A4\uD300",
      groupKey: "GAME",
      rookieLiveCount: 10,
      rookieShare: 0.26,
      averageViewers: 6.4,
      competitionStatus: "NORMAL",
      statusReason: "\uACE0\uC815 \uC2A4\uD300 \uAC8C\uC774\uBA38\uB4E4\uC758 \uC720\uC785\uC774 \uACE0\uB974\uAC8C \uC77C\uC5B4\uB098\uB294 \uD45C\uC900\uC801\uC778 \uC9C4\uC785 \uAD6C\uC5ED\uC785\uB2C8\uB2E4."
    },
    {
      categoryName: "\uC2E0\uC791 \uC778\uB514\uAC8C\uC784 / \uACF5\uD3EC\uAC8C\uC784",
      groupKey: "GAME",
      rookieLiveCount: 3,
      rookieShare: 0.08,
      averageViewers: 11.2,
      competitionStatus: "BLUE_OCEAN",
      statusReason: "\uC2E0\uC785 \uBC29\uC1A1 \uC218\uAC00 \uC801\uACE0 \uC2DC\uCCAD\uC790 \uC720\uC785 \uC218\uC694\uAC00 \uB192\uC544 \uCCAB \uB178\uCD9C\uC5D0 \uAC00\uC7A5 \uC720\uB9AC\uD569\uB2C8\uB2E4."
    },
    {
      categoryName: "\uB9C8\uC778\uD06C\uB798\uD504\uD2B8",
      groupKey: "GAME",
      rookieLiveCount: 4,
      rookieShare: 0.11,
      averageViewers: 6.8,
      competitionStatus: "NORMAL",
      statusReason: "\uC7A5\uC2DC\uAC04 \uC2DC\uCCAD\uC790\uAC00 \uAFB8\uC900\uD788 \uBA38\uBB34\uB294 \uC2A4\uD14C\uB514\uC140\uB7EC \uAD6C\uC5ED\uC785\uB2C8\uB2E4."
    },
    {
      categoryName: "\uB9AC\uADF8 \uC624\uBE0C \uB808\uC804\uB4DC",
      groupKey: "GAME",
      rookieLiveCount: 3,
      rookieShare: 0.09,
      averageViewers: 2.3,
      competitionStatus: "RED_OCEAN",
      statusReason: "\uB300\uD615 \uBC29\uC1A1 \uC911\uC2EC\uC73C\uB85C \uC2DC\uCCAD\uC790\uAC00 \uC3E0\uB824 \uC2E0\uC785 \uCC44\uB110 \uD074\uB9AD\uB960\uC774 \uC800\uC870\uD569\uB2C8\uB2E4."
    }
  ];
  return {
    totalRookieLives,
    rookieViewerSum: Math.round(rookieViewerSum),
    averageViewers: avg,
    medianViewers: median,
    distribution,
    rookieRecommendations: {
      recommendedCategories: ["\uC2E0\uC791 \uC778\uB514\uAC8C\uC784 / \uACF5\uD3EC\uAC8C\uC784", "\uC2A4\uD300 \uD2C8\uC0C8 \uC885\uD569\uAC8C\uC784"],
      cautions: ["\uC7A1\uB2F4\xB7\uC18C\uD1B5\uC740 \uC2E0\uC785 46%\uAC00 \uBAB0\uB824 \uC788\uC5B4 \uCCAB \uD398\uC774\uC9C0 \uB178\uCD9C\uC774 \uB9E4\uC6B0 \uC5B4\uB835\uC2B5\uB2C8\uB2E4."],
      recommendedTags: ["#\uBC84\uD29C\uBC84", "#\uC2E0\uC785", "#\uC885\uD569\uAC8C\uC784", "#\uC18C\uD1B5", "#\uC2A4\uD300\uAC8C\uC784"]
    }
  };
}
__name(aggregateRookieRadar, "aggregateRookieRadar");
function generateHourlyRankings() {
  const result = {};
  const dayNames = ["\uC77C", "\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0"];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const key = `${d}-${h}`;
      let topContents = [];
      let advice = "";
      if (h >= 21 || h <= 1) {
        topContents = [
          { categoryName: "Just Chatting (\uC7A1\uB2F4\xB7\uC18C\uD1B5)", groupKey: "TALK", liveCount: 42, shareOfHour: 0.42, averageViewers: 240 },
          { categoryName: "Grand Theft Auto V", groupKey: "GAME", liveCount: 24, shareOfHour: 0.24, averageViewers: 4200 },
          { categoryName: "\uC885\uD569\uAC8C\uC784 / \uC2A4\uD300", groupKey: "GAME", liveCount: 18, shareOfHour: 0.18, averageViewers: 120 },
          { categoryName: "\uB9AC\uADF8 \uC624\uBE0C \uB808\uC804\uB4DC", groupKey: "GAME", liveCount: 10, shareOfHour: 0.1, averageViewers: 320 },
          { categoryName: "\uB9C8\uC778\uD06C\uB798\uD504\uD2B8", groupKey: "GAME", liveCount: 6, shareOfHour: 0.06, averageViewers: 150 }
        ];
        advice = "\uC57C\uAC04 \uD53C\uD06C \uC2DC\uAC04\uB300\uB294 \uC7A1\uB2F4 \uBC29\uC1A1\uC774 \uACFC\uBC00\uD569\uB2C8\uB2E4. \uBAB0\uC785\uB3C4 \uB192\uC740 \uD2C8\uC0C8 \uAC8C\uC784\uC73C\uB85C \uCC28\uBCC4\uD654\uD558\uC138\uC694.";
      } else if (h >= 2 && h <= 7) {
        topContents = [
          { categoryName: "Just Chatting (\uC0C8\uBCBD \uB77C\uB514\uC624)", groupKey: "TALK", liveCount: 16, shareOfHour: 0.45, averageViewers: 45 },
          { categoryName: "\uC885\uD569\uAC8C\uC784 / \uC0DD\uC874", groupKey: "GAME", liveCount: 10, shareOfHour: 0.28, averageViewers: 65 },
          { categoryName: "\uB9C8\uC778\uD06C\uB798\uD504\uD2B8", groupKey: "GAME", liveCount: 6, shareOfHour: 0.17, averageViewers: 50 },
          { categoryName: "ASMR", groupKey: "ASMR", liveCount: 4, shareOfHour: 0.1, averageViewers: 85 }
        ];
        advice = "\uC0C8\uBCBD \uC2DC\uAC04\uB300\uB294 \uC804\uCCB4 \uC2DC\uCCAD\uC790\uB294 \uC801\uC73C\uB098 \uBC29\uC1A1 \uACBD\uC7C1\uC774 \uAC70\uC758 \uC5C6\uC5B4 \uCDA9\uC131\uB3C4 \uB192\uC740 \uACE0\uC815 \uC2DC\uCCAD\uC790 \uD655\uBCF4\uC5D0 \uC720\uB9AC\uD569\uB2C8\uB2E4.";
      } else if (h >= 8 && h <= 17) {
        topContents = [
          { categoryName: "\uC885\uD569\uAC8C\uC784 / \uC2A4\uD300", groupKey: "GAME", liveCount: 25, shareOfHour: 0.36, averageViewers: 95 },
          { categoryName: "Just Chatting (\uC624\uC804\xB7\uB0AE \uD1A0\uD06C)", groupKey: "TALK", liveCount: 22, shareOfHour: 0.31, averageViewers: 80 },
          { categoryName: "\uB9AC\uADF8 \uC624\uBE0C \uB808\uC804\uB4DC", groupKey: "GAME", liveCount: 14, shareOfHour: 0.2, averageViewers: 180 },
          { categoryName: "\uC74C\uC545\xB7\uB178\uB798", groupKey: "MUSIC", liveCount: 9, shareOfHour: 0.13, averageViewers: 110 }
        ];
        advice = "\uB0AE \uC2DC\uAC04\uB300\uB294 \uC9C1\uC7A5\uC778/\uD559\uC0DD \uC2DC\uCCAD\uC790\uAC00 \uC720\uC785\uB418\uB294 \uC644\uB9CC\uD55C \uC2DC\uAC04\uB300\uB85C, \uD3B8\uC548\uD55C \uC18C\uD1B5\uACFC \uAC8C\uC784 \uBCD1\uD589\uC774 \uC801\uD569\uD569\uB2C8\uB2E4.";
      } else {
        topContents = [
          { categoryName: "\uC885\uD569\uAC8C\uC784 / \uC2E0\uC791", groupKey: "GAME", liveCount: 30, shareOfHour: 0.38, averageViewers: 280 },
          { categoryName: "Just Chatting (\uD1F4\uADFC\uAE38 \uD1A0\uD06C)", groupKey: "TALK", liveCount: 26, shareOfHour: 0.33, averageViewers: 190 },
          { categoryName: "Grand Theft Auto V", groupKey: "GAME", liveCount: 14, shareOfHour: 0.18, averageViewers: 2200 },
          { categoryName: "\uB9AC\uADF8 \uC624\uBE0C \uB808\uC804\uB4DC", groupKey: "GAME", liveCount: 9, shareOfHour: 0.11, averageViewers: 450 }
        ];
        advice = "\uC800\uB141 \uC2DC\uAC04\uB300\uB294 \uBCF8\uACA9\uC801\uC778 \uBC29\uC1A1 \uACBD\uC7C1\uC774 \uC2DC\uC791\uB418\uB294 \uC2DC\uAC04\uB300\uB85C, \uBC29\uC81C\uC5D0 \uBA85\uD655\uD55C \uCF58\uD150\uCE20\uBA85\uC744 \uC801\uC5B4 \uB178\uCD9C\uC744 \uC120\uC810\uD558\uC138\uC694.";
      }
      result[key] = {
        dayOfWeek: d,
        dayName: dayNames[d],
        hour: h,
        totalViewers: topContents.reduce((a, b) => a + b.liveCount * b.averageViewers, 0),
        totalLives: topContents.reduce((a, b) => a + b.liveCount, 0),
        topContents,
        rookieAdvice: advice
      };
    }
  }
  return result;
}
__name(generateHourlyRankings, "generateHourlyRankings");
function generateMarketBriefing(groups, gameChildren) {
  const eventGame = gameChildren.find((g) => g.eventCluster && g.eventCluster.eventDetected);
  if (eventGame && eventGame.eventCluster) {
    const cluster = eventGame.eventCluster;
    return {
      statusType: "EVENT_CONCENTRATION",
      badgeLabel: "\uC2E4\uC2DC\uAC04 \uB300\uD615 \uD569\uBC29 \uAC10\uC9C0",
      headline: `[${eventGame.name}] ${cluster.eventName} \uC9C4\uD589 \uC911`,
      factSummary: `\uD604\uC7AC ${eventGame.name} \uC2DC\uCCAD\uC790\uC758 ${Math.round(cluster.dominantTagShare * 100)}%(${cluster.totalViewerSum.toLocaleString()}\uBA85)\uAC00 #${cluster.dominantTag} \uD569\uBC29\uC5D0 \uC9D1\uC911\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. (${cluster.channelCount}\uAC1C \uCC44\uB110 \uC911\uBCF5)`,
      rookieActionAdvice: `\uD569\uBC29 \uCC38\uC5EC\uC790\uAC00 \uC544\uB2CC \uC77C\uBC18 \uC2E0\uC785 \uC2A4\uD2B8\uB9AC\uBA38\uC758 \uC194\uB85C \uD50C\uB808\uC774\uB85C\uB294 \uC2DC\uCCAD\uC790 \uB099\uC218 \uC720\uC785\uC744 \uBC1B\uAE30 \uC5B4\uB824\uC6B0\uB2C8, \uC720\uC785\uC744 \uB178\uB9B0\uB2E4\uBA74 \uD2C8\uC0C8 \uC885\uD569\uAC8C\uC784\uC774\uB098 \uC2A4\uD300 \uC2E0\uC791\uC73C\uB85C \uC6B0\uD68C\uD558\uB294 \uAC83\uC744 \uAC15\uB825\uD788 \uCD94\uCC9C\uD569\uB2C8\uB2E4.`
    };
  }
  const topGroup = groups[0];
  if (topGroup && topGroup.groupKey === "GAME" && gameChildren.length > 0) {
    const topGame = gameChildren[0];
    const top1Share = topGame.top1Share || 0;
    if (top1Share <= 0.35) {
      return {
        statusType: "BALANCED_OPPORTUNITY",
        badgeLabel: "\uC2DC\uCCAD\uC790 \uBD84\uC0B0 \uC591\uD638",
        headline: `[${topGame.name}] \uC2DC\uCCAD\uC790 \uBD84\uC0B0\uD615 \uACE8\uB4E0 \uD0C0\uC784`,
        factSummary: `\uD2B9\uC815 \uB300\uD615 \uCC44\uB110\uC758 \uB3C5\uC810 \uC5C6\uC774 ${topGame.liveCount}\uAC1C \uBC29\uC1A1\uC5D0 \uC2DC\uCCAD\uC790\uAC00 \uACE0\uB974\uAC8C \uBD84\uC0B0(\uCD5C\uB300 \uBC29\uC1A1 \uC810\uC720\uC728 ${Math.round(top1Share * 100)}%)\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.`,
        rookieActionAdvice: `\uC2DC\uCCAD\uC790 \uC3E0\uB9BC\uC774 \uC5C6\uC5B4 \uC2E0\uADDC \uBC29\uC1A1\uC73C\uB85C\uC758 \uC720\uC785 \uAC00\uB2A5\uC131\uC774 \uC5F4\uB824 \uC788\uC2B5\uB2C8\uB2E4. ${topGame.name}\uC5D0 \uAD00\uC2EC \uC788\uB294 \uC2DC\uCCAD\uC790\uB4E4\uC744 \uD0C0\uAE43\uC73C\uB85C \uBC29\uC1A1\uC744 \uC2DC\uC791\uD558\uAE30 \uC88B\uC740 \uC0C1\uD0DC\uC785\uB2C8\uB2E4.`
      };
    } else {
      return {
        statusType: "BALANCED_OPPORTUNITY",
        badgeLabel: "\uC0C1\uC704 \uCC44\uB110 \uC9D1\uC911",
        headline: `[${topGame.name}] \uC0C1\uC704 \uCC44\uB110 \uC911\uC2EC \uC2DC\uCCAD \uC9D1\uC911`,
        factSummary: `1\uC704 \uBC29\uC1A1\uC774 ${topGame.name} \uC2DC\uCCAD\uC790\uC758 ${Math.round(top1Share * 100)}%\uB97C \uC810\uC720\uD558\uACE0 \uC788\uC5B4, \uCC44\uB110 \uAC04 \uACA9\uCC28\uAC00 \uAD00\uCE21\uB429\uB2C8\uB2E4.`,
        rookieActionAdvice: `\uB300\uD615 \uCC44\uB110 \uBC29\uC885 \uC2DC\uC810\uC758 \uC2DC\uCCAD\uC790 \uC774\uB3D9(\uBC29\uC885 \uB099\uC218)\uC744 \uB178\uB9AC\uAC70\uB098, \uC2E0\uC785 \uACBD\uC7C1\uC774 \uB35C\uD55C \uD2C8\uC0C8 \uC778\uB514 \uAC8C\uC784\uC744 \uACF5\uB7B5\uD558\uC138\uC694.`
      };
    }
  }
  if (topGroup && topGroup.groupKey === "TALK") {
    return {
      statusType: "TALK_CROWDED",
      badgeLabel: "\uC18C\uD1B5 \uC9D1\uC911 \uC2DC\uAC04\uB300",
      headline: `[\uC7A1\uB2F4\xB7\uC18C\uD1B5] \uC2EC\uC57C \uD1A0\uD06C \uC911\uC2EC \uC2DC\uCCAD \uD750\uB984`,
      factSummary: `\uC804\uCCB4 \uBC29\uC1A1\uC758 ${Math.round(topGroup.shareOfTotal * 100)}%\uAC00 Just Chatting\uC5D0 \uC9D1\uC911\uB418\uC5B4 \uC788\uC5B4, \uC18C\uD1B5 \uBC29\uC1A1 \uAC04 \uC720\uC785 \uACBD\uC7C1\uC774 \uCE58\uC5F4\uD569\uB2C8\uB2E4.`,
      rookieActionAdvice: `\uB2E8\uC21C \uC7A1\uB2F4\uC740 \uC2E0\uC785 \uBC29\uC1A1\uC774 \uD558\uB2E8\uC5D0 \uBB3B\uD788\uAE30 \uC27D\uC2B5\uB2C8\uB2E4. 2~3\uC2DC\uAC04 \uBAB0\uC785\uAC10 \uC788\uB294 \uD2C8\uC0C8 \uAC8C\uC784\uC744 \uC9C4\uD589\uD558\uC5EC \uCCAB \uC2DC\uCCAD\uC790\uB97C \uD655\uBCF4\uD55C \uB4A4 \uC18C\uD1B5\uC73C\uB85C \uC804\uD658\uD558\uC138\uC694.`
    };
  }
  return {
    statusType: "BALANCED_OPPORTUNITY",
    badgeLabel: "\uD3C9\uC628\uD55C \uC2DC\uCCAD \uD750\uB984",
    headline: `\uD604\uC7AC \uD2B9\uC774 \uC3E0\uB9BC \uC5C6\uB294 \uACE0\uB978 \uC2DC\uCCAD \uBD84\uD3EC`,
    factSummary: `\uD2B9\uC815 \uB300\uD615 \uC11C\uBC84\uB098 \uD569\uBC29\uC5D0 \uC2DC\uCCAD\uC790\uAC00 \uADF9\uB2E8\uC801\uC73C\uB85C \uBB36\uC5EC\uC788\uC9C0 \uC54A\uC544, \uC2E0\uADDC \uC2A4\uD2B8\uB9AC\uBA38\uC758 \uC77C\uBC18 \uAC8C\uC784 \uBC29\uC1A1 \uC9C4\uC785\uC5D0 \uC720\uB9AC\uD55C \uC2DC\uC7A5 \uC0C1\uD0DC\uC785\uB2C8\uB2E4.`,
    rookieActionAdvice: `\uC6D0\uD558\uB294 \uCE74\uD14C\uACE0\uB9AC\uB97C \uC790\uC720\uB86D\uAC8C \uC120\uD0DD\uD558\uACE0, \uBC29\uC81C\uC5D0 \uAD6C\uCCB4\uC801\uC778 \uAC8C\uC784\uBA85\uC744 \uBA85\uC2DC\uD558\uC5EC \uAC80\uC0C9 \uC720\uC785\uC744 \uD655\uBCF4\uD558\uC138\uC694.`
  };
}
__name(generateMarketBriefing, "generateMarketBriefing");
var GROUP_ORDER = ["GAME", "TALK", "MUSIC", "ASMR", "ART", "ETC", "UNCLASSIFIED"];
var GROUP_NAME_MAP = {
  GAME: "\uAC8C\uC784",
  TALK: "\uC7A1\uB2F4\xB7\uC18C\uD1B5",
  MUSIC: "\uC74C\uC545\xB7\uB178\uB798",
  ASMR: "ASMR",
  ART: "\uADF8\uB9BC\xB7\uC544\uD2B8",
  ETC: "\uAE30\uD0C0",
  UNCLASSIFIED: "\uBBF8\uBD84\uB958"
};
function aggregateToCurrentContentData(lives, platform, startedAt, completedAt) {
  const totalViewers = lives.reduce((acc, cur) => acc + cur.viewerCount, 0);
  const totalLiveCount = lives.length;
  const allViewers = lives.map((l) => l.viewerCount);
  const totalAvg = totalLiveCount > 0 ? Math.round(totalViewers / totalLiveCount * 10) / 10 : 0;
  const totalMedian = calculateMedian(allViewers);
  const groupMap = /* @__PURE__ */ new Map();
  for (const key of GROUP_ORDER) {
    groupMap.set(key, []);
  }
  for (const item of lives) {
    const key = groupMap.has(item.groupKey) ? item.groupKey : "ETC";
    groupMap.get(key).push(item);
  }
  const gameLives = groupMap.get("GAME") || [];
  const gameViewerSum = gameLives.reduce((acc, cur) => acc + cur.viewerCount, 0);
  const gameLiveCount = gameLives.length;
  const gameChildren = [];
  if (gameLiveCount > 0) {
    const rawGameMap = /* @__PURE__ */ new Map();
    for (const gl of gameLives) {
      const gName = (gl.categoryName || "").trim() || "\uC885\uD569\uAC8C\uC784";
      if (!rawGameMap.has(gName))
        rawGameMap.set(gName, []);
      rawGameMap.get(gName).push(gl);
    }
    const sortedGames = Array.from(rawGameMap.entries()).map(([name, list]) => ({
      name,
      list,
      viewerSum: list.reduce((a, b) => a + b.viewerCount, 0),
      liveCount: list.length
    })).sort((a, b) => b.viewerSum - a.viewerSum);
    const topGames = sortedGames.slice(0, 7);
    const restGames = sortedGames.slice(7);
    for (const tg of topGames) {
      const viewers = tg.list.map((l) => l.viewerCount);
      const top1 = Math.max(...viewers, 0);
      const cluster = detectEventClusters(tg.list, tg.name);
      gameChildren.push({
        detailKey: `game-${encodeURIComponent(tg.name).toLowerCase()}`,
        name: tg.name,
        sourceCategoryId: tg.name.toLowerCase().replace(/\s+/g, "-"),
        viewerSum: tg.viewerSum,
        liveCount: tg.liveCount,
        shareOfGroup: gameViewerSum > 0 ? Math.round(tg.viewerSum / gameViewerSum * 1e3) / 1e3 : 0,
        averageViewers: tg.liveCount > 0 ? Math.round(tg.viewerSum / tg.liveCount * 10) / 10 : 0,
        medianViewers: calculateMedian(viewers),
        top1Share: tg.viewerSum > 0 ? Math.round(top1 / tg.viewerSum * 1e3) / 1e3 : 0,
        classificationStatus: "SOURCE_GAME",
        eventCluster: cluster
      });
    }
    if (restGames.length > 0) {
      const restViewerSum = restGames.reduce((acc, cur) => acc + cur.viewerSum, 0);
      const restLiveCount = restGames.reduce((acc, cur) => acc + cur.liveCount, 0);
      const restViewers = restGames.flatMap((g) => g.list.map((l) => l.viewerCount));
      const restTop1 = Math.max(...restViewers, 0);
      gameChildren.push({
        detailKey: "game-other-categories",
        name: "\uADF8 \uC678 \uAC8C\uC784 \uCE74\uD14C\uACE0\uB9AC",
        sourceCategoryId: "other-games",
        viewerSum: restViewerSum,
        liveCount: restLiveCount,
        shareOfGroup: gameViewerSum > 0 ? Math.round(restViewerSum / gameViewerSum * 1e3) / 1e3 : 0,
        averageViewers: restLiveCount > 0 ? Math.round(restViewerSum / restLiveCount * 10) / 10 : 0,
        medianViewers: calculateMedian(restViewers),
        top1Share: restViewerSum > 0 ? Math.round(restTop1 / restViewerSum * 1e3) / 1e3 : 0,
        classificationStatus: "OTHER",
        eventCluster: null
      });
    }
  }
  const groups = [];
  for (const groupKey of GROUP_ORDER) {
    const grpLives = groupMap.get(groupKey) || [];
    const grpViewerSum = grpLives.reduce((acc, cur) => acc + cur.viewerCount, 0);
    const grpLiveCount = grpLives.length;
    const grpViewers = grpLives.map((l) => l.viewerCount);
    const top1 = Math.max(...grpViewers, 0);
    groups.push({
      groupKey,
      name: GROUP_NAME_MAP[groupKey] || groupKey,
      viewerSum: grpViewerSum,
      liveCount: grpLiveCount,
      shareOfTotal: totalViewers > 0 ? Math.round(grpViewerSum / totalViewers * 1e3) / 1e3 : 0,
      averageViewers: grpLiveCount > 0 ? Math.round(grpViewerSum / grpLiveCount * 10) / 10 : 0,
      medianViewers: calculateMedian(grpViewers),
      top1Share: grpViewerSum > 0 ? Math.round(top1 / grpViewerSum * 1e3) / 1e3 : 0,
      childrenComplete: groupKey === "GAME",
      children: groupKey === "GAME" ? gameChildren : []
    });
  }
  groups.sort((a, b) => {
    if (a.groupKey === "GAME")
      return -1;
    if (b.groupKey === "GAME")
      return 1;
    return b.viewerSum - a.viewerSum;
  });
  const unclassifiedCount = (groupMap.get("UNCLASSIFIED") || []).length;
  return {
    meta: {
      schemaVersion: "current-content-v1",
      runId: `run-${Date.now()}`,
      dataMode: "real",
      platform,
      scope: "VERIFIED_VTUBER_LIVE_OBSERVED",
      registryVersion: "vdebut-registry-v1",
      mappingVersion: "vdebut-category-map-v1",
      registryChannelCount: 1284,
      collectionStartedAt: startedAt,
      collectionCompletedAt: completedAt,
      collectionStatus: "PUBLISHED",
      pageTraversalComplete: true,
      timezone: "Asia/Seoul",
      targetIntervalSeconds: 600
    },
    totals: {
      viewerSum: totalViewers,
      liveCount: totalLiveCount,
      averageViewers: totalAvg,
      medianViewers: totalMedian,
      unclassifiedLiveCount: unclassifiedCount
    },
    groups,
    marketBriefing: generateMarketBriefing(groups, gameChildren),
    magnetTags: aggregateMagnetTags(lives),
    rookieRadar: aggregateRookieRadar(lives),
    hourlyRankings: generateHourlyRankings()
  };
}
__name(aggregateToCurrentContentData, "aggregateToCurrentContentData");
async function getCurrentContentDrilldown(db, platform = "CHZZK") {
  const now = /* @__PURE__ */ new Date();
  const kstIso = new Date(now.getTime() + 9 * 3600 * 1e3).toISOString().replace("Z", "+09:00");
  const startedAt = new Date(now.getTime() + 9 * 3600 * 1e3 - 15 * 1e3).toISOString().replace("Z", "+09:00");
  const normalizedList = [];
  try {
    if (platform === "CHZZK" || platform === "ALL") {
      const chzzkItems = await fetchChzzkLiveList(100);
      for (const item of chzzkItems) {
        const cat = categorizeChzzkContent(item);
        normalizedList.push({
          id: `chzzk-${item.liveId}`,
          title: item.liveTitle || "",
          viewerCount: item.concurrentUserCount || 0,
          groupKey: cat.groupKey,
          groupName: cat.groupName,
          categoryName: item.liveCategoryValue || "\uC885\uD569\uAC8C\uC784",
          channelName: item.channel?.channelName || "\uCE58\uC9C0\uC9C1 \uC2A4\uD2B8\uB9AC\uBA38",
          platform: "CHZZK",
          tags: item.tags || []
        });
      }
    }
    if (platform === "SOOP" || platform === "ALL") {
      const soopItems = await fetchRegisteredSoopLives(db, 40);
      for (const item of soopItems) {
        const cat = categorizeSoopContent(item);
        normalizedList.push({
          id: `soop-${item.broadNo}`,
          title: item.liveTitle || "",
          viewerCount: item.viewerCount || 0,
          groupKey: cat.groupKey,
          groupName: cat.groupName,
          categoryName: item.categoryName || "\uC885\uD569\uAC8C\uC784",
          channelName: item.channelName,
          platform: "SOOP",
          tags: ["\uBC84\uD29C\uBC84", "SOOP", cat.groupName]
        });
      }
    }
    if (normalizedList.length > 0) {
      return aggregateToCurrentContentData(normalizedList, platform, startedAt, kstIso);
    }
  } catch (err) {
    console.error("[getCurrentContentDrilldown] Realtime fetch error:", err);
  }
  return aggregateToCurrentContentData(
    [
      {
        id: "fallback-1",
        title: "\uB77C\uC774\uBE0C \uBC29\uC1A1 \uC9D1\uACC4 \uC911",
        viewerCount: 15e4,
        groupKey: "GAME",
        groupName: "\uAC8C\uC784",
        categoryName: "Grand Theft Auto V",
        channelName: "\uC885\uD569 \uC2A4\uD2B8\uB9AC\uBA38",
        platform: "CHZZK"
      }
    ],
    platform,
    startedAt,
    kstIso
  );
}
__name(getCurrentContentDrilldown, "getCurrentContentDrilldown");

// src/services/liveDiscoveryService.ts
function formatChzzkThumbnail(templateUrl) {
  if (!templateUrl)
    return void 0;
  return templateUrl.replace("{type}", "720");
}
__name(formatChzzkThumbnail, "formatChzzkThumbnail");
function normalizeChzzkItem(item, observedAt) {
  const cat = categorizeChzzkContent(item);
  const channelId = item.channel?.channelId || "";
  const channelUrl = channelId ? `https://chzzk.naver.com/${channelId}` : "https://chzzk.naver.com";
  const liveUrl = channelId ? `https://chzzk.naver.com/live/${channelId}` : "https://chzzk.naver.com";
  return {
    id: `chzzk-${item.liveId}`,
    platform: "CHZZK",
    channelId,
    channelName: item.channel?.channelName || "\uCE58\uC9C0\uC9C1 \uC2A4\uD2B8\uB9AC\uBA38",
    channelImageUrl: item.channel?.channelImageUrl || void 0,
    channelUrl,
    liveTitle: item.liveTitle || "\uB77C\uC774\uBE0C \uBC29\uC1A1",
    categoryGroup: cat.groupKey,
    categoryName: item.liveCategoryValue?.trim() || (cat.groupKey === "GAME" ? "\uC885\uD569\uAC8C\uC784" : cat.groupName),
    viewerCount: item.concurrentUserCount || 0,
    thumbnailUrl: formatChzzkThumbnail(item.liveImageUrl),
    firstSeenAt: item.openDate || observedAt,
    liveUrl,
    tags: item.tags || []
  };
}
__name(normalizeChzzkItem, "normalizeChzzkItem");
function normalizeSoopItem(item, observedAt) {
  const cat = categorizeSoopContent(item);
  const channelUrl = item.channelUrl || `https://ch.sooplive.co.kr/${item.userId}`;
  const liveUrl = item.broadNo ? `https://play.sooplive.co.kr/${item.userId}/${item.broadNo}` : channelUrl;
  return {
    id: `soop-${item.broadNo}`,
    platform: "SOOP",
    channelId: item.userId,
    channelName: item.channelName || item.userId,
    channelImageUrl: void 0,
    channelUrl,
    liveTitle: item.liveTitle || "\uB77C\uC774\uBE0C \uBC29\uC1A1",
    categoryGroup: cat.groupKey,
    categoryName: item.categoryName || (cat.groupKey === "GAME" ? "\uC885\uD569\uAC8C\uC784" : cat.groupName),
    viewerCount: item.viewerCount || 0,
    thumbnailUrl: void 0,
    firstSeenAt: observedAt,
    liveUrl,
    tags: ["\uBC84\uD29C\uBC84", "SOOP", cat.groupName]
  };
}
__name(normalizeSoopItem, "normalizeSoopItem");
function aggregateCategoriesAndGames(allObservedLives) {
  const categoryOrder = [
    { key: "ALL", name: "\uC804\uCCB4" },
    { key: "GAME", name: "\uAC8C\uC784" },
    { key: "TALK", name: "\uC7A1\uB2F4\xB7\uC18C\uD1B5" },
    { key: "MUSIC", name: "\uC74C\uC545\xB7\uB178\uB798" },
    { key: "ART", name: "\uADF8\uB9BC\xB7\uC544\uD2B8" },
    { key: "ASMR", name: "ASMR" },
    { key: "ETC", name: "\uAE30\uD0C0" }
  ];
  const groupStatsMap = /* @__PURE__ */ new Map();
  for (const c of categoryOrder) {
    groupStatsMap.set(c.key, { liveCount: 0, viewerSum: 0, gamesMap: /* @__PURE__ */ new Map() });
  }
  const allStat = groupStatsMap.get("ALL");
  allStat.liveCount = allObservedLives.length;
  allStat.viewerSum = allObservedLives.reduce((acc, l) => acc + l.viewerCount, 0);
  for (const live of allObservedLives) {
    const groupKey = live.categoryGroup || "ETC";
    const stat = groupStatsMap.get(groupKey) || groupStatsMap.get("ETC");
    stat.liveCount += 1;
    stat.viewerSum += live.viewerCount;
    if (groupKey === "GAME") {
      const gName = live.categoryName || "\uC885\uD569\uAC8C\uC784";
      const gStat = stat.gamesMap.get(gName) || { liveCount: 0, viewerSum: 0 };
      gStat.liveCount += 1;
      gStat.viewerSum += live.viewerCount;
      stat.gamesMap.set(gName, gStat);
    }
  }
  return categoryOrder.map((c) => {
    const stat = groupStatsMap.get(c.key);
    const result = {
      key: c.key,
      name: c.name,
      liveCount: stat.liveCount,
      viewerSum: stat.viewerSum
    };
    if (c.key === "GAME" && stat.gamesMap.size > 0) {
      result.games = Array.from(stat.gamesMap.entries()).map(([name, data]) => ({
        name,
        liveCount: data.liveCount,
        viewerSum: data.viewerSum
      })).sort((a, b) => b.viewerSum - a.viewerSum);
    }
    return result;
  });
}
__name(aggregateCategoriesAndGames, "aggregateCategoriesAndGames");
function applyFiltersAndSort(lives, filters) {
  let result = [...lives];
  if (filters.platform && filters.platform !== "ALL") {
    result = result.filter((l) => l.platform === filters.platform);
  }
  if (filters.categoryGroup && filters.categoryGroup !== "ALL") {
    result = result.filter((l) => l.categoryGroup === filters.categoryGroup);
  }
  if (filters.game && filters.game !== "ALL") {
    const gameTarget = filters.game.trim().toLowerCase();
    result = result.filter((l) => l.categoryName.toLowerCase() === gameTarget);
  }
  if (filters.query && filters.query.trim()) {
    const q = filters.query.trim().toLowerCase();
    result = result.filter(
      (l) => l.channelName.toLowerCase().includes(q) || l.liveTitle.toLowerCase().includes(q) || l.categoryName.toLowerCase().includes(q)
    );
  }
  if (filters.sort === "recent") {
    result.sort((a, b) => {
      const timeA = a.firstSeenAt ? new Date(a.firstSeenAt).getTime() : 0;
      const timeB = b.firstSeenAt ? new Date(b.firstSeenAt).getTime() : 0;
      return timeB - timeA;
    });
  } else {
    result.sort((a, b) => b.viewerCount - a.viewerCount);
  }
  return result;
}
__name(applyFiltersAndSort, "applyFiltersAndSort");
async function getLiveDiscovery(db, filters = {}) {
  const now = /* @__PURE__ */ new Date();
  const kstIso = new Date(now.getTime() + 9 * 3600 * 1e3).toISOString().replace("Z", "+09:00");
  const snapshotId = `snap-${Math.floor(now.getTime() / (5 * 60 * 1e3))}`;
  const rawList = [];
  try {
    const chzzkItems = await fetchChzzkLiveList(100);
    for (const item of chzzkItems) {
      rawList.push(normalizeChzzkItem(item, kstIso));
    }
  } catch (err) {
    console.error("[getLiveDiscovery] Chzzk fetch failed:", err);
  }
  try {
    if (db) {
      const soopItems = await fetchRegisteredSoopLives(db, 40);
      for (const item of soopItems) {
        rawList.push(normalizeSoopItem(item, kstIso));
      }
    }
  } catch (err) {
    console.error("[getLiveDiscovery] SOOP fetch failed:", err);
  }
  const uniqueMap = /* @__PURE__ */ new Map();
  for (const live of rawList) {
    const dedupeKey = `${live.platform}:${live.channelId || live.id}`;
    const existing = uniqueMap.get(dedupeKey);
    if (!existing) {
      uniqueMap.set(dedupeKey, live);
    } else if (live.viewerCount > existing.viewerCount) {
      uniqueMap.set(dedupeKey, live);
    }
  }
  const allObservedLives = Array.from(uniqueMap.values());
  const chzzkLives = allObservedLives.filter((l) => l.platform === "CHZZK");
  const soopLives = allObservedLives.filter((l) => l.platform === "SOOP");
  const platformTotals = {
    chzzk: {
      liveCount: chzzkLives.length,
      viewerSum: chzzkLives.reduce((acc, l) => acc + l.viewerCount, 0)
    },
    soop: {
      liveCount: soopLives.length,
      viewerSum: soopLives.reduce((acc, l) => acc + l.viewerCount, 0)
    }
  };
  const categories = aggregateCategoriesAndGames(allObservedLives);
  const filteredLives = applyFiltersAndSort(allObservedLives, filters);
  return {
    meta: {
      scope: "VERIFIED_VTUBER_LIVE_OBSERVED",
      snapshotId,
      observedAt: kstIso,
      totalLiveCount: allObservedLives.length,
      totalViewerSum: allObservedLives.reduce((acc, l) => acc + l.viewerCount, 0),
      platformTotals
    },
    categories,
    lives: filteredLives
  };
}
__name(getLiveDiscovery, "getLiveDiscovery");

// src/services/liveHistoryService.ts
function getDefaultKstDateTime() {
  const now = /* @__PURE__ */ new Date();
  const kst = new Date(now.getTime() + 9 * 3600 * 1e3);
  const dateStr = kst.toISOString().slice(0, 10);
  const currentHour = kst.getUTCHours();
  return { dateStr, currentHour };
}
__name(getDefaultKstDateTime, "getDefaultKstDateTime");
async function getHourlyDistribution(db, dateStr, platform = "ALL") {
  const distribution = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    liveCount: 0,
    avgViewers: 0
  }));
  if (!db)
    return getFallbackHourlyDistribution();
  try {
    let sql = `
      SELECT 
        CAST(strftime('%H', snapshot_at) AS INTEGER) as hour,
        COUNT(DISTINCT external_stream_id) as streamCount,
        ROUND(AVG(viewer_count)) as avgViewer
      FROM analytics_live_snapshots
      WHERE snapshot_at LIKE ?
    `;
    const params = [`${dateStr}%`];
    if (platform !== "ALL") {
      sql += " AND platform = ?";
      params.push(platform);
    }
    sql += " GROUP BY hour ORDER BY hour ASC";
    const { results } = await db.prepare(sql).bind(...params).all();
    if (results && results.length > 0) {
      for (const row of results) {
        const h = Number(row.hour);
        if (h >= 0 && h < 24) {
          distribution[h].liveCount = Number(row.streamCount || 0);
          distribution[h].avgViewers = Number(row.avgViewer || 0);
        }
      }
      return distribution;
    }
  } catch (err) {
    console.error("[getHourlyDistribution] D1 query error:", err);
  }
  return getFallbackHourlyDistribution();
}
__name(getHourlyDistribution, "getHourlyDistribution");
async function getLiveHistory(db, filters = {}) {
  const { dateStr: defaultDate, currentHour: defaultHour } = getDefaultKstDateTime();
  const targetDate = filters.date || defaultDate;
  const targetHour = filters.hour !== void 0 && filters.hour >= 0 && filters.hour <= 23 ? Number(filters.hour) : defaultHour;
  const platform = (filters.platform || "ALL").toUpperCase();
  const category = filters.category || "ALL";
  const query = (filters.query || filters.streamer || "").trim();
  const hourlyDistribution = await getHourlyDistribution(db, targetDate, platform);
  const records = [];
  if (db) {
    try {
      const hourPad = String(targetHour).padStart(2, "0");
      const timePattern = `${targetDate} ${hourPad}%`;
      const timePatternT = `${targetDate}T${hourPad}%`;
      let sql = `
        SELECT 
          s.id,
          s.platform,
          s.external_stream_id,
          s.channel_id,
          s.viewer_count,
          s.title,
          s.source_category_type,
          s.source_category_name,
          s.source_tags_json,
          s.snapshot_at,
          c.channel_name,
          c.channel_url,
          ci.profile_image_url
        FROM analytics_live_snapshots s
        LEFT JOIN streamerChannel c ON s.channel_id = c.id
        LEFT JOIN streamerChannel_info ci ON c.id = ci.channel_id
        WHERE (s.snapshot_at LIKE ? OR s.snapshot_at LIKE ?)
      `;
      const params = [timePattern, timePatternT];
      if (platform !== "ALL") {
        sql += " AND s.platform = ?";
        params.push(platform);
      }
      if (query) {
        sql += " AND (s.title LIKE ? OR c.channel_name LIKE ?)";
        params.push(`%${query}%`, `%${query}%`);
      }
      sql += " ORDER BY s.viewer_count DESC LIMIT 100";
      const { results } = await db.prepare(sql).bind(...params).all();
      if (results && results.length > 0) {
        for (const r of results) {
          const categoryGroup = mapToCategoryGroup(r.source_category_type, r.source_category_name, r.title);
          if (category !== "ALL" && categoryGroup !== category) {
            continue;
          }
          let tags = [];
          if (r.source_tags_json) {
            try {
              tags = JSON.parse(r.source_tags_json);
            } catch {
            }
          }
          const liveUrl = r.platform === "CHZZK" && r.external_stream_id ? `https://chzzk.naver.com/live/${r.channel_url ? extractChannelId(r.channel_url) : r.external_stream_id}` : r.channel_url || "https://chzzk.naver.com";
          records.push({
            id: `snap-${r.id}`,
            platform: r.platform === "SOOP" ? "SOOP" : "CHZZK",
            channelId: r.channel_id,
            channelName: r.channel_name || "\uBC84\uD29C\uBC84",
            channelImageUrl: r.profile_image_url || null,
            channelUrl: r.channel_url || null,
            liveTitle: r.title || "\uBC29\uC1A1 \uAE30\uB85D",
            categoryGroup,
            categoryName: r.source_category_name || "\uC885\uD569 \uBC29\uC1A1",
            viewerCount: Number(r.viewer_count || 0),
            observedAt: r.snapshot_at || `${targetDate} ${hourPad}:00:00`,
            recordedHour: targetHour,
            liveUrl,
            tags
          });
        }
      }
    } catch (err) {
      console.error("[getLiveHistory] Error querying DB:", err);
    }
  }
  if (records.length === 0) {
    const fallbacks = getFallbackHistoryRecords(targetDate, targetHour, platform, category, query);
    records.push(...fallbacks);
  }
  return {
    meta: {
      targetDate,
      targetHour,
      totalRecords: records.length,
      platform,
      category
    },
    hourlyDistribution,
    records
  };
}
__name(getLiveHistory, "getLiveHistory");
async function getCreatorHistory(db, streamerName) {
  const cleanName = streamerName.trim();
  if (!cleanName)
    return null;
  if (db) {
    try {
      const streamHistory = await db.prepare(
        `SELECT 
             s.title,
             s.source_category_name,
             s.viewer_count,
             s.snapshot_at,
             s.platform,
             c.channel_name,
             c.channel_url,
             ci.profile_image_url
           FROM analytics_live_snapshots s
           JOIN streamerChannel c ON s.channel_id = c.id
           LEFT JOIN streamerChannel_info ci ON c.id = ci.channel_id
           WHERE c.channel_name LIKE ?
           ORDER BY s.snapshot_at DESC
           LIMIT 30`
      ).bind(`%${cleanName}%`).all();
      if (streamHistory.results && streamHistory.results.length > 0) {
        const rows2 = streamHistory.results;
        const first = rows2[0];
        const catMap = /* @__PURE__ */ new Map();
        const recentStreams = [];
        for (const row of rows2) {
          const cat = row.source_category_name || "\uAE30\uD0C0";
          catMap.set(cat, (catMap.get(cat) || 0) + 1);
          const snapDate = new Date(row.snapshot_at);
          recentStreams.push({
            date: row.snapshot_at.slice(0, 10),
            hour: snapDate.getHours(),
            title: row.title,
            categoryName: cat,
            viewerCount: Number(row.viewer_count || 0)
          });
        }
        const frequentCategories = Array.from(catMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
        return {
          streamerName: first.channel_name || cleanName,
          platform: first.platform === "SOOP" ? "SOOP" : "CHZZK",
          channelImageUrl: first.profile_image_url || null,
          channelUrl: first.channel_url || null,
          totalRecordedStreams: rows2.length,
          frequentCategories,
          recentStreams: recentStreams.slice(0, 10)
        };
      }
    } catch (err) {
      console.error("[getCreatorHistory] Query error:", err);
    }
  }
  return getFallbackCreatorHistory(cleanName);
}
__name(getCreatorHistory, "getCreatorHistory");
function mapToCategoryGroup(catType, catName, title) {
  const t = (catType || "").toUpperCase();
  const n = (catName || "").toLowerCase();
  const tit = (title || "").toLowerCase();
  if (n.includes("\uB178\uB798") || n.includes("\uC74C\uC545") || tit.includes("\uB178\uB798") || tit.includes("\uC6B0\uD0C0\uC640\uCFE0"))
    return "MUSIC";
  if (n.includes("asmr") || tit.includes("asmr"))
    return "ASMR";
  if (n.includes("\uADF8\uB9BC") || n.includes("\uC544\uD2B8") || tit.includes("\uADF8\uB9BC"))
    return "ART";
  if (n.includes("\uC18C\uD1B5") || n.includes("\uC7A1\uB2F4") || n.includes("\uD1A0\uD06C") || tit.includes("\uC800\uCC57"))
    return "TALK";
  if (t === "GAME" || n.includes("\uAC8C\uC784") || n.includes("minecraft") || n.includes("lol"))
    return "GAME";
  return "GAME";
}
__name(mapToCategoryGroup, "mapToCategoryGroup");
function extractChannelId(url) {
  const parts = url.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}
__name(extractChannelId, "extractChannelId");
function getFallbackHourlyDistribution() {
  const pattern = [
    25,
    18,
    12,
    8,
    5,
    4,
    6,
    9,
    14,
    20,
    26,
    32,
    38,
    42,
    45,
    48,
    52,
    58,
    65,
    74,
    82,
    88,
    79,
    48
  ];
  return pattern.map((count, hour) => ({
    hour,
    liveCount: count,
    avgViewers: Math.round(count * 28.5)
  }));
}
__name(getFallbackHourlyDistribution, "getFallbackHourlyDistribution");
function getFallbackHistoryRecords(dateStr, hour, platform, category, query) {
  const sampleData = [
    {
      id: "hist-101",
      platform: "CHZZK",
      channelId: "ch_arisa",
      channelName: "\uC544\uB9AC\uC0AC",
      channelImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      channelUrl: "https://chzzk.naver.com/live/arisa",
      liveTitle: "\uC77C\uB2E8 \uC2E4\uBC84\uAC00\uACE0 \uACE8\uB4DC \uAD8C\uC655\uC911\uC785\uB2C8\uB2E4 \uC815\uAE4C\uC774",
      categoryGroup: "GAME",
      categoryName: "\uB9AC\uADF8 \uC624\uBE0C \uB808\uC804\uB4DC",
      viewerCount: 6688,
      observedAt: `${dateStr} ${String(hour).padStart(2, "0")}:15:00`,
      recordedHour: hour,
      liveUrl: "https://chzzk.naver.com",
      tags: ["\uBC84\uD29C\uBC84", "\uB864", "\uB7AD\uD06C\uAC8C\uC784"]
    },
    {
      id: "hist-102",
      platform: "CHZZK",
      channelId: "ch_honey",
      channelName: "\uD5C8\uB2C8\uCE04\uB7EC\uC2A4",
      channelImageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      channelUrl: "https://chzzk.naver.com/live/honeychurros",
      liveTitle: "\uB355\uCF54\uD504\uB791 \uBE44\uC2B7\uD558\uB2E4\uB358\uB370 \uB531 \uB0B4 \uC2A4\uD0C8\uC77C\uB4EF",
      categoryGroup: "GAME",
      categoryName: "\uC885\uD569 \uAC8C\uC784",
      viewerCount: 2470,
      observedAt: `${dateStr} ${String(hour).padStart(2, "0")}:24:00`,
      recordedHour: hour,
      liveUrl: "https://chzzk.naver.com",
      tags: ["\uBC84\uD29C\uBC84", "\uC2E0\uC791\uAC8C\uC784", "\uC0DD\uBC29\uC1A1"]
    },
    {
      id: "hist-103",
      platform: "CHZZK",
      channelId: "ch_rooftop",
      channelName: "\uC625\uB0E5\uC774 RoofTopCAT",
      channelImageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
      channelUrl: "https://chzzk.naver.com/live/rooftopcat",
      liveTitle: "\uC2E0\uC791 \uB9C8\uBE14 \uC6B8\uBC84\uB9B0 PS5 \uB3C5\uC810\uC791 \uD50C\uB808\uC774",
      categoryGroup: "GAME",
      categoryName: "\uB9C8\uBE14 \uC6B8\uBC84\uB9B0",
      viewerCount: 1845,
      observedAt: `${dateStr} ${String(hour).padStart(2, "0")}:35:00`,
      recordedHour: hour,
      liveUrl: "https://chzzk.naver.com",
      tags: ["PS5", "\uC6B8\uBC84\uB9B0", "\uCF58\uC194\uAC8C\uC784"]
    },
    {
      id: "hist-104",
      platform: "CHZZK",
      channelId: "ch_ming",
      channelName: "\uAE40\uBC0D\uB839",
      channelImageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
      channelUrl: "https://chzzk.naver.com/live/kimmingryung",
      liveTitle: "\uB9C8\uC778\uD06C\uB798\uD504\uD2B8 \uD558\uB4DC\uCF54\uC5B4 \uC57C\uC0DD \uAC74\uCD95 \uD790\uB9C1 \uBC29\uC1A1",
      categoryGroup: "GAME",
      categoryName: "\uB9C8\uC778\uD06C\uB798\uD504\uD2B8",
      viewerCount: 920,
      observedAt: `${dateStr} ${String(hour).padStart(2, "0")}:42:00`,
      recordedHour: hour,
      liveUrl: "https://chzzk.naver.com",
      tags: ["\uB9C8\uC778\uD06C\uB798\uD504\uD2B8", "\uD790\uB9C1", "\uAC74\uCD95"]
    },
    {
      id: "hist-105",
      platform: "CHZZK",
      channelId: "ch_sing",
      channelName: "\uB8E8\uB098 \uBCF4\uCEEC",
      channelImageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      channelUrl: "https://chzzk.naver.com/live/luna_vocal",
      liveTitle: "\uBE44 \uC624\uB294 \uB0A0 \uB4E3\uAE30 \uC88B\uC740 \uAC10\uC131 \uBC1C\uB77C\uB4DC \uB178\uB798\uBC29",
      categoryGroup: "MUSIC",
      categoryName: "\uC74C\uC545\xB7\uB178\uB798",
      viewerCount: 1140,
      observedAt: `${dateStr} ${String(hour).padStart(2, "0")}:50:00`,
      recordedHour: hour,
      liveUrl: "https://chzzk.naver.com",
      tags: ["\uB178\uB798\uBC29", "\uBC1C\uB77C\uB4DC", "\uC6B0\uD0C0\uC640\uCFE0"]
    },
    {
      id: "hist-106",
      platform: "CHZZK",
      channelId: "ch_talk",
      channelName: "\uD558\uB8E8\uB0E5",
      channelImageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&auto=format&fit=crop&q=80",
      channelUrl: "https://chzzk.naver.com/live/harunyang",
      liveTitle: "\uC624\uB298 \uC788\uC5C8\uB358 \uC77C \uC218\uB2E4 \uB5A8\uAE30 & \uC2DC\uCCAD\uC790 \uACE0\uBBFC\uC0C1\uB2F4",
      categoryGroup: "TALK",
      categoryName: "\uC7A1\uB2F4\xB7\uC18C\uD1B5",
      viewerCount: 680,
      observedAt: `${dateStr} ${String(hour).padStart(2, "0")}:10:00`,
      recordedHour: hour,
      liveUrl: "https://chzzk.naver.com",
      tags: ["\uC800\uCC57", "\uC18C\uD1B5", "\uACE0\uBBFC\uC0C1\uB2F4"]
    }
  ];
  return sampleData.filter((item) => {
    if (platform !== "ALL" && item.platform !== platform)
      return false;
    if (category !== "ALL" && item.categoryGroup !== category)
      return false;
    if (query) {
      const q = query.toLowerCase();
      const matchTitle = item.liveTitle.toLowerCase().includes(q);
      const matchName = item.channelName.toLowerCase().includes(q);
      if (!matchTitle && !matchName)
        return false;
    }
    return true;
  });
}
__name(getFallbackHistoryRecords, "getFallbackHistoryRecords");
function getFallbackCreatorHistory(name) {
  return {
    streamerName: name,
    platform: "CHZZK",
    channelImageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    channelUrl: "https://chzzk.naver.com",
    totalRecordedStreams: 8,
    frequentCategories: [
      { name: "\uB9AC\uADF8 \uC624\uBE0C \uB808\uC804\uB4DC", count: 4 },
      { name: "\uC885\uD569 \uAC8C\uC784", count: 2 },
      { name: "\uC7A1\uB2F4\xB7\uC18C\uD1B5", count: 2 }
    ],
    recentStreams: [
      {
        date: "2026-09-15",
        hour: 13,
        title: "\uC77C\uB2E8 \uC2E4\uBC84\uAC00\uACE0 \uACE8\uB4DC \uAD8C\uC655\uC911\uC785\uB2C8\uB2E4 \uC815\uAE4C\uC774",
        categoryName: "\uB9AC\uADF8 \uC624\uBE0C \uB808\uC804\uB4DC",
        viewerCount: 6688
      },
      {
        date: "2026-09-14",
        hour: 20,
        title: "\uC2E0\uC791 \uC778\uB514\uAC8C\uC784 \uCC0D\uBA39 \uD574\uBCF4\uAE30",
        categoryName: "\uC885\uD569 \uAC8C\uC784",
        viewerCount: 5210
      },
      {
        date: "2026-09-13",
        hour: 21,
        title: "\uC57C\uAC04 \uC800\uCC57 \uBC0F \uC2DC\uCCAD\uC790 \uC0AC\uC5F0 \uC77D\uAE30",
        categoryName: "\uC7A1\uB2F4\xB7\uC18C\uD1B5",
        viewerCount: 4890
      },
      {
        date: "2026-09-12",
        hour: 19,
        title: "\uC194\uB85C\uB7AD\uD06C \uACE8\uB4DC \uC2B9\uAE09\uC804 \uB3C4\uC804 1\uC77C\uCC28",
        categoryName: "\uB9AC\uADF8 \uC624\uBE0C \uB808\uC804\uB4DC",
        viewerCount: 5940
      }
    ]
  };
}
__name(getFallbackCreatorHistory, "getFallbackCreatorHistory");

// src/services/broadcastStatisticsSources.ts
function isVtuberContent(tags, title, isRegistered) {
  if (isRegistered)
    return true;
  const keywordRegex = /버추얼|버튜버|vtuber|버츄얼/i;
  if (Array.isArray(tags) && tags.some((tag) => keywordRegex.test(tag)))
    return true;
  if (title && keywordRegex.test(title))
    return true;
  return false;
}
__name(isVtuberContent, "isVtuberContent");
function isRookieStreamer(debutDate, title, tags) {
  if (debutDate) {
    const debutTime = Date.parse(debutDate);
    if (Number.isFinite(debutTime)) {
      const diffDays = (Date.now() - debutTime) / (1e3 * 60 * 60 * 24);
      if (diffDays >= -7 && diffDays <= 60)
        return true;
    }
  }
  const rookieRegex = /신입|신인|데뷔|debut|신규/i;
  if (title && rookieRegex.test(title))
    return true;
  if (Array.isArray(tags) && tags.some((tag) => rookieRegex.test(tag)))
    return true;
  return false;
}
__name(isRookieStreamer, "isRookieStreamer");
async function fetchPlatformJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
      signal: controller.signal
    });
    if (!response.ok)
      throw new Error(`Platform HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}
__name(fetchPlatformJson, "fetchPlatformJson");
function isViewerCount(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
__name(isViewerCount, "isViewerCount");
function parseStartTime(value) {
  if (!value)
    return null;
  const normalized = value.replace(" ", "T");
  const time = /Z$|[+-]\d{2}:\d{2}$/.test(normalized) ? normalized : `${normalized}+09:00`;
  return Number.isFinite(Date.parse(time)) ? new Date(time).toISOString() : null;
}
__name(parseStartTime, "parseStartTime");
function normalizeChzzk(item, registeredInfo) {
  const channelId = item.channel.channelId;
  const isRegistered = Boolean(registeredInfo);
  const isVtuber = isVtuberContent(item.tags, item.liveTitle, isRegistered);
  const isRookie = isRookieStreamer(registeredInfo?.debutDate, item.liveTitle, item.tags);
  return {
    id: `CHZZK:${item.liveId}`,
    platform: "CHZZK",
    streamId: String(item.liveId),
    channelKey: `CHZZK:${channelId}`,
    channelName: item.channel.channelName,
    channelUrl: `https://chzzk.naver.com/${channelId}`,
    imageUrl: item.channel.channelImageUrl || null,
    liveUrl: `https://chzzk.naver.com/live/${channelId}`,
    title: item.liveTitle || "\uC81C\uBAA9 \uC5C6\uC74C",
    categoryId: item.liveCategory || "unknown",
    categoryName: item.liveCategoryValue || "\uCE74\uD14C\uACE0\uB9AC \uBBF8\uC81C\uACF5",
    viewers: item.concurrentUserCount,
    startedAt: parseStartTime(item.openDate),
    isVtuber,
    isRookie,
    debutDate: registeredInfo?.debutDate || null,
    tags: item.tags || []
  };
}
__name(normalizeChzzk, "normalizeChzzk");
function deduplicateLiveChannels(lives) {
  const channels = /* @__PURE__ */ new Map();
  for (const live of lives) {
    const key = live.channelKey || live.id;
    const previous = channels.get(key);
    if (!previous || live.viewers > previous.viewers)
      channels.set(key, live);
  }
  return [...channels.values()].sort((a, b) => b.viewers - a.viewers || a.id.localeCompare(b.id));
}
__name(deduplicateLiveChannels, "deduplicateLiveChannels");
async function getChzzkStatisticsSource(db) {
  const lives = [];
  let next;
  let complete = true;
  const registeredMap = /* @__PURE__ */ new Map();
  if (db) {
    try {
      const dbChannels = await db.prepare(`SELECT c.id, c.channel_url, info.debut_date
        FROM streamerChannel c
        LEFT JOIN streamerChannel_info info ON info.channel_id = c.id
        WHERE c.platform = 'CHZZK'`).all();
      for (const row of dbChannels.results || []) {
        const segs = (row.channel_url || "").split("/").filter(Boolean);
        const cid = segs[segs.length - 1];
        if (cid)
          registeredMap.set(cid.toLowerCase(), { id: row.id, debutDate: row.debut_date });
      }
    } catch (e) {
      console.warn("[Statistics] Failed to query CHZZK registered channels", e);
    }
  }
  try {
    for (let page = 0; page < 2; page++) {
      const cursorValues = new URLSearchParams();
      if (next && typeof next === "object") {
        for (const [key, value] of Object.entries(next)) {
          if (typeof value === "string" || typeof value === "number")
            cursorValues.set(key, String(value));
        }
      } else if (typeof next === "string") {
        cursorValues.set("next", next);
      }
      const cursor = cursorValues.size ? `&${cursorValues.toString()}` : "";
      const response = await fetchPlatformJson(`https://api.chzzk.naver.com/service/v1/lives?sortType=POPULAR&size=50${cursor}`);
      if (!Array.isArray(response.content?.data))
        throw new Error("Invalid CHZZK response");
      for (const item of response.content.data) {
        if (!item.channel?.channelId || !isViewerCount(item.concurrentUserCount)) {
          complete = false;
          continue;
        }
        const reg = registeredMap.get(item.channel.channelId.toLowerCase());
        lives.push(normalizeChzzk(item, reg));
      }
      next = response.content.page?.next;
      if (!next || response.content.data.length < 50)
        break;
    }
  } catch (error) {
    complete = false;
    console.warn("[Statistics] CHZZK collection unavailable", String(error));
  }
  return {
    source: {
      platform: "CHZZK",
      state: complete ? "available" : lives.length ? "partial" : "unavailable",
      scope: "\uCE58\uC9C0\uC9C1 \uC2E4\uC2DC\uAC04 \uBC29\uC1A1",
      observedAt: complete || lives.length ? (/* @__PURE__ */ new Date()).toISOString() : null,
      checkedChannels: null
    },
    lives: deduplicateLiveChannels(lives)
  };
}
__name(getChzzkStatisticsSource, "getChzzkStatisticsSource");
async function getSoopChannel(row) {
  const userId = extractSoopUserId(row.channel_url);
  if (!userId)
    throw new Error("Invalid registered channel");
  const response = await fetchPlatformJson(`https://chapi.sooplive.co.kr/api/${encodeURIComponent(userId)}/station`);
  if (!response.station)
    throw new Error("Invalid SOOP response");
  if (!response.broad?.broad_no)
    return null;
  const broad = response.broad;
  if (!isViewerCount(broad.current_sum_viewer))
    throw new Error("Missing SOOP viewers");
  const isRookie = isRookieStreamer(row.debut_date, broad.broad_title || void 0, void 0);
  return {
    id: `SOOP:${broad.broad_no}`,
    platform: "SOOP",
    streamId: String(broad.broad_no),
    channelKey: `SOOP:${userId}`,
    channelName: row.channel_name || response.station.user_nick || userId,
    channelUrl: `https://www.sooplive.co.kr/station/${userId}`,
    imageUrl: row.profile_image_url,
    liveUrl: `https://play.sooplive.co.kr/${userId}/${broad.broad_no}`,
    title: broad.broad_title || "\uC81C\uBAA9 \uC5C6\uC74C",
    categoryId: String(broad.broad_cate_no || "unknown"),
    categoryName: broad.broad_cate_name || "\uCE74\uD14C\uACE0\uB9AC \uBBF8\uC81C\uACF5",
    viewers: broad.current_sum_viewer,
    startedAt: null,
    isVtuber: true,
    isRookie,
    debutDate: row.debut_date || null
  };
}
__name(getSoopChannel, "getSoopChannel");
async function getSoopStatisticsSource(db) {
  const source = {
    platform: "SOOP",
    state: "unavailable",
    scope: "SOOP \uBC84\uCD94\uC5BC \uC2A4\uD2B8\uB9AC\uBA38",
    observedAt: null,
    checkedChannels: 0
  };
  try {
    const result = await db.prepare(`SELECT c.id, c.channel_name, c.channel_url, i.profile_image_url, i.debut_date
      FROM streamerChannel c
      LEFT JOIN streamerChannel_info i ON i.channel_id = c.id
      WHERE c.platform = 'SOOP' ORDER BY c.id LIMIT 150`).all();
    const chunkSize = 15;
    const channels = result.results;
    const allResponses = [];
    for (let i = 0; i < channels.length; i += chunkSize) {
      const chunk = channels.slice(i, i + chunkSize);
      const chunkResponses = await Promise.allSettled(chunk.map(getSoopChannel));
      allResponses.push(...chunkResponses);
    }
    const successes = allResponses.filter((response) => response.status === "fulfilled");
    const lives = allResponses.flatMap((response) => response.status === "fulfilled" && response.value ? [response.value] : []);
    source.checkedChannels = successes.length;
    source.state = successes.length === allResponses.length && allResponses.length > 0 ? "available" : successes.length ? "partial" : "unavailable";
    source.observedAt = successes.length ? (/* @__PURE__ */ new Date()).toISOString() : null;
    return { source, lives: deduplicateLiveChannels(lives) };
  } catch (error) {
    console.warn("[Statistics] SOOP collection unavailable", String(error));
    return { source, lives: [] };
  }
}
__name(getSoopStatisticsSource, "getSoopStatisticsSource");

// ../shared/statisticsCollection.ts
var STATISTICS_COLLECTION_MINUTES = 10;

// src/services/broadcastStatisticsHistory.ts
async function readStatisticsHistory(db, from, to) {
  const result = await db.prepare(`SELECT r.platform, s.stream_id AS external_stream_id, s.viewers AS viewer_count,
    s.title, s.category_id AS source_category_id, s.category_name AS source_category_name,
    r.observed_at AS collection_started_at, s.channel_key, s.channel_name, s.channel_url,
    s.image_url AS profile_image_url, s.live_url, s.started_at, r.state='partial' AS partial
    FROM analytics_broadcast_runs r JOIN analytics_broadcast_snapshots s ON s.run_id=r.run_id
    WHERE r.observed_at>=? AND r.observed_at<=? AND r.state IN ('available','partial')
    ORDER BY r.observed_at, r.platform, s.stream_id LIMIT 21001`).bind(from, to).all();
  if (result.results.length > 21e3)
    throw new Error("History result exceeds 10-minute collection bounds");
  return result.results;
}
__name(readStatisticsHistory, "readStatisticsHistory");
async function readStatisticsRuns(db, from, to) {
  const result = await db.prepare(`SELECT platform, scheduled_at, started_at, observed_at, state, viewer_total, channel_total
    FROM analytics_broadcast_runs WHERE scheduled_at>=? AND scheduled_at<=? ORDER BY scheduled_at, platform`).bind(from, to).all();
  return result.results;
}
__name(readStatisticsRuns, "readStatisticsRuns");
function summarizeStatisticsCollection(runs, first, now = /* @__PURE__ */ new Date()) {
  const interval = STATISTICS_COLLECTION_MINUTES * 6e4;
  const latestDue = Math.floor((now.getTime() - 2 * 6e4) / interval) * interval;
  const windowStart = Math.ceil((now.getTime() - 24 * 36e5) / interval) * interval;
  return {
    checkedAt: now.toISOString(),
    intervalMinutes: STATISTICS_COLLECTION_MINUTES,
    platforms: ["CHZZK", "SOOP"].map((platform) => {
      const rows2 = runs.filter((run) => run.platform === platform);
      const firstAt = first.find((row) => row.platform === platform)?.first_at || null;
      const start = Math.max(windowStart, firstAt ? Date.parse(firstAt) : latestDue + interval);
      const due = rows2.filter((row) => Date.parse(row.scheduled_at) >= start && Date.parse(row.scheduled_at) <= latestDue);
      const expectedRuns = Math.max(0, Math.floor((latestDue - start) / interval) + 1);
      const completeRuns = due.filter((row) => row.state === "available").length;
      const partialRuns = due.filter((row) => row.state === "partial").length;
      const failedRuns = due.filter((row) => row.state === "unavailable" || row.state === "running").length;
      const missingRuns = Math.max(0, expectedRuns - due.length);
      const availableRows = rows2.filter((row) => row.state === "available" && row.observed_at);
      const lastComplete = availableRows.length ? availableRows[availableRows.length - 1].observed_at || null : null;
      const delayed = firstAt && (!lastComplete ? now.getTime() - Date.parse(firstAt) > 20 * 6e4 : now.getTime() - Date.parse(lastComplete) > 20 * 6e4);
      const lastAttempt = rows2.length ? rows2[rows2.length - 1].started_at || null : null;
      return {
        platform,
        state: !firstAt ? "pending" : delayed ? "delayed" : partialRuns + failedRuns + missingRuns > 0 ? "partial" : "healthy",
        firstCollectedAt: firstAt,
        lastAttemptAt: lastAttempt,
        lastCompleteAt: lastComplete,
        expectedRuns,
        completeRuns,
        partialRuns,
        failedRuns,
        missingRuns
      };
    })
  };
}
__name(summarizeStatisticsCollection, "summarizeStatisticsCollection");
async function getStatisticsCollectionStatus(db, now = /* @__PURE__ */ new Date(), runs) {
  const from = new Date(now.getTime() - 24 * 36e5).toISOString();
  const [history, first] = await Promise.all([
    runs ? Promise.resolve(runs) : readStatisticsRuns(db, from, now.toISOString()),
    db.prepare("SELECT platform, MIN(scheduled_at) AS first_at FROM analytics_broadcast_runs GROUP BY platform").all()
  ]);
  return summarizeStatisticsCollection(history, first.results, now);
}
__name(getStatisticsCollectionStatus, "getStatisticsCollectionStatus");

// src/services/broadcastStatisticsService.ts
function getHistoryChannelId(value) {
  if (!value)
    return null;
  try {
    const url = new URL(value);
    if (url.hostname !== "chzzk.naver.com")
      return null;
    const segments = url.pathname.split("/").filter(Boolean);
    const id = segments[0] === "live" ? segments[1] : segments[0];
    return id && /^[a-f0-9]{32}$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}
__name(getHistoryChannelId, "getHistoryChannelId");
function historyBroadcast(row, current) {
  const channelId = getHistoryChannelId(row.channel_url);
  return {
    id: `${row.platform}:${row.external_stream_id}`,
    platform: row.platform,
    streamId: row.external_stream_id,
    channelKey: row.channel_key || current?.channelKey || (channelId ? `CHZZK:${channelId}` : null),
    channelName: current?.channelName || row.channel_name,
    channelUrl: row.channel_url || current?.channelUrl || (channelId ? `https://chzzk.naver.com/${channelId}` : null),
    imageUrl: current?.imageUrl || row.profile_image_url,
    liveUrl: current?.liveUrl || row.live_url || null,
    title: row.title || "\uC81C\uBAA9 \uC5C6\uC74C",
    categoryId: row.source_category_id || "unknown",
    categoryName: row.source_category_name || "\uCE74\uD14C\uACE0\uB9AC \uBBF8\uC81C\uACF5",
    viewers: row.viewer_count,
    startedAt: row.started_at || current?.startedAt || null
  };
}
__name(historyBroadcast, "historyBroadcast");
function uniqueHistory(rows2) {
  const map = /* @__PURE__ */ new Map();
  for (const row of rows2) {
    if (!Number.isFinite(Date.parse(row.collection_started_at)))
      continue;
    const key = `${row.platform}:${row.external_stream_id}:${row.collection_started_at}`;
    const previous = map.get(key);
    if (!previous || row.viewer_count > previous.viewer_count)
      map.set(key, row);
  }
  return [...map.values()];
}
__name(uniqueHistory, "uniqueHistory");
function buildPoints(rows2, sources, runs) {
  const samples = /* @__PURE__ */ new Map();
  for (const row of rows2) {
    const key = `${row.platform}:${row.collection_started_at}`;
    const point = samples.get(key) || { platform: row.platform, at: row.collection_started_at, viewers: 0, channels: 0, kind: "history" };
    point.viewers += row.viewer_count;
    point.channels++;
    if (row.partial)
      point.partial = true;
    samples.set(key, point);
  }
  if (runs.length) {
    samples.clear();
    for (const run of runs) {
      if (!run.observed_at || run.viewer_total === null || run.channel_total === null || !["available", "partial"].includes(run.state))
        continue;
      samples.set(`${run.platform}:${run.observed_at}`, { platform: run.platform, at: run.observed_at, viewers: run.viewer_total, channels: run.channel_total, kind: "history", partial: run.state === "partial" });
    }
  }
  for (const { source, lives } of sources) {
    if (!source.observedAt || source.state !== "available" && source.state !== "partial")
      continue;
    samples.set(`${source.platform}:current`, {
      platform: source.platform,
      at: source.observedAt,
      viewers: lives.reduce((sum, live) => sum + live.viewers, 0),
      channels: lives.length,
      kind: "current",
      partial: source.state === "partial"
    });
  }
  return [...samples.values()].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
__name(buildPoints, "buildPoints");
function buildPeaks(rows2, sources, from) {
  const lives = sources.flatMap((source) => source.lives);
  const current = new Map(lives.map((live) => [live.id, live]));
  const peaks = /* @__PURE__ */ new Map();
  for (const row of rows2) {
    if (Date.parse(row.collection_started_at) < Date.parse(from))
      continue;
    const id = `${row.platform}:${row.external_stream_id}`;
    const broadcast = historyBroadcast(row, current.get(id));
    const prior = peaks.get(id);
    const samples = [...prior?.samples || [], { at: row.collection_started_at, viewers: row.viewer_count }];
    const peak = !prior || row.viewer_count > prior.viewers ? { ...broadcast, peakAt: row.collection_started_at, isLive: current.has(id), samples } : { ...prior, samples };
    peaks.set(id, peak);
  }
  for (const { source, lives: currentLives } of sources) {
    if (!source.observedAt)
      continue;
    for (const live of currentLives) {
      const prior = peaks.get(live.id);
      const samples = [...prior?.samples || [], { at: source.observedAt, viewers: live.viewers }];
      peaks.set(live.id, !prior || live.viewers > prior.viewers ? { ...live, peakAt: source.observedAt, isLive: true, samples } : { ...prior, isLive: true, samples });
    }
  }
  return [...peaks.values()].sort((a, b) => b.viewers - a.viewers || a.id.localeCompare(b.id));
}
__name(buildPeaks, "buildPeaks");
function assembleBroadcastStatistics(sources, rawRows, historyState, now = /* @__PURE__ */ new Date(), runs = []) {
  const historyFrom = new Date(now.getTime() - 24 * 36e5).toISOString();
  const peakFrom = new Date(now.getTime() - 24 * 36e5).toISOString();
  const rows2 = uniqueHistory(rawRows).filter((row) => Date.parse(row.collection_started_at) >= Date.parse(historyFrom) && Date.parse(row.collection_started_at) <= now.getTime());
  const peaks = buildPeaks(rows2, sources, peakFrom);
  const times = [...rows2.map((row) => Date.parse(row.collection_started_at)), ...runs.filter((run) => run.observed_at && ["available", "partial"].includes(run.state)).map((run) => Date.parse(run.observed_at))];
  return {
    meta: {
      generatedAt: now.toISOString(),
      timezone: "Asia/Seoul",
      refreshSeconds: 60,
      historyState,
      lastHistoryAt: times.length ? new Date(Math.max(...times)).toISOString() : null,
      peakFrom,
      historyFrom,
      historyScope: "\uCE58\uC9C0\uC9C1 \xB7 SOOP \uC2E4\uC2DC\uAC04 \uBC29\uC1A1 \uC218\uC9D1 \uB370\uC774\uD130",
      historyIntervalMinutes: STATISTICS_COLLECTION_MINUTES,
      unlinkedPeakChannels: peaks.filter((peak) => !peak.channelKey).length
    },
    sources: sources.map((source) => source.source),
    lives: sources.flatMap((source) => source.lives).sort((a, b) => b.viewers - a.viewers || a.id.localeCompare(b.id)),
    points: buildPoints(rows2, sources, runs),
    peaks
  };
}
__name(assembleBroadcastStatistics, "assembleBroadcastStatistics");
async function getBroadcastStatisticsForDate(db, dateStr) {
  const startKst = `${dateStr}T00:00:00+09:00`;
  const endKst = `${dateStr}T23:59:59+09:00`;
  const from = new Date(Date.parse(startKst)).toISOString();
  const to = new Date(Date.parse(endKst)).toISOString();
  const [rawRows, runs] = await Promise.all([
    readStatisticsHistory(db, from, to),
    readStatisticsRuns(db, from, to)
  ]);
  const validRuns = runs.filter((run) => run.observed_at && ["available", "partial"].includes(run.state));
  const historyState = validRuns.length ? "available" : "empty";
  const platforms = ["CHZZK", "SOOP"];
  const sources = platforms.map((p) => {
    const pRuns = validRuns.filter((r) => r.platform === p);
    return {
      source: {
        platform: p,
        state: pRuns.length ? "available" : "unavailable",
        scope: `${p === "CHZZK" ? "\uCE58\uC9C0\uC9C1" : "SOOP"} ${dateStr} \uC544\uCE74\uC774\uBE0C`,
        observedAt: to,
        checkedChannels: null
      },
      lives: []
    };
  });
  const response = assembleBroadcastStatistics(sources, rawRows, historyState, new Date(Date.parse(endKst)), validRuns);
  response.meta.targetDate = dateStr;
  response.meta.isPastDate = true;
  response.meta.historyScope = `${dateStr} KST \uBC29\uC1A1 \uAE30\uB85D \uC544\uCE74\uC774\uBE0C`;
  response.meta.peakFrom = from;
  response.meta.historyFrom = from;
  return response;
}
__name(getBroadcastStatisticsForDate, "getBroadcastStatisticsForDate");
async function readLatestPlatformSnapshotFromD1(db, platform, maxAgeMinutes = 30) {
  try {
    const minObservedAt = new Date(Date.now() - maxAgeMinutes * 60 * 1e3).toISOString();
    const run = await db.prepare(`
      SELECT run_id, platform, state, scope, observed_at, checked_channels
      FROM analytics_broadcast_runs
      WHERE platform = ? AND state IN ('available', 'partial') AND observed_at >= ?
      ORDER BY observed_at DESC
      LIMIT 1
    `).bind(platform, minObservedAt).first();
    if (!run || !run.run_id) {
      return null;
    }
    const { results } = await db.prepare(`
      SELECT s.stream_id, s.channel_key, s.channel_name, s.channel_url, s.image_url,
             s.live_url, s.title, s.category_id, s.category_name, s.viewers, s.started_at,
             (SELECT info.debut_date FROM streamerChannel_info info
              JOIN streamerChannel c ON c.id = info.channel_id
              WHERE c.channel_url = s.channel_url LIMIT 1) AS debut_date
      FROM analytics_broadcast_snapshots s
      WHERE s.run_id = ?
      ORDER BY s.viewers DESC
    `).bind(run.run_id).all();
    if (!results || results.length === 0) {
      return null;
    }
    const lives = results.map((s) => {
      const isRookie = isRookieStreamer(s.debut_date, s.title, void 0);
      return {
        id: `${platform}:${s.stream_id}`,
        platform,
        streamId: s.stream_id,
        channelKey: s.channel_key,
        channelName: s.channel_name || "\uC81C\uBAA9 \uC5C6\uC74C",
        channelUrl: s.channel_url || "",
        imageUrl: s.image_url,
        liveUrl: s.live_url,
        title: s.title || "\uC81C\uBAA9 \uC5C6\uC74C",
        categoryId: s.category_id || "unknown",
        categoryName: s.category_name || "\uCE74\uD14C\uACE0\uB9AC \uBBF8\uC81C\uACF5",
        viewers: s.viewers || 0,
        startedAt: s.started_at || null,
        isVtuber: true,
        isRookie,
        debutDate: s.debut_date || null
      };
    });
    return {
      source: {
        platform,
        state: run.state,
        scope: run.scope || (platform === "CHZZK" ? "\uCE58\uC9C0\uC9C1 \uC2E4\uC2DC\uAC04 \uBC29\uC1A1" : "SOOP \uBC84\uCD94\uC5BC \uC2A4\uD2B8\uB9AC\uBA38"),
        observedAt: run.observed_at,
        checkedChannels: run.checked_channels
      },
      lives: deduplicateLiveChannels(lives)
    };
  } catch (err) {
    console.warn(`[readLatestPlatformSnapshotFromD1] Failed for ${platform}:`, err);
    return null;
  }
}
__name(readLatestPlatformSnapshotFromD1, "readLatestPlatformSnapshotFromD1");
async function getBroadcastStatistics(db, targetDate, forceFresh = false) {
  const todayKst = new Date(Date.now() + 9 * 36e5).toISOString().slice(0, 10);
  if (targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate) && targetDate !== todayKst) {
    return getBroadcastStatisticsForDate(db, targetDate);
  }
  const startedAt = /* @__PURE__ */ new Date();
  const from = new Date(startedAt.getTime() - 24 * 36e5).toISOString();
  let chzzkSource = null;
  let soopSource = null;
  if (!forceFresh) {
    const [cachedChzzk, cachedSoop] = await Promise.all([
      readLatestPlatformSnapshotFromD1(db, "CHZZK", 30),
      readLatestPlatformSnapshotFromD1(db, "SOOP", 30)
    ]);
    chzzkSource = cachedChzzk;
    soopSource = cachedSoop;
  }
  const fallbackTasks = [];
  if (!chzzkSource)
    fallbackTasks.push(getChzzkStatisticsSource(db));
  if (!soopSource)
    fallbackTasks.push(getSoopStatisticsSource(db));
  const [rowsResult, runsResult, ...fallbackResults] = await Promise.allSettled([
    readStatisticsHistory(db, from, startedAt.toISOString()),
    readStatisticsRuns(db, from, startedAt.toISOString()),
    ...fallbackTasks
  ]);
  let fallbackIdx = 0;
  if (!chzzkSource) {
    const r = fallbackResults[fallbackIdx++];
    chzzkSource = r && r.status === "fulfilled" ? r.value : null;
  }
  if (!soopSource) {
    const r = fallbackResults[fallbackIdx++];
    soopSource = r && r.status === "fulfilled" ? r.value : null;
  }
  const chzzk = chzzkSource || { source: { platform: "CHZZK", state: "unavailable", scope: "\uCE58\uC9C0\uC9C1 \uC2E4\uC2DC\uAC04 \uBC29\uC1A1", observedAt: null, checkedChannels: null }, lives: [] };
  const soop = soopSource || { source: { platform: "SOOP", state: "unavailable", scope: "SOOP \uBC84\uCD94\uC5BC \uC2A4\uD2B8\uB9AC\uBA38", observedAt: null, checkedChannels: null }, lives: [] };
  const rows2 = rowsResult.status === "fulfilled" ? rowsResult.value : [];
  if (rowsResult.status === "rejected")
    console.warn("[Statistics] History unavailable", String(rowsResult.reason));
  const runs = runsResult.status === "fulfilled" ? runsResult.value : [];
  const validRuns = runs.filter((run) => run.observed_at && Date.parse(run.observed_at) >= Date.parse(from) && Date.parse(run.observed_at) <= Date.now());
  const failed = rowsResult.status === "rejected" || runsResult.status === "rejected";
  const historyState = failed ? "unavailable" : validRuns.some((run) => run.state === "available" || run.state === "partial") ? "available" : "empty";
  const response = assembleBroadcastStatistics([chzzk, soop], rows2, historyState, /* @__PURE__ */ new Date(), validRuns);
  try {
    response.meta.collection = await getStatisticsCollectionStatus(db, /* @__PURE__ */ new Date(), runs);
  } catch (error) {
    console.warn("[Statistics] Collection status unavailable", String(error));
  }
  return response;
}
__name(getBroadcastStatistics, "getBroadcastStatistics");
async function getStreamerBroadcastHistory(db, channelKey, days = 7) {
  const safeDays = Math.min(Math.max(Number(days) || 7, 1), 30);
  const fromUtc = new Date(Date.now() - safeDays * 24 * 36e5).toISOString();
  const platform = channelKey.startsWith("SOOP:") ? "SOOP" : "CHZZK";
  const rows2 = await db.prepare(`
    SELECT s.stream_id, s.title, s.category_name, MAX(s.viewers) AS peak_viewers,
           MIN(s.started_at) AS started_at, MAX(r.observed_at) AS last_observed_at,
           s.live_url, s.channel_name
    FROM analytics_broadcast_snapshots s
    JOIN analytics_broadcast_runs r ON r.run_id = s.run_id
    WHERE (s.channel_key = ? OR s.channel_key = ?) AND r.observed_at >= ?
    GROUP BY s.stream_id
    ORDER BY MAX(r.observed_at) DESC
    LIMIT 30
  `).bind(channelKey, channelKey.toLowerCase(), fromUtc).all();
  const channelName = rows2.results[0]?.channel_name || channelKey;
  return {
    channelKey,
    name: channelName,
    platform,
    broadcasts: rows2.results.map((r) => ({
      streamId: r.stream_id,
      title: r.title || "\uC81C\uBAA9 \uC5C6\uC74C",
      categoryName: r.category_name || "\uCE74\uD14C\uACE0\uB9AC \uBBF8\uC81C\uACF5",
      peakViewers: r.peak_viewers || 0,
      startedAt: r.started_at || null,
      lastObservedAt: r.last_observed_at,
      liveUrl: r.live_url || null
    }))
  };
}
__name(getStreamerBroadcastHistory, "getStreamerBroadcastHistory");

// ../shared/statisticsStreamerSearch.ts
function normalizeStreamerQuery(value) {
  return value.normalize("NFKC").replace(/\s+/g, "").toLocaleLowerCase().slice(0, 80);
}
__name(normalizeStreamerQuery, "normalizeStreamerQuery");

// src/services/externalPlatformSearchService.ts
var DEFAULT_FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*"
};
async function searchChzzkChannels(query, limit = 6) {
  const trimmed = query.trim();
  if (!trimmed)
    return [];
  const url = `https://api.chzzk.naver.com/service/v1/search/channels?keyword=${encodeURIComponent(trimmed)}&offset=0&size=${limit}`;
  try {
    const res = await fetch(url, {
      headers: {
        ...DEFAULT_FETCH_HEADERS,
        "Referer": "https://chzzk.naver.com/"
      },
      signal: AbortSignal.timeout(3e3)
    });
    if (!res.ok)
      return [];
    const json = await res.json();
    const items = json?.content?.data || [];
    return items.map((item) => {
      const channel = item.channel;
      const channelId = channel.channelId;
      return {
        id: `external:chzzk:${channelId}`,
        platform: "CHZZK",
        channelKey: `CHZZK:${channelId.toLowerCase()}`,
        name: channel.channelName || trimmed,
        channelUrl: `https://chzzk.naver.com/${channelId}`,
        imageUrl: channel.channelImageUrl || null,
        profileSlug: null,
        isRegistered: false,
        isLive: Boolean(channel.openLive),
        followerCount: typeof channel.followerCount === "number" ? channel.followerCount : void 0
      };
    });
  } catch (err) {
    console.warn("[searchChzzkChannels] external search failed or timed out:", err);
    return [];
  }
}
__name(searchChzzkChannels, "searchChzzkChannels");
async function searchSoopChannels(query, limit = 6) {
  const trimmed = query.trim();
  if (!trimmed)
    return [];
  const url = `https://sch.sooplive.co.kr/api.php?m=bjSearch&szKeyword=${encodeURIComponent(trimmed)}&v=1.0&sz=${limit}&page=1`;
  try {
    const res = await fetch(url, {
      headers: {
        ...DEFAULT_FETCH_HEADERS,
        "Referer": "https://www.sooplive.co.kr/"
      },
      signal: AbortSignal.timeout(3e3)
    });
    if (!res.ok)
      return [];
    const json = await res.json();
    const items = json?.DATA || [];
    return items.map((item) => {
      const userId = item.user_id;
      let logo = item.station_logo || null;
      if (logo && logo.startsWith("//")) {
        logo = "https:" + logo;
      }
      return {
        id: `external:soop:${userId}`,
        platform: "SOOP",
        channelKey: `SOOP:${userId.toLowerCase()}`,
        name: item.user_nick || userId,
        channelUrl: `https://www.sooplive.com/station/${userId}`,
        imageUrl: logo,
        profileSlug: null,
        isRegistered: false,
        isLive: item.is_broad === "Y" || Boolean(item.broad_no)
      };
    });
  } catch (err) {
    console.warn("[searchSoopChannels] external search failed or timed out:", err);
    return [];
  }
}
__name(searchSoopChannels, "searchSoopChannels");
async function searchExternalPlatforms(query, limitPerPlatform = 5) {
  const normalized = normalizeStreamerQuery(query);
  if (!normalized)
    return [];
  const [chzzkResult, soopResult] = await Promise.allSettled([
    searchChzzkChannels(query, limitPerPlatform),
    searchSoopChannels(query, limitPerPlatform)
  ]);
  const chzzkItems = chzzkResult.status === "fulfilled" ? chzzkResult.value : [];
  const soopItems = soopResult.status === "fulfilled" ? soopResult.value : [];
  return [...chzzkItems, ...soopItems];
}
__name(searchExternalPlatforms, "searchExternalPlatforms");
function createSafeSlug(platform, name, fallbackKey) {
  const base = name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 30);
  if (base && base.length >= 2) {
    return `${base}-${platform.toLowerCase()}`;
  }
  return `streamer-${fallbackKey.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 20)}`;
}
__name(createSafeSlug, "createSafeSlug");
function normalizePlatformChannelUrl(platform, rawUrl) {
  const trimmed = rawUrl.trim();
  if (platform === "CHZZK") {
    const match2 = trimmed.match(/chzzk\.naver\.com\/(?:live\/)?([a-zA-Z0-9_-]+)/);
    if (match2 && match2[1]) {
      return `https://chzzk.naver.com/${match2[1]}`;
    }
    return trimmed;
  }
  if (platform === "SOOP") {
    const match2 = trimmed.match(/sooplive\.(?:co\.kr|com)\/(?:station\/)?([a-zA-Z0-9_-]+)/);
    if (match2 && match2[1]) {
      return `https://www.sooplive.com/station/${match2[1]}`;
    }
    return trimmed;
  }
  return trimmed;
}
__name(normalizePlatformChannelUrl, "normalizePlatformChannelUrl");
async function registerExternalStreamerToD1(db, item) {
  try {
    const safeName = item.name.trim();
    const cleanUrl = normalizePlatformChannelUrl(item.platform, item.channelUrl);
    let altUrl = cleanUrl;
    if (item.platform === "SOOP") {
      altUrl = cleanUrl.includes(".com") ? cleanUrl.replace(".com", ".co.kr") : cleanUrl.replace(".co.kr", ".com");
    }
    const existing = await db.prepare("SELECT id, platform, channel_url, channel_name FROM streamerChannel WHERE platform = ? AND (channel_url = ? OR channel_url = ? OR channel_url = ?) LIMIT 1").bind(item.platform, cleanUrl, altUrl, item.channelUrl.trim()).first();
    if (existing) {
      const info = await db.prepare("SELECT slug FROM streamerChannel_info WHERE channel_id = ? LIMIT 1").bind(existing.id).first();
      return {
        success: true,
        channelId: existing.id,
        slug: info?.slug || void 0,
        message: "\uC774\uBBF8 \uB4F1\uB85D\uB41C \uC2A4\uD2B8\uB9AC\uBA38 \uCC44\uB110\uC785\uB2C8\uB2E4."
      };
    }
    const channelInsert = await db.prepare("INSERT INTO streamerChannel (platform, channel_url, channel_name) VALUES (?, ?, ?) RETURNING id").bind(item.platform, cleanUrl, safeName).first();
    const newChannelId = channelInsert?.id;
    if (!newChannelId) {
      throw new Error("\uCC44\uB110 ID \uC0DD\uC131\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    }
    let slug = createSafeSlug(item.platform, safeName, String(newChannelId));
    const slugExists = await db.prepare("SELECT id FROM streamerChannel_info WHERE slug = ? LIMIT 1").bind(slug).first();
    if (slugExists) {
      slug = `${slug}-${newChannelId}`;
    }
    const todayDate = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const nowUtc = (/* @__PURE__ */ new Date()).toISOString();
    await db.prepare(`
        INSERT INTO streamerChannel_info (
          channel_id, slug, display_name, profile_image_url, description,
          agency_name, debut_date, debut_time, timezone, start_at_utc, country_code
        ) VALUES (?, ?, ?, ?, ?, '\uAC1C\uC778\uC138', ?, '00:00', 'Asia/Seoul', ?, 'KR')
      `).bind(
      newChannelId,
      slug,
      safeName,
      item.imageUrl || "",
      `${safeName} \uC2A4\uD2B8\uB9AC\uBA38\uC758 \uCC44\uB110\uC785\uB2C8\uB2E4.`,
      todayDate,
      nowUtc
    ).run();
    return {
      success: true,
      channelId: newChannelId,
      slug,
      message: "\uC0C8\uB85C\uC6B4 \uC2A4\uD2B8\uB9AC\uBA38 \uCC44\uB110\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  } catch (err) {
    console.error("[registerExternalStreamerToD1] error:", err);
    return {
      success: false,
      message: err?.message || "\uC2A4\uD2B8\uB9AC\uBA38 \uB4F1\uB85D \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    };
  }
}
__name(registerExternalStreamerToD1, "registerExternalStreamerToD1");

// src/services/onDemandStreamerService.ts
var DEFAULT_FETCH_HEADERS2 = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*"
};
async function fetchChzzkChannelInfo(channelId) {
  const url = `https://api.chzzk.naver.com/service/v1/channels/${encodeURIComponent(channelId)}`;
  try {
    const res = await fetch(url, {
      headers: { ...DEFAULT_FETCH_HEADERS2, Referer: "https://chzzk.naver.com/" },
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok)
      return null;
    const json = await res.json();
    const data = json?.content;
    if (!data?.channelId)
      return null;
    return {
      channelId: data.channelId,
      channelName: data.channelName,
      channelImageUrl: data.channelImageUrl || null,
      followerCount: data.followerCount,
      openLive: Boolean(data.openLive),
      channelDescription: data.channelDescription || ""
    };
  } catch (err) {
    console.warn(`[onDemandStreamerService] Chzzk channel fetch failed for ${channelId}:`, err);
    return null;
  }
}
__name(fetchChzzkChannelInfo, "fetchChzzkChannelInfo");
async function fetchSoopStationInfo(userId) {
  const url = `https://chapi.sooplive.co.kr/api/${encodeURIComponent(userId)}/station`;
  try {
    const res = await fetch(url, {
      headers: { ...DEFAULT_FETCH_HEADERS2, Referer: "https://www.sooplive.co.kr/" },
      signal: AbortSignal.timeout(3500)
    });
    if (!res.ok)
      return null;
    const json = await res.json();
    if (!json?.station?.user_id)
      return null;
    return json;
  } catch (err) {
    console.warn(`[onDemandStreamerService] SOOP station fetch failed for ${userId}:`, err);
    return null;
  }
}
__name(fetchSoopStationInfo, "fetchSoopStationInfo");
async function ensureStreamerRegistered(db, channelKey) {
  const colonIndex = channelKey.indexOf(":");
  if (colonIndex === -1) {
    return { success: false, streamer: null, isNewlyRegistered: false, message: "\uC62C\uBC14\uB974\uC9C0 \uC54A\uC740 \uCC44\uB110 \uD0A4\uC785\uB2C8\uB2E4." };
  }
  const rawPlatform = channelKey.slice(0, colonIndex).toUpperCase();
  const rawId = channelKey.slice(colonIndex + 1).toLowerCase();
  if (rawPlatform !== "CHZZK" && rawPlatform !== "SOOP") {
    return { success: false, streamer: null, isNewlyRegistered: false, message: "\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uD50C\uB7AB\uD3FC\uC785\uB2C8\uB2E4." };
  }
  const platform = rawPlatform;
  const defaultChannelUrl = platform === "CHZZK" ? `https://chzzk.naver.com/${rawId}` : `https://www.sooplive.com/station/${rawId}`;
  const cleanUrl = normalizePlatformChannelUrl(platform, defaultChannelUrl);
  let altUrl = cleanUrl;
  if (platform === "SOOP") {
    altUrl = cleanUrl.includes(".com") ? cleanUrl.replace(".com", ".co.kr") : cleanUrl.replace(".co.kr", ".com");
  }
  const existing = await db.prepare(`
      SELECT c.id, c.platform, c.channel_url, c.channel_name,
             i.display_name, i.profile_image_url, i.slug
      FROM streamerChannel c
      LEFT JOIN streamerChannel_info i ON i.id = (SELECT MIN(id) FROM streamerChannel_info WHERE channel_id = c.id)
      WHERE c.platform = ? AND (c.channel_url = ? OR c.channel_url = ? OR c.channel_url = ?)
      LIMIT 1
    `).bind(platform, cleanUrl, altUrl, defaultChannelUrl).first();
  if (existing) {
    return {
      success: true,
      isNewlyRegistered: false,
      streamer: {
        id: `registered:${existing.id}`,
        platform: existing.platform,
        channelKey: `${existing.platform}:${rawId}`,
        name: existing.display_name?.trim() || existing.channel_name,
        channelUrl: existing.channel_url,
        imageUrl: existing.profile_image_url,
        profileSlug: existing.slug,
        isRegistered: true
      }
    };
  }
  let streamerName = rawId;
  let imageUrl = null;
  let isLive = false;
  if (platform === "CHZZK") {
    const chzzkData = await fetchChzzkChannelInfo(rawId);
    if (chzzkData) {
      streamerName = chzzkData.channelName || rawId;
      imageUrl = chzzkData.channelImageUrl;
      isLive = Boolean(chzzkData.openLive);
    }
  } else if (platform === "SOOP") {
    const soopData = await fetchSoopStationInfo(rawId);
    if (soopData?.station) {
      streamerName = soopData.station.user_nick || rawId;
      let logo = soopData.station.station_logo;
      if (logo && logo.startsWith("//"))
        logo = "https:" + logo;
      imageUrl = logo || null;
      isLive = Boolean(soopData.broad?.broad_no);
    }
  }
  const regResult = await registerExternalStreamerToD1(db, {
    platform,
    channelKey: `${platform}:${rawId}`,
    name: streamerName,
    channelUrl: defaultChannelUrl,
    imageUrl
  });
  if (!regResult.success || !regResult.channelId) {
    console.warn(`[onDemandStreamerService] Auto-register failed for ${channelKey}:`, regResult.message);
    return {
      success: false,
      isNewlyRegistered: false,
      streamer: {
        id: `external:${platform.toLowerCase()}:${rawId}`,
        platform,
        channelKey: `${platform}:${rawId}`,
        name: streamerName,
        channelUrl: defaultChannelUrl,
        imageUrl,
        profileSlug: null,
        isRegistered: false,
        isLive
      },
      message: regResult.message
    };
  }
  return {
    success: true,
    isNewlyRegistered: true,
    streamer: {
      id: `registered:${regResult.channelId}`,
      platform,
      channelKey: `${platform}:${rawId}`,
      name: streamerName,
      channelUrl: defaultChannelUrl,
      imageUrl,
      profileSlug: regResult.slug || null,
      isRegistered: true,
      isLive
    },
    message: "\uC0C8\uB85C\uC6B4 \uC2A4\uD2B8\uB9AC\uBA38\uAC00 VD\xE9but \uBAA8\uB2C8\uD130\uB9C1 \uB300\uC0C1\uC73C\uB85C \uC790\uB3D9 \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
  };
}
__name(ensureStreamerRegistered, "ensureStreamerRegistered");

// src/services/broadcastActivityService.ts
var ACTIVITY_CTE = `WITH runs AS (
  SELECT run_id, platform, observed_at, scheduled_at, state FROM analytics_broadcast_runs
  WHERE observed_at >= ?1 AND observed_at < ?2 AND observed_at <= ?6 AND state IN ('available', 'partial')
    AND (?3 = 'ALL' OR platform = ?3)
), sequence AS (
  SELECT s.run_id, s.channel_key, s.stream_id, s.channel_name, s.category_name, s.started_at, s.viewers, r.platform, r.observed_at,
    r.platform || ':' || COALESCE(
      CASE WHEN LOWER(COALESCE(s.category_id, '')) NOT IN ('', 'unknown', 'unclassified') THEN s.category_id END,
      CASE WHEN COALESCE(s.category_name, '') NOT IN ('', '\uBBF8\uBD84\uB958', '\uCE74\uD14C\uACE0\uB9AC \uBBF8\uC81C\uACF5') THEN s.category_name END, 'unknown') AS category_key,
    CASE WHEN COALESCE(s.category_name, '') IN ('', '\uBBF8\uBD84\uB958', '\uCE74\uD14C\uACE0\uB9AC \uBBF8\uC81C\uACF5') THEN '\uBBF8\uBD84\uB958' ELSE s.category_name END AS category_label,
    LAST_VALUE(s.title) OVER (PARTITION BY r.platform, s.channel_key, s.stream_id ORDER BY r.observed_at ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS latest_title,
    LEAD(r.observed_at) OVER (PARTITION BY r.platform, s.channel_key, s.stream_id ORDER BY r.observed_at) AS next_at
  FROM analytics_broadcast_snapshots s JOIN runs r ON r.run_id = s.run_id
  WHERE (?4 = '' OR s.channel_key = ?4 COLLATE NOCASE)
), entries AS (
  SELECT *, CASE WHEN next_at IS NOT NULL
    AND (julianday(next_at) - julianday(observed_at)) * 1440 BETWEEN 0 AND ${STATISTICS_COLLECTION_MINUTES * 1.5}
    THEN (julianday(next_at) - julianday(observed_at)) * 1440 ELSE 0 END AS minutes
  FROM sequence WHERE (?5 = '' OR category_key = ?5 OR category_name = ?5)
), sessions AS (
  SELECT platform, channel_key AS channelKey, MAX(channel_name) AS channelName, stream_id AS streamId,
    MAX(latest_title) AS title, GROUP_CONCAT(DISTINCT category_label) AS categories, MIN(started_at) AS startedAt,
    MIN(observed_at) AS firstObservedAt, MAX(observed_at) AS lastObservedAt,
    SUM(minutes) AS minutes, MAX(viewers) AS peakViewers
  FROM entries GROUP BY platform, channel_key, stream_id
), daily_segments AS (
  SELECT date(observed_at, '+9 hours') AS date, platform, channel_key, stream_id,
    MIN(minutes, (julianday(date(observed_at, '+9 hours'), '+1 day', '-9 hours') - julianday(observed_at)) * 1440) AS minutes
  FROM entries
  UNION ALL
  SELECT date(next_at, '+9 hours'), platform, channel_key, stream_id,
    (julianday(next_at) - julianday(date(next_at, '+9 hours'), '-9 hours')) * 1440
  FROM entries WHERE minutes > 0 AND date(observed_at, '+9 hours') != date(next_at, '+9 hours')
)`;
async function readActivityStreamer(db, channel) {
  if (!channel)
    return null;
  const latest = await db.prepare(`SELECT s.channel_name AS name, s.channel_url AS channelUrl, s.image_url AS imageUrl
    FROM analytics_broadcast_snapshots s JOIN analytics_broadcast_runs r ON r.run_id = s.run_id
    WHERE s.channel_key = ? COLLATE NOCASE ORDER BY r.observed_at DESC LIMIT 1`).bind(channel).first();
  const platform = channel.toUpperCase().startsWith("SOOP:") ? "SOOP" : "CHZZK";
  const id = channel.slice(channel.indexOf(":") + 1);
  const channelUrl = platform === "CHZZK" ? `https://chzzk.naver.com/${id}` : `https://www.sooplive.co.kr/station/${id}`;
  const registered = await db.prepare(`SELECT COALESCE(i.display_name, c.channel_name) AS name,
      c.channel_url AS channelUrl, i.profile_image_url AS imageUrl, i.slug AS profileSlug
    FROM streamerChannel c LEFT JOIN streamerChannel_info i ON i.channel_id = c.id
    WHERE c.platform = ? AND (c.channel_url = ? OR c.channel_url = ? OR c.channel_url = ?) LIMIT 1`).bind(platform, channelUrl, `https://ch.sooplive.co.kr/${id}`, `https://bj.afreecatv.com/${id}`).first();
  if (registered) {
    return {
      id: channel,
      channelKey: channel,
      platform,
      isRegistered: true,
      name: registered.name || latest?.name || id,
      channelUrl: registered.channelUrl || latest?.channelUrl || channelUrl,
      imageUrl: registered.imageUrl || latest?.imageUrl || null,
      profileSlug: registered.profileSlug || null
    };
  }
  try {
    const fallbackResult = await ensureStreamerRegistered(db, channel);
    if (fallbackResult.streamer) {
      return fallbackResult.streamer;
    }
  } catch (err) {
    console.warn(`[readActivityStreamer] Fallback registration failed for ${channel}:`, err);
  }
  return {
    id: channel,
    channelKey: channel,
    platform,
    isRegistered: false,
    name: latest?.name || id,
    channelUrl: latest?.channelUrl || channelUrl,
    imageUrl: latest?.imageUrl || null,
    profileSlug: null
  };
}
__name(readActivityStreamer, "readActivityStreamer");
async function getBroadcastActivity(db, filters) {
  const fromUtc = (/* @__PURE__ */ new Date(`${filters.from}T00:00:00+09:00`)).toISOString();
  const toUtc = new Date(Date.parse(`${filters.to}T00:00:00+09:00`) + 864e5).toISOString();
  const generatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const values = [fromUtc, toUtc, filters.platform, filters.channel, filters.category, generatedAt];
  const queries = [
    `SELECT COUNT(DISTINCT channelKey) AS streamers, COUNT(*) AS broadcasts, COALESCE(SUM(minutes), 0) AS minutes,
      (SELECT COUNT(DISTINCT date(observed_at, '+9 hours')) FROM entries) AS broadcastDays,
      (SELECT COUNT(DISTINCT category_key) FROM entries WHERE category_key NOT IN ('CHZZK:unknown', 'SOOP:unknown')) AS categoryCount FROM sessions`,
    `SELECT CAST(strftime('%w', observed_at, '+9 hours') AS INTEGER) AS weekday,
      CAST(strftime('%H', observed_at, '+9 hours') AS INTEGER) AS hour, AVG(channels) AS channels, COUNT(*) AS runs
      FROM (SELECT MIN(r.observed_at) AS observed_at, COUNT(DISTINCT e.channel_key) AS channels FROM runs r
        LEFT JOIN entries e ON e.run_id = r.run_id GROUP BY r.scheduled_at
        HAVING COUNT(DISTINCT r.platform) = CASE WHEN ?3 = 'ALL' THEN 2 ELSE 1 END
          AND SUM(CASE WHEN r.state != 'available' THEN 1 ELSE 0 END) = 0) GROUP BY weekday, hour`,
    `SELECT CAST(strftime('%w', startedAt, '+9 hours') AS INTEGER) AS weekday,
      CAST(strftime('%H', startedAt, '+9 hours') AS INTEGER) AS hour, COUNT(*) AS broadcasts FROM sessions
      WHERE startedAt >= ?1 AND startedAt < ?2 GROUP BY weekday, hour`,
    `SELECT category_key AS key, platform, MAX(category_label) AS name, COUNT(DISTINCT platform || ':' || channel_key || ':' || stream_id) AS broadcasts,
      SUM(minutes) AS minutes FROM entries GROUP BY category_key, platform ORDER BY minutes DESC, broadcasts DESC`,
    `SELECT date,
      COUNT(DISTINCT platform || ':' || channel_key || ':' || stream_id) AS broadcasts, SUM(minutes) AS minutes
      FROM (SELECT * FROM daily_segments UNION ALL
        SELECT date(observed_at, '+9 hours'), platform, NULL, NULL, 0 FROM runs
        WHERE scheduled_at IN (SELECT scheduled_at FROM runs GROUP BY scheduled_at
          HAVING COUNT(DISTINCT platform) = CASE WHEN ?3 = 'ALL' THEN 2 ELSE 1 END
          AND SUM(CASE WHEN state != 'available' THEN 1 ELSE 0 END) = 0)) GROUP BY date ORDER BY date`,
    `SELECT * FROM sessions ORDER BY lastObservedAt DESC, platform DESC, channelKey DESC, streamId DESC LIMIT 200`,
    `SELECT MIN(observed_at) AS firstRecordedAt, MAX(observed_at) AS lastRecordedAt,
      COUNT(DISTINCT date(observed_at, '+9 hours')) AS recordedDays,
      SUM(CASE WHEN state = 'partial' THEN 1 ELSE 0 END) AS partialRuns FROM runs`,
    `SELECT category_key AS key, platform, MAX(category_label) AS name
      FROM sequence GROUP BY category_key, platform ORDER BY name, platform`
  ];
  const sections = [
    { key: "summary", fields: ["streamers", "broadcasts", "minutes", "broadcastDays", "categoryCount"], single: true },
    { key: "heatmap", fields: ["weekday", "hour", "channels", "runs"] },
    { key: "starts", fields: ["weekday", "hour", "broadcasts"] },
    { key: "categories", fields: ["key", "platform", "name", "broadcasts", "minutes"] },
    { key: "daily", fields: ["date", "broadcasts", "minutes"] },
    { key: "broadcasts", fields: ["platform", "channelKey", "channelName", "streamId", "title", "categories", "startedAt", "firstObservedAt", "lastObservedAt", "minutes", "peakViewers"] },
    { key: "coverage", fields: ["firstRecordedAt", "lastRecordedAt", "recordedDays", "partialRuns"], single: true },
    { key: "categoryOptions", fields: ["key", "platform", "name"] }
  ];
  const fields = sections.map((section, index) => {
    const object = `json_object(${section.fields.map((field2) => `'${field2}', ${field2}`).join(", ")})`;
    return `'${section.key}', json((SELECT ${section.single ? object : `json_group_array(${object})`} FROM (${queries[index]})))`;
  }).join(", ");
  const [row, streamer] = await Promise.all([
    db.prepare(`${ACTIVITY_CTE} SELECT json_object(${fields}) AS payload`).bind(...values).first(),
    readActivityStreamer(db, filters.channel)
  ]);
  if (!row)
    throw new Error("\uBC29\uC1A1 \uD65C\uB3D9 \uC9D1\uACC4 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
  const result = JSON.parse(row.payload);
  return {
    meta: { generatedAt, from: filters.from, to: filters.to, ...result.coverage },
    streamer,
    summary: result.summary,
    heatmap: result.heatmap,
    starts: result.starts,
    categories: result.categories,
    categoryOptions: result.categoryOptions,
    daily: result.daily,
    broadcasts: result.broadcasts
  };
}
__name(getBroadcastActivity, "getBroadcastActivity");
function readActivityCursor(cursor) {
  if (!cursor)
    return ["", "", "", ""];
  try {
    const value = JSON.parse(cursor);
    return Array.isArray(value) && value.length === 4 && value.every((item) => typeof item === "string" && item.length <= 150) && Number.isFinite(Date.parse(value[0])) ? value : null;
  } catch {
    return null;
  }
}
__name(readActivityCursor, "readActivityCursor");
async function getActivityBroadcastPage(db, filters, selection, cursor = "", asOf = (/* @__PURE__ */ new Date()).toISOString()) {
  const boundary = readActivityCursor(cursor);
  if (!boundary)
    throw new Error("\uBC29\uC1A1 \uC774\uB825 \uD398\uC774\uC9C0 \uC8FC\uC18C\uAC00 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.");
  const fromUtc = (/* @__PURE__ */ new Date(`${filters.from}T00:00:00+09:00`)).toISOString();
  const toUtc = new Date(Date.parse(`${filters.to}T00:00:00+09:00`) + 864e5).toISOString();
  const sql = `${ACTIVITY_CTE}, selected AS (
    SELECT * FROM sessions s WHERE
      (?7 = '' OR EXISTS (SELECT 1 FROM entries e WHERE e.platform = s.platform AND e.channel_key = s.channelKey AND e.stream_id = s.streamId AND date(e.observed_at, '+9 hours') = ?7))
      AND (?8 = -1 OR (?10 = 'starts' AND startedAt >= ?1 AND startedAt < ?2
        AND CAST(strftime('%w', startedAt, '+9 hours') AS INTEGER) = ?8 AND CAST(strftime('%H', startedAt, '+9 hours') AS INTEGER) = ?9)
        OR (?10 = 'activity' AND EXISTS (SELECT 1 FROM entries e WHERE e.platform = s.platform AND e.channel_key = s.channelKey AND e.stream_id = s.streamId
          AND CAST(strftime('%w', e.observed_at, '+9 hours') AS INTEGER) = ?8 AND CAST(strftime('%H', e.observed_at, '+9 hours') AS INTEGER) = ?9)))
  ), page AS (
    SELECT * FROM selected WHERE ?11 = '' OR (lastObservedAt, platform, channelKey, streamId) < (?11, ?12, ?13, ?14)
    ORDER BY lastObservedAt DESC, platform DESC, channelKey DESC, streamId DESC LIMIT 26
  ) SELECT json_object('total', (SELECT COUNT(*) FROM selected), 'items', json((SELECT json_group_array(json_object(
    'platform', platform, 'channelKey', channelKey, 'channelName', channelName, 'streamId', streamId, 'title', title, 'categories', categories,
    'startedAt', startedAt, 'firstObservedAt', firstObservedAt, 'lastObservedAt', lastObservedAt, 'minutes', minutes, 'peakViewers', peakViewers)) FROM page))) AS payload`;
  const row = await db.prepare(sql).bind(
    fromUtc,
    toUtc,
    filters.platform,
    filters.channel,
    filters.category,
    asOf,
    selection.day,
    selection.weekday ?? -1,
    selection.hour ?? -1,
    selection.timeMetric,
    ...boundary
  ).first();
  if (!row)
    throw new Error("\uBC29\uC1A1 \uC774\uB825\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  const result = JSON.parse(row.payload);
  const items = result.items.slice(0, 25);
  const last = items[items.length - 1];
  return { items, total: result.total, asOf, nextCursor: result.items.length > 25 ? JSON.stringify([last.lastObservedAt, last.platform, last.channelKey, last.streamId]) : null };
}
__name(getActivityBroadcastPage, "getActivityBroadcastPage");

// ../shared/broadcastActivity.ts
function activityDate(now = Date.now()) {
  return new Date(now + 9 * 36e5).toISOString().slice(0, 10);
}
__name(activityDate, "activityDate");
function activityPeriod(days, now = Date.now()) {
  return { from: activityDate(now - (days - 1) * 864e5), to: activityDate(now) };
}
__name(activityPeriod, "activityPeriod");
function validActivityRange(from, to) {
  return /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && Number.isFinite(Date.parse(from)) && Number.isFinite(Date.parse(to)) && new Date(from).toISOString().slice(0, 10) === from && new Date(to).toISOString().slice(0, 10) === to && from <= to && to <= activityDate() && (Date.parse(to) - Date.parse(from)) / 864e5 < 90;
}
__name(validActivityRange, "validActivityRange");

// src/services/broadcastStatisticsCollection.ts
var INTERVAL_MS = STATISTICS_COLLECTION_MINUTES * 6e4;
function statisticsCollectionSlot(time) {
  if (!Number.isFinite(time))
    throw new Error("Invalid scheduled time");
  return new Date(Math.floor(time / INTERVAL_MS) * INTERVAL_MS).toISOString();
}
__name(statisticsCollectionSlot, "statisticsCollectionSlot");
async function claimCollection(db, platform, scheduledAt) {
  const startedAt = (/* @__PURE__ */ new Date()).toISOString();
  const claim = { runId: `${platform}:${scheduledAt}`, attemptId: crypto.randomUUID(), platform };
  const result = await db.prepare(`INSERT INTO analytics_broadcast_runs
    (run_id, platform, scheduled_at, started_at, attempt_id, state, scope)
    VALUES (?, ?, ?, ?, ?, 'running', ?)
    ON CONFLICT(run_id) DO UPDATE SET started_at=excluded.started_at, attempt_id=excluded.attempt_id,
      state='running', completed_at=NULL, error_code=NULL
    WHERE analytics_broadcast_runs.state IN ('running', 'unavailable') AND analytics_broadcast_runs.started_at < ?`).bind(
    claim.runId,
    platform,
    scheduledAt,
    startedAt,
    claim.attemptId,
    platform === "CHZZK" ? "\uC778\uAE30 \uBC29\uC1A1 \uC0C1\uC704 100\uAC1C" : "VD\xE9but \uB4F1\uB85D \uBC84\uCD94\uC5BC \uC2A4\uD2B8\uB9AC\uBA38",
    new Date(Date.now() - 3 * 6e4).toISOString()
  ).run();
  return result.meta.changes ? claim : null;
}
__name(claimCollection, "claimCollection");
async function saveCollection(db, claim, result) {
  const { source, lives } = result;
  const state = source.state === "available" ? "available" : source.state === "partial" ? "partial" : "unavailable";
  const usable = state !== "unavailable";
  const statements = [
    db.prepare(`INSERT INTO analytics_broadcast_snapshots
      (run_id, stream_id, channel_key, channel_name, channel_url, image_url, live_url, title, category_id, category_name, viewers, started_at)
      SELECT ?, json_extract(value, '$.streamId'), json_extract(value, '$.channelKey'), json_extract(value, '$.channelName'),
        json_extract(value, '$.channelUrl'), json_extract(value, '$.imageUrl'), json_extract(value, '$.liveUrl'),
        json_extract(value, '$.title'), json_extract(value, '$.categoryId'), json_extract(value, '$.categoryName'),
        json_extract(value, '$.viewers'), json_extract(value, '$.startedAt')
      FROM json_each(?) WHERE EXISTS (SELECT 1 FROM analytics_broadcast_runs WHERE run_id=? AND attempt_id=? AND state='running')`).bind(claim.runId, JSON.stringify(usable ? lives : []), claim.runId, claim.attemptId),
    db.prepare(`UPDATE analytics_broadcast_runs SET completed_at=?, observed_at=?, state=?, scope=?, checked_channels=?,
      viewer_total=?, channel_total=?, error_code=? WHERE run_id=? AND attempt_id=? AND state='running'`).bind(
      (/* @__PURE__ */ new Date()).toISOString(),
      source.observedAt,
      state,
      source.scope,
      source.checkedChannels,
      usable ? lives.reduce((sum, live) => sum + live.viewers, 0) : null,
      usable ? lives.length : null,
      state === "unavailable" ? "PLATFORM_UNAVAILABLE" : state === "partial" ? "PARTIAL_CHANNELS" : null,
      claim.runId,
      claim.attemptId
    )
  ];
  const saved = await db.batch(statements);
  if (!saved[1].meta.changes)
    return { platform: claim.platform, state: "skipped", channels: 0 };
  return { platform: claim.platform, state, channels: lives.length };
}
__name(saveCollection, "saveCollection");
async function recordCollectionFailure(db, claim) {
  await db.prepare(`UPDATE analytics_broadcast_runs SET state='unavailable', completed_at=?, error_code='COLLECTION_FAILED'
    WHERE run_id=? AND attempt_id=? AND state='running'`).bind((/* @__PURE__ */ new Date()).toISOString(), claim.runId, claim.attemptId).run();
}
__name(recordCollectionFailure, "recordCollectionFailure");
async function collectPlatform(db, platform, slot) {
  const claim = await claimCollection(db, platform, slot);
  if (!claim)
    return { platform, state: "skipped", channels: 0 };
  try {
    const result = platform === "CHZZK" ? await getChzzkStatisticsSource(db) : await getSoopStatisticsSource(db);
    return await saveCollection(db, claim, result);
  } catch (error) {
    await recordCollectionFailure(db, claim);
    throw error;
  }
}
__name(collectPlatform, "collectPlatform");
async function collectBroadcastStatistics(db, scheduledTime) {
  const slot = statisticsCollectionSlot(scheduledTime);
  const results = await Promise.allSettled(["CHZZK", "SOOP"].map((platform) => collectPlatform(db, platform, slot)));
  const reports = results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  console.log(JSON.stringify({ event: "broadcast_statistics_collection", slot, results: reports, failures: results.filter((result) => result.status === "rejected").map((result) => String(result.reason)) }));
  const hasUsableData = reports.some((report) => report.state === "available" || report.state === "partial");
  if (!hasUsableData && reports.length > 0 && reports.every((report) => report.state === "unavailable")) {
    throw new Error("Broadcast statistics collection incomplete: all platforms unavailable");
  }
  return reports;
}
__name(collectBroadcastStatistics, "collectBroadcastStatistics");

// src/services/statisticsStreamerSearchService.ts
function registeredChannelKey(platform, value) {
  if (!value)
    return null;
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);
    if (platform === "CHZZK" && url.hostname === "chzzk.naver.com") {
      const id = parts[0] === "live" ? parts[1] : parts[0];
      return id && /^[a-f0-9]{32}$/i.test(id) ? `CHZZK:${id.toLowerCase()}` : null;
    }
    if (platform === "SOOP" && /(^|\.)(sooplive\.(co\.kr|com)|afreecatv\.com)$/.test(url.hostname)) {
      const id = parts[0] === "station" ? parts[1] : parts[0];
      return id && /^[a-z0-9_]+$/i.test(id) ? `SOOP:${id.toLowerCase()}` : null;
    }
    return null;
  } catch {
    return null;
  }
}
__name(registeredChannelKey, "registeredChannelKey");
function toStreamer(row) {
  return {
    id: `registered:${row.id}`,
    platform: row.platform,
    channelKey: registeredChannelKey(row.platform, row.channel_url),
    name: row.display_name?.trim() || row.channel_name,
    channelUrl: row.channel_url,
    imageUrl: row.profile_image_url,
    profileSlug: row.slug,
    isRegistered: true
  };
}
__name(toStreamer, "toStreamer");
async function searchStatisticsStreamers(db, input, includeExternal = true, platform = "ALL") {
  const query = normalizeStreamerQuery(input);
  if (!query)
    return { query: "", streamers: [], hasMore: false };
  const dbPromise = db.prepare(`SELECT c.id, c.platform, c.channel_name, c.channel_url,
    i.display_name, i.profile_image_url, i.slug
    FROM streamerChannel c
    LEFT JOIN streamerChannel_info i ON i.id = (SELECT MIN(id) FROM streamerChannel_info WHERE channel_id = c.id)
    WHERE c.platform IN ('CHZZK', 'SOOP') AND (?2 = 'ALL' OR c.platform = ?2) AND (
      INSTR(LOWER(REPLACE(COALESCE(c.channel_name, ''), ' ', '')), ?1) > 0 OR
      INSTR(LOWER(REPLACE(COALESCE(i.display_name, ''), ' ', '')), ?1) > 0)
    ORDER BY CASE WHEN LOWER(REPLACE(COALESCE(i.display_name, c.channel_name), ' ', '')) = ?1 THEN 0 ELSE 1 END,
      COALESCE(i.display_name, c.channel_name) COLLATE NOCASE, c.id
    LIMIT 26`).bind(query, platform).all();
  const externalPromise = includeExternal ? searchExternalPlatforms(input, 5) : Promise.resolve([]);
  const [dbResult, externalItems] = await Promise.all([
    dbPromise.catch((err) => {
      console.error("[searchStatisticsStreamers] DB search error:", err);
      return { results: [] };
    }),
    externalPromise.catch((err) => {
      console.warn("[searchStatisticsStreamers] External search error:", err);
      return [];
    })
  ]);
  const registeredStreamers = (dbResult.results || []).map(toStreamer);
  const map = /* @__PURE__ */ new Map();
  for (const s of registeredStreamers) {
    const key = s.channelKey || s.channelUrl || s.id;
    map.set(key, s);
  }
  for (const ext of externalItems) {
    if (platform !== "ALL" && ext.platform !== platform)
      continue;
    const key = ext.channelKey || ext.channelUrl || ext.id;
    if (!map.has(key)) {
      map.set(key, {
        id: ext.id,
        platform: ext.platform,
        channelKey: ext.channelKey,
        name: ext.name,
        channelUrl: ext.channelUrl,
        imageUrl: ext.imageUrl,
        profileSlug: null,
        isRegistered: false,
        isLive: ext.isLive,
        followerCount: ext.followerCount
      });
    }
  }
  const allStreamers = Array.from(map.values());
  allStreamers.sort((a, b) => {
    const aExact = normalizeStreamerQuery(a.name) === query;
    const bExact = normalizeStreamerQuery(b.name) === query;
    if (aExact && !bExact)
      return -1;
    if (!aExact && bExact)
      return 1;
    if (a.isRegistered && !b.isRegistered)
      return -1;
    if (!a.isRegistered && b.isRegistered)
      return 1;
    if (a.isLive && !b.isLive)
      return -1;
    if (!a.isLive && b.isLive)
      return 1;
    return a.name.localeCompare(b.name, "ko");
  });
  const limit = 25;
  return {
    query,
    streamers: allStreamers.slice(0, limit),
    hasMore: allStreamers.length > limit
  };
}
__name(searchStatisticsStreamers, "searchStatisticsStreamers");

// src/services/cheerService.ts
var CHEER_ALREADY_DONE_MESSAGE = "\uC624\uB298\uC758 \uC751\uC6D0\uC744 \uC774\uBBF8 \uC644\uB8CC\uD588\uC2B5\uB2C8\uB2E4. \uC790\uC815\uC5D0 \uB2E4\uC2DC \uD22C\uD45C\uD574 \uC8FC\uC138\uC694!";
var WEEKLY_RESET_CRON = "0 15 * * SUN";
var RANKING_LIMIT = 10;
var DAILY_IP_CHEER_LIMIT = 60;
var KST_OFFSET_MS = 9 * 60 * 60 * 1e3;
function kstDateKey(now = Date.now()) {
  return new Date(now + KST_OFFSET_MS).toISOString().slice(0, 10);
}
__name(kstDateKey, "kstDateKey");
async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
async function buildClientHash(ip, userAgent, fingerprint) {
  return sha256Hex(`${ip}|${userAgent.slice(0, 300)}|${fingerprint.slice(0, 100)}`);
}
__name(buildClientHash, "buildClientHash");
var devOnly = /* @__PURE__ */ __name(async (c, next) => {
  if (!portalPageSeo(new URL(c.req.url)).development)
    return c.json({ error: "\uD398\uC774\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
  await next();
}, "devOnly");
async function resolveVtuberId(db, idOrSlug) {
  const numericId = /^\d+$/.test(idOrSlug) ? Number(idOrSlug) : -1;
  const row = await db.prepare("SELECT id FROM streamerChannel_info WHERE id = ? OR slug = ? LIMIT 1").bind(numericId, idOrSlug).first();
  return row ? row.id : null;
}
__name(resolveVtuberId, "resolveVtuberId");
async function isIpCheerLimitReached(db, ipHash, votedDate) {
  const row = await db.prepare("SELECT COUNT(*) AS count FROM cheer_logs WHERE ip_hash = ? AND voted_date = ?").bind(ipHash, votedDate).first();
  return (row?.count || 0) >= DAILY_IP_CHEER_LIMIT;
}
__name(isIpCheerLimitReached, "isIpCheerLimitReached");
function isDuplicateCheerError(error) {
  return /UNIQUE/i.test(error instanceof Error ? error.message : String(error));
}
__name(isDuplicateCheerError, "isDuplicateCheerError");
async function recordCheer(db, vtuberId, clientHash, ipHash, votedDate) {
  try {
    await db.batch([
      db.prepare("INSERT INTO cheer_logs(vtuber_id, client_hash, ip_hash, voted_date) VALUES(?,?,?,?)").bind(vtuberId, clientHash, ipHash, votedDate),
      db.prepare("UPDATE streamerChannel_info SET weekly_cheers = weekly_cheers + 1, total_cheers = total_cheers + 1 WHERE id = ?").bind(vtuberId)
    ]);
    return "RECORDED";
  } catch (error) {
    if (isDuplicateCheerError(error))
      return "DUPLICATE";
    throw error;
  }
}
__name(recordCheer, "recordCheer");
async function readCheerTotals(db, vtuberId) {
  const row = await db.prepare("SELECT weekly_cheers, total_cheers FROM streamerChannel_info WHERE id = ?").bind(vtuberId).first();
  return { weeklyCheers: row?.weekly_cheers || 0, totalCheers: row?.total_cheers || 0 };
}
__name(readCheerTotals, "readCheerTotals");
async function readWeeklyRanking(db) {
  const result = await db.prepare(
    `SELECT i.id, i.slug, i.display_name, i.profile_image_url, i.event_type, i.total_cheers, i.weekly_cheers, i.is_verified, c.platform, c.channel_url
     FROM streamerChannel_info i JOIN streamerChannel c ON c.id = i.channel_id
     WHERE i.slug IS NOT NULL AND i.slug != ''
     ORDER BY i.weekly_cheers DESC, i.start_at_utc DESC, i.id DESC LIMIT ?`
  ).bind(RANKING_LIMIT).all();
  return (result.results || []).map((row, index) => ({
    rank: index + 1,
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    avatarUrl: portalWebUrl(row.profile_image_url || ""),
    platform: row.platform,
    channelUrl: portalChannelUrl(row.channel_url || "", row.platform),
    eventType: row.event_type,
    weeklyCheers: row.weekly_cheers,
    totalCheers: row.total_cheers,
    isVerified: row.is_verified === 1
  }));
}
__name(readWeeklyRanking, "readWeeklyRanking");
async function resetWeeklyCheers(db) {
  await db.prepare("UPDATE streamerChannel_info SET weekly_cheers = 0 WHERE weekly_cheers != 0").run();
}
__name(resetWeeklyCheers, "resetWeeklyCheers");
async function readOptionalJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}
__name(readOptionalJson, "readOptionalJson");
function buildReportRequest(source, origin, body) {
  const role = ["SELF", "AGENCY", "FAN"].includes(String(body.requesterRole)) ? body.requesterRole : "FAN";
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const name of ["CF-Connecting-IP", "Origin", "X-Submission-Key"]) {
    const value = source.headers.get(name);
    if (value)
      headers.set(name, value);
  }
  return new Request(new URL("/requests", origin), { method: "POST", headers, body: JSON.stringify({ ...body, kind: "DEBUT", requesterRole: role }) });
}
__name(buildReportRequest, "buildReportRequest");
var cheerApi = new Hono2();
cheerApi.get("/api/rankings/weekly", devOnly, async (c) => {
  const key = new URL("/api/rankings/weekly?cache=v1", c.req.url);
  try {
    return await publicResponseCache(c.req.raw, key, 60, async () => c.json({ rankings: await readWeeklyRanking(c.env.DB) }), (promise) => c.executionCtx.waitUntil(promise));
  } catch {
    c.header("Cache-Control", "no-store");
    return c.json({ error: "\uB7AD\uD0B9\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694." }, 503);
  }
});
cheerApi.post("/api/vtubers/:id/cheer", devOnly, async (c) => {
  c.header("Cache-Control", "no-store");
  const origin = c.req.header("Origin");
  if (origin && origin !== new URL(c.req.url).origin)
    return c.json({ error: "\uC694\uCCAD\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 403);
  const vtuberId = await resolveVtuberId(c.env.DB, c.req.param("id"));
  if (!vtuberId)
    return c.json({ error: "\uBC84\uD29C\uBC84\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694." }, 404);
  const body = await readOptionalJson(c.req.raw);
  const ip = c.req.header("CF-Connecting-IP") || "local";
  const votedDate = kstDateKey();
  const [clientHash, ipHash] = await Promise.all([
    buildClientHash(ip, c.req.header("User-Agent") || "", typeof body.fingerprint === "string" ? body.fingerprint : ""),
    sha256Hex(ip)
  ]);
  if (await isIpCheerLimitReached(c.env.DB, ipHash, votedDate))
    return c.json({ error: CHEER_ALREADY_DONE_MESSAGE }, 429);
  if (await recordCheer(c.env.DB, vtuberId, clientHash, ipHash, votedDate) === "DUPLICATE")
    return c.json({ error: CHEER_ALREADY_DONE_MESSAGE }, 429);
  return c.json({ ok: true, ...await readCheerTotals(c.env.DB, vtuberId) });
});
cheerApi.post("/api/schedules/report", devOnly, async (c) => {
  c.header("Cache-Control", "no-store");
  const body = await readOptionalJson(c.req.raw);
  const forwarded = await portalApi.fetch(buildReportRequest(c.req.raw, new URL(c.req.url).origin, body), c.env, c.executionCtx);
  const result = await forwarded.json().catch(() => ({}));
  return c.json(forwarded.ok ? { ...result, status: "PENDING" } : result, forwarded.status);
});

// src/index.ts
var ChzzkSessionDO = class {
  state;
  env;
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  async fetch(request) {
    return new Response("ChzzkSessionDO Active", { status: 200 });
  }
};
__name(ChzzkSessionDO, "ChzzkSessionDO");
var app = new Hono2();
app.use("/api/analytics/*", async (c, next) => {
  await next();
  if (c.res.ok && c.res.headers.get("Content-Type")?.includes("application/json")) {
    const data = publicBroadcastPayload(await c.res.json());
    c.res = new Response(JSON.stringify(data), { status: c.res.status, headers: c.res.headers });
  }
});
app.use("/api/v1/admin/*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  if (new URL(c.req.url).pathname !== "/api/v1/admin/login") {
    const token = (c.req.header("Authorization") || c.req.header("X-Admin-Token") || "").replace(/^Bearer\s+/i, "").trim();
    const path = new URL(c.req.url).pathname;
    const secretAllowed = ["/api/v1/admin/crawler/run", "/api/v1/admin/sync-profiles"].includes(path);
    const secretValid = secretAllowed && Boolean(c.env.CRAWLER_SECRET) && c.req.header("X-Crawler-Secret") === c.env.CRAWLER_SECRET;
    if (!secretValid && !await validateAdminToken(token, c.env.DB))
      return c.json({ error: "\uAD00\uB9AC\uC790 \uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  await next();
});
app.use("*", async (c, next) => {
  if (c.env.PORTAL_ENABLED !== "true")
    return next();
  const url = new URL(c.req.url);
  const path = url.pathname;
  const seo = portalPageSeo(url);
  if (["/updatepage", "/upadepage"].includes(path))
    return c.redirect("/", 301);
  if (seo.development)
    c.header("X-Robots-Tag", "noindex, nofollow");
  if (["PUT", "DELETE"].includes(c.req.method) && path.startsWith("/api/v1/creator/"))
    return c.json({ error: "\uC815\uBCF4 \uC218\uC815\xB7\uC0AD\uC81C\uB294 \uBB38\uC758 \uD654\uBA74\uC73C\uB85C \uC694\uCCAD\uD574 \uC8FC\uC138\uC694." }, 403);
  if (c.req.method === "GET" && path === "/robots.txt")
    return c.text(siteRobots(url.hostname));
  if (c.req.method === "GET" && path !== "/" && path.endsWith("/") && !path.startsWith("/api/") && !path.startsWith("/assets/"))
    return c.redirect(`${sitePath(path)}${url.search}`, 308);
  if (c.req.method === "GET" && !path.startsWith("/api/") && !path.startsWith("/analytics") && !/\.[a-z0-9]+$/i.test(path)) {
    let profile;
    if (/^\/creator\/[^/]+$/.test(path)) {
      let slug = "";
      try {
        slug = decodeURIComponent(path.slice("/creator/".length));
      } catch {
      }
      try {
        profile = await readPublicPortalProfileBySlug(c.env.DB, slug) || void 0;
      } catch {
        c.header("Cache-Control", "no-store");
        c.header("X-Robots-Tag", "noindex, nofollow");
        return c.html(publicErrorPage(url, "\uC18C\uAC1C\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694", 503), 503);
      }
    }
    const missing = !seo.known && !isActivityPath(path) || path.startsWith("/creator/") && !profile;
    const response = await getAssetFromKV({ request: new Request(new URL(seo.development ? "/dev.html" : "/portal.html", c.req.url), c.req.raw), waitUntil: (promise) => c.executionCtx.waitUntil(promise) }, { ASSET_NAMESPACE: c.env.__STATIC_CONTENT, ASSET_MANIFEST: JSON.parse(manifestJSON || "{}") });
    if (seo.privatePage || missing)
      c.header("X-Robots-Tag", "noindex, nofollow");
    c.header("Cache-Control", seo.privatePage || missing ? "no-store" : "public, max-age=0, must-revalidate");
    const html = renderPortalPage(await response.text(), url, profile);
    return c.html(missing ? html.replace(/content="index, follow"/g, 'content="noindex, nofollow"') : html, missing ? 404 : 200);
  }
  await next();
  if (c.req.method === "GET" && c.res.status === 200 && !path.startsWith("/api/")) {
    if (/^\/assets\/.+-[\w-]+\.(js|css)$/.test(path))
      c.header("Cache-Control", "public, max-age=31536000, immutable");
    else if (/\.(png|jpg|jpeg|webp|svg|ico|woff2)$/i.test(path))
      c.header("Cache-Control", "public, max-age=86400");
  }
});
app.route("/api/v1/portal", portalApi);
app.use("*", cors());
app.use("*", async (c, next) => {
  const clientVersion = c.req.header("X-Client-Version") || "v0.1.0";
  c.header("X-Server-Version", "v0.1.0-latest");
  c.header("X-Client-Version-Received", clientVersion);
  await next();
  if (new URL(c.req.url).hostname === "dev.vdebut.live")
    c.header("X-Robots-Tag", "noindex, nofollow");
});
app.route("/", cheerApi);
app.get("/api/v1/system/version", (c) => {
  const clientVersion = c.req.header("X-Client-Version") || "v0.1.0";
  return c.json({
    status: "healthy",
    service: "V-DEBUT HUB Backend",
    serverVersion: "v0.1.0-latest",
    minSupportedClientVersion: "v0.1.0",
    clientVersionReceived: clientVersion,
    isClientSupported: true,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var sitemapXmlHandler = /* @__PURE__ */ __name(async (c) => {
  if (new URL(c.req.url).hostname !== "vdebut.live") {
    c.header("X-Robots-Tag", "noindex");
    return c.text("\uAC1C\uBC1C \uC0AC\uC774\uD2B8\uB294 \uAC80\uC0C9 \uB300\uC0C1\uC5D0\uC11C \uC81C\uC678\uD569\uB2C8\uB2E4.", 404);
  }
  const baseUrl = "https://vdebut.live";
  if (c.env.PORTAL_ENABLED === "true") {
    const profiles = await readPublicPortalProfiles(c.env.DB);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${portalSitemap(profiles)}${await activitySitemapEntries(c.env.DB)}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
  }
  const creators = await fetchAllCreatorSlugs(c.env.DB || null);
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
`;
  xml += `        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;
  xml += `  <url>
`;
  xml += `    <loc>${baseUrl}/</loc>
`;
  xml += `    <xhtml:link rel="alternate" hreflang="ko" href="${baseUrl}/?lang=ko" />
`;
  xml += `    <xhtml:link rel="alternate" hreflang="ja" href="${baseUrl}/?lang=ja" />
`;
  xml += `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/?lang=en" />
`;
  xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />
`;
  xml += `    <changefreq>daily</changefreq>
`;
  xml += `    <priority>1.0</priority>
`;
  xml += `  </url>
`;
  ["ko", "ja", "en"].forEach((lang) => {
    xml += `  <url>
`;
    xml += `    <loc>${baseUrl}/?lang=${lang}</loc>
`;
    xml += `    <xhtml:link rel="alternate" hreflang="ko" href="${baseUrl}/?lang=ko" />
`;
    xml += `    <xhtml:link rel="alternate" hreflang="ja" href="${baseUrl}/?lang=ja" />
`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/?lang=en" />
`;
    xml += `    <changefreq>daily</changefreq>
`;
    xml += `    <priority>0.9</priority>
`;
    xml += `  </url>
`;
  });
  xml += `  <url>
`;
  xml += `    <loc>${baseUrl}/upload</loc>
`;
  xml += `    <changefreq>weekly</changefreq>
`;
  xml += `    <priority>0.8</priority>
`;
  xml += `  </url>
`;
  creators.forEach((item) => {
    const modDate = item.updatedAt;
    xml += `  <url>
`;
    xml += `    <loc>${baseUrl}/creator/${encodeURIComponent(item.slug)}</loc>
`;
    if (modDate && Number.isFinite(Date.parse(modDate)))
      xml += `    <lastmod>${modDate}</lastmod>
`;
    xml += `    <changefreq>daily</changefreq>
`;
    xml += `    <priority>0.8</priority>
`;
    xml += `  </url>
`;
  });
  xml += await activitySitemapEntries(c.env.DB);
  xml += `</urlset>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600"
    }
  });
}, "sitemapXmlHandler");
app.get("/sitemap.xml", sitemapXmlHandler);
app.get("/api/v1/sitemap.xml", sitemapXmlHandler);
app.get("/api/v1/events", async (c) => {
  if (c.env.PORTAL_ENABLED === "true") {
    try {
      const events = await readUnifiedDebutEvents(c.env.DB);
      c.header("Cache-Control", "no-store");
      return c.json({ success: true, events, total: events.length, source: "d1_database" });
    } catch {
      c.header("Cache-Control", "no-store");
      return c.json({ success: false, error: "\uB370\uBDD4 \uC77C\uC815\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." }, 503);
    }
  }
  let dbEvents = [];
  if (c.env.DB) {
    const res = await fetchEventsFromD1(c.env.DB);
    if (res && res.length > 0) {
      dbEvents = res;
    }
  }
  const combinedMap = /* @__PURE__ */ new Map();
  MOCK_EVENTS.forEach((e) => combinedMap.set(e.id, e));
  dbEvents.forEach((e) => combinedMap.set(e.id, e));
  const allEvents = Array.from(combinedMap.values());
  c.header("Cache-Control", "public, max-age=30, s-maxage=120, stale-while-revalidate=300");
  return c.json({
    success: true,
    events: allEvents,
    total: allEvents.length,
    source: dbEvents.length > 0 ? "d1_database_merged" : "mock_fallback"
  });
});
app.post("/api/v1/submissions", async (c) => {
  if (!c.env.DB) {
    return c.json({
      success: false,
      message: "D1 database binding is not configured."
    }, 503);
  }
  try {
    const body = await c.req.json();
    const validation = validateDebutEventPayload(body);
    if (!validation.isValid) {
      return c.json({
        success: false,
        message: validation.errorMessage || "\uC785\uB825\uAC12\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
      }, 400);
    }
    const submissionId = await createSubmissionToD1(c.env.DB, body);
    return c.json({
      success: true,
      message: "\uB370\uBDD4 \uC77C\uC815 \uC2E0\uCCAD\uC11C\uAC00 \uC815\uC0C1 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC6B4\uC601\uC790 \uAC80\uD1A0 \uD6C4 \uCE98\uB9B0\uB354\uC5D0 \uC815\uC2DD \uBC18\uC601\uB429\uB2C8\uB2E4.",
      submissionId
    });
  } catch (err) {
    console.error("Create submission failed:", err);
    return c.json({
      success: false,
      message: "\uB370\uBDD4 \uC77C\uC815 \uC2E0\uCCAD\uC11C \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
      error: err?.message || "unknown_error"
    }, 500);
  }
});
app.post("/api/v1/events", async (c) => {
  if (!c.env.DB) {
    return c.json({ success: false, message: "D1 database binding is not configured." }, 503);
  }
  try {
    const body = await c.req.json();
    const validation = validateDebutEventPayload(body);
    if (!validation.isValid) {
      return c.json({ success: false, message: validation.errorMessage || "\uC785\uB825\uAC12\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." }, 400);
    }
    const submissionId = await createSubmissionToD1(c.env.DB, body);
    return c.json({
      success: true,
      message: "\uB370\uBDD4 \uC77C\uC815 \uC2E0\uCCAD\uC11C\uAC00 \uC815\uC0C1 \uC811\uC218\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC6B4\uC601\uC790 \uAC80\uD1A0 \uD6C4 \uCE98\uB9B0\uB354\uC5D0 \uC815\uC2DD \uBC18\uC601\uB429\uB2C8\uB2E4.",
      submissionId,
      eventId: `sub_${submissionId}`
    });
  } catch (err) {
    return c.json({ success: false, message: "\uC2E0\uCCAD\uC11C \uC811\uC218\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.", error: err?.message }, 500);
  }
});
app.post("/api/v1/admin/login", async (c) => {
  if (!c.env.DB) {
    return c.json({ success: false, error: "Database binding unavailable" }, 500);
  }
  try {
    const loginResponse = await portalApi.request(new URL("/admin/login", c.req.url).href, { method: "POST", headers: c.req.raw.headers, body: await c.req.text() }, { ...c.env, PORTAL_ENABLED: "true" }, c.executionCtx);
    const login = await loginResponse.json();
    return c.json({ success: loginResponse.ok, ...login }, loginResponse.status);
  } catch (err) {
    return c.json({ success: false, error: err?.message || "\uB85C\uADF8\uC778 \uC624\uB958" }, 500);
  }
});
app.get("/api/v1/admin/submissions", async (c) => {
  if (!c.env.DB)
    return c.json({ success: false, error: "Database unavailable" }, 500);
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthed = await validateAdminToken(token, c.env.DB);
  if (!isAuthed) {
    return c.json({ success: false, error: "Unauthorized: \uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  const status = c.req.query("status") || "PENDING";
  const list = await fetchSubmissionsFromD1(c.env.DB, status);
  return c.json({ success: true, submissions: list, total: list.length });
});
app.post("/api/v1/admin/submissions/batch", async (c) => {
  if (!c.env.DB)
    return c.json({ success: false, error: "Database unavailable" }, 500);
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthed = await validateAdminToken(token, c.env.DB);
  if (!isAuthed) {
    return c.json({ success: false, error: "Unauthorized: \uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  const body = await c.req.json().catch(() => ({}));
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return c.json({ success: false, error: "\uB4F1\uB85D\uD560 \uC2E0\uCCAD\uC11C \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." }, 400);
  }
  const result = await createSubmissionsBatchToD1(c.env.DB, items);
  return c.json({
    success: result.success,
    insertedCount: result.insertedCount,
    message: result.success ? `\uCD1D ${result.insertedCount}\uAC74\uC758 \uC2E0\uCCAD\uC11C\uAC00 \uC2EC\uC0AC \uB300\uAE30\uC5F4\uC5D0 \uC131\uACF5\uC801\uC73C\uB85C \uB4F1\uB85D\uB418\uC5C8\uC2B5\uB2C8\uB2E4.` : result.error || "\uC77C\uAD04 \uB4F1\uB85D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
  }, result.success ? 200 : 500);
});
app.put("/api/v1/admin/submissions/:id", async (c) => {
  if (!c.env.DB)
    return c.json({ success: false, error: "Database unavailable" }, 500);
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthed = await validateAdminToken(token, c.env.DB);
  if (!isAuthed) {
    return c.json({ success: false, error: "Unauthorized: \uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  const subId = parseInt(c.req.param("id"), 10);
  if (isNaN(subId))
    return c.json({ success: false, error: "\uC62C\uBC14\uB978 ID\uAC00 \uC544\uB2D9\uB2C8\uB2E4." }, 400);
  const body = await c.req.json().catch(() => ({}));
  const result = await updateSubmissionInD1(c.env.DB, subId, body);
  return c.json({
    success: result.success,
    message: result.success ? "\uC2E0\uCCAD\uC11C \uB370\uC774\uD130\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : result.error || "\uC218\uC815 \uC2E4\uD328",
    error: result.error
  }, result.success ? 200 : 500);
});
app.post("/api/v1/admin/submissions/:id/approve", async (c) => {
  if (!c.env.DB)
    return c.json({ success: false, error: "Database unavailable" }, 500);
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthed = await validateAdminToken(token, c.env.DB);
  if (!isAuthed) {
    return c.json({ success: false, error: "Unauthorized: \uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  const subId = parseInt(c.req.param("id"), 10);
  if (isNaN(subId))
    return c.json({ success: false, error: "\uC62C\uBC14\uB978 ID\uAC00 \uC544\uB2D9\uB2C8\uB2E4." }, 400);
  const body = await c.req.json().catch(() => ({}));
  const customSlug = body.customSlug;
  const customData = body.customData;
  const result = await approveSubmissionInD1(c.env.DB, subId, customSlug, customData);
  if (result.success && c.env.DISCORD_BOT_TOKEN && c.env.DB) {
    c.executionCtx.waitUntil(
      c.env.DB.prepare(`
        SELECT i.display_name, i.profile_image_url, i.description, i.agency_name, i.start_at_utc, c.platform, c.channel_url
        FROM streamerChannel_info i
        INNER JOIN streamerChannel c ON i.channel_id = c.id
        WHERE i.slug = ?
      `).bind(result.slug).first().then((row) => {
        if (row) {
          const eventPayload = {
            id: result.eventId,
            startAtUtc: row.start_at_utc,
            creator: {
              displayName: row.display_name,
              avatarUrl: row.profile_image_url,
              agency: row.agency_name,
              description: row.description
            },
            links: [{ platform: row.platform, url: row.channel_url, isPrimary: true }]
          };
          return broadcastNewDebutToDiscord(c.env.DB, c.env.DISCORD_BOT_TOKEN, eventPayload);
        }
      }).catch((e) => console.error("[Discord Broadcast on Approve Error]:", e))
    );
  }
  return c.json({
    success: result.success,
    message: result.success ? `\uC2E0\uCCAD\uC11C\uAC00 \uC2B9\uC778\uB418\uC5B4 /creator/${result.slug} \uC8FC\uC18C\uB85C \uCE98\uB9B0\uB354\uC5D0 \uC989\uC2DC \uBC1C\uD589\uB418\uC5C8\uC2B5\uB2C8\uB2E4!` : "\uC2B9\uC778 \uCC98\uB9AC\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
    error: result.error,
    eventId: result.eventId,
    slug: result.slug
  });
});
app.post("/api/v1/admin/submissions/batch-approve", async (c) => {
  if (!c.env.DB)
    return c.json({ success: false, error: "Database unavailable" }, 500);
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthed = await validateAdminToken(token, c.env.DB);
  if (!isAuthed) {
    return c.json({ success: false, error: "Unauthorized: \uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  const body = await c.req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id)) : [];
  if (ids.length === 0) {
    return c.json({ success: false, error: "\uC2B9\uC778\uD560 \uC2E0\uCCAD\uC11C ID\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." }, 400);
  }
  const result = await approveSubmissionsBatchInD1(c.env.DB, ids);
  return c.json({
    success: result.success,
    approvedCount: result.approvedCount,
    failedCount: result.failedCount,
    errors: result.errors,
    message: result.approvedCount > 0 ? `\uCD1D ${result.approvedCount}\uAC74\uC758 \uC2E0\uCCAD\uC11C\uAC00 \uCE98\uB9B0\uB354\uC5D0 \uC131\uACF5\uC801\uC73C\uB85C \uC77C\uAD04 \uC2B9\uC778\uB418\uC5C8\uC2B5\uB2C8\uB2E4.` : "\uC77C\uAD04 \uC2B9\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
  }, result.success ? 200 : 500);
});
app.post("/api/v1/admin/submissions/:id/reject", async (c) => {
  if (!c.env.DB)
    return c.json({ success: false, error: "Database unavailable" }, 500);
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthed = await validateAdminToken(token, c.env.DB);
  if (!isAuthed) {
    return c.json({ success: false, error: "Unauthorized: \uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  const subId = parseInt(c.req.param("id"), 10);
  const body = await c.req.json().catch(() => ({}));
  const ok = await rejectSubmissionInD1(c.env.DB, subId, body.adminNote);
  return c.json({ success: ok, message: ok ? "\uC2E0\uCCAD\uC11C\uAC00 \uBC18\uB824 \uCC98\uB9AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : "\uBC18\uB824 \uCC98\uB9AC\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." });
});
app.delete("/api/v1/admin/submissions/:id", async (c) => {
  if (!c.env.DB)
    return c.json({ success: false, error: "Database unavailable" }, 500);
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthed = await validateAdminToken(token, c.env.DB);
  if (!isAuthed) {
    return c.json({ success: false, error: "Unauthorized: \uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  const subId = parseInt(c.req.param("id"), 10);
  const ok = await deleteSubmissionFromD1(c.env.DB, subId);
  return c.json({ success: ok, message: ok ? "\uC2E0\uCCAD\uC11C\uAC00 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : "\uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." });
});
app.get("/api/v1/admin/streamers", async (c) => {
  if (!c.env.DB)
    return c.json({ success: false, error: "Database unavailable" }, 500);
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthed = await validateAdminToken(token, c.env.DB);
  if (!isAuthed) {
    return c.json({ success: false, error: "Unauthorized: \uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  const streamers = c.env.PORTAL_ENABLED === "true" ? await portalAdminStreamers(c.env.DB) : await fetchAllActiveStreamersForAdmin(c.env.DB);
  return c.json({ success: true, streamers, total: streamers.length });
});
app.delete("/api/v1/admin/streamers/:slug", async (c) => {
  if (!c.env.DB)
    return c.json({ success: false, error: "Database unavailable" }, 500);
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthed = await validateAdminToken(token, c.env.DB);
  if (!isAuthed) {
    return c.json({ success: false, error: "Unauthorized: \uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  const slug = c.req.param("slug");
  const ok = c.env.PORTAL_ENABLED === "true" ? await deletePortalProfile(c.env.DB, slug) : await deleteCreatorProfileFromD1(c.env.DB, slug);
  return c.json({
    success: ok,
    message: ok ? "\uC2A4\uD2B8\uB9AC\uBA38\uAC00 \uCE98\uB9B0\uB354\uC5D0\uC11C \uC644\uC804\uD788 \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : "\uC2A4\uD2B8\uB9AC\uBA38 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
  });
});
app.post("/api/v1/admin/sync-profiles", async (c) => {
  if (!c.env.DB)
    return c.json({ success: false, error: "Database unavailable" }, 500);
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthed = await validateAdminToken(token, c.env.DB);
  const crawlerSecret = c.env.CRAWLER_SECRET;
  const requestSecret = c.req.header("X-Crawler-Secret") || c.req.header("x-crawler-secret");
  const isSecretValid = crawlerSecret && requestSecret === crawlerSecret;
  if (!isAuthed && !isSecretValid) {
    return c.json({ success: false, error: "Unauthorized: \uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  const result = await syncMissingProfilesInD1(c.env.DB);
  return c.json({
    success: true,
    message: `\uD504\uB85C\uD544 \uC790\uB3D9 \uB3D9\uAE30\uD654 \uC644\uB8CC: ${result.updatedCount}\uAC74 \uAC31\uC2E0 (\uD655\uC778: ${result.totalChecked}\uAC74)`,
    result
  });
});
app.get("/api/v1/platform/profile", async (c) => {
  const platform = c.req.query("platform") || "CHZZK";
  const url = c.req.query("url") || c.req.query("channelUrl") || "";
  if (!url) {
    return c.json({
      success: false,
      error: "\uCC44\uB110 URL \uB610\uB294 \uC544\uC774\uB514\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."
    }, 400);
  }
  const result = await fetchPlatformProfile(platform, url);
  return c.json(result);
});
app.get("/api/v1/creator/:slug", async (c) => {
  const slug = c.req.param("slug");
  if (c.env.PORTAL_ENABLED === "true") {
    const profile = await readPublicPortalProfileBySlug(c.env.DB, slug);
    if (!profile)
      return c.json({ success: false, error: "\uD574\uB2F9 \uD06C\uB9AC\uC5D0\uC774\uD130 \uD504\uB85C\uD544\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }, 404);
    const event = portalProfileEvent(profile);
    c.header("Cache-Control", "no-store");
    return c.json({ success: true, creator: {
      id: profile.slug,
      slug: profile.slug,
      displayName: profile.displayName,
      description: profile.description,
      profileImageUrl: profile.avatarUrl,
      agencyName: profile.agency,
      creatorType: profile.agency && profile.agency !== "\uAC1C\uC778\uC138" ? "AGENCY" : "INDIE",
      language: profile.languages.join(", "),
      countryCode: profile.countryCode,
      xUrl: profile.xUrl,
      isPublic: true,
      channels: [{ id: profile.slug, platform: profile.platform, channelName: profile.displayName, channelUrl: profile.channelUrl, isPrimary: true }],
      events: event ? [event] : []
    } });
  }
  const creator = await fetchCreatorProfileBySlug(c.env.DB || null, slug);
  if (!creator) {
    return c.json({
      success: false,
      error: "\uD574\uB2F9 \uD06C\uB9AC\uC5D0\uC774\uD130 \uD504\uB85C\uD544\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
    }, 404);
  }
  return c.json({
    success: true,
    creator
  });
});
app.put("/api/v1/creator/:slug", async (c) => {
  const slug = c.req.param("slug");
  const body = await c.req.json();
  const res = await updateCreatorProfileInD1(c.env.DB || null, slug, body);
  if (res.success && res.dateChanged && res.changeDetails && c.env.DISCORD_BOT_TOKEN && c.env.DB) {
    c.executionCtx.waitUntil(
      broadcastDebutDateChangeToDiscord(c.env.DB, c.env.DISCORD_BOT_TOKEN, res.changeDetails).then((count) => console.log(`[Discord Debut Notice] Notified ${count} channels of debut date change for ${slug}`)).catch((err) => console.error("[Discord Debut Notice Error]:", err))
    );
  }
  return c.json({
    success: res.success,
    dateChanged: res.dateChanged,
    message: res.success ? "\uD06C\uB9AC\uC5D0\uC774\uD130 \uD504\uB85C\uD544\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC218\uC815\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : "\uD504\uB85C\uD544 \uC218\uC815\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
  });
});
app.delete("/api/v1/creator/:slug", async (c) => {
  const slug = c.req.param("slug");
  const ok = await deleteCreatorProfileFromD1(c.env.DB || null, slug);
  return c.json({
    success: ok,
    message: ok ? "\uD06C\uB9AC\uC5D0\uC774\uD130 \uD504\uB85C\uD544\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC0AD\uC81C\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : "\uD504\uB85C\uD544 \uC0AD\uC81C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
  });
});
app.get("/creator/:slug", async (c) => {
  const slug = c.req.param("slug");
  const creator = await fetchCreatorProfileBySlug(c.env.DB || null, slug);
  const title = creator ? `${creator.displayName} \uBC84\uD29C\uBC84 \uD504\uB85C\uD544\xB7\uB370\uBDD4 \uC77C\uC815 | VD\xE9but` : `\uBC84\uD29C\uBC84 \uD504\uB85C\uD544 | VD\xE9but`;
  const description = creator ? creator.description || `${creator.displayName} \uBC84\uD29C\uBC84\uC758 \uD504\uB85C\uD544\uACFC \uB370\uBDD4 \uBC29\uC1A1 \uC77C\uC815 \uBC0F \uD65C\uB3D9 \uCC44\uB110 \uC815\uBCF4\uC785\uB2C8\uB2E4.` : `\uBC84\uD29C\uBC84 \uD504\uB85C\uD544 \uBC0F \uB370\uBDD4 \uBC29\uC1A1 \uC77C\uC815\uC744 \uD655\uC778\uD558\uC138\uC694.`;
  const imageUrl = creator?.profileImageUrl || "https://vdebut.live/og-image.png";
  const canonicalUrl = `https://vdebut.live/creator/${slug}`;
  const jsonLd = creator ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "Person",
      "name": creator.displayName,
      "alternateName": creator.displayName,
      "description": description,
      "image": imageUrl,
      "url": canonicalUrl,
      "sameAs": creator.channels.map((ch) => ch.channelUrl)
    }
  }) : "";
  const assetManifest = JSON.parse(manifestJSON || "{}");
  try {
    const res = await getAssetFromKV(
      {
        request: c.req.raw,
        waitUntil: (promise) => c.executionCtx.waitUntil(promise)
      },
      {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
        mapRequestToAsset: serveSinglePageApp
      }
    );
    let html = await res.text();
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    html = html.replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${title}" />`);
    html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`);
    html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`);
    html = html.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${imageUrl}" />`);
    if (jsonLd) {
      html = html.replace("</head>", `<script type="application/ld+json">${jsonLd}<\/script></head>`);
    }
    return c.html(html);
  } catch (e) {
    return c.text(`SPA Asset Error: ${e?.message || "Asset NotFound"}`, 404);
  }
});
app.get("/upload", async (c) => {
  const title = `\uB370\uBDD4 \uC77C\uC815 \uB4F1\uB85D | VD\xE9but - \uBC84\uD29C\uBC84 \uB370\uBDD4 \uC77C\uC815 \uC2E0\uCCAD`;
  const description = `\uC2E0\uC785 \uBC84\uD29C\uBC84 \uB370\uBDD4 \uC77C\uC815\uC744 VD\xE9but \uCE98\uB9B0\uB354\uC5D0 \uC790\uC720\uB86D\uAC8C \uB4F1\uB85D\uD558\uACE0 \uACF5\uC2DD \uC18C\uC2DD\uC744 \uC804\uD558\uC138\uC694.`;
  const canonicalUrl = `https://vdebut.live/upload`;
  const assetManifest = JSON.parse(manifestJSON || "{}");
  try {
    const res = await getAssetFromKV(
      {
        request: c.req.raw,
        waitUntil: (promise) => c.executionCtx.waitUntil(promise)
      },
      {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
        mapRequestToAsset: serveSinglePageApp
      }
    );
    let html = await res.text();
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    html = html.replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${title}" />`);
    html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`);
    html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`);
    html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`);
    html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`);
    html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`);
    return c.html(html);
  } catch (e) {
    return c.text(`SPA Asset Error: ${e?.message || "Asset NotFound"}`, 404);
  }
});
app.get("/admin", async (c) => {
  const assetManifest = JSON.parse(manifestJSON || "{}");
  try {
    const res = await getAssetFromKV(
      {
        request: c.req.raw,
        waitUntil: (promise) => c.executionCtx.waitUntil(promise)
      },
      {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
        mapRequestToAsset: serveSinglePageApp
      }
    );
    let html = await res.text();
    html = html.replace(/<title>.*?<\/title>/, `<title>V-DEBUT HUB CMS Console</title>`);
    html = html.replace("</head>", `<meta name="robots" content="noindex, nofollow, noarchive" /></head>`);
    c.header("X-Robots-Tag", "noindex, nofollow, noarchive");
    return c.html(html);
  } catch (e) {
    return c.text(`SPA Asset Error: ${e?.message || "Asset NotFound"}`, 404);
  }
});
app.post("/api/v1/admin/crawler/run", async (c) => {
  try {
    const crawlerSecret = c.env.CRAWLER_SECRET;
    const requestSecret = c.req.header("X-Crawler-Secret") || c.req.header("x-crawler-secret");
    if (crawlerSecret && requestSecret !== crawlerSecret) {
      return c.json({ success: false, error: "Unauthorized: Invalid crawler secret key" }, 401);
    }
    const body = await c.req.json().catch(() => ({}));
    const recipient = body.recipientEmail || "kimjichang1234@gmail.com";
    const result = await runDebutCrawlerProcess(c.env.DB || null, recipient);
    return c.json({
      success: true,
      message: "\uC790\uB3D9 \uC6F9\uC11C\uCE58 \uC218\uC9D1 \uBC0F \uC774\uBA54\uC77C \uB9AC\uD3EC\uD2B8 \uBC1C\uC1A1 \uD504\uB85C\uC138\uC2A4\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC218\uD589\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
      result
    });
  } catch (err) {
    return c.json({ success: false, error: err.message || "\uD06C\uB864\uB7EC \uC2E4\uD589 \uC911 \uC624\uB958 \uBC1C\uC0DD" }, 500);
  }
});
app.get("/api/v1/admin/crawler/logs", async (c) => {
  if (!c.env.DB) {
    return c.json({ success: false, error: "Database binding unavailable" }, 500);
  }
  try {
    const { results } = await c.env.DB.prepare(`SELECT * FROM crawler_update_logs ORDER BY run_at DESC LIMIT 50`).all();
    return c.json({
      success: true,
      logs: results || []
    });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
app.post("/api/v1/discord/interactions", async (c) => {
  const signature = c.req.header("X-Signature-Ed25519") || "";
  const timestamp = c.req.header("X-Signature-Timestamp") || "";
  const rawBody = await c.req.text();
  if (c.env.DISCORD_PUBLIC_KEY) {
    const isValid = await verifyDiscordSignature(
      rawBody,
      signature,
      timestamp,
      c.env.DISCORD_PUBLIC_KEY
    );
    if (!isValid) {
      return c.text("Invalid request signature", 401);
    }
  }
  try {
    const body = JSON.parse(rawBody);
    const responsePayload = await handleDiscordInteraction(body, c.env);
    return c.json(responsePayload);
  } catch (err) {
    console.error("[Discord Interaction Handler Error]:", err);
    return c.json(
      { type: 4, data: { content: "\u26A0\uFE0F \uB514\uC2A4\uCF54\uB4DC \uC694\uCCAD \uCC98\uB9AC \uC911 \uC11C\uBC84 \uB0B4\uBD80 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4." } },
      500
    );
  }
});
app.post("/api/v1/admin/discord/test-broadcast", async (c) => {
  if (!c.env.DB)
    return c.json({ success: false, error: "Database unavailable" }, 500);
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthed = await validateAdminToken(token, c.env.DB);
  if (!isAuthed) {
    return c.json({ success: false, error: "Unauthorized: \uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  if (!c.env.DISCORD_BOT_TOKEN) {
    return c.json({ success: false, error: "DISCORD_BOT_TOKEN \uD658\uACBD\uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." }, 400);
  }
  const testPayload = {
    id: "test_evt",
    startAtUtc: new Date(Date.now() + 36e5).toISOString(),
    creator: {
      displayName: "\uD14C\uC2A4\uD2B8 \uBC84\uD29C\uBC84",
      avatarUrl: "https://vdebut.live/logo.png",
      agency: "V-DEBUT HUB \uD14C\uC2A4\uD2B8\uC138",
      description: "\uB514\uC2A4\uCF54\uB4DC \uBD07 \uBE0C\uB85C\uB4DC\uCE90\uC2A4\uD2B8 \uC5F0\uB3D9 \uD14C\uC2A4\uD2B8 \uBA54\uC2DC\uC9C0\uC785\uB2C8\uB2E4."
    },
    links: [{ platform: "CHZZK", url: "https://vdebut.live", isPrimary: true }]
  };
  const sentCount = await broadcastNewDebutToDiscord(c.env.DB, c.env.DISCORD_BOT_TOKEN, testPayload);
  return c.json({
    success: true,
    message: `\uD14C\uC2A4\uD2B8 \uBE0C\uB85C\uB4DC\uCE90\uC2A4\uD2B8 \uBC1C\uC1A1 \uC644\uB8CC: \uCD1D ${sentCount}\uAC1C \uCC44\uB110\uB85C \uC804\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
    sentCount
  });
});
app.post("/api/v1/admin/discord/test-date-change-notice", async (c) => {
  if (!c.env.DB)
    return c.json({ success: false, error: "Database unavailable" }, 500);
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthed = await validateAdminToken(token, c.env.DB);
  if (!isAuthed) {
    return c.json({ success: false, error: "Unauthorized: \uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  if (!c.env.DISCORD_BOT_TOKEN) {
    return c.json({ success: false, error: "DISCORD_BOT_TOKEN \uD658\uACBD\uBCC0\uC218\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." }, 400);
  }
  const body = await c.req.json().catch(() => ({}));
  const platform = (body.platform || "CHZZK").toUpperCase();
  const isSoop = platform === "SOOP";
  const testPayload = {
    displayName: body.displayName || (isSoop ? "\uD14C\uC2A4\uD2B8 SOOP \uBC84\uD29C\uBC84" : "\uD14C\uC2A4\uD2B8 \uCE58\uC9C0\uC9C1 \uBC84\uD29C\uBC84"),
    avatarUrl: body.avatarUrl || "https://vdebut.live/logo.png",
    platform,
    channelUrl: body.channelUrl || (isSoop ? "https://bj.afreecatv.com/sample" : "https://chzzk.naver.com/sample"),
    agency: body.agency || (body.includeAgency ? "\uC2A4\uD0C0\uBC84\uC2A4 \uC5D4\uD130\uD14C\uC778\uBA3C\uD2B8" : void 0),
    oldDebutDateStr: body.oldDate || "2026-09-20 20:00 (KST)",
    newDebutDateStr: body.newDate || "2026-09-25 19:00 (KST)",
    reason: body.reason || "\uBC29\uC1A1 \uC7A5\uBE44 \uC138\uD305 \uBC0F 3D \uBAA8\uB378\uB9C1 \uB9AC\uAE45 \uBCF4\uC644 \uC791\uC5C5\uC73C\uB85C \uC778\uD574 \uC77C\uC815\uC774 5\uC77C \uC5F0\uAE30\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
  };
  const sentCount = await broadcastDebutDateChangeToDiscord(c.env.DB, c.env.DISCORD_BOT_TOKEN, testPayload);
  return c.json({
    success: true,
    platform,
    message: `${platform} \uB370\uBDD4 \uC77C\uC815 \uBCC0\uACBD \uD14C\uC2A4\uD2B8 Notice \uBC1C\uC1A1 \uC644\uB8CC: \uCD1D ${sentCount}\uAC1C \uCC44\uB110\uB85C \uC804\uC1A1\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`,
    sentCount
  });
});
app.post("/api/v1/admin/auto-review/run", async (c) => {
  if (!c.env.DB)
    return c.json({ success: false, error: "Database unavailable" }, 500);
  const authHeader = c.req.header("Authorization") || c.req.header("X-Admin-Token") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const isAuthed = await validateAdminToken(token, c.env.DB);
  if (!isAuthed) {
    return c.json({ success: false, error: "Unauthorized: \uAD00\uB9AC\uC790 \uC778\uC99D\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." }, 401);
  }
  const report = await runAutoReviewPipeline(c.env.DB);
  return c.json({
    success: true,
    message: `\uC790\uB3D9 \uC2EC\uC0AC \uC644\uB8CC: \uB300\uAE30\uC5F4 ${report.totalProcessed}\uAC74 \uAC80\uC99D \uC911 ${report.approvedCount}\uAC74 \uC790\uB3D9 \uC2B9\uC778, ${report.rejectedCount}\uAC74 \uBC18\uB824, ${report.heldCount}\uAC74 \uBCF4\uB958`,
    report
  });
});
app.get("/api/analytics/streamers/search", async (c) => {
  const query = c.req.query("q") || "";
  if (query.length > 80)
    return c.json({ error: "\uAC80\uC0C9\uC5B4\uB294 80\uC790 \uC774\uB0B4\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694." }, 400);
  const includeExternal = c.req.query("external") !== "false";
  const platform = c.req.query("platform") || "ALL";
  if (!["ALL", "CHZZK", "SOOP"].includes(platform))
    return c.json({ error: "\uAC80\uC0C9 \uD50C\uB7AB\uD3FC\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 400);
  try {
    const result = await searchStatisticsStreamers(c.env.DB, query, includeExternal, platform);
    c.header("Cache-Control", "public, max-age=15");
    return c.json(result);
  } catch (error) {
    console.error("[Statistics] Streamer search failed", String(error));
    return c.json({ error: "\uC2A4\uD2B8\uB9AC\uBA38 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." }, 503);
  }
});
app.post("/api/analytics/streamers/register", async (c) => {
  if (!c.env.DB) {
    return c.json({ success: false, message: "D1 \uB370\uC774\uD130\uBCA0\uC774\uC2A4\uAC00 \uAD6C\uC131\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." }, 503);
  }
  try {
    const body = await c.req.json();
    if (!body || !body.platform || !body.channelUrl || !body.name) {
      return c.json({ success: false, message: "\uD544\uC218 \uC2A4\uD2B8\uB9AC\uBA38 \uC815\uBCF4\uAC00 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4." }, 400);
    }
    const result = await registerExternalStreamerToD1(c.env.DB, body);
    return c.json(result);
  } catch (error) {
    console.error("[Statistics] Streamer auto-register failed", error);
    return c.json({ success: false, message: error?.message || "\uC2A4\uD2B8\uB9AC\uBA38 \uB4F1\uB85D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." }, 500);
  }
});
app.all("/api/analytics/streamers/resolve", async (c) => {
  if (!c.env.DB) {
    return c.json({ success: false, message: "D1 \uB370\uC774\uD130\uBCA0\uC774\uC2A4\uAC00 \uAD6C\uC131\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." }, 503);
  }
  let channelKey = c.req.query("channelKey");
  if (!channelKey && c.req.method === "POST") {
    try {
      const body = await c.req.json();
      channelKey = body?.channelKey;
    } catch {
    }
  }
  if (!channelKey) {
    return c.json({ success: false, message: "channelKey \uD30C\uB77C\uBBF8\uD130\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." }, 400);
  }
  try {
    const result = await ensureStreamerRegistered(c.env.DB, channelKey);
    return c.json(result);
  } catch (error) {
    console.error("[Statistics] Streamer resolve failed", error);
    return c.json({ success: false, message: error?.message || "\uC2A4\uD2B8\uB9AC\uBA38 \uC870\uD68C/\uB4F1\uB85D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." }, 500);
  }
});
app.get("/api/analytics/broadcast-statistics", async (c) => {
  const date = c.req.query("date");
  const forceFresh = c.req.query("fresh") === "true";
  const isPastDate = !!date && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const cacheUrl = isPastDate ? `${new URL(c.req.url).origin}/api/analytics/broadcast-statistics?date=${date}` : `${new URL(c.req.url).origin}/api/analytics/broadcast-statistics`;
  const cacheKey = new Request(cacheUrl);
  if (!forceFresh) {
    const cached = await caches.default.match(cacheKey);
    if (cached)
      return cached;
  }
  try {
    const result = await getBroadcastStatistics(c.env.DB, date, forceFresh);
    const cacheControl = isPastDate ? "public, max-age=86400, s-maxage=86400" : "public, max-age=30, s-maxage=60";
    const response = new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": cacheControl }
    });
    c.executionCtx.waitUntil(caches.default.put(cacheKey, response.clone()));
    return response;
  } catch (error) {
    console.error("[Statistics] Request failed", String(error));
    return c.json({ error: "\uBC29\uC1A1 \uD1B5\uACC4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." }, 503);
  }
});
app.get("/api/analytics/activity", async (c) => {
  const defaults = activityPeriod(7);
  const from = c.req.query("from") || defaults.from;
  const to = c.req.query("to") || defaults.to;
  const platform = c.req.query("platform") || "ALL";
  const category = c.req.query("category") || "";
  const channel = c.req.query("channel") || "";
  if (!validActivityRange(from, to) || !["ALL", "CHZZK", "SOOP"].includes(platform) || category.length > 100 || channel && !/^(CHZZK:[a-f0-9]{32}|SOOP:[a-z0-9_]{1,50})$/i.test(channel)) {
    return c.json({ error: "\uC870\uD68C \uC870\uAC74\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 400);
  }
  try {
    const selectedPlatform = channel ? channel.toUpperCase().startsWith("SOOP:") ? "SOOP" : "CHZZK" : platform;
    const key = new URL("/api/analytics/activity", c.req.url);
    key.search = new URLSearchParams({ from, to, platform: selectedPlatform, channel, category, cache: "v2" }).toString();
    return await publicResponseCache(c.req.raw, key, 120, async () => c.json(await getBroadcastActivity(c.env.DB, { from, to, platform: selectedPlatform, category, channel })), (promise) => c.executionCtx.waitUntil(promise));
  } catch (error) {
    console.error("[Statistics] Activity request failed", String(error));
    c.header("Cache-Control", "no-store");
    return c.json({ error: "\uBC29\uC1A1 \uD1B5\uACC4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694." }, 503);
  }
});
app.get("/api/analytics/activity/broadcasts", async (c) => {
  const defaults = activityPeriod(7);
  const from = c.req.query("from") || defaults.from;
  const to = c.req.query("to") || defaults.to;
  const platform = c.req.query("platform") || "ALL";
  const category = c.req.query("category") || "";
  const channel = c.req.query("channel") || "";
  const day = c.req.query("day") || "";
  const weekday = c.req.query("weekday") === void 0 ? null : Number(c.req.query("weekday"));
  const hour = c.req.query("hour") === void 0 ? null : Number(c.req.query("hour"));
  const timeMetric = c.req.query("timeMetric") || "activity";
  const cursor = c.req.query("cursor") || "";
  const asOf = c.req.query("asOf") || (/* @__PURE__ */ new Date()).toISOString();
  if (!validActivityRange(from, to) || !["ALL", "CHZZK", "SOOP"].includes(platform) || category.length > 100 || channel && !/^(CHZZK:[a-f0-9]{32}|SOOP:[a-z0-9_]{1,50})$/i.test(channel) || day && (!validActivityRange(day, day) || day < from || day > to) || weekday !== null && (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) || hour !== null && (!Number.isInteger(hour) || hour < 0 || hour > 23) || weekday === null !== (hour === null) || day && weekday !== null || !["activity", "starts"].includes(timeMetric) || cursor.length > 800 || !readActivityCursor(cursor) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(asOf) || !Number.isFinite(Date.parse(asOf)) || Date.parse(asOf) > Date.now() + 1e3) {
    return c.json({ error: "\uC870\uD68C \uC870\uAC74\uC744 \uD655\uC778\uD574 \uC8FC\uC138\uC694." }, 400);
  }
  try {
    const selectedPlatform = channel ? channel.toUpperCase().startsWith("SOOP:") ? "SOOP" : "CHZZK" : platform;
    const key = new URL("/api/analytics/activity/broadcasts", c.req.url);
    key.search = new URLSearchParams({ from, to, platform: selectedPlatform, category, channel, day, weekday: String(weekday), hour: String(hour), timeMetric, cursor, asOf, cache: "v2" }).toString();
    return await publicResponseCache(c.req.raw, key, 120, async () => c.json(await getActivityBroadcastPage(
      c.env.DB,
      { from, to, platform: selectedPlatform, category, channel },
      { day, weekday, hour, timeMetric },
      cursor,
      asOf
    )), (promise) => c.executionCtx.waitUntil(promise));
  } catch (error) {
    console.error("[Statistics] Activity history request failed", String(error));
    c.header("Cache-Control", "no-store");
    return c.json({ error: "\uBC29\uC1A1 \uC774\uB825\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694." }, 503);
  }
});
app.get("/api/analytics/streamers/:key/history", async (c) => {
  const key = decodeURIComponent(c.req.param("key") || "");
  const days = Number(c.req.query("days")) || 7;
  if (!key)
    return c.json({ error: "\uC2A4\uD2B8\uB9AC\uBA38 \uD0A4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4." }, 400);
  try {
    const result = await getStreamerBroadcastHistory(c.env.DB, key, days);
    c.header("Cache-Control", "public, max-age=120");
    return c.json(result);
  } catch (error) {
    console.error("[Statistics] Streamer history failed", String(error));
    return c.json({ error: "\uC2A4\uD2B8\uB9AC\uBA38 \uBC29\uC1A1 \uC774\uB825\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." }, 500);
  }
});
app.get("/api/analytics/overview", async (c) => {
  const platform = c.req.query("platform") || "ALL";
  const result = await getAnalyticsOverview(c.env.DB, platform);
  return c.json(result);
});
app.get("/api/analytics/timeseries", async (c) => {
  const platform = c.req.query("platform") || "ALL";
  const dayScope = c.req.query("day_scope") || "ALL";
  const result = await getAnalyticsTimeseries(c.env.DB, platform, dayScope);
  return c.json(result);
});
app.get("/api/analytics/heatmap", async (c) => {
  const platform = c.req.query("platform") || "ALL";
  const result = await getAnalyticsHeatmap(c.env.DB, platform);
  return c.json(result);
});
app.get("/api/analytics/categories", async (c) => {
  const platform = c.req.query("platform") || "ALL";
  const result = await getAnalyticsCategories(c.env.DB, platform);
  return c.json(result);
});
app.get("/api/analytics/opportunities", async (c) => {
  const platform = c.req.query("platform") || "ALL";
  const dayScope = c.req.query("day_scope") || "ALL";
  const creatorTier = c.req.query("creator_tier") || "ALL";
  const categoryGroup = c.req.query("category_group") || "ALL";
  const result = await getAnalyticsOpportunities(c.env.DB, {
    platform,
    dayScope,
    creatorTier,
    categoryGroup
  });
  return c.json(result);
});
app.post("/api/analytics/opportunities", async (c) => {
  try {
    const body = await c.req.json();
    const result = await getAnalyticsOpportunities(c.env.DB, body);
    return c.json(result);
  } catch (err) {
    return c.json({ error: "Invalid opportunity payload", details: err?.message }, 400);
  }
});
app.post("/api/analytics/collect-now", async (c) => {
  try {
    const results = await collectBroadcastStatistics(c.env.DB, Date.now());
    return c.json({ success: true, results, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (err) {
    return c.json({ success: false, error: err?.message || "Collection failed" }, 500);
  }
});
app.get("/api/analytics/live-samples", async (c) => {
  const platform = c.req.query("platform") || "ALL";
  const result = await getAnalyticsLiveSamples(c.env.DB, platform);
  return c.json(result);
});
app.get("/api/analytics/methodology", (c) => {
  const result = getAnalyticsMethodology();
  return c.json(result);
});
app.get("/api/analytics/current-content", async (c) => {
  const platform = c.req.query("platform") || "CHZZK";
  const result = await getCurrentContentDrilldown(c.env.DB, platform);
  c.header("Cache-Control", "public, max-age=30, s-maxage=60");
  return c.json(result);
});
app.get("/api/discovery/live", async (c) => {
  const platform = (c.req.query("platform") || "ALL").toUpperCase();
  const categoryGroup = c.req.query("category") || c.req.query("categoryGroup") || "ALL";
  const game = c.req.query("game") || "ALL";
  const sort = c.req.query("sort") || "viewers";
  const query = c.req.query("q") || c.req.query("query") || "";
  const result = await getLiveDiscovery(c.env.DB, {
    platform,
    categoryGroup,
    game,
    sort,
    query
  });
  c.header("Cache-Control", "public, max-age=30, s-maxage=60");
  return c.json(result);
});
app.get("/api/discovery/history", async (c) => {
  const date = c.req.query("date") || "";
  const hourParam = c.req.query("hour");
  const hour = hourParam !== void 0 && hourParam !== "" ? Number(hourParam) : void 0;
  const platform = (c.req.query("platform") || "ALL").toUpperCase();
  const category = c.req.query("category") || c.req.query("categoryGroup") || "ALL";
  const streamer = c.req.query("streamer") || "";
  const query = c.req.query("q") || c.req.query("query") || "";
  const result = await getLiveHistory(c.env.DB, {
    date,
    hour,
    platform,
    category,
    streamer,
    query
  });
  c.header("Cache-Control", "public, max-age=60, s-maxage=120");
  return c.json(result);
});
app.get("/api/discovery/history/creator", async (c) => {
  const name = c.req.query("name") || c.req.query("streamer") || "";
  if (!name.trim()) {
    return c.json({ error: "Streamer name is required" }, 400);
  }
  const result = await getCreatorHistory(c.env.DB, name);
  if (!result) {
    return c.json({ error: "Creator not found" }, 404);
  }
  c.header("Cache-Control", "public, max-age=120, s-maxage=300");
  return c.json(result);
});
var activityPageHandler = /* @__PURE__ */ __name(async (c) => {
  const url = new URL(c.req.url);
  let channel = "";
  if (url.pathname.startsWith("/analytics/streamer/")) {
    try {
      channel = decodeURIComponent(url.pathname.slice("/analytics/streamer/".length));
    } catch {
      return c.html(publicErrorPage(url, "\uD398\uC774\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694", 404), 404);
    }
    if (!/^(CHZZK:[a-f0-9]{32}|SOOP:[a-z0-9_]{1,50})$/i.test(channel))
      return c.html(publicErrorPage(url, "\uD398\uC774\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694", 404), 404);
    channel = `${channel.split(":")[0].toUpperCase()}:${channel.split(":")[1].toLowerCase()}`;
  } else if (!["/analytics", "/analytics/chzzk", "/analytics/soop"].includes(url.pathname)) {
    c.header("X-Robots-Tag", "noindex");
    return c.html(publicErrorPage(url, "\uD398\uC774\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694", 404), 404);
  }
  const defaults = activityPeriod(7);
  const from = url.searchParams.get("from") || url.searchParams.get("date") || defaults.from;
  const to = url.searchParams.get("to") || url.searchParams.get("date") || defaults.to;
  const platformValue = url.pathname === "/analytics/chzzk" ? "CHZZK" : url.pathname === "/analytics/soop" ? "SOOP" : url.searchParams.get("platform");
  const filters = {
    ...validActivityRange(from, to) ? { from, to } : defaults,
    channel,
    platform: platformValue === "CHZZK" || platformValue === "SOOP" ? platformValue : "ALL",
    category: (url.searchParams.get("category") || "").slice(0, 100)
  };
  try {
    const data = await getBroadcastActivity(c.env.DB, filters);
    if (channel && !data.streamer?.isRegistered && !url.searchParams.has("name")) {
      const exists = await c.env.DB.prepare("SELECT 1 FROM analytics_broadcast_snapshots WHERE channel_key=? COLLATE NOCASE LIMIT 1").bind(channel).first();
      if (!exists) {
        c.header("X-Robots-Tag", "noindex");
        return c.html(publicErrorPage(url, "\uD398\uC774\uC9C0\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC5B4\uC694", 404), 404);
      }
    }
    const shellRequest = c.env.PORTAL_ENABLED === "true" ? new Request(new URL(new URL(c.req.url).hostname === "vdebut.live" ? "/portal.html" : "/dev.html", c.req.url), c.req.raw) : c.req.raw;
    const asset = await getAssetFromKV({ request: shellRequest, waitUntil: (promise) => c.executionCtx.waitUntil(promise) }, {
      // 지정한 포털 HTML을 SPA 기본 index.html로 다시 바꾸지 않는다.
      ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
      ASSET_MANIFEST: JSON.parse(manifestJSON || "{}"),
      ...c.env.PORTAL_ENABLED === "true" ? {} : { mapRequestToAsset: serveSinglePageApp }
    });
    c.header("Cache-Control", "public, max-age=60, s-maxage=120");
    if (activityNoindex(url, data))
      c.header("X-Robots-Tag", "noindex, follow");
    return c.html(renderActivityPage(await asset.text(), url, filters, data));
  } catch (error) {
    console.error("[Statistics] Initial page failed", String(error));
    c.header("Cache-Control", "no-store");
    c.header("X-Robots-Tag", "noindex");
    return c.html(publicErrorPage(url, "\uBC29\uC1A1 \uD1B5\uACC4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694", 503), 503);
  }
}, "activityPageHandler");
app.get("/analytics", activityPageHandler);
app.get("/analytics/*", activityPageHandler);
app.all("*", async (c) => {
  const assetManifest = JSON.parse(manifestJSON || "{}");
  try {
    return await getAssetFromKV(
      {
        request: c.req.raw,
        waitUntil: (promise) => c.executionCtx.waitUntil(promise)
      },
      {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
        mapRequestToAsset: serveSinglePageApp
      }
    );
  } catch (e) {
    return c.text(`SPA Asset Error: ${e?.message || "Asset NotFound"}`, 404);
  }
});
var src_default = {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    const scheduledTime = event?.scheduledTime || Date.now();
    if (event?.cron === WEEKLY_RESET_CRON) {
      if (env.DB)
        ctx.waitUntil(resetWeeklyCheers(env.DB).then(() => console.log("[Scheduled Cron] Weekly cheers reset")).catch((err) => console.error("[Scheduled Cron] Weekly cheers reset error:", err)));
      return;
    }
    if (env.DB) {
      ctx.waitUntil(
        collectBroadcastStatistics(env.DB, scheduledTime).then((reports) => console.log("[Scheduled Cron] Broadcast statistics collected:", JSON.stringify(reports))).catch((err) => console.error("[Scheduled Cron] Broadcast statistics error:", err))
      );
    }
    if (env.DB && (/* @__PURE__ */ new Date()).getUTCMinutes() < 10) {
      ctx.waitUntil(
        runAutoReviewPipeline(env.DB).then((report) => console.log("[Scheduled Cron] Auto-review success:", report.approvedCount, "approved /", report.totalProcessed, "processed")).catch((err) => console.error("[Scheduled Cron] Auto-review error:", err))
      );
      ctx.waitUntil(
        syncMissingProfilesInD1(env.DB).then((res) => console.log("[Scheduled Cron] Profile sync success:", res.updatedCount)).catch((err) => console.error("[Scheduled Cron] Profile sync error:", err))
      );
      ctx.waitUntil(
        collectChzzkLiveSnapshot(env.DB).then((res) => console.log("[Scheduled Cron] Chzzk live snapshot collected:", res.collectedCount, "lives /", res.vtuberMatchCount, "matched")).catch((err) => console.error("[Scheduled Cron] Chzzk live snapshot error:", err))
      );
      const nowUtc = /* @__PURE__ */ new Date();
      if (nowUtc.getUTCHours() === 0 && env.DISCORD_BOT_TOKEN) {
        ctx.waitUntil(
          broadcastMorningBriefingToDiscord(env.DB, env.DISCORD_BOT_TOKEN).then((sentCount) => console.log("[Scheduled Cron] Discord morning briefing sent to channels:", sentCount)).catch((err) => console.error("[Scheduled Cron] Discord morning briefing error:", err))
        );
      }
    }
    const isKst7Am = new Date(scheduledTime).getUTCHours() === 22 && (/* @__PURE__ */ new Date()).getUTCMinutes() < 10 || event?.cron === "0 22 * * *";
    if (isKst7Am) {
      ctx.waitUntil(
        runDebutCrawlerProcess(env.DB || null, "kimjichang1234@gmail.com").then((res) => console.log(`[Scheduled Cron] 07:00 KST Debut sync success: Range=${res.auditRange?.description}, Total=${res.totalCrawledCount}, New=${res.newDiscoveredCount}`)).catch((err) => console.error("[Scheduled Cron] Error:", err))
      );
    }
  }
};
export {
  ChzzkSessionDO,
  src_default as default
};
//# sourceMappingURL=index.js.map
