## PHP 危險過濾
永遠不要相信外部輸入: $_GET, $_POST, $_SERVER, fopen('php://input','r'), upload downloaded files, session, cookies...  
  
### 常見處理 (以下介紹過濾輸入以及驗證數據
1. ```strip_tags()```,```htmlentities()```, or ```htmlspecialchars()``` 對一些html標籤做轉譯 -> xss  
```php
$input = '<script>...</script>';
echo htmlentities($input, ENT_QUOTES, 'utf-8');
```  
2. 若傳入數據必須在命令行中執行而調用```exec()```, 使用```escapeshellarg()```  
3. **PDO** 預處理 SQL 語句 -> SQL injection  
4. File upload system 應注意路徑過濾 ```/```, ```../```... -> LFI  
5. ```preg_replace()```, ```preg_replace_all()```等正規表達式的過濾方法很容易掉坑 www  
```驗證數據跟過濾不一樣，而是檢查輸入是否為有效xx```  
6. ```filter_var()```, ```filter_input()```針對不同類型的數據會回傳 True, False  
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
這裡有兩關驗證URL的有效性，卻還是可以透過```nextSlide=javascript://comment%250aaler(1)```來完成xss  
: 原因日後研究xss再做整理，最近在玩sqli XD

### 繞過
1. 繞過```addslashes()```, ```addslashes()```往往讓我們無法閉合引號  
用雙轉譯 ```\\``` 繞過
```php
// payload1 = c';
option='c\';';
// There is a \ because addslashes
// payload2 = c\';
option='c\\';'
// successful!!
```

### 正規表達式
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
