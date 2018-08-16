# HTTP header
We always can do header injection do obfuscate server side. Therefore, it is also important for us to understand theway how they works and their settings.  

## XFF (X-Forwarded-For)  
We must know hackers always like to forge their ip with XFF in CTF. However, it is not so easy in the realworld. The story comes from the [RealWorldCTF-Advertisement](http://taiwan.1pwnch.com/ctf/web/2018/07/31/The-Magic-from-RWCTF/#more). @Phith0n used `flask.request.headers.get('X-Forwarded-For', flask.request.remote_addr)` to get client ip in the code. Here, we need to see the format of XFF first.  
```php
client1, proxy1, proxy2, proxy3 
```  
And here are some problems:  
1. http-proxy: if client side has http-proxy, the `client1` would be replaced with the ip of http-proxy.  
2. NAT:  
3. CDN: we can use `dig www.example.com` to trace whether CDN exists.  
4. `ngx_http_realip_module` helps get client's ip. However, XFF has repetive ip during wrong settings.  
Therefore, it's difficult for us to forge our ip with XFF in realworld nowadays.  
