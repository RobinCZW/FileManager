<template lang="pug">
  template(v-if='$route.params.college == "select"')
    //h3 选择学校
    modal(title='选择学校', v-bind:visible='true', v-bind:closebtn='false')
      div(slot='footer')
      .input-group
        school-picker.input-group(v-bind:school.sync='schoolId')
        span.input-group-btn
          a.btn.btn-default(v-link='{name: "dbfs", params:{college: schoolId}}') 进入
  template(v-if='$route.params.college != "select"')
    simple-prompt(v-ref:sp)
    upload(v-ref:upload, v-bind:college='$route.params.college', v-bind:path='currentPath')
    iframe.hidden(v-bind:src='downloadUrl')
    ol.breadcrumb
      li(v-for='i in pathCrumb', v-bind:class='{active: i.isEnd}')
        span(v-if='i.isEnd', v-text='i.name')
        a.pointer(v-else, v-text='i.name', v-on:click='currentPath = i.fullPath')
    .btn-group
      button.btn.btn-default(type='button',v-on:click='upload') 上传文件
      button.btn.btn-default(type='button',v-on:click='mkdir') 新建文件夹
    .btn-group.pull-right
      button.btn.btn-default(type='button',v-on:click='refreshData')
        span.glyphicon.glyphicon-refresh
    table.table
      thead
        tr
          th 文件名
          th(style='width: 100px') 上传者
          //TODO: 改的优雅点
          th(style='width: 100px') 时间
          th(style='width: 100px') 大小
          th(style='width: 100px') 操作
        tbody
          tr.pointer(v-for='folder in folders', @click='currentPath += folder.name+"/"')
            td
              a.pointer
                span.glyphicon.glyphicon-folder-open
                |  {{ folder.name }}
            td(v-text='folder.nick')
            td(v-text='folder.ctime | time')
            td
            td
              a.pointer(@click.stop ='deleteFolder(folder)', :class='{hidden: !user.isAdmin}')
                span.glyphicon.glyphicon-remove(title="删除")
                span  删除 
          tr(v-for='file in files')
            td
              a.pointer(v-on:click='download(file.name)')
                span.glyphicon.glyphicon-file
                |  {{ file.name }}
            td(v-text='file.nick')
            td(v-text='file.ctime | time')
            td(v-text='showSize(file.size)')
            td
              a.pointer(@click.stop ='deleteFile(file)', :class='{hidden: !user.isAdmin}')
                span.glyphicon.glyphicon-remove(title="删除")
                span  删除 
    loading(v-ref:load)
</template>
<script>
var services = require('services');
export default {
  components: {
    modal: require('utils/modal'),
    schoolPicker: require('components/input/schoolPicker'),
    loading: require('utils/loading'),
    'simple-prompt': require('utils/simple-prompt'),
    upload: require('./dbfs/upload')
  },
  filters: {
    time (ts) {
      let date = new Date(ts)
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    }
  },
  methods: {
    deleteFile (file) {
      console.log(file)
      if (confirm(`确定要删除 ${file.name}${(file.nick ? '上传者:' + file.nick : '')} ?`)) {
        services.dbfs.deleteFile(this.params.college, this.currentPath + file.name).then(() => this.refreshData())
      }
    },
    deleteFolder (folder) {
      console.log(folder)
      if (confirm(`确定要删除 ${folder.name}${(folder.nick ? '上传者:' + folder.nick : '')} ?`)) {
        services.dbfs.deleteFolder(this.params.college, this.currentPath + folder.name + '/').then(() => this.refreshData())
      }
    },
    download (name) {
      this.downloadUrl = services.dbfs.getDownloadUrl(this.params.college, this.currentPath+name)
    },
    upload () {
      return this.$refs.upload.show();
    },
    mkdir () {
      return this.$refs.sp.ask('文件夹名')
        .then( (name) => services.dbfs.addFolder(this.params.college, this.currentPath+name+'/') )
        .then( this.refreshData )
        .catch(() => {});
    },
    goUp () {
      this.currentPath = '/'+this.currentPath.split('/').filter(i => i.length>0).slice(0,-1).join('/');
    },
    refreshData () {
      this.files = [];
      this.folders = [];
      let detail = this.currentPath === '/' ? '0' : '1'
      if (this.user.isAdmin) {
        detail = '1'
      }
      var chain = services.dbfs.list(this.params.college, this.currentPath, detail)
        .then((r) => {
          this.files = r.files;
          this.folders = r.folders;
        })
        .catch(err => {
          console.log(err);
          this.goUp();
        })
      return this.$refs.load.promise(chain);
    },
    showSize (size) {
      if (size < 1024 * 1024) { // 1M
        return Math.ceil(size/1024) + ' KB';
      } else if (size < 1024 * 1024 * 1024) { //1G
        return Math.ceil(size/1024/1024) + ' MB'
      } else {
        return Math.ceil(size/1024/1024/1024) + ' GB';
      }
    }
  },
  data () {
    return {
      schoolId: -1,
      currentPath: '/',
      files: [],
      folders: [],
      params: {},
      downloadUrl: ''
    }
  },
  ready () {
    this.params = this.$route.params;
    this.currentPath = this.params.path.replace(/^root/,'');
    document.title = '文件管理';

    this.refreshData();
  },
  computed: {
    user () {
      return g.user
    },
    pathCrumb () {
      var fp = '/';
      var ret = this.currentPath.split('/')
        .filter(i => i.length > 0)
        .map(i => ({
          name: i,
          isEnd: false,
          fullPath: fp += i + '/'
        }));
      ret.unshift({
        name: '根目录',
        fullPath: '/',
        isEnd: false
      })
      ret[ret.length-1].isEnd = true;
      return ret;
    }
  },
  watch: {
    currentPath () {
      this.params.path = 'root'+this.currentPath;
      this.$router.go({
        name: 'dbfs',
        params: this.params
      })
      this.refreshData();
    }
  },
  events: {
    refresh () {
      this.refreshData();
    }
  }
}
</script>