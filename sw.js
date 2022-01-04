const allowedCDNHosts=[
    'cdn.jsdelivr.net',
    'npm.elemecdn.com',
    'unpkg.zhimg.com',
    'code.bdstatic.com',
    'shadow.elemecdn.com',
    // 'lib.baomitu.com',
    'cdnjs.cloudflare.com',
    'lf6-cdn-tos.bytecdntp.com'
]
const RegexList =[
    /^\/npm\/(\S+?)@(\S+?)\/(.+)\/(\S+?)$/,//For jsdelivr
    /^\/(\S+?)@(\S+?)\/(.+)\/(\S+?)$/,//For NPM CDN

]
const CDNRegexOptions ={
    'cdn.jsdelivr.net':{
        'regex': RegexList[0],
        'string':'https://{hostName}/npm/{lib}@{version}/{path}{fileName}',
    },
    'npm.elemecdn.com':{
        'regex': RegexList[1],
        'string':'https://{hostName}/{lib}@{version}/{path}{fileName}',
    },
    'unpkg.zhimg.com':{
        'regex': RegexList[1],
        'string':'https://{hostName}/{lib}@{version}/{path}{fileName}',
    },
    'code.bdstatic.com':{
        'regex': RegexList[0],
        'string':'https://{hostName}/npm/{lib}@{version}/{path}{fileName}',
    },
    'shadow.elemecdn.com':{
        'regex': RegexList[0],
        'string':'https://{hostName}/npm/{lib}@{version}/{path}{fileName}',
    },
    'cdnjs.cloudflare.com':{
        'regex':/^\/ajax\/libs\/(\S+?)\/(\S+?)\/(\S+?)$/,
        'string':'https://{hostName}/ajax/libs/{lib}/{version}/{fileName}'
    },
    // 'lib.baomitu.com':{
    //     'regex':/^\/(\S+?)\/(\S+?)\/(\S+?)$/,
    //     'string':'https://{hostName}/ajax/libs/{lib}/{version}/{fileName}'
    // },
    'lf6-cdn-tos.bytecdntp.com':{
        'regex':/^\/cdn\/expire-1-M\/(\S+?)\/(\S+?)\/(\S+?)$/,
        'string':'https://{hostName}/cdn/expire-1-M/{lib}/{version}/{fileName}'

    }

}
function handleError(err,signal){
    if (err==undefined){
        err=new Error('404 Not Found');
    }
    return new Promise(function (resolve,reject){
            signal.onabort=function(){
                reject()
            }
            setTimeout(() => reject(err), 100000)
        }
    )
}
function fetchURL(url,signal) {
    // console.log(signal)
    return  fetch(url,{signal}).then(response =>{
        if (response.ok){
            return new Promise((resolve, reject)=>{return resolve({response,url})})
        }else {

            return handleError(undefined,signal)
        }
    }).catch(err=> {
            // console.log(err.toString())
            if (err.toString().indexOf('AbortError')!==-1 ){
                console.debug("Canceled")
                return new Promise.reject(err)
            }else {
                return   handleError(err,signal)

            }
        }
    )
}
self.addEventListener('install', function(event) {
    self.skipWaiting();
})
self.addEventListener('fetch', function(event) {
    const request = event.request
    event.respondWith(( (request)=> {
            // console.log(request)
            try {
                if (request.method === 'GET') {
                    const url = new URL(request.url)
                    // console.log(url)
                    if (allowedCDNHosts.indexOf(url.hostname) !== -1) {

                        let paths = CDNRegexOptions[url.hostname].regex.exec(url.pathname)
                        var lib, version, path,fileName
                        if (paths.length === 5) {

                            [, lib, version, path,fileName] = paths
                        }else if (paths.length===4){
                            [, lib, version,fileName] = paths
                        }else {
                            return  fetch(request.url)

                        }
                        if (version === 'latest') {
                            console.warn(`${lib} uses version tag 'latest',most of Mirrors do not support this tag.`)
                        }
                        let controllerSet={}
                        let urls = Array.from(Object.entries(CDNRegexOptions), ([hostname, val]) => {
                            const controller = new AbortController();
                            const url = val['string'].replace('{hostName}', hostname).replace('{lib}', lib).replace('{version}', version).replace('{path}', path?path+'/':"").replace('{fileName}',fileName)
                            controllerSet[url] = controller
                            return fetchURL(url, controller.signal)
                        })

                        console.debug(urls)
                        return new Promise(function (resolve, reject) {
                            Promise.race(urls).then(({response,url})=>{
                                // console.log(response,url)
                                console.log(`👍 Asset ${response.url} wins the race!`)
                                resolve(response)
                                Object.keys(controllerSet).map((key)=>
                                    key===url?null:controllerSet[key].abort()
                                )

                            }).catch(err=>{
                                console.log(`🤯 All attempts failed! err: ${err}`)
                                reject(err)

                            })

                        })


                    }

                }
                return  fetch(request.url)

            }
            catch (e) {
                console.warn(`Error From SW respondWith ${e}`)
                return  fetch(request.url)
            }
        }

    )(request))
});