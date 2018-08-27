# RPO
Relative Path Overwrite  
This is an attack based on the difference between Browser's and Server's understanding of relative URL.  

# Browser v.s. Server
1. what user will see depends on the response  
2. imported `css/js` depends on browser  
browser won't urldecode; therefore, `first%2findex.php` would be considered as filename  
e.g.  
`https://example.com/first%2findex.php`  
server side：`https://example.com/first/index.php` so, server side would response index.php to user  
browser side：`first%2findex.php` considered as filename due to not decoding  

# Exploit
CTF: we assume the following points   
1. `/1/index.php?query=`  
We can echo `query` to the page，but still can not make xss  
2. `/flag.php`  
this page uses relative path such as `<link href='1/'...>` to import css  
Our goal：change `background-color` of **flag.php**  

**Exploit**:  
`/1%2F%3fquery={}*{background-color%3Ared}%2f..%2f../flag.php`  
The link above is our exploit and the background color has been changed to red!  
1. server takes urldecode and get `/1/?query={}*{background-color:red}/../../flag.php`，so the response is `flag.php`  
2. browser import the css with `/1%2F%3Fquery={}*{background-color%3Ared}%2F..%2F../1/`  
:sparkles: This is the most important point of the exploit! What css loads here is the index.php with query，the part of `/1%2F%3Fquery={}*{background-color%3Ared}%2F..%2F..` would be ignored because the path can not be recognized, and browser will load the index.php with css syntax  
Why the xss in css can work here? Because css can ignore most of the error syntax，so the part of `%2F..%2F..` would be ignored！  

# Be careful
But be careful, sometimes you would get 404 again and again on the apache. The reason for that is the configuration `AllowEncodedSlashes` in Apache might be set to OFF. In this case, apache won't accept the word `%2F` in the URL.

# Reference
1. [RPO攻击技术浅析](https://mp.weixin.qq.com/s?__biz=MzUxOTYzMzU0NQ==&mid=2247483692&idx=1&sn=ecd853bb5cb3e654a08c5214a1b951a2&chksm=f9f7eecace8067dc155346e5204f6eae0df9890af60777234e249021d577226c6989e73a107b&scene=21#wechat_redirect)  
2. [Kaibro web_ctf_cheatsheet](https://github.com/w181496/Web-CTF-Cheatsheet)
