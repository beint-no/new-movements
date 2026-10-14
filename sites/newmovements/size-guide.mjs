import { SIZE_CHARTS, SIZE_GUIDE_SOURCE } from './size-guide-data.mjs';

const escape = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const audiences = { all: 'All sizes', women: 'Women', men: 'Men' };

// Explicit brand model families, not a second commerce taxonomy. Unlisted models
// open the general guide rather than silently receiving another model's fit.
export function sizeChartForProduct(product) {
  const handle = product?.handle || '';
  if (/^(original|allrounder(?:-e|-y)?|norwegian-sneaker|zen)-/.test(handle) && !handle.startsWith('allrounder-s-')) return 'sneakers';
  if (/^(flow-boot|cloud-boot|space-boot|high-space-boot|moss|low-cloud)-/.test(handle)) return 'boots';
  if (/^loafer-/.test(handle)) return 'loafers';
  if (/^(classic|cruiser)-/.test(handle)) return 'classic';
  if (/^(the-)?everyday-sandal(?:-|$)/.test(handle)) return 'sandals';
  return '';
}

export function sizeGuideUrl(style = '', view = '', size = '', unit = 'cm') {
  const params = new URLSearchParams();
  if (SIZE_CHARTS.some(chart => chart.id === style)) params.set('style', style);
  if (view === 'women' || view === 'men') params.set('view', view);
  if (/^\d+(?:\.\d+)?$/.test(String(size))) params.set('size', size);
  if (unit === 'in') params.set('unit', unit);
  return `/pages/size-guide${params.size ? `?${params}` : ''}`;
}

const measureIllustration = `<svg viewBox="0 0 340 220" fill="none" role="img" aria-labelledby="sg-measure-title"><title id="sg-measure-title">Measure from the back of your heel to the tip of your longest toe</title><path d="M62 28H306V196H62Z" fill="#fff" stroke="#c8c5bd"/><path d="M118 157c-10-19-13-45-9-70 2-11 4-27 11-34 6-6 12-1 12 8 0-18 16-20 18-6 2-13 17-13 17 0 6-11 18-6 15 7 12-7 20 1 15 12-11 24-23 30-25 51-1 12 5 21 3 32-4 28-43 27-57 0Z" fill="#efede7" stroke="#333" stroke-width="2"/><path d="M220 52V179M214 58l6-6 6 6M214 173l6 6 6-6M94 179H238M108 52H238" stroke="#111" stroke-width="1.5"/><path d="M25 25V196H306" stroke="#777" stroke-width="4"/><text x="241" y="120" fill="#333" font-family="sans-serif" font-size="13">Heel</text><text x="241" y="138" fill="#333" font-family="sans-serif" font-size="13">to toe</text></svg>`;

