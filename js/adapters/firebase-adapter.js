// Adapter do modo "banco" (Firestore).
// Este arquivo já fica no projeto, mas só registra o adapter quando o SDK do
// Firebase estiver carregado e a configuração estiver preenchida.
//
// Depois, basta:
// 1) preencher APP_CONFIG.firebase em app-config.js;
// 2) carregar firebase-app-compat e firebase-firestore-compat antes deste arquivo;
// 3) selecionar "Banco (Firestore)" no painel ou usar dataModeDefault: "banco".
(() => {
  if (!window.InviteDataService || !window.firebase) return;

  const config = window.APP_CONFIG?.firebase;
  if (!config) return;

  const required = ["apiKey", "authDomain", "projectId", "appId"];
  const hasPlaceholders = required.some(key => {
    const value = String(config[key] || "");
    return !value || value.startsWith("__FIREBASE_");
  });

  if (hasPlaceholders) return;

  const firebaseConfig = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId
  };

  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(firebaseConfig);
  }

  const db = window.firebase.firestore();
  const documentRef = db
    .collection(config.collection || "convites")
    .doc(config.document || "principal");

  window.InviteDataService.registerAdapter("banco", {
    async load() {
      const snapshot = await documentRef.get();
      return snapshot.exists ? snapshot.data() : {};
    },

    async save(value) {
      await documentRef.set(value, { merge: false });
    },

    async reset() {
      await documentRef.delete();
    }
  });
})();
