require('dotenv').config()
const Dynamodb = require('aws-sdk/clients/dynamodb')


const tableName = process.env.AWS_DYNAMODB_TABLE
const region = process.env.AWS_BUCKET_REGION

const dynamodb = new Dynamodb({
    region
})

// It creates a new item in dynamodb and return newItem object
async function createNewItem(S3Keys,shortURL){
    const newItem = {
        S3key:{S:String(S3Keys)},
        shortURL:{S:shortURL}
    }

    const params = {
        TableName : tableName,
        Item : newItem
    }
    dynamodb.putItem(params, function (err, data){
        if(err){
            console.log("ERR");
            console.log(err);
        }
        else{

        }
    })

    return newItem
}

exports.createNewItem = createNewItem


// It gets the short url and try to get item from dynamodb Database and return object
async function getS3Key(shortURLKey){

    const params = {
        TableName : tableName,
        Key: {
                "shortURL": { 
                    S:shortURLKey
                }
            }
    }
    
    return await dynamodb.getItem(params).promise()
}

exports.getS3Key = getS3Key