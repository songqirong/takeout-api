const crypto = require('crypto');
const cookie  = require('cookie');
const { iv, token_aes_key } = require('./keys');
const UserModel = require('../model/userModel');

// 加密密码
function md5_fun(password){
  return crypto.createHash('md5').update(password).digest('hex')
}

// aes算法（对称加密算法）加密 当前用来加密手机号, token,
function aesEncrypt(data, key) {
  data = JSON.stringify(data);
  const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
  var crypted = cipher.update(data, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

// aes算法解密 当前用来解密手机号, token
function aesDecrypt(encrypted, key) {
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  var decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

// token过期
function verifyToken(req, res){
  const { cookie: cookies = '' } = req.headers;
  const { takeoutToken } = cookie.parse(cookies);
  if(!takeoutToken){
    res.status(401).json({
      error_code: 'TOKEN_INVALID',
      message: '登录信息已过期'
    })
    return false;
  } else {
    return aesDecrypt(takeoutToken, token_aes_key); // token = { _id }
  }
}

// 校验token并查找当前登录信息
const verifyUser = async(req, res) => {
  const user = verifyToken(req, res); //解析token
  if(!user) return false;
  const arr = await findFun(UserModel, user);
  if(arr.length > 0){
    return arr[0]
  } else {
    res.status(401).json({
      error_code: 'USER_NOT_EXIST',
      message: '此用户不存在'
    })
    return false;
  }
}

// 查找
function findFun(model, rule){
  return new Promise((resolve, reject) => {
    model.find(rule).then(arr => {
      resolve(arr)
    })
  })
}

// 新增
function addFun(model, obj){
  return new Promise((resolve, reject) => {
    model.insertMany([ obj ]).then((arr) => {
      resolve(arr)
    })
  })
}

// 更新
function updateFun(model, rule, obj){
  return new Promise((resolve, reject) => {
    model.updateOne(rule, { $set: obj }).then((arr) => {
      resolve(arr)
    })
  })
}

// 更新多条数据
function updateManyFun(model, rule, obj){
  return new Promise((resolve, reject) => {
    model.updateMany(rule, { $set: obj }).then((arr) => {
      resolve(arr)
    })
  })
}

// 删除
function deleteFun(model, rule){
  return new Promise((resolve, reject) => {
    model.deleteOne(rule).then((arr) => {
      resolve(arr)
    })
  })
}

// 设置cookie
function setCookie(key, val, exe, res, bol = false){
  res.setHeader('Set-Cookie', cookie.serialize(key, val, {
    httpOnly: bol,
    maxAge: exe,
    // domain: 'persion.cn',
    sameSite: 'None',
    secure: true,
    path: '/'
  }));
}

// 生成手机验证码
function renderCode(length){
  let str = '';
  for(let i = 0; i < length; i++){
    str += Math.floor(Math.random() * 10);
  }
  return str;
}




module.exports = {
  md5_fun,
  aesEncrypt,
  aesDecrypt,
  verifyToken,
  verifyUser,
  findFun,
  addFun,
  updateFun,
  updateManyFun,
  deleteFun,
  setCookie,
  renderCode
}