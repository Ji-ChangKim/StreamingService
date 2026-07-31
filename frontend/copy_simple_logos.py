import os
import shutil

public_dir = r"j:\개인 프로젝트\WEB\StreamingService\frontend\public\icons"

# 1. YouTube official logo -> public/icons/logo_youtube_official.png & white
yt_src = os.path.join(public_dir, "youtube", "YouTube_Logo", "Digital", "01 Full Color", "yt_logo_fullcolor_almostblack_digital.png")
yt_white_src = os.path.join(public_dir, "youtube", "YouTube_Logo", "Digital", "01 Full Color", "yt_logo_fullcolor_white_digital.png")

shutil.copy(yt_src, os.path.join(public_dir, "logo_youtube.png"))
shutil.copy(yt_white_src, os.path.join(public_dir, "logo_youtube_white.png"))

# 2. Twitch official logo -> public/icons/logo_twitch_official.png & white
tw_src = os.path.join(public_dir, "Twitch Logos", "01. Twitch Wordmark", "02. Flat Wordmark", "01. Twitch Purple", "twitch_wordmark_flat_purple.png")
tw_white_src = os.path.join(public_dir, "Twitch Logos", "01. Twitch Wordmark", "02. Flat Wordmark", "04. White", "twitch_wordmark_flat_white.png")

shutil.copy(tw_src, os.path.join(public_dir, "logo_twitch.png"))
shutil.copy(tw_white_src, os.path.join(public_dir, "logo_twitch_white.png"))

# 3. CHZZK official logo -> public/icons/logo_chzzk.png & white
ch_src = os.path.join(public_dir, "chzzk", "chzzklogo_Combi(Green).png")
ch_white_src = os.path.join(public_dir, "chzzk", "chzzklogo_Combi(White).png")

shutil.copy(ch_src, os.path.join(public_dir, "logo_chzzk.png"))
shutil.copy(ch_white_src, os.path.join(public_dir, "logo_chzzk_white.png"))

print("Simplified platform logo paths copied successfully!")
