<template lang="pug">
  .container
    navbar(v-ref:navbar)
    <router-view></router-view>
</template>

<script>
  // require(['./a','./b'], function(a, b) 
var g = require('global');
var navbar = require('pages/navbar');
export default {
  components: {
    navbar
  },
  methods: {
    setNav (nav) {
      this.$refs.navbar.nav = nav;
    }
  },
  ready () {
    this.setNav(g.nav);
    g.context = this;
  }
}
</script>

<style>
body {
  padding-top: 70px;
  font-family:"Microsoft YaHei",Arial,Helvetica,sans-serif,"simsun";
}
.pointer {
  cursor:pointer;
}
.line {
    padding: 0 20px 0;
    margin: 20px 0;
    line-height: 1px;
    border-left: 200px solid #ddd;
    border-right: 200px solid #ddd;
    text-align: center;
}
</style>
