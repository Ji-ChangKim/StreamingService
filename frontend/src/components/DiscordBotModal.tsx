import { X, Bot, Bell, Sparkles, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DiscordBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  botInviteUrl?: string;
}

export function DiscordBotModal({
  isOpen,
  onClose,
  botInviteUrl = 'https://discord.com/oauth2/authorize?client_id=1547493885733900351&permissions=2147485696&scope=bot%20applications.commands',
}: DiscordBotModalProps) {
  if (!isOpen) return null;

  const commands = [
    {
      name: '/오늘데뷔',
      desc: '오늘 첫 방송을 시작하는 신입 버튜버 목록을 Discord Embed 카드로 즉시 확인합니다.',
      badge: '간편 조회',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      name: '/이번주데뷔',
      desc: '이번 주(월~일) 데뷔 예정인 버추얼 스트리머들의 주간 타임라인을 확인합니다.',
      badge: '주간 일정',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      name: '/데뷔등록',
      desc: '웹사이트 방문 없이 디스코드 팝업 모달창에서 즉시 데뷔 일정을 등록하고 D-Day 위젯 URL을 발급받습니다.',
      badge: '양방향 등록',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      name: '/알림채널설정',
      desc: '명령어를 입력한 채널을 실시간 데뷔 공지 및 매일 아침 9시 모닝 브리핑 수신 채널로 지정합니다.',
      badge: '서버 관리자',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden text-white">
        {/* Top Gradient Banner */}
        <div className="bg-gradient-to-r from-[#5865F2] via-[#4F46E5] to-[#2563EB] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 shrink-0">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                  DISCORD BOT
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 서버비 0원 무인 자동화
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight mt-0.5">V-DEBUT HUB 디스코드 봇</h3>
            </div>
          </div>
          <p className="text-xs text-white/80 mt-2">
            내가 활동하는 팬 서버나 디스코드 커뮤니티에 봇을 초대하고, 신입 버튜버 데뷔 소식을 실시간으로 받아보세요!
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Key Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#5865F2]" /> 지원 슬래시 명령어
            </h4>

            <div className="grid gap-2.5">
              {commands.map((cmd) => (
                <div
                  key={cmd.name}
                  className="bg-[#1E293B] border border-[#334155]/80 rounded-xl p-3 hover:border-[#475569] transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black font-mono text-[#60A5FA]">{cmd.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cmd.color}`}>
                      {cmd.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{cmd.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Automatic Broadcasting Info */}
          <div className="bg-[#1E293B]/60 border border-[#334155] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>실시간 양방향 알림 순환 시스템</span>
            </div>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
              <li>웹사이트 또는 디스코드에서 신규 데뷔가 승인되면 구독 서버로 실시간 카드 즉시 자동 전파</li>
              <li>매일 오전 9시(KST) "오늘 첫 방송을 시작하는 버튜버" 모닝 브리핑 자동 발송</li>
              <li>치지직 · SOOP · 유튜브 공식 플랫폼 방송국 링크 원클릭 연결</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="bg-[#0B1120] px-6 py-4 border-t border-[#1E293B] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>디스코드 공식 인증 인터랙션 보안 적용</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              닫기
            </button>
            <a
              href={botInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-extrabold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-[#5865F2]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>디스코드 봇 서버에 초대하기</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
