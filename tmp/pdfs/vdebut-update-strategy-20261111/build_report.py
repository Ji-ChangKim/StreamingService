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
OUT = ROOT / 'output/pdf'
OUT.mkdir(parents=True, exist_ok=True)
TMP = Path(__file__).parent
pdfmetrics.registerFont(TTFont('MG', 'C:/Windows/Fonts/malgun.ttf'))
pdfmetrics.registerFont(TTFont('MGB', 'C:/Windows/Fonts/malgunbd.ttf'))
pdfmetrics.registerFontFamily('MG', normal='MG', bold='MGB')
W,H=A4
M=43
CW=W-2*M
INK=colors.HexColor('#20243B')
MUTED=colors.HexColor('#626A7B')
PURPLE=colors.HexColor('#7050B1')
LIGHT=colors.HexColor('#F4F1FA')
LINE=colors.HexColor('#DFE3EC')
BLUE=colors.HexColor('#F1F5FA')


class Report:
    def __init__(self, name, title, pages):
        self.path=OUT/name
        self.c=canvas.Canvas(str(self.path),pagesize=A4,pageCompression=1)
        self.c.setTitle(title)
        self.c.setAuthor('VDébut 서비스 기획')
        self.c.setSubject('데뷔 공지 기반 정보 확보·화면·기술 통합 업데이트 전략')
        self.total=pages
        self.n=0
        self.bounds=[]

    def p(self,text,y,size=10,leading=16,bold=False,color=INK,x=M,width=CW):
        s=ParagraphStyle('p',fontName='MGB' if bold else 'MG',fontSize=size,
                         leading=leading,textColor=color,wordWrap='CJK',splitLongWords=True)
        p=Paragraph(text,s)
        _,h=p.wrap(width,1000)
        p.drawOn(self.c,x,H-y-h)
        self.bounds.append({'page':self.n,'top':y,'bottom':y+h,'text':text[:70]})
        return y+h

    def rule(self,y):
        self.c.setStrokeColor(LINE);self.c.setLineWidth(.6)
        self.c.line(M,H-y,W-M,H-y)

    def box(self,text,y,size=10.4,bold=False,fill=LIGHT):
        style=ParagraphStyle('b',fontName='MGB' if bold else 'MG',fontSize=size,
                             leading=size*1.6,wordWrap='CJK')
        p=Paragraph(text,style);_,h=p.wrap(CW-28,1000)
        self.c.setFillColor(fill)
        self.c.roundRect(M,H-y-h-26,CW,h+26,7,stroke=0,fill=1)
        self.p(text,y+13,size,size*1.6,bold,x=M+14,width=CW-28)
        self.bounds.append({'page':self.n,'top':y,'bottom':y+h+26,'text':'BOX'})
        return y+h+26

    def sub(self,text,y):
        return self.p(text,y,size=13,leading=20,bold=True)

    def table(self,headers,rows,widths,y,font=9.1):
        def cell(t,head=False):
            return Paragraph(str(t),ParagraphStyle('cell',fontName='MGB' if head else 'MG',
                fontSize=font,leading=font*1.55,wordWrap='CJK',textColor=colors.white if head else INK))
        data=[[cell(t,True) for t in headers]]+[[cell(t) for t in row] for row in rows]
        t=Table(data,colWidths=widths,hAlign='LEFT')
        t.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,0),INK),('VALIGN',(0,0),(-1,-1),'TOP'),
            ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F8F9FC')]),
            ('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),
            ('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9),
            ('LINEBELOW',(0,1),(-1,-1),.4,LINE)
        ]))
        _,h=t.wrap(CW,1000);t.drawOn(self.c,M,H-y-h)
        self.bounds.append({'page':self.n,'top':y,'bottom':y+h,'text':'TABLE'})
        return y+h

    def steps(self,labels,y):
        gap=11;bw=(CW-gap*(len(labels)-1))/len(labels)
        for i,label in enumerate(labels):
            x=M+i*(bw+gap)
            self.c.setFillColor(LIGHT);self.c.roundRect(x,H-y-52,bw,52,5,stroke=0,fill=1)
            self.p(f'{i+1:02d}',y+8,size=8.1,leading=11,bold=True,color=PURPLE,x=x+9,width=bw-18)
            self.p(label,y+24,size=9.2,leading=14,bold=True,x=x+9,width=bw-18)
            if i<len(labels)-1:
                self.p('›',y+18,size=12,leading=16,color=MUTED,x=x+bw+2,width=9)
        return y+52

    def page(self,kicker,title,deck):
        self.n+=1
        self.c.bookmarkPage(f'p{self.n}')
        self.c.addOutlineEntry(title,f'p{self.n}',level=0,closed=False)
        self.p('VDébut  |  업데이트 전략 보고',25,size=8,leading=11,color=MUTED)
        self.p('2026.11.11  ·  v3.0',25,size=8,leading=11,color=MUTED,x=W-M-125,width=125)
        self.rule(47)
        self.p(kicker,65,size=8.5,leading=12,bold=True,color=PURPLE)
        y=self.p(title,86,size=23,leading=32,bold=True)
        y=self.p(deck,y+10,size=10.2,leading=16.5,color=MUTED)
        self.rule(H-45)
        self.p('VDébut  ·  컨셉·화면·기술 통합  ·  기획 제안 / 실행 전',H-32,size=7.3,leading=10,color=MUTED)
        self.p(f'{self.n:02d} / {self.total:02d}',H-32,size=8,leading=10,color=MUTED,x=W-M-41,width=41)
        return y+23

    def end(self):
        self.c.showPage()

    def save(self):
        self.c.save()
        bad=[b for b in self.bounds if b['bottom']>H-56 and b['top']<H-33]
        assert self.n==self.total,(self.n,self.total)
        data={'file':str(self.path),'pages':self.n,'violations':bad,'bounds':self.bounds}
        (TMP/(self.path.stem+'_layout.json')).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
        if bad: raise RuntimeError(json.dumps(bad,ensure_ascii=True))
        print(json.dumps({'file':str(self.path),'pages':self.n,'layout_violations':len(bad)},ensure_ascii=True))


