// Usage: node check-ssr.mjs <url> [width height] [dark]. Set CHROME to Chrome/Chromium's path if it isn't the default.
// Prints when the sheet's content appears and where, frame by frame, from the page's first parse.
import puppeteer from 'puppeteer-core';
const [url, width = '390', height = '844', scheme = 'light'] = process.argv.slice(2);
const executablePath =
  process.env.CHROME ??
  (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/chromium');
const b = await puppeteer.launch({ executablePath, headless: true });
const p = await b.newPage();
await p.setViewport({ width: +width, height: +height });
await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
const logs = [];
p.on('console', (m) => ['error', 'warn'].includes(m.type()) && logs.push(`${m.type()}: ${m.text().slice(0, 300)}`));
p.on('pageerror', (e) => logs.push(`pageerror: ${e.message.slice(0, 300)}`));
// Samples the sheet's position from the first parse on, before and while hydrating.
await p.evaluateOnNewDocument(() => {
  window.__samples = [];
  const t0 = performance.now();
  const sample = () => {
    const text = [...document.querySelectorAll('div')].find((d) => d.textContent === 'The content of the details sheet');
    const drawer = document.querySelector('[data-vaul-drawer]');
    const wrapper = document.querySelector('[data-vaul-detached-wrapper]');
    window.__samples.push({
      t: Math.round(performance.now() - t0),
      content: !!text,
      top: text ? Math.round(text.getBoundingClientRect().top) : null,
      width: wrapper ? Math.round(wrapper.getBoundingClientRect().width) : null,
      background: drawer ? getComputedStyle(drawer.querySelector('[aria-hidden]')).backgroundColor : null,
      inPortal: drawer ? !document.getElementById('root')?.contains(drawer) : null,
    });
    if (performance.now() - t0 < 2500) requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
});
await p.goto(url, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
const samples = await p.evaluate(() => window.__samples);
// Compress: only the samples where something changed.
const changes = samples.filter((s, i) => i === 0 || JSON.stringify({ ...s, t: 0 }) !== JSON.stringify({ ...samples[i - 1], t: 0 }));
console.log('changes:', changes.map((s) => `${s.t}ms content=${s.content} top=${s.top} width=${s.width} background=${s.background} portal=${s.inPortal}`).join('\n  '));
const overlay = await p.evaluate(() => [...document.querySelectorAll('div')].some((d) => d.textContent === 'Overlay'));
console.log('overlay shown:', overlay);
console.log('console errors/warnings:', logs.length ? logs : 'none');
await b.close();
