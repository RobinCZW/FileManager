<template lang="pug">
loading(v-ref:loading)
  select.form-control(v-model='academy', v-loading='loading')
    option(v-for='item of academies', v-bind:value='item.id', v-text='item.name')
</template>
<script>
var services = require('services');
export default {
  components: {
    loading: require('utils/loading')
  },
  ready () {
    return this.refreshData();
  },
  data: () => ({
    academies: [],
  }),
  methods: {
    refreshData () {
      if (this.school < 0) return;
      var loading = this.$refs.loading;
      
      var chain = services.school.listAcademy(this.school)
        .then((r) => {
          this.academies = r;
        });
      return loading.promise(chain);
    }
  },
  props: {
    school: {
      type: Number,
      required: true
    },
    academy: {
      type: Number,
      required: true,
      twoWay: true
    }
  },
  watch: {
    'school': 'refreshData',
    academies (value) {
      try {
        this.academy = value[0].id;
      } catch (e) {}
    }
  }
}
</script>