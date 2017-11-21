'use strict';

const path = require('path')
const crypto = require('crypto')
const promisePipe = require("promisepipe")
const utils = require('./utils')
const uuid = require('uuid')
var models = requirePR('models');
var topClient = requirePR('libs/top');
var Colleges = requirePR('libs/colleges');
var kvdb = requirePR('libs/kvdb')('phonecode');

var kvLastSend = kvdb.child('last');
var kvToday = kvdb.child('today');
var kvCode = kvdb.child('code');

var express = require('express');
var logger = require('log4js').getLogger('normal');
var router = express.Router();
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var request = Promise.promisifyAll(require('request'))
var qs = require('querystring')

const RETCODE = require('./retcode');
var config    = requirePR('config/config');
var phoneRE   = new RegExp(config.phoneRE);
var freqLimit = requirePR('libs/freqLimit')(config.freqLimit, (req, res) => res.ReturnJSON(RETCODE.TooFast));
const smsParamsTemplate = config.smsParams;

const AVATAR_FOLDER = 'avatar'
var uploadStorage = requirePR('libs/uploadStorage')(AVATAR_FOLDER);
var upload = require('multer')({storage: uploadStorage.storage});
const promiseStorage = Promise.promisifyAll(uploadStorage.storage)

const SMS = requirePR('libs/sms')(RETCODE)
const testPhone = config.testPhone || '13333333333'
const wrapper = utils.apiWrapper

function downloadToAvator (url) {
  const req = {}
  const file = {
    originalname: ''
  }
  console.log(promiseStorage)
  return Promise.all([
    promiseStorage.getDestinationAsync(req, file),
    promiseStorage.getFilenameAsync(req, file)
  ])
  .spread((folder, filename) => {
    const filepath = path.join(folder, filename)
    return promisePipe(request.get(url), fs.createWriteStream(filepath))
    .then(() => uploadStorage.path + filename)
  })
  .catch(e => {
    logger.error('downloadToAvator', e)
    throw RETCODE.OAuthFailed
  })
}

function createUserAutoNickname (profile) {
  let oriNickname = profile.nickname
  let nicknameSuffix = 0
  function next () {
    return models.User.create(profile).catch(e => {
      // 重名
      nicknameSuffix += 1
      if (nicknameSuffix > 10000) { // TODO：没bug后删掉
        return RETCODE.OAuthFailed
      }
      profile.nickname = `${oriNickname}_${nicknameSuffix}`
      return next()
    })
  }
  return next()
}

router.all('/oauthLogin', wrapper(({platform, openId, accessToken}, req) => {
  const afterFetch = (platform, id, {nick, gender, avatar}) => {
    return models.UserAuth.findOrCreate({
      where: {
        platform: platform,
        platformId: id
      }
    })
    .spread((userAuth, created) => userAuth.getUser().then(user => [userAuth, user]))
    .spread((userAuth, user) => {
      const first = user === null
      if (user === null) { // 新用户
        user = createUserAutoNickname({
          username: uuid(),
          nickname: nick,
          gender: gender
        })
        return user.then(user => {
          let chain = Promise.resolve()
          if (avatar) {
            chain = chain.then(() => downloadToAvator(avatar)).then(filepath => {
              user.set('avatar', filepath)
              return user.save()
            })
          }
          chain = chain.then(() => userAuth.setUser(user)).then(() => userAuth.getUser())
          chain = chain.then(user => [user, first])
          return chain
        })
      }
      return [user, first]
    })
    .spread((user, first) => {
      return promiseUserDetailInfo(user)
      .then(user => {
        user.first = first
        req.session.uid = user.id
        return user
      })
    })
  }
  let ps = {}
  switch (platform) {
    case 'qq':
      ps = {
        openid: openId,
        openkey: accessToken,
        appid: config.oauth.qq_appid
      }
      return request.getAsync({
        url: `https://openmobile.qq.com/user/get_simple_userinfo?${qs.stringify(ps)}`
      }).then(r => JSON.parse(r.body))
      .then(r => {
        if (r.ret != 0) {
          logger.error('OAuthQQ', JSON.stringify(r))
          throw RETCODE.OAuthFailed
        }
        return afterFetch(platform, openId, {
          nick: r.nickname,
          gender: r.gender == '男' ? '男' : '女',
          avatar: r.figureurl_qq_2
        })
      })
      break
    case 'wx':
      ps = {
        access_token: accessToken,
        openid: openId
      }
      return request.getAsync(`https://api.weixin.qq.com/sns/userinfo?${qs.stringify(ps)}`)
      .then(r => JSON.parse(r.body))
      .then(r => {
        if (r.errcode && r.errcode != 0) {
          logger.error('OAuthWX', JSON.stringify(r))
          throw RETCODE.OAuthFailed
        }
        return afterFetch(platform, r.openid, {
          nick: r.nickname,
          gender: r.sex == 1 ? '男' : '女',
          avatar: r.headimgurl
        })
      })
      break
  }
  return RETCODE.WrongParam
}))

