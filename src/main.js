var Vue = require('vue');
var VueRouter = require('vue-router');
var VueResource = require('vue-resource');
var App = require('./app.vue');
var g = require('./global');
import directives from './directives'

Vue.use(VueRouter);
Vue.use(VueResource);

Object.keys(directives).forEach((key) => Vue.directive(key, directives[key]));

var routerMap = {
  '/': {
    component: resolve => require(['pages/home'], resolve),
    name: 'home',
    desc: '首页'
  },
  '/uploadprint': {
    component: resolve => require(['pages/uploadprint'], resolve),
    name: 'uploadprint',
    desc: '打印订单'
  },
  '/school': {
    component: resolve => require(['pages/school'], resolve),
    name: 'school',
    desc: '学校'
  },
  '/dbfs/:college/*path': {
    component: resolve => require(['pages/dbfs'], resolve),
    name: 'dbfs',
    desc: '文件'
  },
  '/ad': {
    component: resolve => require(['pages/ad'], resolve),
    name: 'ad',
    desc: '广告'
  },
  '/user': {
  	component: resolve => require(['pages/user'], resolve),
  	name: 'user',
  	desc: '用户'
  },
  '/review': {
    component: resolve => require(['pages/review'], resolve),
    name: 'review',
    desc: '审核'
  },
  '/good': {
    component: resolve => require(['pages/good'], resolve),
    name: 'good',
    desc: '商品'
  },
  '/order': {
    component: resolve => require(['pages/order'], resolve),
    name: 'order',
    desc: '订单'
  }
};
var nav = Object.keys(routerMap).map(key => ({
  desc: routerMap[key].desc,
  name: routerMap[key].name,
  url: key
})).filter(i => i.name != 'user');


var router = new VueRouter();
router.map(routerMap);
router.beforeEach(({ to, next, redirect }) => {
  if (to.path == '/dbfs/:college/:path') {
    if (g.data.user && g.data.user.CollegeId) {
      redirect('/dbfs/'+g.data.user.CollegeId.toString()+'/root/');
    } else {
      redirect('/dbfs/select/root/');
    }
  } else {
    next();
  }
});
router.afterEach((transition) => {
  router.app.$broadcast('routerAfterEach', transition);
})
g.nav = nav;
router.start(App, '#app');

//g.context = router.app;
//router.app.setNav(nav);