# gsdownload

Download Google sheets as CSVs using a service account.

1. Create a Google service account 
2. Share your spreadsheet with that account
3. Provide credentials from that account to `gsdownload` along with a sheet ID and it will download each worksheet as a CSV file to a location you specify

>Be careful not to leak your private key. Provide it as an environment variable/ secret and don't commit it to your repository

This mainly developed for use in a CI context so...

## CI usage

To use _gsdownload_ in a CI context (like Github actions for example) you need to 

1. set `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` as environment variables / secrets for github actions you can do this in the repo Settings->Secrets->Actions i.e. `https://github.com/<username/orgname>/<reponame>/settings/secrets/actions`
2. make sure your task runner can install & run node scripts and in your CI workflow globally install _gsdownload_ `npm i -g @tomgp/gsdownload`
3. in your CI workflow add the command `getsheet <sheetID> <output_directory>` and the worksheet CSVs should hopefully appear in `output_directory`

## otherwise, to use it in anothe Node script...

```js
const  { getSheet } = require('./index.js');
getSheet( <Spreadsheet_ID>, <Google_service_account_email_address>, <Service_account_private_key>, <Output_directory>);
```

