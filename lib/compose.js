import fs from "node:fs";
import { site } from "../site.config.js";
import { CATS, DOGS, MIXED, FUNERAL, pickFromFolders } from "../data/media.js";
import { GLUE, AFTER, STEPS, PROMISES, SCENES, ANGLES, TITLE_PATTERNS, DESC_PATTERNS } from "./phrases.js";
import { fill, hash, josa, pick, rotate, spinText } from "./util.js";

const HEADINGS = [
  {
    lead: "{place} 상담을 전화 한 통으로 정리합니다",
    know: "{place}에서 먼저 보는 점",
    care: "돌봄과 생활 리듬",
    cost: "비용과 준비",
    steps: "{place} 상담 순서",
    local: "{region} 생활에 맞춘 메모",
    faq: "자주 묻는 질문",
    promise: "세 가지 약속",
  },
  {
    lead: "{place은} 조건부터 맞춰야 합니다",
    know: "{name}을 집에서 보면",
    care: "매일 반복되는 관리",
    cost: "금액이 나뉘는 지점",
    steps: "상담이 진행되는 흐름",
    local: "{region}에서 달라지는 점",
    faq: "{place} 전에 많은 질문",
    promise: "상담에서 지키는 것",
  },
  {
    lead: "믿을 수 있는 {place} 상담",
    know: "특징과 현실적인 난이도",
    care: "입양·이용 뒤 첫 달",
    cost: "견적에서 빠지기 쉬운 항목",
    steps: "{place} 진행 단계",
    local: "이 지역 보호자에게 드리는 메모",
    faq: "전화 전에 읽어 두면 좋은 질문",
    promise: "{nameBrand}의 약속",
  },
];

export function imagesFor(topic, seed, count = 6) {
  if (topic.imageMode === "mixed") return pickFromFolders(MIXED, seed, count);
  if (topic.imageMode === "dogs") return pickFromFolders(DOGS, seed, count);
  if (topic.imageMode === "cats") return pickFromFolders(CATS, seed, count);
  if (topic.imageMode === "funeral" || topic.imageMode === "both") return pickFromFolders(FUNERAL, seed, count);
  return pickFromFolders([[topic.folder, topic.imageCount]], seed, count);
}

function mapFor(topic, regionName, place) {
  return {
    place,
    place은: josa(place, "은는"),
    place을: josa(place, "을를"),
    place이: josa(place, "이가"),
    name: topic.name,
    name은: josa(topic.name, "은는"),
    name을: josa(topic.name, "을를"),
    keyword: topic.keyword,
    phone: site.phone,
    region: regionName || "생활권",
    region은: josa(regionName || "이 지역", "은는"),
    regionLabel: regionName || "전국",
    nameBrand: site.name,
    nameBrand이: josa(site.name, "이가"),
    summary: topic.summary,
  };
}

function distinctPick(list, seed, salt, previous) {
  if (!list?.length) return "";
  let value = pick(list, seed, salt);
  if (value === previous) value = list[(list.indexOf(value) + 1) % list.length];
  return value;
}

let basesCache = null;
function loadBases() {
  if (basesCache) return basesCache;
  try {
    basesCache = JSON.parse(fs.readFileSync(new URL("../data/gemini-bases.json", import.meta.url), "utf8"));
  } catch {
    basesCache = {};
  }
  return basesCache;
}

const FREE_LINES = [
  "{name}무료분양은 판매 상담과 별도입니다. 개인 사정으로 더 이상 키울 수 없어 파양된 {name}을 새 가정에 연결할 때는 분양 대금 없이 안내해요. {place}에서 지금 연결 가능한 아이가 있는지는 {phone}로 확인해 보세요.",
  "혈통 분양을 알아보는 중에도 {name}무료분양을 함께 물어볼 수 있습니다. 무료분양은 키우던 가정의 사정으로 파양된 아이에 한정되고, 건강 이력과 성격은 전화에서 사실대로 말씀드립니다.",
  "{place}에서는 {name}의 털과 크기뿐 아니라 같은 종류의 무료분양 가능 여부도 같이 봅니다. 모든 아이가 무료인 것은 아니니, 파양으로 들어온 아이인지 먼저 확인하세요.",
];

function fromBase(topic, region, base) {
  const regionName = region?.name || "";
  const place = regionName ? `${regionName} ${topic.keyword}` : topic.keyword;
  const seed = hash(`gemini|${place}|${topic.keyword}`);
  const map = mapFor(topic, regionName, place);
  const text = (value) => fill(String(value || ""), map);
  const regional = Boolean(regionName);
  const images = imagesFor(topic, seed, 8);
  let imageAt = 1;
  const take = () => images[imageAt++] || images[0];
  const blocks = rotate(base.blocks || [], regional ? seed : 0);
  const sections = [];
  blocks.forEach((block, index) => {
    const paras = (block.paragraphs || []).map(text).filter(Boolean);
    if (!paras.length) return;
    const shown = regional ? [paras[(seed + index) % paras.length]] : paras;
    sections.push({
      title: text(block.title),
      paragraphs: shown,
      image: take(),
      alt: `${place} ${text(block.title)}`,
    });
  });
  if (topic.group === "dog" || topic.group === "cat") {
    sections.push({
      title: `${topic.name}무료분양`,
      paragraphs: [text(pick(FREE_LINES, seed, 4))],
      image: take(),
      alt: `${topic.name}무료분양`,
    });
  }
  if (regional) {
    const sceneBank = SCENES[region.tag] || SCENES.city;
    sections.push({
      title: `${regionName}에서 먼저 맞출 점`,
      paragraphs: [text(pick(sceneBank, seed, 2)), text(pick(topic.localTips || ANGLES, seed, 3))],
      image: take(),
      alt: `${regionName} 생활`,
    });
  }
  if (base.cares?.length) {
    sections.push({
      title: "전화 전에 적어 두면 좋은 것",
      paragraphs: base.cares.map(text),
      image: "",
    });
  }
  const breed = topic.group === "dog" || topic.group === "cat";
  const summary = text(base.summary || topic.summary);
  return {
    topic,
    region,
    regionName,
    place,
    seed,
    title: breed ? `${place} · ${topic.name}무료분양 | ${site.name}` : `${place} | ${site.name} 상담`,
    description: `${summary} 상담 전화 ${site.phone}.`.replace(/\s+/g, " "),
    headings: { faq: "상담 전에 많이 묻는 질문", steps: "", care: "", lead: "", know: "", local: "" },
    sections,
    showSteps: false,
    steps: [],
    promises: [],
    cares: [],
    faqs: rotate((base.faqs || []).map((item) => [text(item.q || item[0]), text(item.a || item[1])]), seed),
    alsoLine: "",
    glue: text(pick(base.lead, seed, 1)),
    aka: "",
    after: "",
    knowledge: [],
    local: [],
    images,
    stats: topic.stats,
  };
}

