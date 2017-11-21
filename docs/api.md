# **期末考啦 API文档**

## 综述

调用约定
1. 统一使用POST方法对URL请求, 请求参数使用JSON类型传递, 目前固定一个字段`version: 1`, 可省略. 接口版本升级后不能省略.  

```javascript  
{
    "version": 1,  // 接口版本, 省略时为1
    ...            // 接口所需参数
}
```
2. 在服务正常的情况下, 每个请求均有回应, 并且以固定格式回应:  

```javascript
{
    "code": 0,          // 响应码, 0为成功, 其他为失败
    "info": "操作成功", // 响应信息, 失败时(非0时)可直接展示给客户, 大部分情况为中文, 少数情况为英文
    "res": {}          // 响应资源, 根据接口定义而不同
}
```
3. 第一版路径为 http://服务器IP/api/接口URL, 接口写入文档后参数不做改变.  
4. 需要记录`Cookie`保存部分状态. 
5. 为了防御潜在的CSRF攻击, 请添加http的referer字段(尽管服务端还没做判断).  

RETCODE定义如下:  

```javascript
{
  "Success": [0, "操作成功"],
  "Unknown": [1, "未知错误"],
  "CollegeExist": [100, "高校已存在"],
  "UserNotFound": [101, "用户不存在"],
  "WrongPassword": [102, "密码错误"],
  "PermissionDenied": [103, "权限不足"],
  "WrongParam": [104, "参数错误"],
  "NotLogin": [105, "尚未登录"],
  "CourseExist": [106, "课程已存在"],
  "ObjectNotFound": [107, "未找到该对象"],
  "AcademyExist": [108, "学院已存在"],
  "WrongPhoneNumber": [109, "手机号格式错误"],
  "TryTommorrow": [110, "今天次数已经试完, 请明天再试"],
  "TooFast": [111, "速度太快了, 请稍等再试"],
  "WrongCode": [112, "验证码错误"],
  "UserExist": [113, "用户已存在"],
  "CollegeNotSupport": [114, "暂时不支持该校"],
  "FailSchoolAccount": [115, "教务处帐号校验失败"],
  "SchoolNeedMoreInfo": [116, "教务处登录需要更多信息"],
  "NoSuchFileOrDirectory": [117, "该文件或目录未找到"],
  "ObjectExist": [118, "对象已存在"],
  "SchoolNotFound": [119, "学校未找到"],
  "PhoneRegistered": [120, "手机号已注册"],
  "NeedCode": [121, "请输入手机验证码"]
}
```


***

## order

订单. 使用流程为 调用add, 返回一个包含uuid的对象, 然后使用uuid调用pay, 返回的payinfo调用支付SDK.

### pay
> URL: /api/order/pay  
> 参数:  
> uuid: 订单号  
> type: 付款方式, 目前只能传 `alipay`  

支付成功后订单状态自己会改变, 可能会有几秒延迟, 客户端SDK返回支付成功后客户端过5s刷新列表应该就是已支付状态了.

支付宝方式返回格式如下, payinfo直接传给支付宝SDK即可:

```json
{
    "type": "alipay", // 和传入的type一致
    "payinfo": "xxxxxxxxxxxxxxxx" // 直接传入sdk, 是一个字符串
}
```


### add
> URL: /api/order/add  
> 参数:  
> addr: 收货地址  
> name: 收货人姓名  
> phone: 收货人电话  
> list: 订单详情, 说明如下  

下单, list参数为一个二维数组. 如 `[[1, 2], [3, 4]]` 表示商品ID为1数量为2, 商品ID为3数量为4.

### list
> URL: /api/order/list  
> 参数:  
> page: 页码, 不传为1  

列出当前用户下过的订单, 结构如下:

price 单位为分.

state 有以下4种取值: 'Paying', 'Shipping', 'Success', 'Closed'. 

分别对应 '正在支付', '等待配送', '交易成功', '交易关闭'

```json
{
    "total": 2,
    "items": [{
        "uuid": "2452b4bb-7ca4-429a-8078-8f9dd936fac2",
        "addr": "地址",
        "name": "某某",
        "phone": "12345678900",
        "state": "Success",
        "createTime": 1495848288764,
        "payTime": null,
        "successTime": 1495849269510,
        "totalPrice": 103
    },
    {
        "uuid": "e98c31a4-ad75-4031-b3ac-49de779264d4",
        "addr": "地址",
        "name": "某某",
        "phone": "12345678900",
        "state": "Success",
        "createTime": 1495848257009,
        "payTime": null,
        "successTime": 1495849266767,
        "totalPrice": 100
    }],
    "pageSize": 10
}
```

