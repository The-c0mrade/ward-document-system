// ===================== STATE MANAGEMENT =====================
const serviceState = {
    birth: { fatherFront: null, fatherBack: null, motherFront: null, motherBack: null, nibidakFront: null, nibidakBack: null, hospital: null },
    death: { deceasedFront: null, deceasedBack: null, nibidakFront: null, nibidakBack: null },
    citizenship: { primaryFront: null, primaryBack: null, nibidakFront: null, nibidakBack: null },
    marriage: { groomFront: null, groomBack: null, brideFront: null, brideBack: null, nibidakFront: null, nibidakBack: null },
    divorce: { husbandFront: null, husbandBack: null, wifeFront: null, wifeBack: null, nibidakFront: null, nibidakBack: null },
    migration: { primaryFront: null, primaryBack: null, nibidakFront: null, nibidakBack: null },
    relationship: { documentFront: null, documentBack: null, nibidakFront: null, nibidakBack: null },
    income: { documentFront: null, documentBack: null, nibidakFront: null, nibidakBack: null },
    property: { documentFront: null, documentBack: null, nibidakFront: null, nibidakBack: null },
    tax: { documentFront: null, documentBack: null, nibidakFront: null, nibidakBack: null },
    address: { documentFront: null, documentBack: null, nibidakFront: null, nibidakBack: null },
    unmarried: { documentFront: null, documentBack: null, nibidakFront: null, nibidakBack: null },
    character: { documentFront: null, documentBack: null, nibidakFront: null, nibidakBack: null },
    road: { documentFront: null, documentBack: null, nibidakFront: null, nibidakBack: null },
    otherForm: { documentFront: null, documentBack: null, nibidakFront: null, nibidakBack: null }
};

const DEVANAGARI_RANGE = /[\u0900-\u097F]/u;
const APP_LOGIN_KEY = 'wardAppLoggedIn';
const APP_USER_KEY = 'wardAppUser';
const APP_VIEW_KEY = 'wardAppView';

// Runtime error reporting to aid debugging in-browser
window.addEventListener('error', (e) => {
    try {
        console.error('Runtime error', e.error || e.message, e);
        alert('JS Error: ' + (e.message || e.error && e.error.message || 'Unknown') + '\n' + (e.filename ? (e.filename + ':' + e.lineno) : ''));
    } catch (err) {
        // swallow
    }
});

window.addEventListener('unhandledrejection', (evt) => {
    try {
        console.error('Unhandled promise rejection', evt.reason || evt);
        alert('Unhandled Promise Rejection: ' + (evt.reason?.message || JSON.stringify(evt.reason) || 'Unknown'));
    } catch (err) {
        // swallow
    }
});

function clearLoginSession() {
    sessionStorage.removeItem(APP_LOGIN_KEY);
    sessionStorage.removeItem(APP_USER_KEY);
    sessionStorage.removeItem(APP_VIEW_KEY);
}

function saveLoginSession(username) {
    sessionStorage.setItem(APP_LOGIN_KEY, '1');
    sessionStorage.setItem(APP_USER_KEY, username);
}

function saveViewState(viewState) {
    sessionStorage.setItem(APP_VIEW_KEY, JSON.stringify(viewState));
}

function getViewState() {
    try {
        const raw = sessionStorage.getItem(APP_VIEW_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function resetEnteredServiceData() {
    const serviceContainer = document.getElementById('servicePages');
    if (!serviceContainer) return;

    serviceContainer.querySelectorAll('input, textarea, select').forEach((el) => {
        if (el.tagName === 'INPUT') {
            const inputType = (el.type || '').toLowerCase();
            if (inputType === 'file') {
                el.value = '';
                return;
            }
            if (inputType === 'checkbox' || inputType === 'radio') {
                el.checked = el.defaultChecked;
                return;
            }
            el.value = el.defaultValue || '';
            return;
        }

        if (el.tagName === 'TEXTAREA') {
            el.value = el.defaultValue || '';
            return;
        }

        if (el.tagName === 'SELECT') {
            const defaultIndex = Array.from(el.options).findIndex((opt) => opt.defaultSelected);
            el.selectedIndex = defaultIndex >= 0 ? defaultIndex : (el.options.length ? 0 : -1);
        }
    });

    serviceContainer.querySelectorAll('.preview-image').forEach((img) => {
        img.removeAttribute('src');
        img.style.display = 'none';
    });
}

function restoreSessionAndView() {
    const isLoggedIn = sessionStorage.getItem(APP_LOGIN_KEY) === '1';
    if (!isLoggedIn) return;

    const username = (sessionStorage.getItem(APP_USER_KEY) || 'admin').trim() || 'admin';
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('userDisplay').textContent = username.charAt(0).toUpperCase() + username.slice(1);

    const viewState = getViewState();
    if (viewState?.screen === 'service' && viewState.service) {
        const targetPage = document.getElementById(viewState.service + 'Page');
        if (targetPage) {
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('servicePages').classList.remove('hidden');
            document.querySelectorAll('.service-page').forEach((p) => p.classList.add('hidden'));
            targetPage.classList.remove('hidden');
            showServiceStep(viewState.service, Number(viewState.step) > 0 ? Number(viewState.step) : 1);
            return;
        }
    }

    document.getElementById('servicePages').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    saveViewState({ screen: 'dashboard' });
}

// ===================== LOGIN & NAVIGATION =====================
function login() {
    const username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();
    if ((username === 'admin' || username === 'prakhyat') && password === 'admin123') {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('userDisplay').textContent = username.charAt(0).toUpperCase() + username.slice(1);
        saveLoginSession(username);
        saveViewState({ screen: 'dashboard' });
    } else {
        alert('Invalid username or password');
    }
}

function logout() {
    if (confirm('Do you want to logout?')) {
        clearLoginSession();
        location.reload();
    }
}

function openService(service) {
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('servicePages').classList.remove('hidden');
    document.querySelectorAll('.service-page').forEach(p => p.classList.add('hidden'));
    document.getElementById(service + 'Page').classList.remove('hidden');
    showServiceStep(service, 1);
    saveViewState({ screen: 'service', service, step: 1 });
}

function backToDashboard() {
    document.getElementById('servicePages').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    saveViewState({ screen: 'dashboard' });
}

// ===================== STEP NAVIGATION =====================
function getRequiredUploadGroups(service, targetStep) {
    const requiredGroups = {
        birth: [
            ['fatherFront', 'fatherBack'],
            ['motherFront', 'motherBack'],
            ['nibidakFront', 'nibidakBack']
        ],
        death: [['deceasedFront', 'deceasedBack'], ['nibidakFront', 'nibidakBack']],
        citizenship: [['primaryFront', 'primaryBack'], ['nibidakFront', 'nibidakBack']],
        marriage: [['groomFront', 'groomBack'], ['brideFront', 'brideBack'], ['nibidakFront', 'nibidakBack']],
        divorce: [['husbandFront', 'husbandBack'], ['wifeFront', 'wifeBack'], ['nibidakFront', 'nibidakBack']],
        migration: [['primaryFront', 'primaryBack'], ['nibidakFront', 'nibidakBack']],
        relationship: [['documentFront', 'documentBack'], ['nibidakFront', 'nibidakBack']],
        income: [['documentFront', 'documentBack'], ['nibidakFront', 'nibidakBack']],
        property: [['documentFront', 'documentBack'], ['nibidakFront', 'nibidakBack']],
        tax: [['documentFront', 'documentBack'], ['nibidakFront', 'nibidakBack']],
        address: [['documentFront', 'documentBack'], ['nibidakFront', 'nibidakBack']],
        unmarried: [['documentFront', 'documentBack'], ['nibidakFront', 'nibidakBack']],
        character: [['documentFront', 'documentBack'], ['nibidakFront', 'nibidakBack']],
        road: [['documentFront', 'documentBack'], ['nibidakFront', 'nibidakBack']],
        otherForm: [['documentFront', 'documentBack'], ['nibidakFront', 'nibidakBack']]
    }[service] || [];

    const groupsNeeded = service === 'birth'
        ? Math.min(Math.max(targetStep - 1, 0), 3)
        : Math.min(Math.max(targetStep - 1, 0), 2);
    return requiredGroups.slice(0, groupsNeeded);
}

function validateRequiredUploads(service, targetStep) {
    const state = serviceState[service];
    const missingGroup = getRequiredUploadGroups(service, targetStep)
        .find((group) => group.some((key) => !state?.[key]));

    if (!missingGroup) return true;

    alert('Please upload all required files before continuing to the next step.');
    return false;
}

function showServiceStep(service, stepNum) {
    const manualFormSteps = {
        birth: 6, death: 4, citizenship: 4, marriage: 5, divorce: 5,
        migration: 4, relationship: 4, income: 4, property: 4, tax: 4,
        address: 4, unmarried: 4, character: 4, road: 4, otherForm: 4
    };
    const ocrStepNumbers = {
        birth: 5, death: 3, citizenship: 3, marriage: 4, divorce: 4,
        migration: 3, relationship: 3, income: 3, property: 3, tax: 3,
        address: 3, unmarried: 3, character: 3, road: 3, otherForm: 3
    };
    if (stepNum > 1 && !validateRequiredUploads(service, stepNum)) return;
    if (ocrStepNumbers[service] === stepNum) stepNum = manualFormSteps[service];

    document.querySelectorAll(`[id^="${service}Step"]`).forEach((el) => {
        el.classList.add('hidden');
    });

    const targetStep = document.getElementById(service + 'Step' + stepNum);
    if (targetStep) {
        targetStep.classList.remove('hidden');
        saveViewState({ screen: 'service', service, step: stepNum });
    }
}

function injectPreviousStepButtons() {
    const manualFormSteps = {
        birth: 6, death: 4, citizenship: 4, marriage: 5, divorce: 5,
        migration: 4, relationship: 4, income: 4, property: 4, tax: 4,
        address: 4, unmarried: 4, character: 4, road: 4, otherForm: 4
    };

    document.querySelectorAll('.service-page .card[id*="Step"]').forEach((card) => {
        const match = card.id.match(/^(.+)Step(\d+)$/);
        if (!match) return;

        const [, service, stepValue] = match;
        const stepNum = Number(stepValue);
        if (stepNum <= 1 || card.querySelector('.prev-step-btn')) return;

        const nav = document.createElement('div');
        nav.className = 'step-nav';

        const previousStep = manualFormSteps[service] === stepNum
            ? (service === 'birth' ? 4 : service === 'marriage' || service === 'divorce' ? 3 : 2)
            : stepNum - 1;
        const prevButton = document.createElement('button');
        prevButton.type = 'button';
        prevButton.className = 'btn btn-secondary prev-step-btn';
        prevButton.textContent = '← Previous Step';
        prevButton.addEventListener('click', () => showServiceStep(service, previousStep));

        nav.appendChild(prevButton);
        card.appendChild(nav);
    });
}

// ===================== BIRTH SERVICE =====================
function loadBirthImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.birth[type] = e.target.result;
        const previewId = 'birth' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        const birthState = serviceState.birth;
        const birthNextToMother = document.getElementById('birthNextToMother');
        const birthNextToNibidak = document.getElementById('birthNextToNibidak');
        const birthNextToOptionals = document.getElementById('birthNextToOptionals');
        if (birthNextToMother) birthNextToMother.disabled = !(birthState.fatherFront && birthState.fatherBack);
        if (birthNextToNibidak) birthNextToNibidak.disabled = !(birthState.motherFront && birthState.motherBack);
        if (birthNextToOptionals) birthNextToOptionals.disabled = !(birthState.nibidakFront && birthState.nibidakBack);
        document.getElementById('birthNextToOCR') && (document.getElementById('birthNextToOCR').disabled = false);
    };
    reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    usernameInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            passwordInput?.focus();
        }
    });
    passwordInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            login();
        }
    });

    const btn = document.getElementById('birthNextToMother');
    if (btn) btn.onclick = () => showServiceStep('birth', 2);

    const btn2 = document.getElementById('birthNextToNibidak');
    if (btn2) btn2.onclick = () => showServiceStep('birth', 3);

    const btn3 = document.getElementById('birthNextToOptionals');
    if (btn3) btn3.onclick = () => showServiceStep('birth', 4);

    const btn4 = document.getElementById('birthNextToOCR');
    if (btn4) {
        btn4.textContent = 'Continue to Form';
        btn4.onclick = () => showServiceStep('birth', 6);
    }
});

