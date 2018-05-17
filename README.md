# Web-Security-Learning    
Let's play some magic on web pages!

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
   ```open__basedir```, ```disable__function```花式繞過  
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

## 令人興奮的奇技淫巧


## Tool
1. [1024程序员开发工具箱](https://1024tools.com/)  
2. 木馬查殺  
   [下一代WebShell检测引擎](https://scanner.baidu.com/#/pages/intro)  
   [Deep Learning model for PHP webshell detection](http://webshell.cdxy.me/)

## Reference
1. [十五個web狗的出題思路](https://weibo.com/ttarticle/p/show?id=2309403980950244591011)
