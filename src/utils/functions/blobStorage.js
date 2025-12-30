const { BlobServiceClient } = require('@azure/storage-blob');
const { ACCOUNT_KEY, SAS_TOKEN, CONTAINER_NAME, CONNECTION_STRING } = require("../../config");

const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

async function uploadFile(file) {
    const blobName = `${Date.now()}-${file.originalname}`;
    const blobClient = containerClient.getBlockBlobClient(blobName);
    // Upload the image buffer
    await blobClient.uploadData(file.buffer, {
        concurrency: 4,
    });
    return {
        originalName: file.originalname,
        blobName: blobName,
        url: `https://${CONTAINER_NAME}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}${SAS_TOKEN}`
    }
}

async function uploadPDFBuffer(buffer, fileName) {
    const blobName = `farmer-agreements/${Date.now()}-${fileName}`;
    const blobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload the PDF buffer
    await blobClient.uploadData(buffer, {
        concurrency: 4,
        blobHTTPHeaders: {
            blobContentType: 'application/pdf'
        }
    });
    
    return `https://${CONTAINER_NAME}.blob.core.windows.net/${CONTAINER_NAME}/${blobName}${SAS_TOKEN}`;
}

async function listBlobs() {
    let i = 1;
    for await (const blob of containerClient.listBlobsFlat()) {
        console.log(`Blob ${i++}: ${blob.name}`);

        // Fetch and display the content of the blob (image)
        const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
        // const content = await blockBlobClient.downloadToBuffer();
        const content = await blockBlobClient.delete();
        // console.log(content.toString());
    }
}

// Execute the function to list and fetch blobs
// listBlobs()
//     .then(() => console.log("Done"))
//     .catch((error) => console.error(error));

module.exports = { uploadFile, uploadPDFBuffer };
