//import * as fs from 'node:fs';
const fs = require("fs");
const { parse } = require("csv-parse");

const days = [];
fs.createReadStream('pvwatts_hourly_data.csv')
.pipe(
    parse({
      delimiter: ",",
      columns: true,
      ltrim: true,
      bom: true,
    })
  )
  .on("data", function (row) {
    // 👇 push the object row into the array
    days.push(row);
  })
  .on("error", function (error) {
    console.log(error.message);
  })
  .on("end", function () {
    // 👇 log the result array
    //console.log(days[0]);
    days.forEach(day => {
        day['Beam Irradiance (W/m^2)'] = {'value': day['Beam Irradiance (W/m^2)'], 'unit': 'W/m^2'};
        delete Object.assign(day, {'Beam Irradiance': day['Beam Irradiance (W/m^2)'] })['Beam Irradiance (W/m^2)'];
        day['Diffuse Irradiance (W/m^2)'] = {'value': day['Diffuse Irradiance (W/m^2)'], 'unit': 'W/m^2'};
        delete Object.assign(day, {'Diffuse Irradiance': day['Diffuse Irradiance (W/m^2)'] })['Diffuse Irradiance (W/m^2)'];
        day['Ambient Temperature (C)'] = {'value': day['Ambient Temperature (C)'], 'unit': 'C'};
        delete Object.assign(day, {'Ambient Temperature': day['Ambient Temperature (C)'] })['Ambient Temperature (C)'];
        day['Wind Speed (m/s)'] = {'value': day['Wind Speed (m/s)'], 'unit': 'm/s'};
        delete Object.assign(day, {'Wind Speed': day['Wind Speed (m/s)'] })['Wind Speed (m/s)'];
        day['Plane of Array Irradiance (W/m^2)'] = {'value': day['Plane of Array Irradiance (W/m^2)'], 'unit': 'W/m^2'};
        delete Object.assign(day, {'Plane of Array Irradiance': day['Plane of Array Irradiance (W/m^2)'] })['Plane of Array Irradiance (W/m^2)'];
        day['Cell Temperature (C)'] = {'value': day['Cell Temperature (C)'], 'unit': 'C'};
        delete Object.assign(day, {'Cell Temperature': day['Cell Temperature (C)'] })['Cell Temperature (C)'];
        day['DC Array Output (W)'] = {'value': day['DC Array Output (W)'], 'unit': 'W'};
        delete Object.assign(day, {'DC Array Output': day['DC Array Output (W)'] })['DC Array Output (W)'];
        day['AC System Output (W)'] = {'value': day['AC System Output (W)'], 'unit': 'W'};
        delete Object.assign(day, {'AC System Output': day['AC System Output (W)'] })['AC System Output (W)'];
    });
// legnagyobb DC Array Output 
    let biggest = days[0];
    days.forEach(day => {
      if (day['Month'] !== 'Totals' && parseInt(day['DC Array Output']['value']) > parseInt(biggest['DC Array Output']['value'])){
        biggest = day;
      }
    });
    //console.log(biggest);

//legkisebb DC Array Output
    let smallest = biggest;
    days.forEach(day => {
      if (day['Month'] !== 'Totals' && parseInt(day['DC Array Output']['value']) < parseInt(smallest['DC Array Output']['value'])){
        smallest = day;
      }
    });
    //console.log(smallest);

//DC Array Output havi bontás
    let monthly = [];
    for (let a = 1; a <= 12; a++){
      monthly.push({[a]:0})
    }
    for (let b = 1; b <= 12; b++){
      days.forEach(day => {
        if (parseInt(day['Month']) === b){
          monthly[b-1][b] += parseInt(day['DC Array Output']['value']);
        }
      });
    }   
    //console.log(monthly);
//DC Array Output éves összeg
    let yearSum = 0;
    for (let c = 0; c < monthly.length; c++){
      yearSum += monthly[c][c+1];
    }
    //console.log(yearSum);
//DC Array Output éves átlag
    let average = yearSum / monthly.length;
    //console.log(average);
//Szórás havi szinten
    let deviation = [];
    for (let d = 0; d < monthly.length; d++){
      deviation.push({[d+1]:deviationCalc(monthly[d][d+1], average)})
    }
   // console.log(deviation);
//DC Array Output havi bontás adatstruktúra
    let lengthOfMonth = [];
    for (let e = 0; e < monthly.length; e++){
      lengthOfMonth.push({[e+1]:monthLengthCalc(e+1)})
    }
    const months = [];
    for (let e = 0; e < monthly.length; e++){
      months.push({
        'avg': Math.floor(monthly[e][e+1] / lengthOfMonth[e][e+1]),
        'σ': deviation[e][e+1]
      });
    }
   // console.log(months);
//Hónapok növekvő sorrendben DC Array Output szerint
    let ascendingMonths = monthly.sort((a,b) => Object.values(a)-Object.values(b));
  //  console.log(ascendingMonths);
//Hónapok csökkenő sorrendben DC Array Output szerint
    let descendingMonths = monthly.sort((a,b) => Object.values(b)-Object.values(a));
  //  console.log(descendingMonths);
// DC Array Output napi szinten
    let monthsDailyOutput = [];
    for (let a = 0; a < lengthOfMonth.length; a++){
    monthsDailyOutput.push([]);
    for (let b = 1; b <= lengthOfMonth[a][a+1]; b++){
    monthsDailyOutput[a].push({[b]: dailySpecCalc((a+1).toString(), b.toString(), 'DC Array Output')});
      }
    }
    //console.log(monthsDailyOutput);
//Napok növekvő sorrendben DC Array Output szerint
    let ascendingDailyOutput = [];
    monthsDailyOutput.forEach(item => {
      item = item.sort((a,b) => Object.values(a) - Object.values(b));
      ascendingDailyOutput.push(item);
    });
  //  console.log(ascendingDailyOutput);
//Napok csökkenő sorrendben DC Array Output szerint
let descendingDailyOutput = [];
monthsDailyOutput.forEach(item => {
  item = item.sort((a,b) => Object.values(b) - Object.values(a));
  descendingDailyOutput.push(item);
});
//console.log(descendingDailyOutput);
//Legmelegebb nap
let warmest = days[0];
let monthsDailyTempWarm = [];
for (let a = 0; a < lengthOfMonth.length; a++){
  for (let b = 1; b <= lengthOfMonth[a][a+1]; b++){
  monthsDailyTempWarm.push(dailyAverageCalc((a+1).toString(), b.toString(), 'Ambient Temperature'));
    }
  }
  monthsDailyTempWarm = monthsDailyTempWarm.sort((a,b) => b['Average'] - a['Average']);
  warmest = monthsDailyTempWarm[0];
  console.log(warmest);
//Leghidegebb nap
let coldest = days[0];
let monthsDailyTempCold = [];
for (let a = 0; a < lengthOfMonth.length; a++){
  for (let b = 1; b <= lengthOfMonth[a][a+1]; b++){
  monthsDailyTempCold.push(dailyAverageCalc((a+1).toString(), b.toString(), 'Ambient Temperature'));
    }
  }
  monthsDailyTempCold = monthsDailyTempCold.sort((a,b) => a['Average'] - b['Average']);
  coldest = monthsDailyTempCold[0];
  console.log(coldest);
// Legszelesebb nap
let windy = days[0];
let mostWindDaily = [];
for (let a = 0; a < lengthOfMonth.length; a++){
  for (let b = 1; b <= lengthOfMonth[a][a+1]; b++){
  mostWindDaily.push(dailyAverageCalc((a+1).toString(), b.toString(), 'Wind Speed'));
    }
  }
  mostWindDaily = mostWindDaily.sort((a,b) => b['Average'] - a['Average']);
  windy = mostWindDaily[0];
  console.log(windy);
// Leg szélmentesebb nap
let notWindy = days[0];
let leastWindDaily = [];
for (let a = 0; a < lengthOfMonth.length; a++){
  for (let b = 1; b <= lengthOfMonth[a][a+1]; b++){
  leastWindDaily.push(dailyAverageCalc((a+1).toString(), b.toString(), 'Wind Speed'));
    }
  }
  leastWindDaily = leastWindDaily.sort((a,b) => a['Average'] - b['Average']);
  notWindy = leastWindDaily[0];
  console.log(notWindy);
    });


