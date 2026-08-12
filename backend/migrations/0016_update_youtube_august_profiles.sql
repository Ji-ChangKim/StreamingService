-- Migration 0016: Update 16 Mid-August YouTube Debut Streamers Profiles (Name, 900px Avatar, Description)


-- Яuа Ch. ルア (https://www.youtube.com/watch?v=kHilQxtwx_M)
UPDATE streamerChannel_info
SET display_name = 'Яuа Ch. ルア',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/3kn7sLRkn0bjBhKKZGdWr_VqBzxbODkFaz9SHofTgeiywEhtXvdkpUnEslNsxe23tRW-Tqj7=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/3kn7sLRkn0bjBhKKZGdWr_VqBzxbODkFaz9SHofTgeiywEhtXvdkpUnEslNsxe23tRW-Tqj7=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN '個人勢Vtuber Яuaだぞ！

よろしゅ〜

【Twitter/X】
https://x.com/rua_vtuber_1015?s=21' != '' THEN '個人勢Vtuber Яuaだぞ！

よろしゅ〜

【Twitter/X】
https://x.com/rua_vtuber_1015?s=21' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=kHilQxtwx_M'
);

UPDATE streamerChannel
SET channel_name = 'Яuа Ch. ルア'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=kHilQxtwx_M';

-- Saki ch. 音乃羽 咲妃🎷🌹 (https://www.youtube.com/watch?v=vcBgjChtYWI)
UPDATE streamerChannel_info
SET display_name = 'Saki ch. 音乃羽 咲妃🎷🌹',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/mwtvDdwivlIIu2W_gjoAAiOAB0lnGJahMyv3-O2ukCVSYAtU68ZuorGrde5t_S6ETgDLOAH_Ng=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/mwtvDdwivlIIu2W_gjoAAiOAB0lnGJahMyv3-O2ukCVSYAtU68ZuorGrde5t_S6ETgDLOAH_Ng=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN 'サックス演奏Vmusician 音乃羽音楽隊隊長の音乃羽 咲妃（おとのは さき）と申します🎷🌹
大好きなアニソンやVtuberさん楽曲を演奏していきます✨

🎷----------------------------------------------------------🎷

【🌹ハッシュタグなど🌹】
全般： #音乃羽咲妃
配信： #おとのはらいぶ
ファンマーク： 🎷🌹

【🌹歓迎🌹】
・チャンネル登録・高評価・通知登録・Xなどで共有拡散
・Xのフォロー
・曲のリクエスト
・弾幕やコメント

【🌹お願い🌹】
・喧嘩や荒らしはNG！見つけてもスルーでお願いします！
・第三者が見て不快になるコメントはNG！

🎷----------------------------------------------------------🎷

2025.05.10 チャンネル開設
2025.08.29 チャンネル登録者様100人
2025.10.18 チャンネル登録者様200人
2025.11.06 チャンネル登録者様300人
2025.11.22 チャンネル登録者様400人
2025.12.30 チャンネル登録者様500人
2026.02.04 収益化
2026.02.22 メンバーシップ開設
2026.06.24 1st Original Music 「Intertwine」Release / ハイプランキング23位

🎷----------------------------------------------------------🎷

#音乃羽咲妃 #vtuber #新人vtuber #vtuber準備中 #バ美肉 #ボイチェン勢 #sax #saxophone #サックス #演奏してみた #楽器演奏 #演奏系vtuber 

🎷----------------------------------------------------------🎷
' != '' THEN 'サックス演奏Vmusician 音乃羽音楽隊隊長の音乃羽 咲妃（おとのは さき）と申します🎷🌹
大好きなアニソンやVtuberさん楽曲を演奏していきます✨

🎷----------------------------------------------------------🎷

【🌹ハッシュタグなど🌹】
全般： #音乃羽咲妃
配信： #おとのはらいぶ
ファンマーク： 🎷🌹

【🌹歓迎🌹】
・チャンネル登録・高評価・通知登録・Xなどで共有拡散
・Xのフォロー
・曲のリクエスト
・弾幕やコメント

【🌹お願い🌹】
・喧嘩や荒らしはNG！見つけてもスルーでお願いします！
・第三者が見て不快になるコメントはNG！

🎷----------------------------------------------------------🎷

2025.05.10 チャンネル開設
2025.08.29 チャンネル登録者様100人
2025.10.18 チャンネル登録者様200人
2025.11.06 チャンネル登録者様300人
2025.11.22 チャンネル登録者様400人
2025.12.30 チャンネル登録者様500人
2026.02.04 収益化
2026.02.22 メンバーシップ開設
2026.06.24 1st Original Music 「Intertwine」Release / ハイプランキング23位

🎷----------------------------------------------------------🎷

#音乃羽咲妃 #vtuber #新人vtuber #vtuber準備中 #バ美肉 #ボイチェン勢 #sax #saxophone #サックス #演奏してみた #楽器演奏 #演奏系vtuber 

🎷----------------------------------------------------------🎷
' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=vcBgjChtYWI'
);

