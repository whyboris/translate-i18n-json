const fs = require('fs');

var TJO = require('translate-json-object')();

const API_KEY = process.env.GOOGLE_API_KEY;

TJO.init({ googleApiKey: API_KEY });

const sourceOfTruthFolder = './source_of_truth/';
const filesInSourceOfTruth = getJsonFilesFromDirectory(sourceOfTruthFolder);
const outputFolder = './output/';
const filesInOutputFolder = getJsonFilesFromDirectory(outputFolder);
const updatesFolder = './updates/';
const filesInUpdatesFolder = getJsonFilesFromDirectory(updatesFolder);

const targetLanguages = [];

filesInOutputFolder.forEach((file) => {
  targetLanguages.push(removeExtension(file));
})

let sourceOfTruthPath = '';

if (filesInSourceOfTruth.length !== 1) {
  console.error('You must have only one .json file in the `source_of_truth` folder');
} else if (filesInOutputFolder.length === 0 ) {
  console.error('You must have at least one .json file in the `output` folder');
} else if (filesInUpdatesFolder.length > 1) {
  console.error('You must have at most one .json file in the `updates` folder');
} else if (filesInUpdatesFolder.length && filesInUpdatesFolder[0] !== filesInSourceOfTruth[0]) {
  console.error('The language in the `source_of_truth` folder does not match one in `updates` folder (filenames must match)');
} else {
  sourceOfTruthPath = sourceOfTruthFolder + filesInSourceOfTruth[0];
  sourceOfTruthLanguage = removeExtension(filesInSourceOfTruth[0]);
  console.log('translating from:  ', sourceOfTruthPath);
  console.log('source language:   ', removeExtension(sourceOfTruthLanguage));
  console.log('translating to: ', targetLanguages);
  if (filesInUpdatesFolder.length === 1) {
    console.log('Also updating all strings that are different in `updates` folder from `source_of_truth`')
  }
  console.log('');

  iterateThroughTargetLanguages();
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

  let onlyUpdatedStrings = {};
  if (filesInUpdatesFolder.length === 1) {
    const updatesFile = fs.readFileSync(updatesFolder + filesInUpdatesFolder[0]);
    const updates = JSON.parse(updatesFile);
    onlyUpdatedStrings = getUpdatesStrings(template, updates);
  }

  const finalFinalFinal = { ...objectToTranslate, ...onlyUpdatedStrings };

  try {
    const translatedObject = await TJO.translate(finalFinalFinal, TARGET_LANGUAGE)

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

function removeExtension(file) {
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
 * Returns object with values that are different between `templateObject` and `updatesObject`
 */
function getUpdatesStrings(templateObject, updatesObject) {

  const categories = getKeys(templateObject);

  const result = {};

  categories.forEach((category) => {

    result[category] = {};

    const names = getKeys(templateObject[category]);

    names.forEach((name) => {

      if (updatesObject[category] && (updatesObject[category][name] !== templateObject[category][name])) {
        result[category][name] = updatesObject[category][name];
      }

    });
  });

  return result;
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
