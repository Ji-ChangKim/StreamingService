from pathlib import Path
import json
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle


ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'output/pdf/VDebut_Concept_Report_2026-11-11_v1.1.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Malgun', 'C:/Windows/Fonts/malgun.ttf'))
pdfmetrics.registerFont(TTFont('MalgunBold', 'C:/Windows/Fonts/malgunbd.ttf'))
pdfmetrics.registerFontFamily('Malgun', normal='Malgun', bold='MalgunBold')
W, H = A4
M = 44
CW = W - M * 2
INK = colors.HexColor('#20243B')
MUTED = colors.HexColor('#626A7B')
PURPLE = colors.HexColor('#7050B1')
PINK = colors.HexColor('#DA719F')
LINE = colors.HexColor('#DFE3EC')
LIGHT = colors.HexColor('#F5F3FA')
BLUE_LIGHT = colors.HexColor('#F3F6FB')
WHITE = colors.white
C = canvas.Canvas(str(OUT), pagesize=A4, pageCompression=1)
C.setTitle('VDébut 서비스 고도화 컨셉 보고서')
C.setAuthor('VDébut 서비스 기획')
C.setSubject('현황 진단·핵심 문제·실행 과제를 포함한 서비스 고도화')
C.setCreator('VDébut Concept Report')
CHECKS = []
PAGE = 0


def para(text, x, top, width, size=10.2, leading=16.8, bold=False, color=INK, align=0):
    style = ParagraphStyle(
        'p', fontName='MalgunBold' if bold else 'Malgun', fontSize=size,
        leading=leading, textColor=color, wordWrap=None, alignment=align,
        spaceBefore=0, spaceAfter=0, allowWidows=0, allowOrphans=0,
    )
    obj = Paragraph(text, style)
    _, height = obj.wrap(width, 900)
    obj.drawOn(C, x, H - top - height)
    CHECKS.append(dict(page=PAGE, top=top, bottom=top+height, left=x, right=x+width,
                       text=text[:90]))
    return top + height


def line(top, x=M, width=CW, color=LINE):
    C.setStrokeColor(color)
    C.setLineWidth(.6)
    C.line(x, H-top, x+width, H-top)


def rect(x, top, width, height, fill=LIGHT, radius=7, stroke=None):
    C.setFillColor(fill)
    C.setStrokeColor(stroke or fill)
    C.roundRect(x, H-top-height, width, height, radius, fill=1, stroke=bool(stroke))


def label(text, top, x=M):
    return para(text, x, top, CW, size=8.7, leading=12, bold=True, color=PURPLE)


def heading(text, top, size=15.5):
    return para(text, M, top, CW, size=size, leading=size*1.5, bold=True)


def body(text, top, **kwargs):
    return para(text, M, top, CW, **kwargs)


def note(text, top, height=None):
    style = ParagraphStyle('note', fontName='Malgun', fontSize=9.2, leading=15,
                           wordWrap=None, textColor=MUTED)
    p = Paragraph(text, style)
    _, ph = p.wrap(CW-28, 900)
    height = height or ph + 26
    rect(M, top, CW, height, BLUE_LIGHT)
    para(text, M+14, top+13, CW-28, size=9.2, leading=15, color=MUTED)
    return top+height


def table(headers, rows, widths, top, font=9.25):
    def cell(text, header=False):
        return Paragraph(text, ParagraphStyle(
            'cell', fontName='MalgunBold' if header else 'Malgun', fontSize=font,
            leading=font*1.6, textColor=WHITE if header else INK, wordWrap=None))
    data = [[cell(t, True) for t in headers]] + [[cell(t) for t in row] for row in rows]
    t = Table(data, colWidths=widths, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), INK),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, colors.HexColor('#F8F9FC')]),
        ('LINEBELOW', (0,1), (-1,-1), .4, LINE),
    ]))
    _, h = t.wrap(CW, 900)
    t.drawOn(C, M, H-top-h)
    CHECKS.append(dict(page=PAGE,top=top,bottom=top+h,left=M,right=W-M,text='TABLE'))
    return top+h


