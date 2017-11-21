var Vue = require('vue');
var VueResource = require('vue-resource');
Vue.use(VueResource);

const apiAdmin = '/api/admin';
const apiRoot = '/api';

function ajaxFile(url, data, pcb) {
  pcb = pcb || (() => 0);
  var formData = new FormData();
  Object.keys(data).forEach((key) => formData.append(key, data[key]));
  return $.ajax({
    url: url,
    type: "POST",
    data: formData,
    xhr: () => {
      var myXhr = $.ajaxSettings.xhr();
      if(myXhr.upload){
        myXhr.upload.addEventListener('progress', (e) => pcb(e.loaded, e.total), false);
      }
      return myXhr;
    },
    contentType: false,
    processData: false
  }).then(r => ({
    data: r
  }));
  
}

var services = new Vue({
  data: {
    utils: {
      delay (i) {
        return function () {
          return new Promise((res, rej) => setTimeout(() => res.apply(null, arguments), i));
        }
      }
    },
    review: {
      list () {
        return services.$http.post(apiAdmin+'/review/list')
          .then(apiRC)
      }
    },
    dbfs: {
      deleteFile (school, path) {
        return services.$http.post(apiRoot+`/dbfs/${school}/delete${path}`)
          .then(apiRC)
      },
      deleteFolder (school, path) {
        return services.$http.post(apiRoot+`/dbfs/${school}/deleteFolder${path}`)
          .then(apiRC)
      },
      getDownloadUrl (school, path) {
        return apiRoot+`/dbfs/${school}/download?path=`+encodeURI(path);
      },
      hashExist (school, hash) {
        return services.$http.post(apiRoot+`/dbfs/${school}/hashExist`, {hash: hash})
          .then(apiRC);
      },
      list (school, path, detail = '0') {
        return services.$http.post(apiRoot+`/dbfs/${school}/list`, {path: path, detail: detail})
          .then(apiRC);
      },
      addFolder(school, path) {
        return services.$http.post(apiRoot+`/dbfs/${school}/newFolder`, {path: path})
          .then(apiRC);
      },
      link (school, path, hash) {
        return services.$http.post(apiRoot+`/dbfs/${school}/link`, {path: path, hash: hash})
          .then(apiRC);
      },
      upload (school, data, pcb) {
        return ajaxFile(apiRoot+`/dbfs/${school}/upload`, data, pcb)
          .then(apiRC);
          //.then(r => console.log(r));
      }
    },
    user: {
      login (data) {
        return services.$http.post(apiRoot+'/user/login', data)
          .then(apiRC);
      },
      logout () {
        return services.$http.post(apiRoot+'/user/logout')
          .then(apiRC);
      },
      sendCode (phone) {
        return services.$http.post(apiRoot+'/user/sendcode', {phone: phone})
          .then(apiRC)
      },
      checkCode (code) {
        return services.$http.post(apiRoot+'/user/verifycode', {code: code})
          .then(apiRC)
      },
      register (data) {
        return services.$http.post(apiRoot+'/user/register', data)
          .then(apiRC)
      }
    },
    ad: {
      list () {
        return services.$http.post(apiAdmin+'/ad/list')
          .then(apiRC);
      },
      add (data) {
        // return services.$http.post(apiAdmin+'/ad/add', data)
        return ajaxFile(apiAdmin+'/ad/add', data)
          .then(apiRC);
      },
      enable () {
        return services.$http.post(apiAdmin+'/ad/enable')
          .then(apiRC);
      },
      disable () {
        return services.$http.post(apiAdmin+'/ad/disable')
          .then(apiRC);
      },
      setVersion (data) {
        return services.$http.post(apiAdmin+'/ad/setVersion', data)
          .then(apiRC);
      }
    },
    school: {
      list () {
        return services.$http.post(apiRoot+'/school/list')
          .then(apiRC);
      },
      add (name) {
        return services.$http.post(apiAdmin+'/school/add', {name: name})
          .then(apiRC);
      },
      addCourse (college, name) {
        return services.$http.post(apiAdmin+'/school/addCourse', {college: college, name: name})
          .then(apiRC);
      },
      listCourse (college) {
        return services.$http.post(apiRoot+'/school/listCourse', {college: college})
          .then(apiRC);
      },
      addAcademy (college, name) {
        return services.$http.post(apiAdmin+'/school/addAcademy', {college: college, name: name})
          .then(apiRC);
      },
      addAcademies (college, names) {
        return services.$http.post(apiAdmin+'/school/addAcademies', {college: college, names: names})
          .then(apiRC);
      },
      listAcademy (college) {
        return services.$http.post(apiRoot+'/school/listAcademy', {college: college})
          .then(apiRC);
      }
    },
    good: {
      setClosed (closed) {
        return services.$http.post(apiAdmin+'/good/setClosed', {closed})
      },
      list () {
        return services.$http.post(apiRoot+'/good/list').
          then(apiRC);
      },
      list2 () {
        return services.$http.post(apiRoot+'/good/list2').
          then(apiRC);
      },
      add (data) {
        return services.$http.post(apiAdmin+'/good/add', data)
          .then(apiRC);
      },
      del (id) {
        return services.$http.post(apiAdmin+'/good/del', {id})
          .then(apiRC);
      }
    },
    order: {
      listAll (page = 1, onlyShipping = false) {
        return services.$http.post(apiRoot+'/order/listAll', {page, onlyShipping})
          .then(apiRC);
      },
      markSuccess (uuid) {
        return services.$http.post(apiRoot+'/order/markSuccess', {uuid})
          .then(apiRC);
      }
    },
    uploadPrint: {
      submit (data, pcb = () => null) {
        return ajaxFile(apiRoot+'/uploadprint/submit', data, pcb)
          .then(apiRC);
      },
      list (token, page = 1) {
        return services.$http.post(apiRoot+'/uploadprint/list', {token, page})
          .then(apiRC);
      },
      setArrived (token, id, arrived) {
        return services.$http.post(apiRoot+'/uploadprint/setArrived', {token, id, arrived})
          .then(apiRC);
      },
      downloadUrl (token, id) {
        return `${apiRoot}/uploadprint/download/${id}?token=${token}`
      }
    }
  }
});

function apiRC(r) {
  //make return code to error(reject)
  r = r.data;
  if (r.code !== 0) {
    var err = new Error(r.info);
    err.code = r.code;
    err.res = r.res;
    throw err;
  } else {
    return r.res;
  }
}

module.exports = services;

