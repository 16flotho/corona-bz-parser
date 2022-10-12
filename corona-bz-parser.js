import fetch from 'node-fetch';
import fs from 'fs';

const topBarURL = "https://afbs.provinz.bz.it/upload/coronavirus/topbox.js";
const chartKh = "https://afbs.provinz.bz.it/upload/coronavirus/chart_DE_Kh30.js";
const chartQuar = "https://afbs.provinz.bz.it/upload/coronavirus/chart_DE_Quar.js";


let fieldnameMap = new Map([
    ["chardttPOS", "positiv"],
    ["chardttACT", "actPositiv"],
    ["chardttHEA", "geheilt"],
    ["chardttDEA", "verstorben"],
    ["chardttTESTED", "getestet"],
    ["chardttINZ", "7Tinzidenz"],
    ["chardttPOSRAT", "posRat"],
    ["Intensivbetten", "patInt"],
    ["Krankenhäuser", "patHos"], 
    ["Krankenhäuser Private", "patHosPriv"],
    ["Personen in Quarantäne/häuslicher Isolation", "quarantaene"]
]);

let date = new Date().toLocaleDateString('de-DE', { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Rome" });


Promise.all([
    fetch(topBarURL).then(parseTopBox),
    fetch(chartKh).then(parseChartData),
    fetch(chartQuar).then(parseChartData)
]).then(promises => {
    let data = {};
    Object.assign(data, ...promises)
    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync(`data/${date}.json`, JSON.stringify(data, null, 4));
}).catch(reason => {
    console.error(reason)
    console.error(date)
})

async function parseTopBox(res) {
    return new Promise(async (resolve, reject) => {
        let coronaData = {};
        let text = await res.text();
        let lines = text.split("\n");
        lines = lines.filter(entry => entry.includes("span") && !entry.includes("dateNow"));
        for(let i = 0; i < lines.length; i += 2) {
            let line = lines[i];
            if(lines[i + 1]?.includes(date)) {
                let parsedFieldname = fieldnameMap.get(line.substring(line.indexOf('chardtt'), line.lastIndexOf("'")))
                let data = line.substring(line.indexOf("<span>") + "<span>".length, line.indexOf('</span>')).split(" ")
                let value = data[0];
                let delta = data[1].replaceAll(/\(|\)/g, "");
                if(parsedFieldname != "posRat") {
                    coronaData[parsedFieldname] = parseInt(value);
                    coronaData[parsedFieldname + "_delta"] = parseInt(delta);
                } else {
                    coronaData[parsedFieldname] = value;
                    coronaData[parsedFieldname] += delta
                }
            } else {
                reject("Data is not up to date: " + lines[i + 1])
                return;
            }
        }
        resolve(coronaData)
    })
}

async function parseChartData(res) {
    return new Promise(async (resolve, reject) => {
        let coronaData = {};
        let text = await res.text();
        let chartData;
        eval(`chartData = new Object(` + (text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1)) + ")");
        let columns = chartData.data.columns;
        let dataRows = columns.length / 2;
        for(let i = 0; i < dataRows; i++) {
            let lastColumnElementIndex = columns[i].length - 1;
            if(date.includes(columns[i][lastColumnElementIndex])) {
                let fieldname = fieldnameMap.get(columns[i + dataRows][0]);
                coronaData[fieldname] = columns[i + dataRows][lastColumnElementIndex];
                coronaData[fieldname + "_delta"] = coronaData[fieldname] - columns[i + dataRows][lastColumnElementIndex - 1]
            } else {
                reject("Data is not up to date: " + columns[i][lastColumnElementIndex])
                return;
            }
        }
        resolve(coronaData)
    })
}
