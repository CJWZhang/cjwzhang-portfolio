import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const root = path.resolve('dist');
const offline = process.argv.includes('--offline');
const pages = fs.readdirSync(root).filter(file => file.endsWith('.html'));
const redesigned = ['index.html', 'everant.html', 'life.html', 'writing.html'];
const contacts = ['mailto:cjwzhang@mit.edu', 'https://github.com/CJWZhang', 'https://www.linkedin.com/in/carmenjwzhang'];
const refs = new Set();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function checkReference(filename, ref) {
  if (/^(https?:|mailto:|data:)/.test(ref)) return;
  const [file, anchor] = ref.split('#');
  const local = file || filename;
  assert(fs.existsSync(path.join(root, local)), `${filename}: missing ${local}`);
  if (anchor) assert(read(local).includes(`id="${anchor}"`), `${filename}: missing anchor ${ref}`);
  refs.add(local);
}

for (const file of pages) {
  const html = read(file);
  assert(html.includes('>CJWZhang</a>'), `${file}: handle`);
  assert(html.includes('name="viewport"'), `${file}: viewport`);
  assert(html.includes('href="layout.css"'), `${file}: shared page geometry`);
  assert(html.includes('href="theme.css"'), `${file}: shared Monet theme`);
  assert.deepEqual([...html.matchAll(/href="([^"]+\.css)"/g)].map(m => m[1]).slice(-2), ['theme.css', 'layout.css'], `${file}: shared styles loaded last`);
  const navigation = html.match(/<nav class="site-nav" aria-label="Main navigation">([\s\S]*?)<\/nav>/)?.[1];
  assert(navigation, `${file}: shared navigation`);
  assert.deepEqual([...navigation.matchAll(/href="([^"]+)"/g)].map(m => m[1]), ['index.html', 'index.html#work', 'writing.html', 'life.html', 'mailto:cjwzhang@mit.edu'], `${file}: same tabs in same order`);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${file}: one h1`);
  const footer = html.match(/<footer class="footer">([\s\S]*?)<\/footer>/)?.[1];
  assert(footer, `${file}: footer`);
  for (const link of contacts) assert(footer.includes(`href="${link}"`), `${file}: footer contact ${link}`);
  assert(!/built safeguards for LLM-assisted policy editing/i.test(html), `${file}: inaccurate paraphrase`);
  for (const match of html.matchAll(/(?:href|src|data-photo|poster)="([^"]+)"/g)) checkReference(file, match[1]);
  if (!redesigned.includes(file)) continue;
  for (const field of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) {
    assert(html.includes(`property="${field}"`), `${file}: ${field}`);
  }
  assert(html.includes('name="twitter:card"'), `${file}: social card`);
  assert(html.includes('rel="canonical"'), `${file}: canonical`);
  assert(html.includes('class="skip" href="#main"'), `${file}: keyboard skip link`);
  assert(html.includes('href="editorial.css"'), `${file}: shared stylesheet`);
  assert(!/class="todo"|\[(?:N|X|Y|—|publish date)\]|onerror=|everant-architecture\.png|Carmen_Zhang_CV\.pdf|constraint-retention<\/a>/.test(html), `${file}: unresolved draft material`);
  assert(!/fonts\.googleapis|fonts\.gstatic/.test(html), `${file}: no remote font dependency`);
  assert(!/thousand turns|violations fell|running in production|five failure modes I hit/i.test(html), `${file}: unsupported results`);
}

const home = read('index.html');
assert(home.includes('<h1>Carmen Zhang</h1>'), 'homepage name heading');
const work = home.match(/<ul class="work">([\s\S]*?)<\/ul>/)?.[1];
assert(work && work.indexOf('Ramp') < work.indexOf('Everant AI'), 'Ramp is first in work');
const projectRows = [...work.matchAll(/<li>([\s\S]*?)<\/li>/g)];
assert.equal(projectRows.length, 6, 'six experience and project entries');
assert(projectRows[0][1].includes('>Ramp<br>'), 'Ramp experience comes first');
assert.equal(projectRows.filter(([, row]) => row.includes('>Ramp<br>')).length, 1, 'one consolidated Ramp entry');
assert(projectRows[0][1].includes('Natural language ↔ workflow graphs') && projectRows[0][1].includes('Self-serve Reserve RBA'), 'both Ramp contributions retained');
assert(home.includes('Professor Bonnie Berger’s lab'), 'professor title preserved');
for (const [, row] of projectRows) {
  assert.equal([...row.matchAll(/class="meta project-link"/g)].length, 1, 'one dedicated project link per entry');
  assert(/<p class="meta project-link">(?:<a href="[^"]+" aria-label="[^"]+">(?:View project|Watch prototype demo|View poster|View source code) →<\/a>)+<\/p>\s*<\/div>/.test(row), 'consistent project action placement');
}
assert(home.includes('href="exoskeleton.html#demo"'), 'homepage directly links to prototype evidence');
assert(home.includes('href="exoskeleton.html#poster"'), 'homepage directly links to poster');
assert(home.includes('href="https://github.com/OpenTeens/gestureX"'), 'public gestureX repository linked');
assert(home.includes('OpenTeens<br>2023') && home.includes('collaborators including Nathan Chen'), 'user-confirmed gestureX year and collaborator credit');
assert(home.includes('href="life.html"') && !home.includes('class="memory-group"'), 'Memories moved off homepage');
assert(!/assets\/(?:ai-then|isef-community|usaco-bowling)\.jpg/.test(home), 'no homepage photo wall');
assert(!home.includes('id="writing"'), 'writing section hidden');
for (const file of pages) assert(read(file).includes('href="writing.html"'), `${file}: Writing tab restored`);
assert(!/\$72M|\$33M|\$60M|\$600K|700\+/.test(home), 'disputed metrics excluded');
for (const contact of contacts) assert(home.match(/<div class="links">([\s\S]*?)<\/div>/)?.[1].includes(contact), 'intro contact '+contact);

const life = read('life.html');
for (const image of ['ai-then.jpg', 'ai-now.jpg', 'building.jpg', 'isef-portrait.jpg', 'isef-community.jpg', 'usaco-group.jpg', 'usaco-bowling.jpg', 'usaco-games.jpg', 'ramp-group.jpg', 'rsi.jpg']) {
  assert(life.includes(`data-photo="assets/${image}"`), 'enlargeable Life photo '+image);
}
assert.equal([...life.matchAll(/data-photo=/g)].length, 10, 'all ten Life photos');
assert(life.includes('2018 PYPX Presentation: AI &amp; Robotics'), 'original confirmed caption');
assert(life.includes('<figcaption>Friends</figcaption>'), 'personal camp caption');
assert(life.includes('src="site.js"'), 'photo viewer script');

const everant = read('everant.html');
assert(everant.includes('Mar 2026 – May 2026') && everant.includes('third team member'), 'verified Everant context');
for (const item of ['Memory', 'Retrieval', 'Compression', 'Structured state']) assert(everant.includes(item), 'Everant scope '+item);
assert(!everant.includes('<table>'), 'no fabricated benchmark');

const writing = read('writing.html');
assert(/<h1>Writing<\/h1>\s*<footer/.test(writing), 'Writing page has no content beyond heading and shared shell');
assert(writing.includes('href="writing.html" aria-current="page"'), 'Writing active navigation state');
assert(!writing.includes('<article') && !writing.includes('What breaks when'), 'unapproved outline removed');
assert(writing.includes('name="robots" content="noindex,follow"'), 'empty writing page not indexed');
assert(!/7-minute|<time|datePublished/.test(writing), 'no invented publication metadata');

for (const css of ['editorial.css', 'neutral.css', 'styles.css', 'research.css', 'theme.css', 'layout.css']) {
  for (const match of read(css).matchAll(/url\(["']?([^"')]+)["']?\)/g)) checkReference(css, match[1]);
}

if (fs.existsSync('backups/before-editorial-redesign-20261104.zip')) for (const file of ['ramp.html', 'research.html', 'exoskeleton.html', 'markets.html']) {
  const before = execFileSync('unzip', ['-p', 'backups/before-editorial-redesign-20261104.zip', `dist/${file}`], {encoding:'utf8'});
  for (const match of before.matchAll(/(?:src|data-photo|poster)="([^"]+)"/g)) {
    assert(read(file).includes(match[0]), `${file}: original media preserved: ${match[1]}`);
  }
}
const ramp = read('ramp.html');
const confirmedRampContribution = 'I developed deterministic bidirectional editing infrastructure between LLM-generated policies and JSON workflow graphs, with canonicalization and round-trip consistency safeguards across representations.';
assert(ramp.includes(confirmedRampContribution) && home.includes(confirmedRampContribution), 'confirmed Ramp wording preserved');
assert(ramp.includes('Three completed internships'), 'Ramp completed internships');
for (const period of ['Jun–Aug 2025', 'Jan 2026', 'May–Aug 2026']) {
  assert(ramp.includes(period) && home.includes(period), 'confirmed Ramp internship period: '+period);
  assert.equal(home.split(period).length - 1, 1, 'internship period shown only once: '+period);
}
assert(!/Present|\$72M|\$33M|\$60M|\$600K|700\+/.test(ramp), 'Ramp stale date and disputed metrics excluded');
assert(read('exoskeleton.html').includes('bench-mounted prototype'), 'demo scope preserved');
assert(read('markets.html').includes('Performance results are not published here.'), 'no unsupported investment results');
for (const file of ['research.html', 'exoskeleton.html', 'markets.html']) {
  const html = read(file);
  assert(html.includes('href="research.css"'), `${file}: shared research presentation`);
  for (const field of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) {
    assert(html.includes(`property="${field}"`), `${file}: social metadata ${field}`);
  }
  assert(html.includes('rel="canonical"'), `${file}: canonical research link`);
}
const research = read('research.html');
assert(research.indexOf('id="method"') < research.indexOf('src="assets/rsi.jpg"'), 'research methods precede group photo');
assert(research.includes('Trajectory generation') && research.includes('Next-step prediction'), 'both verified modeling tasks');
assert(research.includes('Quantitative results, model specifications, and evaluation datasets are not published here.'), 'research disclosure');
const exoskeleton = read('exoskeleton.html');
assert(exoskeleton.indexOf('<video') < exoskeleton.indexOf('src="assets/exoskeleton-presentation.jpg"'), 'demo before presentation photo');
assert(exoskeleton.includes('data-photo="assets/electronics.jpg"') && exoskeleton.includes('data-photo="assets/building.jpg"'), 'original hardware evidence linked');
assert(exoskeleton.includes('does not establish performance during human walking'), 'bench demonstration limitations');
assert(exoskeleton.includes('data-photo="assets/isef-poster.png"') && exoskeleton.includes('href="assets/isef-poster.png"'), 'poster expandable and full-size accessible');
const legacy = read('legacy-project.js');
for (const [hash, expected] of [['#ramp','ramp.html'], ['#agents','everant.html'], ['', 'index.html#work']]) {
  let target;
  vm.runInNewContext(legacy, {window:{location:{hash, replace:value=>{target=value;}}}});
  assert.equal(target, expected, 'legacy redirect '+hash);
}

if (!offline) {
  for (const ref of [...new Set([...refs, ...pages])]) {
    const response = await fetch('http://localhost:3001/'+ref, {method:'HEAD'});
    assert.equal(response.status, 200, ref);
  }
  const video = await fetch('http://localhost:3001/assets/exoskeleton-demo.mp4', {headers:{Range:'bytes=0-1023'}});
  assert.equal(video.status, 206, 'video range');
  assert.equal((await video.arrayBuffer()).byteLength, 1024, 'video bytes');
  assert.equal((await fetch('http://localhost:3001/missing-page')).status, 404, 'missing page');
}
console.log(JSON.stringify({pages:pages.length, redesignedPages:redesigned, localReferences:refs.size, lifePhotos:10, projectMedia:'preserved', confirmedCopyChecks:'passed', placeholderAndMetadataChecks:'passed', http:offline?'skipped':'passed'}, null, 2));
