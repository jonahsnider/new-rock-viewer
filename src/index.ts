import { extractProducts } from './extract/extract.ts';

const allProducts = await extractProducts();

console.log(allProducts);