def page(section=None, title=None, deck=None):
    global PAGE
    PAGE += 1
    C.bookmarkPage(f'page-{PAGE}')
    C.addOutlineEntry(title or '보고 요지', f'page-{PAGE}', level=0, closed=False)
    C.setFillColor(WHITE)
    C.rect(0, 0, W, H, fill=1, stroke=0)
    C.setFillColor(PURPLE)
    C.rect(M, H-31, 25, 3, fill=1, stroke=0)
    para('VDébut  |  서비스 고도화 컨셉 보고서', M+34, 25, CW-190, size=8, leading=11, color=MUTED)
    para('2026.11.11  ·  v1.1', W-M-138, 25, 138, size=8, leading=11, color=MUTED, align=2)
    line(H-43)
    para('VDébut  ·  제품 방향성 및 단계별 추진안', M, H-32, CW-60, size=7.7, leading=10, color=MUTED)
    para(f'{PAGE:02d} / 09', W-M-55, H-32, 55, size=8, leading=10, color=MUTED, align=2)
    if section:
        label(section, 66)
        end = heading(title, 88, size=22)
        if deck:
            end = body(deck, end+12, size=10.2, leading=17, color=MUTED)
        return end+26
    return 65


def end_page():
    C.showPage()



# 1. 첫 장에서 현재 진단과 해야 할 일을 함께 보고한다.
page()
C.drawImage(str(ROOT/'frontend/public/logo.png'),M,H-143,width=172,height=63,mask='auto',preserveAspectRatio=True)
label('CONCEPT & ACTION REPORT',164)
y=para('발견에서 관심으로,<br/>계속 찾아오는 버튜버 플랫폼',M,185,CW,size=24,leading=34,bold=True)
y=para('신인 버튜버가 팬을 만나고,<br/>팬은 다음 최애를 발견하는 곳, VDébut.',M,y+18,CW,size=13.8,leading=22,bold=True,color=PURPLE)
y=body('<b>진단 요지</b>  도감·영상·관심 저장·위키 기반은 갖추고 있다. 다만 입문용 대표 자료, '
       '선택 이유가 있는 발견, 저장 이후의 새 활동이 하나의 이용 흐름으로 이어지는 구조는 부족하다.',y+21,size=10.7,leading=18)
y+=23;line(y);y+=18
for num,title,desc in [
 ('01','현재 문제','최근 영상과 입문 대표작의 역할이 불분명하고, 관심 목록은 저장한 사람의 재열람에 머문다.'),
 ('02','우선 조치','상세 입문 → 오늘의 발견 → 공통 활동 → 관심 소식 순서로 기존 자산을 연결한다.'),
 ('03','다음 숙제','개발 전 현황표·선정 기준·활동/측정 정의를 만들고, 과제별 담당·산출물·완료 기준을 정한다.'),
]:
    para(num,M,y+1,28,size=10.5,leading=17,bold=True,color=PURPLE)
    para(title,M+40,y,CW-40,size=11.1,leading=17,bold=True)
    bot=para(desc,M+40,y+24,CW-40,size=10,leading=16,color=MUTED);y=bot+21
note('개정판은 현재 구조의 확인 사실과 문제의 영향, 실행 과제를 보강했다. 진단은 로컬 소스·내부 기록 기준이며 '
     '실제 이탈률·재방문율·자료 보유율·현재 청구액은 확인하지 않았다. 개발·외부 작업은 미실행이다.',y+2)
end_page()

# 2. 이미 갖춘 것과 아직 연결되지 않은 것을 사실로 구분한다.
y=page('01  /  현재 상황 분석','기본 기능은 확보, 이용 흐름의 연결은 미완성',
       '화면이 있다는 사실과 그 화면이 입문·발견·재방문을 충분히 돕는지는 구분해서 판단해야 한다.')
