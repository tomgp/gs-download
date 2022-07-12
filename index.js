#!/usr/bin/env node

//require('dotenv').config();
import dotenv from 'dotenv';
dotenv.config();
import { csvParse } from 'd3-dsv';
//const package = require('./package.json');
import { program }  from 'commander';
import * as fs from 'fs';
import { GoogleSpreadsheet } from 'google-spreadsheet';

import { fileURLToPath } from 'url';
import process from 'process';


if (process.argv[1] === fileURLToPath(import.meta.url)) {
  program
    .name('gs-download')
    //.version(package.version)
    .option('-j, --json [type]','output as json wit an option to use a plugin', false)
    .option('-r, --report','output a report', false)
    .parse(process.argv);

  const options = program.opts();

  program.parse();
  let [sheetID, outdir] = program.args; // e.g. '10x0DkhnDBOfAV8-cUbDeh1BBTQKuncwEozScRJZV4m4';

  if(sheetID){
    if (!fs.existsSync(outdir)){
      fs.mkdirSync(outdir);
    }
    getSheet(sheetID, process.env.GOOGLE_CLIENT_EMAIL, process.env.GOOGLE_PRIVATE_KEY, outdir, options)
    .catch(err=>{
      console.error('OOOPS', err);
    });  
  }else{
    console.log(`We're missing sheet ID? ${sheetID}`);
  }
}


async function getSheet(id, email, key, output, options){
  const creds = {
    "private_key": key,
    "client_email": email
  };
  const doc = new GoogleSpreadsheet(id);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  
  Object.entries(doc.sheetsByTitle).forEach(async ([title, worksheet])=>{
    console.log(`Downloading ${title}...`);
    const CSV = await worksheet.downloadAsCSV();
    if(options.json === false){
      const location = `${output}/${title}.csv`;
      fs.writeFile(location, CSV, (err)=>{
        if(err){
          console.error(`Problem saving CSV ${title}: ${err}`);
        }else{
          console.log(`Saved ${title} to ${location}`);
        }
      });
    }else if(options.json){
      let JSONdata = csvParse(CSV.toString());
      const location = `${output}/${title}.json`;

      if(options.json === "structured"){
        JSONdata = JSONdata.map(structuredRow)
      }

      fs.writeFile(location, JSON.stringify(JSONdata), (err)=>{
        if(err){
          console.error(`Problem saving JSON ${title}: ${err}`);
        }else{
          console.log(`Saved ${title} to ${location}`);
        }
      });
    }
  });

  if(options.report){
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
  }
}

function structuredRow(row){
  const newRow = {};
  let ignore = false;
  const listExpression = new RegExp(/^\[.+\]$/, 'i');
  Object.entries(row).forEach(([key, value])=>{
    if(key === '_ignore' && value){
      ignore=true;
    }else if(key.indexOf('_') == 0){
      // if there is anything starting with an underscore skip that column it. 
    }else if(key.indexOf('.') > 0){
      let elements = key.split('.');
      console.log(elements);
      newRow = addProps(newRow, elements, value);
    }else if(listExpression.test(key)){
      let keyName = key.split(/[\[\]]/)[1];
      let parsedValue = value.split(',').map(e=>String(e).trim());
      newRow[keyName] = parsedValue;
    }else{
      newRow[key] = value;
    }
  })
  if(!ignore){
    return newRow;
  }
}

function addProps(o, elements, value){
  let newO = {};
  newO[elements[0]] = o[elements[0]] || {};
  const tmpObj = o[elements[0]];
  if (elements.length > 1) {
    elements.shift();
    addProps(tmpObj, elements, value);
  }else{
    newO[elements[0]] = value;
  }
  return newO;
}

export default {
  getSheet,
  structuredRow
};