import json, math, pathlib, re, sys
sys.stdout.reconfigure(encoding='utf-8')
from datetime import datetime
from zoneinfo import ZoneInfo
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader

ROOT=pathlib.Path(__file__).resolve().parents[2]
WORK=pathlib.Path(__file__).resolve().parent
OUT=ROOT/'output/pdf/vdebut-automation-flow-2026-11-12.pdf'
OUT.parent.mkdir(parents=True,exist_ok=True)
pdfmetrics.registerFont(TTFont('KR',r'C:\Windows\Fonts\malgun.ttf'))
pdfmetrics.registerFont(TTFont('KRB',r'C:\Windows\Fonts\malgunbd.ttf'))
W,H=A4
INK=HexColor('#203448');MUTED=HexColor('#536577');LINE=HexColor('#A6B3BE')
TEAL=HexColor('#087F8C');AMBER=HexColor('#99600D');PALE=HexColor('#F1F5F8');HOLD=HexColor('#FFF4DC');GREEN=HexColor('#E6F4EE')
live=json.loads((WORK/'live-test.json').read_text(encoding='utf-8'))
assert live['passed']==live['total']==11
testlog=(WORK/'tests.log').read_text(encoding='utf-8-sig')
assert re.search(r'# pass 70\b',testlog) and re.search(r'# fail 0\b',testlog)
checked=datetime.fromisoformat(live['checkedAt'].replace('Z','+00:00')).astimezone(ZoneInfo('Asia/Seoul')).strftime('%Y.%m.%d %H:%M KST')
c=canvas.Canvas(str(OUT),pagesize=A4)
c.setTitle('VDébut 자동화 프로세스와 테스트 결과')
c.setAuthor('VDébut')

def text(x,top,value,size=10,font='KR',color=INK):
    c.setFillColor(color);c.setFont(font,size);c.drawString(x,H-top-size*.82,value)

def lines_for(value,width,size,font='KR'):
    result=[]
    for paragraph in value.split('\n'):
        line=''
        for char in paragraph:
            if pdfmetrics.stringWidth(line+char,font,size)>width:
                result.append(line);line=char
            else:line+=char
        result.append(line)
    return result

def paragraph(x,top,width,value,size=9,leading=None,color=MUTED):
    leading=leading or size*1.5
    rows=lines_for(value,width,size)
    for i,line in enumerate(rows):text(x,top+i*leading,line,size,color=color)
    return len(rows)*leading

def box(x,top,width,height,title,body='',tone='normal',size=10):
    fill=HOLD if tone=='hold' else GREEN if tone=='success' else PALE
    c.setFillColor(fill);c.setStrokeColor(HexColor('#D7E0E6'));c.setLineWidth(.6)
    c.roundRect(x,H-top-height,width,height,5,fill=1,stroke=1)
    title_rows=lines_for(title,width-16,size,'KRB')
    for i,row in enumerate(title_rows):
        c.setFont('KRB',size);c.setFillColor(INK);c.drawCentredString(x+width/2,H-top-11-size*.82-i*(size+3),row)
    if body:
        body_top=top+13+len(title_rows)*(size+3)
        rows=lines_for(body,width-16,8.2)
        assert body_top-top+len(rows)*11<=height-4,(title,height,rows)
        for i,row in enumerate(rows):
            c.setFont('KR',8.2);c.setFillColor(MUTED);c.drawCentredString(x+width/2,H-body_top-8.2*.82-i*11,row)

def arrow(points,color=LINE,label=None,label_at=None):
    c.setLineWidth(.9);c.setStrokeColor(color);p=c.beginPath();p.moveTo(points[0][0],H-points[0][1])
    for x,y in points[1:]:p.lineTo(x,H-y)
    c.drawPath(p)
    (x0,y0),(x1,y1)=points[-2:];theta=math.atan2(y1-y0,x1-x0);size=5
    p=c.beginPath();p.moveTo(x1,H-y1)
    p.lineTo(x1-size*math.cos(theta-.5),H-(y1-size*math.sin(theta-.5)))
    p.lineTo(x1-size*math.cos(theta+.5),H-(y1-size*math.sin(theta+.5)))
    p.close();c.setFillColor(color);c.drawPath(p,fill=1,stroke=0)
    if label and label_at:text(*label_at,label,8,color=color)