y=table(['영역','현재 소스에서 확인한 사실','현재 판단'],[
 ('상세·영상 [E1]','활동 중인 상세의 ‘추천 영상’은 채널의 최근 영상이다. 등록 자료에는 별도 대표 표시가 있다.','영상 제공 기반은 있다. 최신 자료와 입문 대표작의 역할 연결을 보완해야 한다.'),
 ('도감 [E2]','검색·태그/언어·국가·플랫폼 필터와 데뷔/최근/이름 정렬을 제공한다.','찾을 수는 있지만 선택 이유와 다음 후보를 만나는 안내형 발견은 추가 과제다.'),
 ('관심 [E3]','관심 ID를 기기에 저장하고, 기존 도감에 관심 필터를 적용해 같은 목록을 보여 준다.','저장·재열람은 가능하다. 마지막 확인 이후 새 활동 요약은 현재 구조에 없다.'),
 ('활동 기록 [E4]','방송 이력은 최근 30일·최대 30개를 조회한다. 주요 소식은 제목·URL, 조회 영상은 공개 시각을 갖는다.','기록이 전혀 없는 것은 아니다. 자료 종류별 날짜·표현·조회 단위를 연결해야 한다.'),
 ('편집·공유','위키 편집·변경 이력·일부 응원·소개 주소 공유 기능이 있다.','새 운영 체계를 만들기보다 출처·정정·대표 콘텐츠 연결에 재사용한다.'),
],[91,229,CW-320],y,font=9.1)
y=heading('아직 확보하지 않은 운영 현황',y+25)
y=body('공개 프로필 수와 자료 보유율, 실제 검색·소개·원문 이동의 전환, 관심 저장 후 재방문, '
       '실제 운영비의 기준선은 이번 보고에서 확인하지 않았다. 이 값은 추정 수치로 채우지 않고 A1·A3의 산출물로 정리한다.',y+11,size=10,leading=17)
note('분석 범위: 2026-11-11 기준 로컬 구현과 내부 문서. 운영 사이트 접속·운영 DB 조회·사용자 행동 측정은 하지 않았다. '
     '[E1]~[E4]의 구체적인 확인 위치는 마지막 쪽에 수록했다.',y+20)
end_page()

# 3. 문제, 영향, 우선순위를 연결한다.
y=page('02  /  문제와 영향','어디에서 이용 경험이 끊기는가',
       '아래 영향은 현재 구조에 대한 제품 기획 판단이다. 실제 이탈이나 매출 손실이 측정됐다는 뜻은 아니다.')
y=table(['문제','현재 구조의 한계','사용자·사업에 미치는 영향','우선순위'],[
 ('P1<br/>입문','최신 영상과 입문 대표작의 목적이 화면에서 분리되지 않음.','처음 온 사람이 무엇부터 봐야 하는지 판단하기 어려울 수 있음.','첫 개선'),
 ('P2<br/>발견','목록 검색·필터 중심이며, 선택 이유와 다음 후보를 안내하는 경험이 부족.','이미 아는 이름의 조회에서 새로운 최애 발견으로 확장하는 계기가 약함.','첫 개선'),
 ('P3<br/>관심','관심 저장은 가능하지만 새 활동·마지막 확인 이후 변화가 묶이지 않음.','저장 이후 다시 들어왔을 때 얻는 새로운 가치가 부족함.','첫 개선'),
 ('P4<br/>활동','소식·영상·방송의 날짜와 항목 구조가 달라 공통 활동으로 다루기 어려움.','과거 자료를 새 소식으로 오인하거나 중복 노출할 위험. 관심 피드 확장에도 제약.','공통 기반'),
 ('P5<br/>운영 판단','자료 충실도·전환·재방문·비용의 기준선이 이 보고에 미확보.','개선 범위와 성과·운영 부담을 숫자로 비교할 근거가 부족함.','착수 전 정리'),
],[61,172,200,CW-433],y,font=9.2)
y=heading('원인과 우선순위의 연결',y+25)
y=body('현재 과제는 화면 수를 늘리는 것보다, 이미 가진 정보를 사용 목적에 맞춰 연결하는 일이다. '
       '대표작 기준과 활동 날짜를 먼저 정리해야 상세·발견·관심 소식이 일관되게 동작한다. '
       '새 채팅 수집이나 별도 게임을 먼저 도입하면 이 연결 과제가 뒤로 밀린다.',y+11,size=10.2,leading=17)
