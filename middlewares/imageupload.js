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

        const imagesPromises = req.files.map(async (file) => {
            // Use sharp to resize and convert image to JPEG
            const resizedBuffer = await sharp(file.buffer)
                .resize({ width: 800, height: 800, fit: 'contain', background: { r: 229, g: 229, b: 229, alpha: 1 } })
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toBuffer();

            // Upload resized image to Cloudinary
            const result = await uploader.upload(resizedBuffer, {
                folder: 'beeha', // Specify your desired folder in Cloudinary
                transformation: [
                    { width: 800, height: 800, crop: "fit" }, // Resize and fit within 800x800
                    { effect: "remove_background" } // Optional: Remove background (if supported by plan)
                ],
                format: "jpg",
                quality: 90
            });

            // Store Cloudinary URL or transformation result
            return result.secure_url; // Example: return the secure URL of the modified image
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
