import { SIZE_CHARTS, SIZE_GUIDE_SOURCE } from './size-guide-data.mjs';
import { translator } from './locales.mjs';

const escape = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
// Retired workbook charts remain in source for provenance, not shopper navigation.
const activeCharts = SIZE_CHARTS.filter(chart => !['classic', 'sandals'].includes(chart.id));
const audiences = (t) => ({ all: t('All sizes', 'Alle størrelser'), women: t('Women', 'Dame'), men: t('Men', 'Herre') });

// Explicit brand model families, not a second commerce taxonomy. Unlisted models
// open the general guide rather than silently receiving another model's fit.
export function sizeChartForProduct(product) {
  const handle = product?.handle || '';
  if (/^(original|allrounder(?:-e|-y)?|norwegian-sneaker|zen)-/.test(handle) && !handle.startsWith('allrounder-s-')) return 'sneakers';
  if (/^(flow-boot|cloud-boot|space-boot|high-space-boot|moss|low-cloud)-/.test(handle)) return 'boots';
  if (/^loafer-/.test(handle)) return 'loafers';
  return '';
}

export function sizeGuideUrl(style = '', view = '', size = '', unit = 'cm') {
  const params = new URLSearchParams();
  if (activeCharts.some(chart => chart.id === style)) params.set('style', style);
  if (view === 'women' || view === 'men') params.set('view', view);
  if (/^\d+(?:\.\d+)?$/.test(String(size))) params.set('size', size);
  if (unit === 'in') params.set('unit', unit);
  return `/pages/size-guide${params.size ? `?${params}` : ''}`;
}

const measureIllustration = (t) => `<svg viewBox="0 0 340 220" fill="none" role="img" aria-labelledby="sg-measure-title"><title id="sg-measure-title">${t('Measure from the back of your heel to the tip of your longest toe', 'Mål fra baksiden av hælen til tuppen av den lengste tåen')}</title><path d="M62 28H306V196H62Z" fill="#fff" stroke="#c8c5bd"/><path d="M118 157c-10-19-13-45-9-70 2-11 4-27 11-34 6-6 12-1 12 8 0-18 16-20 18-6 2-13 17-13 17 0 6-11 18-6 15 7 12-7 20 1 15 12-11 24-23 30-25 51-1 12 5 21 3 32-4 28-43 27-57 0Z" fill="#efede7" stroke="#333" stroke-width="2"/><path d="M220 52V179M214 58l6-6 6 6M214 173l6 6 6-6M94 179H238M108 52H238" stroke="#111" stroke-width="1.5"/><path d="M25 25V196H306" stroke="#777" stroke-width="4"/><text x="241" y="120" fill="#333" font-family="sans-serif" font-size="13">${t('Heel', 'Hæl')}</text><text x="241" y="138" fill="#333" font-family="sans-serif" font-size="13">${t('to toe', 'til tå')}</text></svg>`;

