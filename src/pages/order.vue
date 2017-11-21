<template lang="pug">
  .panel.panel-default
    .panel-body
      .btn-group
        button.btn.btn-default(type='button', @click='openPostman', v-if='user && user.isAdmin') 管理配送员
        button.btn.btn-default(type='button', v-if='onlyShipping == false', @click='onlyShipping = true') 只显示等待配送
        button.btn.btn-default(type='button', v-if='onlyShipping', @click='onlyShipping = false') 显示全部订单
        button.btn.btn-default(type='button', @click='refresh') 刷新

  order-item(v-for='item in items', :item='item')
    button.btn.btn-success(type='button', v-if='item.state=="Shipping"', @click='markSuccess(item)') 确认送达
    button.btn.btn-danger(type='button', v-if='false && item.state=="Paying"') 关闭交易
  pagination(:page.sync='curPage', :page-count='pageCount')
  modal(title='管理配送员',v-ref:modaladd)
    //good-new(v-ref:prompt)
</template>
<script>
const services = require('services')
const g = require('global')
const stateDict = {
  'Paying': '正在支付',
  'Shipping': '等待配送',
  'Success': '交易成功',
  'Closed': '交易关闭'
}
export default {
  components: {
    'modal': require('utils/modal'),
    'order-item': require('components/orderItem'),
    'pagination': require('components/pagination')
  },
  data () {
    return {
      items: [],
      total: 0,
      pageSize: 10,
      onlyShipping: true,
      curPage: 1
    }
  },
  watch: {
    curPage () {
      this.refreshData()
    },
    onlyShipping () {
      this.refreshData()
    }
  },
  computed: {
    pageCount () {
      return Math.ceil(this.total / this.pageSize)
    },
    user: () => g.data.user
  },
  methods: {
    refresh () {
      this.items = []
      return this.refreshData()
    },
    refreshData () {
      return services.order.listAll(this.curPage, this.onlyShipping).then( data => {
        this.items = data.items
        this.total = data.total
        this.pageSize = data.pageSize
      })
    },
    stateText (ori) {
      return stateDict[ori]
    },
    orderDetail (detail) {
      return detail.map(i => `${i.title}[${i.id}] x${i.count}`)
    },
    openPostman () {

    },
    markSuccess (item) {
      if (!confirm(`确认送达 ${item.name} ${item.addr} 的订单?`)) return
      return services.order.markSuccess(item.uuid)
        .then(() => this.refreshData())
    }
  },
  ready () {
    document.title = '订单管理'
    this.refreshData()
  }
}
</script>