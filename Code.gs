const ENTRY_SHEET="Entries";
const SETTINGS_SHEET="Settings";
const ENTRY_HEADERS=["date","pages","learningMinutes","sport","compliantMeals","workActions","expenses","updatedAt","cigaretteSmoked"];

function setupSystem(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  let entries=ss.getSheetByName(ENTRY_SHEET);
  if(!entries) entries=ss.insertSheet(ENTRY_SHEET);
  if(entries.getLastRow()===0) entries.getRange(1,1,1,ENTRY_HEADERS.length).setValues([ENTRY_HEADERS]);
  else{
    const headers=entries.getRange(1,1,1,Math.max(entries.getLastColumn(),1)).getValues()[0].map(String);
    ENTRY_HEADERS.forEach(h=>{if(!headers.includes(h)){entries.getRange(1,entries.getLastColumn()+1).setValue(h);headers.push(h);}});
  }
  let settings=ss.getSheetByName(SETTINGS_SHEET);
  if(!settings) settings=ss.insertSheet(SETTINGS_SHEET);
  if(settings.getLastRow()===0) settings.getRange(1,1,2,2).setValues([["key","value"],["monthlyBudget",1000]]);
  else{
    const v=settings.getDataRange().getValues();
    if(!v.some((r,i)=>i>0&&String(r[0])==="monthlyBudget")) settings.appendRow(["monthlyBudget",1000]);
  }
}
function jsonOutput(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function headerMap_(sh){const h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String),m={};h.forEach((x,i)=>m[x]=i);return m;}
function readSettings_(){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SETTINGS_SHEET);if(!sh)return{monthlyBudget:1000};
  const v=sh.getDataRange().getValues(),o={};for(let i=1;i<v.length;i++)if(v[i][0])o[String(v[i][0])]=v[i][1];
  if(o.monthlyBudget==null)o.monthlyBudget=1000;return o;
}
function readEntries_(){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ENTRY_SHEET);if(!sh||sh.getLastRow()<2)return[];
  const m=headerMap_(sh),v=sh.getRange(2,1,sh.getLastRow()-1,sh.getLastColumn()).getValues();
  return v.filter(r=>r[m.date]).map(r=>{const c=m.cigaretteSmoked==null?"":r[m.cigaretteSmoked];return{
    date:Utilities.formatDate(new Date(r[m.date]),Session.getScriptTimeZone(),"yyyy-MM-dd"),
    pages:Number(r[m.pages])||0,learningMinutes:Number(r[m.learningMinutes])||0,sport:Boolean(r[m.sport]),
    compliantMeals:Number(r[m.compliantMeals])||0,workActions:Number(r[m.workActions])||0,expenses:Number(r[m.expenses])||0,
    updatedAt:r[m.updatedAt],cigaretteSmoked:c===true||c==="TRUE"?true:c===false||c==="FALSE"?false:null};});
}
function saveEntry_(e){
  if(!e||!e.date)throw new Error("Date obligatoire");
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ENTRY_SHEET);if(!sh)throw new Error("Lancez setupSystem() d'abord.");
  const m=headerMap_(sh),last=sh.getLastRow();let row=-1;
  if(last>=2){const d=sh.getRange(2,m.date+1,last-1,1).getValues();for(let i=0;i<d.length;i++){if(!d[i][0])continue;
    if(Utilities.formatDate(new Date(d[i][0]),Session.getScriptTimeZone(),"yyyy-MM-dd")===String(e.date).slice(0,10)){row=i+2;break;}}}
  if(row<0)row=sh.getLastRow()+1;
  const vals={date:new Date(String(e.date)+"T12:00:00"),pages:Number(e.pages)||0,learningMinutes:Number(e.learningMinutes)||0,
    sport:Boolean(e.sport),compliantMeals:Number(e.compliantMeals)||0,workActions:Number(e.workActions)||0,
    expenses:Number(e.expenses)||0,updatedAt:new Date(),cigaretteSmoked:e.cigaretteSmoked===true?true:e.cigaretteSmoked===false?false:""};
  Object.keys(vals).forEach(k=>{if(m[k]!=null)sh.getRange(row,m[k]+1).setValue(vals[k]);});return{ok:true};
}
function doGet(e){try{const a=e&&e.parameter&&e.parameter.action||"state";if(a==="state")return jsonOutput({ok:true,entries:readEntries_(),settings:readSettings_()});return jsonOutput({ok:false,error:"Action inconnue"});}catch(x){return jsonOutput({ok:false,error:String(x)});}}
function doPost(e){try{const b=JSON.parse(e.postData.contents||"{}");if(b.action==="saveEntry")return jsonOutput(saveEntry_(b.entry));return jsonOutput({ok:false,error:"Action inconnue"});}catch(x){return jsonOutput({ok:false,error:String(x)});}}
