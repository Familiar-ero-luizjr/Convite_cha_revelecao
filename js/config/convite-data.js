// Valores padrão do convite.
// Eles continuam sendo o fallback caso não exista dado salvo no adapter ativo.
window.CONVITE_DEFAULTS = {
  menina: "Luiza",
  menino: "Enrique",
  textoOu: "ou",
  textoAbrir: "Toque na carta 💌",
  textoVoltar: "← Voltar",
  textoProximo: "Próximo →",
  textoPresentes: "Presentes →",
  data: "01 Novembro",
  horario: "ÀS 12:30 HORAS",
  confirmarPresenca: "https://wa.me/5532984273578",
  localizacaoFesta: "https://maps.app.goo.gl/v2hJMUJsiGQtqToQ7",
  sugestoesPresentes: "",

  // As três imagens originais continuam sendo o fundo das páginas.
  imagemCapa: "assets/convite/page_1.jpeg",
  imagemDetalhes: "assets/convite/page_2.jpeg",
  imagemPresentes: "assets/convite/page_3.jpeg",

  // Conteúdo opcional colocado POR CIMA da imagem page_3.jpeg.
  // Deixe vazio enquanto o texto ainda estiver desenhado na imagem.
  presentesTitulo: "",
  presentesLista: "",
  presentesObservacao: ""
};

// Compatibilidade com o código antigo.
window.CONVITE = window.CONVITE_DEFAULTS;
