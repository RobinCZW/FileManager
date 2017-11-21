<template lang="pug">
.home-button
  .home-btn-icon(:style='{backgroundImage: "url("+src+")"}')
  .home-btn-text
    slot
</template>
<style lang="less" scoped>
.home-button {
  display: inline-flex;
  margin-right: 1%;
  height: 18%;
  width: 20%;
  border: 1px solid #fff;
  border-radius: .4em;
  clear: both;
  margin-top: 3%;
  padding: 1% 0;
  box-sizing: border-box;
  cursor: pointer;
  transition: background-color .3s cubic-bezier(.19,1,.22,1);
  &:hover {
    background-color: hsla(0,0%,100%,.07);
  }
  .home-btn-text {
    height: 100%;
    position: relative;
    padding-left: 8%;
    font-size: 2vw;
    line-height: 3vw;
  }
  .home-btn-icon {
    display: block;
    background-repeat: no-repeat;
    background-position: 50%;
    border-right: 1px solid #fff;
    width: 28%;
  }
}
</style>
<script>
export default {
  props: {
    src: String
  }
}
</script>