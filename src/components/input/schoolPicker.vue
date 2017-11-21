<template lang="pug">
select.form-control(v-model='school')
  option(v-for='item of schools', v-bind:value='item.id', v-text='item.name')
</template>
<script>
var services = require('services');
export default {
  ready () {
    return this.refreshData();
  },
  data: () => ({
    schools: []
  }),
  methods: {
    refreshData () {
      return services.school.list()
        .then((r) => {
          this.schools = r;
        });
    }
  },
  props: {
    school: {
      type: Number,
      twoWay: true,
      required: true
    }
  },
  watch: {
    schools (value) {
      try {
        this.school = value[0].id
        this.$emit('schoolname', this.schools.filter(i => i.id === this.school)[0].name)
      } catch (e) {}
    },
    school (value) {
      try {
        this.$emit('schoolname', this.schools.filter(i => i.id === this.school)[0].name)
      } catch (e) {}
    }
  }
}
</script>