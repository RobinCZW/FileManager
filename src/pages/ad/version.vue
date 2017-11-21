<template lang="pug">
  form
    .form-group
      label 安卓版本
      input.form-control(v-model='versions.androidVer')
    .form-group
      label 安卓下载URL
      input.form-control(v-model='versions.androidUrl')
    .form-group
      label iOS版本
      input.form-control(v-model='versions.iosVer')
</template>
<script>
export default {
  data: () => ({
    
  }),
  props: {
    versions: {
      required: true,
      twoWay: true,
      default: () => ({
        androidVer: 0,
        androidUrl: '',
        iosVer: 0
      })
    }
  }
};
</script>