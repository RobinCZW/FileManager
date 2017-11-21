<template>
  <div class="modal-mask" v-show="visible" transition="modal">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" aria-label="Close" @click="close()" v-show="closebtn">&times;</button>
          <h4 class="modal-title" v-text="title"></h4>
        </div>
        <div class="modal-body">
          <slot>
            default body
          </slot>
        </div>
        <slot name="footer">
          <div class="modal-footer">
              <button type="button" class="btn btn-primary"
                v-if="btnConfirm.length>0"
                v-text="btnConfirm"
                @click="confirm()">
              </button>
              <button type="button" class="btn btn-default"
                v-text="btnClose"
                @click="close()">
              </button>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>
<script>

export default {
  data: () => ({
    btnConfirm: '',
    btnClose: '关闭',
    //visible: false,
    //onClose: () => false,
    resolve: () => {},
    reject : () => {}
  }),
  methods: {
    confirm() {
      this.visible = false;
      this.resolve(true);
      //this.onClose(true)
    },
    close() {
      this.visible = false;
      this.resolve(false);
      //this.onClose(false)
    },
    show() {
      this.visible = true;
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    }
  },
  props: {
    'title': {
      required: true
    },
    'visible': {
      default: false
    },
    'closebtn': {
      default: true
    }
  },
  watch: {
    visible () {
      if (this.visible) {
        $('body').css('overflow', 'hidden');
      } else {
        $('body').css('overflow', 'auto')
      }
    }
  }
}
</script>

<style scoped>
.modal-mask {
  display: block;

  overflow-x: hidden;
  overflow-y: auto;

  position: fixed;
  z-index: 9998;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  background-color: rgba(0, 0, 0, .5);
  transition: opacity .3s ease;
}

.modal-enter, .modal-leave {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}
</style>