async function runBirthOCR() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR...';

    try {
        // Require nibidak (applicant) front for birth flow
        if (!serviceState.birth.nibidakFront) {
            alert('Please upload the Nibidak (applicant) citizenship front image before running OCR.');
            showServiceStep('birth', 3);
            document.getElementById('loading').style.display = 'none';
            return;
        }

        const keys = ['fatherFront', 'motherFront', 'nibidakFront'];
        const presentKeys = keys.filter(k => !!serviceState.birth[k]);
        const images = presentKeys.map(k => serviceState.birth[k]);

        if (images.length === 0) {
            alert('No images available for OCR. Please upload the required citizenship images.');
            showServiceStep('birth', 1);
            document.getElementById('loading').style.display = 'none';
            return;
        }

        const texts = await recognizeImageBatch(images);
        const parsedByKey = {};
        for (let i = 0; i < presentKeys.length; i += 1) {
            try {
                parsedByKey[presentKeys[i]] = parseCitizenText(texts[i] || '');
            } catch (err) {
                parsedByKey[presentKeys[i]] = { nameNep: '', nameEng: '', citNo: '' };
            }
        }

        const fatherParsed = parsedByKey['fatherFront'] || { nameNep: '', nameEng: '', citNo: '' };
        const motherParsed = parsedByKey['motherFront'] || { nameNep: '', nameEng: '', citNo: '' };
        const nibidakParsed = parsedByKey['nibidakFront'] || { nameNep: '', nameEng: '', citNo: '' };

        document.getElementById('birthFatherNameNep').value = fatherParsed.nameNep || '';
        document.getElementById('birthFatherNameEng').value = fatherParsed.nameEng || '';
        document.getElementById('birthFatherCitizenshipNo').value = fatherParsed.citNo || '';

        document.getElementById('birthMotherNameNep').value = motherParsed.nameNep || '';
        document.getElementById('birthMotherNameEng').value = motherParsed.nameEng || '';
        document.getElementById('birthMotherCitizenshipNo').value = motherParsed.citNo || '';

        serviceState.birth.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.birth.nibidakNameEng = nibidakParsed.nameEng || '';
        serviceState.birth.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.birth.ocrDone = true;
        alert(`OCR processed ${images.length} image(s) successfully.`);
        showServiceStep('birth', 6);

    } catch (e) {
        console.error(e);
        alert('OCR Error: ' + (e.message || 'Unknown error') + '\nPlease verify images and try again.');
        // Stay on OCR step for retry
    }

    document.getElementById('loading').style.display = 'none';
}

function generateBirthPDFLegacy() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("श्री वडा कार्यालय", 105, y, { align: "center" });
    y += 12;

    doc.setFontSize(14);
    doc.text("वडा नं. १५, हेटौंडा उपमहानगरपालिका", 105, y, { align: "center" });
    y += 15;

    // Subject
    doc.setFont("helvetica", "bold");
    doc.text("विषय: जन्म दर्ता गरी प्रमाणपत्र उपलब्ध गराइदिनुहुन सम्बन्धमा", 20, y);
    y += 15;

    // Main body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const nibidakName = serviceState.birth.nibidakNameNep || 'निवेदक';
    const permAddress = document.getElementById('birthPermAddress').value || 'ठेगाना';
    const childName = document.getElementById('birthChildNameNep').value || 'बालक/बालिकाको नाम';
    const childDOB = document.getElementById('birthDobBS').value || 'जन्म मिति';
    const childPlace = document.getElementById('birthPlace').value || 'जन्म स्थान';
    const childGender = document.getElementById('birthGender').value || '';
    const fatherName = document.getElementById('birthFatherNameNep').value || 'बुबाको नाम';
    const motherName = document.getElementById('birthMotherNameNep').value || 'आमाको नाम';
    const contact = document.getElementById('birthContactNumber').value || 'सम्पर्क नं.';

    let bodyText = `म निवेदक ${nibidakName}, स्थायी ठेगाना ${permAddress} भएको व्यक्ति, यस वडामा जन्म भएको निम्न विवरण अनुसार बालक/बालिकाको जन्म दर्ता गरी प्रमाणपत्र उपलब्ध गराइदिनुहुन विनम्र अनुरोध गर्दछु।

बालक/बालिकाको विवरण:
नाम: ${childName}
जन्म मिति: ${childDOB}
जन्म स्थान: ${childPlace}${childGender ? ` (${childGender})` : ''}

बुबाको नाम: ${fatherName}
आमाको नाम: ${motherName}

उपरोक्त विवरण मेरो जानकारी अनुसार सत्य तथा यथार्थ रहेको व्यहोरा निवेदन गर्दछु। आवश्यक प्रक्रिया पुरा गरी प्रमाणपत्र उपलब्ध गराइदिनुहुन अनुरोध गर्दछु।`;

    let lines = doc.splitTextToSize(bodyText, 170);
    doc.text(lines, 20, y);
    y += lines.length * 6 + 20;

    // Signature section
    doc.setFont("helvetica", "bold");
    doc.text("निवेदक:", 20, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text("नाम: ___________________________", 20, y);
    y += 6;
    doc.text("हस्ताक्षर:", 20, y);
    y += 6;
    doc.text("सम्पर्क नं.: " + contact, 20, y);
    y += 6;
    doc.text("मिति: " + new Date().toLocaleDateString('ne-NP'), 20, y);

    doc.save("birth_certificate.pdf");
    alert("✓ जन्म दर्ता प्रमाणपत्र PDF तयार भयो!");
}

// ===================== DEATH SERVICE =====================
function loadDeathImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.death[type] = e.target.result;
        const previewId = 'death' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        // Enable navigation only when required pairs are present
        if (serviceState.death.deceasedFront && serviceState.death.deceasedBack) {
            const el = document.getElementById('deathNextToNibidak');
            if (el) el.disabled = false;
        }
        if (serviceState.death.nibidakFront && serviceState.death.nibidakBack) {
            const el2 = document.getElementById('deathNextToOCR');
            if (el2) el2.disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('deathNextToNibidak');
    if (btn) btn.onclick = () => showServiceStep('death', 2);

    const btn2 = document.getElementById('deathNextToOCR');
    if (btn2) btn2.onclick = () => showServiceStep('death', 3);
});

async function runDeathOCR() {
    if (!serviceState.death.deceasedFront || !serviceState.death.nibidakFront) {
        return alert("Upload deceased and nibidak citizenship cards (front required)");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [text, nibidakText] = await recognizeImageBatch([
            serviceState.death.deceasedFront,
            serviceState.death.nibidakFront
        ]);
        const parsed = parseCitizenText(text);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('deathDeceasedName').value = parsed.nameNep || parsed.nameEng || '';
        document.getElementById('deathDeceasedCitizenship').value = parsed.citNo || '';

        serviceState.death.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.death.nibidakCitNo = nibidakParsed.citNo || '';
        serviceState.death.ocrDone = true;

        showServiceStep('death', 4);

    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }

    document.getElementById('loading').style.display = 'none';
}

function generateDeathPDFLegacy() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    let y = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("श्री वडा कार्यालय", 105, y, { align: "center" });
    y += 12;

    doc.setFontSize(14);
    doc.text("वडा नं. १५, हेटौंडा उपमहानगरपालिका", 105, y, { align: "center" });
    y += 15;

    // Subject
    doc.setFont("helvetica", "bold");
    doc.text("विषय: मृत्यु दर्ता गरी प्रमाणपत्र उपलब्ध गराइदिनुहुन सम्बन्धमा", 20, y);
    y += 15;

    // Main body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    const nibidakName = serviceState.death.nibidakNameNep || 'निवेदक';
    const deceasedName = document.getElementById('deathDeceasedName').value || 'मृतकको नाम';
    const deceasedCit = document.getElementById('deathDeceasedCitizenship').value || 'नागरिकता नं.';
    const deathDate = document.getElementById('deathDateOfDeath').value || 'मृत्यु मिति';
    const deathPlace = document.getElementById('deathPlace').value || 'मृत्यु स्थान';
    const relation = 'निवेदक';
    const contact = document.getElementById('deathContact').value || 'सम्पर्क नं.';

    let bodyText = `म निवेदक ${nibidakName}, यस वडाभित्र भएको निम्न विवरण अनुसारको मृत्यु दर्ता गरी प्रमाणपत्र उपलब्ध गराइदिनुहुन निवेदन गर्दछु।

मृतकको विवरण:
नाम: ${deceasedName}
उमेर: N/A
मृत्यु मिति: ${deathDate}
मृत्यु स्थान: ${deathPlace}

निवेदकसँगको सम्बन्ध: ${relation}

उपरोक्त विवरण सत्य रहेको व्यहोरा निवेदन गर्दछु। आवश्यक प्रक्रिया पुरा गरी प्रमाणपत्र उपलब्ध गराइदिनुहुन अनुरोध गर्दछु।`;

    let lines = doc.splitTextToSize(bodyText, 170);
    doc.text(lines, 20, y);
    y += lines.length * 6 + 20;

    // Signature section
    doc.setFont("helvetica", "bold");
    doc.text("निवेदक:", 20, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text("नाम: ___________________________", 20, y);
    y += 6;
    doc.text("हस्ताक्षर:", 20, y);
    y += 6;
    doc.text("सम्पर्क नं.: " + contact, 20, y);
    y += 6;
    doc.text("मिति: " + new Date().toLocaleDateString('ne-NP'), 20, y);

    doc.save("death_certificate.pdf");
    alert("✓ मृत्यु दर्ता प्रमाणपत्र PDF तयार भयो!");
}

// ===================== CITIZENSHIP SERVICE =====================
function loadCitizenshipImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.citizenship[type] = e.target.result;
        const previewId = 'citizenship' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        const citizenshipState = serviceState.citizenship;
        const citizenshipNextToNibidak = document.getElementById('citizenshipNextToNibidak');
        const citizenshipNextToOCR = document.getElementById('citizenshipNextToOCR');
        if (citizenshipNextToNibidak) citizenshipNextToNibidak.disabled = !(citizenshipState.primaryFront && citizenshipState.primaryBack);
        if (citizenshipNextToOCR) citizenshipNextToOCR.disabled = !(citizenshipState.nibidakFront && citizenshipState.nibidakBack);
    };
    reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('citizenshipNextToNibidak');
    if (btn) btn.onclick = () => showServiceStep('citizenship', 2);

    const btn2 = document.getElementById('citizenshipNextToOCR');
    if (btn2) btn2.onclick = () => showServiceStep('citizenship', 3);
});

async function runCitizenshipOCR() {
    if (!serviceState.citizenship.primaryFront || !serviceState.citizenship.nibidakFront) {
        return alert("Upload primary and nibidak citizenship cards (front required)");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [text, nibidakText] = await recognizeImageBatch([
            serviceState.citizenship.primaryFront,
            serviceState.citizenship.nibidakFront
        ]);
        const parsed = parseCitizenText(text);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('citizenshipNameNep').value = parsed.nameNep || '';
        document.getElementById('citizenshipNameEng').value = parsed.nameEng || '';
        document.getElementById('citizenshipCitNo').value = parsed.citNo || '';

        serviceState.citizenship.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.citizenship.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.citizenship.ocrDone = true;
        showServiceStep('citizenship', 4);

    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }

    document.getElementById('loading').style.display = 'none';
}

// ===================== MARRIAGE SERVICE =====================
function loadMarriageImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.marriage[type] = e.target.result;
        const previewId = 'marriage' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if ((type === 'groomFront' || type === 'groomBack') && serviceState.marriage.groomFront && serviceState.marriage.groomBack) {
            document.getElementById('marriageNextToBride').disabled = false;
        }
        if ((type === 'brideFront' || type === 'brideBack') && serviceState.marriage.brideFront && serviceState.marriage.brideBack) {
            document.getElementById('marriageNextToNibidak').disabled = false;
        }
        if ((type === 'nibidakFront' || type === 'nibidakBack') && serviceState.marriage.nibidakFront && serviceState.marriage.nibidakBack) {
            document.getElementById('marriageNextToOCR').disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', () => {
    const btn1 = document.getElementById('marriageNextToBride');
    if (btn1) btn1.onclick = () => showServiceStep('marriage', 2);

    const btn2 = document.getElementById('marriageNextToNibidak');
    if (btn2) btn2.onclick = () => showServiceStep('marriage', 3);

    const btn3 = document.getElementById('marriageNextToOCR');
    if (btn3) btn3.onclick = () => showServiceStep('marriage', 4);
});

async function runMarriageOCR() {
    if (!serviceState.marriage.groomFront || !serviceState.marriage.brideFront || !serviceState.marriage.nibidakFront) {
        return alert("Upload groom, bride, and nibidak citizenship cards (front required)");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [groomText, brideText, nibidakText] = await recognizeImageBatch([
            serviceState.marriage.groomFront,
            serviceState.marriage.brideFront,
            serviceState.marriage.nibidakFront
        ]);

        const groomParsed = parseCitizenText(groomText);
        const brideParsed = parseCitizenText(brideText);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('marriageGroomNameNep').value = groomParsed.nameNep || '';
        document.getElementById('marriageGroomNameEng').value = groomParsed.nameEng || '';
        document.getElementById('marriageGroomCitNo').value = groomParsed.citNo || '';

        document.getElementById('marriageBrideNameNep').value = brideParsed.nameNep || '';
        document.getElementById('marriageBrideNameEng').value = brideParsed.nameEng || '';
        document.getElementById('marriageBrideCitNo').value = brideParsed.citNo || '';

        serviceState.marriage.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.marriage.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.marriage.ocrDone = true;
        showServiceStep('marriage', 5);

    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }

    document.getElementById('loading').style.display = 'none';
}

