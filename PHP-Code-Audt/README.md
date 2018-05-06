# PHP 代碼審計
*  [CTF中一些好用的奇技淫巧](#tricks)  
*  [PHP危險過濾](#dangerous-filter)  
*  [PHP弱類型](#weak-type)  
*  [PHP處理數據](#data-handling)  
*  [PHP變量覆蓋](#variable-coverability)  
*  [PHP危險函式/誤用](#dangerous-mistake-function)  
*  [Reference](#reference)

# Tricks
```php
eval(print_r(file("./flag.php")););
```

# Dangerous filter
永遠不要相信外部輸入: `$_GET, $_POST, $_SERVER, fopen('php://input','r'), upload downloaded files, session, cookies`...  
* 常見處理 (以下介紹過濾輸入以及驗證數據  
1. `strip_tags()`,`htmlentities()`, or `htmlspecialchars()` 對一些html標籤做轉譯 -> xss  
```php
$input = '<script>...</script>';
echo htmlentities($input, ENT_QUOTES, 'utf-8');
```  
2. 若傳入數據必須在命令行中執行而調用`exec()`, 使用`escapeshellarg()`  
3. **PDO** 預處理 SQL 語句 -> SQL injection  
4. File upload system 應注意路徑過濾 `/`, `../`... -> LFI  
5. `preg_replace()`, `preg_replace_all()`等正規表達式的過濾方法很容易掉坑 www  
`驗證數據跟過濾不一樣，而是檢查輸入是否為有效xx`  
6. `filter_var()`, `filter_input()`針對不同類型的數據會回傳 True, False  
[詳見PHP Manual](http://php.net/manual/en/function.filter-var.php)  
```php
// 以下取自 ripstech php calendat 部分 source code  
$indexTemplate = '<img ' .
            'src="https://loremflickr.com/320/240">' .
            '<a href="{{link|escape}}">Next slide »</a>';     // 可見php twig template engine, escape用法
.....
public function getNexSlideUrl() {
        $nextSlide = $_GET['nextSlide'];
        return filter_var($nextSlide, FILTER_VALIDATE_URL);  // filter_var() 驗證有效URL
    }
...
```  
這裡有兩關驗證URL的有效性，卻還是可以透過`nextSlide=javascript://comment%250aaler(1)`來完成xss  
* 繞過  
1. 繞過`addslashes()`, `addslashes()`往往讓我們無法閉合引號  
用雙轉譯 `\\` 繞過
```php
// payload1 = c';
option='c\';';
// There is a \ because addslashes
// payload2 = c\';
option='c\\';'
// successful!!
```
* 正規表達式  
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

options: 
i case insensitive 
m make dot match newlines 
x ignore whitespace in regex o perform 
#{...} substitutions only once
```
以上資料取自 [php manual](http://php.net/manual/zh/function.preg-match.php)  
[求生 正規表達式](http://j796160836.pixnet.net/blog/post/29514227-%5B%E8%BD%89%E8%B2%BC%5D%E5%B8%B8%E7%94%A8%E7%9A%84php%E6%AD%A3%E8%A6%8F%E8%A1%A8%E7%A4%BA%E5%BC%8F)  
[模式修飾符](http://php.net/manual/zh/reference.pcre.pattern.modifiers.php) 

# Weak type
php 是一種弱類型的語言，這意味著我們可以隨時將值賦予一個其他類型的變量，以下是常見的弱類型問題。  
1. 類型轉換  
```php
1 == '1'       // true
0 == 'abcd'     // true
5 == '5cdeg'     // true
```  
因此比較時應該用 `===` 強等於的方式！  
```php
"0x1f640" == 128576   // true
"0x1f640" == "1f640"  // false 
```
php遇到`0x`開頭的字符會先轉成十進制！
```php
"0e328428492284" == "0e24824048204"  // true
```
這就是常見的**md5 collision**，php碰到`0e`開頭的字符會當作科學記號處理，後面必須是數字作為次方！  
順手留資料，下一次在CTF遇到好用XD......  
```php
$ echo -n 240610708 | md5sum
0e462097431906509019562988736854  -
$ echo -n QNKCDZO | md5sum
0e830400451993494058024219903391  -
$ echo -n aabg7XSs | md5sum
0e087386482136013740957780965295  -
// 順便留個sha1當伴手禮XD
var_dump(sha1('aaroZmOk') == sha1('aaK1STfY'));
var_dump(sha1('aaO8zKZF') == sha1('aa3OFF9m'));
```
2. 類型轉換 Functions  
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
intval()即便遇到非字串類型也不會報錯，只會回傳0  
3. 一些Functions的危險使用  
* md5()  
md5() 在遇到參數為陣列時不會報錯，也無法正確計算hash值...
```php
$arr1[] = array("hi" => "helloworld");
$arr2 = array("hi","helloworld","ohmygod");
var_dump(md5($arr1) == md5($arr2));               // true
```  
  
* int()  
int() 在遇到參數為hex以及科學記號類型的字符串時，無法正確轉換...  
```php
$temp = $_GET['tmp'];
echo (int)$tmp;
//
// ?tmp=0x76abb    輸出結果為0
// ?tmp=4e325      輸出結果為4
```  
  
* strcmp()  
strcmp是將兩個string參數都轉換成ascii再做減法，若str1 - str2 < 0 則回傳-1，相等為0，其餘為1...  
```php
if (strcmp($input, $password) == 0){}
// POC: ?input[]
```
除了輸入一樣的password可以讓strcmp回傳結果為0, 讓一個 string 和 non-string (Array injection)作strcmp()的參數會有錯誤訊息, 並且回傳0!  
* switch()  
switch也會將參數轉換成int類型...  
* in_array()  
[PHP Manual](http://php.net/manual/en/function.in-array.php)  
`bool in_array ( mixed $needle , array $haystack [, bool $strict = FALSE ] )`  
參考官方手冊得知：in_array可以用來檢測**$needle**是否存在於第二個參數的array之中？ 若使用第三個參數設為true，才會加上type的檢查！  
```php
class Challenge {
    const UPLOAD_DIRECTORY = './solutions/';
    private $file;
    private $whitelist;

    public function __construct($file) {
        $this->file = $file;
        $this->whitelist = range(1, 24);    // 白名單為1到24的亂數
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
從上面的代碼可以推測：這是一個白名單上傳系統，如果通過檢查就能夠`mov_uploaded_file`  
由於**in_array()**的漏洞，我們可以透過`1filename.php`輕鬆繞過白名單檢查！  
：以上也是php security calendar 2017 - wish list 的學習筆記  

# Data handling
* 在**PHP5.5.9**之前的版本，在處理`if($a[0] == $a[$x])`陣列型態的比較時，會將兩個key相減取差值放入`result`，這個步驟可能會造成integer overflow  
```php
// ASIS 2018 Qual Nice Code 
if($a[0] == $a[68719476736])
```
上面的結果因為`68719476736 - 0`被放進了32位元的`result`而被強制變成了True，詳情參考[Vlog #003: old PHP and array===array](https://www.youtube.com/watch?v=8fGigwN_E-U)  
* PHP變數名稱中的`.`或` `空白字元會自動轉成`_`底線 （不限版本  
```php
parse_str("pwn.ch=hello&pw nch=hey",$test);
var_dump($test);
// result: array(2) { ["pwn_ch"]=> string(5) "hello" ["pw_nch"]=> string(3) "hey" }
```
參考自[kaibro web ctf Cheatsheet](https://github.com/w181496/Web-CTF-Cheatsheet)

# Variable Coverability 
`$$`, `extract`, `parse_str`, `import_request_variables`, `register_globals`, `$GLOBALS`, `mb_parser_str`  
1. `parse_str`  
[PHP MANUAL](http://php.net/manual/zh/function.parse-str.php)  
parse_str($str,$output) 將$str解析放進$output陣列  
```php
// php manual裡面的例子對這個漏洞的瞭解很有幫助
parse_str("key=value&arr[]=a&arr[]=b");
echo $key; // value
echo $arr[0];  // a
echo $arr[1];  // b
```
2. `extract`  
extract 變量對象必為**陣列**  
```php
$b = array("a"=>"1");
extract($b);
echo $a;   // 1
```

# Dangerous Mistake function
1. `move_uploaded_file()`  
```php
move_uploaded_file(string filename, string absolute path);
// path = /path/x/../aaa.php/.
```
調用`lstat()`來判斷是否有舊檔存在，由於`lstat()`判別路徑的問題，原本`/.`不能覆蓋舊檔現在卻能成功覆蓋。  
[咱的日記](https://shinmao.github.io/web/2018/04/13/The-Magic-from-0CTF-ezDoor/)  
[pupiles關於0ctf ezDoor的發想](http://pupiles.com/%E7%94%B1%E4%B8%80%E9%81%93ctf%E9%A2%98%E5%BC%95%E5%8F%91%E7%9A%84%E6%80%9D%E8%80%83.html)  

2. `escapeshellarg`誤用  
這裡要先介紹`escapeshellcmd`和`escapeshellarg`兩個函式  
`escapeshellcmd`會把參數視為一個cmd  
`escapeshellarg`會把參數視為一個變數  
[exploit-bypass-php-escapeshellarg-escapeshellcmd](https://github.com/kacperszurek/exploits/blob/master/GitList/exploit-bypass-php-escapeshellarg-escapeshellcmd.md)
```php
<?php
$query = escapeshellarg($query);
$results = $this->getClient()->run($this, "grep -i --line-number {$query} $branch");
// exploit: git grep -i --line-number '--open-files-in-pager=id;' master
```
以上為gitlist中的漏洞代碼：[GitList 0.6 - Unauthenticated Remote Code Execution](https://www.exploit-db.com/exploits/44548/)  
`escapeshellarg`函式在參數外圍包上引號，但是在exploit中，`--open-files-in-pager`還是變成了參數選項(options)而非參數值(value)，後面的`id;`則是在匹配到了內容會執行的命令，注意在shell中`;`代表順序執行不論失敗的cmd。  
解決辦法：官方的patch就是用`preg_replace`把`$query`開頭的非法字元(`-`or`--`)去除然後拼接在寫死的`--`後面，如此一來後面的參數不會再被解析為參數選項(options)  
```php
// 命令解析器中，--表示後面不會再有options
// patch
$results = $this->getClient()->run($this, "grep -i --line-number -- {$query} $branch");
```
[谈escapeshellarg绕过与参数注入漏洞](https://www.leavesongs.com/PENETRATION/escapeshellarg-and-parameter-injection.html)

# Reference
* [咱的move_uploaded_file日記](https://shinmao.github.io/web/2018/04/13/The-Magic-from-0CTF-ezDoor/)  
* [pupiles關於0ctf ezDoor的發想](http://pupiles.com/%E7%94%B1%E4%B8%80%E9%81%93ctf%E9%A2%98%E5%BC%95%E5%8F%91%E7%9A%84%E6%80%9D%E8%80%83.html)  
* [php manual preg match](http://php.net/manual/zh/function.preg-match.php)  
* [求生 正規表達式](http://j796160836.pixnet.net/blog/post/29514227-%5B%E8%BD%89%E8%B2%BC%5D%E5%B8%B8%E7%94%A8%E7%9A%84php%E6%AD%A3%E8%A6%8F%E8%A1%A8%E7%A4%BA%E5%BC%8F)  
* [PHP Manual in-array](http://php.net/manual/en/function.in-array.php)  
* [PHP Mamual parse-str](http://php.net/manual/zh/function.parse-str.php)  

