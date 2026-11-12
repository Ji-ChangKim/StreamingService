import { canonicalChannel, LIMITS } from './policy';

const ALLOWED = ['welcomevirtual.sooplive.com','chapi.sooplive.co.kr','chapi.sooplive.com','api.chzzk.naver.com','docs.google.com','doc-0c-0o-sheets.googleusercontent.com','x.com','twitter.com','www.sooplive.com','profile.img.sooplive.co.kr','profile.img.sooplive.com','stimg.sooplive.co.kr','nng-phinf.pstatic.net','www.charonuniverse.com','revernia.co.kr'];
export class BudgetNetwork {
  requests=0; bytes=0;
  constructor(private deadline: number, private fetcher: typeof fetch = fetch) {}
  async get(url: string, maxBytes=LIMITS.sourceBytes, headers: Record<string,string>={}): Promise<{status:number; text:string; bytes:Uint8Array; headers:Headers}> {
    let target=new URL(url);
    for(let redirects=0;redirects<4;redirects++){
      if(target.protocol!=='https:'||target.username||target.password||target.port||!ALLOWED.includes(target.hostname)&&!target.hostname.endsWith('-sheets.googleusercontent.com'))throw new Error('SOURCE_HOST_REJECTED');
      if(this.requests>=LIMITS.external)throw new Error('EXTERNAL_BUDGET_EXCEEDED');
      if(Date.now()>=this.deadline)throw new Error('WALL_BUDGET_EXCEEDED');
      this.requests++;
      // Workers의 전역 fetch에 수집기 인스턴스가 this로 전달되지 않도록 한다.
      const response=await this.fetcher.call(globalThis,target.href,{redirect:'manual',headers:{Accept:'*/*',...headers},signal:AbortSignal.timeout(Math.min(12000,this.deadline-Date.now()))});
      if(response.status>=300&&response.status<400&&response.status!==304){
        await response.body?.cancel(); const location=response.headers.get('Location');if(!location)throw new Error('INVALID_REDIRECT');target=new URL(location,target);continue;
      }
      if(response.status!==200){await response.body?.cancel();return {status:response.status,text:'',bytes:new Uint8Array(),headers:response.headers};}
      if(Number(response.headers.get('Content-Length')||0)>maxBytes){await response.body?.cancel();throw new Error('SOURCE_TOO_LARGE');}
      const chunks:Uint8Array[]=[];let size=0;const reader=response.body?.getReader();
      if(!reader)throw new Error('EMPTY_SOURCE');
      try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;this.bytes+=value.byteLength;if(size>maxBytes){await reader.cancel();throw new Error('SOURCE_TOO_LARGE');}chunks.push(value);}}finally{reader.releaseLock();}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      return {status:200,text:new TextDecoder().decode(bytes),bytes,headers:response.headers};
    }
    throw new Error('REDIRECT_LIMIT');
  }
  async json(url:string,headers:Record<string,string>={}): Promise<Record<string,unknown>> {const r=await this.get(url,LIMITS.sourceBytes,{Accept:'application/json',...headers});if(r.status!==200)throw new Error(`SOURCE_HTTP_${r.status}`);return JSON.parse(r.text);}
  async resolveChannel(url:string):Promise<string>{
    let target=new URL(url);
    for(let i=0;i<4;i++){
      const channel=canonicalChannel(target.href);if(channel?.platform==='CHZZK')return channel.url;
      if(target.protocol!=='https:'||target.hostname!=='ch.ci'||target.username||target.password||target.port||!/^\/[a-z0-9]{1,30}$/i.test(target.pathname))throw new Error('CHANNEL_REDIRECT_HOST_HOLD');
      if(this.requests>=LIMITS.external)throw new Error('EXTERNAL_BUDGET_EXCEEDED');if(Date.now()>=this.deadline)throw new Error('WALL_BUDGET_EXCEEDED');this.requests++;
      const response=await this.fetcher.call(globalThis,target.href,{redirect:'manual',signal:AbortSignal.timeout(Math.min(12000,this.deadline-Date.now()))});await response.body?.cancel();
      const location=response.headers.get('Location');if(response.status<300||response.status>=400||!location)throw new Error('CHANNEL_REDIRECT_UNCONFIRMED');target=new URL(location,target);
    }
    throw new Error('REDIRECT_LIMIT');
  }
}
export async function sha256(value: string|Uint8Array): Promise<string> {
  const bytes=typeof value==='string'?new TextEncoder().encode(value):value;
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
// 이미지 URL의 존재만으로 HTML 오류 화면을 승인하지 않는다. SVG는 실행·추적 위험 때문에 제외한다.
export async function verifyImage(net:BudgetNetwork,url:string):Promise<string> {
  const u=new URL(url);if(!['profile.img.sooplive.co.kr','profile.img.sooplive.com','stimg.sooplive.co.kr','nng-phinf.pstatic.net'].includes(u.hostname))throw new Error('IMAGE_HOST_HOLD');
  const r=await net.get(url,2*1024*1024);if(r.status!==200)throw new Error(`IMAGE_HTTP_${r.status}`);
  if(!rasterDimensions(r.bytes))throw new Error('IMAGE_INVALID_RASTER');return sha256(r.bytes);
}
export function rasterDimensions(b:Uint8Array):boolean{
  if(b.length<32)return false;const v=new DataView(b.buffer,b.byteOffset,b.byteLength),text=(a:number,z:number)=>new TextDecoder().decode(b.slice(a,z));
  let width=0,height=0;
  if(b[0]===137&&text(1,8)==='PNG\r\n\x1a\n'&&text(12,16)==='IHDR'&&text(b.length-8,b.length-4)==='IEND'){width=v.getUint32(16);height=v.getUint32(20);}
  else if(['GIF87a','GIF89a'].includes(text(0,6))&&b[b.length-1]===0x3b){width=v.getUint16(6,true);height=v.getUint16(8,true);}
  else if(b[0]===0xff&&b[1]===0xd8&&b[b.length-2]===0xff&&b[b.length-1]===0xd9){
    for(let p=2;p+9<b.length;){if(b[p]!==0xff)break;const marker=b[p+1];if(marker===0xda||marker===0xd9)break;if(marker===0xff){p++;continue;}const size=v.getUint16(p+2);if(size<2||p+2+size>b.length)break;if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){height=v.getUint16(p+5);width=v.getUint16(p+7);break;}p+=size+2;}
  }else if(text(0,4)==='RIFF'&&text(8,12)==='WEBP'&&v.getUint32(4,true)+8===b.length){
    const format=text(12,16);
    if(format==='VP8X'){width=1+b[24]+(b[25]<<8)+(b[26]<<16);height=1+b[27]+(b[28]<<8)+(b[29]<<16);}
    else if(format==='VP8L'&&b[20]===0x2f){const bits=v.getUint32(21,true);width=(bits&0x3fff)+1;height=((bits>>>14)&0x3fff)+1;}
    else if(format==='VP8 '&&b[23]===0x9d&&b[24]===1&&b[25]===0x2a){width=v.getUint16(26,true)&0x3fff;height=v.getUint16(28,true)&0x3fff;}
  }
  return width>0&&height>0&&width<=4096&&height<=4096;
}