r=Report('VDebut_Update_Strategy_Report_2026-11-11_v3.0.pdf','VDébut 업데이트 전략 보고서 - 컨셉·화면·기술 통합',4)

# 1. 결론과 현황
y=r.page('01  컨셉과 업데이트 결론','데뷔 공지를 찾아, 믿을 수 있는 소개로 쌓습니다',
         '신인 버튜버가 팬을 만나고, 팬은 다음 최애를 발견하는 곳, VDébut.')
y=r.box('<b>추진 결론</b><br/>출처·누가·언제·어디서의 정보를 확보하고,<br/>기존 도감·상세에서 소개·작품·다음 활동까지 이어 줍니다.',y,size=12)
y=r.sub('현재 부족한 부분과 해결 방향',y+20)
y=r.table(['현재 문제','이번 업데이트'],[
 ('신규 발굴과 데이터 부족','이름 없이 찾을 수 있는 데뷔 공지부터 조사. 채널 조회는 발견 후 정보 보강에 사용'),
 ('상세의 입문 정보가 약함','한 줄 소개·공식 채널·일정·소개/대표 자료·최근 영상을 구분해 연결'),
 ('조사·공개·변경 처리가 분리됨','인물·행사·출처·보호값을 연결하고 일정 변경·정정·취소를 계속 반영'),
],[173,CW-173],y+8,font=10)
y=r.sub('첫 출시 범위',y+20)
y=r.p('① 공지 후보 수집·정보 추출·공개/보류 판정<br/>② 기본 소개 보강과 기존 도감·상세 연결<br/>③ 변경 재확인·정정·기존 관심의 기본 정보 연결',y+8,size=10.5,leading=18)
y=r.p('초기에는 우리가 먼저 정보를 채우고, 이후 본인 등록·팬 제보도 같은 소개와 근거에 연결합니다. 새 추천 화면·게임·채팅 분석·새 회원/소유권 관리 화면은 첫 필수 범위에 넣지 않습니다.',y+12,size=10,leading=16.5)
y=r.box('<b>미해결 사항을 명시합니다.</b> X·웹 검색의 정기 조회 권한·쿼터·비용과 실제 발견 성과는 미확인입니다. 자동 발굴이 이미 확보됐다고 보고하지 않으며, 전체 채널 조회나 인기순 목록 확대를 핵심 해법으로 확정하지 않습니다.',y+18,size=9.7,fill=BLUE)
r.end()

