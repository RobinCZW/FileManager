var Vue = require('vue');
var VueResource = require('vue-resource');
Vue.use(VueResource);

function getRoot(ctx) {
  if (ctx.$parent) return getRoot(ctx.$parent)
  return ctx
}
function refreshComponents(comp) {
  if (typeof comp.reload == 'function') {
    console.log('reload', comp);
    comp.reload();
  } else {
    comp.$children.forEach(refreshComponents);
  }
}

module.exports = new Vue({
  data: {
    data: {},
    context: null,
    nav: {}
  },
  created () {
    this.data = g;
  },
  methods: {
    refresh () {
      return this.$http.post('/api/user/info')
        .then((response) => {
          let body = response.body
          if (typeof body === 'string') {
            body = JSON.parse(body)
          }
          if (body.code !== 0) {
            body = null
          } else {
            body = body.res
          }
          this.data = {
            user: body
          }
        })
        .then(this.reloadAll)
    },
    reloadAll() {
      this.context && this.context.$broadcast('reload')
      // var root = getRoot(this.context);
      // if (root != null) {
      //   refreshComponents(root);
      // }
    }
  },
});
