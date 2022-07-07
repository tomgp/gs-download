#!/usr/bin/env node

require('dotenv').config();

const { program } = require('commander');
const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
program.parse();


let [sheetID, outdir] = program.args; // = '10x0DkhnDBOfAV8-cUbDeh1BBTQKuncwEozScRJZV4m4';

let creds = {
  "private_key": process.env.GOOGLE_PRIVATE_KEY,
  "client_email": process.env.GOOGLE_CLIENT_EMAIL
};

if(sheetID){
  if (!fs.existsSync(outdir)){
    fs.mkdirSync(outdir);
  }
  (async function() {
    const doc = new GoogleSpreadsheet(sheetID);
    await doc.useServiceAccountAuth(creds);
    await doc.loadInfo(); // loads document properties and worksheets
    
    Object.entries(doc.sheetsByTitle).forEach(async ([title, worksheet])=>{
      console.log(`Downloading ${title}...`);
      const CSV = await worksheet.downloadAsCSV();
      const location = `${outdir}/${title}.csv`;
      fs.writeFile(location, CSV, (err)=>{
        if(err){
          console.error(`Problem saving ${title}: ${err}`);
        }else{
          console.log(`Saved ${title} to ${location}`);
        }
      });
    })

    const meta = {
      sheetID,
      checked: new Date(),
      commit: process.env.COMMIT_SHA,
      sheets: Object.keys(doc.sheetsByTitle)
    }
    fs.writeFile(`${outdir}/meta.json`,JSON.stringify(meta),(err)=>{
      if(err){
        console.error(`Problem saving metadata: ${err}`);
      }else{
        console.log(`Saved metadata`);
      }
    });

  })()
  .catch(err=>{
    console.error('OOOPS', /*err*/);
  });  
}else{
  console.log(`We're missing sheet ID? ${sheetID}`);
}