UPDATE streamerChannel
SET channel_name = 'Saki ch. 音乃羽 咲妃🎷🌹'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=vcBgjChtYWI';

-- 聖嘯 さぽん / Seishow SAPON (https://www.youtube.com/watch?v=KAmKvItdMIo)
UPDATE streamerChannel_info
SET display_name = '聖嘯 さぽん / Seishow SAPON',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/JzDk9yZ4rok-1sIw9DcJI9p2FcoZs-cvpJkDycofDJQ6T8KcduswEf5-dRVPybHIxk876cWPKGQ=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/JzDk9yZ4rok-1sIw9DcJI9p2FcoZs-cvpJkDycofDJQ6T8KcduswEf5-dRVPybHIxk876cWPKGQ=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN '' != '' THEN '' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=KAmKvItdMIo'
);

UPDATE streamerChannel
SET channel_name = '聖嘯 さぽん / Seishow SAPON'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=KAmKvItdMIo';

-- 虎音ロウ -Cornrow- (https://www.youtube.com/watch?v=kXPTGrdB34Q)
UPDATE streamerChannel_info
SET display_name = '虎音ロウ -Cornrow-',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/wFqUKWgylGXvKWWe_BtR9kHwV9ksa5phatAYXIlG1twu1zZncJZSVyD2XUMBFvUUssgVN8S4mw=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/wFqUKWgylGXvKWWe_BtR9kHwV9ksa5phatAYXIlG1twu1zZncJZSVyD2XUMBFvUUssgVN8S4mw=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN 'こーんばんわ！🐯🌽 料理の世界に飛び込むも、いろいろあって脱シェフした虎、虎音ロウ（コオンロウ／Cornrow）です。
イラスト、LIVE2Dモデルは鋭意制作中！
完全セルフ受肉VTuberとしてデビュー予定やからフォローして待っててなー！
 #セルフ受肉 #VTuber準備中 #個人勢 #虎音ロウ' != '' THEN 'こーんばんわ！🐯🌽 料理の世界に飛び込むも、いろいろあって脱シェフした虎、虎音ロウ（コオンロウ／Cornrow）です。
イラスト、LIVE2Dモデルは鋭意制作中！
完全セルフ受肉VTuberとしてデビュー予定やからフォローして待っててなー！
 #セルフ受肉 #VTuber準備中 #個人勢 #虎音ロウ' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=kXPTGrdB34Q'
);

UPDATE streamerChannel
SET channel_name = '虎音ロウ -Cornrow-'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=kXPTGrdB34Q';

-- 夢中める (https://www.youtube.com/watch?v=bfqOaBguYbA)
UPDATE streamerChannel_info
SET display_name = '夢中める',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/BaVsGzA1yTl2uz4Uo2r2kLX13ErmMakuEqR-gcQESXDYrsN7-2X4lZYWF9Bi79wUr11IBjek_w=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/BaVsGzA1yTl2uz4Uo2r2kLX13ErmMakuEqR-gcQESXDYrsN7-2X4lZYWF9Bi79wUr11IBjek_w=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN 'みーんなめるにむちゅーになーれ！

人間くんたちだーいすき小悪魔！
悪魔界から人間界に堕ちてきちゃった👾↝

君たちのこといっぱい教えて？？💜' != '' THEN 'みーんなめるにむちゅーになーれ！

人間くんたちだーいすき小悪魔！
悪魔界から人間界に堕ちてきちゃった👾↝

君たちのこといっぱい教えて？？💜' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=bfqOaBguYbA'
);

