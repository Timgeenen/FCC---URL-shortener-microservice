require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const mongoose = require('mongoose');
const { url } = require('inspector');
const { error } = require('console');

mongoose.connect(process.env.DB_URI);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true,
    unique: true
  },
  short_url: {
    type: Number,
    required: true,
    unique: true
  }
});

let Url = mongoose.model('url', urlSchema);

// Your first API endpoint
app.get('/api/shorturl/:index', async (req, res) => {
  let { index } = req.params;
  let find_url = await Url.findOne({short_url: index});
  //if no match in database
  if ( ! find_url ) {
    res.json({error: 'no matching url found'});
  }
  //if match is found in database
  else {
    res.redirect(find_url.original_url);
  }
});


app.post('/api/shorturl', (req, res) => {
    //get url object
    try {
      var urlObj = new URL(req.body.url);
    //check if url is valid
      dns.lookup(urlObj.hostname, async (err, adress, family) => {
        //if url is invalid
        if ( ! adress ) {
          res.json({
            error: 'invalid url'
          });
        } 
        //if url is valid
        else {
          let original_url = urlObj.href;
          let check_database = await Url.collection.findOne({original_url: original_url});
          let res_obj = {};
          //if no match is found in the database
          if ( ! check_database ) {
            //save new document if no match is found in the database
            let short_url = (await Url.collection.countDocuments()) + 1;
            res_obj = {
              original_url: original_url,
              short_url: short_url
            };
            let new_db_url = new Url (res_obj);
            new_db_url.save();
          }
          //if match is found in database
          else {
            res_obj = {
              original_url: check_database.original_url,
              short_url: check_database.short_url
            }
          }
          res.send(res_obj);
        }
      })
    }
    catch (err) {
      res.json({ error: 'invalid url' })
    }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
