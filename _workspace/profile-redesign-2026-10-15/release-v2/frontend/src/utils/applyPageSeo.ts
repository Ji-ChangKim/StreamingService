import { pageStructuredData } from '../../../shared/siteSeo';

interface PageSeo { title: string; description: string; canonical: string; robots: string; image: string; alternates?: Array<{ language: string; href: string }> }

// 초기 셸에 없던 검색 태그도 만들고 같은 태그의 중복은 제거한다.
function pageHeadElement<K extends keyof HTMLElementTagNameMap>(selector: string, tag: K): HTMLElementTagNameMap[K] {
  const matches = [...document.head.querySelectorAll<HTMLElementTagNameMap[K]>(selector)];
  matches.slice(1).forEach((element) => element.remove());
  if (matches[0]) return matches[0];
  const element = document.createElement(tag); document.head.append(element); return element;
}

// 포털과 통계 간 이동에서도 제목·공유 미리보기·구조화 정보를 함께 갱신한다.
export function applyPageSeo(seo: PageSeo): void {
  document.title = seo.title;
  for (const [attribute, name, content] of [
    ['name', 'description', seo.description], ['name', 'robots', seo.robots],
    ['property', 'og:title', seo.title], ['property', 'og:description', seo.description], ['property', 'og:url', seo.canonical], ['property', 'og:image', seo.image], ['property', 'og:type', 'website'],
    ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', seo.title], ['name', 'twitter:description', seo.description], ['name', 'twitter:image', seo.image],
  ]) {
    const element = pageHeadElement(`meta[${attribute}="${name}"]`, 'meta'); element.setAttribute(attribute, name); element.content = content;
  }
  const canonical = pageHeadElement('link[rel="canonical"]', 'link'); canonical.rel = 'canonical'; canonical.href = seo.canonical;
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((link) => link.remove());
  for (const alternate of seo.alternates || []) {
    const link = document.createElement('link'); link.rel = 'alternate'; link.hreflang = alternate.language; link.href = alternate.href; document.head.append(link);
  }
  const structured = pageHeadElement('script[type="application/ld+json"]', 'script'); structured.type = 'application/ld+json'; structured.textContent = JSON.stringify(pageStructuredData(seo));
}
