const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const technology_folder = '../technology/';

const wikipedia_search_template = (find) => {
  return `https://en.wikipedia.org/w/index.php?title=Special%3AWhatLinksHere&target=${find}&namespace=&limit=500`
}

async function parseWikipediaRelations(tech) {
  const map_point = wikipedia_search_template(tech);
  // console.log(map_point);
  let final_url = encodeURI(decodeURI(map_point)).replace("%25", '%');
  return await axios
      .get(final_url)
      .then((res) => {
        //all the cool kids love $
        let $ = cheerio.load(res.data);

        let displaydItems = $("#mw-content-text > hr + p");
        if(displaydItems) {

          let tech_list = '';
          let tech_related_raw = $("#mw-whatlinkshere-list li a");


          let iterations = tech_related_raw.length;
          

          for(var prop in tech_related_raw) {
            
            let cursor = tech_related_raw[prop];
            //horrible
            
            if (cursor) {
              if(cursor.name = "a") {
                let href = (cursor.attribs.href);
                let title = (cursor.attribs.title);

                let definer = 'default';
                title = title.split(":");
                if(title[1]) {
                  definer = title[0];
                  title = title[1];
                }

                if((title != 'WhatLinksHere') && !(href.includes("action=edit")) && (definer == 'default')) {
                  // tech_list = tech_list.concat('[[', title, ']]', ' - ', href, ' - wikipedia_status: ', definer, '\n');
                  tech_list = tech_list.concat('[[', title, ']]', '\n');
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
        // console.log(error);
        console.log("not there");
        return false;
      })
}


fs.readdir(technology_folder, (err, files) => {
  files.forEach(file => {
    let tech_string = file.replace('.md', '');
    parseWikipediaRelations(tech_string).then((result) => {
      // console.log(result);
      if(result) {
        fs.writeFile(`./wikipedia-parse/${tech_string}.md`, result, 'utf8', function() {
          console.log("file")
        }); 
      }

    });
    
    return false;
  });
});