export function renderSizeGuide(context = {}) {
  const t = translator(context.locale);
  const labels = audiences(t);
  const params = context.url?.searchParams || new URLSearchParams();
  const chart = activeCharts.find(item => item.id === params.get('style')) || activeCharts[0];
  const audience = Object.hasOwn(labels, params.get('view') || '') ? params.get('view') : 'all';
  const unit = params.get('unit') === 'in' ? 'in' : 'cm';
  const selectedSize = params.has('size') ? Number(params.get('size')) : null;
  const rows = chart.rows.filter(row => audience === 'women' ? row.eu >= 35 && row.eu <= 42 : audience === 'men' ? row.eu >= 39 && row.eu <= 48 : true);
  const columns = audience === 'women' ? [['US', 'usWomen'], ['UK', 'ukWomen']] : audience === 'men' ? [['US', 'usMen'], ['UK', 'ukMen']]
    : [[t('US women', 'US dame'), 'usWomen'], [t('US men', 'US herre'), 'usMen'], [t('UK women', 'UK dame'), 'ukWomen'], [t('UK men', 'UK herre'), 'ukMen']];
  if (audience === 'all' && chart.ukShared) columns.splice(2, 2, ['UK', 'ukWomen']);
  const lengthMeaning = chart.lengthMeaning || SIZE_GUIDE_SOURCE.lengthMeaning;
  const lengthReady = ['foot', 'internal', 'last'].includes(lengthMeaning);
  const lengthLabel = lengthMeaning === 'foot' ? t('Foot length', 'Fotlengde') : lengthMeaning === 'internal' ? t('Internal length', 'Innvendig lengde') : t('Last length', 'Lestlengde');
  if (lengthReady) columns.push([`${lengthLabel} · ${unit === 'in' ? t('inches', 'tommer') : 'cm'}`, 'lengthCm']);
  const link = (style, view, lengthUnit = unit) => escape(sizeGuideUrl(style, view, params.get('size') || '', lengthUnit));
  const cell = (row, key) => row[key] == null ? `<span aria-label="${t('Conversion not listed', 'Omregning er ikke oppgitt')}">—</span>` : escape(key === 'lengthCm' && unit === 'in' ? (row[key] / 2.54).toFixed(2) : row[key]);
  return `<div class="size-guide-content" data-size-guide-content>
    <header class="sg-heading"><p class="eyebrow">${t('A little guidance goes a long way', 'Litt veiledning kommer langt')}</p><h1>${t('Find your fit.', 'Finn din størrelse.')}</h1><p>${t('Choose your style. Compare your size. Make room for movement.', 'Velg modell. Sammenlign størrelse. Gi plass til bevegelse.')}</p></header>
    <div class="sg-layout"><nav class="sg-styles" aria-label="${t('Shoe style', 'Skomodell')}">${activeCharts.map(item => `<a href="${link(item.id, audience)}"${item === chart ? ' aria-current="page"' : ''}><span>${escape(item.label)}</span><span aria-hidden="true">↗</span></a>`).join('')}</nav>
    <section class="sg-chart" aria-labelledby="sg-chart-title"><header><p class="eyebrow">${t('Size chart', 'Størrelsestabell')}</p><h2 id="sg-chart-title">${escape(chart.label)}</h2><p class="sg-models">${chart.models.map(escape).join(' · ')}</p></header>
    <div class="sg-chart-controls"><nav class="sg-audiences" aria-label="${t('Size conversion', 'Størrelsesomregning')}">${Object.entries(labels).map(([key, label]) => `<a href="${link(chart.id, key)}"${key === audience ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>${lengthReady ? `<nav class="sg-units" aria-label="${t('Measurement unit', 'Måleenhet')}">${[['cm', 'cm'], ['in', t('inches', 'tommer')]].map(([key, label]) => `<a href="${link(chart.id, audience, key)}"${key === unit ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>` : ''}</div>
    <div class="sg-table-scroll" role="region" aria-label="${escape(t(`${chart.label} size conversions`, `Størrelsesomregning for ${chart.label}`))}" tabindex="0"><table class="sg-table"><caption class="sr-only">${escape(chart.label)} · ${escape(labels[audience])}</caption><thead><tr><th scope="col">EU</th>${columns.map(([label]) => `<th scope="col">${escape(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr${row.eu === selectedSize ? ' class="is-selected"' : ''}><th scope="row">${row.eu}${row.eu === selectedSize ? `<span class="sr-only"> ${t('(selected size)', '(valgt størrelse)')}</span>` : ''}</th>${columns.map(([, key]) => `<td>${cell(row, key)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    ${lengthMeaning === 'foot' ? `<p class="sg-measure-note">${t('Compare the heel-to-toe measurement of your longer foot with the chart. Measurements are an approximate guide; fit varies by style.', 'Sammenlign målet fra hæl til tå på den største foten med tabellen. Målene er omtrentlige, og passformen varierer fra modell til modell.')}</p>` : ''}
    <p class="sg-chart-note">${t('EU is the size you select when ordering. A dash means a conversion is not listed. Available sizes are shown on each product.', 'EU er størrelsen du velger når du bestiller. En strek betyr at omregningen ikke er oppgitt. Tilgjengelige størrelser står på hvert produkt.')}</p>
    <a class="sg-help-link" href="mailto:store@newmovements.com?subject=${encodeURIComponent(t(`Size advice: ${chart.label}`, `Råd om størrelse: ${chart.label}`))}">${t('Between sizes or need advice? Ask our team →', 'Mellom to størrelser, eller trenger du råd? Spør teamet vårt →')}</a></section></div>
    <section class="sg-measure" aria-labelledby="sg-measure-heading"><div class="sg-measure-art">${measureIllustration(t)}</div><div><p class="eyebrow">${t('Start with your feet', 'Start med føttene')}</p><h2 id="sg-measure-heading">${t('A good fit starts here.', 'God passform starter her.')}</h2><ol><li>${t('Wear the socks you plan to wear with your shoes.', 'Ha på sokkene du skal bruke med skoene.')}</li><li>${t('Stand on paper with your heel gently against a wall.', 'Stå på et ark med hælen lett inntil en vegg.')}</li><li>${t('Mark your longest toe, then measure from the wall to the mark.', 'Marker den lengste tåen, og mål fra veggen til merket.')}</li><li>${t('Measure both feet and compare the longer measurement with your style’s chart. Between sizes? Ask our team for advice.', 'Mål begge føttene, og sammenlign det største målet med tabellen for modellen. Er du mellom to størrelser? Spør teamet vårt om råd.')}</li></ol><p>${t('Different styles fit differently. If your model or size isn’t listed, we’re happy to help.', 'Modellene har ulik passform. Står ikke modellen eller størrelsen din i tabellen, hjelper vi deg gjerne.')}</p></div></section>
    <section class="sg-support"><div><h2>${t('Try them at home.', 'Prøv dem hjemme.')}</h2><p>${t('Try your shoes indoors on a clean surface, keeping the soles and packaging in their original condition.', 'Prøv skoene innendørs på et rent gulv, og hold sålene og emballasjen i original stand.')}</p><a href="/pages/returns">${t('Free returns within 30 days · Free exchanges →', 'Gratis retur innen 30 dager · Gratis bytte →')}</a></div><div><h2>${t('Here to help.', 'Vi hjelper deg.')}</h2><p>${t('Share your usual size, foot measurement and the style you have in mind.', 'Fortell oss hvilken størrelse du vanligvis bruker, fotmålet ditt og hvilken modell du ser på.')}</p><a href="mailto:store@newmovements.com">store@newmovements.com →</a></div></section>
  </div>`;
}

export const renderSizeGuideDialog = (locale = '') => `<dialog class="size-guide-dialog" data-size-guide-dialog aria-labelledby="size-guide-dialog-title"><header class="sg-dialog-header"><h2 id="size-guide-dialog-title">${translator(locale)('Size guide', 'Størrelsesguide')}</h2><button type="button" data-size-guide-close aria-label="${translator(locale)('Close size guide', 'Lukk størrelsesguiden')}">×</button></header><div class="sg-dialog-body" data-size-guide-body></div></dialog>`;
