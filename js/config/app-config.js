// Configuração pública do convite.
// IMPORTANTE: não coloque GITHUB_TOKEN nem ADMIN_KEY neste arquivo.
window.APP_CONFIG = {
  // Em produção, novos visitantes devem ler os dados do Firestore.
  dataModeDefault: "banco",
  dataModeStorageKey: "convite-cha-revelacao-data-mode",
  mockStorageKey: "convite-cha-revelacao-mock-data",

  firebase: {
    apiKey: "AIzaSyBM1ps6VpF_9Yx1r3dWVMep37aoKRwP_sk",
    authDomain: "convite-cha-revelacao-la.firebaseapp.com",
    projectId: "convite-cha-revelacao-la",
    storageBucket: "convite-cha-revelacao-la.firebasestorage.app",
    messagingSenderId: "614761275921",
    appId: "1:614761275921:web:9af86ccddd12dbbce987b0",
    collection: "convites",
    document: "principal"
  },

  // API segura que faz commits de imagens no GitHub.
  worker: {
    baseUrl: "https://convite-cha-revelacao-api.luizjunior-lopes.workers.dev",
    adminKeyStorageKey: "convite-worker-admin-key"
  }
};
