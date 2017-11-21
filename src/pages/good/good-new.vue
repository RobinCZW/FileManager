<template lang="pug">
  .alert.alert-warning(v-text='error',v-if='error.length > 0')
  .form-group
    label 标题
    input.form-control(type='text', v-model='title',placeholder='标题')
    label 价格
    input.form-control(type='text', v-model='price',placeholder='价格')
    label 图片
    input.form-control(type='text', v-model='image',placeholder='图片')
</template>
<script>
export default {
  data: () => ({
    title: '',
    price: 0,
    image: '',
    error: ''
  }),
  methods: {
    reset () {
      this.title = this.price = this.image = this.error = ''
    },
    getData () {
      return {
        title: this.title,
        price: this.price * 100,
        image: this.image
      }
    }
  }
};
</script>