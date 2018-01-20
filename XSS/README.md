## Cross-Site Scripting
使用腳本附加在連結或文本中可以讀取本地cookie或者擷取封包, 常見的防禦手勢就是使用**http-only**來限制http protocol才能訪問cookie內容, 以及使用**https**安全協定!  
1. reflective xss (非持久型):  
Server 執行惡意腳本**立即**返回結果, 像是在link中加上script.  
2. stored xss (持久型):  
Forum或者留言板中, 在文本中加入script. (前端可能用ajax讀取內容   
3. DOM xss:  
在DOM元素中加入事件, 觸發script.  

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
