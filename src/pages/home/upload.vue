<template lang="pug">
.upload(draggable='true', @dragstart.prevent='', @dragover.prevent='', @drop.prevent='onDrop')
  .tips 当前位置: {{cutPath}} (可拖拽文件快速上传)
  input(type='file', multiple='multiple', @change.stop.prevent='onChange')
  span.glyphicon.glyphicon-remove.close(@click='onClose')
  div
    table.table(style='table-layout:fixed;')
      thead
        tr
          th 文件名
          th(style='width: 50%;') 进度
      tbody
        tr(v-for='file in files')
          td.name
            span(v-text='file.name')
          td.state
            span(v-text="stateText(file)")
            .progress
              .progress-bar(v-bind:style='{width: parseInt(file.percent * 100) + "%"}')
</template>
<style lang="less">
.upload {
  position: relative;
  height: 360px;
  overflow: auto;
  .tips {
    margin-bottom: 5px;
  }
  .close {
    position: absolute;
    right: 0;
    top: 0;
  }
}
</style>
<script>
import ClientUpload from 'utils/clientUpload'
export default {
  props: {
    school: {
      required: true
    },
    path: {
      required: true
    }
  },
  data () {
    return {
      client: {
        files: []
      }
    }
  },
  computed: {
    cutPath () {
      return this.path.substr(1)
    },
    files () {
      return this.client.files
    },
    stateText () {
      return this.client.stateText
    }
  },
  methods: {
    onDrop (e) {
      console.log('drop', e.dataTransfer.files)
      return this.client.onChange(e.dataTransfer.files)
    },
    onChange (e) {
      return this.client.onChange(e.target.files)
    },
    onClose () {
      this.$emit('close')
    }
  },
  ready () {
    this.client = ClientUpload(this.school, this.path)
    console.log('upload component ready', this.school, this.path)
  },
  watch: {
    files () {
      this.$el.scrollTop=100000
    }
  }
}
</script>