UPDATE streamerChannel
SET channel_name = '夢中める'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=bfqOaBguYbA';

-- 白黒 Vtuber (https://www.youtube.com/watch?v=hZBegru9bbY)
UPDATE streamerChannel_info
SET display_name = '白黒 Vtuber',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/S-CDicC_dt324oJdLCr5ZYAaZPQ17aYz_Gnak6viW7OVrwhAQ-pljTbxv3IJu5H4VJoRC4QZgA=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/S-CDicC_dt324oJdLCr5ZYAaZPQ17aYz_Gnak6viW7OVrwhAQ-pljTbxv3IJu5H4VJoRC4QZgA=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN 'Vtuber準備中の白黒(モノクロ)です！
主にゲーム実況をメインに活動する予定です！
' != '' THEN 'Vtuber準備中の白黒(モノクロ)です！
主にゲーム実況をメインに活動する予定です！
' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=hZBegru9bbY'
);

UPDATE streamerChannel
SET channel_name = '白黒 Vtuber'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=hZBegru9bbY';

-- きなこもち(粉餅きな) (https://www.youtube.com/watch?v=Pzs0BU3RWh0)
UPDATE streamerChannel_info
SET display_name = 'きなこもち(粉餅きな)',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/HJvjH_aR_GTD_xcjcfMAysdC5t7I8kiwm09J_vKbBCRgffG4h0UNobgorehFbOWeA8utwwF1znA=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/HJvjH_aR_GTD_xcjcfMAysdC5t7I8kiwm09J_vKbBCRgffG4h0UNobgorehFbOWeA8utwwF1znA=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN '粉餅（こもち）きな　です。通称 きなこもちといいます。
フリーゲーム実況・ゲーム雑談を中心に、準備室から少しずつ活動していく新人VTuberです。

このチャンネルは、少し前まで同人作家「きな粉餅屋」、自作マスコット「しろのるり」の名前で準備していましたが、配信者として活動していく名義を整理し、現在は「粉餅きな」として運用しています。

しろのるりは、今後もマスコット・案内役として登場予定です。

気になったフリーゲーム、懐かしい作品、少し変わったゲームなどを、落ち着いて楽しんでいきます。
まずは準備室から、よろしくお願いします。

' != '' THEN '粉餅（こもち）きな　です。通称 きなこもちといいます。
フリーゲーム実況・ゲーム雑談を中心に、準備室から少しずつ活動していく新人VTuberです。

このチャンネルは、少し前まで同人作家「きな粉餅屋」、自作マスコット「しろのるり」の名前で準備していましたが、配信者として活動していく名義を整理し、現在は「粉餅きな」として運用しています。

しろのるりは、今後もマスコット・案内役として登場予定です。

気になったフリーゲーム、懐かしい作品、少し変わったゲームなどを、落ち着いて楽しんでいきます。
まずは準備室から、よろしくお願いします。

' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=Pzs0BU3RWh0'
);

UPDATE streamerChannel
SET channel_name = 'きなこもち(粉餅きな)'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=Pzs0BU3RWh0';

