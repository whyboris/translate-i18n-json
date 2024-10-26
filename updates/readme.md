# `updates` folder

Only place a file here if _strings_ (values in the key/value pairs) changed from the `.json` file found in the `source_of_truth` folder.

_For example:_ you have translated (A) `en.json` (in `source_of_truth`) into `ja.json` (in `output` folder), but since then have updated some strings in (B) `en.json` (in `updates` folder). When you run the script, only those strings will get updated.

_Note:_ filenames need to be in the [ISO-639 code](https://cloud.google.com/translate/docs/languages) format.
