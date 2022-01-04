// /* eslint-disable no-console */
// const { writeFileSync } = require('fs');
// // eslint-disable-next-line import/no-extraneous-dependencies
// global.fetch = require('node-fetch');
// const { createApi } = require('unsplash-js');
// // const subjects = require('../components/Course/departments.json');
// const images = require('../components/Course/departmentImages.json');

// const api = createApi({ accessKey: '00rqnpHUQOvWcHnh7qf-cpGruUnXUM75ohSwP5CEzVo' });

// /*
// curl https://api.unsplash.com/search/photos?query=Zulu&per_page=1&client_id=00rqnpHUQOvWcHnh7qf-cpGruUnXUM75ohSwP5CEzVo
// // */
// getPhoto('TLZKlOBOsLs', 'Yiddish')
// getPhoto('9AusKAGgagg', 'XREG Brown University')
// getPhoto('M-4lFg1Xfag', 'West African Pidgin')
// getPhoto('G8CxFhKuPDU', 'Women, Gender & Sexuality')
// getPhoto('OOiygaquXZs', 'Wolof')
// getPhoto('Zkao_QBEjk8', 'Gikuyu')
// getPhoto('A56yu_pmNKQ', 'Gullah)
// getPhoto('LgseLOnBIPA', 'Manchu')
// getPhoto('t85pKpB5Zf4', 'Tigrinya')
// getPhoto('neMPqxWWO0w', 'Kimeru')

// async function getPhoto(photoId, subject) {
//   try {
//     const res = await api.photos.get({ photoId });
//     if (res.errors) {
//       console.error(res.errors);
//     } else {
//       images[subject] = res.response;
//       console.log(`updated ${subject}`);
//     }
//   } catch (err) {
//     console.error(err);
//   }
// }

// async function searchSubject(sub) {
//   try {
//     const res = await api.search.getPhotos({ query: sub });
//     if (res.errors) {
//       console.error(res.errors);
//     } else {
//       images[sub] = res.response.results[0] || null;
//       console.log(`updated ${sub}`);
//     }
//   } catch (err) {
//     console.error(`error updating ${sub}: ${err.message}`);
//   }
// }

// async function main() {
// //   const remaining = subjects.filter((s) => !(s in images));

//   //   await Promise.all(remaining.map(async (sub, i) => {
//   //     await new Promise((resolve) => {
//   //       setTimeout(resolve, i * 500);
//   //     });
//   //     await searchSubject(sub);
//   //   }));

//   //   await getPhoto('60XLoOgwkfA', 'Hausa');
//   await getPhoto('lc7xcWebECc', 'Business Doctoral');
//   await getPhoto('aWDgqexSxA0', 'Human Evolutionary Biology');
//   await getPhoto('yhbanN00pb8', 'Inner Asian and Altaic Studies');
//   await getPhoto('67ruAEYmp4c', 'Igbo');
//   await getPhoto('uN8TV9Pw2ik', 'Immunology');
//   await getPhoto('jIk3I_e16uw', 'Jamaican');
//   await getPhoto('n--CMLApjfI', 'Japanese Literature');
//   await getPhoto('TLZKlOBOsLs', 'Jewish Studies');
//   await getPhoto('eVa2FK83K6w', 'Korean');
//   await getPhoto('Gf6puSx3h6Y', 'Korean History');
//   await getPhoto('OPpCbAAKWv8', 'Mathematics');
//   await getPhoto('Y8r0RTNrIWM', 'Modern Hebrew');
//   await getPhoto('17Uzj_wc-TY', 'Near Eastern Civilizations');
//   await getPhoto('3KGF9R_0oHs', 'Neurobiology');
//   await getPhoto('gDDas5_ALRw', 'Population Health Sciences');
//   await getPhoto('upJFoyr7BBA', 'Middle Eastern Studies');
//   await getPhoto('KUeJcc4YUug', 'Physical Sciences');
//   await getPhoto('xcPw1-5OHTk', 'Polish');
//   await getPhoto('Hx8HaI4ERkA', 'Romance Languages');
//   await getPhoto('oI141-aIwnQ', 'Romance Studies');
//   await getPhoto('naOfJ3DlfPM', 'Regional Studies - East Asia');
//   await getPhoto('pwcKF7L4-no', 'Stem Cell & Regenerative Biol');
//   await getPhoto('3rkosR_Dgfg', 'Scottish Gaelic');
//   await getPhoto('ASKeuOZqhYU', 'Speech & Hearing Sciences');
//   await getPhoto('RPLwFFzNvp0', 'Slavic');
//   await getPhoto('YLSwjSy7stw', 'Special Concentrations');
//   await getPhoto('zeH-ljawHtg', 'Special Policy');
//   await getPhoto('9IafO_YOVik', 'Sudanese');
//   await getPhoto('bU9kic4IvRQ', 'Sumerian');
//   await getPhoto('Rfflri94rs8', 'Systems Biology');
//   await getPhoto('eeSdJfLfx1A', 'Graduate Research');
//   await getPhoto('a6jaMBfDeoo', 'Ukrainian');
//   await getPhoto('qbc3Zmxw0G8', 'Ukrainian Studies');
//   writeFileSync('images.json', JSON.stringify(images));
// }

// main();

// const { writeFileSync } = require('fs');
// const data = require('../components/Course/departmentImages.json');

// const bar = {};
// Object.keys(data).forEach((key) => {
//   const {
//     id, alt_description, urls: { thumb }, user: { id: user_id, name, links: { html } },
//   } = data[key];
//   bar[key] = {
//     id, alt_description, urls: { thumb }, user: { id: user_id, name, links: { html } },
//   };
// });

// writeFileSync('departmentImages.json', JSON.stringify(bar));
