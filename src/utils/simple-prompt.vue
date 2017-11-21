<template lang="pug">
modal(v-bind:title='title', v-ref:modal)
  .form-group
    label(v-text='desc')
    input.form-control(v-if='rows==1',type='text',v-bind:placeholder='placeholderDesc',v-model='value')
    textarea.form-control(v-if='rows>1',v-bind:rows='rows',v-model='value')
</template>
<script>
export default {
  components: {
    modal: require('./modal')
  },
  data: () => ({
    type: 'text',
    value: '',
    desc: '',
    placeholderDesc: '',
    title: '请输入',
    rows: 1
  }),
  methods: {
    ask (desc, def, {placeholder} = {}) {
      this.desc = desc;
      if (def === undefined) {
        def = ''
      }
      if (placeholder) {
        this.placeholderDesc = placeholder
      }
      this.value = def;
      var modal = this.$refs.modal;
      modal.btnConfirm = '确定';
      modal.btnClose = '取消';
      return modal.show()
        .then((c) => (this.rows = 1, c))
        .then((confirmed) => {
          if (confirmed) {
            return this.value;
          } else {
            throw new Error('User canceled');
          }
        });
    }
  }
};
</script>