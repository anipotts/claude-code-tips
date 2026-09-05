import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const output = process.env.ASCII_QA_DIR || path.join(os.tmpdir(), 'ascii-homepage-qa');
await mkdir(output, { recursive: true });
const baseline = process.argv[2];
if (!baseline) throw Error('Pass a built baseline checkout path');
const reports = {};
for (const [label, cwd] of [['before', path.resolve(baseline)], ['after', process.cwd()]]) {
  const server = spawn(process.execPath, [path.resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4178', '--strictPort'], { cwd, stdio: 'inherit' });
  const exit = once(server, 'exit');
  try {
    for (let i=0;i<50;i++) { try { if ((await fetch('http://127.0.0.1:4178/')).ok) break; } catch {} if(i===49) throw Error('preview unavailable'); await new Promise(r=>setTimeout(r,200)); }
    const runs = [];
    for (let i=1;i<=3;i++) {
      const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new','--no-sandbox'] });
      try {
        const r = await lighthouse('http://127.0.0.1:4178/', { port: chrome.port, onlyCategories: ['performance'], output: 'json', logLevel: 'silent' });
        await writeFile(path.join(output, `${label}-lighthouse-${i}.json`), r.report);
        const a = r.lhr.audits;
        runs.push({ score: r.lhr.categories.performance.score * 100, fcp: a['first-contentful-paint'].numericValue, lcp: a['largest-contentful-paint'].numericValue, tbt: a['total-blocking-time'].numericValue, cls: a['cumulative-layout-shift'].numericValue, bytes: a['total-byte-weight'].numericValue });
      } finally { await chrome.kill(); }
    }
    reports[label] = { runs, median: Object.fromEntries(Object.keys(runs[0]).map(k=>[k,runs.map(r=>r[k]).sort((a,b)=>a-b)[1]])) };
    if (label === 'after') {
      const browser = await chromium.launch();
      try {
        const page = await browser.newPage({viewport:{width:1440,height:900}}); await page.goto('http://127.0.0.1:4178/');
        await page.waitForFunction(()=>document.querySelector('.ascii-background')?.dataset.motion==='running');
        const worker = page.workers()[0];
        await worker.evaluate(() => {
          self.frameCosts = [];
          const original = self.setTimeout.bind(self);
          self.setTimeout = (fn, delay, ...args) => original(() => { const start=performance.now(); fn(...args); self.frameCosts.push(performance.now()-start); }, delay);
        });
        const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable');
        const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
        const start = await metrics(); await page.waitForTimeout(10000); const end=await metrics();
        const costs=await worker.evaluate(()=>self.frameCosts);
        costs.sort((a,b)=>a-b);
        reports.runtime={ seconds:10,frames:costs.length,workerFrameP50Ms:costs[Math.floor(costs.length*.5)],workerFrameP95Ms:costs[Math.floor(costs.length*.95)],mainThreadTaskMs:(end.TaskDuration-start.TaskDuration)*1000 };
      } finally {await browser.close();}
    }
  } finally { server.kill('SIGTERM'); await exit; }
}
await writeFile(path.join(output,'performance.json'),JSON.stringify(reports,null,2));
console.log(JSON.stringify(reports,null,2));
if (reports.after.median.score < 99 || reports.after.median.tbt >= 100 || reports.after.median.cls >= .05) throw Error('homepage Lighthouse budget regressed');
if (reports.runtime.workerFrameP95Ms > 16) throw Error('worker frame budget exceeded');
