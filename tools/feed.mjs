#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// feed.mjs — ポッドキャストの RSS を生成する
//
//   node tools/feed.mjs
//
// 入力：podcast/episodes.json（エピソードの台帳）
//       podcast/audio/*.mp3      （収録した音声。1ファイル100MB以下）
// 出力：quartz/static/podcast/feed.xml
//       → 公開URL https://mishi017.github.io/umwelt-site/static/podcast/feed.xml
//
// この URL を Apple Podcasts Connect と Spotify for Creators に登録すれば、
// 以後は「音声を push するだけ」で新着エピソードが両方に出る。
//
// ⚠️ deploy.yml には一切手を触れない設計。quartz/static/ は Quartz が
//    そのまま public/static/ にコピーするので、既存のビルドが変わらない。
// ─────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const META = join(ROOT, "podcast", "episodes.json");
const AUDIO_DIR = join(ROOT, "podcast", "audio");
const OUT_DIR = join(ROOT, "quartz", "static", "podcast");
const OUT = join(OUT_DIR, "feed.xml");

const BASE = "https://mishi017.github.io/umwelt-site";
const AUDIO_BASE = `${BASE}/static/podcast/audio`;

if (!existsSync(META)) {
  console.error(`podcast/episodes.json が無い。先に作ること。`);
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(META, "utf8"));

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const rfc822 = (d) => new Date(d + "T07:00:00+09:00").toUTCString();

// 音声ファイルが実在するエピソードだけを配信する（台本だけの回は出さない）
const live = [];
for (const ep of cfg.episodes ?? []) {
  const path = join(AUDIO_DIR, ep.file ?? "");
  if (!ep.file || !existsSync(path)) {
    console.log(`  ⏭  ${ep.id} … 音声がまだ無いのでフィードに載せない（${ep.file ?? "file 未指定"}）`);
    continue;
  }
  live.push({ ...ep, bytes: statSync(path).size });
}

if (!live.length) {
  console.log("\n音声が1本も無いのでフィードは空。箱だけ作って終了する。");
}

const items = live
  .sort((a, b) => (a.date < b.date ? 1 : -1))
  .map(
    (ep) => `    <item>
      <title>${esc(ep.title)}</title>
      <description>${esc(ep.description ?? "")}</description>
      <itunes:summary>${esc(ep.description ?? "")}</itunes:summary>
      <pubDate>${rfc822(ep.date)}</pubDate>
      <guid isPermaLink="false">${esc(cfg.guidPrefix ?? "shikumi")}-${esc(ep.id)}</guid>
      <enclosure url="${AUDIO_BASE}/${encodeURIComponent(ep.file)}" length="${ep.bytes}" type="audio/mpeg"/>
      <itunes:duration>${esc(ep.duration ?? "")}</itunes:duration>
      <itunes:episode>${esc(ep.number ?? "")}</itunes:episode>
      <itunes:explicit>false</itunes:explicit>
      ${ep.link ? `<link>${esc(ep.link)}</link>` : ""}
    </item>`
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${esc(cfg.title)}</title>
    <link>${BASE}</link>
    <language>${esc(cfg.language ?? "ja")}</language>
    <description>${esc(cfg.description)}</description>
    <itunes:summary>${esc(cfg.description)}</itunes:summary>
    <itunes:author>${esc(cfg.author)}</itunes:author>
    <itunes:owner>
      <itunes:name>${esc(cfg.author)}</itunes:name>
      <itunes:email>${esc(cfg.email)}</itunes:email>
    </itunes:owner>
    <itunes:image href="${BASE}/static/podcast/${esc(cfg.image ?? "cover.jpg")}"/>
    <itunes:category text="${esc(cfg.category ?? "Science")}">
      <itunes:category text="${esc(cfg.subcategory ?? "Social Sciences")}"/>
    </itunes:category>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, xml, "utf8");
console.log(`\n✅ feed.xml を生成（配信 ${live.length} 本 / 登録 ${(cfg.episodes ?? []).length} 本）`);
console.log(`   ${BASE}/static/podcast/feed.xml`);
