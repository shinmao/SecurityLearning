# Information leak  
Before exploiting, we can use some trick to get related information or even source code!  
  
### 尋找目錄/檔案  
```
/robots.txt
```  
  
### 拿源碼
```
/.git  
git reflog
git reset --hard comm-num

/.svn

// backup file
index.php~
.index.php.swp

// asis 思路
index.php/index.php
```

### APP__* , DB__* ....
```
/.env
// goog hack
"DB_PASSWORD" filetype:env site:www.xxx.xx
```  

### 爆絕對路徑
```php
// sql inj 參數錯誤，系統需回傳錯誤訊息
?id=1'
?id=-1

select @@datadir;

// Google hacking
site:

// 網站測試文件，內容通常為phpinfo()
test.php
info.php
phpinfo.php
1.php

// 平台 系統 可以搭配load_file讀取內容進一步拿資訊
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

// 存在文件解析漏洞的nginx
www.example.com/test.jpg/index.php  // jpg可能會被當php解析並且爆出物理路徑
```  

### 掃描開放端口  
* nmap  
```php
nmap -sS -p -v ip   // 全端口掃描
```

### search engine  
[https://www.shodan.io](https://www.shodan.io)  
[https://www.zoomeye.org/](https://www.zoomeye.org/)  
