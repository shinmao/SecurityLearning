## PHP 弱類型
php 是一種弱類型的語言，這意味著我們可以隨時將值賦予一個其他類型的變量，以下是常見的弱類型問題。  
  
### 類型轉換
```php
1 == '1'       // true
0 == 'abcd'     // true
5 == '5cdeg'     // true
```  
因此比較時應該用 ```===``` 強等於的方式！  
```php
"0x1f640" == 128576   // true
"0x1f640" == "1f640"  // false 
```
php遇到```0x```開頭的字符會先轉成十進制！
```php
"0e328428492284" == "0e24824048204"  // true
```
這就是常見的**md5 collision**，php碰到```0e```開頭的字符會當作科學記號處理，後面必須是數字作為次方！  
順手留資料，下一次在CTF遇到好用XD......  
```php
$ echo -n 240610708 | md5sum
0e462097431906509019562988736854  -
$ echo -n QNKCDZO | md5sum
0e830400451993494058024219903391  -
$ echo -n aabg7XSs | md5sum
0e087386482136013740957780965295  -
```
  
### 類型轉換 Functions  
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

### 一些Functions的危險使用
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
```bool in_array ( mixed $needle , array $haystack [, bool $strict = FALSE ] )```  
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
從上面的代碼可以推測：這是一個白名單上傳系統，如果通過檢查就能夠```mov_uploaded_file```  
由於**in_array()**的漏洞，我們可以透過```1filename.php```輕鬆繞過白名單檢查！  
：以上也是php security calendar 2017 - wish list 的學習筆記
