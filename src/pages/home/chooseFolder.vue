<template lang="pug">
.home-choose
  simple-prompt(v-ref:prompt)
  .login(v-if='!isLogin')
    .title 用户登录
    .body
      p 登录后上传资料将显示您是分享者
      input.form-control(type='text', placeholder='手机号', v-model='username')
      input.form-control(type='password', placeholder='密码', v-model='password')
      button.btn.btn-primary(@click='login(false)') 登录 
      hr
      p 匿名登录将显示为匿名同学上传
      button.btn.btn-primary(@click='login(true)') 匿名登录
  .choose(v-if='isLogin', v-show='!uploading')
    .header(v-show='isCourse')
      .pull-left
        span 选择学校
      .pull-right
        span 你好, {{user.nickname}} 
        span.link(@click='logout') 退出登录
      .clearfix
      school-picker.school(:school.sync='schoolId', @schoolname='schoolName=$arguments[0]')
    .body
      .input-group(v-if='isCourse')
        span.input-group-addon
          span.glyphicon.glyphicon-search
        input.form-control(type='text', placeholder='搜索课程', v-model='searchText')
      div(v-if='!isCourse')
        ol.breadcrumb
          li(v-for='i in pathCrumb', v-bind:class='{active: i.isEnd}')
            span(v-if='i.isEnd', v-text='i.name')
            a.pointer(v-else, v-text='i.name', @click='curPath = i.fullPath')
        .btn-group
          button.btn.btn-default(@click='goUpload') 上传文件
          button.btn.btn-default(@click='newFolder') 新建文件夹
      .scroll-box
        loading(v-ref:load)
        file-item(v-for='item in uniList', :name='item.name', :size='item.size', :is-folder='item.isFolder', @click='enter(item)')
        .no-file(v-if='uniList.length === 0 && !loading')
      // .create(v-if='isCourse', @click='newFolder') 找不到资料所属课程? 点击创建新课程
      button.btn.btn-primary.create(v-if='isCourse', @click='newFolder') 找不到资料所属课程? 点击创建新课程
  .uploading(v-if='uploading')
    upload(:school='schoolId', :path='curPath', @close='onUploadClose')
