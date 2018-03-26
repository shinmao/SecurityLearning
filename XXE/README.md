# XXE
*  [Entity](#entity)   
*  [Exploit](#exploit)    
*  [Reference](#reference)   
   
XML是一種描述資料的語言，跟html很像，但著重於傳輸資料，Case-sensitive。  
```xml
<?xml version=“1.0” encoding=“utf-8”>    // xml的文檔聲明
<!DOCTYPE a[                    // DTD 文檔類型定義
    <!ENTITY .....>
]>
<a>     // 文檔元素
....
</a>
```
其中DTD的觀念以及利用尤為重要  

## Entity
在DTD中事先宣告才可以使用實體  
Entity就像定義變數一樣  
1. 內部實體： ```<!ENTITY name "value">```  
```xml
<!DOCTYPE pwnch[
  <!ENTITY var "hi">
]>
<root>&var;</root>
```
2. 外部實體： ```<!ENTITY name SYSTEM "URL">```  
```xml
<!ENTITY var SYSTEM "url://.......txt">
<root>&var;</root>
```
新版本預設不解析外部實體  
3. 參數實體： ```<!ENTITY %name "value>"```  
```xml
// exp.dtd: <!ENTITY next SYSTEM "file://.txt">
<!DOCTYPE pwnch[
  <!ENTITY %var SYSTEM "http://...../exp.dtd">
  %var;
]>
<root>&next;</root>
```

## Reference
* Kaibro's slides
