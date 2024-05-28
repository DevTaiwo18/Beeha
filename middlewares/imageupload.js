const { config, uploader } = require('cloudinary').v2;
const multer = require('multer');
const DatauriParser = require('datauri/parser');
const sharp = require('sharp');

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

        const imagesPromises = req.files.map(file => {
            return sharp(file.buffer)
                .resize({ width: 800, height: 800, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }) // Background set to white
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toBuffer()
                .then(resizedBuffer => parser.format('.jpeg', resizedBuffer).content);
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