</template>
<style lang="less" scoped>
.pointer {
  cursor: pointer;
}
.home-choose {
  color: black;
  width: 100%;
  height: 100%;
  overflow: hidden;
  .login {
    width: 50%;
    height: 50%;
    margin: 0 auto;
    .title {
      text-align: center;
      font-size: 24px;
      height: 35px;
      margin-bottom: 15px;
    }
    .body {
      height: 200px;
      &>input, &>button {
        margin-bottom: 20px;
      }
      &>button {
        display: block;
        width: 100%;
      }
    }
  }
  .choose {
    position: relative;
    height: 100%;
    .header {
      margin-bottom: 20px;
      .school {
        margin-top: 5px;
      }
      .link {
        cursor: pointer;
      }
    }
    .create {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 5px;
      text-align: center;
      cursor: pointer;
      width: 100%;
      margin-top: 10px;
      // &:hover {
      //   text-decoration:underline
      // }
    }
    .body {
      height: 100%;
      .folder-list {
        height: 100%;
      }
      .scroll-box {
        height: 100%;
        overflow: auto;
        padding-bottom: 160px;
      }
      .no-file {
        background-image: url(~assets/file/nofiles.png);
        background-repeat: no-repeat;
        background-position: center;
        height: 200px;
        margin-top: 100px;
      }
    }
  }
  @media (max-width: 768px) {
    .login {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
<script>
import g from 'global'
import services from 'services'
import FileItem from './file-item'
import Upload from './upload.vue'
import SimplePrompt from 'utils/simple-prompt'
import Loading from 'utils/loading'
import SchoolPicker from 'components/input/schoolPicker'
import AcademyPicker from 'components/input/academyPicker'
function intersect (a, b) {
  let nVal = []
  a.forEach(i => {
    if (b.indexOf(i) !== -1) {
      nVal.push(i)
    }
  })
  return nVal
}

window.services = services
export default {
  data () {
    return {
      schoolId: 1,
      schoolName: '',
      curPath: '/',
      username: '',
      password: '',
      searchText: '',
      folders: [],
      files: [],
      loading: false,
      uploading: false
    }
  },
  components: {
    SimplePrompt,
    FileItem,
    SchoolPicker,
    AcademyPicker,
    Loading,
    Upload
  },
  computed: {
    uniList () {
      if (this.isCourse) {
        return this.search()
      }
      return this.folders.concat(this.files)
    },
    pathCrumb () {
      var fp = '/';
      var ret = this.curPath.split('/')
        .filter(i => i.length > 0)
        .map(i => ({
          name: i,
          isEnd: false,
          fullPath: fp += i + '/'
        }));
      ret.unshift({
        name: this.schoolName,
        fullPath: '/',
        isEnd: false
      })
      ret[ret.length-1].isEnd = true;
      return ret;
    },
    isCourse () {
      return this.curPath === '/'
    },
    user () {
      return g.data.user
    },
    size () {
      const login = {
        width: 300,
        height: 370
      }
      let choose = {
        width: 800,
        height: 800
      }
      const upload = {
        width: 600,
        height: 400
      }
      if (this.isCourse) {
        choose.height += 30
      }
      if (this.isLogin) {
        if (this.uploading) {
          return upload
        } else {
          return choose
        }
      } else {
        return login
      }
    },
    isLogin () {
      return !!this.user
    }
  },
  ready () {
  },
  methods: {
    onUploadClose () {
      this.refresh()
      this.uploading = false
    },
    goUpload () {
      this.uploading = true
    },
    search () {
      if (this.searchText === '') {
        return this.folders
      } else {
        let list = this.folders
        let searchText = this.searchText.toLowerCase()
        let names = list.map(i => i.name.toLowerCase())
        let searchChar = char => {
          return i => (i.indexOf(char) !== -1)
        }
        let sub = names.filter(searchChar(searchText[0]))
        for (let i = 1; i < searchText.length; i++) {
          sub = intersect(sub, names.filter(searchChar(searchText[i])))
        }
        return list.filter(i => sub.includes(i.name.toLowerCase()))
      }
    },
    enter (item) {
      if (item.isFolder) {
        this.curPath += item.name + '/'
      }
    },
    newFolder () {
      let itemName = this.isCourse ? '课程名(课程名请尽量与教务系统一致, 尽量不使用简称)' : '文件夹名'
      let folderName = ''
      return this.$refs.prompt.ask('请输入'+itemName, '', {
        placeholder: ''
      }).then(r => folderName = r)
        .then(() => services.dbfs.addFolder(this.schoolId, this.curPath + folderName + '/'))
        // .then(this.refresh)
        .then(() => this.enter({
          isFolder: true,
          name: folderName
        }))
        .catch(e => {})
    },
    login (a) {
      if (a) {
        return services.user.login({
          un: 'anonymous',
          pw: 'anonymous'
        }).then(g.refresh).then(this.refresh)
      } else {
        return services.user.login({
          un: this.username,
          pw: this.password
        }).then(g.refresh).then(this.refresh)
      }
    },
    logout () {
      return services.user.logout().then(g.refresh)
    },
    refresh () {
      if (!this.isLogin) return
      this.files = []
      this.folders = []
      this.loading = true
      let chain = services.dbfs.list(this.schoolId, this.curPath)
        .then(r => {
          this.files = r.files.map(i => (i.isFolder = false, i))
          this.folders = r.folders.map(i => (i.isFolder = true, i))
          this.loading = false
        })
      if (this.$refs.load) {
        return this.$refs.load.promise(chain)
      } else {
        return chain
      }      
    }
  },
  watch: {
    size: {
      immediate: true,
      handler () {
        this.$emit('size', this.size)
      }
    },
    schoolId: {
      immediate: true,
      handler () {
        return this.refresh()
      }
    },
    curPath () {
      return this.refresh()
    }
  }
}
</script>