<template lang="pug">
.panel.panel-default
  .panel-heading
    | {{item.name+' '}}
    a(:href='"tel:"+item.phone') {{item.phone}}
  .panel-body
    div
      strong {{item.addr}}
    div {{state}}
    .sep
    // div(v-for='line in this.item.detail') {{line}}
    table.table.table-striped.table-condensed
      thead
        tr
          th 商品编号
          th 商品名
          th 个数
      tbody
        tr(v-for='i in item.detail')
          td {{i.id}}
          td {{i.title}}
          td {{i.count}}
    .sep
    div 总计: {{(item.totalPrice / 100).toFixed(2)}} 元
    <slot>
</template>
<script>
const stateDict = {
  'Paying': '正在支付',
  'Shipping': '等待配送',
  'Success': '交易成功',
  'Closed': '交易关闭'
}
export default {
  props: ['item'],
  computed: {
    state () {
      return stateDict[this.item.state]
    }
  }
}
</script>
<style lang="less" scoped>
.sep {
  &:before {
    content: " ";
  }
  height: 1em;
}
</style>