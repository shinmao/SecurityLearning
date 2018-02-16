## php 變量覆蓋
php security in Variable Coverage  
```$$```,```extract()```,```parse_str()```,```import_request_variables()``` 危險使用！  
  
### parse_str()
[PHP MANUAL](http://php.net/manual/zh/function.parse-str.php)  
parse_str($str,$output) 將$str解析放進$output陣列  
```php
// php manual裡面的例子對這個漏洞的瞭解很有幫助
parse_str("key=value&arr[]=a&arr[]=b");
echo $key; // value
echo $arr[0];  // a
echo $arr[1];  // b
```

### extract()
extract 變量對象必為**陣列**  
```php
$b = array("a"=>"1");
extract($b);
echo $a;   // 1
```

