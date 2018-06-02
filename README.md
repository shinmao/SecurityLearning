# Web-Security-Learning    
Let's play some magic on web!

## Table of Contents  
Content | Link 
------------ | ------------- 
info-leak | [Leak](https://github.com/shinmao/Web-Security-Learning/tree/master/INFO-leak) 
sql-injection | [mysql-injection, nosql-injection](https://github.com/shinmao/Web-Security-Learning/tree/master/SQL-inj)   
xss | [Cross-Site-Scripting](https://github.com/shinmao/Web-Security-Learning/tree/master/XSS)   
php-code-audit | [php](https://github.com/shinmao/Web-Security-Learning/tree/master/PHP-Code-Audt)   
webshell | [php](https://github.com/shinmao/Web-Security-Learning/tree/master/Webshell)   
unserialization | [php, python, ruby](https://github.com/shinmao/Web-Security-Learning/tree/master/Unserialization)  
LFI | [php](https://github.com/shinmao/Web-Security-Learning/tree/master/LFI)  
SSTI | [ruby, vue.js, angular.js](https://github.com/shinmao/Web-Security-Learning/tree/master/SSTI)  
XXE | [XXE](https://github.com/shinmao/Web-Security-Learning/tree/master/XXE)  
SSRF | [SSRF](https://github.com/shinmao/Web-Security-Learning/tree/master/SSRF)  
RPO | [Relative Path Overwrite](https://github.com/shinmao/Web-Security-Learning/tree/master/RPO)

*  [Web狗出題思路](#web-ctf)  
*  [Linux通配符](#linux-command)  
*  [奇技淫巧](#奇技淫巧)  
*  [雜.jpg](#雜)
*  [工具](#tool)  
*  [Reference](#reference)

## Web CTF
1. 爆破
2. php特性  
3. 花式繞WAF  
   sql injection  
4. 密碼學  
   長度延展攻擊，XOR，ROT  
5. 找src  
   .git, svn, php  
6. 文件上傳漏洞  
   繞過檢測webshell  
7. 不同引擎的sql injection  
8. 繞過限制  
   `open__basedir`, `disable__function`花式繞過  
9. 條件競爭 
10. 社工  
11. window特性  
12. SSRF  
13. XSS  
    各種花式繞reg, 繞browser auditor  
14. XXE  
15. 協議  

## Linux command
```php
// ctf中，通配符是找到flag的淫巧
// ? - 代表一個字符
// * - 代表0或多個字符
/var/www/html/flag.txt
-> /???/???/????/*
// 其中的問號當然也可以用*取代
```

## 奇技淫巧

## 雜
1. 頁面編碼問題  
使用者在頁面上看到的text都是經過encode過的，而且每個使用者看到的可能都不一樣，這取決自使用者自己設定的瀏覽器編碼方式  


## Tool
1. [1024程序员开发工具箱](https://1024tools.com/)  
2. 木馬查殺  
   [下一代WebShell检测引擎](https://scanner.baidu.com/#/pages/intro)  
   [Deep Learning model for PHP webshell detection](http://webshell.cdxy.me/)  
3. [Ｐ師傅PHP線上沙箱](http://675ba661.2m1.pw/dbc05bfc-3302-4565-9ac9-3c94d905e53b.php)  
4. [UTF8編碼器 <少數靠譜>](https://mothereff.in/utf-8)  
5. [正則讓你頭痛了嗎？](https://regexr.com/)  
6. [在shell中常用的特殊符号](http://www.cnblogs.com/balaamwe/archive/2012/03/15/2397998.html)  
7. [多版本php沙箱](http://sandbox.onlinephpfunctions.com/)

## Reference
1. [十五個web狗的出題思路](https://weibo.com/ttarticle/p/show?id=2309403980950244591011)
