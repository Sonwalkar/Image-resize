require('dotenv').config()
const S3 = require('aws-sdk/clients/s3')
const fs = require('fs')
const sharp = require('sharp')



const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY
const sessionToken = process.env.AWS_SESSION_TOKEN

const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey,
    sessionToken
})

// upload file to s3

function uploadFile(file){

    const fileStream = fs.createReadStream(file.path)

    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: file.filename
    }

    return s3.upload(uploadParams).promise()
}

exports.uploadFile = uploadFile


// get objects from s3

function getFileStream(fileKey, width=height, height=width){
    const downloadParams = {
        Key: fileKey,
        Bucket: bucketName
    }


    const s3image = s3.getObject(downloadParams).createReadStream()
    let transform = sharp()
    if(width || height){
        transform = transform.resize(width,height)
    }

    return s3image.pipe(transform)
    // return s3.getObject(downloadParams).createReadStream()
    
}
exports.getFileStream = getFileStream