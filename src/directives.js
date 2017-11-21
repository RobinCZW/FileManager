export default {
  'loading': {
    bind () {
      this.vm.$refs[this.expression].loading = false;
    }
  }
}