router.all('/xsqToken', function (req, res) {
  var umengLogin = requirePR('libs/umengLogin')(config.umeng)
  if (req.user) {
    // TODO
    var ret = umengLogin(req.user)
      .then(r => {
        res.res = r
        return RETCODE.Success
      })
    res.ReturnJSON(ret)
  } else {
    res.ReturnJSON(RETCODE.NotLogin);
  }
})

router.all('/modify', function (req, res) {
  if (req.user) {
    delete req.uparam['password'] // 需要短信验证
    req.user.modify(req.uparam)
      .then(() => RETCODE.Success)
      .catch((e) =>{
        // (logger.error(e), RETCODE.WrongParam)
        logger.error(e);
        e = e.errors;
        res.res = {
          fields: e.map(i => i.path)
        };
        return RETCODE.WrongParam;
      })
      .then(res.ReturnJSON);
  } else {
    res.ReturnJSON(RETCODE.NotLogin);
  }
});

router.all('/upload', freqLimit, upload.single('avatar'), function (req, res) {
  var result;
  if (!req.file) {
    result = RETCODE.WrongParam;
  } else if (req.user) {
    if (req.user.get('avatar') != null) {
      fs.unlink(req.user.get('avatar'), () => {}); //ignore err
    }
    req.user.set('avatar',  uploadStorage.path + req.file.filename);
    res.res = {
      avatar: uploadStorage.path + req.file.filename
    }
    result = req.user.save()
      .then(r => RETCODE.Success);
  } else if (req.file) {
    result = fs.unlinkAsync(req.file.path)
      .then(r => RETCODE.NotLogin);
  } 
  res.ReturnJSON(result);
});

function promiseUserDetailInfo(user) {
  var u = user.json();
  return Promise.all([user.getCollege(), user.getAcademy()])
    .spread((college, academy) => {
      u.collegeName = college && college.get('name');
      u.academyName = academy && academy.get('name');
      return u;
    })
}

router.all('/infobyname', function (req, res) {
  let nickname = req.uparam.nickname
  let chain = models.User.findOne({
    where: {
      nickname: nickname
    }
  }).then(user => {
    if (user) {
      return promiseUserDetailInfo(user)
    } else {
      return {}
    }
  }).then(user => {
      res.res = user
      return RETCODE.Success
    })
  res.ReturnJSON(chain)
});

router.all('/info', function (req, res) {
  if (req.user) {
    res.ReturnJSON(promiseUserDetailInfo(req.user)
      .then(user => {
        res.res = user;
        return RETCODE.Success;
      }))
  } else {
    res.ReturnJSON(RETCODE.NotLogin);
  }
});

router.all('/login', freqLimit, function (req, res) {
  var username = req.uparam.un;
  var password = req.uparam.pw;
  var promiseChain = models.User.findOne({
    where: {
      username: username
    }
  }).then( (user) => {
    if (user === null) {
      throw RETCODE.UserNotFound;
    }
    if (!user.checkPassword(password)) {
      throw RETCODE.WrongPassword;
    }
    req.session.uid = user.id;
    // res.res = user.json();

    return promiseUserDetailInfo(user)
      .then(user => {
        res.res = user;
        return RETCODE.Success;
      })
    return RETCODE.Success;
  });
  res.ReturnJSON(promiseChain);
});

//router.all('/')

function genRandCode() {
  return /(\d{4})\./.exec(('000' + Math.random()*10000 + '.'))[1];
}
function getTime() {
  return (new Date()).getTime();
}
function isCodeOk(phone, code) {
  return kvCode.get(phone)
    .then((c) => {
      if (c == null || code !== c) {
        return false;
      } else {
        return true
      }
    })
}

router.all('/verifycode', freqLimit, function (req, res) {
  var code = req.uparam.code;
  var result;
  if (req.session.phone) {
    result = isCodeOk(req.session.phone, code)
      .then((ok) => {
        if (ok) {
          req.session.codeOk = req.session.phone;
        }
        res.res = {ok: ok};
        return RETCODE.Success;
      })
  } else {
    result = RETCODE.WrongParam
  }
  res.ReturnJSON(result);
})

