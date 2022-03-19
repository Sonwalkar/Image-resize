require("dotenv").config();
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");
const sharp = require("sharp");
const got = require('got');

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESSKEY;
const secretAccessKey = process.env.AWS_SECRETKEY;
const sessionToken = process.env.AWS_SESSIONTOKEN;

const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey,
    sessionToken,
});

// upload file to s3
function uploadFile(file) {
    const fileStream = fs.createReadStream(file.path);

    const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: `${file.filename}.jpg`,
    };

    return s3.upload(uploadParams).promise();
}

exports.uploadFile = uploadFile;


// Resize image from s3 bucket using url and upload resized image back to the S3 bucket
async function resizeImage(url, fileName, width, height) {
    try {
        const body = await got(url).buffer();
        let s3PromiseObject;
        await sharp(body)
            .resize(width,height,{
                fit: 'contain',
            })
            .toBuffer()
            .then(buffer => {
                const uploadParams = {
                    Bucket: bucketName,
                    Body: buffer,
                    Key: `${fileName}-${width}*${height}.jpg`,
                };
            
                s3PromiseObject =  s3.upload(uploadParams).promise();
            })
            return s3PromiseObject
    } catch (error) {
        console.log(error);
    }
}
exports.resizeImage = resizeImage;
