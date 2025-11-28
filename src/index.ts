import { extractProducts } from './extract.ts';

const allProducts = await extractProducts();

console.log(allProducts);
