# PHP Security
Do you know much about PHP?
* `<?` is not necessary for PHP?  
* Double quotes can also understand variables and functions?
* Space and dot in variable name would be converted to underline?

## Different use of PHP file extension
* [服务器针对文件的解析漏洞汇总](https://mp.weixin.qq.com/s/f0y_AjRtc4NjEqeJe6cPhw)  
* [Apache2 php5 conf](https://github.com/shinmao/SecurityLearning/blob/master/Webshell/apache2_php5.conf)* [php & apache2 &操作系统之间的一些黑魔法](http://wonderkun.cc/index.html/?p=626)  
* [Learn from 0ctf ezDoor](https://blog.1pwnch.com/websecurity/ctf/2018/04/13/The-Magic-from-0CTF-ezDoor/#more)  
* **File Parsing Vulnerability** of Apache: Apache parses extension from the right side to left side, jumps to the left one if he cannot recognize the right one. **This vul is not related to the version of Apache, but the setting of parsing php files**.
* On window, `a"php` would be parsed to `a.php`, `a.ph>` can match any character, and `a.p<` can match several characters.  

## PHP String escape sequences + PHP Variable functions  
[Strings literal can be specified in four ways](https://secure.php.net/manual/en/language.types.string.php)  
If string such as `system` is blocked by WAF:  
```php
// system("ls")
"\x73\x79\x73\x74\x65\x6d"("ls")
```  
With double quotes, `\x[0-9A-Fa-f]{1,2}` would be parsed as ascii of hex one.  
How if `"` is also blocked by WAF? We can use **brackets** to represent the string:  
```php
// following are all string
echo "a";
echo (string)"a";
echo (string)a;
echo (a);
```  
**In other words, no matter what you put, thing  in the brackets would be regarded as string**！  

## Bypass keywords with `get_defined_functions`  
```php
print_r(get_defined_functions()[internal]);
// system("ls")
get_defined_functions()[internal][1077]("ls")
```  

## PCRE-DoS
[bypass preg_match?](https://bugs.php.net/bug.php?id=61744)  
The regex of PHP is based on **PCRE**. There are two relevant limitation in apache modules and php-cgi:  
1. `pcre.backtrack_limit`  
2. `pcre.recursion_limit`  
[pcre-configuration](http://php.net/manual/en/pcre.configuration.php)  
If the limit is broken, `preg_match` would return with **false**. Whether the rule would be bypassed or not depends on the way of developers to deal with the problem.  
* Exploit:  
Break the count of limit!  
[code-breaking-puzzles pcrewaf](https://shinmao.github.io/ctf/websecurity/2018/11/26/Code-Breaking-Puzzles/#more)  
* How to fix the problem:  
`preg_match` would return with 1 if matched, otherwise with 0, but with **false** in the case above.  
```php
if(preg_match == 0)
```  
Because PHP is language of weak-type, false would be reguarded as 0. We should use strong comparison here.

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

## php函數重新認識
* `get_defined_vars()`  
[官方文檔](http://php.net/manual/en/function.get-defined-vars.php)  
記住要先`reset`！  
[參考phplimit by phith0n](https://shinmao.github.io/ctf/websecurity/2018/11/26/Code-Breaking-Puzzles/#more)  

## PHP-FPM 未授權訪問漏洞 && RCE
* [Fastcgi协议分析 && PHP-FPM未授权访问漏洞 && Exp编写](https://www.leavesongs.com/PENETRATION/fastcgi-and-php-fpm.html)  
* [Fuck PHP-FPM with FastCGI by 1pwnch](https://blog.1pwnch.com/websecurity/2019/06/12/Fuck-PHP-FPM-with-Fastcgi/#more)  
* [Wallbreaker wp by kaibro](https://github.com/w181496/CTF/tree/master/0ctf2019_final/Wallbreaker%20(not%20very)%20Hard)