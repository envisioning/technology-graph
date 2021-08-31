 
# Scripts
## Scripts helpers to scrape data for TG

1 - Wikipedia Relationship Parser (wikipedia.js)

Usage

```javascript
npm install
node wikipedia.js [--in-ctx]
```

--in-ctx : runs over wikipedia only using techs that only exists within the database (technology folder), ommited it will trace all relationships (within wikipedia) of found techs.

Obs : techs in not-found.txt means that we have to change their names so we can find them on wikipedia.