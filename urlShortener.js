require('dotenv').config()
const DynamoDB = require('aws-sdk/clients/dynamodb')
const nanoID = require('nanoid')

const tableName = process.env.AWS_DYNAMODB_TABLE
const region = process.env.AWS_BUCKET_REGION

const dynoDb = new DynamoDB({
    region
})

// It creates a new shortUrl if not exist
async function urlShortener(){
    let breakOrContinue = false
    let result
    do{
        const newShortURL = nanoID.nanoid(6)

        const params = {
            TableName : tableName,
            Key: {
                    "shortURL": { 
                        S:newShortURL
                    }
                }
        }
        result =  await dynoDb.getItem(params).promise()

        if(JSON.stringify(result)==='{}'){
            return newShortURL
        }
        else{
            breakOrContinue = true
        }
    }while(breakOrContinue)
}

exports.urlShortener = urlShortener