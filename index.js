const serverless = require('serverless-http')
const express = require("express")
const multer = require("multer")
const upload = multer({dest:'uploads'})

const fs = require('fs')
const util = require('util')

const unlinkFile = util.promisify(fs.unlink)

const {uploadFile, getFileStream} = require('./s3')

const { createNewItem, getS3Key } = require('./dynoDB')

const { urlShortener } = require("./urlShortener")

const app = express()

// localhost on 3000
app.listen(3000)

// set ejs view engine
app.set('view engine', 'ejs')

app.use(express.static('public'))
// render index page
app.get('/' ,(req, res)=>{
    res.render("index")
})


//render image stored on AWS S3
app.get('/images', async (req, res)=>{
    const key = req.params.key

    const shorturl = req.query.shorturl;
    let width = parseInt(req.query.width);
    let height = parseInt(req.query.height);

    // check height and width is available in url
    if(!height){
        // if height is not available in url then set width value to height
        height = width
    }
    if(!width){
        // if width is not available in url then set height value to width
        width = height
    }

    const s3key = await getS3Key(shorturl) // for get the key value of s3 object from short url

    const readStream = getFileStream(s3key.Item.S3key.S, width, height ) // for get the image from s3

    readStream.pipe(res) // render image
})


// If client send an post request then get the image
app.post('/imagesURL',upload.single('userImage'), async (req, res)=>{
    console.log("Gotcha");
    const file = req.file
    console.log(file)

    console.log("--------UPLOADING TO S3--------");
    const result = await uploadFile(file)
    await unlinkFile(file.path)
    console.log("--------DONE UPLOAD FILE--------");

    console.log("--------CREATING SHORT URL--------");
    const getShortUrl = await urlShortener()
    console.log("--------DONE SHORT URL--------");

    console.log("--------CREATING NEW ITEM DYNAMO DB--------");
    const createdItem = await createNewItem(result.Key, getShortUrl)
    console.log("--------DONE WITH NEW ITEM--------");

    res.render('shorturl_page',{shortUrl:createdItem.shortURL.S})
})

module.exports.handler = serverless(app)