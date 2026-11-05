import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./dist/', import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.pdf':'application/pdf'};
const port = Number(process.env.PORT || 3001);
const server = http.createServer((req,res)=>{
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
  let pathname;
  try { pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
  const target = path.resolve(root,'.'+(pathname.endsWith('/') ? pathname+'index.html' : pathname));
  if(!target.startsWith(root)) {res.writeHead(403); return res.end();}
  fs.stat(target,(error,stat)=>{
    if(error || !stat.isFile()) {res.writeHead(404); return res.end('Not found');}
    const headers={'Content-Type':types[path.extname(target)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'};
    let start=0, end=stat.size-1, status=200;
    if(req.headers.range){
      const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(!m || (!m[1]&&!m[2])) {res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}
      if(!m[1]) start=Math.max(0,stat.size-Number(m[2]));
      else {start=Number(m[1]); if(m[2])end=Math.min(end,Number(m[2]));}
      if(start>end || start>=stat.size) {res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});return res.end();}
      status=206; headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length']=Math.max(0,end-start+1);
    res.writeHead(status,headers);
    if(req.method==='HEAD')return res.end();
    const stream=fs.createReadStream(target,{start,end});
    stream.on('error',()=>res.destroy());
    res.on('close',()=>stream.destroy());
    stream.pipe(res);
  });
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://localhost:${port}/`));
