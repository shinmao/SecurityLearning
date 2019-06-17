# PHP Security

## PHP String escape sequences + PHP Variable functions 妙用  
php有多種表示字串的方法，參考[some tricks hidden in double quoted](https://secure.php.net/manual/en/language.types.string.php)  
假如 waf 擋了字串 `system`:  
```php
// system("ls")
"\x73\x79\x73\x74\x65\x6d"("ls")
```  
只要在雙引號內, `\x[0-9A-Fa-f]{1,2}` 都會被視為16進制的ascii碼，如此ㄧ來就順理成章的轉換編碼.  
如果`"`也被 waf 了，我們還可以用括號來表示字串：  
```php
// following are all string
echo "a";
echo (string)"a";
echo (string)a;
echo (a);
```  
**不管在括號內是什麼東西，只要沒有特意宣告型態，就會被視為字串**！  

## 用`get_defined_functions`繞過關鍵字  
```php
print_r(get_defined_functions()[internal]);
// system("ls")
get_defined_functions()[internal][1077]("ls")
```  
[How To Exploit PHP Remotely To Bypass Filters & WAF Rules](https://www.secjuice.com/php-rce-bypass-filters-sanitization-waf/)

## preg match 小技巧 
[繞過preg_match?](https://bugs.php.net/bug.php?id=61744)  
PHP正則是基於**PCRE**的函式庫。在apache modules 和 php-cgi有兩個相關的限制:  
1. `pcre.backtrack_limit`  
2. `pcre.recursion_limit`  
[pcre-configuration](http://php.net/manual/en/pcre.configuration.php)  
如果這個限制被打破了，`preg_match`會返回**false**，這時候就看開發者有沒有正確處理了  
* Exploit:  
想辦法超過上限!  
[code-breaking-puzzles pcrewaf](https://shinmao.github.io/ctf/websecurity/2018/11/26/Code-Breaking-Puzzles/#more)  
* 正確手勢:  
`preg_match`正確匹配會返回1，不然就返回0， 在上面這種錯誤發生時會返回**false**。  
```php
if(preg_match == 0)
```  
由於php的弱類型特性，上面的代碼就會被繞過。應該使用`if(preg_match() === 0)`。

## 弱類型
[PHP型態轉換表](http://us3.php.net/manual/en/types.comparisons.php)  
php會自動轉換成十進位當字串以`0x`開頭!  
```php
"0e328428492284" == "0e24824048204"  // true
```
**md5 collision**，php會把`0e`當成`10^x`！  
這裡有些實用的例子可以在CTF裡用用 :)......  
```php
$ echo -n 240610708 | md5sum
0e462097431906509019562988736854  -
$ echo -n QNKCDZO | md5sum
0e830400451993494058024219903391  -
$ echo -n aabg7XSs | md5sum
0e087386482136013740957780965295  -
// sha1, too for your gift XD
var_dump(sha1('aaroZmOk') == sha1('aaK1STfY'));
var_dump(sha1('aaO8zKZF') == sha1('aa3OFF9m'));
```

## md5和錯誤的輸入型態   
`md5()`在處理的資料型態為array時不會ret error，也會產生錯誤的結果...
```php
$arr1[] = array("hi" => "helloworld");
$arr2 = array("hi","helloworld","ohmygod");
var_dump(md5($arr1) == md5($arr2));               // true
```  

## strcmp內部原理  
`strcmp()`會將輸入轉乘ascii碼然後做減法，if str1 - str2 < 0 ret (-1), if equal ret (0), the others ret(1)  
```php
if (strcmp($input, $password) == 0){}
// POC: ?input[]
```
Exploit: 如果參數是一個字串和一個非字串，則`strcmp`會返回0！  

# array element comparison
在**PHP5.5.9**的版本以前，當出現`if($a[0] == $a[$x])`的比較式，容易造成整數溢出。  
```php
// ASIS 2018 Qual Nice Code
if($a[0] == $a[68719476736])
```
因為`68719476736 - 0`被放入32 bits的`result`而溢出，結果變成true。參考[Vlog #003: old PHP and array===array](https://www.youtube.com/watch?v=8fGigwN_E-U)  

## PHP 變數特性
若php變數含有以下特殊符號: `.`或空白符號，將會把這些符號轉換成`_`（此特性不限版本  
```php
parse_str("pwn.ch=hello&pw nch=hey",$test);
var_dump($test);
// result: array(2) { ["pwn_ch"]=> string(5) "hello" ["pw_nch"]=> string(3) "hey" }
```
參考[kaibro web ctf Cheatsheet](https://github.com/w181496/Web-CTF-Cheatsheet)   

## 變量覆蓋
`$$`, `extract`, `parse_str`, `import_request_variables`, `register_globals`, `$GLOBALS`, `mb_parser_str`  
1. `parse_str`  
[PHP MANUAL](http://php.net/manual/zh/function.parse-str.php)  
parse_str($str,$output) 解析$str然後放進陣列$output  
```php
// php manual example really help me so much to understand the vul
parse_str("key=value&arr[]=a&arr[]=b");
echo $key; // value
echo $arr[0];  // a
echo $arr[1];  // b
```
2. `extract`  
參數必須為**array**  
```php
$b = array("a"=>"1");
extract($b);
echo $a;   // 1
```  

## resource operation
[resource operation 匯整 by Sebastian Bergmann](https://github.com/sebastianbergmann/resource-operations/blob/master/src/ResourceOperations.php)  

## php 路徑技巧
* [0CTF ezDoor](https://shinmao.github.io/websecurity/ctf/2018/04/13/The-Magic-from-0CTF-ezDoor/)  
* 在windows下，`a"php`會被解析成`a.php`，`a.ph>`可以匹配任意字元，`a.p<`可以匹配多個任意字元  

## php函數重新認識
* `get_defined_vars()`  
[官方文檔](http://php.net/manual/en/function.get-defined-vars.php)  
記住要先`reset`！  
[參考phplimit by phith0n](https://shinmao.github.io/ctf/websecurity/2018/11/26/Code-Breaking-Puzzles/#more)  

## PHP-FPM 未授權訪問漏洞 && RCE
* [Fastcgi协议分析 && PHP-FPM未授权访问漏洞 && Exp编写](https://www.leavesongs.com/PENETRATION/fastcgi-and-php-fpm.html)  
* [Fuck PHP-FPM with FastCGI by 1pwnch](https://blog.1pwnch.com/websecurity/2019/06/12/Fuck-PHP-FPM-with-Fastcgi/#more)  
* [Wallbreaker wp by kaibro](https://github.com/w181496/CTF/tree/master/0ctf2019_final/Wallbreaker%20(not%20very)%20Hard)
