<template lang="pug">
  nav
    ul.pagination
      li(:class='{disabled: leftDisable}', @click='left')
        a.pointer
          span &laquo;
      li(v-for='i in range', :class='{active: i == page}', @click='page = i')
        a.pointer {{i}}
      li(:class='{disabled: rightDisable}', @click='right')
        a.pointer
          span &raquo;
</template>
<script>
export default {
  props: {
    page: {
      twoWay: true
    },
    pageCount: Number
  },
  methods: {
    left () {
      if (this.leftDisable) return
      this.page -= 1
    },
    right () {
      if (this.rightDisable) return
      this.page += 1
    }
  },
  computed: {
    range () {
      let ret = []
      for (let i = this.page - 3; i <= this.page + 3; i++) {
        if (i >= 1 && i <= this.pageCount) {
          ret.push(i)
        }
      }
      return ret
    },
    leftDisable () {
      return this.page == 1
    },
    rightDisable () {
      return this.page == this.pageCount
    }
  }
}
</script>
<style scoped>
.pointer {
  cursor: pointer;
}
</style>
