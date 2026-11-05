import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root=path.resolve('dist');
const pages=fs.readdirSync(root).filter(f=>f.endsWith('.html'));
const references=new Set();
const offline=process.argv.includes('--offline');
for(const filename of pages){
  const html=fs.readFileSync(path.join(root,filename),'utf8');
  assert(html.includes('>CJWZhang</a>'),filename+' handle');
  assert(html.includes('name="viewport"'),filename+' viewport');
  if(filename==='index.html'){
    assert(html.includes('class="affiliation affiliation-branded"'),'prominent MIT affiliation');
    assert(html.includes('src="assets/mit-logo.png"')&&html.includes('alt="MIT — Massachusetts Institute of Technology"'),'supplied MIT logo with accessible text');
    assert(html.includes('Computer Science &amp; Mathematics</span>'),'degree context');
    assert(html.includes('class="intro-evidence"'),'concrete work in introduction');
    assert(html.includes('USACO Platinum · EGOI finalist training camp participant'),'competitive programming context');
  }
  if(filename==='index.html'){
    assert(html.includes('id="life-heading">Memories</h2>'),'personal section heading');
    assert(html.includes('<a href="#life">Memories</a>'),'navigation matches section heading');
    const sectionStack=[];
    const memoryGroups=[];
    for(const token of html.matchAll(/<section\b[^>]*>|<\/section>|<h([23])\b[^>]*>([^<]+)<\/h[23]>/g)){
      if(token[0].startsWith('<section')) sectionStack.push(token[0].match(/\bid="([^"]+)"/)?.[1]||'group');
      else if(token[0]==='</section>'){assert(sectionStack.length,'balanced section closing tag');sectionStack.pop();}
      else if(sectionStack.includes('life')&&token[1]==='3')memoryGroups.push(token[2]);
    }
    assert.equal(sectionStack.length,0,'balanced section nesting');
    assert.deepEqual(memoryGroups,['Then and now','Building and presenting','USACO camp'],'all photo groups belong to Memories');
    assert.equal([...html.matchAll(/<header class="memory-heading">/g)].length,3,'consistent heading wrapper for all memory groups');
    const hero=html.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0];
    assert(!hero.includes('My school project'),'childhood story belongs beside the photos');
    assert(!/always loved AI/i.test(html),'removed awkward phrase');
    for(const file of ['ai-then.jpg','ai-now.jpg']){
      assert(html.includes(`data-photo="assets/${file}"`),'enlargeable personal photo '+file);
      assert(html.includes(`src="assets/${file}"`),'personal photo thumbnail '+file);
    }
    assert(html.indexOf('id="experience"')<html.indexOf('id="work"'),'experience before selected work');
    assert(html.includes('Selected for the internship while still in high school.'),'high-school selection in Ramp introduction');
    assert(html.includes('id="ramp-project"'),'photo-led Ramp entry');
    assert(html.includes('href="ramp.html"')&&html.includes('href="everant.html"'),'separate employer destinations');
    assert(!html.includes('systems.html'),'no homepage links to the former combined page');
    assert(!html.includes('project-feature'),'Ramp uses the same card layout as the other projects');
    assert.equal([...html.matchAll(/<article class="project"/g)].length,3,'three equal project cards');
    assert(html.includes('id="usaco"'),'USACO camp gallery');
    for(const file of ['usaco-bowling.jpg','usaco-games.jpg','usaco-group.jpg']){
      assert(html.includes(`data-photo="assets/${file}"`),'enlargeable camp photo '+file);
      assert(html.includes(`src="assets/${file}"`),'camp thumbnail '+file);
    }
    for(const role of ['Software Engineering Intern','Founding Research Intern','Undergraduate Researcher'])assert(html.includes(role),'experience role '+role);
  }
  const footer=html.match(/<footer class="footer">([\s\S]*?)<\/footer>/)?.[1];
  assert(footer,filename+' footer');
  for(const href of ['mailto:cjwzhang@mit.edu','https://www.linkedin.com/in/carmenjwzhang','https://github.com/CJWZhang']){
    assert(footer.includes(`href="${href}"`),filename+' footer link '+href);
    if(filename==='index.html')assert(html.match(/<div class="inline-links">([\s\S]*?)<\/div>/)?.[1].includes(`href="${href}"`),'homepage introduction link '+href);
  }
  assert.equal([...html.matchAll(/<h1\b/g)].length,1,filename+' one h1');
  if(filename==='ramp.html'){
    assert(html.includes('I developed deterministic bidirectional editing infrastructure between LLM-generated policies and JSON workflow graphs, with canonicalization and round-trip consistency safeguards across representations.'),'user-confirmed resume wording for Ramp');
    assert(html.includes('Jun 2025 – Present'),'Ramp dates match resume');
    assert(html.includes('assets/ramp-group.jpg')&&html.includes('assets/ramp-gathering.jpg'),'both Ramp photos');
    assert(html.includes('<script defer src="site.js"></script>'),'Ramp photo viewer script');
    assert(!/Everant/i.test(html),'Ramp page contains only Ramp work');
  }
  if(filename==='everant.html'){
    assert(html.includes('Mar 2026 – May 2026'),'Everant dates match resume');
    assert(html.includes('Founding Research Intern')&&html.includes('structured state'),'Everant role and contribution retained');
    assert(!/Ramp/.test(html),'Everant page contains no Ramp work or photos');
  }
  assert(!/v0\.4|N501Y|GAIT PHASE/.test(html),filename+' no fabricated readouts');
  assert(!/built safeguards for LLM-assisted policy editing/i.test(html),filename+' inaccurate paraphrase stays removed');
  assert(!/A little code\.|Putting a hypothesis to the test|Making the system tangible|From workflow to shipped product/.test(html),filename+' no removed filler copy');
  for(const m of html.matchAll(/(?:href|src|data-photo|poster)="([^"]+)"/g)){
    const ref=m[1];
    if(/^(?:https?:|mailto:|data:)/.test(ref))continue;
    const [file,anchor]=ref.split('#');
    const local=file||filename;
    assert(fs.existsSync(path.join(root,local)),`${filename}: missing ${local}`);
    if(anchor){const contents=fs.readFileSync(path.join(root,local),'utf8');assert(contents.includes(`id="${anchor}"`),`${filename}: missing anchor ${ref}`);}
    references.add(local);
  }
}
const legacyScript=fs.readFileSync(path.join(root,'legacy-project.js'),'utf8');
for(const [hash,expected] of [['#ramp','ramp.html'],['#agents','everant.html'],['','index.html#work'],['#unknown','index.html#work']]){
  let target;
  vm.runInNewContext(legacyScript,{window:{location:{hash,replace:value=>{target=value;}}}});
  assert.equal(target,expected,'legacy project redirect '+hash);
}
if(!offline){
for(const ref of references){const r=await fetch('http://localhost:3001/'+ref,{method:'HEAD'});assert.equal(r.status,200,ref);}
const r=await fetch('http://localhost:3001/assets/exoskeleton-demo.mp4',{headers:{Range:'bytes=0-1023'}});
assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,1024);
const missing=await fetch('http://localhost:3001/does-not-exist');assert.equal(missing.status,404);
}
console.log(JSON.stringify({pages:pages.length,verifiedLocalReferences:references.size,contactLinks:'Email, LinkedIn, GitHub verified on every page',removedFiller:'Not present',httpChecks:offline?'Skipped (offline mode)':'200 pages, 206 video range, 404 missing route verified',branding:'CJWZhang on every page'},null,2));
