var express = require('express');
var router = express.Router();
const captcha = require('svg-captcha');
const { setCookie, renderCode, findFun, addFun, aesDecrypt, aesEncrypt, verifyUser, md5_fun } = require('../utils/base');
const { sendCode } = require('../utils/fetch');
const userModel = require('../model/userModel');
const { phone_aes_key, token_aes_key } = require('../utils/keys');
const cookie = require('cookie');


/* GET captcha */
router.get('/getCaptcha', function(req, res, next) {
  const cap = captcha.create({
    size: 4, // 验证码长度
    inverse: false,  // 翻转颜色   
    fontSize: 36,  // 字体大小 
    noise: 2, // 干扰线条数    
    width: 80, // 宽度  
    height: 30, // 高度
    ignoreChars: '0oO1ilI', // 验证码字符中排除 0o1i
    color: true, // 验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有
    background: '#eee' // 验证码图片背景颜色
  });
  // req.session = cap.text.toLowerCase(); // session 存储验证码
  setCookie('captcha', cap.text.toLowerCase(), 24*60*60, res);
  res.type('svg').status(200).send(cap.data); // 返回数据
});

// 获取短信验证码
router.post('/SMSCaptcha', function(req, res, next){
  const { phone_number } = req.body;
  const code = renderCode(6);
  sendCode(phone_number, code).then(body => {
    if(body.statusCode === '000000'){ // 发送信息成功
      setCookie('smsCode', code, 60, res);
      res.status(200).json({
        error_code: 'None',
        message: '发送信息成功'
      });
    } else {
      res.status(503).json({
        error_code: 'UNKNOW_ERROR',
        message: '发送信息失败，请重新发送～'
      });
      setCookie('smsCode', code, -1, res);
    }
  })
})

// 注册 { phone_number: string }
router.post('/regist', async function(req, res, next){
  const { phone_number } = req.body;
  const phone_key = aesEncrypt(phone_number, phone_aes_key);
  // 查询数据库中有无此手机号
  const arr = await findFun(userModel, { phone_key });
  if(arr.length > 0){ // 已存在
    res.status(400).json({
      error_code: 'USER_HAS_EXIST',
      message: '用户已存在'
    });
  } else { //新增
    const reg=/(\d{3})\d{4}(\d{4})/; //正则表达式
    const phone = phone_number.toString().replace(reg, "$1****$2"); // 手机号处理，防止返回手机号明文
    const defaultNicknameList = ['广东彭于晏', '江西吴彦祖', '上海胡歌', '台湾蔡徐坤', '北京古天乐', '湖南杨幂', '浙江汪东城'];// 默认生成用户名
    const data = {
      user_name: '',
      phone_key,
      phone_number: phone,
      password: '',
      create_time: Date.now(),
      user_avatar: 'https://static.persion.cn/images/others/dog.webp',
      nickname: defaultNicknameList[Math.ceil(Math.random() * 7) - 1]
    }
    const arr1 = await addFun(userModel, data);
    if(arr1.length > 0){
      res.status(200).json({
        error_code: 'NONE',
        message: '注册成功'
      });
    } else {
      res.status(500).json({
        error_code: 'UNKNOW_ERROR',
        message: '服务器未知错误，请稍后再试～'
      });
    }
  }
});

// 登录及注册
router.post('/login', async function(req, res, next){
  const { phone_number, password, code, type = 'pass', captcha } = req.body;
  const { cookie: cookies = '' } = req.headers;
  const { smsCode, captcha: cap } = cookie.parse(cookies);
  const ispass = type === 'pass'; // 密码登录(true) 验证码登录(false)
  const phone_key = aesEncrypt(phone_number, phone_aes_key); // 手机号加密
  let data;
  if(!ispass){
    // 检验短信验证码是否过期
    if(!smsCode){
      return res.status(400).json({
        error_code: 'CODE_HAS_GONE',
        message: '短信验证码已失效'
      });
    } else {
      // 校验短信验证码的正确性
      if(smsCode !== code.toLowerCase()){
        return res.status(400).json({
          error_code: 'CODE_ERROR',
          message: '短信验证码错误'
        });
      } else {
        data = { phone_key };
      }
    }
  } else {
    // 验证验证码正确性
    if(captcha !== cap){
      return res.status(400).json({
        error_code: 'CAPTCHA_ERROR',
        message: '验证码错误'
      });
    } else {
      data = { phone_key, password: md5_fun(password) };
    }
  }
  const arr = await findFun(userModel, data);
  const takeoutToken = aesEncrypt({phone_key}, token_aes_key)
  if(arr.length > 0){
    setCookie('takeoutToken', takeoutToken, 24*7*60*60, res, true);
    res.status(200).json({
      error_code: 'NONE',
      message: '登录成功',
      data: arr[0]
    });
  } else { // 未注册就直接注册
    const reg=/(\d{3})\d{4}(\d{4})/; //正则表达式
    const phone = phone_number.toString().replace(reg, "$1****$2"); // 手机号处理，防止返回手机号明文
    const defaultNicknameList = ['广东彭于晏', '江西吴彦祖', '上海胡歌', '台湾蔡徐坤', '北京古天乐', '湖南杨幂', '浙江汪东城'];// 默认生成用户名
    const data = {
      user_name: '',
      phone_key,
      phone_number: phone,
      password: '',
      create_time: Date.now(),
      user_avatar: 'https://static.persion.cn/images/others/dog.webp',
      nickname: defaultNicknameList[Math.ceil(Math.random() * 7) - 1]
    }
    const arr1 = await addFun(userModel, data);
    if(arr1.length > 0){
      setCookie('takeoutToken', takeoutToken, 24*7*60*60, res, true);
      res.status(200).json({
        error_code: 'NONE',
        message: '登录成功',
        data: arr1[0]
      });
    } else {
      res.status(500).json({
        error_code: 'UNKNOW_ERROR',
        message: '服务器未知错误，请稍后再试～'
      });
    }
  }
});

// 退出登录
router.post('/logout', async function(req, res, next){
  setCookie('takeoutToken', undefined, -1, res);
  res.status(200).json({
    error_code: 'NONE',
    message: '退出登录成功'
  })
})

// 获取用户信息
router.get('/getUserInfo', async function(req, res, next){
  const user = await verifyUser(req, res);
  !!user &&  res.status(200).json({
    error_code: 'NONE',
    message: '获取用户信息成功',
    data: user
  })
})

// 解密手机号
router.get('/aesDecryptPhone', async function(req, res, next){
  const user = await verifyUser(req, res);
  !!user && res.status(200).json({
    error_code: 'NONE',
    message: '解密手机号成功',
    phone_number: aesDecrypt(user.phone_key, phone_aes_key)
  })
})



module.exports = router;
