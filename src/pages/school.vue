<template lang="pug">
  simple-prompt(v-ref:sp)

  div(v-show='isSchool')
    .btn-group
      button.btn.btn-default(type='button',v-on:click='addSchool') 添加
    table.table
      thead
        tr
          th 学校名称
          th 操作
      tbody
        tr(v-for='item in schools')
          td(v-text='item.name')
          td
            a.pointer(v-link="{name: 'dbfs', params: {college: item.id, path: 'root/'}}")
              span.glyphicon.glyphicon-folder-open(title="文件管理")
              span  文件 
            a.pointer
              span.glyphicon.glyphicon-edit(title="改名")
              span  改名 
            a.pointer(v-on:click='switchAcademy(item)')
              span.glyphicon.glyphicon-education(title="学院")
              span  学院 
            a.pointer.hidden
              span.glyphicon.glyphicon-remove(title="删除")
              span  删除 
  div(v-show='!isSchool')
    .btn-group
      button.btn.btn-default(type='button',v-on:click='switchSchool') 返回
      button.btn.btn-default(type='button',v-on:click='addAcademy') 添加
      button.btn.btn-default(type='button',v-on:click='addAcademies') 批量添加
    table.table
      thead
        tr
          th 学院名
          th 操作
      tbody
        tr(v-for='item in academies')
          td(v-text='item.name')
          td
            a.pointer
              span.glyphicon.glyphicon-edit(title="改名")
              span  改名 
            a.pointer
              span.glyphicon.glyphicon-remove(title="删除")
              span  删除 
</template>
<script>
var services = require('services');
export default {
  components: {
    'simple-prompt': require('utils/simple-prompt'),
  },
  data: () =>({
    schools: [],
    academies: [],
    isSchool: true,
    schoolId: 0
  }),
  methods: {
    switchSchool () {
      this.isSchool = true;
      this.refreshData();
    },
    switchAcademy (item) {
      this.isSchool = false;
      this.schoolId = item.id;
      this.refreshData();
    },
    refreshData () {
      if (this.isSchool) {
        return services.school.list()
          .then( r => {
            this.schools = r;
          });
      } else {
        return services.school.listAcademy(this.schoolId)
          .then( r=> {
            this.academies = r;
          });
      }
    },
    addSchool () {
      this.$refs.sp.ask('学校名称')
        .then(services.school.add)
        .then(this.refreshData)
        .catch(() => {});
    },
    addAcademy() {
      this.$refs.sp.ask('学院名')
        .then(name => services.school.addAcademy(this.schoolId, name))
        .then(this.refreshData)
        .catch(() => {});
    },
    addAcademies() {
      var sp = this.$refs.sp;
      sp.rows = 10;
      sp.ask('学院列表, 一行一个')
        .then((text) => {
          sp.rows = 1;
          var list = text.split('\n');
          list = list.filter(i => i.length > 0);

          return services.school.addAcademies(this.schoolId, list);
        })
        .then(this.refreshData)
        .catch(() => {})
    }
  },
  ready () {
    document.title = '学校管理';
    this.refreshData();
  },
  computed: {
  },
  events: {
    reload () {
      this.refreshData();
    }
  }
}
</script>