-- Fuutou Ch. 楓糖 (https://www.youtube.com/watch?v=Lq_-x9OIC74)
UPDATE streamerChannel_info
SET display_name = 'Fuutou Ch. 楓糖',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/PhG5AQ8qO6LXGyxnOYaGj9IVvLMRYVX6LnsAozpiPEfFTp-ytMt16IbPniFn3CN9btUaT9u-kg=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/PhG5AQ8qO6LXGyxnOYaGj9IVvLMRYVX6LnsAozpiPEfFTp-ytMt16IbPniFn3CN9btUaT9u-kg=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN '𖤐ˊ˗用歌聲與你一同譜寫未來.

【𝐇𝐚𝐯𝐞𝐧】所屬——楓糖𝗙𝘂𝘂𝘁𝗼𝘂 🍁

你好呀，我是一隻能實現願望的千年樹妖，比起話語更喜歡以歌聲將笑容帶給人們( ˶ˊᵕˋ)੭

主要以歌枠與雜談為主，偶爾掉落小驚喜與遊戲台.ᕷ˖°

中文 〇｜English a little bit｜少しだけ日本語

・┆✦ʚ♡ɞ✦┆・

✎°₊· 𝘼𝙗𝙤𝙪𝙩 𝙢𝙚.

➤#｜𝚃𝙰𝙶

𝕃𝕀𝕍𝔼 - #楓言楓語

𝔽𝔸ℕ𝔸ℝ𝕋 - #楓雲技繪

𝔸𝕃𝕃 - #楓和日麗

𝕄𝕌𝕊𝕀ℂ - #楓寂葉落

➤#｜𝙵𝙰𝙽 𝙽𝙰𝙼𝙴

              

          –「𝐻𝑜𝓅𝑒   𝓉𝒽𝒾𝓈   𝓉𝒾𝓂𝑒  𝓂𝓎  𝓋𝑜𝒾𝒸𝑒 𝒸𝒶𝓃  𝓈𝓅𝓇𝑒𝒶𝒹   𝓉𝑜  𝑒𝓋𝑒𝓇𝓎𝑜𝓃𝑒&#39;𝓈   𝒽𝑒𝒶𝓇𝓉.」

・┆✦ʚ♡ɞ✦┆・

連動邀約、回饋來信｜fuutou0532@gmail.com' != '' THEN '𖤐ˊ˗用歌聲與你一同譜寫未來.

【𝐇𝐚𝐯𝐞𝐧】所屬——楓糖𝗙𝘂𝘂𝘁𝗼𝘂 🍁

你好呀，我是一隻能實現願望的千年樹妖，比起話語更喜歡以歌聲將笑容帶給人們( ˶ˊᵕˋ)੭

主要以歌枠與雜談為主，偶爾掉落小驚喜與遊戲台.ᕷ˖°

中文 〇｜English a little bit｜少しだけ日本語

・┆✦ʚ♡ɞ✦┆・

✎°₊· 𝘼𝙗𝙤𝙪𝙩 𝙢𝙚.

➤#｜𝚃𝙰𝙶

𝕃𝕀𝕍𝔼 - #楓言楓語

𝔽𝔸ℕ𝔸ℝ𝕋 - #楓雲技繪

𝔸𝕃𝕃 - #楓和日麗

𝕄𝕌𝕊𝕀ℂ - #楓寂葉落

➤#｜𝙵𝙰𝙽 𝙽𝙰𝙼𝙴

              

          –「𝐻𝑜𝓅𝑒   𝓉𝒽𝒾𝓈   𝓉𝒾𝓂𝑒  𝓂𝓎  𝓋𝑜𝒾𝒸𝑒 𝒸𝒶𝓃  𝓈𝓅𝓇𝑒𝒶𝒹   𝓉𝑜  𝑒𝓋𝑒𝓇𝓎𝑜𝓃𝑒&#39;𝓈   𝒽𝑒𝒶𝓇𝓉.」

・┆✦ʚ♡ɞ✦┆・

連動邀約、回饋來信｜fuutou0532@gmail.com' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=Lq_-x9OIC74'
);

UPDATE streamerChannel
SET channel_name = 'Fuutou Ch. 楓糖'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=Lq_-x9OIC74';

-- 噛々神 亜恩 (https://www.youtube.com/watch?v=TOIhaCF6wVg)
UPDATE streamerChannel_info
SET display_name = '噛々神 亜恩',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/zWHIpVHpJpcSyWheHmhznqZyGiVQRDjMXRLN_RoQfi69dfHcF3KqIyGHGQRU2j14ZfO_n-_tkXM=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/zWHIpVHpJpcSyWheHmhznqZyGiVQRDjMXRLN_RoQfi69dfHcF3KqIyGHGQRU2j14ZfO_n-_tkXM=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN '個人勢の獣人Vtuber
配信では、ジャンルを問わずゲームをやったり、雑談も
動画では喜びや嘆きを、まろやかにして発信していきます

' != '' THEN '個人勢の獣人Vtuber
配信では、ジャンルを問わずゲームをやったり、雑談も
動画では喜びや嘆きを、まろやかにして発信していきます

' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=TOIhaCF6wVg'
);