export function composePage(topic, region) {
  const regionName = region?.name || "";
  const place = regionName ? `${regionName} ${topic.keyword}` : topic.keyword;
  const seed = hash(`mirpet|${place}|${topic.group}`);
  const map = mapFor(topic, regionName, place);
  const text = (value) => fill(value, map);
  const regional = Boolean(regionName);
  const base = loadBases()[topic.keyword];
  if (base?.lead?.length && base?.blocks?.length) return fromBase(topic, region, base);

  const slotKeys = ["identity", "temper", "body", "home", "care", "cost"];
  const orderedKeys = regional ? rotate(slotKeys, seed) : slotKeys;
  const knowledge = [];
  orderedKeys.forEach((key, index) => {
    const bank = topic.slots[key] || [];
    if (!bank.length) return;
    if (regional) {
      const first = pick(bank, seed, index + 3);
      knowledge.push(text(first));
      if (index % 2 === 0 && bank.length > 1) knowledge.push(text(distinctPick(bank, seed, index + 9, first)));
    } else {
      knowledge.push(text(bank[0]));
      if (bank[1]) knowledge.push(text(bank[1]));
    }
  });

  const sceneBank = SCENES[region?.tag || "city"] || SCENES.city;
  const local = [];
  if (regional) {
    const sceneA = text(pick(sceneBank, seed, 11));
    const sceneB = text(distinctPick(sceneBank, seed, 12, pick(sceneBank, seed, 11)));
    local.push(sceneA, sceneB, text(pick(ANGLES, seed, 13)), text(pick(topic.localTips, seed, 14)), text(pick(ANGLES, seed, 15)));
  }

  const steps = textSteps(pick(STEPS, seed, 4), text);
  if (regional) {
    const extra = text(pick(ANGLES, seed, 21));
    steps[seed % steps.length][1] = `${steps[seed % steps.length][1]} ${extra}`;
    const swapped = rotate(steps, seed);
    steps.splice(0, steps.length, ...swapped);
  }

  const promises = pick(PROMISES, seed, 5).map(([title, body]) => [text(title), text(body)]);
  const cares = regional ? rotate(topic.cares, seed).slice(0, 4) : topic.cares.slice();
  const faqs = rotate(topic.faqs, seed).map(([question, answer], index) => {
    const base = [text(question), text(answer)];
    if (regional && index < 2) base[1] = `${base[1]} ${text(pick(topic.localTips, seed, 30 + index))}`;
    return base;
  });

  const also = topic.also || [];
  const alsoLine = regional
    ? `${josa(place, "을를")} 찾아보신 분들은 ${also.slice(0, 3).map((item) => `${regionName} ${topic.keyword} ${item}`).join(", ")}도 함께 확인합니다.`
    : `${josa(topic.keyword, "과와")} 함께 ${also.join(", ")}를 자주 묻습니다.`;

  const headings = Object.fromEntries(
    Object.entries(pick(HEADINGS, regional ? seed : 2, 6)).map(([key, value]) => [key, text(value)]),
  );
  const aka = topic.aka?.length ? `${josa(topic.name, "은는")} ${topic.aka.join(", ")}로도 검색됩니다.` : "";
  const tone = (value) => (regional ? spinText(value, seed + value.length) : value);
  const glue = tone(text(pick(GLUE[topic.group] || GLUE.sale, seed, 1)));
  const after = tone(text(pick(AFTER[topic.group] || AFTER.sale, seed, 2)));
  for (let index = 0; index < knowledge.length; index += 1) knowledge[index] = tone(knowledge[index]);
  for (const step of steps) step[1] = tone(step[1]);
  for (const faq of faqs) faq[1] = tone(faq[1]);
  for (let index = 0; index < local.length; index += 1) local[index] = tone(local[index]);
  const title = text(pick(TITLE_PATTERNS, regional ? seed : 0, regional ? 7 : 0));
  const description = text(pick(DESC_PATTERNS, regional ? seed : 0, regional ? 8 : 0)).replace(/\s+/g, " ");

  return {
    topic,
    region,
    regionName,
    place,
    seed,
    title,
    description,
    headings,
    glue,
    aka,
    after,
    knowledge,
    local,
    steps,
    promises,
    cares,
    faqs,
    alsoLine,
    images: imagesFor(topic, seed, 6),
    stats: topic.stats,
  };
}

function textSteps(rows, text) {
  return rows.map(([title, body]) => [text(title), text(body)]);
}

export function pageSeed(place, keyword) {
  return hash(`${place}|${keyword}`);
}
