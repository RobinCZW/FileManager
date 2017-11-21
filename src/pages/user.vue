<template lang="pug">
form#loginForm
.form-group
  label(for='username') 用户名
  input#username.form-control(v-model='username',@keyup.enter='login',type='text',placeholder='用户名')
.form-group
  label(for='password') 密码
  input#password.form-control(v-model='password',@keyup.enter='login',type='password',placeholder='密码')
button.btn.btn-primary(type='button',v-on:click='login') 登录
</template>
<script>
export default {
  data: () => ({
    username: '',
    password: ''
  }),
  methods: {
    login: function () {
      this.$http.post('/api/user/login', {
        un: this.username,
        pw: this.password
      })
      .then(function (data) {
        data = data.data;
        console.log(data);
        if (data.code !== 0) {
          modalVM.title = "登录失败";
          modalVM.body = data.info;
        } else {
          modalVM.title = "登录成功";
          modalVM.body = "1秒后回到主页";
          setTimeout(function () {
            location.href = '/';
          }, 1000);
        }
        modalVM.open();
      }, function (err) {
        modalVM.title = "登录失败";
        modalVM.body = err;
        modalVM.open();
      });
    }
  }
}
</script>