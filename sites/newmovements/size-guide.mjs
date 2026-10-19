import { SIZE_CHARTS, SIZE_GUIDE_SOURCE } from './size-guide-data.mjs';
import { translator } from './locales.mjs';

const escape = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
// Retired workbook charts remain in source for provenance, not shopper navigation.
const activeCharts = SIZE_CHARTS.filter(chart => !['classic', 'sandals'].includes(chart.id));
const audiences = (t) => ({ all: t('All sizes', 'Alle størrelser', "Alle Größen"), women: t('Women', 'Dame', "Damen"), men: t('Men', 'Herre', "Herren") });

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

const measureIllustration = (t) => `<svg viewBox="0 0 340 220" fill="none" role="img" aria-labelledby="sg-measure-title"><title id="sg-measure-title">${t('Measure from the back of your heel to the tip of your longest toe', 'Mål fra baksiden av hælen til tuppen av den lengste tåen', "Miss von der Rückseite deiner Ferse bis zur Spitze deines längsten Zehs")}</title><path d="M62 28H306V196H62Z" fill="#fff" stroke="#c8c5bd"/><path d="M118 157c-10-19-13-45-9-70 2-11 4-27 11-34 6-6 12-1 12 8 0-18 16-20 18-6 2-13 17-13 17 0 6-11 18-6 15 7 12-7 20 1 15 12-11 24-23 30-25 51-1 12 5 21 3 32-4 28-43 27-57 0Z" fill="#efede7" stroke="#333" stroke-width="2"/><path d="M220 52V179M214 58l6-6 6 6M214 173l6 6 6-6M94 179H238M108 52H238" stroke="#111" stroke-width="1.5"/><path d="M25 25V196H306" stroke="#777" stroke-width="4"/><text x="241" y="120" fill="#333" font-family="sans-serif" font-size="13">${t('Heel', 'Hæl', "Ferse")}</text><text x="241" y="138" fill="#333" font-family="sans-serif" font-size="13">${t('to toe', 'til tå', "bis Zeh")}</text></svg>`;

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
    : [[t('US women', 'US dame', "US Damen"), 'usWomen'], [t('US men', 'US herre', "US Herren"), 'usMen'], [t('UK women', 'UK dame', "UK Damen"), 'ukWomen'], [t('UK men', 'UK herre', "UK Herren"), 'ukMen']];
  if (audience === 'all' && chart.ukShared) columns.splice(2, 2, ['UK', 'ukWomen']);
  const lengthMeaning = chart.lengthMeaning || SIZE_GUIDE_SOURCE.lengthMeaning;
  const lengthReady = ['foot', 'internal', 'last'].includes(lengthMeaning);
  const lengthLabel = lengthMeaning === 'foot' ? t('Foot length', 'Fotlengde', "Fußlänge") : lengthMeaning === 'internal' ? t('Internal length', 'Innvendig lengde', "Innenlänge") : t('Last length', 'Lestlengde', "Leistenlänge");
  if (lengthReady) columns.push([`${lengthLabel} · ${unit === 'in' ? t('inches', 'tommer', "Zoll") : 'cm'}`, 'lengthCm']);
  const link = (style, view, lengthUnit = unit) => escape(sizeGuideUrl(style, view, params.get('size') || '', lengthUnit));
  const cell = (row, key) => row[key] == null ? `<span aria-label="${t('Conversion not listed', 'Omregning er ikke oppgitt', "Umrechnung nicht aufgeführt")}">—</span>` : escape(key === 'lengthCm' && unit === 'in' ? (row[key] / 2.54).toFixed(2) : row[key]);
  return `<div class="size-guide-content" data-size-guide-content>
    <header class="sg-heading"><p class="eyebrow">${t('A little guidance goes a long way', 'Litt veiledning kommer langt', "Ein wenig Orientierung hilft viel")}</p><h1>${t('Find your fit.', 'Finn din størrelse.', "Finde deine Passform.")}</h1><p>${t('Choose your style. Compare your size. Make room for movement.', 'Velg modell. Sammenlign størrelse. Gi plass til bevegelse.', "Wähle deinen Style. Vergleiche deine Größe. Schaffe Raum für Bewegung.")}</p></header>
    <div class="sg-layout"><nav class="sg-styles" aria-label="${t('Shoe style', 'Skomodell', "Schuhstil")}">${activeCharts.map(item => `<a href="${link(item.id, audience)}"${item === chart ? ' aria-current="page"' : ''}><span>${escape(item.label)}</span><span aria-hidden="true">↗</span></a>`).join('')}</nav>
    <section class="sg-chart" aria-labelledby="sg-chart-title"><header><p class="eyebrow">${t('Size chart', 'Størrelsestabell', "Größentabelle")}</p><h2 id="sg-chart-title">${escape(chart.label)}</h2><p class="sg-models">${chart.models.map(escape).join(' · ')}</p></header>
    <div class="sg-chart-controls"><nav class="sg-audiences" aria-label="${t('Size conversion', 'Størrelsesomregning', "Größenumrechnung")}">${Object.entries(labels).map(([key, label]) => `<a href="${link(chart.id, key)}"${key === audience ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>${lengthReady ? `<nav class="sg-units" aria-label="${t('Measurement unit', 'Måleenhet', "Maßeinheit")}">${[['cm', 'cm'], ['in', t('inches', 'tommer', "Zoll")]].map(([key, label]) => `<a href="${link(chart.id, audience, key)}"${key === unit ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>` : ''}</div>
    <div class="sg-table-scroll" role="region" aria-label="${escape(t(`${chart.label} size conversions`, `Størrelsesomregning for ${chart.label}`, "" + (chart.label) + " Größenumrechnungen"))}" tabindex="0"><table class="sg-table"><caption class="sr-only">${escape(chart.label)} · ${escape(labels[audience])}</caption><thead><tr><th scope="col">EU</th>${columns.map(([label]) => `<th scope="col">${escape(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr${row.eu === selectedSize ? ' class="is-selected"' : ''}><th scope="row">${row.eu}${row.eu === selectedSize ? `<span class="sr-only"> ${t('(selected size)', '(valgt størrelse)', "(ausgewählte Größe)")}</span>` : ''}</th>${columns.map(([, key]) => `<td>${cell(row, key)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    ${lengthMeaning === 'foot' ? `<p class="sg-measure-note">${t('Compare the heel-to-toe measurement of your longer foot with the chart. Measurements are an approximate guide; fit varies by style.', 'Sammenlign målet fra hæl til tå på den største foten med tabellen. Målene er omtrentlige, og passformen varierer fra modell til modell.', "Vergleiche das Maß von der Ferse bis zum Zeh deines längeren Fußes mit der Tabelle. Die Maße sind ein ungefährer Richtwert; die Passform variiert je nach Style.")}</p>` : ''}
    <p class="sg-chart-note">${t('EU is the size you select when ordering. A dash means a conversion is not listed. Available sizes are shown on each product.', 'EU er størrelsen du velger når du bestiller. En strek betyr at omregningen ikke er oppgitt. Tilgjengelige størrelser står på hvert produkt.', "EU ist die Größe, die du bei der Bestellung auswählst. Ein Strich bedeutet, dass keine Umrechnung aufgeführt ist. Verfügbare Größen werden bei jedem Produkt angezeigt.")}</p>
    <a class="sg-help-link" href="mailto:store@newmovements.com?subject=${encodeURIComponent(t(`Size advice: ${chart.label}`, `Råd om størrelse: ${chart.label}`, "Größenempfehlung: " + (chart.label) + ""))}">${t('Between sizes or need advice? Ask our team →', 'Mellom to størrelser, eller trenger du råd? Spør teamet vårt →', "Zwischen zwei Größen oder brauchst du Rat? Frag unser Team →")}</a></section></div>
    <section class="sg-measure" aria-labelledby="sg-measure-heading"><div class="sg-measure-art">${measureIllustration(t)}</div><div><p class="eyebrow">${t('Start with your feet', 'Start med føttene', "Beginne mit deinen Füßen")}</p><h2 id="sg-measure-heading">${t('A good fit starts here.', 'God passform starter her.', "Eine gute Passform beginnt hier.")}</h2><ol><li>${t('Wear the socks you plan to wear with your shoes.', 'Ha på sokkene du skal bruke med skoene.', "Trage die Socken, die du mit deinen Schuhen tragen möchtest.")}</li><li>${t('Stand on paper with your heel gently against a wall.', 'Stå på et ark med hælen lett inntil en vegg.', "Stell dich auf ein Blatt Papier, mit der Ferse leicht an eine Wand.")}</li><li>${t('Mark your longest toe, then measure from the wall to the mark.', 'Marker den lengste tåen, og mål fra veggen til merket.', "Markiere deinen längsten Zeh und miss dann von der Wand bis zur Markierung.")}</li><li>${t('Measure both feet and compare the longer measurement with your style’s chart. Between sizes? Ask our team for advice.', 'Mål begge føttene, og sammenlign det største målet med tabellen for modellen. Er du mellom to størrelser? Spør teamet vårt om råd.', "Miss beide Füße und vergleiche das längere Maß mit der Tabelle deines Styles. Zwischen zwei Größen? Frag unser Team um Rat.")}</li></ol><p>${t('Different styles fit differently. If your model or size isn’t listed, we’re happy to help.', 'Modellene har ulik passform. Står ikke modellen eller størrelsen din i tabellen, hjelper vi deg gjerne.', "Verschiedene Styles sitzen unterschiedlich. Wenn dein Modell oder deine Größe nicht aufgeführt ist, helfen wir dir gern weiter.")}</p></div></section>
    <section class="sg-support"><div><h2>${t('Try them at home.', 'Prøv dem hjemme.', "Probiere sie zu Hause an.")}</h2><p>${t('Try your shoes indoors on a clean surface, keeping the soles and packaging in their original condition.', 'Prøv skoene innendørs på et rent gulv, og hold sålene og emballasjen i original stand.', "Probiere deine Schuhe drinnen auf einer sauberen Oberfläche an und halte Sohlen und Verpackung im Originalzustand.")}</p><a href="/pages/returns">${t('Free returns within 30 days · Free exchanges →', 'Gratis retur innen 30 dager · Gratis bytte →', "Kostenlose Rückgabe innerhalb von 30 Tagen · Kostenloser Umtausch →")}</a></div><div><h2>${t('Here to help.', 'Vi hjelper deg.', "Wir helfen dir gern.")}</h2><p>${t('Share your usual size, foot measurement and the style you have in mind.', 'Fortell oss hvilken størrelse du vanligvis bruker, fotmålet ditt og hvilken modell du ser på.', "Teile uns deine übliche Größe, dein Fußmaß und den Style mit, den du im Kopf hast.")}</p><a href="mailto:store@newmovements.com">store@newmovements.com →</a></div></section>
  </div>`;
}

export const renderSizeGuideDialog = (locale = '') => `<dialog class="size-guide-dialog" data-size-guide-dialog aria-labelledby="size-guide-dialog-title"><header class="sg-dialog-header"><h2 id="size-guide-dialog-title">${translator(locale)('Size guide', 'Størrelsesguide')}</h2><button type="button" data-size-guide-close aria-label="${translator(locale)('Close size guide', 'Lukk størrelsesguiden')}">×</button></header><div class="sg-dialog-body" data-size-guide-body></div></dialog>`;