note('따라서 준비 과제 A1~A3를 먼저 정리하고 B1~B5의 고도화를 순서대로 진행한다. '
     '기존 메인 하이라이트·캘린더·상하단 공통 영역은 유지한다.',y+21)
end_page()

# 4. 문제를 해결하는 컨셉을 구체적 경험으로 연결한다.
y=page('03  /  개선 방향과 서비스 컨셉','입문·발견·관심을 하나의 흐름으로',
       '핵심 자산은 한 사람의 매력과 활동이 계속 쌓이는 대표 페이지다. 첫 재미 기능은 도감의 ‘오늘의 발견’이다.')
gap=11;bw=(CW-gap*3)/4
for i,(title,desc) in enumerate([('발견','검색·공유·데뷔 정보'),('알아가기','소개·대표 콘텐츠'),('관심','저장·공식 방송 이동'),('다음 활동','새 소식·가까운 일정')]):
    x=M+i*(bw+gap);rect(x,y,bw,79,LIGHT if i%2==0 else BLUE_LIGHT)
    para(title,x+11,y+14,bw-22,size=11.4,leading=18,bold=True)
    para(desc,x+11,y+43,bw-22,size=8.6,leading=14,color=MUTED)
y+=105
for tag,title,desc in [
 ('P1','상세페이지를 입문 페이지로','한 줄 소개·확인된 특징·대표작을 보여 주고, 최신 영상은 별도 성격으로 안내한다. 공식 채널·관심·공유로 이어지게 한다.'),
 ('P2','오늘의 발견으로 한 사람 더 만나기','조건 선택 또는 둘러보기로 최대 3명을 제시한다. 실제 선택 이유·대표 자료·다른 후보 보기를 제공하고 최근 반복을 줄인다.'),
 ('P3·P4','관심 이후의 변화 연결','날짜·원문·인물 연결을 갖춘 활동에서 새 콘텐츠와 일정을 모은다. 과거 자료 첫 수집과 실제 새 공개를 구분한다.'),
]:
    label(tag,y);y=heading(title,y+19,size=13.5);y=body(desc,y+9,size=10,leading=17);y+=22
note('유입은 소개 공유·이름/데뷔 검색·기존 캘린더에서 만들고, 재방문은 관심 대상의 실제 새 활동에서 만든다. '
     '운영자가 매일 추천 묶음·새 카드를 수작업으로 제작하는 구조는 필수로 두지 않는다.',y)
end_page()

# 5. 개발 전 준비 숙제를 산출물과 완료 기준으로 제시한다.
y=page('04  /  먼저 해야 할 숙제','개발 전에 무엇을 정리해야 하는가',
       '준비 과제의 결과물을 만든 뒤 화면 개발에 연결한다. 아래 항목은 계획이며 이번에 실제 데이터 조회나 외부 확인을 수행한 것은 아니다.')
for code,title,owner,work,output,done in [
 ('A1','현재 자료 현황표 작성','서비스 책임자 + Codex(데이터)',
  '공개 대상의 소개·태그/언어·대표작·일정·최근 활동 지원 범위와 누락을 구분한다.',
  '자료 보유 현황표·소스별 지원 범위표',
  '보유/미보유/미확인을 분리하고, 비율에는 대상 수·확인 시점을 함께 기록.'),
 ('A2','입문과 발견의 선정 기준 결정','서비스 책임자 + Codex(기획)',
  '대표작·최신 영상, 발견 후보·선택 이유, 자료가 없을 때의 대체 동작을 정한다.',
  '대표 콘텐츠·후보 선정 기준서',
  '대표작 없는 사람·조건 부족·최근 후보 반복의 처리 기준까지 명시.'),
 ('A3','새 활동·이용 지표·비용 정의','서비스 책임자 + Codex(기획·데이터)',
  '새 공개·단순 수정·과거 자료 연결을 구분하고, 기록할 행동과 확인할 비용 항목을 정한다.',
  '활동/이용 사건 정의표·비용 확인표',
  '미확인 운영 수치와 확인 경로, 클릭과 실제 시청의 구분을 명시.'),
]:
    para(code,M,y,35,size=12,leading=18,bold=True,color=PURPLE)
    para(title,M+44,y,CW-44,size=12.5,leading=20,bold=True)
    bot=para('담당 역할 제안  |  '+owner,M+44,y+27,CW-44,size=8.7,leading=14,color=MUTED)
    bot=para(work,M+44,bot+8,CW-44,size=9.8,leading=16)
    bot=para('<b>산출물</b>  '+output+'<br/><b>완료 기준</b>  '+done,M+44,bot+9,CW-44,size=9.2,leading=15)
    y=bot+20;line(y);y+=21
