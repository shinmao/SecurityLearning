# PHP Code Auditing
*  [PHP Dangerous filter](#dangerous-filter)  
*  [PCRE DoS](#pcre-dos)  
*  [PHP weak type](#weak-type)  
*  [PHP data handling](#data-handling)  
*  [PHP variable coverability](#variable-coverability)  
*  [PHP dangerous misuse of function](#dangerous-mistake-function)  
*  [Reference](#reference)

# Dangerous filter
Don't trust in user's input: `$_GET, $_POST, $_SERVER, fopen('php://input','r'), upload downloaded files, session, cookies`...  
* Common handle with input (following are some filter or authentication  
1. `strip_tags()`,`htmlentities()`, or `htmlspecialchars()` will unvalidate your malicious payload -> no xss  
```php
$input = '<script>...</script>';
echo htmlentities($input, ENT_QUOTES, 'utf-8');
```  
2. if input needs to be run in command line by `exec()`, we would use `escapeshellarg()`  
3. **PDO** pre-statement -> SQL injection  
4. File upload system need to filter `/`, `../`...in the path -> LFI  
5. `preg_replace()`, `preg_replace_all()`and some regex always can be bypassed www  
6. `filter_var()`, `filter_input()` would return True, False according to data type  
[See more in PHP Manual](http://php.net/manual/en/function.filter-var.php)  
```php
// Ref to ripstech php calendat part of source code  
$indexTemplate = '<img ' .
            'src="https://loremflickr.com/320/240">' .
            '<a href="{{link|escape}}">Next slide »</a>';     // use of php twig template engine, escape
.....
public function getNexSlideUrl() {
        $nextSlide = $_GET['nextSlide'];
        return filter_var($nextSlide, FILTER_VALIDATE_URL);  // filter_var() authenticate on valid URL
    }
...
```  
Here are two authentication on URL, but we still can xss via `nextSlide=javascript://comment%250aaler(1)`  
* Bypass  
1. bypass `addslashes()`, `addslashes()` which always let us not able to close quote  
double addslash `\\` to bypass  
```php
// payload1 = c';
option='c\';';
// There is a \ because addslashes
// payload2 = c\';
option='c\\';'
// successful!!
```  
* Regex  
```php
[abc]     A single character: a, b or c
[^abc]     Any single character but a, b, or c
[a-z]     Any single character in the range a-z
[a-zA-Z]     Any single character in the range a-z or A-Z
^     Start of line
$     End of line
\A     Start of string
\z     End of string
.     Any single character
\s     Any whitespace character
\S     Any non-whitespace character
\d     Any digit
\D     Any non-digit
\w     Any word character (letter, number, underscore)
\W     Any non-word character
\b     Any word boundary character
(...)     Capture everything enclosed
(a|b)     a or b
a?     Zero or one of a
a*     Zero or more of a
a+     One or more of a
a{3}     Exactly 3 of a
a{3,}     3 or more of a
a{3,6}     Between 3 and 6 of a
(?R)     recursive (paste pattern)

options:
i case insensitive
m make dot match newlines
x ignore whitespace in regex o perform
#{...} substitutions only once
```

# PCRE DoS
We usually obfuscate the function `preg_match()` with some tricks such like encoding, or the natural attribute of the programming language itself. However, here is another way to bypass with making it crash:  
[The event happens from here, one day...](https://bugs.php.net/bug.php?id=61744)  
To understand why it crashed, we need to know that regular expression of php is based on the library of **PCRE**. There are two related settings of it in the apache modules or php-cgi:  
1. `pcre.backtrack_limit`  
2. `pcre.recursion_limit`  
[pcre-configuration](http://php.net/manual/en/pcre.configuration.php)  
If the number of backtrack or recursion is over the limit, it will make it crash and the function of `match()` would not work (child process would restart). However, even you try to assign a very big number to limit, it will still crash because overflow on the stack.  
* Exploit:  
Try do make the number of backtrack bigger!  
* Defense:  
`preg_match` return 1 if matched, return `0` when not matched, return `false` when error(over limit).  
Therefore, don't write a sentence such like:  
```php
if(preg_match == 0)
```  
This would cause that even error can also go into the if condition. Instead, we should use `if(preg_match() === 0)`.

# Weak type
[PHP type comparison tables](http://us3.php.net/manual/en/types.comparisons.php)  
php is a language of weak type, this means that we can assign a value to another type of variable at any time.  
1. Type of changes  
```php
1 == '1'       // true
0 == 'abcd'     // true
5 == '5cdeg'     // true
```  
Therefore, we need `===`!  
```php
"0x1f640" == 128576   // true
"0x1f640" == "1f640"  // false
```
php would change char to decimal while facing char which starts with `0x`!  
```php
"0e328428492284" == "0e24824048204"  // true
```
**md5 collision**, php would consider the words after `0e` as `10^x`, which means ten to the power of x！  
Here are some examples can be used in CTF for convenience :)......  
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
2. Functions to change type  
int -> string :  
```php
$str = (string)$var;
$str = strval($var);
```
string -> int :  
```php
var_dump(intval('1abc'));    // 1
var_dump(intval('abc'));    // 0
```
intval() would not return error even it face the type which is not string, but only return 0.  
3. Dangerous use of some functions  
* md5()  
md5() won't return error when the parameter is array, and also cannot calculate hash value correctly...
```php
$arr1[] = array("hi" => "helloworld");
$arr2 = array("hi","helloworld","ohmygod");
var_dump(md5($arr1) == md5($arr2));               // true
```  

* int()  
int() cannot change correctly while the parameter is **hex** or `0e`...  
```php
$temp = $_GET['tmp'];
echo (int)$tmp;
//
// ?tmp=0x76abb    ret 0
// ?tmp=4e325      ret 4
```  

* strcmp()  
strcmp would change two string parameters to ascii then do subtraction, if str1 - str2 < 0 ret (-1), if equal ret (0), the others ret(1)  
```php
if (strcmp($input, $password) == 0){}
// POC: ?input[]
```
Exploit: subtraction between string and non-string (Array injection) as parameter of strcmp() will run into error, and return 0!  
* switch()  
switch would also change parameter into **int** type...  
* in_array()  
[PHP Manual](http://php.net/manual/en/function.in-array.php)  
`bool in_array ( mixed $needle , array $haystack [, bool $strict = FALSE ] )`  
From manual：in_array can be used to detect whether **$needle** exist in the array of second parameter？ If set the third parameter to true, the check of type would be added！  
```php
class Challenge {
    const UPLOAD_DIRECTORY = './solutions/';
    private $file;
    private $whitelist;

    public function __construct($file) {
        $this->file = $file;
        $this->whitelist = range(1, 24);    // whitelist is the random number between 1 to 24
    }

    public function __destruct() {
        if (in_array($this->file['name'], $this->whitelist)) {
            move_uploaded_file(
                $this->file['tmp_name'],
                self::UPLOAD_DIRECTORY . $this->file['name']
            );
        }
    }
}
$challenge = new Challenge($_FILES['solution']);
```
This is the whitelist upload system, we can `mov_uploaded_file` if we bypass the check  
Due to the bug in **in_array()**, we can use `1filename.php` to bypass the whitelist  
：The above is the learning note from php security calendar 2017 - wish list  

# Data handling
* Before **PHP5.5.9**, while comparison bwtween `if($a[0] == $a[$x])`of array type, result of two key would be put into `result`, and this would cause to integer overflow.  
```php
// ASIS 2018 Qual Nice Code
if($a[0] == $a[68719476736])
```
Because of `68719476736 - 0` is put into 32 bits `result` and forced to become True, details in [Vlog #003: old PHP and array===array](https://www.youtube.com/watch?v=8fGigwN_E-U)  
* PHP var name have special chars: `.` or ` `(space char) would be changed into `_`(underline) （not limited to version  
```php
parse_str("pwn.ch=hello&pw nch=hey",$test);
var_dump($test);
// result: array(2) { ["pwn_ch"]=> string(5) "hello" ["pw_nch"]=> string(3) "hey" }
```
Ref to [kaibro web ctf Cheatsheet](https://github.com/w181496/Web-CTF-Cheatsheet)   

# Variable Coverability
`$$`, `extract`, `parse_str`, `import_request_variables`, `register_globals`, `$GLOBALS`, `mb_parser_str`  
1. `parse_str`  
[PHP MANUAL](http://php.net/manual/zh/function.parse-str.php)  
parse_str($str,$output) parse $str then put into the array $output  
```php
// php manual example really help me so much to understand the vul
parse_str("key=value&arr[]=a&arr[]=b");
echo $key; // value
echo $arr[0];  // a
echo $arr[1];  // b
```
2. `extract`  
extract parameter must be **array**  
```php
$b = array("a"=>"1");
extract($b);
echo $a;   // 1
```

# Dangerous Mistake function
1. `move_uploaded_file()`  
Originally, we can use `.php/.` to bypass the limit of extension. However, it cannot used to overwrite the file which already exists  
```php
move_uploaded_file(string filename, string absolute path);
// path = /path/x/../aaa.php/.
```
`lstat()` is called to determine whether the old file exists. Due to `lstat()`, `/.` can overwrite the old file now!  
[You can see more details in My note](https://shinmao.github.io/web/2018/04/13/The-Magic-from-0CTF-ezDoor/)  
[pupiles關於0ctf ezDoor的發想](http://pupiles.com/%E7%94%B1%E4%B8%80%E9%81%93ctf%E9%A2%98%E5%BC%95%E5%8F%91%E7%9A%84%E6%80%9D%E8%80%83.html)  
2. `filter_var($uri, FILTER_VALIDATE_URL)`flag can not filter URL effectively  
[See more details in my part of SSRF](https://github.com/shinmao/Web-Security-Learning/tree/master/SSRF)  
3. `parse_url()`  
```php
// Common URL
var_dump(parse_url('http://localhost.com:80/index'));
// array(4) { ["scheme"]=> string(4) "http" ["host"]=> string(13) "localhost.com" ["port"]=> int(80) ["path"]=> string(6) "/index" }

// lack of schema
var_dump(parse_url('/localhost.com:80/index'));
// bool(false)

// lack of schema, but success if the port concatenate with letters!
var_dump(parse_url('/localhost.com:80a'));
// array(1) { ["path"]=> string(24) "/localhost.com:80a/index" }

// Error parsing of port
// index:80 should be path, but be parsed as port in fact
var_dump(parse_url('//localhost.com/index:80'));
// array(3) { ["host"]=> string(13) "localhost.com" ["port"]=> int(80) ["path"]=> string(9) "/index:80" }

// we can see the parsed host in the second example
var_dump(parse_url('/index?/go/'));
// array(2) { ["path"]=> string(6) "/index" ["query"]=> string(4) "/go/" }
var_dump(parse_url('//index?/go/'));
// array(2) { ["host"]=> string(5) "index" ["query"]=> string(4) "/go/" }
```  
In addition, backend system can use `parse_url($url,PHP_URL_HOST)` to get host. Reference to [MEEPWN 2018 OmegaSector](https://github.com/shinmao/CTF-writeups/tree/master/Meepwn_CTF_Quals2018)  

# Reference
* [My learning note of move_upload_file](https://shinmao.github.io/web/2018/04/13/The-Magic-from-0CTF-ezDoor/)  
* [pupiles關於0ctf ezDoor的發想](http://pupiles.com/%E7%94%B1%E4%B8%80%E9%81%93ctf%E9%A2%98%E5%BC%95%E5%8F%91%E7%9A%84%E6%80%9D%E8%80%83.html)  
* [php manual preg match](http://php.net/manual/zh/function.preg-match.php)  
* [求生 正規表達式](http://j796160836.pixnet.net/blog/post/29514227-%5B%E8%BD%89%E8%B2%BC%5D%E5%B8%B8%E7%94%A8%E7%9A%84php%E6%AD%A3%E8%A6%8F%E8%A1%A8%E7%A4%BA%E5%BC%8F)  
* [PHP Manual in-array](http://php.net/manual/en/function.in-array.php)  
* [PHP Mamual parse-str](http://php.net/manual/zh/function.parse-str.php)  