def header(number,title,subtitle):
    text(32,26,'VDébut / 운영 자동화',9,'KRB',TEAL)
    text(32,46,title,20,'KRB')
    paragraph(32,75,W-64,subtitle,9)
    c.setStrokeColor(LINE);c.setLineWidth(.6);c.line(32,H-95,W-32,H-95)
    text(32,H-26,'배포된 동작 기준 · 2026-11-12 · 서비스 화면 변경 없음',8,color=MUTED)
    text(W-58,H-26,f'{number} / 2',8,color=MUTED)

header(1,'자동화 프로세스 플로우','조사 → 후보 저장 → 검증 → 반영 → 공개 재확인. 보류·한도 도달·변경 없음은 분리해 기록한다.')
x=165;w=245;mid=x+w/2
nodes=[(106,34,'정기 실행',''),(158,38,'실행 가능한가?',''),(216,40,'공개 원천 조회',''),(276,42,'고유 채널로 후보 저장·중복 대조',''),(338,38,'소속사 발굴 후보인가?',''),(400,64,'검증 및 빈 항목 보강','신규: 본인 원문·일시·시간대·행사 범위\n기존: 본인 소개·프로필 글의 빈 값만\n공통: 채널·공식 이미지·충돌 검사'),(484,38,'공개할 정보가 달라졌는가?',''),(542,42,'운영 DB에 한 번에 저장',''),(604,42,'공개 응답과 저장값이 일치하는가?',''),(666,48,'반영 확인 완료','방송국 URL · 프로필 · 캘린더')]
for i,(top,height,title,body) in enumerate(nodes):
    box(x,top,w,height,title,body,'success' if i==9 else 'normal',9.6)
    if i<len(nodes)-1:arrow([(mid,top+height),(mid,nodes[i+1][0])],TEAL)
text(175,144,'09시·21시 / 월요일 10시 · 한국시간',8,color=MUTED)
box(430,158,132,52,'종료','중복 실행·운영 중지\n월 70회 한도 도달',size=9)
arrow([(410,177),(430,177)],label='불가',label_at=(412,162))
box(430,338,132,108,'후보 보류 · HOLD','소속사 후보는 현재\n자동 승인 연결 미구현.\n일시·범위 미확인 또는\n운영 정보와 충돌하면\n공개하지 않고 보존.',tone='hold',size=9)
arrow([(410,357),(430,357)],AMBER,label='예',label_at=(416,343))
arrow([(410,432),(430,432)],AMBER)
box(430,484,132,69,'변경 없음','공개 프로필·변경 이력\n재저장하지 않음.\n조회 결과만 기록.',size=9)
arrow([(410,503),(430,503)],label='없음',label_at=(411,488))
box(430,604,132,76,'공개 확인 대기','저장은 됐으나\n공개 재확인에 실패.\n등록 완료로 집계 안 함.',tone='hold',size=9)
arrow([(410,625),(430,625)],AMBER,label='실패',label_at=(411,610))
text(33,216,'실제 조사 원천',9,'KRB',TEAL)
paragraph(33,235,112,'SOOP 공식 캘린더\n기존 공개 시트·X\n카론 공식 공지 목록\n레버니아 공식 X\n\n검색엔진 전체 검색이나\n치지직 전 채널 탐색은\n현재 수집 범위에 없음.',8.3,12)
box(33,482,112,87,'한도 도달','남은 대기열을 보존.\n다음 회차에서 이어감.\n외부 조회 40회/회차',tone='hold',size=9)
arrow([(165,448),(153,448),(153,520),(145,520)],AMBER)
text(33,589,'조사 기간',9,'KRB',TEAL)
paragraph(33,609,112,'일일: 7일 전~30일 후\n월요일: 30일 전~90일 후\n31~90일 후는 후보만\n확보하고 자동 공개 안 함.',8.3,12)
paragraph(33,739,W-66,'보류된 소속사 후보에서 자동 공개로 넘어가는 연결은 현재 구현되지 않았다. 기존 프로필 보강은 데뷔 일정과 별개로 빈 값만 추가하며, 시간 미정 상태도 그대로 유지한다.',9,14,INK)
c.showPage()