note('역할 배분은 제안이다. 서비스 정책·우선순위는 서비스 책임자가 판단하고, 자료 정리와 향후 개발은 책임자와 Codex가 함께 진행한다. '
     '새 인력·외주를 가정하지 않으며 실제 담당 지정·착수일은 별도 결정한다.',y-3)
end_page()

# 6. 개발 이후 숙제는 원인과 산출물에 대응한다.
y=page('05  /  고도화 실행 과제','무엇을 만들어야 완료되는가',
       '‘기능을 추가했다’보다 문제를 해결한 동작과 산출물을 기준으로 완료를 판단한다. 현재 실행 상태는 모두 미착수다.')
y=table(['ID','해야 할 일 / 선행','담당 제안','산출물·완료 기준'],[
 ('B1','상세 입문 흐름<br/>A1·A2 후 / P1 해결','책임자·Codex<br/>공동 개발','대표 콘텐츠·특징·공식 이동·관심 연결. 데뷔 전/활동 중/대표작 없음/조회 실패를 구분.'),
 ('B2','오늘의 발견<br/>B1 후 / P2 해결','책임자·Codex<br/>공동 개발','최대 3명·실제 이유·다른 후보 보기. 최근 반복과 조건 부족을 처리하고 상세와 같은 근거 사용.'),
 ('B3','공통 활동 연결<br/>A1·A3 후 / P4 해결','책임자·Codex<br/>공동 개발','원문 키·인물·발생/확인일·삭제/중복 상태. 과거 자료 첫 연결을 새 공개로 처리하지 않음.'),
 ('B4','관심 소식 기본형<br/>B3 후 / P3 해결','책임자·Codex<br/>공동 개발','저장 대상의 새 활동·가까운 일정·기기 마지막 확인. 변화 없음·조회 실패·새 활동을 구분.'),
 ('B5','공개 전 연결·기준선 확인<br/>B1~B4 후 / P1~P5','책임자·Codex<br/>공동 확인','흐름 점검표·이용 지표 정의/확인표·비용표. 기존 메인 보존과 운영비 포함/초과 항목 확인.'),
],[35,158,82,CW-275],y,font=9.05)
y=heading('권장 실행 순서',y+26)
y=body('<b>A1 → A2·A3 → B1 → B2 → B3 → B4 → B5</b><br/>'
       'B3는 자료 정의가 끝나면 독립 준비할 수 있다. 일정은 착수일과 현재 자료 상태를 확인한 뒤 대응시키며, '
       '임의의 완료 날짜나 개발 일수를 약속하지 않는다.',y+11,size=10,leading=17)
note('첫 공개에서 제공할 것은 입문·발견·관심의 기본 연결이다. 계정 동기화·외부 알림·전체 플랫폼 수집·채팅 분석은 후속 범위로 관리한다. '
     '이 표는 개발 계획이며 이번 작업에서 구현·배포하지 않았다.',y+21)
end_page()

# 7. 큰 방향과 유입/재방문의 연결을 유지한다.
y=page('06  /  단계별 성장','지금의 연결 과제가 장기 자산이 된다',
       '첫 고도화에서 소개·콘텐츠·관심을 연결하고, 이후 활동과 인물 기록이 쌓이는 방향으로 성장한다.')
