function doGet(e) {
  const udise = (e.parameter.udise || "").toString().trim();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schoolSheet = ss.getSheetByName("Schools");
  const dataSheet = ss.getSheetByName("Data") || ss.insertSheet("Data");
  
  const schoolData = schoolSheet.getDataRange().getValues();
  let schoolName = "";
  let foundInMaster = false;

  // 1. Find school name in Master List (Range A2:A292)
  const searchLimit = Math.min(schoolData.length, 292);
  for (let i = 1; i < searchLimit; i++) {
    if (schoolData[i][0] && schoolData[i][0].toString().trim() === udise) {
      schoolName = schoolData[i][1];
      foundInMaster = true;
      break;
    }
  }

  if (!foundInMaster) {
    return ContentService.createTextOutput(JSON.stringify({ error: "School not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Search for existing data in "Data" sheet
  let mappedData = null;
  if (dataSheet.getLastRow() > 0) {
    const existingData = dataSheet.getDataRange().getValues();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0] && existingData[i][0].toString().trim() === udise) {
        mappedData = {
          isOperated: existingData[i][2],
          centerCount: existingData[i][3],
          distanceCenterCount: existingData[i][4],
          extraRoom: existingData[i][5],
          openSpace: existingData[i][6],
          buildingStatus: existingData[i][7],
          buildingStatusCount: existingData[i][8],
          lastUpdated: existingData[i][9]
        };
        break;
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ 
    udise: udise, 
    schoolName: schoolName,
    existingData: mappedData
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const udise = params.udise.toString().trim();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Data") || ss.insertSheet("Data");
    
    // Ensure headers exist
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "UDISE Code", 
        "School Name", 
        "विद्यालय में आंगनबाड़ी संचालित है अथवा नहीं", 
        "यदि संचालित है तो केन्द्रों की संख्या", 
        "200मी दूरी पर केन्द्रों की संख्या", 
        "अतिरिक्त कक्ष उपलब्ध है/नहीं", 
        "परिसर में खुले स्थान की उपलब्धता", 
        "भवन की स्थिति", 
        "भवन में संचालित केन्द्रों की संख्या",
        "Last Updated"
      ]);
    }
    
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() === udise) {
        rowIndex = i + 1;
        break;
      }
    }

    const rowData = [
      udise,
      params.schoolName,
      params.isOperated,
      params.centerCount || "",
      params.distanceCenterCount || "",
      params.extraRoom || "",
      params.openSpace || "",
      params.buildingStatus || "",
      params.buildingStatusCount || "",
      new Date()
    ];

    let action = "saved";
    if (rowIndex > -1) {
      // Update the specific row
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      action = "updated";
    } else {
      // Create new row
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, action: action }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