// ===================== DIVORCE SERVICE =====================
function loadDivorceImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.divorce[type] = e.target.result;
        const previewId = 'divorce' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if ((type === 'husbandFront' || type === 'husbandBack') && serviceState.divorce.husbandFront && serviceState.divorce.husbandBack) {
            document.getElementById('divorceNextToWife').disabled = false;
        }
        if ((type === 'wifeFront' || type === 'wifeBack') && serviceState.divorce.wifeFront && serviceState.divorce.wifeBack) {
            document.getElementById('divorceNextToNibidak').disabled = false;
        }
        if ((type === 'nibidakFront' || type === 'nibidakBack') && serviceState.divorce.nibidakFront && serviceState.divorce.nibidakBack) {
            document.getElementById('divorceNextToOCR').disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', () => {
    const btn1 = document.getElementById('divorceNextToWife');
    if (btn1) btn1.onclick = () => showServiceStep('divorce', 2);

    const btn2 = document.getElementById('divorceNextToNibidak');
    if (btn2) btn2.onclick = () => showServiceStep('divorce', 3);

    const btn3 = document.getElementById('divorceNextToOCR');
    if (btn3) btn3.onclick = () => showServiceStep('divorce', 4);
});

async function runDivorceOCR() {
    if (!serviceState.divorce.husbandFront || !serviceState.divorce.wifeFront || !serviceState.divorce.nibidakFront) {
        return alert("Upload husband, wife, and nibidak citizenship cards (front required)");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [husbandText, wifeText, nibidakText] = await recognizeImageBatch([
            serviceState.divorce.husbandFront,
            serviceState.divorce.wifeFront,
            serviceState.divorce.nibidakFront
        ]);

        const husbandParsed = parseCitizenText(husbandText);
        const wifeParsed = parseCitizenText(wifeText);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('divorceHusbandNameNep').value = husbandParsed.nameNep || '';
        document.getElementById('divorceHusbandNameEng').value = husbandParsed.nameEng || '';
        document.getElementById('divorceHusbandCitNo').value = husbandParsed.citNo || '';

        document.getElementById('divorceWifeNameNep').value = wifeParsed.nameNep || '';
        document.getElementById('divorceWifeNameEng').value = wifeParsed.nameEng || '';
        document.getElementById('divorceWifeCitNo').value = wifeParsed.citNo || '';

        serviceState.divorce.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.divorce.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.divorce.ocrDone = true;
        showServiceStep('divorce', 5);

    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }

    document.getElementById('loading').style.display = 'none';
}

// ===================== MIGRATION SERVICE =====================
function loadMigrationImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.migration[type] = e.target.result;
        const previewId = 'migration' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if ((type === 'primaryFront' || type === 'primaryBack') && serviceState.migration.primaryFront && serviceState.migration.primaryBack) {
            document.getElementById('migrationNextToNibidak').disabled = false;
        }

        if ((type === 'nibidakFront' || type === 'nibidakBack') && serviceState.migration.nibidakFront && serviceState.migration.nibidakBack) {
            document.getElementById('migrationNextToOCR').disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('migrationNextToNibidak');
    if (btn) btn.onclick = () => showServiceStep('migration', 2);

    const btn2 = document.getElementById('migrationNextToOCR');
    if (btn2) btn2.onclick = () => showServiceStep('migration', 3);
});

async function runMigrationOCR() {
    if (!serviceState.migration.primaryFront || !serviceState.migration.nibidakFront) {
        return alert("Upload primary and nibidak citizenship cards (front required)");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [text, nibidakText] = await recognizeImageBatch([
            serviceState.migration.primaryFront,
            serviceState.migration.nibidakFront
        ]);
        const parsed = parseCitizenText(text);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('migrationNameNep').value = parsed.nameNep || '';
        document.getElementById('migrationNameEng').value = parsed.nameEng || '';
        document.getElementById('migrationCitNo').value = parsed.citNo || '';

        serviceState.migration.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.migration.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.migration.ocrDone = true;
        showServiceStep('migration', 4);

    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }

    document.getElementById('loading').style.display = 'none';
}

// ===================== RELATIONSHIP SERVICE =====================
function loadRelationshipImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.relationship[type] = e.target.result;
        const previewId = 'relationship' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if (type === 'documentFront' || type === 'documentBack') {
            if (serviceState.relationship.documentFront && serviceState.relationship.documentBack) {
                document.getElementById('relationshipNextToNibidak').disabled = false;
            }
        }
        if (type === 'nibidakFront' || type === 'nibidakBack') {
            if (serviceState.relationship.nibidakFront && serviceState.relationship.nibidakBack) {
                document.getElementById('relationshipNextToOCR').disabled = false;
            }
        }
    };
    reader.readAsDataURL(file);
}

async function runRelationshipOCR() {
    if (!serviceState.relationship.documentFront || !serviceState.relationship.nibidakFront) {
        return alert("Upload document and nibidak citizenship");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [docText, nibidakText] = await recognizeImageBatch([
            serviceState.relationship.documentFront,
            serviceState.relationship.nibidakFront
        ]);

        const docParsed = parseCitizenText(docText);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('relationshipNameNep').value = docParsed.nameNep || '';
        document.getElementById('relationshipNameEng').value = docParsed.nameEng || '';

        serviceState.relationship.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.relationship.nibidakNameEng = nibidakParsed.nameEng || '';
        serviceState.relationship.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.relationship.ocrDone = true;
        showServiceStep('relationship', 4);
    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }
    document.getElementById('loading').style.display = 'none';
}

// ===================== INCOME SERVICE =====================
function loadIncomeImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.income[type] = e.target.result;
        const previewId = 'income' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if (type === 'documentFront' || type === 'documentBack') {
            if (serviceState.income.documentFront && serviceState.income.documentBack) {
                document.getElementById('incomeNextToNibidak').disabled = false;
            }
        }
        if (type === 'nibidakFront' || type === 'nibidakBack') {
            if (serviceState.income.nibidakFront && serviceState.income.nibidakBack) {
                document.getElementById('incomeNextToOCR').disabled = false;
            }
        }
    };
    reader.readAsDataURL(file);
}

async function runIncomeOCR() {
    if (!serviceState.income.documentFront || !serviceState.income.nibidakFront) {
        return alert("Upload document and nibidak citizenship");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [docText, nibidakText] = await recognizeImageBatch([
            serviceState.income.documentFront,
            serviceState.income.nibidakFront
        ]);

        const docParsed = parseCitizenText(docText);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('incomeNameNep').value = docParsed.nameNep || '';
        document.getElementById('incomeNameEng').value = docParsed.nameEng || '';

        serviceState.income.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.income.nibidakNameEng = nibidakParsed.nameEng || '';
        serviceState.income.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.income.ocrDone = true;
        showServiceStep('income', 4);
    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }
    document.getElementById('loading').style.display = 'none';
}

// ===================== PROPERTY SERVICE =====================
function loadPropertyImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.property[type] = e.target.result;
        const previewId = 'property' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if (type === 'documentFront' || type === 'documentBack') {
            if (serviceState.property.documentFront && serviceState.property.documentBack) {
                document.getElementById('propertyNextToNibidak').disabled = false;
            }
        }
        if (type === 'nibidakFront' || type === 'nibidakBack') {
            if (serviceState.property.nibidakFront && serviceState.property.nibidakBack) {
                document.getElementById('propertyNextToOCR').disabled = false;
            }
        }
    };
    reader.readAsDataURL(file);
}

async function runPropertyOCR() {
    if (!serviceState.property.documentFront || !serviceState.property.nibidakFront) {
        return alert("Upload document and nibidak citizenship");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [docText, nibidakText] = await recognizeImageBatch([
            serviceState.property.documentFront,
            serviceState.property.nibidakFront
        ]);

        const docParsed = parseCitizenText(docText);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('propertyOwnerNameNep').value = docParsed.nameNep || '';
        document.getElementById('propertyOwnerNameEng').value = docParsed.nameEng || '';

        serviceState.property.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.property.nibidakNameEng = nibidakParsed.nameEng || '';
        serviceState.property.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.property.ocrDone = true;
        showServiceStep('property', 4);
    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }
    document.getElementById('loading').style.display = 'none';
}

// ===================== TAX SERVICE =====================
function loadTaxImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.tax[type] = e.target.result;
        const previewId = 'tax' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if (type === 'documentFront' || type === 'documentBack') {
            if (serviceState.tax.documentFront && serviceState.tax.documentBack) {
                document.getElementById('taxNextToNibidak').disabled = false;
            }
        }
        if (type === 'nibidakFront' || type === 'nibidakBack') {
            if (serviceState.tax.nibidakFront && serviceState.tax.nibidakBack) {
                document.getElementById('taxNextToOCR').disabled = false;
            }
        }
    };
    reader.readAsDataURL(file);
}

async function runTaxOCR() {
    if (!serviceState.tax.documentFront || !serviceState.tax.nibidakFront) {
        return alert("Upload document and nibidak citizenship");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [docText, nibidakText] = await recognizeImageBatch([
            serviceState.tax.documentFront,
            serviceState.tax.nibidakFront
        ]);

        const docParsed = parseCitizenText(docText);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('taxPayerNameNep').value = docParsed.nameNep || '';
        document.getElementById('taxPayerNameEng').value = docParsed.nameEng || '';

        serviceState.tax.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.tax.nibidakNameEng = nibidakParsed.nameEng || '';
        serviceState.tax.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.tax.ocrDone = true;
        showServiceStep('tax', 4);
    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }
    document.getElementById('loading').style.display = 'none';
}

// ===================== ADDRESS SERVICE =====================
function loadAddressImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.address[type] = e.target.result;
        const previewId = 'address' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if (type === 'documentFront' || type === 'documentBack') {
            if (serviceState.address.documentFront && serviceState.address.documentBack) {
                document.getElementById('addressNextToNibidak').disabled = false;
            }
        }
        if (type === 'nibidakFront' || type === 'nibidakBack') {
            if (serviceState.address.nibidakFront && serviceState.address.nibidakBack) {
                document.getElementById('addressNextToOCR').disabled = false;
            }
        }
    };
    reader.readAsDataURL(file);
}

async function runAddressOCR() {
    if (!serviceState.address.documentFront || !serviceState.address.nibidakFront) {
        return alert("Upload document and nibidak citizenship");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [docText, nibidakText] = await recognizeImageBatch([
            serviceState.address.documentFront,
            serviceState.address.nibidakFront
        ]);

        const docParsed = parseCitizenText(docText);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('addressFullName').value = docParsed.nameNep || '';

        serviceState.address.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.address.nibidakNameEng = nibidakParsed.nameEng || '';
        serviceState.address.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.address.ocrDone = true;
        showServiceStep('address', 4);
    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }
    document.getElementById('loading').style.display = 'none';
}

// ===================== UNMARRIED SERVICE =====================
function loadUnmarriedImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.unmarried[type] = e.target.result;
        const previewId = 'unmarried' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if (type === 'documentFront' || type === 'documentBack') {
            if (serviceState.unmarried.documentFront && serviceState.unmarried.documentBack) {
                document.getElementById('unmarriedNextToNibidak').disabled = false;
            }
        }
        if (type === 'nibidakFront' || type === 'nibidakBack') {
            if (serviceState.unmarried.nibidakFront && serviceState.unmarried.nibidakBack) {
                document.getElementById('unmarriedNextToOCR').disabled = false;
            }
        }
    };
    reader.readAsDataURL(file);
}

async function runUnmarriedOCR() {
    if (!serviceState.unmarried.documentFront || !serviceState.unmarried.nibidakFront) {
        return alert("Upload document and nibidak citizenship");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [docText, nibidakText] = await recognizeImageBatch([
            serviceState.unmarried.documentFront,
            serviceState.unmarried.nibidakFront
        ]);

        const docParsed = parseCitizenText(docText);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('unmarriedNameNep').value = docParsed.nameNep || '';
        document.getElementById('unmarriedNameEng').value = docParsed.nameEng || '';

        serviceState.unmarried.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.unmarried.nibidakNameEng = nibidakParsed.nameEng || '';
        serviceState.unmarried.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.unmarried.ocrDone = true;
        showServiceStep('unmarried', 4);
    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }
    document.getElementById('loading').style.display = 'none';
}

// ===================== CHARACTER SERVICE =====================
function loadCharacterImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.character[type] = e.target.result;
        const previewId = 'character' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if (type === 'documentFront' || type === 'documentBack') {
            if (serviceState.character.documentFront && serviceState.character.documentBack) {
                document.getElementById('characterNextToNibidak').disabled = false;
            }
        }
        if (type === 'nibidakFront' || type === 'nibidakBack') {
            if (serviceState.character.nibidakFront && serviceState.character.nibidakBack) {
                document.getElementById('characterNextToOCR').disabled = false;
            }
        }
    };
    reader.readAsDataURL(file);
}

