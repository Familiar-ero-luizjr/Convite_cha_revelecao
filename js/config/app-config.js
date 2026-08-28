// Configuração da camada de dados.
// O convite funciona em dois modos:
// - "mock": salva no localStorage deste navegador (ideal para testar localmente).
// - "banco": usa o adapter de banco, preparado para Firestore.
//
// A escolha feita no painel administrativo fica salva neste navegador.
// Para definir o padrão de produção, altere dataModeDefault.
window.APP_CONFIG = {
  dataModeDefault: "mock",
  dataModeStorageKey: "convite-cha-revelacao-data-mode",
  mockStorageKey: "convite-cha-revelacao-mock-data",
  adminPassword: "troque-esta-senha",

  // Placeholders da futura integração com Firebase / Firestore.
  // A configuração web do Firebase pode ficar no frontend; a segurança real
  // deve ser feita com Firebase Authentication + regras do Firestore.
  firebase: {
    apiKey: "AIzaSyBM1ps6VpF_9Yx1r3dWVMep37aoKRwP_sk",
    authDomain: "convite-cha-revelacao-la.firebaseapp.com",
    projectId: "convite-cha-revelacao-la",
    storageBucket: "convite-cha-revelacao-la.firebasestorage.app",
    messagingSenderId: "614761275921",
    appId: "1:614761275921:web:9af86ccddd12dbbce987b0",
    collection: "convites",
    document: "principal",
  },
};