phases=[
 ('1단계','발견·입문의 완성','신인을 알아보고 첫 관심을 갖는 곳','상세 대표 콘텐츠·오늘의 발견·관심 기본 소식','인물 소개·대표 자료·안정적인 주소'),
 ('2단계','관심을 이어가는 곳','좋아하는 사람의 다음 활동을 확인하는 곳','공식 일정·활동 종류·기간·여러 관심 대상의 묶음 피드','날짜·출처가 있는 공통 활동과 관심 연결'),
 ('3단계','활동이 축적되는 도감','채널이나 활동명이 바뀌어도 같은 사람을 찾는 곳','인물·복수 채널·공식 팀·주요 작품·활동 기록 연결','장기간 유지되는 인물 정보와 공식 활동 이력'),
 ('4단계','팬 활동의 출발점','입문과 다음 최애 탐색의 일상적인 입구','자동 활동 돌아보기·공유·선택적 계정 동기화','팬과 버튜버가 함께 유지하는 정보·관심·활동'),
]
for i,(stage,title,role,work,asset) in enumerate(phases):
    C.setFillColor(PURPLE if i==0 else colors.HexColor('#C8BEDF'));C.circle(M+6,H-y-10,4,fill=1,stroke=0)
    if i<3:
        C.setStrokeColor(LINE);C.setLineWidth(1);C.line(M+6,H-y-18,M+6,H-y-111)
    para(stage,M+25,y,CW-25,size=8.6,leading=13,bold=True,color=PURPLE)
    para(title,M+25,y+21,CW-25,size=13.5,leading=20,bold=True)
    para(role,M+25,y+47,CW-25,size=9.5,leading=16,bold=True)
    bot=para(work,M+25,y+69,CW-25,size=9.4,leading=16)
    para('축적 자산  |  '+asset,M+25,bot+6,CW-25,size=8.5,leading=14,color=MUTED)
    y+=123
note('유입: 데뷔·검색·소개 주소 공유 / 재미: 다음 사람과 대표 콘텐츠를 발견 / 재방문: 관심 대상의 실제 새 활동. '
     '이 연결이 장기적으로 ‘버튜버 입문 시 먼저 찾는 곳’의 역할을 만든다.',y+3)
end_page()

# 8. 비용과 운영 과제를 구체화한다.
y=page('07  /  운영과 비용','수작업을 줄이고, 확인할 비용을 명시',
       '기존 프로필·미디어·관심·위키를 재사용한다. 새로운 데이터 계약이나 반복 제작을 첫 고도화의 필수 조건으로 두지 않는다.')
y=table(['영역','운영 방식','해야 할 관리'],[
 ('리소스','소개·대표작·특징을 공통 템플릿으로 표현','없는 정보 생성 제외. 출처·대표작 선택·이미지 사용 범위 유지.'),
 ('활동 데이터','날짜·원문·인물·변경 상태를 공통으로 연결','첫 수집/새 공개·중복·삭제·조회 실패를 구분.'),
 ('조회·성능','필요한 자료의 묶음 조회·재사용·지연 로딩','실제 요청량·응답 시간·갱신 실패 범위 확인.'),
 ('운영비','기존 웹·DB 기본료와 신기능 증가분 분리','현재 청구·포함량·외부 호출·전송·로그 초과분 확인.'),
],[83,227,CW-310],y,font=9.2)
y=heading('비용 확인도 숙제로 관리',y+25)
y=body('<b>A3</b>에서 비용 항목과 확인 경로를 정하고 <b>B5</b>에서 실제 사용량·현재 청구와 대조한다. '
       '신규 채팅 서버·SSAPI·외부 AI·별도 아트 외주는 첫 단계의 필수 도입에서 제외한다. '
       '개발·운영 인건비는 현금 지출 산정에서 제외한다.',y+11,size=10.1,leading=17)
y+=20;rect(M,y,CW,91,LIGHT)
para('계획 가정  |  현재 이용 규모·확정 견적 아님',M+14,y+12,CW-28,size=9,leading=14,bold=True,color=PURPLE)
for i,(value,desc) in enumerate([('일 이용자 300명','산정용 규모'),('월 27만 행','추가 DB 읽기'),('월 10.92만 행','추가 DB 쓰기')]):
    x=M+14+i*(CW-28)/3
    para(value,x,y+37,(CW-28)/3-8,size=12,leading=18,bold=True)
    para(desc,x,y+62,(CW-28)/3-8,size=8.5,leading=13,color=MUTED)
