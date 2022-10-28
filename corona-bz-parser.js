import fetch from 'node-fetch';
import fs from 'fs';

const topBarURL = "https://afbs.provinz.bz.it/upload/coronavirus/topbox.js";
const chartKh = "https://afbs.provinz.bz.it/upload/coronavirus/chart_DE_Kh30.js";
const chartQuar = "https://afbs.provinz.bz.it/upload/coronavirus/chart_DE_Quar.js";


const fieldnameMap = new Map([
    ["chardttPOS", "positive"],
    ["chardttACT", "curPositive"],
    ["chardttHEA", "healed"],
    ["chardttDEA", "deceased"],
    ["chardttTESTED", "tested"],
    ["chardttINZ", "7Dincidence"],
    ["chardttPOSRAT", "posRat"],
    ["Intensivbetten", "patInt"],
    ["Krankenhäuser", "patHos"], 
    ["Krankenhäuser Private", "patHosPriv"],
    ["Personen in Quarantäne/häuslicher Isolation", "quarantine"]
]);

const date = new Date().toLocaleDateString('de-DE', { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Rome" });


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
    console.error(reason);
    return 1;
})

async function parseTopBox(res) {
    return new Promise(async (resolve, reject) => {
        let coronaData = {};
        const text = await res.text();
        let lines = text.split("\n");
        lines = lines.filter(entry => entry.includes("span") && !entry.includes("dateNow"));
        for(let i = 0; i < lines.length; i += 2) {
            const line = lines[i];
            if(lines[i + 1]?.includes(date)) {
                const parsedFieldname = fieldnameMap.get(line.substring(line.indexOf('chardtt'), line.lastIndexOf("'")))
                const data = line.substring(line.indexOf("<span>") + "<span>".length, line.indexOf('</span>')).split(" ")
                const value = data[0] ;
                const delta = data[1].replaceAll(/\(|\)/g, "");
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
        const text = await res.text();
        let chartData;
        eval(`chartData = new Object(` + (text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1)) + ")");
        const columns = chartData.data.columns;
        const dataRows = columns.length / 2;
        for(let i = 0; i < dataRows; i++) {
            const lastColumnElementIndex = columns[i].length - 1;
            if(date.includes(columns[i][lastColumnElementIndex])) {
                const fieldname = fieldnameMap.get(columns[i + dataRows][0]);
                coronaData[fieldname] = columns[i + dataRows][lastColumnElementIndex] ?? 0;
                coronaData[fieldname + "_delta"] = coronaData[fieldname] - columns[i + dataRows][lastColumnElementIndex - 1]
            } else {
                reject("Data is not up to date: " + columns[i][lastColumnElementIndex])
                return;
            }
        }
        resolve(coronaData)
    })
}
