# Translate i18n JSON

A script to help translating and managing updates to your _i18n_ `JSON` files.

_Example_ with _initial_ `en.json` language and `es.json` _target_ language:

- _Create_ `es.json` by translating all key/value pairs found in `en.json`
- _Add_ to `es.json` translations of any key/value pairs found in `en.json` but not present in `es.json`
- _Remove_ from `es.json` all key/value pairs no longer present in `en.json`
- _Update_ all strings in `es.json` that were modified in `en.json` (`updates` folder) when comparing to a previous version of `en.json` (`source_of_truth` folder)

_Note:_ above examples generalize from any _initial_ language to any _target_ languge (script can update many _target_ language files per run)

#### Why?

If you ever manually update a string in a translated file, unless the original language changes, you don't want to overwrite your human translation with a less-good machine translation every time you run a translation script. `translate-i18n-json` avoids this problem.

Additionally, this script _avoid wasting your Google Translate credits_. Rather than translating every string from the _initial_ `.json` file into every language every time you update your app/website, this script will only translate (and update) the strings that changed since the last time you ran the script.

## Setup

You will need a file `.env` (rename `.env-example` to `.env` and replace dummy string with your own [Google API key](https://support.google.com/googleapi/answer/6158862))

```env
GOOGLE_API_KEY=********* your Google API key *********
```

## Use

Replace the `.json` file in the `source_of_truth` folder with your `.json` file containing the language that needs translating into other languages.

To generate a new translation, look up the [ISO-639 code](https://cloud.google.com/translate/docs/languages) (e.g. `es`) and place an empty `es.json` file (with empty object `{}` inside) into the `output` folder.

Then `npm start` will update all files in the `output` folder with changes:

- if `es.json` is empty, all strings from `en.json` will be translated and `es.json` will be updated
- if `es.json` is missing any keys present in `en.json`, only those key/value pairs will be translated and added
- if `es.json` has keys that `en.json` does not have, those key/value pairs will be removed
- if `es.json` has all the keys that `en.json` has, no updates will occur
- if `updates` folder contains `en.json` all key/value pairs different from `en.json` in the `source_of_truth` folder will be updated/adde to all files in the `output` folder.

_Note:_ you must use the [ISO-639 code](https://cloud.google.com/translate/docs/languages) for all file names.

## Recommended workflow

Here is an easy way to conceputalize the script. There are two _modes_ in which this system works. Mode (1) always happens, mode (2) will happen in addition if you place a `json` file into the `updates` folder:

1) You are adding or removing _new_ key/value pairs to your `json` and you want those changes to propagate to all your translations, `npm start` and you're done.
2) You are also _changing_ some strings (values) in the key/value pairs in your `json` and you want those strings to also be updated in all your translations
    - put the original file into the `source_of_truth` folder and the updated file (with the intended text changes) into the `updates` folder

The idea is this: you have your app/website repository with all your _i18n_ files in some folder. You copy all those files into this repository, putting the original language into `source_of_truth` and the rest in the `output` folder. When one day you have made changes to the language in your app/website repository, you copy over just the original language `json` into `source_of_truth` (when adding / deleting new key/value pairs) or into `updates` (when updating strings of already existing key/value pairs).

- If you run script in _mode_ (1) copy all the `output` folder files back into your app/website repository when done
- If you run script in _mode_ (2) _move_ the file from `updates` into `source_of_truth` and then _copy_ all the `output` files into your app/website repository when done

This will keep the `translate-i18n-json` repository ready for your next updates, regardless of which mode (1) or (2) you will use.

_Note:_ the _mode_ is determined solely by the presense of a file in the `updates` folder. Mode (1) always happens, and is followed by (2) if a file is present in the `updates` folder.

## Expected file format

Please follow this pattern:

```json
{
  "about": {
    "title": "Best Website Ever"
  },
  "contact": {
    "email": "Please send us an email: hello@lol.com",
    "title": "Contact Us"
  }
}
```

_Note:_ the nesting of all strings is never deeper or shallower than in the example above.

## Testing

You can test how things work by playing with the sample files already present in the repository (3 strings per file, and only 3 language files).

Running `npm run reset` will reset the `output` folder to its initial state.

_Note:_ while there is a file present in the `updates` folder, the script will also update all strings that are different from those found in the `source_of_truth` file.

## Meta

This code grew out of a small script that kept expanding. I don't feel like spending time organizing the code better - even though there are better ways to handle the whole process.
