const { config, uploader } = require('cloudinary').v2;
const multer = require('multer');
const DatauriParser = require('datauri/parser');
const Jimp = require('jimp');

const cloudinaryConfig = () => {
    config({
        cloud_name: process.env.cloudinary_name,
        api_key: process.env.cloudinary_api_key,
        api_secret: process.env.cloudinary_api_secret,
        secure: true
    });
};

const storage = multer.memoryStorage();
const multerUploads = multer({ storage }).array("images", 3);

const processImages = async (req, res, next) => {
    if (!req.files || req.files.length === 0) return next();

    try {
        const parser = new DatauriParser();

        const resizeImage = async (fileBuffer, size) => {
            const image = await Jimp.read(fileBuffer);
            image.cover(size, size); 
            const resizedBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
            return resizedBuffer;
        };

        const imagesPromises = req.files.map(async (file) => {
            const resizedBuffer = await resizeImage(file.buffer, 800);

            const dataUri = parser.format(file.originalname, resizedBuffer).content;

            const result = await uploader.upload(dataUri, {
                folder: 'Beeha',
                format: "jpg",
                quality: 90
            });

            return result.secure_url;
        });

        const dataUris = await Promise.all(imagesPromises);
        req.body.images = dataUris;
        next();
    } catch (error) {
        console.error('Error processing images:', error);
        res.status(500).send('Failed to process images');
    }
};

module.exports = { cloudinaryConfig, multerUploads, processImages, uploader };
