<template lang="pug">
.row
  .col-xs-12.gap(v-for='item in prompt')
    .form-inline
      .form-group
        label(v-text='item.desc')
        | 
        input.form-control(v-model='value[$key]',type='text',v-bind:placeholder='item.desc')
        | 
        img.img-responsive.inline-img(v-if='item.type=="image"',v-bind:src='getImage(item.data)')
</template>
<script>
export default {
  props: {
    prompt: {
      default: () => ({})
    }
  },
  methods: {
    getImage (b64) {
      return "data:image;base64," + b64;
    }
  },
  data: () => ({
    value: {}
  })
}
</script>
<style scoped>
  .inline-img {
    display: inline-block;
    width: auto;
    vertical-align: middle
  }
  .gap {
    margin-bottom: 10px;
  }
</style>