router.all('/sendcode', freqLimit, function (req, res) {
  // 发送注册手机验证码
  var phone = req.uparam.phone;
  var result;
  if (!phoneRE.test(phone)) {
    result = RETCODE.WrongPhoneNumber;
  } else {
    var todayCount, lastSend;
    var now = getTime();
    var sendMsg = () => kvToday.get(phone, 0)
      .then(v => {
        todayCount = parseInt(v);
        if (todayCount >= 3) {
          throw RETCODE.TryTommorrow;
        }
        return kvLastSend.get(phone, 0);
      })
      .then(v => {
        lastSend = parseInt(v);
        if (now - lastSend < 60*1000) {
          throw RETCODE.TooFast;
        }
        return [todayCount, lastSend];
      })
      .spread((todayCount, lastSend) => {
        var code = genRandCode();
        logger.info(phone+' '+code);

        // smsParams.sms_param = JSON.stringify({code: code});
        let smsParams = {}
        Object.assign(smsParams, smsParamsTemplate)
        Object.assign(smsParams.sms_param, {code: code})
        smsParams.sms_param = JSON.stringify(smsParams.sms_param)
        smsParams.rec_num = phone;
        
        req.session.phone = phone;

        // TODO: 发送短信
        return kvCode.set(phone, code, 15, true)
          .then(() => kvToday.set(phone, todayCount + 1, 60*24)) //一天
          .then(() => kvLastSend.set(phone, now, 10))
          .then(() => {
          if (config.debug || (smsParams.rec_num == testPhone)) { // test phone
            logger.trace('SMSSend:', smsParams)
            return
          }
            topClient.execute('alibaba.aliqin.fc.sms.num.send', smsParams)
          })
          .then(() => RETCODE.Success)
      });
      var userExist = () => models.User.findOne({
        where: {
          username: phone
        }
      }).then(user => {
        if (user != null) {
          throw RETCODE.UserExist;
        }
      });
      result = userExist().then(sendMsg);
  }
  res.ReturnJSON(result);
});

function notNull(list) {
  for (let i of list) {
    if (i == null) {
      throw RETCODE.ObjectNotFound;
    }
  }
  return list;
}

router.all('/register', function (req, res) {
  var result = (({phone, phonecode, password, repeat, nick, gender, schoolId, academyId, schoolUn, schoolPw, enterYear, schoolMore}) => {
    var schoolInfo = {};
    var userExist = () => models.User.findOne({
      where: {
        username: phone
      }
    }).then(user => {
      if (user != null) {
        throw RETCODE.UserExist;
      }
    });

    var checkSchool = () => Promise.all([models.College.findById(schoolId), models.Academy.findById(academyId)])
      .then(notNull)
      .spread((school, academy) => school.hasAcademy(academy)
        .then(r => {
          if (r)
            return [school, academy];
          else
            throw RETCODE.WrongParam;
        })
      );

    var checkSchoolAccount = (school, academy) => {
      logger.info(`jwch ${school.get('name')} ${schoolUn} ${schoolPw}`)
      schoolInfo = {
        account: {
          sid: schoolUn,
          spw: schoolPw
        }
      }
      const schoolErr = [RETCODE.FailSchoolAccount[0], '学号格式不对']

      return [school, academy];

      var jwch = Colleges.findByName(school.get('name'));
      if (typeof jwch == 'undefined') {
        throw RETCODE.CollegeNotSupport;
      }
      return jwch.login(schoolUn, schoolPw, schoolMore)
        .then((r) => {
          schoolInfo = r;
          if (schoolInfo.needMore) {
            res.res = schoolInfo;
            throw RETCODE.SchoolNeedMoreInfo;
          }
          return [school, academy];
        }, err => {
          throw [RETCODE.FailSchoolAccount[0], err.message];
        })
    }

    var checkCode = () => {
      if (req.session.codeOk) {
        if (req.session.codeOk !== phone) {
          throw RETCODE.WrongParam;
        }
      } else {
        return isCodeOk(phone, phonecode)
          .then(r => {
            if (r == false) throw RETCODE.WrongCode;
          });
      }
    }

    var saveUser = (school, academy) => models.User.findOrCreate({
      where: {
        username: phone
      },
      defaults: {
        isAdmin: false,
        password: models.User.pwHash(password),
        nickname: nick,
        gender: gender,
        enterYear: enterYear,
        schoolInfo: JSON.stringify( schoolInfo ),
        phone: phone
      }
    })
    .spread((user, created) => {
      if (created == false) throw RETCODE.UserExist;
      user.setCollege(school);
      user.setAcademy(academy);
      req.session.codeOk = false
      req.session.uid = user.id;

      return promiseUserDetailInfo(user)
        .then(user => res.res = user)
        .then(() => user.save())
    });

    return userExist()
      .then(checkCode)
      .then(checkSchool)
      .spread(checkSchoolAccount)
      .spread(saveUser)
      .then(() => {
        return RETCODE.Success;
      });
  })(req.uparam);
  res.ReturnJSON(result);
});

router.all('/logout', function (req, res) {
  if (req.user) {
    req.session.uid = null;
    res.ReturnJSON(RETCODE.Success);
  } else {
    res.ReturnJSON(RETCODE.NotLogin);
  }
});

// SmsMiddleware: 注入sms参数, 需要短信验证: 重置密码
router.all('/resetpw', SMS.SmsMiddleware, wrapper(({username, sms, password}) => {
  return models.User.findOne({
    where: {
      username
    }
  }).then(user => {
    if (!user) {
      throw RETCODE.UserNotFound
    }
    if (sms.trusted() === username) { // 验证过短信直接改密码
      return user.modify({ // 重置密码
        password
      }).then(() => null)
    } else { // 否则发短信准备验证
      return sms.sendCode(username)
        .then(() => {
          throw RETCODE.NeedCode
        })
    }
  })

}))

module.exports = router;