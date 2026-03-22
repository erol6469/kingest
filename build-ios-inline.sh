#!/bin/bash
# Build the iOS inline HTML
JS_CONTENT=$(cat dist-ios/assets/app.js)

cat > Kingest-iOS/Kingest/Web/index.html << HTMLEOF
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="#0a0e1a">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>KINGEST</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0a0e1a; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; }
#root { width: 100vw; height: 100vh; overflow: hidden; }
#dbg { position:fixed;top:40px;left:8px;right:8px;z-index:99999;background:rgba(255,0,0,0.9);color:#fff;padding:12px;border-radius:8px;font-size:11px;font-family:monospace;word-break:break-all;max-height:60vh;overflow:auto;display:none; }
</style>
</head>
<body>
<div id="dbg"></div>
<div id="root"></div>
<script>
var dbg=document.getElementById('dbg');
function showErr(m){dbg.style.display='block';dbg.innerHTML+=m+'<br>';}
window.onerror=function(m,s,l,c,e){showErr('ERR: '+m+' @'+l+':'+c);return false;};
window.addEventListener('unhandledrejection',function(e){showErr('PROMISE: '+(e.reason?e.reason.message||e.reason:'?'));});
</script>
<script>
${JS_CONTENT}
</script>
<script>
setTimeout(function(){
  var r=document.getElementById('root');
  if(r.childNodes.length===0) showErr('Root empty after 1s. React did not render.');
  else showErr('OK: '+r.childNodes.length+' children');
},1000);
</script>
</body>
</html>
HTMLEOF

echo "Done. Size: $(wc -c < Kingest-iOS/Kingest/Web/index.html) bytes"
