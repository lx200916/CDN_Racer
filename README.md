# CDN Racer / CDN 快跑
### 😶 这是什么
这是基于`Service Worker`实现的纯前端CDN替换工具，当`Service Worker`注册成功后，会对在列表内的CDN的GET资源请求进行替换，同时向多个CDN请求资源，并直接返回最快响应的资源内容。

但是基于 `Service Worker`的限制,目前仍有很大局限性.
### 🤔 如何使用
只需要在html文件中注册`sw.js`即可.
```html
<script>
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js',).then(function(reg) {
            // registration worked
            console.log('Registration succeeded. Scope is ' + reg.scope);
        }).catch(function(error) {
            // registration failed
            console.log('Registration failed with ' + error);
        });
    }
</script>
<script src="https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/bootstrap-vue/2.21.2/bootstrap-vue.min.js"></script>
<script src="https://code.bdstatic.com/npm/leancloud-storage@4.12.0/dist/av-min.js?noRace=1"></script>
<!--使用noRace来禁用CDN Racer-->
```
参考 [index.html](index.html)
### 😏 效果展示
![img.png](img.png)
### 🤤 支持的CDN域名

- cdn.jsdelivr.net (方便一键替换和国外服务需求) 
- unpkg.com 的诸多镜像点 (不做可靠性保证)
- code.bdstatic.com (基于百度云,对外界引用持欢迎态度)
- cdnjs.cloudflare.com (国外服务需求)
- cdnjs 的诸多国内镜像点 (如 lf6-cdn-tos.bytecdntp.com-字节跳动CDN)

参见[sw.js](sw.js)中 `CDNRegexOptions` 部分,你可以自定义自己的CDN选项,也欢迎提交PR.

> 但请注意以下问题:
> 
> CDN在资源不存在时是否返回404状态码.如 `lib.baomitu.com` 75CDN,在资源不存在时仍返回`200 OK`,导致错误资源抢答.请勿启用此CDN.
> 
> CDN 是否欢迎第三方使用,如 `unpkg.zhimg.com`(拥有较为严格的防盗链策略)
### 🥶 但是,古尔丹,代价是什么呢?
* 为你的项目引入了本不该有的复杂度和`Network 开发者选项卡`中的失败记录.
* 可能会由于并发过多请求暂时堵塞浏览器请求 Pipeline ,但是当一个资源获取响应后,其他请求会自动取消,因此对性能无过多影响.
* 当你使用`Latest`版本标签时,可能会由于镜像源的同步时间差而获取到过期资源.我们不建议在生产环境下使用`Latest`.
* 受限于本人糟糕的代码水平与 `Service Worker` 的自身限制,本项目有以下缺陷(不得不品尝):
  * 基于Service Worker的实现原理,无法监听Worker未注册成功时的请求.因此第一次访问网站时html中的部分`script`标签无法代理.
  * 尚未添加Cache API,您可以自行添加来实现Service Worker请求的缓存.
* 本项目不适用以下用途:
  * 利用Github做图床或其他内容CDN的用户.本项目不会代理 `jsdelivr.net/gh`下的内容,仅代理npm的镜像.一方面国内CDN大部分不会代理gh,另一方面大部分代理gh的CDN都会在国内产生合规性问题.
  * 在测试环境下的用户.
  * 加载Latest的版本标签用户.
  