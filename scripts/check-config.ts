// Read featured.mjs array of packages keys.
// And read packages-list.json
// Check if all packages in featured.mjs are in packages-list.json


import featured from '../config/featured.mjs';
import allPackagesList from '../indexes/packages-list.json';


for (const f of featured) {
  if (!allPackagesList[f]) {
    throw new Error(`Package ${f} is not in packages-list.json`);
  }
}
console.log('All featured packages are in packages-list.json');
