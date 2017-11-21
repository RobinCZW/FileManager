<template lang="pug">
.btn-group
  button.btn.btn-default(type='button', @click='addGood') 添加
  button.btn.btn-default(type='button',v-if='closed',v-on:click='open') 开始营业
  button.btn.btn-default(type='button',v-if='!closed',v-on:click='close') 停止营业
table.table
  thead
    tr
      th ID
      th 标题
      th 价格(RMB)
      th 图片
      th 操作
  tbody
    tr(v-for='item in items | orderBy "id" -1')
      td(v-text='item.id')
      td(v-text='item.title')
      td(v-text='item.price / 100')
      td(v-text='item.image')
      td
        a.pointer(@click='delGood(item)')
          span.glyphicon.glyphicon-remove(title="删除")
          span  删除 
modal(title='添加商品',v-ref:modaladd)
  good-new(v-ref:prompt)
</template>
<script>
const services = require('services')
export default {
  components: {
    'good-new': require('./good/good-new'),
    'modal': require('utils/modal'),
  },
  data () {
    return {
      items: [],
      closed: false
    }
  },
  methods: {
    close () {
      return services.good.setClosed(true)
        .then(() => this.refreshData())
    },
    open () {
      return services.good.setClosed(false)
        .then(() => this.refreshData())
    },
    addGood () {
      const modal = this.$refs.modaladd;
      modal.btnConfirm = "添加";
      modal.show()
        .then((confirmed) => {
          if (confirmed) {
            services.good.add(this.$refs.prompt.getData())
              .then(this.refreshData)
              .then(() => this.$refs.prompt.reset())
              .catch(err => {
                this.$refs.prompt.error = err.message;
                modal.show();
              })
          }
        });
    },
    delGood (item) {
      return services.good.del(item.id)
        .then(this.refreshData)
    },
    refreshData () {
      return services.good.list2().then( data => {
        this.items = data.list
        this.closed = data.closed
      })
    }
  },
  ready () {
    document.title = '商品管理'
    this.refreshData()
  }
}
</script>