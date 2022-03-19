const serverless = require('serverless-http')
const express = require("express")
const multer = require("multer")
const upload = multer({dest:'../../tmp'})
const path = require('path')
const fs = require('fs')
const util = require('util')

const unlinkFile = util.promisify(fs.unlink)
const {uploadFile} = require('./s3')
const { createNewItem, getS3Key } = require('./dynoDB')
const { urlShortener } = require("./urlShortener")
const { json } = require('express/lib/response')
const res = require('express/lib/response')
const { getSignedUrl }  = require('./getSignedUrl')


const app = express()

// localhost on 3000
app.listen(3000)

// set ejs view engine
const viewsPath = path.join(__dirname, '/views')
app.set('views', viewsPath)
app.set('view engine', 'ejs')


const publicPath = path.join(__dirname, '/public');
app.use(express.static(publicPath))

// for getting css url from S3 Bucket
const createSignedUrlForCss = async ()=>{
    return await getSignedUrl("style.css", "CSS")
}

// render index page
app.get('/' ,async (req, res)=>{
    res.render("index",{cssFile: await createSignedUrlForCss()})
})

// For Health check
app.get('/health',(req,res)=>{
    res.json(JSON.stringify({
        'health':'OK',
        'statusCode':200
    }))
})

//render image stored on AWS S3 original size or resized image
app.get('/showImage', async (req, res)=>{
    const key = req.params.key

    // getting shortUrl, width and height from url
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

    // for get the key value of s3 object from short url
    const s3key = await getS3Key(shorturl) 

    let signedUrl;
    
    // if width or height provided in url.
    if(width || height){
        const {resizeImage} = require('./s3')

        // It get a signed url of original image to resize using url
        const signedUrlForResize = await getSignedUrl(s3key.Item.S3key.S)

        const resizeImageUrl = await resizeImage(signedUrlForResize,s3key.Item.S3key.S, width, height ) // for get the image from s3

        // A signed url of resized image 
        signedUrl = await getSignedUrl(resizeImageUrl.Key)
    }else{
        // a signed url of original image
        signedUrl = await getSignedUrl(s3key.Item.S3key.S)
    }

    // render original or resized image
    res.render('showImage',{shortUrl:signedUrl, cssFile: await createSignedUrlForCss()}) // render image
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

    res.render('shorturl_page',{shortUrl:createdItem.shortURL.S, cssFile: await createSignedUrlForCss()})
})

exports.handler = serverless(app)