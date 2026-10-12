import { site } from "../site.config.js";
import { escapeHtml } from "./util.js";

const NAV = [
  ["강아지분양", "/guide/강아지분양/"],
  ["고양이분양", "/guide/고양이분양/"],
  ["보호소", "/guide/강아지보호소/"],
  ["호텔", "/guide/애견호텔/"],
  ["병원", "/guide/동물병원/"],
  ["미용학원", "/guide/애견미용학원국비지원/"],
  ["지역", "/area/"],
];

export function absUrl(pathname) {
  const origin = site.origin.replace(/\/$/, "");
  return `${origin}${pathname}`;
}

export function shell({ title, description, canonical, image, jsonLd, body, robots = "index, follow" }) {
  const ld = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
  const nav = NAV.map(
    ([label, href]) => `<a href="${href}">${escapeHtml(label)}</a>`,
  ).join("");
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="author" content="${escapeHtml(site.name)}" />
  <meta name="robots" content="${robots}" />
  <meta name="googlebot" content="index, follow, max-image-preview:large" />
  ${site.naverVerification ? `<meta name="naver-site-verification" content="${escapeHtml(site.naverVerification)}" />` : ""}
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="${site.locale}" />
  <meta property="og:site_name" content="${escapeHtml(site.name)}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <meta name="theme-color" content="#3c4836" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://cdn.jsdelivr.net" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Noto+Serif+KR:wght@460;600&display=swap" />
  <link rel="stylesheet" href="/css/site.css" />
  <script type="application/ld+json">${ld}</script>
</head>
<body>
  <a class="skip" href="#content">본문으로</a>
  <header class="site-header">
    <div class="wrap header-row">
      <a class="brand" href="/">
        <span class="brand-en">${site.nameEn}</span>
        <span class="brand-ko">${site.name}</span>
      </a>
      <nav class="desk-nav" aria-label="주요">${nav}</nav>
      <a class="header-phone" href="tel:${site.phoneDigits}">${site.phone}</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav">메뉴</button>
    </div>
    <div id="mobile-nav" class="mobile-nav" hidden>
      ${nav}
      <a class="btn" href="tel:${site.phoneDigits}">${site.phone}</a>
    </div>
  </header>
  <main id="content">${body}</main>
  <footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <p class="brand-en">${site.nameEn}</p>
        <p class="footer-name">${site.name}</p>
        <p>분양, 보호소 입양, 호텔, 병원, 장례와 책임 있는 재분양 상담을 전화로 연결합니다.</p>
      </div>
      <div>
        <p class="footer-label">상담</p>
        <a href="tel:${site.phoneDigits}">${site.phone}</a>
        <p>신청서 없이 전화 한 통이면 됩니다. 진료와 진단은 동물병원에서 받으세요.</p>
      </div>
      <div>
        <p class="footer-label">바로가기</p>
        ${nav}
      </div>
    </div>
    <div class="wrap footer-copy">© ${new Date().getFullYear()} ${site.name}</div>
  </footer>
  <a class="callbar" href="tel:${site.phoneDigits}">전화 상담 ${site.phone}</a>
  <script src="/js/site.js" defer></script>
</body>
</html>`;
}
