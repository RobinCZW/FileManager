<template lang="pug">
.btn-group
  button.btn.btn-default(type='button',v-on:click='addAD') 添加
  button.btn.btn-default(type='button',v-on:click='versionInfo') 版本信息
  button.btn.btn-default(type='button',v-if='enabled',v-on:click='disable') 禁用
  button.btn.btn-default(type='button',v-if='!enabled',v-on:click='enable') 启用
table.table
  thead
    tr
      th ID
      th 备注
      th 图片
      th URL
      th 备用URL
  tbody
    tr(v-for='item in items | orderBy "id" -1')
      td(v-text='item.id')
      td(v-text='item.remark')
      td(v-text='item.pic')
      td(v-text='item.url')
      td(v-text='item.fallback')
modal(title='添加广告',v-ref:modalad)
  ad-new(v-ref:prompt)
modal(title='更新版本',v-ref:modalversion)
  version(v-bind:versions.sync="versions")
</template>
<script>
var Vue = require('vue');
var services = require('services');

var promptVM = Vue.extend();

export default {
  components: {
    'ad-new': require('./ad/ad-new'),
    'modal': require('utils/modal'),
    "version": require('./ad/version')
  },
  data: () => ({
    items: [],
    enabled: false,
    versions: {
      androidVer: 0,
      androidUrl: '',
      iosVer: 0
    }
  }),
  methods: {
    enable: function() {
      return services.ad.enable().then(this.refreshData);
    },
    disable: function(){
      return services.ad.disable().then(this.refreshData);
    },
    versionInfo: function () {
      var modal = this.$refs.modalversion;
      var backup = {};
      Object.assign(backup, this.versions);

      modal.btnConfirm = "确定";
      modal.show()
        .then((confirmed) => {
          if (confirmed) {
            services.ad.setVersion(this.versions)
              .then(this.refreshData)
          } else {
            Object.assign(this.versions, backup)
          }
        })
    },
    addAD: function () {
      var modal = this.$refs.modalad;
      modal.btnConfirm = "添加";
      modal.show()
        .then((confirmed) => {
          if (confirmed) {
            //console.log(this.$refs.prompt.$data)
            //window.dbg=this.$refs.prompt.$data
            //return;
            services.ad.add(this.$refs.prompt.$data)
              .then(this.refreshData)
              .catch(err => {
                this.$refs.prompt.error = err.message;
                modal.show();
              })
          }
        });
      // modalVM.title = '添加广告';
      // modalVM.body = 'ad-prompt';
      // modalVM.isText = false;
      // modalVM.hasConfirmBtn = true;
      // modalVM.open((prompt) => {
      // }, (confirmed) => {
      //   if (confirmed) {
      //     services.ad.add(modalVM.getBody().$data)
      //       .then(this.refreshData)
      //       .catch(err => {
      //         setTimeout(() => {
      //           modalVM.title = "添加失败";
      //           modalVM.body = err;
      //           modalVM.hasConfirmBtn = false;
      //           modalVM.open();
      //         }, 500);
      //       })
      //   }
      // });
      //return services.ad.create()
    },
    refreshData: function () {
      return services.ad.list().then( data => {
        this.$data = data;
      });
    }
  },
  ready: function () {
    document.title = '广告管理';
    this.refreshData();
  },
  events: {
    reload () {
      this.refreshData();
    }
  }
}
</script>