# 2. 조사 대상과 자동화
y=r.page('02  어디서 조사하고 무엇을 가져올 것인가','데뷔 공지에서 네 가지 정보를 확보합니다',
         '아래는 조사 대상·검색안입니다. 이번 보고에서 실제 외부 검색을 실행하지 않았습니다.')
y=r.table(['조사 출처','검색·도달 방법','확보할 정보'],[
 ('X 공개 게시물','치지직+버튜버+데뷔<br/>버추얼+첫 방송 등','활동명·예정 일시·방송 링크·작성자·원문. 본인/공식 관계 확인'),
 ('네이버·Google','site:chzzk.naver.com<br/>데뷔 / 첫 방송 버튜버','노출된 공지 원문·채널 주소. 검색 요약만으로 사실 확정 금지'),
 ('치지직 본인 채널의 커뮤니티','X·검색으로 발견한 공식 채널/게시물로 이동','정확한 일시·방송 주소·변경/연기/취소. 전체 커뮤니티 검색을 전제하지 않음'),
 ('SOOP 공식 일정·공식 소속사 공지','지정한 공개 일정/공지의 새 항목 비교','인물·행사·일정·공식 연결. 허용된 수집 방식만 사용'),
],[120,185,CW-305],y,font=9.6)
y=r.sub('반드시 남길 네 가지',y+18)
y=r.table(['출처','누가','언제','어디서'],[
 ('원문·작성자<br/>확인 시각','활동명<br/>공식 채널 식별','일시·시간대<br/>확정/미정','플랫폼<br/>방송 주소'),
],[CW/4]*4,y+8,font=9.9)
y=r.p('공지 발행일과 데뷔일을 구분합니다. 날짜·시각을 추측하지 않고, 재데뷔·이적·모델 공개를 최초 데뷔로 합치지 않습니다.',y+10,size=9.4,leading=15.5)
y=r.table(['자동 처리','사람이 판단'],[
 ('반복 조회 → 새 공지/변경 추출 → 4항목 정리 → 채널/행사 중복 대조 → 조건 충족 공개·보류·재확인','첫 출처·검색어·공개 기준, 공식 작성자-채널 연결·충돌·동일 인물, 표본·삭제·소스 장애'),
],[CW/2]*2,y+14,font=9.6)
y=r.p('현재: X 검색 연결 코드는 있으나 인증·운영 성공은 미확인. 웹 검색 정기 연결·커뮤니티 본문 수집도 확보된 기능이 아닙니다. 미연결 출처는 직접 조사로 남으므로 자동 범위에 넣지 않습니다. 근거 부족 후보는 제한 재확인 후 보류·만료합니다.',y+13,size=9.2,leading=15,color=MUTED)
r.end()

# 3. 화면과 기술의 연결
y=r.page('03  화면 계획 + 기술 계획','확인된 정보를 기존 화면의 이용 가치로 바꿉니다',
         '사용자 화면에 정보를 보여 주는 방식과, 그 정보를 유지할 구조를 함께 설계합니다.')
y=r.table(['화면','바꿀 내용','필요한 기반'],[
 ('도감 목록','누구인지·확인된 일정·플랫폼을 빠르게 비교','채택된 소개 요약·일정 상태·페이지 조회'),
 ('상세 상단','한 줄 소개·공식 채널·예정 일정·관심 저장','안정적인 인물/채널 식별·확정/미정 일정'),
 ('상세 본문','소개/대표 자료와 최근 영상 구분. 소식에 날짜·원문·변경 연결','미디어 역할·행사 이력·항목별 근거·발행/확인일'),
 ('관심 목록','기존 저장 유지. 확보한 일정 변경·최근 자료를 기본형으로 연결','공통 활동/일정과 기기 관심. 확장 피드는 후속'),
 ('기존 관리자','후보·근거·누락·변경 전후·보류 이유를 모아 확인','소스 실행 상태·예외 목록·중지·반영/복구 기록'),
],[78,233,CW-311],y,font=9.8)
y=r.sub('공통 데이터 흐름',y+20)
y=r.steps(['공지·출처','후보·인물','행사·근거','공개 화면'],y+10)
y=r.p('인물과 행사를 분리해 시각 미정도 후보로 보존합니다. 같은 채널·행사의 중복을 막고, 직접 확정한 값은 보호합니다. 공개 후에도 연기·취소·정정·삭제를 같은 기록에 반영합니다.',y+12,size=10,leading=16.5)
y=r.box('<b>기술 원칙</b>  기존 Worker·D1·프로필·미디어·관리자 기능을 재사용합니다. 수집은 화면 밖에서 실행하고 화면은 마지막 정상 공개 데이터·캐시를 읽습니다. 변경분만 저장하며 원본 영상/이미지 대량 복제·방문별 AI·개별 아트 제작은 필수로 넣지 않습니다.',y+16,size=9.7)
y=r.p('<b>유지 범위:</b> 메인 상단 하이라이트·실제 캘린더·PortalStage 연결·Header/Footer의 구성·디자인·동작은 유지합니다. 목록/상세 변경은 해당 본문에 한정하고, 정확한 지원 일정만 기존 캘린더로 연결합니다.',y+15,size=9.6,leading=16)
r.end()