export function renderSizeGuide(context = {}) {
  const params = context.url?.searchParams || new URLSearchParams();
  const chart = SIZE_CHARTS.find(item => item.id === params.get('style')) || SIZE_CHARTS[0];
  const audience = Object.hasOwn(audiences, params.get('view') || '') ? params.get('view') : 'all';
  const unit = params.get('unit') === 'in' ? 'in' : 'cm';
  const selectedSize = params.has('size') ? Number(params.get('size')) : null;
  const rows = chart.rows.filter(row => audience === 'women' ? row.eu >= 35 && row.eu <= 42 : audience === 'men' ? row.eu >= 39 && row.eu <= 48 : true);
  const columns = audience === 'women' ? [['US', 'usWomen'], ['UK', 'ukWomen']] : audience === 'men' ? [['US', 'usMen'], ['UK', 'ukMen']] : [['US women', 'usWomen'], ['US men', 'usMen'], ['UK women', 'ukWomen'], ['UK men', 'ukMen']];
  if (audience === 'all' && chart.ukShared) columns.splice(2, 2, ['UK', 'ukWomen']);
  const lengthMeaning = chart.lengthMeaning || SIZE_GUIDE_SOURCE.lengthMeaning;
  const lengthReady = ['foot', 'internal', 'last'].includes(lengthMeaning);
  if (lengthReady) columns.push([`${lengthMeaning === 'foot' ? 'Foot length' : lengthMeaning === 'internal' ? 'Internal length' : 'Last length'} · ${unit === 'in' ? 'inches' : 'cm'}`, 'lengthCm']);
  const link = (style, view, lengthUnit = unit) => escape(sizeGuideUrl(style, view, params.get('size') || '', lengthUnit));
  const cell = (row, key) => row[key] == null ? '<span aria-label="Conversion not listed">—</span>' : escape(key === 'lengthCm' && unit === 'in' ? (row[key] / 2.54).toFixed(2) : row[key]);
  return `<div class="size-guide-content" data-size-guide-content>
    <header class="sg-heading"><p class="eyebrow">A little guidance goes a long way</p><h1>Find your fit.</h1><p>Choose your style. Compare your size. Make room for movement.</p></header>
    <div class="sg-layout"><nav class="sg-styles" aria-label="Shoe style">${SIZE_CHARTS.map(item => `<a href="${link(item.id, audience)}"${item === chart ? ' aria-current="page"' : ''}><span>${escape(item.label)}</span><span aria-hidden="true">↗</span></a>`).join('')}</nav>
    <section class="sg-chart" aria-labelledby="sg-chart-title"><header><p class="eyebrow">Size chart</p><h2 id="sg-chart-title">${escape(chart.label)}</h2><p class="sg-models">${chart.models.map(escape).join(' · ')}</p></header>
    <div class="sg-chart-controls"><nav class="sg-audiences" aria-label="Size conversion">${Object.entries(audiences).map(([key, label]) => `<a href="${link(chart.id, key)}"${key === audience ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>${lengthReady ? `<nav class="sg-units" aria-label="Measurement unit">${[['cm', 'cm'], ['in', 'inches']].map(([key, label]) => `<a href="${link(chart.id, audience, key)}"${key === unit ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>` : ''}</div>
    <div class="sg-table-scroll" role="region" aria-label="${escape(chart.label)} size conversions" tabindex="0"><table class="sg-table"><caption class="sr-only">${escape(chart.label)} · ${escape(audiences[audience])}</caption><thead><tr><th scope="col">EU</th>${columns.map(([label]) => `<th scope="col">${escape(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr${row.eu === selectedSize ? ' class="is-selected"' : ''}><th scope="row">${row.eu}${row.eu === selectedSize ? '<span class="sr-only"> (selected size)</span>' : ''}</th>${columns.map(([, key]) => `<td>${cell(row, key)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    ${lengthMeaning === 'foot' ? '<p class="sg-measure-note">Compare the heel-to-toe measurement of your longer foot with the chart. Measurements are an approximate guide; fit varies by style.</p>' : ''}
    <p class="sg-chart-note">EU is the size you select when ordering. A dash means a conversion is not listed. Available sizes are shown on each product.</p>
    <a class="sg-help-link" href="mailto:store@newmovements.com?subject=${encodeURIComponent(`Size advice: ${chart.label}`)}">Between sizes or need advice? Ask our team →</a></section></div>
    <section class="sg-measure" aria-labelledby="sg-measure-heading"><div class="sg-measure-art">${measureIllustration}</div><div><p class="eyebrow">Start with your feet</p><h2 id="sg-measure-heading">A good fit starts here.</h2><ol><li>Wear the socks you plan to wear with your shoes.</li><li>Stand on paper with your heel gently against a wall.</li><li>Mark your longest toe, then measure from the wall to the mark.</li><li>Measure both feet and compare the longer measurement with your style’s chart. Between sizes? Ask our team for advice.</li></ol><p>Different styles fit differently. If your model or size isn’t listed, we’re happy to help.</p></div></section>
    <section class="sg-support"><div><h2>Try them at home.</h2><p>Try your shoes indoors on a clean surface, keeping the soles and packaging in their original condition.</p><a href="/pages/returns">Free returns within 30 days · Free exchanges →</a></div><div><h2>Here to help.</h2><p>Share your usual size, foot measurement and the style you have in mind.</p><a href="mailto:store@newmovements.com">store@newmovements.com →</a></div></section>
  </div>`;
}

export const renderSizeGuideDialog = () => `<dialog class="size-guide-dialog" data-size-guide-dialog aria-labelledby="size-guide-dialog-title"><header class="sg-dialog-header"><h2 id="size-guide-dialog-title">Size guide</h2><button type="button" data-size-guide-close aria-label="Close size guide">×</button></header><div class="sg-dialog-body" data-size-guide-body></div></dialog>`;
