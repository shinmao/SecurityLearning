# Information leak  
Before exploiting, we can use some trick to get related information or even source code!  
  
### allow/disallow file  
```
/robots.txt
```  
  
### get source code
```
/.git  
git reflog
git reset --hard comm-num

/.svn

// backup file
index.php~
.index.php.swp

// asis ctf
index.php/index.php
```

### APP__* , DB__* ....
```
/.env
// goog hack
"DB_PASSWORD" filetype:env site:www.xxx.xx
```  

### get abs path
```php
// sql inj error, system return error message
?id=1'
?id=-1

select @@datadir;

// Google hacking
site:

// test file if content is phpinfo()
test.php
info.php
phpinfo.php
1.php

// load_file() to read content
// Windows
C:\windows\php.ini
C:\windows\system32\inetsrv\MetaBase.xml

// Linux
/etc/php.ini
/etc/httpd/conf.d/php.conf
/etc/httpd/conf/httpd.conf
/usr/local/apache/conf/httpd.conf
/usr/local/apache2/conf/httpd.conf
/usr/local/apache/conf/extra/httpd-vhosts.conf

// phpmyadmin
/phpMyAdmin/libraries/select_lang_lib.php
/xxx/darkblue_orange/layout.inc.php
/xxx/index.php?lang[]=1

// nginx with file parse vul
www.example.com/test.jpg/index.php  // jpg might be parsed as php and leak phys path
```  

### map opening port  
* nmap  
```php
nmap -sS -p -v ip   // map all the port
```

### search engine  
[https://www.shodan.io](https://www.shodan.io)  
[https://www.zoomeye.org/](https://www.zoomeye.org/)  
