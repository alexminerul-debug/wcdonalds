import { useState, useEffect } from "react";

export type Language = "en" | "ro";

const STORAGE_KEY = "wcdonalds_language";

export const translations = {
  en: {
    // Header & Meta
    night: "NIGHT",
    leaveRoom: "Leave Room",
    leaveConfirm: "Leave current shift? You will disconnect from the room.",
    confirm: "Leave",
    cancel: "Cancel",
    live: "LIVE",
    connecting: "CONNECTING...",
    disconnected: "DISCONNECTED",

    // Lobby
    roomCode: "Room Code",
    scanToJoin: "Scan to join on mobile",
    chooseRole: "Select Your Role",
    workerRole: "Night Shift Worker",
    workerDesc: "Operate the counter, ring up items, inspect customers via CCTV, and report anomalies.",
    cameraRole: "CCTV Security Camera",
    cameraDesc: "Mount a phone facing the customer counter. Feeds live video directly to the worker.",
    customerRole: "Drive-Thru Customer",
    customerDesc: "Receive secret orders on your phone. Blend in or carry out paranormal anomaly traits.",
    claimRole: "Select Role",
    roleClaimed: "Selected",
    startShift: "START SHIFT",
    waitingForHost: "Waiting for host to begin shift...",
    playersInLobby: "Employees / Customers in Lobby",

    // Worker Page
    balance: "Cash",
    lives: "Lives",
    nightVision: "Night Vision",
    posTab: "POS Counter",
    cctvTab: "CCTV Cam",
    shopTab: "Upgrades",
    codexTab: "Anomaly Codex",
    serveOrder: "SERVE ORDER",
    reportAnomaly: "REPORT ANOMALY",
    subtotal: "Subtotal",
    tax: "Tax",
    total: "Total",
    clearCart: "Clear",
    requestPayment: "CHARGE CUSTOMER",
    waitingCustomer: "Waiting for customer to arrive...",
    cartEmpty: "No items in register",
    addItem: "Add",
    abilitiesTitle: "Night Shift Equipment",
    buy: "Buy",
    owned: "Installed",

    // Customer Page
    yourOrder: "YOUR ORDER",
    slideUpToPay: "Slide up to pay",
    tapToPay: "TAP TO PAY NOW",
    paymentAccepted: "Payment Accepted",
    orderSummary: "Order Summary",
    waitingInQueue: "WAITING IN QUEUE",
    youAreNext: "YOU'RE NEXT! STEP UP TO COUNTER",
    customersAhead: "Customers ahead of you",
    secretRoleNormal: "Normal Customer",
    secretRoleNormalDesc: "Act completely normal. Nothing to hide. Step up and place your order.",
    secretRoleAnomaly: "ANOMALY INFILTRATOR",
    secretRoleAnomalyDesc: "Blend in! You must exhibit subtle unnatural behaviors to terrify the worker.",
    anomalyObjectives: "ANOMALY OBJECTIVES",
    dismissRole: "GOT IT, READY",
    orderComplete: "ORDER COMPLETE",
    thankYou: "Thank you for visiting WcDonald's.",
    wrongfullyEjected: "WRONGFULLY EJECTED",
    innocentFined: "You were innocent. The worker has been penalized.",
    nextInLine: "Continue to Next",

    // Shift End
    nightSurvived: "NIGHT SURVIVED",
    allNightsSurvived: "ALL 5 NIGHTS SURVIVED!",
    employeeOfMonth: "EMPLOYEE OF THE MONTH",
    shiftTerminated: "SHIFT TERMINATED",
    shiftTerminatedDesc: "The worker lost all lives to anomalies. The night is over.",
    startNextNight: "START NEXT NIGHT",
    returnHome: "RETURN TO MENU",

    // Camera Page
    cctvSecurityFeed: "CCTV SECURITY FEED",
    cameraActive: "CAMERA ACTIVE",
    flipCamera: "Flip Camera",
    startCameraBtn: "ACTIVATE CAMERA",
    allowCameraNotice: "Position phone facing the customer counter.",
  },
  ro: {
    // Header & Meta
    night: "NOAPTEA",
    leaveRoom: "Părăsește Camera",
    leaveConfirm: "Vrei să părăsești tura? Vei fi deconectat din cameră.",
    confirm: "Părăsește",
    cancel: "Anulează",
    live: "ACTIV",
    connecting: "CONECTARE...",
    disconnected: "DECONECTAT",

    // Lobby
    roomCode: "Cod Cameră",
    scanToJoin: "Scanează pentru a intra de pe telefon",
    chooseRole: "Alege-ți Rolul",
    workerRole: "Lucrător de Noapte",
    workerDesc: "Operează casa de marcat, verifică clienții pe camerele CCTV și raportează anomaliile.",
    cameraRole: "Cameră de Securitate CCTV",
    cameraDesc: "Așază telefonul orientat spre client. Transmite video în timp real către lucrător.",
    customerRole: "Client la Tejghea",
    customerDesc: "Primește comenzi secrete pe telefon. Comportă-te normal sau joacă rolul unei anomalii.",
    claimRole: "Alege Rolul",
    roleClaimed: "Selectat",
    startShift: "ÎNCEPE TURA",
    waitingForHost: "Se așteaptă gazda să înceapă tura...",
    playersInLobby: "Jucători în Lobby",

    // Worker Page
    balance: "Bani",
    lives: "Vieți",
    nightVision: "Vedere Nocturnă",
    posTab: "Casă POS",
    cctvTab: "Cameră CCTV",
    shopTab: "Magazin",
    codexTab: "Codex Anomalii",
    serveOrder: "SERVEȘTE COMANDA",
    reportAnomaly: "RAPORTEAZĂ ANOMALIE",
    subtotal: "Subtotal",
    tax: "Taxă",
    total: "Total",
    clearCart: "Golește",
    requestPayment: "CERE PLATA",
    waitingCustomer: "Se așteaptă sosirea clientului...",
    cartEmpty: "Niciun produs adăugat",
    addItem: "Adaugă",
    abilitiesTitle: "Echipamente de Noapte",
    buy: "Cumpără",
    owned: "Instalat",

    // Customer Page
    yourOrder: "COMANDA TA",
    slideUpToPay: "Glisează în sus pentru plată",
    tapToPay: "APASĂ PENTRU PLATĂ",
    paymentAccepted: "Plată Acceptată",
    orderSummary: "Sumar Comandă",
    waitingInQueue: "AȘTEPTARE LA RÂND",
    youAreNext: "EȘTI URMĂTORUL! AVANSEAZĂ LA TEJGHEA",
    customersAhead: "Clienți în fața ta",
    secretRoleNormal: "Client Normal",
    secretRoleNormalDesc: "Comportă-te complet normal. Nu ai nimic de ascuns. Plasează comanda.",
    secretRoleAnomaly: "ANOMALIE PARANORMALĂ",
    secretRoleAnomalyDesc: "Infiltrează-te! Manifestă comportamente anormale pentru a speria lucrătorul.",
    anomalyObjectives: "OBIECTIVE ANOMALIE",
    dismissRole: "AM ÎNȚELES, SUNT GATA",
    orderComplete: "COMANDĂ FINALIZATĂ",
    thankYou: "Îți mulțumim că ai vizitat WcDonald's.",
    wrongfullyEjected: "EVACUAT PE NEDREPT",
    innocentFined: "Ai fost nevinovat. Lucrătorul a fost amendat.",
    nextInLine: "Continuă la Următorul",

    // Shift End
    nightSurvived: "NOAPTE SUPRAVIEȚUITĂ",
    allNightsSurvived: "TOATE CELE 5 NOPȚI SUPRAVIEȚUITE!",
    employeeOfMonth: "ANGAJATUL LUNII",
    shiftTerminated: "TURĂ TERMINATĂ",
    shiftTerminatedDesc: "Lucrătorul și-a pierdut toate viețile din cauza anomaliilor.",
    startNextNight: "ÎNCEPE NOAPTEA URMĂTOARE",
    returnHome: "MENIU PRINCIPAL",

    // Camera Page
    cctvSecurityFeed: "TRANSMISIUNE CCTV",
    cameraActive: "CAMERĂ ACTIVĂ",
    flipCamera: "Schimbă Camera",
    startCameraBtn: "ACTIVEAZĂ CAMERA",
    allowCameraNotice: "Poziționează telefonul spre tejgheaua clientului.",
  },
};

export type TranslationKey = keyof typeof translations.en;

let currentLanguage: Language = "en";
const listeners = new Set<(lang: Language) => void>();

if (typeof window !== "undefined") {
  const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (saved && (saved === "en" || saved === "ro")) {
    currentLanguage = saved;
  }
}

export function setLanguage(lang: Language) {
  currentLanguage = lang;
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, lang);
  }
  listeners.forEach((l) => l(lang));
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function useTranslation() {
  const [lang, setLang] = useState<Language>(currentLanguage);

  useEffect(() => {
    const handler = (newLang: Language) => setLang(newLang);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const t = (key: TranslationKey): string => {
    return (translations[lang] as any)?.[key] || (translations.en as any)?.[key] || key;
  };

  return {
    t,
    lang,
    setLanguage,
  };
}