y+=112
note('상세·발견 월 2.7만 회, 관심 요약 1.8만 회, 소스 검사 1.2만 회 등을 둔 내부 산정 예시다. '
     '현재 운영 계정·잔여 한도·단가를 조회하지 않아 확정 월 비용은 제시하지 않는다. '
     '지원 데이터·현재 사용량·추가 호출을 확인한 뒤 집행 예산으로 정리한다.',y)
end_page()

# 9. 상급자가 판단할 사항과 근거를 함께 남긴다.
y=page('08  /  의사결정과 근거','방향에 더해, 책임과 산출물을 정한다',
       '큰 서비스 방향은 유지한다. 이번 개정은 현재 문제와 개선 과제, 다음에 해야 할 숙제를 보강한 보고다.')
y=table(['검토·합의 사항','제안'],[
 ('우선순위','P1 입문·P2 발견·P3 관심 연결을 첫 개선으로 묶고, P4 활동 구조와 P5 기준선을 함께 준비.'),
 ('숙제와 역할','서비스 책임자는 정책·우선순위, 책임자와 Codex는 자료 정리·공동 개발. A/B 과제의 산출물로 진행 관리.'),
 ('공개 범위','상세 입문·오늘의 발견·기존 자료의 관심 기본 소식. 신규 계정·채팅·전체 플랫폼 수집은 후속.'),
],[113,CW-113],y,font=9.4)
y=heading('개선 효과를 확인할 때 볼 항목',y+22)
y=body('자료 현황표의 필수 항목 충실도, 발견→소개→대표 콘텐츠/공식 원문 이동, 관심 저장과 이후 재열람, '
       '갱신 실패·중복·요청량·추가 비용을 구분한다. 현재 기준선과 목표치는 미확정이며 A1·A3에서 정의하고 B5에서 확인한다. '
       '원문 클릭을 실제 시청·팬 증가로 표현하지 않는다.',y+10,size=9.5,leading=16)
y=heading('근거와 진단 범위',y+21,size=12.5)
refs=[
 '[E1] WikiContent.tsx:100·121 / portalChannelMedia.ts:32·43 / portal.ts:20 - 최근 영상 경로와 별도 대표 표시.',
 '[E2] WikiContent.tsx:129·211·247 - 검색·필터·정렬과 현재 목록 구성.',
 '[E3] PortalApp.tsx:62 / WikiPages.tsx:13·36 - 관심 ID 기기 저장과 관심 필터 목록.',
 '[E4] portal.ts:41 / profileDetails.ts:34 / WikiActivity.tsx:19 - 소식 필드·영상 공개 시각·방송 이력.',
]
y+=10
for ref in refs:y=body(escape(ref),y+5,size=8.15,leading=13,color=MUTED)
y=body('문서 근거: 전체 고도화 기획 v2.2 · 데이터 설계 v2.1 · 개발 목록/숙제 v2.1 · 첫 고도화 범위 v2.1 (2026.11.11).',y+14,size=8.2,leading=13,color=MUTED)
note('확인 위치는 프로젝트 내 로컬 파일 기준이며 근거 파일명과 확인 위치를 축약 표기했다. '
     '운영 DB·현재 배포·행동 지표는 새로 확인하지 않았다. 이번 작업은 보고서와 기획 문서 수정이며 '
     '개발·외부 문의·신청·계약·데이터 수집·배포는 수행하지 않았다.',y+19)
end_page()

C.save()
violations=[r for r in CHECKS if r['bottom']>H-53 and not r['top']>=H-33]
check_path=Path(__file__).parent/'layout_check.json'
check_path.write_text(json.dumps({'pages':PAGE,'bounds':CHECKS,'violations':violations},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pdf':str(OUT),'pages':PAGE,'layout_violations':violations},ensure_ascii=True))
