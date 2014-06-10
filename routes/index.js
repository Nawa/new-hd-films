var express = require('express');
var config =require('../config');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: config.title });
});

module.exports = router;
