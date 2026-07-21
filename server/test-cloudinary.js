// Quick test: Cloudinary upload
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

console.log('Cloud:', cloudinary.config().cloud_name);
console.log('Key:', cloudinary.config().api_key);
console.log('Secret (first 6):', cloudinary.config().api_secret?.substring(0, 6));

// Test with a small local file
cloudinary.uploader.upload(
  'C:/SU26/sdn302/DuAn/CraftWS/frontend/src/assets/images/ceramic-product.jpg',
  { folder: 'craftlocal/test' }
)
.then((result) => {
  console.log('\n✅ Upload SUCCESS!');
  console.log('URL:', result.secure_url);
  console.log('Public ID:', result.public_id);
})
.catch((error) => {
  console.error('\n❌ Upload FAILED');
  console.error('HTTP Code:', error.http_code);
  console.error('Message:', error.message);
  console.error('Full error:', JSON.stringify(error, null, 2));
});
