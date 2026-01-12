const pdf = require('html-pdf');
const moment = require('moment');

function generateFarmerAgreementHTML(farmerData) {
  const {
    farmerName = '',
    farmerCode = '',
    villageName = '',
    blockName = '',
    districtName = '',
    stateName = '',
    villageCode = '',
    dateOfRegistration = ''
  } = farmerData;

  const formattedDate = dateOfRegistration 
    ? moment(dateOfRegistration).format('DD-MM-YYYY') 
    : moment().format('DD-MM-YYYY');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      line-height: 1.6;
    }
    h1 {
      text-align: center;
      font-size: 16px;
      margin-bottom: 20px;
    }
    .header-info {
      margin-bottom: 20px;
    }
    .section {
      margin-bottom: 15px;
    }
    .section-title {
      font-weight: bold;
      margin-bottom: 10px;
    }
    .terms {
      margin-left: 20px;
    }
    .signature-section {
      margin-top: 40px;
      display: table;
      width: 100%;
    }
    .signature-left, .signature-right {
      display: table-cell;
      width: 50%;
      vertical-align: top;
    }
    .signature-right {
      text-align: right;
    }
  </style>
</head>
<body>
  <h1>PROJECT SAMRUDDHI FARMER AGREEMENT<br/>ప్రాజెక్ట్ సమృద్ధి రైతు ఒప్పంద పత్రం</h1>
  
  <div class="header-info">
    <p><strong>Date/ తేదీ:</strong> ${formattedDate}</p>
    <p><strong>Farmer / Grower Name/ రైతు పేరు:</strong> ${farmerName}</p>
    <p><strong>Farmer ID:</strong> ${farmerCode} &nbsp;&nbsp;&nbsp; <strong>Village:</strong> ${villageName} &nbsp;&nbsp;&nbsp; <strong>Taluka:</strong> ${blockName}</p>
    <p><strong>District:</strong> ${districtName} &nbsp;&nbsp;&nbsp; <strong>State:</strong> ${stateName} &nbsp;&nbsp;&nbsp; <strong>Pin Code:</strong> ${villageCode}</p>
  </div>

  <div class="section">
    <div class="section-title">Terms of Agreement / ఒప్పంద నిబంధనలు</div>
    <p>It is understood and agreed that the following statement is correct: / ఒప్పందంలోని ఈ క్రింది నిబంధనలను నేను అర్థం చేసుకున్నాను మరియు అంగీకరిస్తున్నాను:</p>
  </div>

  <div class="terms">
    <p><strong>1.</strong> You, as the Grower / Landowners and/or Lessees agree to participate under the Grouped Project "Responsible Rice Program - Project Samruddhi" that will be formally registered, and thereafter you agree to voluntarily participate in activities that enable the project to issue carbon credits.<br/>
    మీరు, పెంపకందారు / భూ యజమానులు మరియు/లేదా లీజుదారులుగా అధికారికంగా నమోదు చేయబడే గ్రూప్డ్ ప్రాజెక్ట్ "బాధ్యతాయుతమైన వరి కార్యక్రమం - ప్రాజెక్ట్ సమృద్ధి" కింద పాల్గొనడానికి అంగీకరిస్తున్నారు మరియు ఆ తర్వాత ప్రాజెక్ట్ కార్బన్ క్రెడిట్లను జారీ చేయడానికి వీలు కల్పించే కార్యకలాపాలలో స్వచ్ఛందంగా పాల్గొనడానికి మీరు అంగీకరిస్తున్నారు.</p>

    <p><strong>2.</strong> You agree to assign to String Bio Private Limited (String Bio) the benefits of the GHG emission reductions from adopting the practices as recommended under the project. Accordingly, String Bio will be entitled to sell these as carbon credits to finance the project.<br/>
    ప్రాజెక్ట్ కింద సిఫార్సు చేయబడిన పద్ధతులను అనుసరించడం వల్ల కలిగే గ్రీన్హౌస్ వాయు ఉద్గార తగ్గింపుల ప్రయోజనాలను స్ట్రింగ్ బయో ప్రైవేట్ లిమిటెడ్ (స్ట్రింగ్ బయో)కి బదిలీ చేయడానికి మీరు అంగీకరిస్తున్నారు. దీని ప్రకారం, స్ట్రింగ్ బయో వీటిని ప్రాజెక్ట్కు ఆర్థిక సహాయం చేయడానికి కార్బన్ క్రెడిట్లుగా విక్రయించడానికి అర్హత పొందుతుంది.</p>

    <p><strong>3.</strong> You agree to adopt the following practices as part of Project Samruddhi:<br/>
    ప్రాజెక్ట్ ప్రోస్పెరిటీలో భాగంగా మీరు ఈ క్రింది వ్యవసాయ పద్ధతులను అవలంబించడానికి అంగీకరిస్తున్నారు:<br/>
    &nbsp;&nbsp;&nbsp;• Apply CleanRise product on the field as per the protocol shared by the SeedWorks or String Bio field team<br/>
    &nbsp;&nbsp;&nbsp;• సీడ్వర్క్స్ లేదా స్ట్రింగ్ బయో ఫీల్డ్ టీమ్ పంచుకున్న ప్రోటోకాల్ ప్రకారం పొలంలో క్లీన్రైస్ ఉత్పత్తిని ఉపయోగించండి<br/>
    &nbsp;&nbsp;&nbsp;• Conduct water management practices as shared by the SeedWorks or String field team<br/>
    &nbsp;&nbsp;&nbsp;• సీడ్వర్క్స్ లేదా స్ట్రింగ్ ఫీల్డ్ టీమ్ పంచుకున్న నీటి నిర్వహణ పద్ధతులను నిర్వహించండి</p>

    <p><strong>4.</strong> You agree that at the time of registration for the project, you are prepared to voluntarily provide data that includes your personal information, GPS location, photographs, land information, and contact details. You agree to String Bio processing such data for the purpose of this arrangement.<br/>
    ప్రాజెక్ట్ కోసం రిజిస్ట్రేషన్ సమయంలో, మీ వ్యక్తిగత సమాచారం, GPS స్థానం, ఛాయాచిత్రాలు, భూమి సమాచారం మరియు సంప్రదింపు వివరాలతో కూడిన డేటాను స్వచ్ఛందంగా అందించడానికి మీరు సిద్ధంగా ఉన్నారని మీరు అంగీకరిస్తున్నారు. ఈ అమరిక కోసం స్ట్రింగ్ బయో అటువంటి డేటాను ప్రాసెస్ చేయడానికి మీరు అంగీకరిస్తున్నారు..</p>

    <p><strong>5.</strong> This agreement has an initial term of one year from the date of this agreement and will automatically renew for successive 1-year periods, up to a maximum total term of seven years, unless terminated by you and String Bio with mutual agreement.<br/>
    ఈ ఒప్పందం ఈ ఒప్పందం తేదీ నుండి ఒక సంవత్సరం ప్రారంభ కాల వ్యవధిని కలిగి ఉంటుంది మరియు మీకు మరియు స్ట్రింగ్ బయోకు మధ్య పరస్పర ఒప్పందం ద్వారా రద్దు చేయబడకపోతే, గరిష్టంగా ఏడు సంవత్సరాల వరకు వరుసగా 1-సంవత్సరం కాలానికి స్వయంచాలకంగా పునరుద్ధరించబడుతుంది.</p>

    <p><strong>6.</strong> You agree to not participate in any other similar GHG reduction program across any standard during the term of this agreement.<br/>
    ఈ ఒప్పందం అమలులో ఉన్న కాలంలో ఏ ప్రమాణంలోనూ ఇలాంటి ఇతర GHG తగ్గింపు కార్యక్రమంలో పాల్గొనకూడదని మీరు అంగీకరిస్తున్నారు.</p>

    <p><strong>7.</strong> This agreement is irrevocable and binding on the Grower/landowner/lessee registered under the Grouped Project.<br/>
    ఈ ఒప్పందం రద్దు చేయలేనిది మరియు గ్రూప్ పథకం కింద నమోదు చేసుకున్న పెంపకందారుడు/భూయజమాని/కాంట్రాక్టర్పై కట్టుబడి ఉంటుంది.</p>

    <p><strong>8.</strong> You agree:<br/>
    మీరు ఈ క్రింది నిబంధనలు మరియు షరతులకు అంగీకరిస్తున్నారు:<br/>
    &nbsp;&nbsp;&nbsp;• to record data/parameter values as required by String Bio.<br/>
    &nbsp;&nbsp;&nbsp;• స్ట్రింగ్ బయో ద్వారా అవసరమైన విధంగా డేటా/పారామీటర్ విలువలను రికార్డ్ చేయడానికి.<br/>
    &nbsp;&nbsp;&nbsp;• to allow and support SeedWorks/ String Bio to monitor and audit the parameters required for the grouped project.<br/>
    &nbsp;&nbsp;&nbsp;• క్లస్టర్డ్ ప్రాజెక్ట్కు అవసరమైన పారామితులను పర్యవేక్షించడానికి మరియు ఆడిట్ చేయడానికి సీడ్వర్క్స్/స్ట్రింగ్ బయోను అనుమతించడానికి మరియు మద్దతు ఇవ్వడానికి.<br/>
    &nbsp;&nbsp;&nbsp;• that the legal land title on which the activity is implemented is uncontested.<br/>
    &nbsp;&nbsp;&nbsp;• కార్యకలాపం అమలు చేయబడుతున్న భూమికి చట్టపరమైన హక్కు వివాదాస్పదంగా ఉందని.</p>

    <p><strong>9.</strong> You understand that such information will be subject to all reasonable and required levels of data protection and may be processed and used only for the purpose of monitoring and verification of the project.<br/>
    అటువంటి సమాచారం అన్ని సహేతుకమైన మరియు అవసరమైన డేటా రక్షణ స్థాయిలకు లోబడి ఉంటుందని మరియు ప్రాజెక్ట్ పర్యవేక్షణ మరియు ధృవీకరణ ప్రయోజనం కోసం మాత్రమే ప్రాసెస్ చేయబడి ఉపయోగించబడుతుందని మీరు అర్థం చేసుకున్నారు.</p>

    <p><strong>10.</strong> Prior to the project activity referred to in this agreement, we understand you were following conventional crop management practices. The landowner/lessee agrees not to revert to this baseline method for the duration of the grouped project.<br/>
    ఈ ఒప్పందంలో సూచించబడిన ప్రాజెక్ట్ కార్యాచరణకు ముందు, మీరు సంప్రదాయ పంట నిర్వహణ పద్ధతులను అనుసరిస్తున్నారని మేము అర్థం చేసుకున్నాము. భూ యజమాని/లీజుదారుడు సమూహం చేయబడిన ప్రాజెక్ట్ వ్యవధి వరకు ఈ బేస్లైన్ పద్ధతికి తిరిగి వెళ్లకూడదని అంగీకరిస్తున్నారు.</p>

    <p><strong>11.</strong> You will retain the entire value of the yield obtained from using the product every season.<br/>
    ప్రతి సీజన్లో ఉత్పత్తిని ఉపయోగించడం ద్వారా పొందిన దిగుబడి యొక్క మొత్తం విలువను మీరు నిలుపుకుంటారు.</p>
  </div>

  <div class="section">
    <p>I/We, <strong>${farmerName}</strong>, hereby confirm that I understand the above-listed requirements. I willingly give the rights of the carbon offsets generated from adopting the above practices to String Bio Private Limited.</p>
    <p>పైన పేర్కొన్న అవసరాలను నేను/మేము, <strong>${farmerName}</strong> అర్థం చేసుకున్నానని ఇందుమూలంగా ధృవీకరిస్తున్నాను. పైన పేర్కొన్న పద్ధతులను అనుసరించడం ద్వారా ఉత్పన్నమయ్యే కార్బన్ ఆఫ్సెట్ల హక్కులను నేను ఇష్టపూర్వకంగా స్ట్రింగ్ బయో ప్రైవేట్ లిమిటెడ్కు ఇస్తున్నాను..</p>
  </div>

  <div class="signature-section">
    <div class="signature-left">
      <p><strong>LAND HOLDER/LESSEE/FARMER/</strong><br/>
      <strong>భూమి యజమాని/ కౌలుదారు/ రైతు/</strong></p>
      <p>Sign / సంతకం: _____________________</p>
      <p>Name / పేరు: ${farmerName}</p>
      <p>Phone No/ ఫోన్ నంబర్: ${farmerData.farmerMobile || ''}</p>
    </div>
    <div class="signature-right">
      <p><strong>For, String Bio Pvt Ltd</strong></p>
      <br/><br/>
      <p>Authorised Signatory</p>
    </div>
  </div>
</body>
</html>
  `;
}



const puppeteer = require("puppeteer");

async function generateFarmerAgreementPDF(farmerData) {
  const html = generateFarmerAgreementHTML(farmerData);

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const buffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "0.5in",
      right: "0.5in",
      bottom: "0.5in",
      left: "0.5in"
    }
  });

  await browser.close();
  return buffer;
}
// async function generateFarmerAgreementPDF(farmerData) {
//   return new Promise((resolve, reject) => {
//     const html = generateFarmerAgreementHTML(farmerData);
    
//     const options = {
//       format: 'A4',
//       orientation: 'portrait',
//       border: {
//         top: '0.5in',
//         right: '0.5in',
//         bottom: '0.5in',
//         left: '0.5in'
//       }
//     };

//     pdf.create(html, options).toBuffer((err, buffer) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(buffer);
//       }
//     });
//   });
// }

module.exports = generateFarmerAgreementPDF;
