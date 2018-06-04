## 同源策略 Same-Origin Policy
在開始XSS前，了解同源策略是必須的。因為它決定我們是否能發出跨域請求，這也是我們XSS想要達到的目的吧!  

### What's Same-Origin Policy?
什麼是同源? 同樣的**協定(http, https)**, **同樣的端口**, **同樣的主機**(host)則稱兩個頁面為 同源!  
由 同源策略 通過URL決定，Browser是否能存取資源: 同源則通過，否則拒絕  
  
補充: ```about:blank``` 這種URL也是由內部URL延伸  
可以將這種連結想成一種command  
此類常見的URL還有```about:about```, 會將該browser有用的連結都列出來  
[reference](https://www.lifewire.com/about-blank-4125143)
  
所以，我們可以說同源策略是限制我們從另外獨立的頁面加載資源  
  
我們可以將跨域存取分成三種:  
1. Cross-Origin write <accept>
2. Cross-Origin read  
3. Cross-Origin embedding <accept> e.g. ```<img src="">```  
其中第一種和第三種大多是被接受的，這也是為什麼```<img>```可以跨域加載圖片，而第二種多為不允許的  
關於何種資源可以被embed也可以在MDN上看到...  
  
CDN: [What's CDN?](https://zh.wikipedia.org/wiki/%E5%85%A7%E5%AE%B9%E5%82%B3%E9%81%9E%E7%B6%B2%E8%B7%AF)  
CDN的宗旨是取資源自最靠近的地方以降低成本，但是CDN一定包括與顯示資源頁面不同源，可以用上面的原理解釋!  
  
```XMLHttpRequest()``` 若是對象為不同源則是會觸發同源策略 : [reference](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)  
所以 ```<script></script>``` 發出的http request多半會被同源策略給阻撓...  
這裡便出現了 CORS policy!  
  
### What's CORS? (Cross-Origin sharing standard)
這個策略便同意```XMLHttpRequest()```以及```<script>```發起跨域請求!  
[reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)  
在source對target發出request時，瀏覽器會自動帶上`origin`頭，target domain就會對`origin`做出判斷，如果同意就返回`Access-Control-Allow-Origin: source`，爾後如果不是`source`發出的request就會出現權限錯誤(xxxxxxxx Origin is not allowed by Access-Control-Allow-Origin).  
而在response中我們可以特別注意幾項內容:  
```  
Access-Control-Allow-Credentials: true  // 瀏覽器同意將內容return 給 user
Access-Control-Allow-Origin: http://xxx.example  // 同意從xxx.example的這個源return內容 
Access-Control-Allow-Methods: POST, GET, OPTIONS  // 同意 這些 methods
Access-Control-Allow-Headers: X-TEST, Content-Type  
Access-Control-Max-Age: 86400   // 這段時間內不需要再發起preflight請求
```
(以前總是看不懂這些請求標頭，現在總算了解了點😝 :stuck_out_tongue_closed_eyes:
  
## Reference
[MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
