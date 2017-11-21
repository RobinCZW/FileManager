<template lang="pug">
nav.navbar.navbar-default.navbar-fixed-top
  .container-fluid
    .navbar-header
      button.navbar-toggle.collapsed(
        type='button'
        data-toggle='collapse'
        data-target='#navbar-collapse'
        aria-expanded='false')
        span.sr-only Toggle navigation
        span.icon-bar
        span.icon-bar
        span.icon-bar
      a.navbar-brand(href='/') 期末考啦
    #navbar-collapse.collapse.navbar-collapse
      ul.nav.navbar-nav(v-for='item in nav')
          li(v-bind:class='{active: curName == item.name }')
            a(v-link='{name: item.name}',v-text='item.desc',v-on:click='curItem = item')
      ul.nav.navbar-nav.navbar-right
        template(v-if='user')
          li.dropdown
            a.dropdown-toggle(href='#',data-toggle='dropdown',role='button',aria-haspopup='true',aria-expanded='false')
              span(v-text='user.nickname')
              span.caret
            ul.dropdown-menu
              li
                a.pointer(v-on:click='logout') 退出
        template(v-else)
          user-login(v-ref:userlogin)
          li
            a.pointer(v-on:click='login') 登录
</template>
<script>
var g = require('global');
var services = require('services');
export default {
  components: {
    'user-login': (r) => require(['./user/login.vue'], r)
  },
  data () {
    return {
      nav: [],
      curName: 'home'
    }
  },
  methods: {
    isActiveUrl (item) {
        return this.getRootPath(location.hash) == item.url;
    },
    getRootPath (url) {
        try {
            // return /\/[^\/]+/.exec(location.pathname)[0];
            return /\/[^\/]*/.exec(url)[0];
        } catch(e) {
            return '/';
        }
    },
    login () {
      this.$refs.userlogin.show();
    },
    logout () {
      services.user.logout().then(g.refresh, g.refresh);
    }
  },
  computed: {
    user: () => g.data.user
  },
  events: {
    routerAfterEach ({to}) {
      //console.log('after', transition)
      if (to.name) {
        this.curName = to.name;
      } else {
        for (let i of this.nav) {
          if (this.getRootPath(i.url) == this.getRootPath(to.path)) {
            this.curName = i.name;
            return;
          }
        }
      }
    }
  }
};
</script>
<style>

</style>
