# Information leak  
Before exploiting, we can use some trick to get related information or even source code!  
  
### 尋找目錄/檔案  
```
/robots.txt
```  
  
### 拿源碼
```
/.git  
/.svn

// backup file
index.php~
```

### APP__* , DB__* ....
```
/.env
// goog hack
"DB_PASSWORD" filetype:env site:www.xxx.xx
```
