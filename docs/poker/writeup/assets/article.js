/* Progressive enhancement: every research figure has a static default. */
'use strict';
const make = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const percentage = value => `${(value * 100).toFixed(1)}%`;
function option(value, label) {
  const node = make('option', label); node.value = value; return node;
}
function enhance(host, content) {
  host.querySelector('.static-fallback').hidden = true;
  host.append(content);
}
function cardGroup(label, cards) {
  const group = make('div'); group.append(make('div', label, 'card-label'));
  const row = make('div', undefined, 'cards');
  const suits = {s: '♠', h: '♥', d: '♦', c: '♣'};
  for (const card of cards) {
    const suit = card.slice(-1); const rank = card.slice(0, -1);
    const node = make('span', `${rank}${suits[suit] || suit}`, `playing-card ${'hd'.includes(suit) ? 'red' : ''}`);
    const names = {s: 'spades', h: 'hearts', d: 'diamonds', c: 'clubs'};
    node.setAttribute('aria-label', `${rank} of ${names[suit] || suit}`); row.append(node);
  }
  group.append(row); return group;
}
function bars(hand, probabilities) {
  const area = make('div');
  hand.candidates.forEach((action, i) => {
    const row = make('div', undefined, 'probability-row');
    const label = make('div', undefined, 'probability-label');
    label.append(make('span', action), make('span', percentage(probabilities[i])));
    const track = make('div', undefined, 'bar-track');
    track.setAttribute('aria-hidden', 'true');
    const fill = make('div', undefined, 'bar-fill'); fill.style.width = `${probabilities[i] * 100}%`;
    track.append(fill); row.append(label, track); area.append(row);
  });
  return area;
}
function handWidget(host, data) {
  const root = make('div');
  const controls = make('div', undefined, 'widget-controls');
  const label = make('label', 'Recorded held-out example'); label.htmlFor = 'hand-choice';
  const select = make('select'); select.id = 'hand-choice';
  data.examples.forEach((hand, i) => select.append(option(String(i), hand.category)));
  controls.append(label, select); const stage = make('div');
  root.append(controls, stage);
  function draw() {
    const hand = data.examples[Number(select.value)]; stage.replaceChildren();
    const layout = make('div', undefined, 'hand-layout');
    const state = make('div'); state.append(make('p', hand.street, 'eyebrow'));
    const hero = /Hero cards: ([^.]+)/.exec(hand.context);
    const board = /Board: ([^.]+)/.exec(hand.context);
    if (hero) state.append(cardGroup('Hero cards', hero[1].trim().split(/\s+/)));
    if (board) state.append(cardGroup('Board', board[1].trim().split(/\s+/)));
    state.append(make('p', hand.context, 'context-text'));
    const scores = make('div'); scores.append(make('p', 'BERT Mini · linear head', 'eyebrow'), bars(hand, hand.probabilities));
    scores.append(make('p', `Model choice: ${hand.candidates[hand.prediction_index]}`, 'prediction-note'));
    const reveal = make('button', 'Reveal reference'); reveal.type = 'button';
    const reference = make('p', '', 'reference'); reference.setAttribute('aria-live', 'polite');
    reveal.addEventListener('click', () => {
      reference.textContent = `Reference: ${hand.candidates[hand.target_index]}. ${hand.prediction_index === hand.target_index ? 'The top choice agrees.' : 'The top choice differs.'}`;
      reveal.hidden = true;
    });
    scores.append(reveal, reference);
    const comparison = make('details'); comparison.append(make('summary', 'Compare the linear candidate baseline'), bars(hand, hand.baseline_probabilities)); scores.append(comparison);
    layout.append(state, scores); stage.append(layout);
    const input = make('details'); input.append(make('summary', 'Inspect the label-free model input'));
    input.append(make('pre', `State: ${hand.context}\nQuestion: What should Hero do?\nDecisions:\n${hand.candidates.join('\n')}`));
    stage.append(input, make('p', `${hand.source_id} · held out in fold ${hand.fold} · selected illustration, not an evaluation sample`, 'source-note'));
  }
  select.addEventListener('change', draw); draw(); enhance(host, root);
}
function architectureWidget(host, data) {
  const root = make('div'); root.append(make('p', 'Follow one candidate through the shared model', 'eyebrow'));
  const buttons = make('div', undefined, 'candidate-spans');
  const sequence = make('div', undefined, 'serialized-sequence');
  function highlight(candidate) {
    sequence.replaceChildren(make('span', '[CLS] State: … Question: What should Hero do? [SEP] '));
    for (const action of data.examples[0].candidates) {
      sequence.append(make(action === candidate ? 'mark' : 'span', action), make('span', ' [SEP] '));
    }
  }
  const explanation = make('p', '', 'diagram-explanation'); explanation.setAttribute('aria-live', 'polite');
  data.examples[0].candidates.forEach((candidate, index) => {
    const button = make('button', candidate); button.type = 'button';
    button.setAttribute('aria-pressed', String(index === 0));
    button.addEventListener('click', () => {
      for (const other of buttons.children) other.setAttribute('aria-pressed', String(other === button));
      highlight(candidate);
      explanation.textContent = `The tokens belonging to “${candidate}” are contextualized alongside the state and every other option, mean-pooled, and scored by the same head used for all candidates.`;
    }); buttons.append(button);
  });
  const flow = make('div', undefined, 'architecture-flow');
  ['State + question + all options', 'One pretrained encoder', 'Pool selected candidate span', 'Shared head → softmax'].forEach(text => flow.append(make('div', text, 'architecture-step')));
  root.append(buttons, sequence, flow, explanation); buttons.firstElementChild.click(); enhance(host, root);
}
// Inline SVG keeps marks interactive; CSS and measured widths reflow each panel.
const chartColors = {bert_mini:'#28786b', minilm:'#b47b32', distilbert:'#576ca2', modernbert:'#8d587c', baseline:'#6b6b68'};
const modelNames = {bert_mini:'BERT Mini', minilm:'MiniLM', distilbert:'DistilBERT', modernbert:'ModernBERT', linear_candidate:'Linear candidate', option_prior:'Option prior', uniform:'Uniform'};
const exactPercent = value => `${(value * 100).toFixed(2)}%`;
const exactLoss = value => value.toFixed(4);
function svgNode(tag, attrs = {}, text) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}
function chartFigure(specs) {
  const root = make('div', undefined, 'chart-explorer');
  root.append(make('p', 'Hover, tap, or focus a point to compare values. Use arrow keys to move between points; Escape clears the selection.', 'chart-help'));
  const grid = make('div', undefined, 'chart-grid');
  const readout = make('div', undefined, 'chart-readout');
  readout.setAttribute('aria-live', 'polite'); readout.setAttribute('aria-atomic', 'true');
  const reset = make('button', 'Clear selection', 'chart-reset'); reset.type = 'button';
  const details = make('details'); details.append(make('summary', 'Read exact values as a table'));
  const wrap = make('div', undefined, 'figure-table-wrap'); const table = make('table');
  table.append(make('caption', 'Recorded results shown in the charts.'));
  const head = make('thead'); const header = make('tr');
  ['Panel', 'Series', 'Condition', 'Value'].forEach(label => { const th = make('th', label); th.scope = 'col'; header.append(th); });
  head.append(header); table.append(head); const body = make('tbody'); table.append(body);
  for (const spec of specs) for (const series of spec.series) spec.labels.forEach((label, i) => {
    const row = make('tr'); row.dataset.pointKey = String(i);
    [spec.title, series.name, label, spec.format(series.values[i])].forEach(value => row.append(make('td', value)));
    body.append(row);
  });
  wrap.append(table); details.append(wrap); root.append(grid, readout, reset, details);
  let selected = null;
  function select(index) {
    selected = index;
    root.classList.toggle('has-selection', index !== null);
    root.querySelectorAll('[data-point-key]').forEach(node => node.classList.toggle('is-selected', index !== null && node.dataset.pointKey === String(index)));
    if (index === null) { readout.replaceChildren(make('span', 'Select a point to see its exact values.', 'chart-placeholder')); return; }
    readout.replaceChildren(make('strong', specs[0].labels[index]));
    for (const spec of specs) {
      const line = make('div', undefined, 'chart-readout-line');
      line.append(make('span', `${spec.title}: `));
      line.append(make('span', spec.series.map(series => `${series.name} ${spec.format(series.values[index])}`).join(' · ')));
      readout.append(line);
    }
  }
  reset.addEventListener('click', () => select(null));
  root.addEventListener('keydown', event => { if (event.key === 'Escape') select(null); });
  function drawPanel(spec, panel, width) {
    const horizontal = Boolean(spec.horizontal);
    const height = horizontal ? spec.labels.length * 31 + 54 : 268;
    const left = horizontal ? Math.min(162, width * .43) : 48;
    const right = width - 18; const top = 20; const bottom = height - (horizontal ? 32 : 62);
    const values = spec.series.flatMap(series => series.values);
    const lo = Math.min(...values); const hi = Math.max(...values);
    // A displayed, padded extent exposes small differences without suggesting a zero baseline.
    const padding = Math.max((hi - lo) * .15, hi * .025, .01);
    const min = Math.max(0, lo - padding); const max = spec.percent ? Math.min(1, hi + padding) : hi + padding;
    const valuePos = value => horizontal ? left + (value - min) / (max - min) * (right - left) : bottom - (value - min) / (max - min) * (bottom - top);
    const categoryPos = i => horizontal ? top + i * 31 : left + (right - left) * (spec.xPositions ? spec.xPositions[i] : i / Math.max(1, spec.labels.length - 1));
    const svg = svgNode('svg', {viewBox:`0 0 ${width} ${height}`, width, height, role:'group', 'aria-label':spec.title});
    svg.append(svgNode('title', {}, `${spec.title}. ${spec.percent ? 'Higher is better.' : 'Lower is better.'} Select points for exact values; the full data is also available in the table.`));
    for (let i = 0; i <= 4; i++) {
      const value = min + (max - min) * i / 4; const at = valuePos(value);
      svg.append(svgNode('line', {x1:horizontal ? at : left, x2:horizontal ? at : right, y1:horizontal ? top - 10 : at, y2:horizontal ? bottom - 8 : at, class:'chart-gridline'}));
      svg.append(svgNode('text', {x:horizontal ? at : left - 8, y:horizontal ? bottom + 13 : at + 4, 'text-anchor':horizontal ? 'middle' : 'end', class:'chart-tick'}, spec.percent ? `${(value * 100).toFixed(0)}%` : value.toFixed(2)));
    }
    spec.labels.forEach((label, i) => {
      svg.append(svgNode('text', {x:horizontal ? left - 12 : categoryPos(i), y:horizontal ? categoryPos(i) + 4 : bottom + 22, 'text-anchor':horizontal ? 'end' : (i === 0 ? 'start' : i === spec.labels.length - 1 ? 'end' : 'middle'), class:'chart-tick'}, label));
    });
    if (!horizontal) svg.append(svgNode('text', {x:(left + right) / 2, y:height - 9, 'text-anchor':'middle', class:'chart-axis-label'}, spec.xLabel));
    spec.series.forEach((series, seriesIndex) => {
      const layer = svgNode('g');
      if (!horizontal) layer.append(svgNode('polyline', {points:series.values.map((value,i) => `${categoryPos(i)},${valuePos(value)}`).join(' '), fill:'none', stroke:series.color, 'stroke-width':2, 'stroke-dasharray':series.dashed ? '5 4' : 'none'}));
      series.values.forEach((value, i) => {
        const x = horizontal ? valuePos(value) : categoryPos(i); const y = horizontal ? categoryPos(i) : valuePos(value);
        const pointColor = series.pointColors?.[i] || series.color;
        const diamond = series.pointDiamonds?.[i] ?? series.dashed;
        const point = svgNode('g', {class:'chart-point', 'data-point-key':i, role:'button', tabindex:i === 0 && seriesIndex === 0 ? 0 : -1, 'aria-label':`${spec.labels[i]}, ${series.name}: ${spec.format(value)}`});
        // Large invisible hit areas support touch without distorting the plotted mark.
        point.append(svgNode('circle', {cx:x, cy:y, r:14, fill:'transparent'}));
        point.append(svgNode(diamond ? 'rect' : 'circle', diamond
          ? {x:x-4,y:y-4,width:8,height:8,fill:pointColor,transform:`rotate(45 ${x} ${y})`,class:'chart-mark'}
          : {cx:x,cy:y,r:4.5,fill:pointColor,class:'chart-mark'}));
        point.addEventListener('pointerenter', () => select(i)); point.addEventListener('click', () => select(i));
        point.addEventListener('focus', () => select(i));
        point.addEventListener('keydown', event => {
          const points = [...svg.querySelectorAll('.chart-point')]; const current = points.indexOf(point);
          let next;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (current + 1) % points.length;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (current - 1 + points.length) % points.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = points.length - 1;
          if (next !== undefined) { event.preventDefault(); points.forEach(p => p.setAttribute('tabindex', '-1')); points[next].setAttribute('tabindex', '0'); points[next].focus(); }
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(i); }
        });
        layer.append(point);
      }); svg.append(layer);
    });
    const previous = panel.querySelector('svg'); if (previous) previous.replaceWith(svg); else panel.append(svg);
  }
  const panels = specs.map(spec => {
    const panel = make('section', undefined, 'chart-panel');
    panel.append(make('h3', spec.title));
    const legend = make('div', undefined, 'chart-legend');
    for (const series of (spec.legend || spec.series)) {
      const label = make('span', series.name); label.style.setProperty('--series-color', series.color);
      if (series.dashed) label.classList.add('diamond'); legend.append(label);
    }
    panel.append(legend); grid.append(panel); return panel;
  });
  let lastWidth = 0;
  const observer = new ResizeObserver(() => {
    const width = Math.floor(panels[0].getBoundingClientRect().width);
    if (width < 1 || width === lastWidth) return; lastWidth = width;
    panels.forEach((panel, i) => drawPanel(specs[i], panel, width)); select(selected);
  });
  observer.observe(grid); root.dispose = () => observer.disconnect(); select(null); return root;
}
function modelWidget(host, data) {
  const root = make('div'); const controls = make('div', undefined, 'widget-controls');
  const label = make('label', 'Accuracy population'); label.htmlFor = 'metric-choice';
  const choice = make('select'); choice.id = 'metric-choice';
  choice.append(option('overall', 'All 10,000 decisions'), option('multi', 'Only decisions with multiple options'));
  controls.append(label, choice); const stage = make('div'); root.append(controls, stage);
  function draw() {
    const labels = data.models.map(row => `${modelNames[row.backbone === 'baseline' ? row.model : row.backbone]}${row.backbone === 'baseline' ? '' : ' ' + row.model.split('_').pop()}`);
    const specs = [['Exact accuracy ↑', choice.value === 'multi' ? 'multi_option_exact_accuracy' : 'exact_accuracy', true], ['Log loss ↓', 'log_loss', false]].map(([title,key,percent]) => ({
      title, labels, horizontal:true, percent, format:percent ? exactPercent : exactLoss,
      series: [{name:percent ? (choice.value === 'multi' ? 'Multi-option decisions' : 'All decisions') : 'All decisions', color:chartColors.bert_mini, values:data.models.map(row => row[key])}]
    }));
    for (const spec of specs) {
      spec.series[0].pointColors = data.models.map(row => chartColors[row.backbone]);
      spec.series[0].pointDiamonds = data.models.map(row => row.model === 'transformer_mlp');
      spec.legend = [{name:'Baselines',color:chartColors.baseline}, ...['bert_mini','minilm','distilbert','modernbert'].map(key => ({name:modelNames[key],color:chartColors[key]})), {name:'MLP head',color:'#68716a',dashed:true}];
    }
    stage.firstElementChild?.dispose(); stage.replaceChildren(chartFigure(specs));
  }
  choice.addEventListener('change', draw); draw(); enhance(host, root);
}
function metricSpecs(labels, xLabel, series, accuracyKey = 'accuracy', titlePrefix = '') {
  return [['Accuracy ↑',accuracyKey,true], ['Log loss ↓','log_loss',false]].map(([title,key,percent]) => ({
    title:titlePrefix + title, labels, xLabel, percent, format:percent ? exactPercent : exactLoss,
    series:series.map(s => ({...s, values:s.rows.map(row => row[key])}))
  }));
}
function streetWidget(host, data) {
  const streets = ['preflop','flop','turn','river'];
  const labels = ['Preflop · 5,000','Flop · 310','Turn · 2,021','River · 2,669'];
  const series = ['bert_mini','modernbert'].map(backbone => ({name:modelNames[backbone],color:chartColors[backbone],dashed:backbone === 'modernbert', rows:streets.map(street => data.streets[backbone][street])}));
  // Short axis labels keep categorical positions readable at phone widths.
  const specs = metricSpecs(streets.map(s => s[0].toUpperCase() + s.slice(1)), 'Street (categorical)', series, 'exact_accuracy');
  const root = chartFigure(specs); root.append(make('p', labels.join(' · '), 'source-note')); enhance(host, root);
}
function leducWidget(host, data) {
  const keys = ['no_history','history_4','history_16','history_64','history_all'];
  const specs = metricSpecs(['None','4','16','64','All'], 'History window (completed hands)', [{name:'Masked logistic forecaster', color:chartColors.bert_mini, rows:keys.map(key => data.leduc[key])}]);
  enhance(host, chartFigure(specs));
}
function holdemWidget(host, data) {
  const specs = ['decision','forecaster'].flatMap(model => {
    const series = ['without_history','with_history'].map(variant => ({
      name:variant === 'with_history' ? 'With history' : 'No history', color:variant === 'with_history' ? chartColors.bert_mini : chartColors.baseline, dashed:variant === 'with_history',
      rows:data.holdem.filter(row => row.model === model && row.variant === variant && row.validation_scope === 'expanded').sort((a,b) => a.train_examples - b.train_examples)
    }));
    return metricSpecs(['128','1,024','4,096'], 'Training decisions (log₂ scale · one epoch)', series, 'accuracy', model === 'decision' ? 'BERT Mini · ' : 'Forecaster · ').map(spec => ({...spec, xPositions:[0,.6,1]}));
  });
  enhance(host, chartFigure(specs));
}
const liveButton = document.getElementById('load-demo');
if (liveButton) liveButton.addEventListener('click', () => {
  const frame = make('iframe'); frame.title = 'PocketSolver live held-out hand comparison';
  frame.src = 'https://nmokey-poker-decision-model-deploystreamlitapp-codexdepl-dhuhge.streamlit.app/?embed=true';
  frame.loading = 'lazy'; frame.referrerPolicy = 'strict-origin-when-cross-origin';
  document.getElementById('demo-frame').append(frame); liveButton.hidden = true;
  const reload = document.getElementById('reload-article-demo');
  if (reload) { reload.hidden = false; reload.addEventListener('click', () => { frame.src = frame.getAttribute('src'); }); }
});
const embeddedData = document.getElementById('report-data');
const loadData = embeddedData
  ? Promise.resolve().then(() => JSON.parse(embeddedData.textContent))
  : fetch('generated/report-data.json').then(response => {
  if (!response.ok) throw new Error(`Data unavailable (${response.status})`);
  return response.json();
});
loadData.then(data => {
  const widgets = {hand: handWidget, architecture: architectureWidget, models: modelWidget, streets: streetWidget, leduc: leducWidget, holdem: holdemWidget};
  document.querySelectorAll('[data-widget]').forEach(host => {
    try { widgets[host.dataset.widget](host, data); }
    catch (error) { console.error('Figure enhancement failed', error); }
  });
}).catch(() => {
  document.querySelectorAll('[data-widget]').forEach(host => {
    host.append(make('p', 'Interactive data could not be loaded. The static figure remains available.', 'source-note'));
  });
});


