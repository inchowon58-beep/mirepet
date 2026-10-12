import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { site } from "../site.config.js";
import { regions } from "../data/regions.js";
import { topics, topicByKeyword } from "../data/topics.js";
import { imageUrl } from "../data/media.js";
import { ANGLES, SCENES } from "../lib/phrases.js";
import { composePage } from "../lib/compose.js";
import { renderHome } from "../lib/home.js";
import { renderGuide, renderSimple } from "../lib/page.js";
import { fill, hash, jaccard, josa, pick, shortId } from "../lib/util.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const sample = process.argv.includes("--sample");
const origin = site.origin.replace(/\/$/, "");

const usedIds = new Set();
const slugOf = new Map();

function allocate(regionName, keyword) {
  let n = 0;
  let id = shortId(`${regionName}|${keyword}`);
  while (usedIds.has(id) && n < 12) {
    n += 1;
    id = shortId(`${regionName}|${keyword}|${n}`);
  }
  if (usedIds.has(id)) id = `${id}${n.toString(36)}`;
  usedIds.add(id);
  const slug = `${regionName}-${keyword}-${id}`;
  slugOf.set(`${regionName}|${keyword}`, slug);
  return slug;
}

for (const region of regions) {
  for (const topic of topics) allocate(region.name, topic.keyword);
}

const guideHref = (keyword) => `/guide/${keyword}/`;
const areaHref = (regionName) => `/area/${regionName}/`;
const regionHref = (regionName, keyword) => `/guide/${slugOf.get(`${regionName}|${keyword}`)}/`;

function relatedLinks(topic, regionName) {
  return (topic.related || [])
    .filter((keyword) => topicByKeyword.has(keyword))
    .map((keyword) => ({
      href: regionName ? regionHref(regionName, keyword) : guideHref(keyword),
      label: regionName ? `${regionName} ${keyword}` : keyword,
    }));
}

function nearbyLinks(region, keyword) {
  const same = regions.filter((item) => item.tag === region.tag && item.name !== region.name);
  const pool = same.length >= 8 ? same : regions.filter((item) => item.name !== region.name);
  const start = hash(`${region.name}|${keyword}|near`) % pool.length;
  return Array.from({ length: Math.min(8, pool.length) }, (_, index) => pool[(start + index) % pool.length]).map((item) => ({
    href: regionHref(item.name, keyword),
    label: `${item.name} ${keyword}`,
  }));
}

