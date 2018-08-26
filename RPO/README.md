# RPO
Relative Path Overwrite  
This is an attack based on the difference between Browser's and Server's understanding of relative URL.  

# Browser v.s. Server
使用者透過browser發出request給server，server收到request後先進行urldecode在response給使用者。  
1. 使用者要看哪個頁面由server給的response決定  
2. 頁面引入的```css/js```由browser決定  
因為browser不會進行urldecode因此類似```first%2findex.php```這種東西都會被當作檔名  
e.g.  
```https://example.com/first%2findex.php```  
server端：```https://example.com/first/index.php``` 因此server會回傳index.php無誤  
browser端：```first%2findex.php```沒做urldecode而被當作檔名  

# Exploit
CTF: 題目條件  
1. ```/inc/1/index.php?query=```  
這個頁面有個echo的功能，可是卻沒有xss漏洞，有做htmlentities之類的protection  
2. ```/inc/flag.php```  
這個頁面有用```1/```這樣的相對路徑引入css  
目標：**改變flag.php**的```background-color```  

**Exploit**:  
```/inc/1/%3fquery={}*{background-color%3Ared}%2f..%2f../flag.php```  
訪問上面這個連結就會發現flag.php背景顏色為紅色，目標達成!  
1. server端有做urldecode，所以response為flag.php  
2. browser端的css載入```/inc/1/?query={}*{background-color%3Ared}/../../1/```  
:sparkles: 這部分是exploit的重頭戲，這裏css載入的是帶有query的index.php，他會將index.php作為css syntax解析  
此外，css的容錯率也很高，會忽略無效語法，因此後面路徑剩下的部分都可以不用管！  

# Reference
1. [RPO攻击技术浅析](https://mp.weixin.qq.com/s?__biz=MzUxOTYzMzU0NQ==&mid=2247483692&idx=1&sn=ecd853bb5cb3e654a08c5214a1b951a2&chksm=f9f7eecace8067dc155346e5204f6eae0df9890af60777234e249021d577226c6989e73a107b&scene=21#wechat_redirect)  
2. [Kaibro web_ctf_cheatsheet](https://github.com/w181496/Web-CTF-Cheatsheet)
