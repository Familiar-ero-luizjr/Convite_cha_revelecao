(() => {
  if (!window.InviteDataService || !window.firebase) return;
  const config = window.APP_CONFIG?.firebase;
  if (!config) return;

  const required = ["apiKey", "authDomain", "projectId", "appId"];
  if (required.some(k => !String(config[k] || "") || String(config[k]).startsWith("__FIREBASE_"))) return;

  const firebaseConfig = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId
  };

  if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
  const db = window.firebase.firestore();
  const documentRef = db.collection(config.collection || "convites").doc(config.document || "principal");

  window.InviteFirebase = { db, documentRef, firebase: window.firebase };

  window.InviteDataService.registerAdapter("banco", {
    async load() {
      const snapshot = await documentRef.get();
      return snapshot.exists ? snapshot.data() : {};
    },
    async save(value) {
      if (!window.InviteAdminApi) throw new Error("API administrativa não carregada.");
      await window.InviteAdminApi.saveInvite(value);
    },
    async reset() { throw new Error("A exclusão completa foi desativada por segurança."); }
  });
})();
