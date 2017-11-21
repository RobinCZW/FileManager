<template>
  <div class="modal-mask" v-show="visible" transition="modal" v-on:click="onMaskClick">
    <div class="modal-wrapper">
      <div class="modal-container" v-on:click.stop="" :style="containerStyle">
        <slot></slot>
      </div>
    </div>
  </div>
</template>
<script>

export default {
  data: () => ({
  }),
  methods: {
    onMaskClick () {
      if (this.clickExit) {
        this.visible = false
      }
    }
  },
  props: {
    visible: {
      default: false,
      twoWay: true
    },
    width: {
      default: '50%'
    },
    height: {
      default: '50%'
    },
    clickExit: {
      default: true
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler (val) {
        if (val) {
          $('body').css('overflow-y', 'hidden');
        } else {
          $('body').css('overflow-y', 'auto')
        }
      }
    }
  },
  computed: {
    containerStyle () {
      return {
        width: this.width,
        height: this.height
      }
    }
  }
}
</script>

<style scoped>
.modal-mask {
  display: table;

  overflow-x: hidden;
  overflow-y: auto;

  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
/*  right: 0;
  bottom: 0;*/
  width: 100%;
  height: 100%;

  background-color: rgba(0, 0, 0, .5);
  transition: opacity .3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 470px;
  height: 240px;
  margin: 0px auto;
  padding: 20px 20px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
  transition: all .3s ease;
}

.modal-enter, .modal-leave {
  opacity: 0;
}

.modal-enter .modal-container {
  /*transform: translate3d(-8%, -200%, 0px) rotate(-10deg);*/
  transform: scale(2);
  opacity: 0;
}
.modal-leave .modal-container {
  /*-webkit-transform: translate3d(8%, -200%, 0px) rotate(10deg);*/
  /*transform: translate3d(8%, -200%, 0px) rotate(10deg);*/
  transform: scale(0.1);
  opacity: 0;
}
</style>