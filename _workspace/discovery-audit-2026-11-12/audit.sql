SELECT slot,id,status,started_at,finished_at,summary FROM debut_automation_runs ORDER BY started_at;
SELECT id,channel_key,source,seed,status,reason,profile_slug,evidence,first_seen_at,last_seen_at,last_checked_at,next_check_at FROM debut_automation_candidates ORDER BY first_seen_at,id LIMIT 2000;
SELECT id,url,status,checked_at,last_success_at,failures,reason,cached FROM debut_automation_sources ORDER BY id;
SELECT url,source_url,status,reason,first_seen_at,checked_at,next_check_at FROM debut_automation_notices ORDER BY first_seen_at LIMIT 300;
SELECT * FROM debut_automation_months;
