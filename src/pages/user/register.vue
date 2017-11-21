<template lang="pug">
div
  .alert.alert-success(v-show='success.length > 0', v-text='success')
  .alert.alert-warning(v-show='error.length > 0')
    span(v-text='error')
  .form-group
    label 手机号
    .input-group
      input.form-control(v-model='phone',type='text',placeholder='手机号')
      span.input-group-btn
        button.btn.btn-default(type='button',v-on:click='sendCode',v-bind:disabled='sendWait',v-text='sendText')
  .form-group
    label 手机验证码
    .input-group
      input.form-control(v-model='phonecode',type='text',placeholder='一天限发3次')
      span.input-group-btn
        button.btn.btn-default(type='button',v-on:click='checkCode',v-text='codeOk? "√": "验证"')
  .form-group(v-bind:class="{'has-error': wrongPassword}")
    label 密码
    input.form-control(v-model='password',type='password',placeholder='密码(长度需大于6)')
  .form-group(v-bind:class="{'has-error': wrongRepeat}")
    label 确认密码
    input.form-control(v-model='repeat',type='password',placeholder='输入与上面相同的密码')
  .form-group
    label 昵称
    input.form-control(v-model='nick',type='text',placeholder='昵称')
  .form-group
    label 性别
    div
      label.radio-inline(v-for="item in ['男','女']")
        input(type='radio',name='inlineRadioOptions',v-model='gender',v-bind:value='item')
        span(v-text='item')
  .form-group
    label 学校 (注意: 注册后不可修改!)
    school-picker(v-bind:school.sync='schoolId')
  .form-group(v-if='schoolId != -1')
    label 学院
    academy-picker(v-bind:school='schoolId', v-bind:academy.sync='academyId')
  .form-group(v-if='afterAcademy')
    label 教务处帐号 (为验证学生信息使用)
    input.form-control(v-model='schoolUn',type='text',placeholder='教务处帐号')
  .form-group(v-if='afterAcademy')
    label 教务处密码
    input.form-control(v-model='schoolPw',type='password',placeholder='教务处密码')
  .form-group(v-if='afterAcademy')
    label 入学年份
    select.form-control(v-model='enterYear')
      option(v-for='item of years', v-bind:value='item', v-text='item')
  div(v-if='needMore')
    label 登录教务处需要以下信息:
    fill-more(v-bind:prompt='prompt', v-ref:more)
  button.btn.btn-primary(type='button',v-on:click='register') 注册
  button.btn.btn-default(type='button',v-on:click='back') 返回
</template>
<script>
var g = require('global');
var services = require('services');
var serverYear = (new Date(g.data.time)).getFullYear();
var years = [];
for (let i=serverYear; i>serverYear-10; i--) {
  years.push(i.toString());
}
export default {
  components: {
    schoolPicker: require('components/input/schoolPicker'),
    academyPicker: require('components/input/academyPicker'),
    fillMore: require('./fillMore')
  },
  data () {
    return {
      sendText: '发送验证码',
      sendWait: false,
      codeOk: false,
      phone: '',
      phonecode: '',
      password: '',
      repeat: '',
      nick: '',
      gender: '男',
      schoolId: -1,
      academyId: -1,
      schoolUn: '',
      schoolPw: '',
      enterYear: 0,
      years: years,
      success: '',
      error: '',
      needMore: false,
      prompt: {}
    }
  },
  methods: {
    back () {
      this.$dispatch('back');
    },
    register () {
      var data = this.json();
      if (this.needMore) {
        var moreData = this.$refs.more.value;
        data.schoolMore = this.sendback;
        Object.keys(moreData).forEach(i => data.schoolMore[i] = moreData[i])
      }
      return services.user.register(data)
        .then((data) => {
          this.success = "注册成功";
          setTimeout(() => {
            g.refresh();
            this.$dispatch('back');
          }, 500);
        })
        .catch((err) => {
          if (err.code == 116) { //TODO: 改成常量
            this.needMore = true;
            this.prompt = err.res.prompt;
            this.sendback = err.res.sendback;
          } else if (err.code == 115) {
            this.needMore = false;
            this.error = err.message;
          } else {
            this.error = err.message;
          }
        });
    },
    sendCode () {
      return services.user.sendCode(this.phone)
        .then(() => {
          this.sendWait = true;
          var sec = 60;
          var iid = setInterval(() => {
            if (sec == 0) {
              clearInterval(iid);
              this.sendWait = false;
              this.sendText = '发送验证码';
              return;
            }
            this.sendText = '发送验证码(' + sec + ')';
            sec--;
          }, 1000)
        })
        .catch(err => this.error = err.message);
    },
    checkCode () {
      if (this.codeOk) {
        return;
      }
      return services.user.checkCode(this.phonecode)
        .then((r) => {
          this.codeOk = r.ok;
          if (!r.ok) {
            this.error = '手机验证码错误';
          }
        })
        .catch(err => this.error = err.message);
    },
    json () {
      return {
        phone: this.phone,
        phonecode: this.phonecode,
        password: this.password,
        repeat: this.repeat,
        nick: this.nick,
        gender: this.gender,
        schoolId: this.schoolId,
        academyId: this.academyId,
        schoolUn: this.schoolUn,
        schoolPw: this.schoolPw,
        enterYear: this.enterYear
      }
    }
  },
  computed: {
    wrongPassword () {
      return this.password.length > 0 && this.password.length < 6;
    },
    wrongRepeat () {
      return (this.repeat.length > 0) && (this.repeat != this.password);
    },
    afterAcademy () {
      return this.schoolId != -1 && this.academyId != -1
    }
  },
  watch: {
    error (v, oldV) {
      // TODO: 提升体验
      if (v.length > 0) {
        setTimeout(() => this.error = '', 3000);
      }
    }
  }
}
</script>