function encodePath(pathname) {
  return pathname
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

const urls = [];
let pending = [];
let written = 0;

async function add(rel, html) {
  if (html.includes("{place") || html.includes("{region") || html.includes("{name") || html.includes("{keyword")) {
    throw new Error(`치환되지 않은 문장이 있습니다: ${rel}`);
  }
  urls.push(`/${rel}`.replace(/index\.html$/, "").replace(/\/$/, "/") || "/");
  pending.push(writeFile(rel, html));
  if (pending.length >= 50) {
    await Promise.all(pending);
    pending = [];
    written += 50;
    if (written % 500 === 0) console.log(`pages ${written}`);
  }
}

async function writeFile(rel, html) {
  const file = path.join(dist, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html, "utf8");
}

function guideModelLinks(topic, region) {
  const regional = Boolean(region);
  const canonicalPath = regional ? regionHref(region.name, topic.keyword) : guideHref(topic.keyword);
  return {
    canonicalPath,
    base: guideHref(topic.keyword),
    related: relatedLinks(topic, region?.name || ""),
    nearby: regional ? nearbyLinks(region, topic.keyword) : [],
    regions: regional
      ? []
      : regions.map((item) => ({
          href: regionHref(item.name, topic.keyword),
          label: item.name,
        })),
  };
}

function areaIntro(region) {
  const bank = SCENES[region.tag] || SCENES.city;
  const map = {
    region: region.name,
    region은: josa(region.name, "은는"),
  };
  return [fill(pick(bank, hash(region.name), 1), map), fill(pick(ANGLES, hash(region.name), 4), map)].join(" ");
}

async function main() {
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(dist, { recursive: true });
  await fs.cp(path.join(root, "public"), path.join(dist), { recursive: true });

  const writeRegions = sample ? regions.slice(0, 3) : regions;
  const writeTopics = sample ? topics.slice(0, 2) : topics;

  await add("index.html", renderHome(topics));
  await add(
    "guide/index.html",
    renderSimple({
      title: `상담 주제 | ${site.name}`,
      description: `강아지분양, 고양이분양, 보호소, 애견호텔, 동물병원, 장례와 파양 주제를 ${site.phone}에서 안내합니다.`,
      path: "/guide/",
      image: imageUrl("doodle", 8),
      kicker: "Guide",
      heading: "상담 주제",
      intro: "견종과 묘종, 보호소, 호텔, 병원, 장례, 파양의 기본 페이지입니다. 지역 페이지는 각 주제 안에서 이어집니다.",
      inner: `<section class="band"><div class="wrap chips">${topics.map((topic) => `<a href="${guideHref(topic.keyword)}">${topic.keyword}</a>`).join("")}</div></section>`,
    }),
  );
  await add(
    "area/index.html",
    renderSimple({
      title: `지역별 상담 | ${site.name}`,
      description: `사는 지역을 고르면 분양, 보호소, 호텔, 병원, 장례 상담 페이지로 이동합니다. ${site.phone}`,
      path: "/area/",
      image: imageUrl("dogboho", 1),
      kicker: "Areas",
      heading: "지역을 선택하세요",
      intro: "구 이름과 생활권 별칭을 검색어 그대로 두었습니다. 원하는 지역을 고르면 그 지역의 키워드 목록이 열립니다.",
      inner: `<section class="band"><div class="wrap"><div class="region-tools"><input id="region-filter" type="search" placeholder="지역 이름" aria-label="지역 검색" /></div><div class="area-list">${regions.map((region) => `<a data-region="${region.name}" href="${areaHref(region.name)}">${region.name}</a>`).join("")}</div></div></section>`,
    }),
  );

  for (const topic of writeTopics) {
    const model = composePage(topic, null);
    await add(`guide/${topic.keyword}/index.html`, renderGuide(model, guideModelLinks(topic, null)));
  }

  for (const region of writeRegions) {
    const intro = areaIntro(region);
    await add(
      `area/${region.name}/index.html`,
      renderSimple({
        title: `${region.name} 반려동물 상담 | ${site.name}`,
        description: `${region.name} 강아지분양, 고양이분양, 보호소, 애견호텔, 동물병원, 장례 상담. ${intro} 전화 ${site.phone}.`,
        path: areaHref(region.name),
        image: imageUrl("pome", (hash(region.name) % 20) + 1),
        kicker: region.tag,
        heading: `${region.name} 상담`,
        intro,
        inner: `<section class="band"><div class="wrap chips">${topics.map((topic) => `<a href="${regionHref(region.name, topic.keyword)}">${region.name} ${topic.keyword}</a>`).join("")}</div></section>`,
      }),
    );
    for (const topic of writeTopics) {
      const model = composePage(topic, region);
      await add(`guide/${slugOf.get(`${region.name}|${topic.keyword}`)}/index.html`, renderGuide(model, guideModelLinks(topic, region)));
    }
  }

  if (pending.length) {
    await Promise.all(pending);
    written += pending.length;
  }

  const leftHtml = renderGuide(composePage(topics[0], regions[0]), guideModelLinks(topics[0], regions[0]));
  const rightHtml = renderGuide(composePage(topics[0], regions[1]), guideModelLinks(topics[0], regions[1]));
  const visible = (html) => (html.split("<main")[1]?.split("</main>")[0] || html).replace(/<[^>]+>/g, "").replace(/\s+/g, "");
  const score = jaccard(visible(leftHtml), visible(rightHtml));
  const grams = (text) => {
    const set = new Set();
    for (let index = 0; index <= text.length - 18; index += 1) set.add(text.slice(index, index + 18));
    return set;
  };
  const A = grams(visible(leftHtml));
  const B = grams(visible(rightHtml));
  let shared = 0;
  for (const gram of A) if (B.has(gram)) shared += 1;
  const shingle = shared / (A.size + B.size - shared);

  const sitemap = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls.map((pathname) => `<url><loc>${origin}${encodePath(pathname)}</loc></url>`),
    `</urlset>`,
  ].join("\n");
  await fs.writeFile(path.join(dist, "sitemap.xml"), sitemap, "utf8");
  await fs.writeFile(
    path.join(dist, "robots.txt"),
    `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
    "utf8",
  );
  const host = origin.replace(/^https?:\/\//, "");
  await fs.writeFile(path.join(dist, "CNAME"), `${host}\n`, "utf8");

  console.log(JSON.stringify({
    sample,
    regions: regions.length,
    topics: topics.length,
    written,
    urls: urls.length,
    similarity: Number(score.toFixed(3)),
    shingle: Number(shingle.toFixed(3)),
    example: regionHref(regions.find((region) => region.name === "부천")?.name || regions[0].name, "포메라니안분양"),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
