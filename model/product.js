const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0.01
    },
    category: {
        type: String,
        required: true,
        enum: ['Cloth', 'Bags', 'Shoes']
    },
    images: {
        type: [String],
        validate: [arrayLimit, '{PATH} exceeds the limit of 3'],
    },
    sizes: [{
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', "One Size"],
        required: true
    }],
    stock: {
        type: Number,
        required: true,
        min: 0 
    }
}, {
    timestamps: true
});

function arrayLimit(val) {
    return val.length <= 3;
}

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