// Track headings independently of figure data, including direct-file navigation.
function setupContents() {
  const nav = document.getElementById('TOC');
  const list = nav?.querySelector(':scope > ul');
  if (!list) return;
  const overview = document.querySelector('#title-block-header .abstract');
  if (overview) {
    overview.id = 'overview';
    const item = make('li');
    const link = make('a', 'Overview'); link.href = '#overview';
    item.append(link); list.prepend(item);
  }
  const tree = make('div', undefined, 'toc-tree');
  list.replaceWith(tree); tree.append(list);
  const indicator = make('span', undefined, 'toc-indicator');
  indicator.setAttribute('aria-hidden', 'true'); tree.append(indicator);
  const entries = [...list.querySelectorAll('a[href^="#"]')].map(link => ({
    link, heading: document.getElementById(decodeURIComponent(link.hash.slice(1)))
  })).filter(entry => entry.heading);
  if (!entries.length) return;
  let frame;
  function update() {
    frame = undefined;
    const threshold = Math.min(96, window.innerHeight * .15);
    let active = entries[0];
    for (const entry of entries) {
      if (entry.heading.getBoundingClientRect().top <= threshold) active = entry;
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      active = entries[entries.length - 1];
    }
    // A narrow layout hides nested links; mark the visible parent instead.
    let target = active.link;
    while (!target.getClientRects().length) {
      const parent = target.parentElement.parentElement.closest('li');
      if (!parent) break;
      target = parent.querySelector(':scope > a');
    }
    for (const entry of entries) {
      const selected = entry.link === target;
      entry.link.classList.toggle('active', selected);
      if (selected) entry.link.setAttribute('aria-current', 'location');
      else entry.link.removeAttribute('aria-current');
    }
    const row = target.getBoundingClientRect();
    const bounds = tree.getBoundingClientRect();
    const offset = row.top - bounds.top + tree.scrollTop;
    indicator.style.transform = `translateY(${offset}px)`;
    indicator.style.height = `${row.height}px`;
    if (getComputedStyle(nav).position === 'fixed') {
      const padding = 16;
      if (row.top < bounds.top + padding) tree.scrollTop = Math.max(0, offset - padding);
      else if (row.bottom > bounds.bottom - padding) {
        tree.scrollTop = offset + row.height - tree.clientHeight + padding;
      }
    }
  }
  function schedule() {
    if (frame === undefined) frame = requestAnimationFrame(update);
  }
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule);
  window.addEventListener('hashchange', schedule);
  // Widgets, math typesetting, and image loads can change section positions.
  const observer = new ResizeObserver(schedule);
  observer.observe(document.getElementById('article'));
  observer.observe(tree);
  document.fonts.ready.then(schedule);
  update();
}
setupContents();
