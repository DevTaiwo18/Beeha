const { config, uploader } = require('cloudinary').v2;
const multer = require('multer');
const DatauriParser = require('datauri/parser');
const path = require('path');
const sharp = require('sharp');

const cloudinaryConfig = () => {
    config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
};

const storage = multer.memoryStorage();
const multerUploads = multer({ storage }).array("images", 3);

const processImages = async (req, res, next) => {
    if (!req.files) return next();

    try {
        const imagesPromises = req.files.map(file =>
            sharp(file.buffer)
                .resize({ width: 800, height: 800, fit: 'inside' })
                .extend({
                    top: Math.floor((800 - height) / 2),
                    bottom: Math.ceil((800 - height) / 2),
                    left: Math.floor((800 - width) / 2),
                    right: Math.ceil((800 - width) / 2),
                    background: { r: 229, g: 229, b: 229, alpha: 1 }
                })
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toBuffer()
                .then(resizedBuffer => {
                    const parser = new DatauriParser();
                    return parser.format('.jpeg', resizedBuffer).content;
                })
        );

        const dataUris = await Promise.all(imagesPromises);
        req.body.images = dataUris;
        next();
    } catch (error) {
        console.error('Error processing images:', error);
        res.status(500).send('Failed to process images');
    }
};

module.exports = { cloudinaryConfig, multerUploads, processImages, uploader };
