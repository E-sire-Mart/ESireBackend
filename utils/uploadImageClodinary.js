import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLODINARY_CLOUD_NAME,
  api_key: process.env.CLODINARY_API_KEY,
  api_secret: process.env.CLODINARY_API_SECRET_KEY,
});

const uploadImageClodinary = async (image) => {
  try{

    console.log("image:",  image);
    const buffer = image?.buffer || Buffer.from(await image.arrayBuffer());
    console.log("buffer: ", buffer);
    const uploadImage = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "assets" },
      (error, uploadResult) => {
        if(error){
          return reject(error);
        }
        else {
          return resolve(uploadResult);
        }
      }
    );
    uploadStream.end(buffer);
  });
  console.log("uploadImage: ", uploadImage);
  return uploadImage;
}catch(error){
  console.error("Error uploading image to Cloudinary:", error);
  throw error;
}
};
export default uploadImageClodinary;
