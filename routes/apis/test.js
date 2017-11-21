var express = require('express');
var router = express.Router();
router.all('/', function (req, res) {
  res.send(req.getClientSessionId() + ' ' + req.sessionID)
})
module.exports = router;