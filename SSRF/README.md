# SSRF
Server Side Request Forge  
Bypass the firewall and grope through the intranet  

![ssrf](https://github.com/shinmao/Web-Security-Learning/blob/master/SSRF/screenshot/SSRF.png)

# Find the vulnerable place
**Controllable** URL parameter：url, src, imgURL, share, wap, link  
share the content via URL  
translate the context with online translator  
load the pic with URL  
some api  
1. XXE(You can directly see in my XXE part)  
```php
<!ENTITY % file SYSTEM "file://url/xxx">
```
2. `file_get_contents($url)`(PHP)  
```php
$image = file_get_contents('http://self-ip');
```
[Day 20 - Stocking](https://www.ripstech.com/php-security-calendar-2017/#day-20)  
3. curl(PHP)  
in fact, from `curl -V` we can see the libcurl support many protocols  

![](https://farm2.staticflickr.com/1774/43295065584_6cfa758570_m.jpg)

## Bypass  
Bypass DNS limit  
Bypass ip limit

## Reference
* Orange Slides
