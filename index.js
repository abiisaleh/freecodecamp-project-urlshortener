require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dns = require('dns')
const urlparser = require('url')

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

  dns.lookup(urlparser.parse(url).hostname, async (err, addres) => {
    if (!addres) return res.json({error: "Invalid URL"})
    
    const countData = await UrlModel.countDocuments({});

    const newData = new UrlModel({
      original_url: url,
      short_url: countData + 1
    })
  
    UrlModel.findOne({original_url: url}, function(err, oldData) {
      if (oldData) {
        let {original_url, short_url} = oldData.toJSON();
        return res.json({original_url, short_url});
      }

      newData.save(function(err, data) {
        let {original_url, short_url} = data.toJSON();
        res.json({original_url, short_url});
      });
    })
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
