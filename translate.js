const fs = require('fs');

var TJO = require('translate-json-object')();

const API_KEY = process.env.GOOGLE_API_KEY;

TJO.init({ googleApiKey: API_KEY });

const sourceOfTruthFolder = './source_of_truth/';
const filesInSourceOfTruth = getJsonFilesFromDirectory(sourceOfTruthFolder);
const outputFolder = './output/';
const targetLanguageFiles = getJsonFilesFromDirectory(outputFolder);
// TODO: handle `updates` folder too

const targetLanguages = [];

targetLanguageFiles.forEach((file) => {
  targetLanguages.push(removeFilename(file));
})

let sourceOfTruthPath = '';

if (filesInSourceOfTruth.length === 1) {
  sourceOfTruthPath = sourceOfTruthFolder + filesInSourceOfTruth[0];
  sourceOfTruthLanguage = removeFilename(filesInSourceOfTruth[0]);
  console.log('translating from:  ', sourceOfTruthPath);
  console.log('source language:   ', removeFilename(sourceOfTruthLanguage));
  console.log('translating to: ', targetLanguages);
  console.log('');

  iterateThroughTargetLanguages();
} else {
  console.error('You must have only one .json file in the `source_of_truth` folder');
}

async function iterateThroughTargetLanguages() {
  targetLanguages.forEach((language) => {
    translateLanguage(language);
  });
}


// =================================================================================================
// Main function handling translation flow for each language
// -------------------------------------------------------------------------------------------------

// expects ISO-639 code language string (e.g. `en`, `es`, `de`)
async function translateLanguage(TARGET_LANGUAGE) {

  const templateFile = fs.readFileSync(sourceOfTruthPath);
  const fileToUpdate = fs.readFileSync(outputFolder + TARGET_LANGUAGE + '.json');

  const template = JSON.parse(templateFile);
  const toUpdate = JSON.parse(fileToUpdate);

  const original = JSON.parse(JSON.stringify(toUpdate)); // purely to handle `unchanged` state

  const objectToTranslate = getJsonDifference(template, toUpdate);

  try {
    const translatedObject = await TJO.translate(objectToTranslate, TARGET_LANGUAGE)

    const final = mergeObjects(toUpdate, translatedObject);

    const cleaned = deleteOutdated(template, final);

    if (JSON.stringify(original) === JSON.stringify(cleaned)) {
      console.log(TARGET_LANGUAGE, 'unchanged');
    } else {
      fs.writeFileSync(outputFolder + TARGET_LANGUAGE + '.json', JSON.stringify(cleaned, null, 2));

      green(TARGET_LANGUAGE, 'UPDATED');
    }

  } catch (err) {
    red(TARGET_LANGUAGE, 'ERROR');
    if (err['body']) {
      console.log(err['body']);
    } else {
      console.log(err);
    }
  }

}


// =================================================================================================
// Helper methods
// -------------------------------------------------------------------------------------------------

function getJsonFilesFromDirectory(folderPath) {
  let filenames = []

  fs.readdirSync(folderPath).forEach(file => {
    filenames.push(file)
  });

  const onlyJSON = filenames.filter((file) => {
    return file.toLowerCase().endsWith('.json')
  })

  return onlyJSON
}

function removeFilename(file) {
  return file.toLowerCase().replace('.json', '')
}

function getKeys(anyObj) {
  return Object.keys(anyObj);
}

/**
 * Delete from `newObject` any key-value pairs that do not exist in `templateObject`
 * @param templateObject
 * @param newObject
 */
function deleteOutdated(templateObject, newObject) {

  const categories = getKeys(newObject);

  categories.forEach((category) => {
    if (!templateObject[category]) {

      delete newObject[category];

    } else {

      const names = getKeys(newObject[category]);

      names.forEach((name) => {
        if (!templateObject[category][name]) {
          delete newObject[category][name];
        }
      });

    }
  });

  return newObject;
}

/**
 * Merges the `newAdditions` into `incompleteObject`
 * @param incompleteObject
 * @param newAdditions
 */
function mergeObjects(incompleteObject, newAdditions) {

  const categories = getKeys(newAdditions);

  categories.forEach((category) => {

    const names = getKeys(newAdditions[category]);

    if (!incompleteObject[category]) {
      incompleteObject[category] = {};
    }

    names.forEach((name) => {

      incompleteObject[category][name] = newAdditions[category][name];

    });

  });

  return incompleteObject;
}

/**
 * Returns object with values that exist in `templateObject` but not in `incompleteObject`
 */
function getJsonDifference(templateObject, incompleteObject) {

  const categories = getKeys(templateObject);

  const result = {};

  categories.forEach((category) => {

    result[category] = {};

    const names = getKeys(templateObject[category]);

    names.forEach((name) => {

      if (!incompleteObject[category] || !incompleteObject[category][name]) {
        result[category][name] = templateObject[category][name];
      }

    });
  });

  return result;
}

function green(a, b) {
  console.log(a + ' \x1b[32m' + b + '\x1b[0m');
}

function red(a, b) {
  console.log(a + ' \x1b[31m' + b + '\x1b[0m');
}
