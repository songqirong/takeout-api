var express = require('express');
var router = express.Router();
const CateGoryModel = require('../model/categoryModel');
const { addFun, findFun } = require('../utils/base.js');
const { getSearchShops } = require('../utils/fetch');

/* 获取分类菜单 */
router.get('/categories', async function(req, res, next) {
  const arr = await findFun(CateGoryModel, {});
  res.status(200).json({
    error_code: 'NONE',
    message: '获取成功',
    data: arr
  })
});

/*
根据经纬度获取商铺列表 假数据
 */
router.get('/shops', function (req, res) {
  const latitude = req.query.latitude
  const longitude = req.query.longitude

  setTimeout(function () {
    const data = require('../data/shops.json')
    res.status(200).json({
      err_code: 'NONE',
      message: '获取店铺成功',
      data,
    })
  }, 300)
})

/* 搜索栏数据 */

router.get('/search/shops', async function (req, res) {
  const { lat: latitude, lng: longitude, keyword } = req.query;
  const params = { geohash: latitude+','+longitude, keyword };
  const res1 = await getSearchShops(params);
  res.status(200).json({
    error_code: 'NONE',
    message: '获取成功',
    data: res1.status === 0 ? [] : res1
  })
})



module.exports = router;