let dailyAverageCalc = (month, day, spec) =>{
  let dailyAverage = {"Month": 0, "Day": 0, "Average": 0};
  days.forEach(element => {
    if (element['Month'] === month && element['Day'] === day){
      dailyAverage['Month'] = month;
      dailyAverage['Day'] = day;
      dailyAverage['Average'] += (parseInt(element[spec]['value']))/24;
    }
  });
  return dailyAverage;
  };

let dailySpecCalc = (month, day, spec) =>{
  let dailyOutput = 0;
    days.forEach(element => {
      if (element['Month'] === month && element['Day'] === day){
        dailyOutput += parseInt(element[spec]['value']);
      }
    });
    return dailyOutput;
  }


let deviationCalc = (num1, num2) =>{
  let numAverage = (num1+num2)/ 2;
  let difference1 = num1 - numAverage;
  let difference2 = num2 - numAverage;
  let pow1 = Math.pow(difference1, 2);
  let pow2 = Math.pow(difference2, 2);
  let powAverage = (pow1+pow2) / 2;
  let dev = Math.sqrt(powAverage);
  return dev
}

let monthLengthCalc = (num) =>{
  let sumOfDays = 0;
  days.forEach(day => {
    if (parseInt(day['Month']) === num){
      sumOfDays += 1;
    }
  });
  return sumOfDays / 24;
}