## good

商品

### list
> URL: /api/good/list  
> 参数: 无  

列出所有商品, 结构如下:

```json
[{
    "id": 1,
    "title": "测试1",
    "price": 100,
    "image": "http://1.jpg"
},
{
    "id": 2,
    "title": "测试2",
    "price": 1,
    "image": "http://123.jpg"
}]
```

## sms

以 session 为单位记录信息.  

### trusted
> URL: /api/sms/trusted  
> 参数: 无  

返回当前信任的手机号, 如不存在则返回null.  

```json
{
    "code":0,
    "info":"操作成功",
    "res":null // "13333333333"
}
```

### verify
> URL: /api/sms/verify  
> 参数:  
> code: 验证码

验证短信验证码, 若不正确则返回 `WrongCode`. 正确则设置 `trusted` 为`send`时的手机号.  
trusted 15分钟后会失效.  

### send
> URL: /api/sms/send  
> 参数:  
> phone: 手机号 可选, 若不给则默认为当前登录的账户

发送验证码. 成功返回 Success.


## user

### resetpw
> URL: /api/user/resetpw  
> 参数:  
> username: 用户名(手机号)  
> password: 密码(明文, 无需加密)  

重置用户密码, 如果 sms 模块的 trusted 中的手机号不等于用户名的话则会执行一个 `/api/sms/send`, 并返回错误 `NeedCode`.  
如果用户不存在则返回 `UserNotFound`.  


### xsqToken
> URL: /api/user/xsqToken  
> 参数: 无  

获取友盟学生圈的access token

### infobyname
> URL: /api/user/infobyname  
> 参数:  
> nickname: 昵称  

获取指定昵称的用户公开信息, 目前与`user/info`字段相同, 未找到用户则返回空对象`{}`  
同时可用来判断nickname是否重复  

### modify
> URL: /api/user/modify  
> 参数: (均为可选)  
> nickname: 昵称  
> gender: 性别  
> AcademyId: 学院ID  
> enterYear: 入学年份  
> password: 密码  

修改用户信息, 如果失败则返回`WrongParam`, 并在res附上失败的参数具体是哪个.  
如修改了多个值, 但`nickname`重复, 则返回:  
```javascript
{
  "code": 104,
  "info": "参数错误",
  "res": {
    "fields": [
      "nickname"
    ]
  }
}
```
如果有多个错误只会显示第一个(受ORM框架限制)  


### login
> URL: /api/user/login  
> 参数:  
> un: 用户名  
> pw: 密码  

用户登录  
如果用户不存在返回`UserNotFound`  
如果密码错误返回`WrongPassword`  
登录成功返回与 `user/info` 相同的用户信息  

### info
> URL: /api/user/info  
> 参数: 无  

返回用户信息, 若未登录则返回错误`NotLogin`  
```javascript
{
  "id": 3,
  "username": "15659737756",
  "isAdmin": false,
  "nickname": "空格",
  "gender": "男生",
  "CollegeId": 10,
  "AcademyId": 31,
  "avatar": "/path/to/pic.jpg",
  "collegeName": "福州大学",
  "academyName": "数学与计算机科学学院"
}
```

### upload
> URL: /api/user/upload  
> 参数:  
> avatar: 头像文件

需要在登录状态使用, 上传头像.  
返回头像相对服务器路径:  
```javascript
{
    avatar: "upload/avatar/8c222514d6c9e87481cca238a1260806.png"
}
```

### sendcode
> URL: /api/user/sendcode  
> 参数:  
> phone: 手机号  

用于向手机号发送注册验证短信, 验证码为4位数字, 一天限发3次, 每次有效15分钟, 两次间隔最短为1分钟.  
已注册的手机号将不会发送短信.  

### verifycode
> URL: /api/user/verifycode  
> 参数:  
> code: 短信验证码

用于验证sendcode发出的短信是否正确, 如果正确会使当前`session`验证手机号变为sendcode时的手机号.  

### register
> URL: /api/user/register  
> 参数:  
> phone: 手机号  
> phonecode: 验证码  
> password: 密码  
> nick: 昵称  
> gender: 性别  
> schoolId: 学校ID  
> academyId: 学院ID  
> schoolUn: 教务处用户名  
> schoolPw: 教务处密码  
> enterYear: 入学年份  
> schoolMore: 教务处登录时所需的额外信息  


注册帐号, 如果phone对应的手机号已经通过verifycode验证, 则可省略phonecode参数.  
手机号的格式必须为11位数字  
性别必须为"男生", "女生", "保密"中的一个值  
学校ID将会决定教务处的登录方式  