# 4. 실행 순서와 비용
y=r.page('04  개발 순서·비용·다음 숙제','공지 확보부터 화면 연결·지속 운영까지',
         '담당자와 Codex 공동 진행안입니다. 현재는 보고 문서 작성만 완료했습니다.')
y=r.table(['순서','할 일','완료 기준'],[
 ('0 원천 정리','검색/공지 경로·권한·쿼터·요금·기존 필드 확인','4항목 확보와 자동/직접 범위를 실제 입력으로 설명. 외부 확인 미실행'),
 ('1 수집 기반','원문 키·후보·인물/행사 중복·실행 상태','중복 없음. 실패·신규 없음·부분 수집 구분'),
 ('2 보강·공개','공식 채널·자료·4항목 보강, 공개/보류·정정·복구','임의 값 보완 없음. 충돌·취소·삭제 처리'),
 ('3 화면 연결','도감·상세·기존 관심의 기본 정보 연결','소개·공식 콘텐츠·일정 확인. 기존 화면 보존'),
 ('4 지속 운영','자동 갱신 + 담당자의 예외/표본 판단','재확인 상한·소스 중지·노후 정보·실비 확인'),
],[76,226,CW-302],y,font=9.4)
y=r.sub('현재 월 실비: 미확정 / 인건비 제외',y+18)
y=r.table(['지출 항목','현재 계획과 미확인 사항'],[
 ('서버·DB','기존 환경 재사용. 공유 잔여량·추가 DB/CPU·로그/백업 초과료는 확인 전'),
 ('X·웹 검색·원문 조회','접근 권한·API 이용료·검색/본문 쿼터 미확정. 무료·무제한 자동화 전제 금지'),
 ('신규 부가 서비스','SSAPI·채팅 서버·벡터 DB·외부 AI·외주 아트는 첫 필수 계약에서 제외'),
],[139,CW-139],y+8,font=9.4)
y=r.box('<b>이전 월 1만원/3만원과 인기 목록 탐색 기반 호출량은 이번 공지 수집안의 견적으로 사용하지 않습니다.</b> 실제 비용은 기존 기본료 + 필요 플랜 차액 + 한도 초과료 + 채택한 검색/API 요금으로 산정합니다.',y+14,size=9.3,fill=BLUE)
y=r.p('<b>직접 할 숙제:</b> 담당자는 출처·공개 기준과 주요 충돌을 판단하고, Codex와 함께 입력/필드 대응·실행 범위·비용을 정리합니다. 매 후보의 전수 수작업 조사 의무는 만들지 않습니다.',y+12,size=9.4,leading=15.5)
y=r.p('<b>성과:</b> 유효 공지·4항목 확보율·입문 자료 보유·최신성·예외 시간·순증 비용. 등록 숫자나 가상의 자동화율로 대체하지 않습니다.',y+9,size=9.3,leading=15)
r.p('기준: 2026.11.11 로컬 소스·기획 / 통합 전략 33번 v3.0. 기존 상세·등록 조회·보고 소스·데이터 설계 참조. 개발·외부 검색·수집·DB 반영·계약·배포는 미실행. 이전 보고는 보존 자료입니다.',y+10,size=8.3,leading=13,color=MUTED)
r.end()
r.save()