async function runCharacterOCR() {
    if (!serviceState.character.documentFront || !serviceState.character.nibidakFront) {
        return alert("Upload document and nibidak citizenship");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [docText, nibidakText] = await recognizeImageBatch([
            serviceState.character.documentFront,
            serviceState.character.nibidakFront
        ]);

        const docParsed = parseCitizenText(docText);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('characterNameNep').value = docParsed.nameNep || '';
        document.getElementById('characterNameEng').value = docParsed.nameEng || '';

        serviceState.character.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.character.nibidakNameEng = nibidakParsed.nameEng || '';
        serviceState.character.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.character.ocrDone = true;
        showServiceStep('character', 4);
    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }
    document.getElementById('loading').style.display = 'none';
}

// ===================== ROAD SERVICE =====================
function loadRoadImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.road[type] = e.target.result;
        const previewId = 'road' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if ((type === 'documentFront' || type === 'documentBack') && serviceState.road.documentFront && serviceState.road.documentBack) {
            document.getElementById('roadNextToNibidak').disabled = false;
        }

        if ((type === 'nibidakFront' || type === 'nibidakBack') && serviceState.road.nibidakFront && serviceState.road.nibidakBack) {
            document.getElementById('roadNextToOCR').disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

async function runRoadOCR() {
    if (!serviceState.road.documentFront || !serviceState.road.nibidakFront) {
        return alert("Upload document and nibidak citizenship");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [docText, nibidakText] = await recognizeImageBatch([
            serviceState.road.documentFront,
            serviceState.road.nibidakFront
        ]);

        const docParsed = parseCitizenText(docText);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('roadApplicantNameNep').value = docParsed.nameNep || '';
        document.getElementById('roadApplicantNameEng').value = docParsed.nameEng || '';

        serviceState.road.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.road.nibidakNameEng = nibidakParsed.nameEng || '';
        serviceState.road.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.road.ocrDone = true;
        showServiceStep('road', 4);
    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }
    document.getElementById('loading').style.display = 'none';
}

// ===================== OTHER FORM SERVICE =====================
function loadOtherFormImage(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        serviceState.otherForm[type] = e.target.result;
        const previewId = 'otherForm' + type.charAt(0).toUpperCase() + type.slice(1) + 'Preview';
        const preview = document.getElementById(previewId);
        if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }

        if ((type === 'documentFront' || type === 'documentBack') && serviceState.otherForm.documentFront && serviceState.otherForm.documentBack) {
            document.getElementById('otherFormNextToNibidak').disabled = false;
        }

        if ((type === 'nibidakFront' || type === 'nibidakBack') && serviceState.otherForm.nibidakFront && serviceState.otherForm.nibidakBack) {
            document.getElementById('otherFormNextToOCR').disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

async function runOtherFormOCR() {
    if (!serviceState.otherForm.documentFront || !serviceState.otherForm.nibidakFront) {
        return alert("Upload document and nibidak citizenship");
    }

    document.getElementById('loading').style.display = 'flex';
    document.getElementById('loadingText').textContent = 'Processing OCR... Please wait';

    try {
        const [docText, nibidakText] = await recognizeImageBatch([
            serviceState.otherForm.documentFront,
            serviceState.otherForm.nibidakFront
        ]);

        const docParsed = parseCitizenText(docText);
        const nibidakParsed = parseCitizenText(nibidakText);

        document.getElementById('otherFormApplicantNameNep').value = docParsed.nameNep || '';
        document.getElementById('otherFormApplicantNameEng').value = docParsed.nameEng || '';

        serviceState.otherForm.nibidakNameNep = nibidakParsed.nameNep || '';
        serviceState.otherForm.nibidakNameEng = nibidakParsed.nameEng || '';
        serviceState.otherForm.nibidakCitNo = nibidakParsed.citNo || '';

        serviceState.otherForm.ocrDone = true;
        showServiceStep('otherForm', 4);
    } catch (e) {
        alert("OCR Error: " + (e.message || "Unknown error"));
    }
    document.getElementById('loading').style.display = 'none';
}

// ===================== OPTIMIZE IMAGE FOR OCR =====================
function optimizeImageForOCR(imageData) {
    return new Promise((resolve) => {
        if (!imageData) {
            resolve(imageData);
            return;
        }

        if (optimizedImageCache.has(imageData)) {
            resolve(optimizedImageCache.get(imageData));
            return;
        }

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Higher resolution to preserve fine strokes
            const maxDimension = 1600;
            const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
            const targetWidth = Math.max(1, Math.round(img.width * scale));
            const targetHeight = Math.max(1, Math.round(img.height * scale));

            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(imageData);
                return;
            }

            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            const image = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const data = image.data;

            // Convert to grayscale + gentle contrast boost (no binary threshold)
            for (let i = 0; i < data.length; i += 4) {
                const gray = Math.round((data[i] * 0.299) + (data[i + 1] * 0.587) + (data[i + 2] * 0.114));
                // gentle contrast: stretch values slightly
                const boosted = Math.min(255, Math.max(0, (gray - 128) * 1.15 + 128));
                data[i] = boosted;
                data[i + 1] = boosted;
                data[i + 2] = boosted;
            }

            ctx.putImageData(image, 0, 0);
            // Preserve quality for OCR
            const optimized = canvas.toDataURL('image/jpeg', 0.92);
            optimizedImageCache.set(imageData, optimized);
            resolve(optimized);
        };
        img.onerror = () => {
            optimizedImageCache.set(imageData, imageData);
            resolve(imageData);
        };
        img.src = imageData;
    });
}

// ===================== OCR & PARSING UTILITIES =====================
async function recognizeImageText(imageData) {
    // Multi-pass recognition with image variants and heuristic scoring
    if (!imageData) return '';
    if (ocrResultCache.has(imageData)) return ocrResultCache.get(imageData);

    const worker = await initializeOCR();
    if (!worker) throw new Error('OCR engine not initialized');

    // Helper: load image into canvas scaled to maxDimension
    const loadImageToCanvas = (dataUrl) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDimension = 1600;
            const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('No canvas context'));
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas);
        };
        img.onerror = (e) => reject(e || new Error('Image load error'));
        img.src = dataUrl;
    });

    const toDataURL = (canvas) => canvas.toDataURL('image/png');

    const grayscaleImageData = (imageDataObj) => {
        const d = imageDataObj.data;
        for (let i = 0; i < d.length; i += 4) {
            const g = Math.round((d[i] * 0.299) + (d[i + 1] * 0.587) + (d[i + 2] * 0.114));
            d[i] = d[i + 1] = d[i + 2] = g;
        }
        return imageDataObj;
    };

    const applyConvolution = (srcImgData, kernel, kernelSize = 3) => {
        const src = srcImgData.data;
        const w = srcImgData.width;
        const h = srcImgData.height;
        const out = new Uint8ClampedArray(src.length);
        const half = Math.floor(kernelSize / 2);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let r = 0;
                for (let ky = -half; ky <= half; ky++) {
                    for (let kx = -half; kx <= half; kx++) {
                        const yy = Math.min(h - 1, Math.max(0, y + ky));
                        const xx = Math.min(w - 1, Math.max(0, x + kx));
                        const si = (yy * w + xx) * 4;
                        const ki = (ky + half) * kernelSize + (kx + half);
                        const kval = kernel[ki] || 0;
                        // use luminance
                        const lum = Math.round((src[si] * 0.299) + (src[si + 1] * 0.587) + (src[si + 2] * 0.114));
                        r += lum * kval;
                    }
                }
                const di = (y * w + x) * 4;
                const v = Math.min(255, Math.max(0, r));
                out[di] = out[di + 1] = out[di + 2] = v;
                out[di + 3] = src[di + 3];
            }
        }
        const outImg = new ImageData(out, w, h);
        return outImg;
    };

    const otsuThreshold = (imageDataObj) => {
        const data = imageDataObj.data;
        const hist = new Array(256).fill(0);
        const len = data.length / 4;
        for (let i = 0; i < data.length; i += 4) hist[data[i]]++;
        let sum = 0; for (let t = 0; t < 256; t++) sum += t * hist[t];
        let sumB = 0; let wB = 0; let wF = 0; let varMax = 0; let threshold = 0;
        for (let t = 0; t < 256; t++) {
            wB += hist[t];
            if (wB === 0) continue;
            wF = len - wB;
            if (wF === 0) break;
            sumB += t * hist[t];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            const varBetween = wB * wF * Math.pow(mB - mF, 2);
            if (varBetween > varMax) {
                varMax = varBetween;
                threshold = t;
            }
        }
        for (let i = 0; i < data.length; i += 4) {
            const v = data[i] > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = v;
        }
        return imageDataObj;
    };

    const generateVariants = async (srcDataUrl) => {
        const baseCanvas = await loadImageToCanvas(srcDataUrl);
        const ctx = baseCanvas.getContext('2d');
        const baseImg = ctx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);

        // Variant A: gentle grayscale + contrast stretch
        const aCanvas = document.createElement('canvas');
        aCanvas.width = baseCanvas.width; aCanvas.height = baseCanvas.height;
        const aCtx = aCanvas.getContext('2d');
        const aImg = new ImageData(new Uint8ClampedArray(baseImg.data), baseImg.width, baseImg.height);
        grayscaleImageData(aImg);
        // contrast
        for (let i = 0; i < aImg.data.length; i += 4) {
            const g = aImg.data[i];
            const boosted = Math.min(255, Math.max(0, (g - 128) * 1.15 + 128));
            aImg.data[i] = aImg.data[i + 1] = aImg.data[i + 2] = boosted;
        }
        aCtx.putImageData(aImg, 0, 0);

        // Variant B: sharpen
        const bCanvas = document.createElement('canvas');
        bCanvas.width = baseCanvas.width; bCanvas.height = baseCanvas.height;
        const bCtx = bCanvas.getContext('2d');
        const imgCopy = new ImageData(new Uint8ClampedArray(baseImg.data), baseImg.width, baseImg.height);
        grayscaleImageData(imgCopy);
        // sharpen kernel
        const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        const sharpened = applyConvolution(imgCopy, sharpenKernel, 3);
        bCtx.putImageData(sharpened, 0, 0);

        // Variant C: Otsu binarization
        const cCanvas = document.createElement('canvas');
        cCanvas.width = baseCanvas.width; cCanvas.height = baseCanvas.height;
        const cCtx = cCanvas.getContext('2d');
        const cImg = new ImageData(new Uint8ClampedArray(baseImg.data), baseImg.width, baseImg.height);
        grayscaleImageData(cImg);
        otsuThreshold(cImg);
        cCtx.putImageData(cImg, 0, 0);

        return [toDataURL(aCanvas), toDataURL(bCanvas), toDataURL(cCanvas)];
    };

    const variants = await generateVariants(imageData);

    const results = [];
    // Try a few psm strategies
    const psmList = ['3', '6', '7'];
    for (let vi = 0; vi < variants.length; vi++) {
        for (let pi = 0; pi < psmList.length; pi++) {
            try {
                await worker.setParameters({ tessedit_pageseg_mode: psmList[pi] });
                const res = await worker.recognize(variants[vi]);
                const txt = (res && res.data && res.data.text) ? res.data.text.trim() : '';
                // compute average word confidence when available
                let avgConf = 0;
                try {
                    if (res && res.data && Array.isArray(res.data.words) && res.data.words.length) {
                        avgConf = res.data.words.reduce((s, w) => s + (Number(w.confidence) || 0), 0) / res.data.words.length;
                    } else if (res && res.data && typeof res.data.confidence === 'number') {
                        avgConf = res.data.confidence;
                    }
                } catch (e) {
                    avgConf = 0;
                }
                results.push({ text: txt, variant: vi, psm: psmList[pi], avgConfidence: avgConf });
            } catch (err) {
                console.warn('Variant recognition error', err && err.message);
            }
        }
    }

    // Score parsed results and pick best using heuristics + avg confidence
    let best = { score: -Infinity, text: '' };
    for (const r of results) {
        const parsed = parseCitizenText(r.text || '');
        let score = 0;
        if (r.avgConfidence) score += (Number(r.avgConfidence) || 0) * 0.4; // weight confidence
        if (parsed.nameNep && parsed.nameNep.length > 2) score += parsed.nameNep.length * 4;
        if (parsed.nameEng && parsed.nameEng.length > 2) score += parsed.nameEng.length * 1;
        if (parsed.citNo && parsed.citNo.length > 3) score += parsed.citNo.replace(/[^0-9]/g, '').length * 5;
        if (/नागरिकता|नाम/.test(r.text || '')) score += 12;
        if (DEVANAGARI_RANGE.test(r.text || '')) score += 6;
        if (score > best.score) best = { score, text: r.text, info: r };
    }

    let finalText = best.text || (results[0] && results[0].text) || '';

    // If citizen number missing or too short, attempt a focused digits-only pass
    try {
        const parsedBest = parseCitizenText(finalText || '');
        const citDigits = (parsedBest.citNo || '').replace(/[^0-9]/g, '');
        if (!citDigits || citDigits.length < 4) {
            // run a digits-focused recognition on the first variant
            if (variants && variants.length) {
                await worker.setParameters({ tessedit_pageseg_mode: '7', tessedit_char_whitelist: '0123456789/-' });
                const resDigits = await worker.recognize(variants[0]);
                const digitText = (resDigits && resDigits.data && resDigits.data.text) ? resDigits.data.text.trim() : '';
                const combined = (finalText || '') + '\n' + digitText;
                const parsedCombined = parseCitizenText(combined);
                if (parsedCombined.citNo && parsedCombined.citNo.replace(/[^0-9]/g, '').length >= 4) {
                    finalText = combined;
                }
            }
        }
    } catch (err) {
        console.warn('Digits-only fallback failed:', err && err.message);
    } finally {
        try {
            // clear any digit-only whitelist to avoid affecting future passes
            await worker.setParameters({ tessedit_char_whitelist: '' });
        } catch (e) {
            // ignore
        }
    }

    ocrResultCache.set(imageData, finalText);
    return finalText;
}

