/**
 * Covid 19 sample
 */

require('dotenv').config();
require('date-utils');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const pref = require('./pref.json');

// main
exports.covidreport = (req, res) => {
  console.log('-- Covid Report --');

  // check by clientSecret's hash
  const auth = bcrypt.compareSync(
    process.env.SPALO_CLIENT_SECRET,
    req.body.secretHash
  );

  if (auth !== true) {
    console.log('Client Secret Error');
    return res.status(401).send('Unauthorized').end();
  }

  // check body
  const itemName = req.body.item_name; // 検索キーワード
  const data = req.body.data; // 選択値
  console.log('item_name', itemName);
  console.log('data', data);

  // 都道府県検索
  if (itemName === '都道府県') {
    res.send(pref.items).end();
  }
  //　感染者検索
  else if (itemName === '感染者') {
    const pref = data[0].value;
    const now_value = data[1].value;
    const now = new Date(now_value + ' 9:00');
    const now_fmt = new Date(now).toFormat('YYYYMMDD');
    console.log('指定日付:', now);
    console.log('指定日付F:', now_fmt);
    const ytd = new Date(now.setDate(now.getDate() - 1));
    const ytd_fmt = new Date(ytd).toFormat('YYYYMMDD');
    console.log('指定前日:', ytd);
    console.log('指定前日F:', ytd_fmt);

    kansensya(pref, now_fmt).then((now_person) => {
      kansensya(pref, ytd_fmt).then((ytd_person) => {
        const person = String(now_person - ytd_person);
        console.log('指定日累計:', now_person);
        console.log('指定日前日累計:', ytd_person);
        console.log('指定日感染者:', person);
        res.send([person]).end();
      });
    });
  }
  // 累計数検索
  else if (itemName === '累計数') {
    const pref = data[0].value;
    const now_value = data[1].value;
    //const now = new Date(now_value + ' 09:00');
    const now = new Date(now_value);
    const now_fmt = new Date(now).toFormat('YYYYMMDD');

    kansensya(pref, now_fmt).then((now_person) => {
      const person = String(now_person);
      res.send([person]).end();
    });
  }
  // エラー
  else {
    res.send([]).end();
  }
};

// 日別都道府県別感染者数
const kansensya = async (pref, day) => {
  const result = await axios({
    method: 'get',
    url: 'https://opendata.corona.go.jp/api/Covid19JapanAll',
    params: {
      date: day,
      dataName: pref,
    },
  })
    .then((response) => {
      const item = response.data.itemList[0];
      return item.npatients;
    })
    .catch((error) => {
      return 'Error';
    });

  return result;
};
