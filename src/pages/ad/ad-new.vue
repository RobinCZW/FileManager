<template lang="pug">
  .alert.alert-warning(v-text='error',v-if='error.length > 0')
  .form-group
    label 备注
    input.form-control(type='text', v-model='remark',placeholder='备注')
    label 图片
    //input.form-control(type='text', v-model='pic',placeholder='图片')
    input(type='file', v-on:change.stop.prevent='setFile')
    label URL
    input.form-control(type='text', v-model='url',placeholder='URL')
    label 备用URL
    input.form-control(type='text', v-model='fallback',placeholder='备用URL')
</template>
<script>
export default {
  data: () => ({
    remark: '',
    pic: '',
    url: '',
    fallback: '',
    error: ''
  }),
  methods: {
    setFile (e) {
      var f = e.target.files;
      if (f.length > 0) {
        this.pic = f[0]
      } else {
        this.pic = null
      }
    }
  }
};
</script>