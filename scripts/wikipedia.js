/*
* TODO: optmize script by doing paralell assync requests + axios interceptors to 
* remake 429 and other wikipedia blocked requests until parse everything possible
*/

const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const args = process.argv.slice(2);

const technology_folder = '../technology/';
const in_ctx = (args[0] == '--in-ctx');

let save_folder;
if(in_ctx) {
  save_folder = "./wikipedia-parse-ctx/";
} else {
  save_folder = "./wikipedia-parse-non-ctx/";
}

const not_there_list = [];
const should_repeat_list = [];

const wikipedia_search_template = (find) => {
  return `https://en.wikipedia.org/w/index.php?title=Special%3AWhatLinksHere&target=${find}&namespace=&limit=500`
}

function shouldAddToList(tech, title, href, definer, files, title_log) {
  
  if(in_ctx) {
  
    if ((title != 'WhatLinksHere') && !(href.includes("action=edit")) 
      && (definer == 'default') && (files.indexOf(`${title}.md`) > -1)  && 
      (title != tech)  && (title_log.indexOf(title) == -1)) {
        return true;
    } else {
      return false;
    }

  } else {
    if ((title != 'WhatLinksHere') && !(href.includes("action=edit")) &&
       (definer == 'default') && (title != tech) && (title_log.indexOf(title) == -1)) {
        return true;
    } else {
      return false;
    }
  } 
}

async function parseWikipediaRelations(tech, _files, delay, round) {
  let final_url = encodeURI(
    decodeURI(
        wikipedia_search_template(tech)
    )).replace("%25", '%');
  
  console.log(tech, " - Round:", round, "/", _files.length);
  if(round == _files.length) delay = true;

  if(delay) await new Promise(resolve => setTimeout(resolve, 5000));

  return await axios
      .get(final_url)
      .then((res) => {
        console.log("Parsing Techs from:", tech)
        //all the cool kids love $
        let $ = cheerio.load(res.data);

        let displaydItems = $("#mw-content-text > hr + p");
        
        if(displaydItems) {

          let tech_list = '';
          let tech_related_raw = $("#mw-whatlinkshere-list li a");

          let iterations = tech_related_raw.length+1;
          let old_titles = [];
  
          for(var prop in tech_related_raw) {
            
            let cursor = tech_related_raw[prop];
            
            //horrible
            if (cursor) {
              if(cursor.name == "a") {
                let href = 'null';
                let title = 'null';

                if(cursor.attribs) {
                  href = cursor.attribs.href;
                  title = cursor.attribs.title;
                } else {
                  console.log("=======================");
                  console.log(cursor);
                  console.log("=======================");
                }
                let definer = 'default';
                title = title.split(":");

                if(title[1]) {
                  definer = title[0];
                  title = title[1];
                } else {
                  title = title[0];
                }


                if(shouldAddToList(tech, title, href, definer, _files, old_titles)) {
                  tech_list = tech_list.concat('[[', title, ']]', '\n');
                  old_titles.push(title);
                }

              }  
            }

            if (!--iterations) {
              return tech_list;
            }
          }
        } 

        return [];
      })
      .catch((error) => {
        let status = 0;

        if (error.response) {
          status = error.response.status
        }

        if (status == 404) {
          console.log("not present, ", tech);
          not_there_list.push(tech);
          fs.writeFile(`${save_folder}/not-found.txt`, not_there_list.join('\n'), 'utf8', function() {
          }); 
          return false;
        }

        if (status == 0 || status == 429 || status != 404) {
          console.log("not able to retrieve,", tech);
          should_repeat_list.push(`${tech} - ${status} - ${error}`);
          fs.writeFile(`${save_folder}/should-repeat.txt`, should_repeat_list.join('\n'), 'utf8', function() {
          });
          return false;
        }

        return false;
  })
}

(async ()=>{
    try {
        const files = await fs.promises.readdir(technology_folder);
        let iterations = files.length;
        let iterator = 1;
        console.log("Techs in folder: ", iterations);
        
        for( const file of files ) {
          let tech_string = file.replace('.md', '');
          
          await parseWikipediaRelations(tech_string, files, false, iterator++).then((result) => {
              if(result) {
                fs.writeFile(`${save_folder}${tech_string}.md`, result, 'utf8', function() {
                  console.log("Parsed, ", tech_string);
                });  
              }
          });
        }

    } catch( e ) {
        // Catch anything bad that happens
        console.error( "We've thrown! Whoops!", e );
    }

})(); 