UPDATE streamerChannel
SET channel_name = '噛々神 亜恩'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=TOIhaCF6wVg';

-- 君野こじ (https://www.youtube.com/watch?v=9xvC0S-AhRo)
UPDATE streamerChannel_info
SET display_name = '君野こじ',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/az8Y3j9AQAbik_WRgNoeIfn2IsPTal2tMRmI4Be_J9KM4OKYye8cPaAm0p3ZUrppC6A-Ca7X=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/az8Y3j9AQAbik_WRgNoeIfn2IsPTal2tMRmI4Be_J9KM4OKYye8cPaAm0p3ZUrppC6A-Ca7X=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN ' -` ̗ 人類こじらせ化計画進行中！  ̖ ´-

studio PHG所属 半セルフ受肉VTuberの君野こじです！
こじにこじらせて、君だけのこじを見つけてみませんか？
今日もこじらせてけ〜！！！

2026年8月14日VTuberデビュー予定！

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

✧︎ FM￤🐼🍀🧡 
✧︎FN￤こじらせ民
✧︎ STREAM TAG￤#こーじちゅー 
✧︎ FANART TAG￤#こじらせアート
✧︎ MAM￤香山リム 様 (@_rimuiriam)
✧︎ LOGO￤ｺﾏﾁｬﾝ!様
✧︎ DESIGN etc.￤BelleRose様' != '' THEN ' -` ̗ 人類こじらせ化計画進行中！  ̖ ´-

studio PHG所属 半セルフ受肉VTuberの君野こじです！
こじにこじらせて、君だけのこじを見つけてみませんか？
今日もこじらせてけ〜！！！

2026年8月14日VTuberデビュー予定！

┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈

✧︎ FM￤🐼🍀🧡 
✧︎FN￤こじらせ民
✧︎ STREAM TAG￤#こーじちゅー 
✧︎ FANART TAG￤#こじらせアート
✧︎ MAM￤香山リム 様 (@_rimuiriam)
✧︎ LOGO￤ｺﾏﾁｬﾝ!様
✧︎ DESIGN etc.￤BelleRose様' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=9xvC0S-AhRo'
);

UPDATE streamerChannel
SET channel_name = '君野こじ'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=9xvC0S-AhRo';

-- 星存なのか (https://www.youtube.com/watch?v=RdGVRqklvvg)
UPDATE streamerChannel_info
SET display_name = '星存なのか',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/I4UYZYysIR-qCkTeBrtRkMgYCUaPyhFnTeWcl2wL93tkes8cAzQCoghXgsZoH6apAMG7hMLczg=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/I4UYZYysIR-qCkTeBrtRkMgYCUaPyhFnTeWcl2wL93tkes8cAzQCoghXgsZoH6apAMG7hMLczg=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN '人間が大好きなおしゃべり狐。

人に化けて人里で暮らしていたある日
夜空の星々を観測するうちに
終末の予兆を見つけてしまった。

来るべき終末に備え、人間たちと生き残る方法を探しながら活動中。

いつか世界が終わるとしても
それまではきみ達とたくさん笑っていたい。

終末が来るその日まで――

なのかのそばにいてね。

✦ ┈┈┈┈┈┈┈┈ ✦

✦𝑻𝒂𝒈 #星存なのか
✦𝑺𝒄𝒉𝒆𝒅𝒖𝒍𝒆 #なのかと7日間
✦𝑭𝒂𝒏𝑨𝒓𝒕 #星存絵巻
✦𝑭𝒂𝒏𝒔 星存者
✦𝑴𝒂𝒓𝒌 🦊🧭

✦ ┈┈┈┈┈┈┈┈ ✦

⭒ 𝑴𝑶𝑴 ポテノキ様
⭒ 𝑫𝑨𝑫 Kurobi 様

✦ ┈┈┈┈┈┈┈┈ ✦

⭒ 𝑨𝑹𝑻 𝑫𝑰𝑹𝑬𝑪𝑻𝑰𝑶𝑵  いもけんぴ 様

✦ ┈┈┈┈┈┈┈┈ ✦

⭒ 𝑨𝑭𝑭𝑰𝑳𝑰𝑨𝑻𝑰𝑶𝑵 実家
⭒ 𝑴𝑨𝑵𝑨𝑮𝑬𝑴𝑬𝑵𝑻 母

✦ ┈┈┈┈┈┈┈┈ ✦

' != '' THEN '人間が大好きなおしゃべり狐。

人に化けて人里で暮らしていたある日
夜空の星々を観測するうちに
終末の予兆を見つけてしまった。

来るべき終末に備え、人間たちと生き残る方法を探しながら活動中。

いつか世界が終わるとしても
それまではきみ達とたくさん笑っていたい。

終末が来るその日まで――

なのかのそばにいてね。

✦ ┈┈┈┈┈┈┈┈ ✦

✦𝑻𝒂𝒈 #星存なのか
✦𝑺𝒄𝒉𝒆𝒅𝒖𝒍𝒆 #なのかと7日間
✦𝑭𝒂𝒏𝑨𝒓𝒕 #星存絵巻
✦𝑭𝒂𝒏𝒔 星存者
✦𝑴𝒂𝒓𝒌 🦊🧭

✦ ┈┈┈┈┈┈┈┈ ✦

⭒ 𝑴𝑶𝑴 ポテノキ様
⭒ 𝑫𝑨𝑫 Kurobi 様

✦ ┈┈┈┈┈┈┈┈ ✦

⭒ 𝑨𝑹𝑻 𝑫𝑰𝑹𝑬𝑪𝑻𝑰𝑶𝑵  いもけんぴ 様

✦ ┈┈┈┈┈┈┈┈ ✦

⭒ 𝑨𝑭𝑭𝑰𝑳𝑰𝑨𝑻𝑰𝑶𝑵 実家
⭒ 𝑴𝑨𝑵𝑨𝑮𝑬𝑴𝑬𝑵𝑻 母

✦ ┈┈┈┈┈┈┈┈ ✦

' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=RdGVRqklvvg'
);

UPDATE streamerChannel
SET channel_name = '星存なのか'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=RdGVRqklvvg';

-- 上向井えむ (https://www.youtube.com/watch?v=FXXoJB2EKLU)
UPDATE streamerChannel_info
SET display_name = '上向井えむ',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/PXTcBTjJE_dK4_zPPSHvaBXlraaQuEcty2WhNpdOUmVrWa6Ta4EigH2NcaEWmIacnvwBFUD16c4=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/PXTcBTjJE_dK4_zPPSHvaBXlraaQuEcty2WhNpdOUmVrWa6Ta4EigH2NcaEWmIacnvwBFUD16c4=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN 'みんなを笑顔にするためにXXX年先の未来から来たホラゲ大好きネオギャル😜🤘その実は自己肯定感カンスト小5男児‼️😸今のうちにチャンネル登録して🎶FA➸#上向井絵む ﾌｧﾝﾈｰﾑ➸#えむなー FM➸🩷💛🩵準備進捗➸ #上向井何してる 目標はチャンネル登録10万人！AI学習❌パパ＆ママ➸中里智明' != '' THEN 'みんなを笑顔にするためにXXX年先の未来から来たホラゲ大好きネオギャル😜🤘その実は自己肯定感カンスト小5男児‼️😸今のうちにチャンネル登録して🎶FA➸#上向井絵む ﾌｧﾝﾈｰﾑ➸#えむなー FM➸🩷💛🩵準備進捗➸ #上向井何してる 目標はチャンネル登録10万人！AI学習❌パパ＆ママ➸中里智明' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=FXXoJB2EKLU'
);

UPDATE streamerChannel
SET channel_name = '上向井えむ'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=FXXoJB2EKLU';

-- 甘利まりす (https://www.youtube.com/watch?v=_Nta9WY3PNs)
UPDATE streamerChannel_info
SET display_name = '甘利まりす',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/Cf8oIHp4nBHKpAHWecqffSFSWokqkbgE1WCxckVlDXMm6IkN-pkoHXGBgbmbkkrx6rKzaKIw=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/Cf8oIHp4nBHKpAHWecqffSFSWokqkbgE1WCxckVlDXMm6IkN-pkoHXGBgbmbkkrx6rKzaKIw=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN '' != '' THEN '' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=_Nta9WY3PNs'
);

UPDATE streamerChannel
SET channel_name = '甘利まりす'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=_Nta9WY3PNs';

-- 三条レン / Sanjou Ren (https://www.youtube.com/watch?v=4p-b6RE9te4)
UPDATE streamerChannel_info
SET display_name = '三条レン / Sanjou Ren',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/C5zHRES8v3K0HQw7BPgPSraOPMAMVeh89O8e_5Rr8qh7YMhUahPQ47hl04thnwjLwvFZjVBagQ=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/C5zHRES8v3K0HQw7BPgPSraOPMAMVeh89O8e_5Rr8qh7YMhUahPQ47hl04thnwjLwvFZjVBagQ=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN '異世界からやってきた会社員VTuber。
こちらの世界では化学系の会社で元気に働いています。  
週1回投稿のショート動画で登録者100人を達成したので現在、初配信の準備中です！
初配信後は深夜の雑談配信を中心とした活動を予定しています。
ぜひチャンネル登録をお願いします！

▼ メインコンテンツ
・雑談配信（時事ネタ・仕事・趣味・資格などを方言を交えてお届け！）
・ゲーム実況 （不定期）
・企画配信＆動画（不定期）

▽お願い
※公序良俗に反するコメントや感想、誹謗中傷はお控えください。
※他配信者様の配信で名前を出さないでください。
※無断転載、AI学習はお控えください。
（本チャンネルが提供する全コンテンツ並びに立ち絵等のイラスト含みます）

▼クリエーター様（敬称略）
・IKKIN　https://x.com/ikkin_live2d（ママ＆パパ）
・大空ちゃんねる工房　https://x.com/sora_logo0362?s=20（OP/ED）

▽使用素材
【BGM】
・DOVA-SYNDROME  https://dova-s.jp/
・魔王魂  https://maou.audio/ 

▼タグ関連
配信タグ　　：#333放送局
サムネタグ　：#333ネイル
ファンアート：#333アート
ファンネーム：#333レン

' != '' THEN '異世界からやってきた会社員VTuber。
こちらの世界では化学系の会社で元気に働いています。  
週1回投稿のショート動画で登録者100人を達成したので現在、初配信の準備中です！
初配信後は深夜の雑談配信を中心とした活動を予定しています。
ぜひチャンネル登録をお願いします！

▼ メインコンテンツ
・雑談配信（時事ネタ・仕事・趣味・資格などを方言を交えてお届け！）
・ゲーム実況 （不定期）
・企画配信＆動画（不定期）

▽お願い
※公序良俗に反するコメントや感想、誹謗中傷はお控えください。
※他配信者様の配信で名前を出さないでください。
※無断転載、AI学習はお控えください。
（本チャンネルが提供する全コンテンツ並びに立ち絵等のイラスト含みます）

▼クリエーター様（敬称略）
・IKKIN　https://x.com/ikkin_live2d（ママ＆パパ）
・大空ちゃんねる工房　https://x.com/sora_logo0362?s=20（OP/ED）

▽使用素材
【BGM】
・DOVA-SYNDROME  https://dova-s.jp/
・魔王魂  https://maou.audio/ 

▼タグ関連
配信タグ　　：#333放送局
サムネタグ　：#333ネイル
ファンアート：#333アート
ファンネーム：#333レン

' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=4p-b6RE9te4'
);

UPDATE streamerChannel
SET channel_name = '三条レン / Sanjou Ren'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=4p-b6RE9te4';

-- ずん太 (https://www.youtube.com/watch?v=i0k1mNh67-I)
UPDATE streamerChannel_info
SET display_name = 'ずん太',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/gf_9rcdiV5cFWmhfXnGZZxyb-3K1rwaeRxH6xzNz9Al8HQuI93lkZNtExw18Vb9L92R7G6gf=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/gf_9rcdiV5cFWmhfXnGZZxyb-3K1rwaeRxH6xzNz9Al8HQuI93lkZNtExw18Vb9L92R7G6gf=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN '【準備中】
インターネットの海からずんちわ。
皆に笑顔と元気を――
卍最強卍のエンターテイナー...を目指してる、ずん太です。
以後、お見知りおきを

【疑問】ずん太って何者～?!?!のコーナー
彼はインターネットの海に漂うタコだ、通称：ずんダコ。
彼はさまざまな「エンタメ」を見ていた。このインターネットには無数のエンタメがある。
そこで彼は思った。「おもしれーなオイ」そこから来る憧れ。
ずん太は「エンタメ」に夢を貰った。
だから自分も夢を与えれる側になろうと...
' != '' THEN '【準備中】
インターネットの海からずんちわ。
皆に笑顔と元気を――
卍最強卍のエンターテイナー...を目指してる、ずん太です。
以後、お見知りおきを

【疑問】ずん太って何者～?!?!のコーナー
彼はインターネットの海に漂うタコだ、通称：ずんダコ。
彼はさまざまな「エンタメ」を見ていた。このインターネットには無数のエンタメがある。
そこで彼は思った。「おもしれーなオイ」そこから来る憧れ。
ずん太は「エンタメ」に夢を貰った。
だから自分も夢を与えれる側になろうと...
' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=i0k1mNh67-I'
);

UPDATE streamerChannel
SET channel_name = 'ずん太'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=i0k1mNh67-I';

-- 氷海月ユキ (https://www.youtube.com/watch?v=zgkIZDmQDCE)
UPDATE streamerChannel_info
SET display_name = '氷海月ユキ',
    profile_image_url = CASE WHEN 'https://yt3.googleusercontent.com/Y5G0HPGWzaBcH8OvKP-Do5t_yxOyqYm2ktGlmkM6XS-vhCvm0hdClC9KIziv58sXyGUAxdddfA=s900-c-k-c0x00ffffff-no-rj' != '' THEN 'https://yt3.googleusercontent.com/Y5G0HPGWzaBcH8OvKP-Do5t_yxOyqYm2ktGlmkM6XS-vhCvm0hdClC9KIziv58sXyGUAxdddfA=s900-c-k-c0x00ffffff-no-rj' ELSE profile_image_url END,
    description = CASE WHEN '2026.08.16  22:00~ 初配信❕🪼
ひねくりえいと所属🧬
新人海月VTuberの氷海月ユキです🪼🌨

ADHD(注意欠如多動性障害)、適応障害🍀診断済み
精神疾患と共に生きる🍀

🪼FPSゲーム⋆͛🎮⋆͛ （APEX、OW）
🌨労働ゲーム 
🪼勉強、雑談配信など

精神疾患のことも動画で発信して行けたらいいなと色々考えています🍀

ほかにも色々準備してるので楽しみに待っててほしいな🤍

𝐜𝐨𝐦𝐢𝐧𝐠 𝐬𝐨𝐨𝐧…' != '' THEN '2026.08.16  22:00~ 初配信❕🪼
ひねくりえいと所属🧬
新人海月VTuberの氷海月ユキです🪼🌨

ADHD(注意欠如多動性障害)、適応障害🍀診断済み
精神疾患と共に生きる🍀

🪼FPSゲーム⋆͛🎮⋆͛ （APEX、OW）
🌨労働ゲーム 
🪼勉強、雑談配信など

精神疾患のことも動画で発信して行けたらいいなと色々考えています🍀

ほかにも色々準備してるので楽しみに待っててほしいな🤍

𝐜𝐨𝐦𝐢𝐧𝐠 𝐬𝐨𝐨𝐧…' ELSE description END
WHERE channel_id IN (
  SELECT id FROM streamerChannel WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=zgkIZDmQDCE'
);

UPDATE streamerChannel
SET channel_name = '氷海月ユキ'
WHERE platform = 'YOUTUBE' AND channel_url = 'https://www.youtube.com/watch?v=zgkIZDmQDCE';