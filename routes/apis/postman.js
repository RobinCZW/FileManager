const POSTMAN = 'OrderPostMan'
const kvdb = requirePR('libs/kvdb')

module.exports = {
  get () {
    return kvdb.config.get(POSTMAN, '[]').then(i => JSON.parse(i))
  },
  add (id) {
    id = parseInt(id)
    return kvdb.config.get(POSTMAN, '[]')
      .then(i => JSON.parse(i))
      .then(list => {
        list.push(id)
        return kvdb.config.set(POSTMAN, JSON.stringify(list))
      })
  },
  remove (id) {
    id = parseInt(id)
    return kvdb.config.get(POSTMAN, '[]')
      .then(i => JSON.parse(i))
      .then(list => {
        list.push(id)
        const idx = list.indexOf(id)
        list.splice(idx, 1)
        return kvdb.config.set(POSTMAN, JSON.stringify(list))
      })
  }
}
