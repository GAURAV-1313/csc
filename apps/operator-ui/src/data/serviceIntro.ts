export type ServiceIntro = {
  introduction: string;
  introduction_hi: string;
  feeInfo?: string;
  contact?: string;
  timeLimit?: string;
  pageUrl?: string | null;
};

export const serviceIntroMap: Record<string, ServiceIntro> = {
  "birth_certificate_correction": {
  "introduction": "Birth Certificate Correction (Legacy) In Chhattisgarh, obtaining a Birth Certificate Correction (Legacy) whose birth certificate has errors, or by parents/guardians in case of minors within a Municipality, Nagar Panchayat, Corporation and the process can be completed easily through the eDistrict Portal. Applicants need to register on the portal with their personal details or apply through LSK/CSC log in, and select the “Birth Certificate Correction (Legacy)” service, after which they must fill out the application form. Upon submission, a unique Application reference number (ARN) is generated for tracking the application, which is generally processed within 07 working days by the Economics and Statistic. Once approved, the applicant receives an SMS notification and can download the digitally signed Birth Certificate Correction (Legacy) directly from the portal.",
  "introduction_hi": "**जन्म प्रमाण पत्र सुधार (विरासत)**\n\nछत्तीसगढ़ में, ऐसे व्यक्ति जिनके जन्म प्रमाण पत्र में त्रुटियां हैं, या नाबालिगों के मामले में",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "7 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=1"
},
  "death_registration_certificate": {
  "introduction": "Death Certificate Correction (Legacy) In Chhattisgarh, obtaining a Death Certificate Correction (Legacy) service can be applied for by family members/legal heirs of the deceased or parents/guardians in case of minors within a Municipality, Nagar Panchayat, Corporation, and the process can be completed easily through the eDistrict Portal. Applicants need to register on the portal with their personal details or apply through LSK/CSC log in, and select the “Death Certificate Correction (Legacy)” service, after which they must fill out the application form Upon submission, an ARN (Application reference Number) is generated, through which the applicant can track the application status, which is generally processed within 07 working days by the Economics and Statistic. Once approved, the applicant receives an SMS notification and can download the digitally signed Death Certificate Correction (Legacy) directly from the portal.",
  "introduction_hi": "**मृत्यु प्रमाण पत्र सुधार (विरासत)**\n\nछत्तीसगढ़ में, मृत्यु प्रमाण पत्र सुधार (विरासत) सेवा के लिए मृतक के परिवार के",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "7 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=2"
},
  "marriage_registration_certificate": {
  "introduction": "Marriage Registration & Certificate In Chhattisgarh, obtaining a Marriage Registration & Certificate is mandatory for couples who wish to legally validate their marriage within the jurisdiction of a Corporation, Municipality Nagar Panchayat, Division, Ward and the process can be completed easily through the eDistrict Portal. Applicants need to register on the portal with their personal details or apply through LSK/CSC log in, and select the “Marriage Registration & Certificate” service, after which they must fill out the application form. Upon submission, a unique Acknowledgment Number (ARN) is generated for tracking the application, which is generally processed within 15 working days. Once approved, the applicant receives an SMS notification and can download the digitally signed Marriage Registration & Certificate directly from the portal. The certificate remains valid for a lifetime and serves as an essential legal document for availing various government schemes, visas, joint bank accounts, and other official purposes.",
  "introduction_hi": "**विवाह पंजीकरण एवं प्रमाण पत्र**\n\nछत्तीसगढ़ में, विवाह पंजीकरण एवं प्रमाण पत्र प्राप्त करना उन जोड़ों के लिए अनिवार्य है जो किसी निगम, नगर पालिका",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "15 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=3"
},
  "sc_st_certificate": {
  "introduction": "SC / ST Certificate Service In Chhattisgarh, obtaining a Scheduled Caste (SC) or Scheduled Tribe (ST) Certificate is essential for individuals belonging to these categories to avail government benefits such as reservations in education, employment, scholarships, and welfare schemes. The application process is simple and can be completed through the eDistrict Portal of Chhattisgarh. Applicants need to register on the portal with their personal details or apply through LSK/CSC login, and select the “SC/ST Certificate” service. They must then fill out the application form, upload the required documents. Upon submission, a unique Application Reference Number (ARN) is generated for tracking the application. Once approved, the applicant receives a SMS notification and can download the digitally signed SC/ST Certificate directly from the portal. The certificate remains valid permanently, unless otherwise directed by the issuing authority, and can be used for all official and legal purposes across the state.",
  "introduction_hi": "**छत्तीसगढ़ में अनुसूचित जाति/जनजाति प्रमाण पत्र सेवा\n\nछत्तीसगढ़ में, अनुसूचित जाति (SC) या अनुसूचित जनजाति (ST) प्रमाण पत्र",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "22 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=4"
},
  "obc_certificate": {
  "introduction": "OBC Certificate Service - Chhattisgarh In Chhattisgarh, obtaining an Other Backward Class (OBC) Certificate is essential for individuals belonging to OBC communities to avail government benefits such as reservations in education, employment, scholarships, and welfare schemes. The application process is simple and can be completed through the eDistrict Portal of Chhattisgarh. Applicants need to register on the portal with their personal details or apply through LSK/CSC login, and select the “OBC Certificate” service. They must then fill out the application form, upload the required documents. Upon submission, a unique acknowledgment number (ARN) is generated for tracking the application. Once approved, the applicant receives an SMS notification and can download the digitally signed OBC Certificate directly from the portal. The certificate remains valid permanently, unless otherwise directed by the issuing authority, and can be used for all official and legal purposes across the state.",
  "introduction_hi": "**अन्य पिछड़ा वर्ग (ओबीसी) प्रमाण पत्र सेवा - छत्तीसगढ़**\n\nछत्तीसगढ़ में, अन्य पिछड़ा वर्ग (ओबीसी) समुदायों से संबंधित व्यक्तियों के",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "22 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=5"
},
  "income_certificate": {
  "introduction": "Income Certificate Service The Income Certificate is a vital document required for availing various government schemes, scholarships, and welfare benefits. To apply, citizens must first register on the portal by providing details such as name, mobile number, email ID, Aadhaar number, and address. After login, they can select the Income Certificate service and fill the online application form with mandatory details including applicant’s name, residential address, age, qualification, employment status, and family income particulars. Applicants are required to upload scanned copies of supporting documents. The application is processed by the competent authority. Upon approval, applicants receive an SMS notification and can download the digitally signed Income Certificate directly from the portal. The certificate remains valid for a period of one year from the date of issue, and citizens are advised to renew it in a timely manner to continue availing government services and schemes.",
  "introduction_hi": "**आय प्रमाण पत्र सेवा**\n\nआय प्रमाण पत्र विभिन्न सरकारी योजनाओं, छात्रवृत्तियों और कल्याणकारी लाभों का लाभ उठाने के लिए एक महत्वपूर्ण",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "7 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=6"
},
  "domicile_certificate": {
  "introduction": "Domicile Certificate A Domicile Certificate is an important legal document that certifies a person’s permanent residence within the State and is required for availing various government services, educational opportunities, scholarships, employment preferences, and other state-specific benefits. To apply, the citizen must register on the e-District Portal by providing essential details such as name, mobile number, email ID, Aadhaar number, and address. After successful registration and login, the applicant should select the Domicile Certificate service from the list of available services and complete the online application form by furnishing mandatory details including personal information, residential address, period of residence in Chhattisgarh, and supporting documents particulars as required. The application is processed by the competent authority. Upon approval, the applicant is notified through SMS and can directly download the digitally signed Domicile Certificate from the portal.",
  "introduction_hi": "**अधिवास प्रमाण पत्र**\n\nअधिवास प्रमाण पत्र एक महत्वपूर्ण कानूनी दस्तावेज है जो किसी व्यक्ति के राज्य के भीतर स्थायी निवास को प्रमाणित करता है",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "7 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=7"
},
  "rti_filling_at_district_collectorate": {
  "introduction": "Insert title here Instructions For RTI Filling at District Collectorate Eligibility Criteria: Applicant should be a citizen of India. Documents Required: RTI Acceptance Register. Fee Payment receipt. ID Proof. Fee Details: RTI Application fees-Rs 30 (for APL) Additional fees (case basis) Expected Delivery Date: Submission- 1 Day Response-30 working days Other Instructions:",
  "introduction_hi": "यहां शीर्षक डालें\nजिला कलेक्ट्रेट में आरटीआई आवेदन भरने हेतु निर्देश\n\n**पात्रता मानदंड:**\nआवेदक भारत का नागरिक होना",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "30 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=8"
},
  "rti_filling_at_municipalities_panchayat": {
  "introduction": "Insert title here Instructions For RTI Filling at District Collectorate Eligibility Criteria: Applicant should be a citizen of India. Documents Required: RTI Acceptance Register. Fee Payment receipt. ID Proof. Fee Details: RTI Application fees-Rs 30 (for APL) Additional fees (case basis) Expected Delivery Date: Submission- 1 Day Response-30 working days Other Instructions:",
  "introduction_hi": "शीर्षक यहाँ डालें\n\n**जिला समाहरणालय में आरटीआई आवेदन दाखिल करने हेतु निर्देश**\n\n**पात्रता मानदंड:**\nआवेदक",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "30 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=9"
},
  "public_grievance_municipal_corporation_municipality_town_panchayat": {
  "introduction": "Important Instruction: Information must be complete and Poin wise. Give Your mobile no and Identity so that system can send SMS. Give Reference No if You have Already lodge given. Choose Your Grievance Category. Keep Your Generated Greviance Id for further Processing. Documents Required: Any Document or Photo Related to Public Greviance . Fee Details: Rs 30.00 Expected Greviance Solution/Action Date: Citizen should be getting a response normally within 30 working days",
  "introduction_hi": "**\n        **महत्वपूर्ण निर्देश:**\n\n        *   जानकारी पूर्ण और बिंदुवार होनी चाहिए।\n        *   अपना मोबाइल नंबर और पहचान प्रदान करें",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "30 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=10"
},
  "public_grievance_collectorate": {
  "introduction": "Important Instruction: Information must be complete and Point wise. Give Your mobile no and Identity so that system can send SMS. Give Reference No if You have Already lodge given. Choose Your Grievance Category. Keep Your Generated Greviance Id for further Processing. Documents Required: Any Document or Photo Related to Public Grievance Collectorate . Fee Details: Rs 30.00 Expected Greviance Solution/Action Date: Citizen should be getting a response normally within 30 working days",
  "introduction_hi": "**महत्वपूर्ण निर्देश:**\n\n*   जानकारी पूर्ण और बिंदुवार होनी चाहिए।\n*   अपना मोबाइल नंबर और पहचान प्रदान करें ताकि सिस्टम एसएमएस भेज",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "30 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=11"
},
  "application_for_inclusion_in_indira_gandhi_old_age_pension": {
  "introduction": "Application for inclusion in Indira Gandhi old age Pension In Chhattisgarh, the Indira Gandhi Old Age Pension provides financial support to elderly citizens who meet the state’s eligibility criteria. The service is available through the eDistrict Portal of Chhattisgarh and can also be accessed via Lok Seva Kendras (LSK) or Common Service Centres (CSC) for applicants requiring assistance. Eligible citizens, typically aged 60 years and above and meeting income requirements, can register on the portal and select the “Application for Indira Gandhi Old Age Pension” service. Upon submission, a unique Application Reference Number (ARN) is generated, allowing applicants to track the status of their application. The concerned authority verifies the application, which is generally processed within 60 days. Once approved, the applicant receives an SMS notification, and the pension amount is directly credited to the beneficiary’s bank or post office account.",
  "introduction_hi": "**इंदिरा गांधी वृद्धावस्था पेंशन में शामिल करने हेतु आवेदन**\n\nछत्तीसगढ़ में, इंदिरा गांधी वृद्धावस्था पेंशन उन वृद्ध नागरिकों को वित्तीय सहायता प्रदान करती",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "60 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=12"
},
  "application_for_inclusion_in_samajik_suraksha_pension_yojana": {
  "introduction": "Application for Inclusion in Sukhad Sahara Yojana The Sukhad Sahara Yojana provides financial assistance to eligible beneficiaries in Chhattisgarh to support their livelihood and social security needs. Citizens can apply for this service either by creating an account and applying directly on the eDistrict Portal, or by visiting their nearest Lok Seva Kendra (LSK) or Common Service Centre (CSC) for assistance. After logging in, applicants need to select the “Application for Inclusion in Sukhad Sahara Yojana” service under the Social Welfare section, fill out the online form, and upload the required supporting documents. Once the application is submitted successfully, a unique Acknowledgment Number (ARN) is generated for tracking the status. The application is then forwarded to the concerned authority for verification, and if the applicant is found eligible, it is approved. The sanctioned assistance amount is directly credited to the beneficiary’s bank or post office account, ensuring timely and transparent delivery of benefits.",
  "introduction_hi": "**सुखद सहारा योजना में समावेशन हेतु आवेदन**\n\nसुखद सहारा योजना छत्तीसगढ़ में पात्र लाभार्थियों को उनकी आजीविका और सामाजिक सुरक्षा संबंधी आवश्यकताओं",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "60 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=13"
},
  "application_for_inclusion_in_sukhad_sahara_yojana": {
  "introduction": "Application for Inclusion in Sukhad Sahara Yojana The Sukhad Sahara Yojana provides financial assistance to eligible beneficiaries in Chhattisgarh to support their livelihood and social security needs. Citizens can apply for this service either by creating an account and applying directly on the eDistrict Portal, or by visiting their nearest Lok Seva Kendra (LSK) or Common Service Centre (CSC) for assistance. After logging in, applicants need to select the “Application for Inclusion in Sukhad Sahara Yojana” service under the Social Welfare section, fill out the online form, and upload the required supporting documents. Once the application is submitted successfully, a unique Acknowledgment Number (ARN) is generated for tracking the status. The application is then forwarded to the concerned authority for verification, and if the applicant is found eligible, it is approved. The sanctioned assistance amount is directly credited to the beneficiary’s bank or post office account, ensuring timely and transparent delivery of benefits.",
  "introduction_hi": "**सुखद सहारा योजना में समावेशन हेतु आवेदन**\n\nसुखद सहारा योजना छत्तीसगढ़ में पात्र हितग्राहियों को उनकी आजीविका और",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "60 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=14"
},
  "application_for_inclusion_in_widow_pension": {
  "introduction": "Application for Inclusion in Widow Pension The Widow Pension Scheme offers financial support to eligible widows in Chhattisgarh. Applicants can apply through the eDistrict Portal by creating an account and submitting their application online, or they may seek assistance at the nearest Lok Seva Kendra (LSK) or Common Service Centre (CSC). After logging in, the applicant needs to select “Application for Inclusion in Widow Pension” under the Social Welfare section, complete the digital application form, and upload the required supporting documents. On successful submission, a unique Acknowledgment / ARN is generated to track the application status. The application is forwarded to the concerned authority for verification, and upon satisfying eligibility criteria, it is approved. Once approved, the pension amount is transferred directly to the beneficiary’s bank or post office account, ensuring timely and transparent disbursement of benefits",
  "introduction_hi": "**विधवा पेंशन में सम्मिलित होने हेतु आवेदन**\n\nविधवा पेंशन योजना छत्तीसगढ़ में पात्र विधवाओं को वित्तीय सहायता प्रदान करती है। आवेदक ई-डि",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "60 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=15"
},
  "application_for_case_listing_revenue_court": {
  "introduction": "Application for Case Listing (Revenue Court) – Chhattisgarh In Chhattisgarh, citizens can apply for case listing in Revenue Courts through the e-District Portal. This service allows parties, their legal representatives, or authorized agents to request the inclusion of revenue-related cases in the court’s hearing schedule, ensuring transparency and timely processing. Eligible applicants include parties to a revenue case, advocates, or authorized representatives. Applications can be submitted online via the e-District Portal or offline at the relevant Tehsil or Revenue Court office. The applicant must complete the application form and submit necessary details, including case number, parties involved, and supporting documents. Upon submission, an Application Reference Number (ARN) is generated to track the application status. The concerned authority verifies the documents and schedules the case within the prescribed time frame, usually within 7 working days. Applicants are notified via SMS or email once the case is listed, facilitating proper record management and ensuring timely hearings.",
  "introduction_hi": "Application for Case listing (Revenue Court) सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "7 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=16"
},
  "court_order_certificate_revenue_court": {
  "introduction": "Court Order Certificate (Revenue Court) Obtaining a Court Order Certificate from a Revenue Court is a crucial service for citizens dealing with land and property disputes. This certificate serves as an official document that confirms the final decision, order, or official order passed by a Revenue Court on matters like land demarcation, mutation, property disputes, or the recovery of land revenue arrears. After a simple registration and login, citizens can select the \"Revenue Court Certificate\" service, fill out an online application form with the required details, and upload supporting documents such as the original case number, copy of the court order, and identity proof. The system generates a unique application ID, which allows for real-time tracking of the application status, from submission to approval. Once the certificate is approved and digitally signed by the competent authority, it can be downloaded and printed directly from the portal, eliminating the need to collect it in person. This digitalization ensures authenticity, reduces the scope for errors, and enhances accountability in public service delivery.",
  "introduction_hi": "Court Order Certificate (Revenue Court) सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "15 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=17"
},
  "issuance_of_ration_card": {
  "introduction": "Issuance of Ration card provides citizen services through the CSC portal. Please review requirements before starting the form.",
  "introduction_hi": "Issuance of Ration card सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "30 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=18"
},
  "": {
  "introduction": " provides citizen services through the CSC portal. Please review requirements before starting the form.",
  "introduction_hi": " सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "7 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=39"
},
  "issuance_of_trade_license": {
  "introduction": "Issuence of Trade Licence instruction Eligibility Criteria: Fields marked in '*' are mandatory. Wherever there is a Select button please click the Select button to obtain a list of valid records. Trade license is valid for one year only. Enclosure: If business is based on partnership, than copy of partnership records. Fee Details: 30.00/-(Not Applicable for Citizen) Expected Delivery Date: You should be getting a response normally within 15 working days. Other Instructions: In case insufficient information is furnished the application will not be accepted. Still you have to pay a minimum service charge. Note:-",
  "introduction_hi": "Issuance of Trade License सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "15 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=21"
},
  "shop_and_establishment_registration": {
  "introduction": "Shop and Establishment Registration provides citizen services through the CSC portal. Please review requirements before starting the form.",
  "introduction_hi": "Shop and Establishment Registration सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "15 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=22"
},
  "food_registration_application_for_small_cottage": {
  "introduction": "Food Registration(Application for Small Cottage) provides citizen services through the CSC portal. Please review requirements before starting the form.",
  "introduction_hi": "Food Registration(Application for Small Cottage) सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "15 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=23"
},
  "application_for_water_tap_connection": {
  "introduction": "Application for Water Tap Connection In Chhattisgarh, the Water Tap Connection service allows citizens to obtain a new water supply connection for domestic, commercial, or institutional use. The service is available online through the eDistrict Portal of Chhattisgarh and offline via Lok Seva Kendras (LSK) or Common Service Centres (CSC). This service is applicable to residents, households, and establishments falling under the jurisdiction of municipal corporations, municipalities, or Gram Panchayats responsible for water supply. The applicant must be the property owner or an authorized occupant of the premises where the connection is required. To apply, the citizen has to register and log in to the eDistrict portal, select the “Water Tap Connection” service, and fill the application form with property and personal details. Through LSK or CSC, operators assist citizens in completing the form. On submission, an Application Reference Number (ARN) is generated, and the prescribed application and connection fees are paid. The local body verifies documents, may conduct a site inspection, and processes the request within 30 days. Upon approval, the connection is sanctioned and installed, remaining valid with regular bill payment.",
  "introduction_hi": "Application for Water Tap Connection सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "30 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=24"
},
  "noc_for_building_plan_construction": {
  "introduction": "NOC for Building (Plan) Construction provides citizen services through the CSC portal. Please review requirements before starting the form.",
  "introduction_hi": "NOC for Building (Plan) Construction सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "30 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=25"
},
  "name_transfer_mutation_of_property_municipal_area": {
  "introduction": "Name transfer (Mutation) of Property Municipal area The process of name transfer, or mutation, of a property within a municipal area is a vital administrative procedure that records a change in the ownership of a property in the official municipal records. This is a mandatory step after any property transaction, such as sale, inheritance, gift, or will, and is crucial for updating tax liabilities and legal ownership. The service is designed to be user-friendly, providing a step-by-step guide for submitting an application. Applicants need to register on the portal, select the \"Mutation of Property\" service, and fill in the required details, including property address, previous owner's details, and the new owner's information. The portal also allows for the easy upload of necessary documents. Once the application is submitted, a unique reference number is generated, which can be used to track the application's status in real-time. The application is then routed to the concerned municipal authority for verification. After due diligence and verification, the competent authority approves the mutation, and the updated property records can be downloaded from the e–District portal. Once approved, the applicant receives an SMS notification and can download the Revenue Service (Agricultural Land Diverted for Mutation details directly from the portal, Record validity is permanent and has no expiry.",
  "introduction_hi": "Name transfer (Mutation) of Property Municipal area सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "30 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=26"
},
  "request_for_nakal_of_document_from_bhuiyan_copy_of_land_record_etc": {
  "introduction": "Request for Nakal of document From Bhuiyan(copy of land record etc) provides citizen services through the CSC portal. Please review requirements before starting the form.",
  "introduction_hi": "Request for Nakal of document From Bhuiyan(copy of land record etc) सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹10.0 | Online: ₹10.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "15 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=27"
},
  "registration_for_job_seekers": {
  "introduction": "Registration for Job-Seekers provides citizen services through the CSC portal. Please review requirements before starting the form.",
  "introduction_hi": "Registration for Job-Seekers सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "1 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=28"
},
  "new_permanent_driving_license_for_motor_vehicle": {
  "introduction": "New Permanent Driving License for Motor Vehicle provides citizen services through the CSC portal. Please review requirements before starting the form.",
  "introduction_hi": "New Permanent Driving License for Motor Vehicle सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "30 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=29"
},
  "new_learner_license": {
  "introduction": "New Learner License provides citizen services through the CSC portal. Please review requirements before starting the form.",
  "introduction_hi": "New Learner License सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "18 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=30"
},
  "application_for_fitment_certificate_vehicle": {
  "introduction": "Application for Fitment Certificate (Vehicle) provides citizen services through the CSC portal. Please review requirements before starting the form.",
  "introduction_hi": "Application for Fitment Certificate (Vehicle) सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "60 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=31"
},
  "application_for_indira_gandhi_disability_pension_yojana": {
  "introduction": "Indira Gandhi Disability Pension Yojana The Indira Gandhi Disability Pension Yojana provides financial assistance to eligible persons with disabilities in Chhattisgarh. Citizens can apply for this service either by creating an account and applying directly on the eDistrict Portal, or by visiting their nearest Lok Seva Kendra (LSK) or Common Service Centre (CSC) for assistance. After logging in, applicants need to select the “Application for Indira Gandhi Disability Pension Yojana” service under the Social Welfare section, fill out the online form, and upload the mandatory supporting documents. Once the application is submitted successfully, a unique acknowledgment number(ARN) is generated for tracking the status. The application is then forwarded to the concerned authority for verification, and if found eligible, it is approved. The sanctioned pension amount is credited directly to the beneficiary’s bank or post office account, ensuring timely and transparent delivery of benefits.",
  "introduction_hi": "Application for Indira Gandhi Disability Pension Yojana सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "60 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=32"
},
  "food_registration_application_for_hawker_stall": {
  "introduction": "Food Registration(Application for Hawker Stall) provides citizen services through the CSC portal. Please review requirements before starting the form.",
  "introduction_hi": "Food Registration(Application for Hawker Stall) सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "15 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=33"
},
  "revenue_services_agricultural_land_diverted_demarcation": {
  "introduction": "Revenue Services (Agricultural Land/Diverted RBC 6(4) - Relief Support (Natural Calamity)) In Chhattisgarh, obtaining services related to Revenue Services Agricultural Land/Diverted RBC 6(4) – Relief Support (Natural Calamity) service in Chhattisgarh can be applied by farmers, landowners, or leaseholders whose land/crops are damaged due to natural calamities (flood, drought, hailstorm, fire, etc.), as verified by the Revenue Department within the jurisdiction of a District, Revenue Tehsil, Revenue Village, and the process can be completed easily through the eDistrict Portal. Applicants need to register on the portal with their personal details or apply through LSK/CSC login, and select the “Revenue Services (Agricultural Land/Diverted RBC 6(4) - Relief Support (Natural Calamity))” service, after which they must fill out the application form with accurate details. Upon submission, a unique Acknowledgment Number (ARN) is generated for tracking the application, which is generally processed within 90 working days. Once approved under RBC 6(4) Relief Support, the applicant receives an SMS notification and can download the digitally signed approval certificate directly from the portal. The document remains valid as an essential legal record for claiming disaster relief assistance, land-related transactions, government schemes, inheritance, and other official purposes.",
  "introduction_hi": "Revenue Services (Agricultural Land/Diverted Demarcation) सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "30 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=35"
},
  "revenue_services_nazul_land_patta_renewal": {
  "introduction": "Revenue Services (Nazul Land Patta Renewal) Revenue Services (Nazul Land Patta Renewal) provides citizens of Chhattisgarh with the facility to renew their Nazul land pattas after the expiry of the lease period, ensuring continued legal possession and use of government-allotted land. Citizens can apply for this service either by creating an account and applying directly on the eDistrict Portal, or by visiting their nearest Lok Seva Kendra (LSK) or Common Service Centre (CSC) for assistance. After logging in, applicants need to select the “Revenue Services (Nazul Land Patta Renewal)” option under the Revenue section, fill out the online application form, and upload the required supporting documents. Once the application is submitted successfully, a unique acknowledgment number (ARN) is generated, which can be used to track the status of the application. The application is then forwarded to the concerned Revenue authority for verification of land details, ownership records, and compliance with renewal conditions. Upon successful verification and approval, the Nazul land patta is renewed and the applicant is issued the updated lease document. This service ensures legal validity, transparency, and ease of access for citizens in managing their Nazul land pattas.",
  "introduction_hi": "Revenue Services (Nazul Land Patta Renewal) सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "30 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=36"
},
  "revenue_services_nazul_land_patta_noc": {
  "introduction": "Revenue Services (Nazul Land Patta NOC) Revenue Services (Nazul Land Patta NOC) provides citizens of Chhattisgarh with the facility to obtain a No Objection Certificate (NOC) for their Nazul land pattas, which is required for legal transactions such as sale, lease, or development of government-allotted land. Citizens can apply for this service either by creating an account and applying directly on the eDistrict Portal, or by visiting their nearest Lok Seva Kendra (LSK) or Common Service Centre (CSC) for assistance. After logging in, applicants need to select the “Revenue Services (Nazul Land Patta NOC)” option under the Revenue section, fill out the online application form, and upload the required supporting documents. Once the application is submitted successfully, a unique acknowledgment number (ARN) is generated, which can be used to track the status of the application. The application is then forwarded to the concerned Revenue authority for verification of land details, ownership records, and compliance with regulations. Upon successful verification and approval, the NOC is issued to the applicant, enabling them to legally proceed with transactions or developments on the Nazul land. This service ensures transparency, accountability, and ease of access to legal land services for citizens.",
  "introduction_hi": "Revenue Services (Nazul Land Patta NOC) सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "15 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=37"
},
  "revenue_service_solvency_between_5lac_to_25lac": {
  "introduction": "Revenue Service (Solvency Between 5Lac To 25Lac) provides citizen services through the CSC portal. Please review requirements before starting the form.",
  "introduction_hi": "Revenue Service (Solvency Between 5Lac To 25Lac) सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "10 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=38"
},
  "land_use_information": {
  "introduction": "Land Use Information provides citizen services through the CSC portal. Please review requirements before starting the form.",
  "introduction_hi": "Land Use Information सेवा के लिए ऑनलाइन आवेदन की सुविधा उपलब्ध है। कृपया आवेदन शुरू करने से पहले आवश्यक दस्तावेज़ और विवरण तैयार रखें।",
  "feeInfo": "Lok Seva Kendra: ₹30.0 | Online: ₹30.0",
  "contact": "Lok Seva Kendra",
  "timeLimit": "30 Days",
  "pageUrl": "https://cgedistrict.cgstate.gov.in/instractionPageNew.do?lang=en&serviceId=40"
}
};
