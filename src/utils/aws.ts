import {S3} from "aws-sdk";

interface ImageUploadResult {
    Bucket: string;
    Key: string;
    Location: string;
  }
// export async function uploadImages(files: Array<Express.Multer.File>): Promise<ImageUploadResult[]> {
//     return new Promise((resolve,reject) => {
//         try {
            
//             console.log("Check aws credentials", { accessKey: process.env.AWS_ACCESS_KEY_ID,  secretAccessKey: process.env.AWS_SECRET_KEY})
//             const s3 = new S3({
//                 accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//                 secretAccessKey: process.env.AWS_SECRET_KEY
//             });

//             const images: ImageUploadResult[] = [];

//             files.forEach(async(file)=> {
//                 const filename = file.originalname;

//                 const params = {
//                     Bucket: process.env.AWS_S3_BUCKET_NAME as string,
//                     Key: `books/${filename}`,
//                     Body: file.buffer,
//                   };

//                 const uploadResponse = await s3.upload(params).promise();
            
//                 images.push({
//                     Bucket: uploadResponse.Bucket,
//                     Key: uploadResponse.Key,
//                     Location: uploadResponse.Location
//                 })
//                 if (images?.length === files.length) resolve(images)
//             })

//         } catch (error) {
//             reject(error)
//         }
//     })
// }


export interface SimulatedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export type UploadableFile = Express.Multer.File | SimulatedFile;

export async function uploadImages(files: UploadableFile[], folder: string): Promise<ImageUploadResult[]> {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  });

  const uploadPromises = files.map(async (file) => {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME as string,
      Key: `${folder}/${Date.now()}-${file.originalname}`, // avoid filename conflicts
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const uploadResponse = await s3.upload(params).promise();

    return {
      Bucket: uploadResponse.Bucket,
      Key: uploadResponse.Key,
      Location: uploadResponse.Location,
    };
  });

  return Promise.all(uploadPromises);
}