function recognizeImageBatch(imageList) {
    return Promise.all(imageList.map((imageData) => recognizeImageText(imageData)));
}

function normalizeOCRText(text) {
    return (text || '')
        .normalize('NFKC')
        .replace(/\r/g, '')
        .replace(/[|]/g, 'I')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/[ \t]+/g, ' ');
}

function getTrimmedLines(text) {
    return normalizeOCRText(text)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
}

function extractValueFromLabeledLine(line, labelRegex) {
    const match = line.match(labelRegex);
    if (!match) return '';

    return (match.groups?.value || '')
        .replace(/^[\s:=\-]+/, '')
        .trim();
}

function pickBestNameLine(lines, mode) {
    const filtered = (lines || [])
        .filter((line) => {
            const hasDevanagari = DEVANAGARI_RANGE.test(line);
            return mode === 'nep' ? hasDevanagari : !hasDevanagari && /[A-Za-z]/.test(line);
        })
        .filter((line) => line.length >= 3)
        .filter((line) => !/(citizenship|number|address|ward|district|sex|date|issued|birth)/i.test(line))
        .sort((a, b) => b.length - a.length);
    return filtered.length ? filtered[0] : '';
}

function parseCitizenText(text) {
    const out = { nameNep: '', nameEng: '', citNo: '' };
    if (!text) return out;

    const normalizedText = normalizeOCRText(text);
    const lines = getTrimmedLines(normalizedText);

    const devanagariDigitsToAscii = (s) => {
        if (!s) return s;
        return s.replace(/[\u0966-\u096F]/g, (ch) => String.fromCharCode(48 + (ch.charCodeAt(0) - 0x0966)));
    };

    // Nepali name — labeled patterns first
    const nepLabel = /(?:नाम|नाव|नामः|पूरा\s*नाम|व्यक्तिको\s*नाम)\s*[:=\-]?\s*(.+)/iu;
    for (const line of lines) {
        const m = line.match(nepLabel);
        if (m && m[1] && DEVANAGARI_RANGE.test(m[1])) {
            out.nameNep = m[1].trim();
            break;
        }
    }

    // Fallback: best Devanagari line
    if (!out.nameNep) out.nameNep = pickBestNameLine(lines, 'nep');

    // English name — labeled patterns first
    const engLabel = /(?:full\s*name|name\s*in\s*english|name)\s*[:=\-]?\s*([A-Za-z][A-Za-z\s.]+)/i;
    for (const line of lines) {
        const m = line.match(engLabel);
        if (m && m[1]) {
            out.nameEng = m[1].trim();
            break;
        }
    }

    // Fallback: best Latin line
    if (!out.nameEng) out.nameEng = pickBestNameLine(lines, 'eng');

    // Citizenship number extraction with digit normalization
    let found = null;
    const nepCitLabel = /नागरिकता\s*(?:न|नं|न\.|नं\.)?\s*[:=]?\s*([0-9\u0966-\u096F][0-9\u0966-\u096F\/\- ]{2,})/iu;
    const engCitLabel = /Citizenship\s*(?:No\.?|Number)?\s*[:=]?\s*([0-9][0-9\/\- ]{2,})/i;

    let m = normalizedText.match(nepCitLabel);
    if (m && m[1]) found = devanagariDigitsToAscii(m[1]);
    if (!found) {
        m = normalizedText.match(engCitLabel);
        if (m && m[1]) found = m[1];
    }

    if (!found) {
        const digitsNormalized = devanagariDigitsToAscii(normalizedText);
        const candidates = digitsNormalized.match(/([0-9][0-9\/\- ]{3,})/g);
        if (candidates && candidates.length) {
            candidates.sort((a, b) => b.replace(/[^0-9]/g, '').length - a.replace(/[^0-9]/g, '').length);
            found = candidates[0];
        }
    }

    if (found) {
        let cleaned = found.replace(/[^0-9\/\-]/g, '');
        cleaned = cleaned.replace(/^[\/\-]+|[\/\-]+$/g, '');
        cleaned = cleaned.replace(/[\/\-]{2,}/g, '/');
        out.citNo = cleaned;
    } else {
        // line-level fallback
        for (const line of lines) {
            const dd = devanagariDigitsToAscii(line);
            const cand2 = dd.match(/([0-9][0-9\/\- ]{3,})/g);
            if (cand2 && cand2.length) {
                const chosen = cand2.sort((a, b) => b.replace(/[^0-9]/g, '').length - a.replace(/[^0-9]/g, '').length)[0];
                const cleaned = chosen.replace(/[^0-9\/\-]/g, '').replace(/^[\/\-]+|[\/\-]+$/g, '').replace(/[\/\-]{2,}/g, '/');
                out.citNo = cleaned;
                break;
            }
        }
    }

    return out;
}

function getPdfFieldValue(id, fallback = "") {
    return (document.getElementById(id)?.value || "").trim() || fallback;
}

function getPdfFirstValue(ids, fallback = "") {
    for (const id of ids) {
        const value = getPdfFieldValue(id, "");
        if (value) return value;
    }
    return fallback;
}

function getWardOfficeDetails() {
    return {
        wardNo: getPdfFirstValue(["birthWardNo", "addressWardNo"], "१५"),
        municipality: getPdfFirstValue(["birthMunicipality", "addressMunicipality"], "हेटौंडा उपमहानगरपालिका"),
        district: getPdfFirstValue(["birthDistrict"], "मकवानपुर")
    };
}

function getNibedakInfo(serviceKey, fallbackName = "....................................", fallbackCit = ".........................") {
    const serviceData = serviceState[serviceKey] || {};
    const nibedakName = (serviceData.nibidakNameNep || serviceData.nibidakNameEng || "").trim() || fallbackName;
    const nibedakCitNo = (serviceData.nibidakCitNo || "").trim() || fallbackCit;
    return { nibedakName, nibedakCitNo };
}

function getCurrentServiceKey() {
    const visiblePage = document.querySelector('.service-page:not(.hidden)');
    return visiblePage?.id.replace(/Page$/, '') || '';
}

function toNepaliDigits(value) {
    return String(value).replace(/[0-9]/g, (digit) => '०१२३४५६७८९'[Number(digit)]);
}

function getNepaliDateString(date = new Date()) {
    const dateParts = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date).reduce((parts, part) => {
        if (part.type !== 'literal') parts[part.type] = part.value;
        return parts;
    }, {});
    return toNepaliDigits(`${dateParts.year}/${dateParts.month}/${dateParts.day}`);
}

function setupNumericInputs() {
    document.querySelectorAll('input[id*="contact" i]').forEach((input) => {
        input.type = 'tel';
        input.inputMode = 'numeric';
        input.pattern = '[0-9]*';
        input.maxLength = 10;
        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    });

    document.querySelectorAll('input[id*="citizenship" i], input[id$="CitNo"]').forEach((input) => {
        input.inputMode = 'numeric';
        input.pattern = '.*';
        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^0-9०-९/-]/g, '');
        });
    });
}

function setupDuplicateUploadGuard() {
    document.addEventListener('change', (event) => {
        const input = event.target;
        if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !input.files?.[0]) return;

        const currentFile = input.files[0];
        const currentSignature = `${currentFile.name}|${currentFile.size}|${currentFile.lastModified}`;
        const servicePage = input.closest('.service-page');
        const duplicate = Array.from(servicePage?.querySelectorAll('input[type="file"]') || [])
            .filter((fileInput) => fileInput !== input && fileInput.files?.[0])
            .some((fileInput) => {
                const file = fileInput.files[0];
                return `${file.name}|${file.size}|${file.lastModified}` === currentSignature;
            });

        if (!duplicate) return;

        input.value = '';
        event.stopImmediatePropagation();
        alert('This picture has already been uploaded. Please choose another picture.');
    }, true);
}

function validateServiceForm(serviceKey) {
    const manualFormSteps = {
        birth: 6, death: 4, citizenship: 4, marriage: 5, divorce: 5,
        migration: 4, relationship: 4, income: 4, property: 4, tax: 4,
        address: 4, unmarried: 4, character: 4, road: 4, otherForm: 4
    };
    const form = document.getElementById(`${serviceKey}Step${manualFormSteps[serviceKey]}`);
    const requiredUploads = getRequiredUploadGroups(serviceKey, serviceKey === 'birth' ? 4 : 3);
    const missingUpload = requiredUploads.find((group) => group.some((key) => !serviceState[serviceKey]?.[key]));

    if (missingUpload) {
        alert('Please upload all required documents before generating the PDF.');
        return false;
    }

    if (!form) return true;

    const emptyField = Array.from(form.querySelectorAll('input, textarea, select'))
        .find((field) => field.type !== 'file' && !String(field.value || '').trim());

    if (!emptyField) return true;

    const label = form.querySelector(`label[for="${emptyField.id}"]`)?.textContent.trim()
        || emptyField.closest('div')?.querySelector('label')?.textContent.trim()
        || 'a required field';
    emptyField.setCustomValidity(`${label} is required.`);
    emptyField.reportValidity();
    emptyField.addEventListener('input', () => emptyField.setCustomValidity(''), { once: true });
    alert(`Please fill in ${label} before generating the PDF.`);
    emptyField.focus();
    return false;
}

const uploadedDocumentOrder = {
    birth: ['fatherFront', 'fatherBack', 'motherFront', 'motherBack', 'nibidakFront', 'nibidakBack', 'hospital'],
    death: ['deceasedFront', 'deceasedBack', 'nibidakFront', 'nibidakBack'],
    citizenship: ['primaryFront', 'primaryBack', 'nibidakFront', 'nibidakBack'],
    marriage: ['groomFront', 'groomBack', 'brideFront', 'brideBack', 'nibidakFront', 'nibidakBack'],
    divorce: ['husbandFront', 'husbandBack', 'wifeFront', 'wifeBack', 'nibidakFront', 'nibidakBack'],
    migration: ['primaryFront', 'primaryBack', 'nibidakFront', 'nibidakBack'],
    relationship: ['documentFront', 'documentBack', 'nibidakFront', 'nibidakBack'],
    income: ['documentFront', 'documentBack', 'nibidakFront', 'nibidakBack'],
    property: ['documentFront', 'documentBack', 'nibidakFront', 'nibidakBack'],
    tax: ['documentFront', 'documentBack', 'nibidakFront', 'nibidakBack'],
    address: ['documentFront', 'documentBack', 'nibidakFront', 'nibidakBack'],
    unmarried: ['documentFront', 'documentBack', 'nibidakFront', 'nibidakBack'],
    character: ['documentFront', 'documentBack', 'nibidakFront', 'nibidakBack'],
    road: ['documentFront', 'documentBack', 'nibidakFront', 'nibidakBack'],
    otherForm: ['documentFront', 'documentBack', 'nibidakFront', 'nibidakBack']
};

function getUploadedDocuments(serviceKey) {
    const serviceData = serviceState[serviceKey] || {};
    return (uploadedDocumentOrder[serviceKey] || [])
        .map((key) => serviceData[key])
        .filter((imageData) => typeof imageData === 'string' && imageData.startsWith('data:image/'));
}

function getUploadedDocumentGroups(serviceKey) {
    const serviceData = serviceState[serviceKey] || {};
    const keys = uploadedDocumentOrder[serviceKey] || [];
    const groups = [];

    for (let index = 0; index < keys.length; index += 1) {
        const key = keys[index];
        const imageData = serviceData[key];
        if (typeof imageData !== 'string' || !imageData.startsWith('data:image/')) continue;

        const nextKey = keys[index + 1];
        const pairPrefix = key.replace(/Front$/, '');
        const nextImageData = serviceData[nextKey];
        if (
            key.endsWith('Front') &&
            nextKey === `${pairPrefix}Back` &&
            typeof nextImageData === 'string' &&
            nextImageData.startsWith('data:image/')
        ) {
            groups.push([imageData, nextImageData]);
            index += 1;
        } else {
            groups.push([imageData]);
        }
    }

    return groups;
}

