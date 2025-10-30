const fs = require('fs');
const { faker } = require('@faker-js/faker');
const https = require('https');
const http = require('http');

const NUM_HOTELS = 100;

/**
 * Obtiene imágenes de hoteles desde Unsplash
 * @param {string} query - Término de búsqueda
 * @param {number} targetCount - Cantidad de imágenes a obtener
 * @returns {Promise<string[]>} Array de URLs de imágenes
 */
async function fetchFromUnsplash(query, targetCount = NUM_HOTELS) {
  return new Promise((resolve, reject) => {
    const allImages = [];
    const perPage = 20;
    const totalPages = Math.ceil(targetCount / perPage);
    let completedPages = 0;

    for (let page = 1; page <= totalPages; page++) {
      const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&order_by=popular`;

      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.results?.length > 0) {
              allImages.push(...json.results.map(photo => photo.urls.regular));
            }
          } catch (error) {
            console.error('Error parsing Unsplash response:', error.message);
          }

          completedPages++;
          if (completedPages === totalPages) {
            resolve(allImages.length > 0 ? allImages.slice(0, targetCount) : []);
          }
        });
      }).on('error', reject);
    }
  });
}

/**
 * Verifica si una URL de imagen responde correctamente
 * @param {string} imageUrl - URL a verificar
 * @returns {Promise<boolean>} true si la URL responde, false en caso contrario
 */
async function isImageUrlValid(imageUrl) {
  return new Promise((resolve) => {
    try {
      const url = new URL(imageUrl);
      const protocol = url.protocol === 'https:' ? https : http;

      const request = protocol.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });

      request.on('error', () => resolve(false));
      request.on('timeout', () => {
        request.destroy();
        resolve(false);
      });

      request.end();
    } catch (error) {
      resolve(false);
    }
  });
}

/**
 * Crea un objeto hotel con datos aleatorios
 * @param {string} imageUrl - URL de la imagen del hotel
 * @returns {Object} Objeto hotel
 */
function createHotel(imageUrl) {
  return {
    id: faker.string.uuid(),
    name: `Hotel ${faker.word.words(2)}`,
    image: imageUrl,
    address: faker.location.streetAddress(),
    stars: faker.number.int({ min: 1, max: 5 }),
    rate: parseFloat(faker.number.float({ min: 0, max: 5, fractionDigits: 1 })),
    price: faker.number.float({ min: 50, max: 1000, fractionDigits: 2 }),
  };
}

/**
 * Genera hoteles y verifica URLs, usando fallbacks si es necesario
 * @param {string[]} fallbackImages - Imágenes de fallback desde Unsplash
 * @returns {Promise<Object[]>} Array de hoteles
 */
async function generateHotels(fallbackImages) {
  const hotels = [];
  let fallbackIndex = 0;

  for (let i = 0; i < NUM_HOTELS; i++) {
    let imageUrl = faker.image.urlPlaceholder({ width: 240, height: 180, text: '' });
    const isValid = await isImageUrlValid(imageUrl);

    if (!isValid && fallbackImages.length > 0) {
      imageUrl = fallbackImages[fallbackIndex % fallbackImages.length];
      fallbackIndex++;
      console.log(`⚠️  Hotel #${i + 1}: URL inválida. Usando fallback de Unsplash`);
    }

    hotels.push(createHotel(imageUrl));
  }

  return hotels;
}

/**
 * Genera la base de datos de hoteles
 */
async function generateDb() {
  try {
    console.log('🔍 Obteniendo imágenes de Unsplash para fallback...');
    const fallbackImages = await fetchFromUnsplash('hotel buildings', NUM_HOTELS);
    console.log(`✅ Se obtuvieron ${fallbackImages.length} imágenes`);

    console.log('🏨 Generando hoteles y verificando URLs...');
    const hotels = await generateHotels(fallbackImages);
    console.log(`✅ Se generaron ${hotels.length} hoteles`);

    const data = { hotels };
    fs.writeFileSync('db.json', JSON.stringify(data, null, 2));
    console.log('✅ Base de datos guardada en db.json\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateDb();
