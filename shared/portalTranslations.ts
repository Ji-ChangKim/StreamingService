// 서비스 문구만 번역하며 활동명·자기소개 같은 이용자 입력은 원문으로 유지한다.
const rows = String.raw`
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
`.trim().split('\n');

export const PORTAL_TRANSLATIONS: Record<string, readonly [string, string]> = Object.fromEntries(rows.map((row) => {
  const [key, ja, en] = row.split('|||').map((value) => value.replace(/\\n/g, '\n'));
  return [key, [ja, en] as const];
}));

// 동적 값은 번역하지 않고 자리표시자에 그대로 넣는다.
export function translatePortalText(source: string, language: 'ko' | 'ja' | 'en', values: unknown[] = []): string {
  const message = language === 'ko' ? source : PORTAL_TRANSLATIONS[source]?.[language === 'ja' ? 0 : 1] || source;
  return message.replace(/\{(\d+)\}/g, (_, index) => String(values[Number(index)] ?? `{${index}}`));
}
