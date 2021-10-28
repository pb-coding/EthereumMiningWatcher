var sheetLaufzeiten = SpreadsheetApp.getActive().getSheetByName('Laufzeiten');
var sheetDaten = SpreadsheetApp.getActive().getSheetByName('Mining Chart');
var minerStatus = false;
var cellColumnReference = 1; //Wo ist die Datum & Uhrzeit Spalte
var perKiloWattCosts = sheetDaten.getRange(16,2).getValue(); //Position wo Wattkosten stehen
var trexRequest = 'http://philippbeckmann.de:4067/summary';

function checkMyMiners() {
  
  try {
    var response = UrlFetchApp.fetch(trexRequest);
    Logger.log(response.getContentText());
    minerStatus = true;
    Logger.log("Request erfolgreich.");
    var trexData = JSON.parse(response.getContentText());
    Logger.log(trexData);
    var wattUsage = trexData.gpus[0].power_avr;
    Logger.log("Watt Usage: "+ wattUsage);
  }
  catch (e) {
    minerStatus = false;
    Logger.log("Request nicht erfolgreich.");
    var wattUsage = sheetLaufzeiten.getRange(checkDates(sheetLaufzeiten),cellColumnReference+3).getValue();
  }

  var cellRowReference = checkDates(sheetLaufzeiten)+1;
  var lastMinerStatus = sheetLaufzeiten.getRange(cellRowReference-1, cellColumnReference+2).getValue();

  if (lastMinerStatus != minerStatus) {
    Logger.log("Statusänderung festgestellt!");
    makeEntry(sheetLaufzeiten, cellRowReference, minerStatus, wattUsage, lastMinerStatus);
  }
  else {
    Logger.log("Keine Statusänderung festgestellt.")
  }
  
}

function checkDates(sheet) {
    var timestamps = sheet.getRange("A1:A").getValues();
    var last_stamp = timestamps.filter(String).length;
    return last_stamp;
    
}

function makeEntry(sheet, cellRowReference, minerStatus, wattUsage, lastMinerStatus) {
  createTimeStamp(sheet, cellRowReference, cellColumnReference);
  var timeDifference = writeTimeDifference(sheet, cellRowReference, cellColumnReference);
  sheet.getRange(cellRowReference, cellColumnReference+2).setValue(minerStatus); //Miner Status schreiben
  sheet.getRange(cellRowReference, cellColumnReference+3).setValue(wattUsage); //Watt Verbrauch schreiebn
  calculateEnergyCosts(sheet, cellRowReference, cellColumnReference, lastMinerStatus, timeDifference, wattUsage);
  
}


function createTimeStamp(sheet, cellRowReference, cellColumnReference) {
    var timedate_now = Utilities.formatDate(new Date(), "GMT+1", "dd.MM.yyyy' 'HH:mm:ss");
    sheet.getRange(cellRowReference, cellColumnReference).setValue(timedate_now);
}

function writeTimeDifference(sheet, cellRowReference, cellColumnReference) {
    var timestamp_new = sheet.getRange(cellRowReference, cellColumnReference).getValue();
    var timestamp_old = sheet.getRange(cellRowReference -1, cellColumnReference).getValue();
    var time_difference = parseFloat(Math.floor((timestamp_new - timestamp_old)))/1000/60/60;
    Logger.log(time_difference);
    sheet.getRange(cellRowReference, cellColumnReference +1).setValue(time_difference);
    return time_difference;
}

function calculateEnergyCosts(sheet, cellRowReference, cellColumnReference,lastMinerStatus, timeDifference, wattUsage) {
  
  if (lastMinerStatus == true) {
    Logger.log("Kilowatt Kosten: " + perKiloWattCosts);
    var energyCosts = timeDifference * wattUsage / 1000 * perKiloWattCosts;
  }

  else {
    var energyCosts = 0;
    
  }

  sheet.getRange(cellRowReference, cellColumnReference+4).setValue(energyCosts); //Energie Kosten schreiben
}