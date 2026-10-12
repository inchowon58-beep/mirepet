import { site } from "../site.config.js";
import { escapeHtml } from "./util.js";
import { absUrl, shell } from "./layout.js";

function fallbackSections(model) {
  const images = model.images.slice(1);
  let cursor = 0;
  const image = () => images[cursor++] || "";
  const sections = [
    {
      title: model.headings.lead,
      paragraphs: [model.aka, model.glue, model.after].filter(Boolean),
      image: image(),
      alt: model.place,
    },
    {
      title: model.headings.know,
      paragraphs: model.knowledge,
      image: image(),
      alt: model.place,
    },
  ];
  return sections;
}

function paragraphs(lines) {
  return lines.filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

export function renderGuide(model, links) {
  const { topic, place, title, description, images, headings } = model;
  const path = links.canonicalPath;
  const canonical = absUrl(path);
  const phone = site.phone;
  const crumbs = [
    ["홈", "/"],
    ["안내", "/guide/"],
    [topic.keyword, links.base],
  ];
  if (model.regionName) crumbs.push([place, path]);

  const crumbHtml = crumbs
    .map(([label, href], index) =>
      index === crumbs.length - 1
        ? `<span aria-current="page">${escapeHtml(label)}</span>`
        : `<a href="${href}">${escapeHtml(label)}</a>`,
    )
    .join("<span class='sep'>/</span>");

  const stats = model.stats
    .map(([label, value]) => `<div class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`)
    .join("");

  const steps = model.steps
    .map(([label, body], index) => `<li><span>0${index + 1}</span><div><h3>${escapeHtml(label)}</h3><p>${escapeHtml(body)}</p></div></li>`)
    .join("");

  const promises = model.promises
    .map(([label, body], index) => `<article><span>0${index + 1}</span><h3>${escapeHtml(label)}</h3><p>${escapeHtml(body)}</p></article>`)
    .join("");

  const cares = model.cares.map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const faqs = model.faqs
    .map(([question, answer]) => `<article class="faq-item"><button type="button" aria-expanded="false">${escapeHtml(question)}<span>+</span></button><div class="faq-a"><p>${escapeHtml(answer)}</p></div></article>`)
    .join("");

  const related = links.related
    .map((item) => `<a href="${item.href}">${escapeHtml(item.label)}</a>`)
    .join("");
  const nearby = (links.nearby || [])
    .map((item) => `<a href="${item.href}">${escapeHtml(item.label)}</a>`)
    .join("");
  const regionChips = (links.regions || [])
    .map((item) => `<a href="${item.href}">${escapeHtml(item.label)}</a>`)
    .join("");
  const breedLinks = (topic.breedLinks || [])
    .map((keyword) => `<a href="/guide/${encodeURI(keyword)}/">${escapeHtml(keyword)}</a>`)
    .join("");

  const localBlock = model.local.length
    ? `<section class="band band-soft"><div class="wrap narrow"><p class="eyebrow">Local</p><h2>${escapeHtml(headings.local)}</h2><div class="prose">${paragraphs(model.local)}</div></div></section>`
    : "";

  const regionBlock = regionChips
    ? `<section class="band"><div class="wrap"><details class="region-fold"><summary>지역별 ${escapeHtml(topic.keyword)} 전체 보기</summary><div class="chips">${regionChips}</div></details></div></section>`
    : "";

  const nearbyBlock = nearby
    ? `<section class="band"><div class="wrap"><p class="eyebrow">Nearby</p><h2>다른 지역의 ${escapeHtml(topic.keyword)}</h2><div class="chips">${nearby}</div></div></section>`
    : "";

  const breedBlock = breedLinks
    ? `<section class="band"><div class="wrap"><p class="eyebrow">Breeds</p><h2>함께 비교하는 종류</h2><div class="chips">${breedLinks}</div></div></section>`
    : "";

  const story = (model.sections?.length ? model.sections : fallbackSections(model))
    .map((section, index) => {
      const photo = section.image
        ? `<figure class="inline-photo"><img src="${section.image}" alt="${escapeHtml(section.alt || `${place} 사진`)}" loading="lazy" /></figure>`
        : "";
      return `<section class="band ${index % 2 ? "band-white" : ""}">
        <div class="wrap prose">
          <h2>${escapeHtml(section.title)}</h2>
          ${paragraphs(section.paragraphs)}
        </div>
        ${photo ? `<div class="wrap">${photo}</div>` : ""}
      </section>`;
    })
    .join("");

  const stepBlock = model.showSteps === false || !model.steps?.length
    ? ""
    : `<section class="band"><div class="wrap"><h2>${escapeHtml(headings.steps)}</h2><ol class="steps">${steps}</ol></div></section>`;

  const careBlock = model.cares?.length && !model.sections?.length
    ? `<section class="band band-white"><div class="wrap"><h2>${escapeHtml(headings.care)}</h2><ul class="care-list">${cares}</ul></div></section>`
    : "";

  const body = `
    <section class="page-hero">
      <img src="${images[0]}" alt="${escapeHtml(place)}" />
    </section>
    <div class="wrap page-intro">
      <div class="crumb">${crumbHtml}</div>
      <p class="eyebrow">${escapeHtml(topic.en || site.nameEn)}</p>
      <h1>${escapeHtml(place)}</h1>
      <p class="lede lead">${escapeHtml(model.glue)}</p>
      <a class="btn" href="tel:${site.phoneDigits}">${phone} 상담</a>
      ${stats ? `<div class="stat-grid intro-stats">${stats}</div>` : ""}
    </div>
    ${story}
    ${localBlock && model.sections?.length ? "" : localBlock}
    ${stepBlock}
    ${careBlock}
    <section class="band band-white">
      <div class="wrap narrow">
        <h2>이어서 보면 좋은 상담</h2>
        ${model.alsoLine ? `<p>${escapeHtml(model.alsoLine)}</p>` : ""}
        <div class="chips">${related}</div>
      </div>
    </section>
    ${breedBlock}
    ${nearbyBlock}
    ${regionBlock}
    <section class="band" id="faq">
      <div class="wrap narrow">
        <h2>${escapeHtml(headings.faq)}</h2>
        <div class="faq">${faqs}</div>
      </div>
    </section>
    <section class="contact-band" id="contact">
      <div class="wrap">
        <p class="eyebrow">Contact</p>
        <h2>${escapeHtml(place)}, 지금 ${phone}</h2>
        <p>${escapeHtml(topic.summary)}</p>
        <a class="btn clay" href="tel:${site.phoneDigits}">${phone}</a>
      </div>
    </section>`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map(([name, href], index) => ({
        "@type": "ListItem",
        position: index + 1,
        name,
        item: absUrl(href),
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: model.faqs.map(([name, text]) => ({
        "@type": "Question",
        name,
        acceptedAnswer: { "@type": "Answer", text },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: place,
      serviceType: topic.keyword,
      description,
      url: canonical,
      image: images.slice(0, 3),
      areaServed: model.regionName || "KR",
      provider: {
        "@type": "Organization",
        name: site.name,
        telephone: phone,
        url: absUrl("/"),
      },
      availableChannel: {
        "@type": "ServiceChannel",
        servicePhone: {
          "@type": "ContactPoint",
          telephone: phone,
          contactType: "customer service",
          areaServed: "KR",
          availableLanguage: "Korean",
        },
      },
    },
  ];

  return shell({
    title,
    description,
    canonical,
    image: images[0],
    jsonLd,
    body,
  });
}

export function renderSimple({ title, description, path, image, kicker, heading, intro, inner }) {
  const body = `
    <section class="plain-hero">
      <div class="wrap">
        <p class="eyebrow">${escapeHtml(kicker)}</p>
        <h1>${escapeHtml(heading)}</h1>
        <p class="lede">${escapeHtml(intro)}</p>
      </div>
    </section>
    ${inner}`;
  return shell({
    title,
    description,
    canonical: absUrl(path),
    image,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: absUrl(path),
    },
    body,
  });
}
