const AWS = require("aws-sdk");
require('dotenv').config()

const s3 = new AWS.S3();

let bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION

AWS.config.update({
    region
});

// for get a signed url of s3 object
const getSignedUrl = async (s3Key, folderName) =>{
    // this is only for CSS file
    if(folderName){
        bucketName = `${bucketName}/${folderName}`
    }

    const preSignedUrl = await s3.getSignedUrl("getObject", {
        Bucket: bucketName,
        Key: s3Key,
        Expires: 86400
    });

    // Reset Bucket name
    bucketName = process.env.AWS_BUCKET_NAME

    return preSignedUrl
}

exports.getSignedUrl = getSignedUrl