function getPdfImage(imageData) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const width = image.naturalWidth || image.width;
            const height = image.naturalHeight || image.height;
            const mimeType = imageData.slice(5, imageData.indexOf(';')).toLowerCase();

            if (mimeType === 'image/png' || mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
                resolve({ dataUrl: imageData, width, height, format: mimeType === 'image/png' ? 'PNG' : 'JPEG' });
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(image, 0, 0, width, height);
            resolve({ dataUrl: canvas.toDataURL('image/png'), width, height, format: 'PNG' });
        };
        image.onerror = () => reject(new Error('Uploaded image could not be loaded into the PDF.'));
        image.src = imageData;
    });
}

async function appendUploadedDocuments(doc, serviceKey) {
    const imageGroups = getUploadedDocumentGroups(serviceKey);
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);

    for (const imageGroup of imageGroups) {
        doc.addPage();
        const gap = imageGroup.length > 1 ? 8 : 0;
        const groupMaxHeight = (maxHeight - gap * (imageGroup.length - 1)) / imageGroup.length;
        let currentY = margin;

        for (const imageData of imageGroup) {
        try {
            const { dataUrl, width, height, format } = await getPdfImage(imageData);
            const scale = Math.min(maxWidth / width, groupMaxHeight / height);
            const renderedWidth = width * scale;
            const renderedHeight = height * scale;
            const x = (pageWidth - renderedWidth) / 2;
            doc.addImage(dataUrl, format, x, currentY, renderedWidth, renderedHeight, undefined, 'NONE');
            currentY += groupMaxHeight + gap;
        } catch (error) {
            console.warn('Skipping an uploaded document in the PDF:', error.message);
        }
        }
    }
}

async function createWardNibedanPdf({ title, subject, paragraphs, attachments, applicantLines, fileName, successMessage }) {
    const serviceKey = getCurrentServiceKey();
    if (!validateServiceForm(serviceKey)) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");
    const ward = getWardOfficeDetails();

    // Devanagari has no reliable text-shaping support in jsPDF's native
    // doc.text() (pre-base vowel signs like ि end up in the wrong visual
    // position - e.g. "मिति" would draw as "मतिि"). DevanagariPdfText
    // (devanagari-canvas-text.js) works around this by rendering each line
    // through the browser's own correctly-shaping canvas text engine and
    // placing the result as an image. See that file for details.
    const DText = window.DevanagariPdfText;
    if (!DText) {
        alert("Devanagari text renderer (devanagari-canvas-text.js) is not loaded. Please add it to index.html before script.js.");
        return;
    }
    await DText.ensureFontLoaded();

    let y = 18;
    const ensureSpace = (needed = 10) => {
        if (y + needed > 285) {
            doc.addPage();
            y = 18;
        }
    };

    await DText.drawText(doc, title, 105, y, { fontSizePt: 18, bold: true, align: "center" });
    y += 14;

    await DText.drawText(doc, "मिति: " + getNepaliDateString(), 165, y, { fontSizePt: 11 });
    y += 12;

    await DText.drawText(doc, "श्रीमान् वडाध्यक्षज्यू,", 20, y, { fontSizePt: 11 });
    y += 7;
    await DText.drawText(doc, `वडा नं. ${ward.wardNo}, वडा कार्यालय,`, 20, y, { fontSizePt: 11 });
    y += 7;
    await DText.drawText(doc, `${ward.municipality},`, 20, y, { fontSizePt: 11 });
    y += 7;
    await DText.drawText(doc, `${ward.district} ।`, 20, y, { fontSizePt: 11 });
    y += 14;

    await DText.drawText(doc, `विषय: ${subject}`, 20, y, { fontSizePt: 11, bold: true });
    y += 14;

    for (const paragraph of paragraphs) {
        if (!paragraph) continue;
        const lines = await DText.wrapText(paragraph, 172, 11, false);
        ensureSpace(lines.length * 7 + 8);
        for (const line of lines) {
            await DText.drawText(doc, line, 20, y, { fontSizePt: 11 });
            y += 7;
        }
        y += 6;
    }

    ensureSpace(20);
    y += 4;
    await DText.drawText(doc, "संलग्न कागजातहरू:", 20, y, { fontSizePt: 11, bold: true });
    y += 10;

    const nepNums = ["१", "२", "३", "४", "५", "६", "७", "८", "९", "१०"];
    for (let index = 0; index < attachments.length; index += 1) {
        ensureSpace(9);
        const prefix = nepNums[index] || `${index + 1}`;
        await DText.drawText(doc, `${prefix}. ${attachments[index]}`, 26, y, { fontSizePt: 11 });
        y += 7;
    }

    ensureSpace(40);
    y += 9;
    await DText.drawText(doc, "निवेदक", 180, y, { fontSizePt: 11, align: "right" });
    y += 10;

    for (const line of applicantLines) {
        if (!line) continue;
        ensureSpace(10);
        await DText.drawText(doc, line, 180, y, { fontSizePt: 11, align: "right" });
        y += 8;
    }

    y += 10;
    doc.setLineWidth(0.4);
    doc.line(120, y, 180, y);

    await appendUploadedDocuments(doc, getCurrentServiceKey());
    doc.save(fileName);
    alert(successMessage);
}

