require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let UrlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    require: true
  },
  short_url: {
    type: Number
  }
});

let UrlModel = mongoose.model("Url", UrlSchema);

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/shorturl/:id', function(req, res) {
  const id = req.params.id;  

  UrlModel.findOne({short_url: id}, function(err, data) {
    if (err) return console.log(err)
    return res.redirect(data['original_url'])
  })
});

app.post('/api/shorturl', function(req, res) {
  const url = req.body.url;

  function isUrl(s) {
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(s);
  }

  if (!isUrl(url)) return res.json({ error: 'invalid url' });

  UrlModel.countDocuments({}, function (err, countData) {
    if (err) return console.log(err);

    const newData = new UrlModel({
      original_url: url,
      short_url: countData + 1
    })

    UrlModel.findOne({original_url: url}, function(err, oldData) {
      if (err) return console.log(err)

      if (oldData) {
        let {original_url, short_url} = oldData.toJSON();
        return res.json({original_url, short_url});
      }

      newData.save(function(err, data) {
        if (err) return console.log(err)
        let {original_url, short_url} = data.toJSON();
        res.json({original_url, short_url});
      });
    })
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
