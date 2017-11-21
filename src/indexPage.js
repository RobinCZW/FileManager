import 'babel-polyfill'
var Vue = require('vue');
var VueRouter = require('vue-router');
var VueResource = require('vue-resource');
var g = require('./global');
import directives from './directives'

document.addEventListener( "dragleave", function(e) {
     e.preventDefault();
}, false);
document.addEventListener( "drop", function(e) {
     e.preventDefault();
}, false);
document.addEventListener( "dragenter", function(e) {
     e.preventDefault();
}, false);
document.addEventListener( "dragover", function(e) {
     e.preventDefault();
}, false);

Vue.use(VueResource);

var indexPage = new Vue(require('./indexPage.vue'));
indexPage.$mount('#app')