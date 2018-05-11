# SSRF
Server Side Request Forge 服務端請求偽造  
**由服務端發起請求的漏洞**  
繞過防火牆，嗅探內網，偽協議的技巧讓SSRF更威  
*  [挖掘](#挖掘)  
*  [Reference](#reference) 

![ssrf](https://github.com/shinmao/Web-Security-Learning/blob/master/SSRF/screenshot/SSRF.png)

# 挖掘
**可控**的URL參數：url, src, imgURL  
1. XXE  
```php
<!ENTITY % file SYSTEM "file://url/xxx">
```
2. `file_get_contents($url)`  
```php
$image = file_get_contents('http://self-ip');
```
[Day 20 - Stocking](https://www.ripstech.com/php-security-calendar-2017/#day-20)

## Reference
* Orange Slides