header(2,'테스트 결과와 현재 판정',f'이번 재확인: {checked}. 코드 분기 재시험 + 현재 운영 데이터 읽기 대조. 정기 조사 강제 실행·재배포 없음.')
box(32,116,168,62,'분기 테스트 70 / 70','자동화·포털 시나리오 통과',tone='success',size=12)
box(214,116,168,62,'운영 대조 11 / 11','현재 DB·공개 응답 대조 통과',tone='success',size=12)
box(396,116,168,62,'새 공개 등록 0명','발굴된 후보 2명은 보류 상태',tone='hold',size=12)
text(32,200,'주요 분기를 테스트와 연결',12,'KRB')
rows=[
 ('실행·비용','중복 실행 방지, 월 70회 차단, 조회량 제한','통과'),
 ('후보 발굴','이름 없는 공식 소속사 경로·고유 채널 추출','통과'),
 ('보류','미확인 소속사 후보의 공개 차단·빈 날짜 보존','통과'),
 ('공식 정보','이미지 형식·채널 ID·본인 글 작성자 확인','통과'),
 ('기존 정보','기존 값·운영자 수정·시간 미정 상태 보존','통과'),
 ('DB 저장','부분 저장 시 전체 취소, 동일 정보 중복 저장 방지','통과'),
 ('공개 재확인','프로필·방송국·캘린더 불일치 시 완료 처리 차단','통과'),
]
table_y=225;col=(32,126,512)
for i,(stage,desc,result) in enumerate([('구간','검사 내용','판정')]+rows):
    top=table_y+i*29
    if i==0:c.setFillColor(PALE);c.rect(32,H-top-25,W-64,25,fill=1,stroke=0)
    text(col[0]+7,top+6,stage,9,'KRB' if i==0 else 'KR')
    text(col[1],top+6,desc,9,'KRB' if i==0 else 'KR')
    text(col[2],top+6,result,9,'KRB',TEAL if i else INK)
    c.setStrokeColor(HexColor('#D7E0E6'));c.setLineWidth(.4);c.line(32,H-top-26,W-32,H-top-26)

text(32,480,'현재 운영 데이터에서 확인한 내용',12,'KRB')
paragraph(32,504,W-64,'공개 프로필 435명. 기존 11월 1~11일 등록자 36명의 보강 완료 기록과 캘린더 연결을 재확인했다. 8명·12항목의 추가 값은 현재 공개 응답에도 유지된다. 카이리 시엔·히라네코 리에는 후보 DB에 남아 있으며 공개 목록에는 없다.',10,16,INK)
paragraph(32,574,W-64,'직전 실제 서버 시험은 11월 12일 15:30 KST 회차다. 이번에는 같은 조사를 다시 실행하지 않고 그 실행 이력과 현재 저장값을 읽었다. 초기 공개 조회가 제한 시간에 걸려 재시도했고, 최종 프로필·캘린더 응답은 모두 HTTP 200이었다.',9,14)
text(32,645,'비용 상한과 남은 범위',12,'KRB')
paragraph(32,668,W-64,'정규 일정: 매일 09시·21시, 월요일 10시 KST. 조사 실행 월 70회, 외부 조회 회차당 40회, CPU 5초, 하위 요청 400개 설정을 유지한다. 이번 작업은 운영 데이터를 수정하거나 유료 외부 서비스를 추가하지 않았다. 실행량 제한은 계정 전체의 달러 청구 차단 한도와 다르다.',9,14)
paragraph(32,735,W-64,'남은 부분: 치지직 신인 전체 발굴, 소속사 후보의 본인 공지·행사 범위·시간대 자동 확정. 이미지 검사는 공식 출처와 파일의 기술적 검사이며 시각 검수를 뜻하지 않는다. 전체 백엔드 빌드는 기존 가져오기 오류가 있어 통과로 보고하지 않았다.',8.5,13)
c.save()

reader=PdfReader(str(OUT));assert len(reader.pages)==2
for page in reader.pages:assert len(page.extract_text())>300
print(json.dumps({'pdf':str(OUT),'pages':len(reader.pages),'liveChecks':live['passed'],'unitTests':70},ensure_ascii=False))
