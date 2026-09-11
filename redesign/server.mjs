import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const noScripts=process.argv.includes('--no-js');
const port=noScripts?4174:4173;
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.ttf':'font/ttf','.md':'text/plain; charset=utf-8'};
createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const filename=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!filename.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 const info=await stat(filename);if(!info.isFile()){res.writeHead(404).end();return;}
 const headers={'Content-Type':types[path.extname(filename)]||'application/octet-stream','Accept-Ranges':'bytes','Cache-Control':'no-cache'};
 if(noScripts) headers['Content-Security-Policy']="script-src 'none'; object-src 'none'";
 let start=0,end=info.size-1,status=200;
 if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match){res.writeHead(416,{'Content-Range':`bytes */${info.size}`}).end();return;}
 if(match[1]===''){start=Math.max(0,info.size-Number(match[2]));}else{start=Number(match[1]);if(match[2])end=Math.min(end,Number(match[2]));}
 if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`}).end();return;}
 status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;}
 headers['Content-Length']=end-start+1;res.writeHead(status,headers);
 if(req.method==='HEAD'){res.end();return;}createReadStream(filename,{start,end}).pipe(res);
 }catch{res.writeHead(404).end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`Preview${noScripts?' (scripts blocked)':''}: http://127.0.0.1:${port}`));