function generateBirthPDF() {
    const fatherNameNep = getPdfFieldValue("birthFatherNameNep", "....................................");
    const fatherCitizenshipNo = getPdfFieldValue("birthFatherCitizenshipNo", ".........................");
    const motherNameNep = getPdfFieldValue("birthMotherNameNep", "....................................");
    const motherCitizenshipNo = getPdfFieldValue("birthMotherCitizenshipNo", ".........................");
    const permAddressNep = getPdfFieldValue("birthPermAddress", "............................................................");
    const municipality = getPdfFieldValue("birthMunicipality", "हेटौंडा उपमहानगरपालिका");
    const wardNo = getPdfFieldValue("birthWardNo", "१५");
    const district = getPdfFieldValue("birthDistrict", "मकवानपुर");
    const tol = getPdfFieldValue("birthTolname", "....................");
    const childNameNep = getPdfFieldValue("birthChildNameNep", "....................................");
    const childNameEng = getPdfFieldValue("birthChildNameEng", "");
    const dobBS = getPdfFieldValue("birthDobBS", "........................");
    const gender = getPdfFieldValue("birthGender", "................");
    const birthPlace = getPdfFieldValue("birthPlace", "...............................");
    const contact = getPdfFieldValue("birthContactNumber", ".........................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("birth", fatherNameNep, fatherCitizenshipNo);
    const childName = childNameEng ? `${childNameNep} (${childNameEng})` : childNameNep;

    createWardNibedanPdf({
        title: "जन्म दर्ता सम्बन्धी निवेदन",
        subject: "जन्म दर्ता गराई पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा ${fatherNameNep} (नागरिकता नं. ${fatherCitizenshipNo}) र श्रीमती ${motherNameNep} (नागरिकता नं. ${motherCitizenshipNo}) को स्थायी ठेगाना ${permAddressNep}, टोल ${tol}, वडा नं. ${wardNo}, ${municipality}, ${district} रहेको छ ।`,
            `हाम्रो सन्तान ${childName} को जन्म मिति ${dobBS} (वि.सं.) मा ${birthPlace} मा भएको हो । लिङ्ग: ${gender} । हालसम्म जन्म दर्ता भएको छैन ।`,
            "तसर्थ आवश्यक कागजात संलग्न गरी जन्म दर्ता गराई दिनुहुन अनुरोध गर्दछौं ।"
        ],
        attachments: [
            "बाबु/आमाको नागरिकताको प्रतिलिपि",
            "अस्पतालबाट प्राप्त जन्म प्रमाणपत्र (भएमा)",
            "विवाह दर्ता प्रमाणपत्र (भएमा)",
            "बसाइँसराइ प्रमाणपत्र (भएमा)"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`,
            `बाबुको नाम: ${fatherNameNep}`,
            `आमाको नाम: ${motherNameNep}`,
            `सम्पर्क नं.: ${contact}`
        ],
        fileName: "जन्म_दर्ता_निवेदन.pdf",
        successMessage: "✓ जन्म दर्ता निवेदन PDF तयार भयो!"
    });
}

function generateDeathPDF() {
    const deceasedName = getPdfFieldValue("deathDeceasedName", "....................................");
    const deceasedCitizenship = getPdfFieldValue("deathDeceasedCitizenship", ".........................");
    const deathDate = getPdfFieldValue("deathDateOfDeath", "........................");
    const deathPlace = getPdfFieldValue("deathPlace", "...............................");
    const contact = getPdfFieldValue("deathContact", ".........................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("death");

    createWardNibedanPdf({
        title: "मृत्यु दर्ता सम्बन्धी निवेदन",
        subject: "मृत्यु दर्ता गराई पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा ${deceasedName} (नागरिकता नं. ${deceasedCitizenship}) को मृत्यु मिति ${deathDate} मा ${deathPlace} मा भएको हो ।`,
            `म निवेदक ${nibedakName} ले उक्त व्यक्तिको मृत्यु दर्ता हालसम्म नभएकोले आवश्यक प्रक्रिया पूरा गरी मृत्यु दर्ता गराई दिनुहुन अनुरोध गर्दछु ।`,
            "तसर्थ आवश्यक कागजात संलग्न गरी मृत्यु दर्ता गराई दिनुहुन अनुरोध गर्दछु ।"
        ],
        attachments: [
            "मृतकको नागरिकताको प्रतिलिपि (भएमा)",
            "स्वास्थ्य संस्था/अस्पतालबाट प्राप्त मृत्यु प्रमाणपत्र (भएमा)",
            "निवेदकसँगको सम्बन्ध पुष्टि गर्ने कागजात",
            "बसाइँसराइ प्रमाणपत्र (भएमा)"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`,
            `सम्पर्क नं.: ${contact}`
        ],
        fileName: "मृत्यु_दर्ता_निवेदन.pdf",
        successMessage: "✓ मृत्यु दर्ता निवेदन PDF तयार भयो!"
    });
}

function generateCitizenshipPDF() {
    const nameNep = getPdfFieldValue("citizenshipNameNep", "....................................");
    const nameEng = getPdfFieldValue("citizenshipNameEng", "....................................");
    const citNo = getPdfFieldValue("citizenshipCitNo", ".........................");
    const dateIssue = getPdfFieldValue("citizenshipDateIssue", "........................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("citizenship", nameNep, citNo);

    createWardNibedanPdf({
        title: "नागरिकता सिफारिस सम्बन्धी निवेदन",
        subject: "नागरिकता सिफारिस गराई पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा ${nameNep} (${nameEng}) नागरिकता नं. ${citNo} भएको व्यक्ति हुँ । नागरिकता जारी मिति ${dateIssue} रहेको विवरण पेश गर्दछु ।`,
            `नागरिकता सम्बन्धी आवश्यक सिफारिस प्राप्त गर्नुपर्ने भएकोले यस वडा कार्यालयबाट आवश्यक सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।`,
            "तसर्थ आवश्यक कागजात संलग्न गरी नागरिकता सिफारिस प्रदान गराई दिनुहुन अनुरोध गर्दछु ।"
        ],
        attachments: [
            "नागरिकताको प्रतिलिपि",
            "जन्म दर्ता प्रमाणपत्र/शैक्षिक प्रमाणपत्र",
            "बसोबास खुल्ने कागजात",
            "निवेदकको नागरिकताको प्रतिलिपि"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`
        ],
        fileName: "नागरिकता_सिफारिस_निवेदन.pdf",
        successMessage: "✓ नागरिकता सिफारिस निवेदन PDF तयार भयो!"
    });
}

function generateMarriagePDF() {
    const groomNameNep = getPdfFieldValue("marriageGroomNameNep", "....................................");
    const groomNameEng = getPdfFieldValue("marriageGroomNameEng", "....................................");
    const groomCitNo = getPdfFieldValue("marriageGroomCitNo", ".........................");
    const brideNameNep = getPdfFieldValue("marriageBrideNameNep", "....................................");
    const brideNameEng = getPdfFieldValue("marriageBrideNameEng", "....................................");
    const brideCitNo = getPdfFieldValue("marriageBrideCitNo", ".........................");
    const marriageDate = getPdfFieldValue("marriageDate", "........................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("marriage", groomNameNep, groomCitNo);

    createWardNibedanPdf({
        title: "विवाह दर्ता सम्बन्धी निवेदन",
        subject: "विवाह दर्ता गराई पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा बेहुला ${groomNameNep} (${groomNameEng}) नागरिकता नं. ${groomCitNo} र बेहुली ${brideNameNep} (${brideNameEng}) नागरिकता नं. ${brideCitNo} बीच विवाह मिति ${marriageDate} मा सम्पन्न भएको हो ।`,
            "उक्त विवाह हालसम्म दर्ता नभएकोले कानूनी प्रक्रिया अनुसार विवाह दर्ता गराई दिनुहुन विनम्र अनुरोध गर्दछौं ।",
            "तसर्थ आवश्यक कागजात संलग्न गरी विवाह दर्ता प्रमाणपत्र उपलब्ध गराई दिनुहुन अनुरोध गर्दछौं ।"
        ],
        attachments: [
            "बेहुला/बेहुलीको नागरिकताको प्रतिलिपि",
            "विवाह सम्पन्न भएको प्रमाण (पुरोहित/साक्षी विवरण)",
            "दुवै पक्षको फोटो",
            "निवेदकको नागरिकताको प्रतिलिपि"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`
        ],
        fileName: "विवाह_दर्ता_निवेदन.pdf",
        successMessage: "✓ विवाह दर्ता निवेदन PDF तयार भयो!"
    });
}

function generateDivorcePDF() {
    const husbandNameNep = getPdfFieldValue("divorceHusbandNameNep", "....................................");
    const husbandNameEng = getPdfFieldValue("divorceHusbandNameEng", "....................................");
    const husbandCitNo = getPdfFieldValue("divorceHusbandCitNo", ".........................");
    const wifeNameNep = getPdfFieldValue("divorceWifeNameNep", "....................................");
    const wifeNameEng = getPdfFieldValue("divorceWifeNameEng", "....................................");
    const wifeCitNo = getPdfFieldValue("divorceWifeCitNo", ".........................");
    const divorceDate = getPdfFieldValue("divorceDate", "........................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("divorce", husbandNameNep, husbandCitNo);

    createWardNibedanPdf({
        title: "सम्बन्ध विच्छेद दर्ता सम्बन्धी निवेदन",
        subject: "सम्बन्ध विच्छेद दर्ता गराई पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा श्री ${husbandNameNep} (${husbandNameEng}) नागरिकता नं. ${husbandCitNo} र श्रीमती ${wifeNameNep} (${wifeNameEng}) नागरिकता नं. ${wifeCitNo} बीच सम्बन्ध विच्छेद मिति ${divorceDate} मा भएको हो ।`,
            "उक्त सम्बन्ध विच्छेदको अभिलेखीकरण तथा दर्ता आवश्यक परेको हुँदा सम्बन्ध विच्छेद दर्ता गरी प्रमाणपत्र उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।",
            "तसर्थ आवश्यक कागजात संलग्न गरी सम्बन्ध विच्छेद दर्ता सम्बन्धी कार्य सम्पन्न गराई दिनुहुन अनुरोध गर्दछु ।"
        ],
        attachments: [
            "दुवै पक्षको नागरिकताको प्रतिलिपि",
            "सम्बन्ध विच्छेद आदेश/सम्झौता पत्र",
            "विवाह दर्ता प्रमाणपत्रको प्रतिलिपि (भएमा)",
            "निवेदकको नागरिकताको प्रतिलिपि"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`
        ],
        fileName: "सम्बन्ध_विच्छेद_निवेदन.pdf",
        successMessage: "✓ सम्बन्ध विच्छेद निवेदन PDF तयार भयो!"
    });
}

function generateMigrationPDF() {
    const nameNep = getPdfFieldValue("migrationNameNep", "....................................");
    const nameEng = getPdfFieldValue("migrationNameEng", "....................................");
    const citNo = getPdfFieldValue("migrationCitNo", ".........................");
    const fromLocation = getPdfFieldValue("migrationFromLocation", "....................................");
    const toLocation = getPdfFieldValue("migrationToLocation", "....................................");
    const migrationDate = getPdfFieldValue("migrationDate", "........................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("migration", nameNep, citNo);

    createWardNibedanPdf({
        title: "बसाइँसराइ सम्बन्धी निवेदन",
        subject: "बसाइँसराइ सिफारिस पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा ${nameNep} (${nameEng}) नागरिकता नं. ${citNo} बसाइँसराइ मिति ${migrationDate} देखि ${fromLocation} बाट ${toLocation} मा बसोबास गर्ने उद्देश्यले स्थानान्तरण हुन लागेको छु ।`,
            "नियमअनुसार बसाइँसराइ सम्बन्धी सिफारिस/प्रमाणपत्र आवश्यक परेको हुँदा यस वडा कार्यालयबाट उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।",
            "तसर्थ आवश्यक कागजात संलग्न गरी बसाइँसराइ सम्बन्धी कार्य सम्पन्न गराई दिनुहुन अनुरोध गर्दछु ।"
        ],
        attachments: [
            "नागरिकताको प्रतिलिपि",
            "हाल बसोबास खुल्ने कागजात",
            "बसाइँ जाने स्थानको विवरण",
            "निवेदकको नागरिकताको प्रतिलिपि"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`
        ],
        fileName: "बसाइँसराइ_निवेदन.pdf",
        successMessage: "✓ बसाइँसराइ निवेदन PDF तयार भयो!"
    });
}

function generateRelationshipPDF() {
    const nameNep = getPdfFieldValue("relationshipNameNep", "....................................");
    const nameEng = getPdfFieldValue("relationshipNameEng", "....................................");
    const relType = getPdfFieldValue("relationshipType", "................");
    const relName = getPdfFieldValue("relationshipRelatedName", "....................................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("relationship", nameNep);

    createWardNibedanPdf({
        title: "नाता प्रमाणपत्र सम्बन्धी निवेदन",
        subject: "नाता प्रमाणपत्र सिफारिस पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा ${nameNep} (${nameEng}) र ${relName} बीच ${relType} नाता सम्बन्ध रहेको छ ।`,
            "उक्त नाता सम्बन्ध पुष्टि हुने प्रमाणपत्र आवश्यक परेको हुँदा यस वडा कार्यालयबाट नाता प्रमाणपत्र सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।",
            "तसर्थ आवश्यक कागजात संलग्न गरी नाता प्रमाणपत्र सम्बन्धी सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।"
        ],
        attachments: [
            "नाता सम्बन्ध पुष्टि हुने कागजात",
            "दुवै पक्षको नागरिकताको प्रतिलिपि",
            "जन्म/विवाह/परिवार अभिलेख सम्बन्धी प्रमाण",
            "निवेदकको नागरिकताको प्रतिलिपि"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`
        ],
        fileName: "नाता_प्रमाणपत्र_निवेदन.pdf",
        successMessage: "✓ नाता प्रमाणपत्र निवेदन PDF तयार भयो!"
    });
}

function generateIncomePDF() {
    const nameNep = getPdfFieldValue("incomeNameNep", "....................................");
    const nameEng = getPdfFieldValue("incomeNameEng", "....................................");
    const income = getPdfFieldValue("incomeAnnualIncome", ".........................");
    const source = getPdfFieldValue("incomeSource", "....................................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("income", nameNep);

    createWardNibedanPdf({
        title: "आय प्रमाणपत्र सम्बन्धी निवेदन",
        subject: "आय प्रमाणपत्र सिफारिस पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा ${nameNep} (${nameEng}) को वार्षिक आय रु. ${income} रहेको छ र आयको स्रोत ${source} रहेको छ ।`,
            "उक्त विवरण आवश्यक प्रयोजनका लागि पेश गर्न आय प्रमाणपत्र आवश्यक परेको हुँदा आय प्रमाणपत्र सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।",
            "तसर्थ आवश्यक कागजात संलग्न गरी आय प्रमाणपत्र सम्बन्धी सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।"
        ],
        attachments: [
            "आय खुल्ने कागजात/सिफारिस",
            "नागरिकताको प्रतिलिपि",
            "आर्थिक विवरण (भएमा)",
            "निवेदकको नागरिकताको प्रतिलिपि"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`
        ],
        fileName: "आय_प्रमाणपत्र_निवेदन.pdf",
        successMessage: "✓ आय प्रमाणपत्र निवेदन PDF तयार भयो!"
    });
}

function generatePropertyPDF() {
    const ownerName = getPdfFieldValue("propertyOwnerNameNep", "....................................");
    const ownerNameEng = getPdfFieldValue("propertyOwnerNameEng", "....................................");
    const location = getPdfFieldValue("propertyLocation", "....................................");
    const value = getPdfFieldValue("propertyValue", ".........................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("property", ownerName);

    createWardNibedanPdf({
        title: "सम्पत्ति मूल्यांकन सम्बन्धी निवेदन",
        subject: "सम्पत्ति मूल्यांकन प्रमाणपत्र पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा सम्पत्ति धनी ${ownerName} (${ownerNameEng}) को सम्पत्ति ${location} मा रहेको छ र उक्त सम्पत्तिको अनुमानित मूल्य रु. ${value} रहेको विवरण पेश गर्दछु ।`,
            "सम्बन्धित प्रयोजनका लागि सम्पत्ति मूल्यांकन प्रमाणपत्र आवश्यक परेको हुँदा यस वडा कार्यालयबाट सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।",
            "तसर्थ आवश्यक कागजात संलग्न गरी सम्पत्ति मूल्यांकन सम्बन्धी सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।"
        ],
        attachments: [
            "जग्गाधनी प्रमाणपत्र/लालपुर्जा प्रतिलिपि",
            "नक्सा/कित्ता विवरण (भएमा)",
            "सम्पत्ति धनीको नागरिकताको प्रतिलिपि",
            "निवेदकको नागरिकताको प्रतिलिपि"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`
        ],
        fileName: "सम्पत्ति_मूल्यांकन_निवेदन.pdf",
        successMessage: "✓ सम्पत्ति मूल्यांकन निवेदन PDF तयार भयो!"
    });
}

function generateTaxPDF() {
    const payerName = getPdfFieldValue("taxPayerNameNep", "....................................");
    const payerNameEng = getPdfFieldValue("taxPayerNameEng", "....................................");
    const amount = getPdfFieldValue("taxPaidAmount", ".........................");
    const year = getPdfFieldValue("taxPaymentYear", "........................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("tax", payerName);

    createWardNibedanPdf({
        title: "कर चुक्ता सम्बन्धी निवेदन",
        subject: "कर चुक्ता प्रमाणपत्र पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा करदाता ${payerName} (${payerNameEng}) ले आर्थिक वर्ष ${year} का लागि रु. ${amount} कर भुक्तानी गरेको विवरण पेश गर्दछु ।`,
            "सम्बन्धित प्रयोजनका लागि कर चुक्ता प्रमाणपत्र आवश्यक परेको हुँदा यस वडा कार्यालयबाट कर चुक्ता सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।",
            "तसर्थ आवश्यक कागजात संलग्न गरी कर चुक्ता प्रमाणपत्र उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।"
        ],
        attachments: [
            "कर तिरेको रसिद/भौचर",
            "करदाता नागरिकताको प्रतिलिपि",
            "सम्बन्धित वर्षको कर विवरण",
            "निवेदकको नागरिकताको प्रतिलिपि"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`
        ],
        fileName: "कर_चुक्ता_निवेदन.pdf",
        successMessage: "✓ कर चुक्ता निवेदन PDF तयार भयो!"
    });
}

function generateAddressPDF() {
    const fullName = getPdfFieldValue("addressFullName", "....................................");
    const permanent = getPdfFieldValue("addressPermanent", "............................................................");
    const wardNo = getPdfFieldValue("addressWardNo", "................");
    const municipality = getPdfFieldValue("addressMunicipality", "....................................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("address", fullName);

    createWardNibedanPdf({
        title: "ठेगाना प्रमाणपत्र सम्बन्धी निवेदन",
        subject: "ठेगाना प्रमाणपत्र पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा मेरो नाम ${fullName} र स्थायी ठेगाना ${permanent}, वडा नं. ${wardNo}, ${municipality} रहेको छ ।`,
            "उक्त ठेगाना सम्बन्धी प्रमाणपत्र आवश्यक प्रयोजनका लागि पेश गर्नुपर्ने भएकाले यस वडा कार्यालयबाट ठेगाना प्रमाणपत्र उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।",
            "तसर्थ आवश्यक कागजात संलग्न गरी ठेगाना प्रमाणपत्र सम्बन्धी सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।"
        ],
        attachments: [
            "नागरिकताको प्रतिलिपि",
            "बसोबास प्रमाणित हुने कागजात",
            "घरधनी/टोल सिफारिस (भएमा)",
            "निवेदकको नागरिकताको प्रतिलिपि"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`
        ],
        fileName: "ठेगाना_प्रमाणपत्र_निवेदन.pdf",
        successMessage: "✓ ठेगाना प्रमाणपत्र निवेदन PDF तयार भयो!"
    });
}

function generateUnmarriedPDF() {
    const nameNep = getPdfFieldValue("unmarriedNameNep", "....................................");
    const nameEng = getPdfFieldValue("unmarriedNameEng", "....................................");
    const age = getPdfFieldValue("unmarriedAge", "................");
    const gender = getPdfFieldValue("unmarriedGender", "................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("unmarried", nameNep);

    createWardNibedanPdf({
        title: "अविवाहित प्रमाणपत्र सम्बन्धी निवेदन",
        subject: "अविवाहित प्रमाणपत्र पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा ${nameNep} (${nameEng}) उमेर ${age} वर्ष, लिङ्ग ${gender} भएको व्यक्ति हालसम्म अविवाहित रहेको व्यहोरा निवेदन गर्दछु ।`,
            "सम्बन्धित प्रयोजनका लागि अविवाहित प्रमाणपत्र आवश्यक भएकोले यस वडा कार्यालयबाट अविवाहित प्रमाणपत्र सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।",
            "तसर्थ आवश्यक कागजात संलग्न गरी अविवाहित प्रमाणपत्र उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।"
        ],
        attachments: [
            "नागरिकताको प्रतिलिपि",
            "जन्म दर्ता/उमेर पुष्टि कागजात",
            "अविवाहित रहेको सिफारिस (भएमा)",
            "निवेदकको नागरिकताको प्रतिलिपि"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`
        ],
        fileName: "अविवाहित_निवेदन.pdf",
        successMessage: "✓ अविवाहित प्रमाणपत्र निवेदन PDF तयार भयो!"
    });
}

function generateCharacterPDF() {
    const nameNep = getPdfFieldValue("characterNameNep", "....................................");
    const nameEng = getPdfFieldValue("characterNameEng", "....................................");
    const description = getPdfFieldValue("characterDescription", "............................................................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("character", nameNep);

    createWardNibedanPdf({
        title: "चरित्र प्रमाणपत्र सम्बन्धी निवेदन",
        subject: "चरित्र प्रमाणपत्र पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा ${nameNep} (${nameEng}) सम्बन्धी चरित्र विवरण: ${description} रहेको व्यहोरा निवेदन गर्दछु ।`,
            "आवश्यक प्रयोजनका लागि चरित्र प्रमाणपत्र पेश गर्नुपर्ने भएकाले यस वडा कार्यालयबाट चरित्र प्रमाणपत्र सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।",
            "तसर्थ आवश्यक कागजात संलग्न गरी चरित्र प्रमाणपत्र उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।"
        ],
        attachments: [
            "नागरिकताको प्रतिलिपि",
            "सिफारिस पत्र/संस्था प्रमाण (भएमा)",
            "फोटो (भएमा)",
            "निवेदकको नागरिकताको प्रतिलिपि"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`
        ],
        fileName: "चरित्र_प्रमाणपत्र_निवेदन.pdf",
        successMessage: "✓ चरित्र प्रमाणपत्र निवेदन PDF तयार भयो!"
    });
}

function generateRoadPDF() {
    const nameNep = getPdfFieldValue("roadApplicantNameNep", "....................................");
    const nameEng = getPdfFieldValue("roadApplicantNameEng", "....................................");
    const roadName = getPdfFieldValue("roadName", "....................................");
    const roadWidth = getPdfFieldValue("roadWidth", "................");
    const roadLocation = getPdfFieldValue("roadLocation", "............................................................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("road", nameNep);

    createWardNibedanPdf({
        title: "रोड नाप सम्बन्धी निवेदन",
        subject: "रोड नाप सम्बन्धी सिफारिस पाउँ भन्ने सम्बन्धमा ।",
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा ${nameNep} (${nameEng}) द्वारा ${roadName} सडकको चौडाइ ${roadWidth} रहेको र स्थान ${roadLocation} रहेको विवरण पेश गर्दछु ।`,
            "उक्त सडक/बाटो सम्बन्धी नाप तथा सिफारिस आवश्यक परेको हुँदा यस वडा कार्यालयबाट आवश्यक सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।",
            "तसर्थ आवश्यक कागजात संलग्न गरी रोड नाप सम्बन्धी सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।"
        ],
        attachments: [
            "सम्बन्धित जग्गा/सडक विवरण कागजात",
            "नागरिकताको प्रतिलिपि",
            "नक्सा/मापन विवरण (भएमा)",
            "निवेदकको नागरिकताको प्रतिलिपि"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`
        ],
        fileName: "रोड_नाप_निवेदन.pdf",
        successMessage: "✓ रोड नाप निवेदन PDF तयार भयो!"
    });
}

function generateOtherFormPDF() {
    const nameNep = getPdfFieldValue("otherFormApplicantNameNep", "....................................");
    const nameEng = getPdfFieldValue("otherFormApplicantNameEng", "....................................");
    const subject = getPdfFieldValue("otherFormSubject", "अन्य सिफारिस");
    const referenceNo = getPdfFieldValue("otherFormReferenceNo", "................");
    const purpose = getPdfFieldValue("otherFormPurpose", "............................................................");
    const remarks = getPdfFieldValue("otherFormRemarks", "............................................................");
    const { nibedakName, nibedakCitNo } = getNibedakInfo("otherForm", nameNep);

    createWardNibedanPdf({
        title: "अन्य सिफारिस सम्बन्धी निवेदन",
        subject: `${subject} सम्बन्धमा ।`,
        paragraphs: [
            `प्रस्तुत विषयको सम्बन्धमा निवेदक ${nameNep} (${nameEng}) को सन्दर्भ नं. ${referenceNo} अनुसार ${subject} सम्बन्धी कार्यका लागि यो निवेदन पेश गरिएको हो ।`,
            `उक्त कार्यको उद्देश्य/विवरण: ${purpose}`,
            `थप विवरण/टिप्पणी: ${remarks} । तसर्थ आवश्यक प्रक्रिया पूरा गरी सिफारिस उपलब्ध गराई दिनुहुन अनुरोध गर्दछु ।`
        ],
        attachments: [
            "सम्बन्धित मूल कागजातको प्रतिलिपि",
            "नागरिकताको प्रतिलिपि",
            "समर्थन गर्ने प्रमाण कागजातहरू",
            "निवेदकको नागरिकताको प्रतिलिपि"
        ],
        applicantLines: [
            `नाम: ${nibedakName}`,
            `नागरिकता नं.: ${nibedakCitNo}`
        ],
        fileName: "अन्य_सिफारिस_निवेदन.pdf",
        successMessage: "✓ अन्य सिफारिस निवेदन PDF तयार भयो!"
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    setupNumericInputs();
    setupDuplicateUploadGuard();

    // Birth Service
    const btn = document.getElementById('birthNextToMother');
    if (btn) btn.onclick = () => showServiceStep('birth', 2);
    const btn2 = document.getElementById('birthNextToNibidak');
    if (btn2) btn2.onclick = () => showServiceStep('birth', 3);
    const btn3 = document.getElementById('birthNextToOptionals');
    if (btn3) btn3.onclick = () => showServiceStep('birth', 4);
    const btn4 = document.getElementById('birthNextToOCR');
    if (btn4) btn4.onclick = () => showServiceStep('birth', 5);

    // Death Service
    const deathBtn1 = document.getElementById('deathNextToNibidak');
    if (deathBtn1) deathBtn1.onclick = () => showServiceStep('death', 2);
    const deathBtn2 = document.getElementById('deathNextToOCR');
    if (deathBtn2) { deathBtn2.textContent = 'Continue to Form'; deathBtn2.onclick = () => showServiceStep('death', 4); }

    // Citizenship Service
    const citizenBtn1 = document.getElementById('citizenshipNextToNibidak');
    if (citizenBtn1) citizenBtn1.onclick = () => showServiceStep('citizenship', 2);
    const citizenBtn2 = document.getElementById('citizenshipNextToOCR');
    if (citizenBtn2) { citizenBtn2.textContent = 'Continue to Form'; citizenBtn2.onclick = () => showServiceStep('citizenship', 4); }

    // Marriage Service
    const marryBtn1 = document.getElementById('marriageNextToBride');
    if (marryBtn1) marryBtn1.onclick = () => showServiceStep('marriage', 2);
    const marryBtn2 = document.getElementById('marriageNextToNibidak');
    if (marryBtn2) marryBtn2.onclick = () => showServiceStep('marriage', 3);
    const marryBtn3 = document.getElementById('marriageNextToOCR');
    if (marryBtn3) { marryBtn3.textContent = 'Continue to Form'; marryBtn3.onclick = () => showServiceStep('marriage', 5); }

    // Divorce Service
    const divBtn1 = document.getElementById('divorceNextToWife');
    if (divBtn1) divBtn1.onclick = () => showServiceStep('divorce', 2);
    const divBtn2 = document.getElementById('divorceNextToNibidak');
    if (divBtn2) divBtn2.onclick = () => showServiceStep('divorce', 3);
    const divBtn3 = document.getElementById('divorceNextToOCR');
    if (divBtn3) { divBtn3.textContent = 'Continue to Form'; divBtn3.onclick = () => showServiceStep('divorce', 5); }

    // Migration Service
    const migBtn1 = document.getElementById('migrationNextToNibidak');
    if (migBtn1) migBtn1.onclick = () => showServiceStep('migration', 2);
    const migBtn2 = document.getElementById('migrationNextToOCR');
    if (migBtn2) { migBtn2.textContent = 'Continue to Form'; migBtn2.onclick = () => showServiceStep('migration', 4); }

    // Relationship Service
    const relBtn1 = document.getElementById('relationshipNextToNibidak');
    if (relBtn1) relBtn1.onclick = () => showServiceStep('relationship', 2);
    const relBtn2 = document.getElementById('relationshipNextToOCR');
    if (relBtn2) { relBtn2.textContent = 'Continue to Form'; relBtn2.onclick = () => showServiceStep('relationship', 4); }

    // Income Service
    const incBtn1 = document.getElementById('incomeNextToNibidak');
    if (incBtn1) incBtn1.onclick = () => showServiceStep('income', 2);
    const incBtn2 = document.getElementById('incomeNextToOCR');
    if (incBtn2) { incBtn2.textContent = 'Continue to Form'; incBtn2.onclick = () => showServiceStep('income', 4); }

    // Property Service
    const propBtn1 = document.getElementById('propertyNextToNibidak');
    if (propBtn1) propBtn1.onclick = () => showServiceStep('property', 2);
    const propBtn2 = document.getElementById('propertyNextToOCR');
    if (propBtn2) { propBtn2.textContent = 'Continue to Form'; propBtn2.onclick = () => showServiceStep('property', 4); }

    // Tax Service
    const taxBtn1 = document.getElementById('taxNextToNibidak');
    if (taxBtn1) taxBtn1.onclick = () => showServiceStep('tax', 2);
    const taxBtn2 = document.getElementById('taxNextToOCR');
    if (taxBtn2) { taxBtn2.textContent = 'Continue to Form'; taxBtn2.onclick = () => showServiceStep('tax', 4); }

    // Address Service
    const addrBtn1 = document.getElementById('addressNextToNibidak');
    if (addrBtn1) addrBtn1.onclick = () => showServiceStep('address', 2);
    const addrBtn2 = document.getElementById('addressNextToOCR');
    if (addrBtn2) { addrBtn2.textContent = 'Continue to Form'; addrBtn2.onclick = () => showServiceStep('address', 4); }

    // Unmarried Service
    const unmBtn1 = document.getElementById('unmarriedNextToNibidak');
    if (unmBtn1) unmBtn1.onclick = () => showServiceStep('unmarried', 2);
    const unmBtn2 = document.getElementById('unmarriedNextToOCR');
    if (unmBtn2) { unmBtn2.textContent = 'Continue to Form'; unmBtn2.onclick = () => showServiceStep('unmarried', 4); }

    // Character Service
    const charBtn1 = document.getElementById('characterNextToNibidak');
    if (charBtn1) charBtn1.onclick = () => showServiceStep('character', 2);
    const charBtn2 = document.getElementById('characterNextToOCR');
    if (charBtn2) { charBtn2.textContent = 'Continue to Form'; charBtn2.onclick = () => showServiceStep('character', 4); }

    // Road Service
    const roadBtn1 = document.getElementById('roadNextToNibidak');
    if (roadBtn1) roadBtn1.onclick = () => showServiceStep('road', 2);
    const roadBtn2 = document.getElementById('roadNextToOCR');
    if (roadBtn2) { roadBtn2.textContent = 'Continue to Form'; roadBtn2.onclick = () => showServiceStep('road', 4); }

    // Other Form Service
    const otherFormBtn1 = document.getElementById('otherFormNextToNibidak');
    if (otherFormBtn1) otherFormBtn1.onclick = () => showServiceStep('otherForm', 2);
    const otherFormBtn2 = document.getElementById('otherFormNextToOCR');
    if (otherFormBtn2) { otherFormBtn2.textContent = 'Continue to Form'; otherFormBtn2.onclick = () => showServiceStep('otherForm', 4); }

    document.querySelectorAll('.ocr-actions').forEach((actions) => {
        actions.closest('.card')?.remove();
    });
    document.getElementById('birthStep5')?.remove();

    injectPreviousStepButtons();
    resetEnteredServiceData();
    restoreSessionAndView();
    console.log('Application initialized successfully');
});