如果教务处登录需要额外信息(如验证码), 则会返回code=116, 并且res会存有如下信息:
```javascript
 {
    needMore: true,
    prompt: {   // 要求用户输入的字段, 目前type只有image, 如果以后出现更多类别会补充. 
        code: { // 对于当前版本如果出现不支持的type需要向用户说明更新.
            desc: '验证码',
            type: 'image',
            data: '图片的base64'
        }
    },
    sendback: { // 登录教务处所需的session信息
        sessionId: 'sessionId'
    }
}
```
sendback的所有内容需要原样返回给服务器, 并且加上prompt中要求的内容. 如验证码是1234, 客户端就需要再次发送注册请求, 并且schoolMore为下列信息:  
```javascript
{
    code: '1234',
    sessionId: 'sessionId'
}
```

### logout
> URL: /api/user/logout  
> 参数: 无

退出当前登录

## school

### list
> URL: /api/school/list  
> 参数: 无  

列出所有学校, 返回格式如下.  
```javascript
[{
    id: 1,
    name: "学校名"
}, ...]
```

### listAcademy
> URL: /api/school/listAcademy  
> 参数:  
> college: 学校ID

列出所有学院, 学院ID不会重复, 返回格式如下.  
```javascript
[{
    id: 1,
    name: "学院名"
}, ...]
```

## ad
备注: ad模块中的所有`ad`可换成`sb`  

### getAD
> URL: /api/ad/getAD
> 参数: 无

列出最新版的广告信息, 返回格式如下:  
```javascript
{
    version: 1,             // 广告版本, 一个版本出现后不会再改变, 因此可根据版本号缓存.
    pic: 'http://...',      // 图片的URL
    url: 'http://...',      // 点击广告后进入的URL, 协议可能会增加到打开某个APP页面, 不止HTTP与HTTPS
    fallback: 'http://...', // 如果后期增加了新协议但是不识别的话打开的链接, 如果为空, 客户端被点击后不反应.
    enabled: true           // 广告是否有效, 如果为false, 则不显示广告
}
```
***

## dbfs

url中 `:school` 表示此处应换成实际操作的`学校ID`, 下面不再说明.  
路径均以`/`作为根目录, 当`path`的含义为文件夹时, 最后需要加上`/`

### list
> URL: /api/dbfs/:school/list  
> 参数:  
> path: 路径  
> detail: 是否获取详细信息 (取值0或1)

返回学校文件系统路径下的所有文件夹和文件.  
返回格式如下:  
```javascript
{
    files: [{
        size: "123", //单位: Byte
        name: "abc.txt",
        //以下为detail=1时的数据
        ctime: 1472185422506, //创建时间
        nick: "上传用户",
        uid: 1,
        md5: "xxxxx"
    }],
    folders: [{
        size: "0",
        name: "test",
        //以下为detail=1时的数据
        ctime: 1472185422506,
        ext: {}, // 特殊属性, 如可读可写等, 暂时用不上..
        nick: "创建用户",
        uid: 1
    }]
}
```

可能返回的错误:  
1. NoSuchFileOrDirectory

### newFolder
> URL: /api/dbfs/:school/newFolder  
> 参数:  
> path: 路径  

创建一个文件夹, 必须以/开头以及以/结尾.  
当文件夹存在时, 返回错误 `ObjectExist`.  
当没有权限创建时返回错误 `PermissionDenied`.  

### hashExist
> URL: /api/dbfs/:school/hashExist  
> 参数:  
> hash: 文件的md5  

查询指定的MD5在服务器是否存在. res直接为true或false

### link
> URL: /api/dbfs/:school/link  
> 参数:  
> path: 文件的路径  
> hash: 文件的md5  

一般在hashExist为true时使用, 将`path`处的文件内容设置为md5为`hash`的文件.  
如果md5的文件不存在, 返回错误`ObjectNotFound`.  
如果path处的文件存在, 返回错误`ObjectExist`.  

### upload
> URL: /api/dbfs/:school/upload  
> 参数:  
> path: 文件的路径  
> file: 文件的二进制内容  

上传文件并放到`path`指定的位置. 发送类型为`multipart`.  
如果path处的文件存在, 返回cuowu`ObjectExist`.  

### download
> URL: /api/dbfs/:school/download  
> 参数:  
> path: 文件的路径  

下载指定路径的文件, 当oss下载开启时, 会跳转到oss的路径.  

### downloadurl
> URL: /api/dbfs/:school/downloadurl  
> 参数:  
> path: 文件的路径  

当使用oss存储时会返回url, 否则返回null  
```javascript
{
    "url": null // 如果为null则可直接用download接口下载. 
}
```