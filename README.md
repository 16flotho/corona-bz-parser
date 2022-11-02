# Corona South Tyrol parser and API
An *inofficial* parser and API for COVID-19-Data of South Tyrol from the website https://www.provinz.bz.it/sicherheit-zivilschutz/zivilschutz/aktuelle-daten-zum-coronavirus.asp. The data gets parsed daily and supplied via `https://16flotho.github.io/corona-bz-parser/` 

The data is additionally posted on Twitter on the Account [@CovidSuedtirol](https://twitter.com/CovidSuedtirol)

## Warning
Currently no hospital data can be fetched because no data is available

## Usage of the API
Use `https://16flotho.github.io/corona-bz-parser/data/<date>.json` to get the data of the specified date. \
The field `date` must be in the format `DD.MM.YYYY`

The badge below shows if there todays data is already parsed and available:
- Green: Todays data is fetched and available in the API
- Red: Todays data is not available yet.

[![parse-todays-corona-bz-data](https://github.com/16flotho/corona-bz-parser/actions/workflows/corona-bz-parser.yml/badge.svg)](https://github.com/16flotho/corona-bz-parser/actions/workflows/corona-bz-parser.yml)

## Usage of the parser

Clone the repo

### Installation

```node
npm install
```

### Run
```node
node corona-bz-parser.js
```

If data was fetched sucessfully an new file was generated at `data/<todays-date>.json`. If not a corresponding message is shown. 
