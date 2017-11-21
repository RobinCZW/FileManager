<template lang="pug">
  modal(v-bind:title='loginPage? "用户登录": "用户注册"',v-ref:modal)
    div(slot='footer')
    form(v-if='loginPage')
      .alert.alert-success(v-show='success.length > 0', v-text='success')
      .alert.alert-warning(v-show='error.length > 0')
        strong 登录失败 
        span(v-text='error')

      .form-group
        label(for='username') 手机号
        input#username.form-control(v-model='username',@keyup.enter='login',type='text',placeholder='手机号')
      .form-group
        label(for='password') 密码
        input#password.form-control(v-model='password',@keyup.enter='login',type='password',placeholder='密码')
      .form-group
        button.btn.btn-primary(type='button',v-on:click='login') 登录

        button.btn.btn-default(type='button',v-on:click='loginPage=false') 注册
    form(v-if='!loginPage')
      loading(v-ref:loading)
        register(v-ref:register,v-loading='loading')
</template>

<script>
var g = require('global');
var services = require('services');
var loading = require('utils/loading');
var defaultData = () => ({
  loginPage: true,
  username: '',
  password: '',
  error: '',
  success: ''
});
export default {
  components: {
    modal: require('utils/modal'),
    loading: loading,
    register: r => require(['./register.vue'], r)
  },
  data: defaultData,
  methods: {
    show () {
      this.$data = defaultData();
      return this.$refs.modal.show();
    },
    login () {
      return services.user.login({
        un: this.username,
        pw: this.password
      })
        .then((data) => {
          this.success = "登录成功";
          setTimeout(() => {
            g.refresh().then(this.$refs.modal.confirm);
          }, 500);
        })
        .catch((err) => {
          this.error = err.message;
        });
    }
  },
  events: {
    back () {
      this.loginPage = true;
    }
  }
};

</script>

<style scoped>
.btn {
  margin-right: 5px;
}
</style>