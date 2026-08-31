// Dados padrão do novo design.
// O Firestore pode sobrescrever qualquer um destes valores.
window.CONVITE_DEFAULTS = {
  menina: "Luiza",
  menino: "Enrique",
  textoOu: "ou",
  data: "01 Novembro",
  horario: "12:30",
  unidadeHorario: "HORAS",

  confirmarPresenca: "https://wa.me/5532984273578",
  localizacaoFesta: "https://maps.app.goo.gl/v2hJMUJsiGQtqToQ7",

  imagens: {
    pagina1: {
      fundoDia: "assets_p1/fundo_dia.jfif",
      fundoNoite: "assets_p1/fundo_noite.jfif",
      topo: "assets_p1/01_ursinhos_na_nuvem.png",
      baloesEsquerda: "assets_p1/03_baloes_esquerda.png",
      baloesDireita: "assets_p1/04_baloes_direita.png",
      envelope: "assets_p1/08_envelope_clique_aqui.png",
      cliqueAqui: "assets_p1/08.1_clique_aqui.png",
      blocos: "assets_p1/09_blocos_baby.png",
      arcoIris: "assets_p1/10_arco_iris_inferior.png"
    },
    pagina2: {
      fundoDia: "assets/fundo_dia.jfif",
      fundoNoite: "assets/fundo_noite.jfif",
      topo: "assets/01_urso_carro_arco_iris_faixa.png",
      ursoCentral: "assets/07_ursinho_central.png",
      confirmar: "assets/09_icone_confirmar_presenca.png",
      localizacao: "assets/10_icone_localizacao.png",
      presentes: "assets/11_icone_sugestoes_presentes.png"
    },
    presentes: {
      fundoDia: "assets/fundo_dia.jfif",
      fundoNoite: "assets/fundo_noite.jfif",
      topo: "assets/p3_topo.png",
      ursa: "assets/12_ursa_inferior.png",
      carrinho: "assets/13_carrinho_bebe.png",
      ursoPresente: "assets/14_urso_com_presente.png"
    },
    votacao: {
      fundoDia: "assets/fundo_dia.jfif",
      fundoNoite: "assets/fundo_noite.jfif",
      topo: "assets/07_ursinho_central.png"
    }
  },

  paginas: {
    pagina1: {
      tituloCha: "Chá Revelação",
      boy: "Boy",
      ou: "ou",
      girl: "Girl",
      textoConvite: "Você acaba de receber\num convite especial!"
    },
    pagina2: {
      chamada: "Venha descobrir\ncom a gente!",
      acaoConfirmar: "Confirmar\npresença",
      acaoLocalizacao: "Localização\nda festa",
      acaoPresentes: "Sugestões de\npresentes",
      acaoVotacao: "Votação"
    },
    presentes: {
      eyebrow: "Chá Revelação",
      titulo: "Sugestões de presentes",
      subtitulo: "Trouxemos algumas ideias para ajudar na escolha. O mais importante é o carinho. 💛"
    },
    votacao: {
      eyebrow: "Chá Revelação",
      titulo: "Qual é o seu palpite?",
      subtitulo: "Quem você acha que vem aí? Escolha uma opção e confirme seu voto.",
      labelMenina: "Menina",
      ajudaMenina: "Meu palpite é menina",
      labelMenino: "Menino",
      ajudaMenino: "Meu palpite é menino",
      confirmacaoTitulo: "Palpite confirmado! 💛",
      confirmacaoTexto: "Obrigado por participar da brincadeira."
    }
  },

  presentesTitulo: "Sugestões de presentes",
  presentesObservacao: "Trouxemos algumas ideias para ajudar na escolha. O mais importante é o carinho. 💛",
  presentes: [
    { id: "fraldas", texto: "Fraldas — Tamanho PP", imagem: { tipo: "repository", valor: "assets/p3_icone_fraldas.png" } },
    { id: "mimos", texto: "Gosto de mimos", imagem: { tipo: "repository", valor: "assets/p3_icone_mimos.png" } },
    { id: "calcado", texto: "Calçado — Tamanho P", imagem: { tipo: "repository", valor: "assets/p3_icone_calcado.png" } }
  ]
};
window.CONVITE = window.CONVITE_DEFAULTS;
