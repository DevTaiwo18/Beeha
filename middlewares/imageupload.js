const { config, uploader } = require('cloudinary').v2;
const multer = require('multer');
const DatauriParser = require('datauri/parser');

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

        const imagesPromises = req.files.map(async (file) => {
            const dataUri = parser.format(file.originalname, file.buffer).content;

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
