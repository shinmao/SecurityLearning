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
