#!/usr/bin/env node

require('dotenv').config();

const { program } = require('commander');
const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');

if (require.main === module) {
  program.parse();
  let [sheetID, outdir] = program.args; // e.g. '10x0DkhnDBOfAV8-cUbDeh1BBTQKuncwEozScRJZV4m4';

  if(sheetID){
    if (!fs.existsSync(outdir)){
      fs.mkdirSync(outdir);
    }
    getSheet(sheetID, process.env.GOOGLE_CLIENT_EMAIL, process.env.GOOGLE_PRIVATE_KEY, outdir)
    .catch(err=>{
      console.error('OOOPS', err);
    });  
  }else{
    console.log(`We're missing sheet ID? ${sheetID}`);
  }
}


async function getSheet(id, email, key, output){
  const creds = {
    "private_key": key,
    "client_email": email
  };
  const doc = new GoogleSpreadsheet(id);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const fileList = [];
  Object.entries(doc.sheetsByTitle).forEach(async ([title, worksheet])=>{
    console.log(`Downloading ${title}...`);
    const CSV = await worksheet.downloadAsCSV();
    const location = `${output}/${title}.csv`;
    fileList.push(location);
    fs.writeFile(location, CSV, (err)=>{
      if(err){
        console.error(`Problem saving ${title}: ${err}`);
      }else{
        console.log(`Saved ${title} to ${location}`);
      }
    });
  })

  const meta = {
    sheetID:id,
    checked: new Date(),
    commit: process.env.COMMIT_SHA,
    sheets: Object.keys(doc.sheetsByTitle)
  }
  fs.writeFile(`${output}/meta.json`,JSON.stringify(meta),(err)=>{
    if(err){
      console.error(`Problem saving metadata: ${err}`);
    }else{
      console.log(`Saved metadata`);
    }
  });
  return fileList;
}

module.exports = {
  getSheet,
};