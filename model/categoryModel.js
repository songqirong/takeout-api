const mongoose = require('mongoose');
const { model, Schema } = mongoose;
module.exports = model('categories', Schema({
  cate_zh: String, // 中文名
  cate_en: String, // 英文名
  image_url: String, // 图片地址
  create_time: Number, // 注册时间
}))