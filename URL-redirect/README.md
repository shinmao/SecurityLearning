# URL redirection
It would become a vulnerability if hacker can exploit the controllable url to redirect you to his malicious site.  
Most links of the URL redirection is like:  
```php
http://www.example.com/?url=http://www.redirect.com/
```  
Whether you can control the `url` can decide the vulnerability exists or not.

# Exploit and bypass
In most of the cases, we cannot change the content of `url` directly. However, there is an awesome one made up the bypass cheatsheet[1].  
1. `?`  
```php
http://www.example.com/?url=http://www.vul.com?www.redirect.com
```
  
2. `@`  
```php
http://www.example.com/?url=http://www.redirect.com@www.vul.com
```  

3. `vulredirect.com`  
According to the experience of authors, some company would ignore checking the whole domain name. For example, the whitelist for url is **whether it contains the word of redirect.com**, so...  
```php
http://www.example.com/?url=http://www.vulredirect.com/
```  
Go to register for this domain!  

Currently, I just conclude for this article instead of my ideas. I would add more content if I find such vul in the real world.  

# Reference
1. [分享幾個繞過URL跳轉限制思路](https://www.anquanke.com/post/id/94377) 
