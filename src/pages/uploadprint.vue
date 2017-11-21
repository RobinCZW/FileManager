<template lang="pug">
  .upload-print
    loading(v-ref:load)
    div(v-if='auth == false')
      .form-group
        label
          | 密码
          input.form-control(v-model='token', type='password', placeholder='商户密码')
      button.btn(type='button', @click='login') 登录
    div(v-if='list.length > 0')
      button.btn(@click='refreshData') 刷新
      div(v-for='day in dayList')
        span {{day.date}}订单:
        table.table.table-striped
          thead
            tr
              th #
              th 文件
              th 地址
              th 电话
              th 备注
              th 下单时间
              th 状态
          tbody
            tr(v-for='item in day.items')
              td(v-text='item.id')
              td.download(v-text='item.filename', @click='download(item)')
              td(v-text='item.addr')
              td(v-text='item.phone')
              td(v-text='item.comment')
              td(v-text='orderTime(item)')
              td
                input(type='checkbox', v-model='item.arrived', @change='setArrived(item)')
                | 已送达
        .sep
      pagination(:page.sync='page', :page-count='pageCount')
</template>

<script>
const services = require('services')
const loading = require('utils/loading')
export default {
  data () {
    return {
      token: '',
      auth: false,
      page: 1,
      list: [],
      total: 1,
      pageSize: 1
    }
  },
  ready () {
    this.token = window.localStorage.getItem('uploadPrintPassword') || ''
    this.refreshData()
  },
  methods: {
    download (item) {
      window.open(services.uploadPrint.downloadUrl(this.token, item.id))
    },
    login () {
      return this.fetch()
    },
    orderTime (item) {
      let date = new Date(item.createdAt)
      let min = date.getMinutes().toString()
      if (min.length == 1) min = '0' + min
      return `${date.getHours()}:${min}`
    },
    fetch () {
      let chain = services.uploadPrint.list(this.token, this.page)
        .then(res => {
          window.localStorage.setItem('uploadPrintPassword', this.token)
          this.list = res.items
          this.total = res.total
          this.pageSize = res.pageSize
          this.auth = true
        })
        .catch(e => {
          this.token = ''
          this.auth = false
        })
      this.$refs.load.promise(chain)
      return chain
    },
    refreshData () {
      this.page = 1
      return this.fetch()
    },
    setArrived (item) {
      if (item.arrived === true) {
        if (confirm(`确认送达 ${item.addr} 的订单?`)) {
          return services.uploadPrint.setArrived(this.token, item.id, item.arrived)
        } else {
          item.arrived = false
        }
      } else {
        item.arrived = true
      }
    }
  },
  watch: {
    page () {
      return this.fetch()
    }
  },
  computed: {
    dayList () {
      let days = []
      let list = this.list.map(i => {
        const d = new Date(i.createdAt)
        i.timestamp = d.getTime()
        i.orderDate = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`
        if (days.length === 0 || days[days.length - 1] !== i.orderDate) {
          days.push(i.orderDate)
        }
        return i
      })
      return days.map(date => ({
        date,
        items: list.filter(i => i.orderDate === date)
      }))
    },
    pageCount () {
      return Math.ceil(this.total / this.pageSize)
    }
  },
  components: {
    loading: require('utils/loading'),
    pagination: require('components/pagination')
  }
}
</script>

<style lang="less" scoped>
.upload-print {
  .sep {
    height: 1px;
    background-color: #bbb;
    margin-bottom: 10px;
  }
  .download {
    cursor: pointer;
    color: #337ab7;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
