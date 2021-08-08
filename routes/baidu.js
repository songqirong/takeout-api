var express = require('express');
var router = express.Router();
const { conversion, parsing } = require('../utils/fetch');

/* 转换坐标 */
router.get('/conversionPosition', async function(req, res, next){
  const res1 = await conversion(req.query);
  if(res1.status === 0){
    res.status(200).json({
      error_code: 'NONE',
      message: '转换成功',
      data: res1.result[0]
    })
  } else {
    res.status(500).json({
      error_code: 'INTERFACE_ERROR',
      message: '接口错误'
    })
  }
});

/* 解析地址 */
router.get('/parsingPosition', async function(req, res, next){
  const res1 = await parsing(req.query);
  if(res1.status === 0){
    res.status(200).json({
      error_code: 'NONE',
      message: '解析成功',
      data: res1.result
    })
  } else {
    res.status(500).json({
      error_code: 'INTERFACE_ERROR',
      message: '接口错误'
    })
  }
})

module.exports = router;