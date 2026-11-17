import { FFmpeg } from 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js';
import { toBlobURL } from 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js';
const $=id=>document.getElementById(id);
let file=null,videoURL=null,ffmpeg=null,queue=[],busy=false;
const fmt=s=>{s=Math.max(0,Math.floor(s||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function setVideo(newFile, sourceLabel='Video loaded'){
  file=newFile;
  if(videoURL)URL.revokeObjectURL(videoURL);
  videoURL=URL.createObjectURL(file);
  $('preview').src=videoURL;
  $('filesize').textContent=(file.size/1024/1024).toFixed(1)+' MB';
  $('duration').textContent='Reading…';
  $('preview').onloadedmetadata=()=>{
    $('duration').textContent=fmt($('preview').duration);
    $('start').value='0';
    $('end').value=Math.min(30,$('preview').duration).toFixed(1);
    $('status').textContent=sourceLabel+'. Find a moment and add it to the export queue.';
  };
  $('preview').onerror=()=>{$('urlStatus').textContent='The browser could not play this file. Check the link, file format and host CORS permissions.'};
}
$('file').addEventListener('change',e=>{const f=e.target.files[0];if(f)setVideo(f,'Uploaded video ready')});
$('loadUrl').onclick=async()=>{
  const raw=$('streamUrl').value.trim();
  if(!raw){$('urlStatus').textContent='Paste a video URL first.';return}
  let url;
  try{url=new URL(raw);if(!['http:','https:'].includes(url.protocol))throw new Error('Use an http or https link.')}
  catch(e){$('urlStatus').textContent='That does not look like a valid web URL.';return}
  const host=url.hostname.toLowerCase();
  const platform=host.includes('youtube.com')||host==='youtu.be'?'YouTube':host.includes('twitch.tv')?'Twitch':host.includes('kick.com')?'Kick':null;
  if(platform){
    $('urlStatus').textContent=`This is a ${platform} page link, not a direct video file. This site cannot extract/download its stream. For a VOD you own or are authorised to edit, use the platform's permitted download/export option, then upload the saved file here.`;
    return;
  }
  $('loadUrl').disabled=true;
  $('urlStatus').textContent='Trying to fetch the video. The video host must allow cross-origin browser access (CORS)…';
  try{
    const response=await fetch(url.href,{mode:'cors'});
    if(!response.ok)throw new Error(`Server returned ${response.status}`);
    const blob=await response.blob();
    if(!blob.type.startsWith('video/') && !/\.(mp4|webm|mov|m4v|ogv)(\?|$)/i.test(url.pathname)){
      throw new Error('The link did not return a recognised video file.');
    }
    if(!blob.size)throw new Error('The video file is empty.');
    const ext=(url.pathname.match(/\.(mp4|webm|mov|m4v|ogv)$/i)||[])[1]||'mp4';
    const imported=new File([blob],`stream-import.${ext}`,{type:blob.type||'video/mp4'});
    setVideo(imported,'URL video ready');
    $('urlStatus').textContent='Video imported from the direct URL. If playback fails, the host may block browser access.';
  }catch(e){
    $('urlStatus').textContent='Could not import this URL: '+e.message+'. The host may block browser access (CORS), or the link may be a webpage rather than a direct MP4/WebM file. Try a permitted VOD download and upload it instead.';
  }finally{$('loadUrl').disabled=false}
};
$('useCurrentStart').onclick=()=>{$('start').value=$('preview').currentTime.toFixed(1)};
$('useCurrentEnd').onclick=()=>{$('end').value=$('preview').currentTime.toFixed(1)};
function renderQueue(){if(!queue.length){$('queue').innerHTML='<p class="muted">No clips queued yet.</p>';return}$('queue').innerHTML=queue.map((c,i)=>`<div class="cliprow"><strong>${esc(c.title)}</strong><small>${fmt(c.start)} – ${fmt(c.end)} · ${c.layout} crop</small><button class="secondary" data-remove="${i}">Remove</button></div>`).join('');document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{queue.splice(+b.dataset.remove,1);renderQueue();$('exportAll').disabled=!queue.length})}
$('add').onclick=()=>{if(!file){$('status').textContent='Import a video first.';return}let start=Number($('start').value),end=Number($('end').value);if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>$('preview').duration){$('status').textContent='Enter valid start/end times within the video duration.';return}queue.push({title:$('title').value.trim()||`GTA highlight ${queue.length+1}`,start,end,layout:$('layout').value,caption:$('caption').value.trim()});renderQueue();$('exportAll').disabled=false;$('status').textContent=`Added clip ${queue.length}.`;$('title').value='';$('caption').value=''};
$('loadEngine').onclick=async()=>{if(ffmpeg)return;$('loadEngine').disabled=true;$('status').textContent='Loading FFmpeg video engine… (first load is large)';try{ffmpeg=new FFmpeg();ffmpeg.on('progress',({progress})=>{$('bar').style.width=Math.max(0,Math.min(100,progress*100))+'%'});const base='https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';await ffmpeg.load({coreURL:await toBlobURL(base+'/ffmpeg-core.js','text/javascript'),wasmURL:await toBlobURL(base+'/ffmpeg-core.wasm','application/wasm')});$('status').textContent='Video engine ready.';$('exportAll').disabled=!queue.length}catch(e){$('status').textContent='Could not load engine: '+e.message;$('loadEngine').disabled=false}};
function cropFilter(layout){let y=layout==='top'?'0':layout==='bottom'?'ih-oh':'(ih-oh)/2';return `scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280:(iw-ow)/2:${y}`}
$('exportAll').onclick=async()=>{if(!ffmpeg||!file||!queue.length||busy)return;busy=true;$('exportAll').disabled=true;$('downloads').innerHTML='';$('status').textContent='Preparing video…';try{const ext=(file.name.split('.').pop()||'mp4').toLowerCase().replace(/[^a-z0-9]/g,'');const input='input.'+ext;await ffmpeg.writeFile(input,new Uint8Array(await file.arrayBuffer()));for(let i=0;i<queue.length;i++){let c=queue[i],out=`gta_short_${i+1}.mp4`;$('status').textContent=`Rendering ${i+1} of ${queue.length}: ${c.title}`;$('bar').style.width='0%';let args=['-ss',String(c.start),'-i',input,'-t',String(c.end-c.start),'-vf',cropFilter(c.layout),'-c:v','libx264','-preset','ultrafast','-crf','25','-c:a','aac','-b:a','128k','-movflags','+faststart','-pix_fmt','yuv420p',out];await ffmpeg.exec(args);let data=await ffmpeg.readFile(out);let blob=new Blob([data.buffer],{type:'video/mp4'});let url=URL.createObjectURL(blob);let a=document.createElement('a');a.href=url;a.download=out;a.textContent=`Download ${c.title} (${fmt(c.end-c.start)})`;a.style.display='block';a.style.padding='10px 0';$('downloads').appendChild(a);await ffmpeg.deleteFile(out)}await ffmpeg.deleteFile(input);$('status').textContent='Export complete. Save the MP4 files to Photos or Files.'}catch(e){$('status').textContent='Export stopped. This video may be too large for iPhone browser memory. Try a shorter/smaller recording. Details: '+e.message}finally{busy=false;$('exportAll').disabled=!queue.length}};
