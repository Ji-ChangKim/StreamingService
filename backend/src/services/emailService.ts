/**
 * Email Service (Resend / Fetch REST Email API)
 * 수신자: kimjichang1234@gmail.com
 */

export interface EmailReportData {
  recipientEmail: string;
  targetMonth: string; // e.g. "2026-08"
  totalFound: number;
  existingMatchedCount: number;
  newDiscoveredCount: number;
  creators: Array<{
    displayName: string;
    platform: string;
    debutDate: string;
    debutTime?: string;
    channelUrl?: string;
    xUrl?: string;
    isNew: boolean;
  }>;
}

export async function sendDebutReportEmail(data: EmailReportData, apiKey?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const recipient = data.recipientEmail || 'kimjichang1234@gmail.com';
  const apiKeyToUse = apiKey || 're_test_key'; // 환경변수 또는 전달받은 API Key

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
          <h1 class="title">📢 [V-DEBUT HUB] ${data.targetMonth} 데뷔 버튜버 웹서치 조사 보고서</h1>
          <p class="subtitle">자동 수집 및 대조 분석 결과 리포트 (수신: ${recipient})</p>
        </div>

        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-num">${data.totalFound}명</div>
            <div class="stat-label">총 조사 인원</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">${data.existingMatchedCount}명</div>
            <div class="stat-label">기존 일치 데이터</div>
          </div>
          <div class="stat-card">
            <div class="stat-num" style="color: #16a34a;">+${data.newDiscoveredCount}명</div>
            <div class="stat-label">신규/추가 조사 인원</div>
          </div>
        </div>

        <h3 style="font-size: 16px; font-weight: 800; margin-bottom: 10px; color: #1e293b;">📋 ${data.targetMonth} 데뷔 버튜버 명단 (${data.creators.length}명)</h3>
        <table>
          <thead>
            <tr>
              <th>구분</th>
              <th>버튜버 (닉네임)</th>
              <th>플랫폼</th>
              <th>데뷔일시</th>
              <th>채널 링크</th>
            </tr>
          </thead>
          <tbody>
            ${data.creators.map(c => `
              <tr>
                <td>${c.isNew ? '<span class="badge-new">신규 추가</span>' : '<span class="badge-exist">일치 데이터</span>'}</td>
                <td><strong>${c.displayName}</strong></td>
                <td>${c.platform}</td>
                <td>${c.debutDate} ${c.debutTime || ''}</td>
                <td><a href="${c.channelUrl || '#'}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: 700;">[방송국]</a></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          본 메일은 V-DEBUT HUB 자동 웹서치 & 데뷔 조사 시스템에서 자동으로 발송되었습니다.<br>
          © 2026 V-DEBUT HUB All Rights Reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKeyToUse}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'V-DEBUT HUB <onboarding@resend.dev>',
        to: [recipient],
        subject: `[V-DEBUT HUB] 📢 ${data.targetMonth} 버튜버 자동 수집 갱신 보고서 (총 ${data.totalFound}명 조사)`,
        html: htmlContent
      })
    });

    if (res.ok) {
      const resData: any = await res.json();
      return { success: true, messageId: resData.id };
    } else {
      const errData: any = await res.text();
      console.warn('Resend API response error:', errData);
      return { success: false, error: errData };
    }
  } catch (err: any) {
    console.error('Email Dispatch Error:', err);
    return { success: false, error: err.message || '네트워크 전송 오류' };
  }
}
