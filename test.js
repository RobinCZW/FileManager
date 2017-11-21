var colleges = require('./libs/colleges');
var fs = require('fs');
// var child_process = require('child_process');
// var fzu = colleges.findById("fzu");
// fzu.login('221400304', '513069906').then(ret => {
//   console.log(ret);
// });

// var fafu = colleges.findById("fafu");
// fafu.login('3136309003', 'L243216!!').then(ret => {
//   console.log(ret);
//   fs.writeFileSync('test.gif', new Buffer(ret.prompt.code.data, 'base64'));

//   fafu.login('3136309003', 'L243216!!', {sessionId: ret.sendback.sessionId, code: '1234'})
//     .then(obj => {
//       console.log(obj);
//     })
// });

var fjut = colleges.findById("fjut");
fjut.login('3141301223', '111111++').then(ret => {
  console.log(ret);
  fs.writeFileSync('test.gif', new Buffer(ret.prompt.code.data, 'base64'));

  fjut.login('3141301223', '111111++', {sessionId: ret.sendback.sessionId, code: '1234'})
    .then(obj => {
      console.log(obj);
    })
});
// var config = require('./config/config')
// var umengLogin = require('./libs/umengLogin')(config.umeng)
// umengLogin({
//   get () {
//     return '1111'
//   }
// })