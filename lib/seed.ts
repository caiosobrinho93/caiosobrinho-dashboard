import type { DashboardData, Settings } from "./types";
import { addDays, isoDate, todayISO } from "./utils";

export const DATA_VERSION = 1;

export function createEmptyData(settings: Partial<Settings> = {}): DashboardData {
  return {
    version: DATA_VERSION,
    tasks: [],
    shopping: [],
    transactions: [],
    media: [],
    goals: [],
    notes: [],
    settings: {
      name: "Caio",
      monthlyBudget: 3500,
      accent: "azul",
      demoBannerDismissed: false,
      ...settings,
    },
  };
}

export function createSeedData(settings: Partial<Settings> = {}): DashboardData {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = todayISO();

  const dayThisMonth = (day: number) =>
    isoDate(year, month, Math.min(Math.max(1, day), now.getDate()));

  const dateInMonth = (offset: number, day: number) => {
    const base = new Date(year, month - offset, 1);
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    const capped = offset === 0 ? Math.min(day, now.getDate()) : day;
    return isoDate(base.getFullYear(), base.getMonth(), Math.min(Math.max(1, capped), daysInMonth));
  };

  const atTime = (iso: string, hour = 12, minute = 0) => {
    const date = new Date(`${iso}T00:00:00`);
    date.setHours(hour, minute, 0, 0);
    return date.toISOString();
  };

  const nowISO = now.toISOString();
  const hoursAgo = (hours: number) =>
    new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();

  const pastTransactions = Array.from({ length: 5 }, (_, index) => {
    const offset = index + 1;
    const suffix = `m${offset}`;
    const rows = [
      {
        id: `seed-${suffix}-salario`,
        description: "Salário",
        amount: 6200,
        type: "receita" as const,
        category: "Salário",
        date: dateInMonth(offset, 5),
      },
      {
        id: `seed-${suffix}-aluguel`,
        description: "Aluguel",
        amount: 1800,
        type: "despesa" as const,
        category: "Moradia",
        date: dateInMonth(offset, 7),
      },
      {
        id: `seed-${suffix}-mercado`,
        description: "Mercado do mês",
        amount: 468.4 + offset * 18.7,
        type: "despesa" as const,
        category: "Alimentação",
        date: dateInMonth(offset, 11),
      },
      {
        id: `seed-${suffix}-transporte`,
        description: "Combustível e apps",
        amount: 148.2 + offset * 12.5,
        type: "despesa" as const,
        category: "Transporte",
        date: dateInMonth(offset, 17),
      },
      {
        id: `seed-${suffix}-lazer`,
        description: "Lazer e restaurantes",
        amount: 192.3 + offset * 21.4,
        type: "despesa" as const,
        category: "Lazer",
        date: dateInMonth(offset, 22),
      },
    ];

    if (offset === 2 || offset === 4) {
      rows.push({
        id: `seed-${suffix}-freela`,
        description: "Freela — site institucional",
        amount: offset === 2 ? 900 : 1350,
        type: "receita" as const,
        category: "Freela",
        date: dateInMonth(offset, 19),
      });
    }

    return rows.map((row) => ({ ...row, createdAt: atTime(row.date) }));
  }).flat();

  const currentTransactions = [
    {
      id: "seed-tx-salario",
      description: "Salário",
      amount: 6200,
      type: "receita" as const,
      category: "Salário",
      date: dayThisMonth(5),
    },
    {
      id: "seed-tx-freela",
      description: "Projeto landing page",
      amount: 1450,
      type: "receita" as const,
      category: "Freela",
      date: dayThisMonth(12),
    },
    {
      id: "seed-tx-aluguel",
      description: "Aluguel",
      amount: 1800,
      type: "despesa" as const,
      category: "Moradia",
      date: dayThisMonth(7),
    },
    {
      id: "seed-tx-mercado",
      description: "Supermercado da semana",
      amount: 486.9,
      type: "despesa" as const,
      category: "Alimentação",
      date: dayThisMonth(10),
    },
    {
      id: "seed-tx-internet",
      description: "Internet fibra 600mb",
      amount: 99.9,
      type: "despesa" as const,
      category: "Contas",
      date: dayThisMonth(8),
    },
    {
      id: "seed-tx-academia",
      description: "Academia",
      amount: 129,
      type: "despesa" as const,
      category: "Saúde",
      date: dayThisMonth(6),
    },
    {
      id: "seed-tx-jantar",
      description: "Jantar com amigos",
      amount: 86.4,
      type: "despesa" as const,
      category: "Lazer",
      date: dayThisMonth(14),
    },
    {
      id: "seed-tx-uber",
      description: "Uber",
      amount: 42.5,
      type: "despesa" as const,
      category: "Transporte",
      date: dayThisMonth(15),
    },
    {
      id: "seed-tx-spotify",
      description: "Spotify Premium",
      amount: 21.9,
      type: "despesa" as const,
      category: "Lazer",
      date: dayThisMonth(3),
    },
    {
      id: "seed-tx-curso",
      description: "Curso de Next.js",
      amount: 89.9,
      type: "despesa" as const,
      category: "Educação",
      date: dayThisMonth(16),
    },
    {
      id: "seed-tx-farmacia",
      description: "Farmácia",
      amount: 67.3,
      type: "despesa" as const,
      category: "Saúde",
      date: dayThisMonth(18),
    },
    {
      id: "seed-tx-eletronicos",
      description: "Cabo USB-C e organizador",
      amount: 74.8,
      type: "despesa" as const,
      category: "Compras",
      date: dayThisMonth(20),
    },
  ].map((row) => ({ ...row, createdAt: atTime(row.date) }));

  return {
    version: DATA_VERSION,
    settings: {
      name: "Caio",
      monthlyBudget: 3500,
      accent: "azul",
      demoBannerDismissed: false,
      ...settings,
    },
    tasks: [
      {
        id: "seed-task-1",
        title: "Revisar proposta do cliente",
        notes: "Conferir escopo, prazo e valor antes de enviar.",
        priority: "alta",
        list: "Trabalho",
        due: today,
        done: false,
        createdAt: hoursAgo(26),
        completedAt: null,
      },
      {
        id: "seed-task-2",
        title: "Treino de força",
        notes: "Treino B — costas e bíceps.",
        priority: "media",
        list: "Pessoal",
        due: today,
        done: false,
        createdAt: hoursAgo(10),
        completedAt: null,
      },
      {
        id: "seed-task-3",
        title: "Ler 20 páginas do livro",
        notes: "Capítulo 7 de “Hábitos Atômicos”.",
        priority: "baixa",
        list: "Estudos",
        due: today,
        done: false,
        createdAt: hoursAgo(8),
        completedAt: null,
      },
      {
        id: "seed-task-4",
        title: "Pagar conta de energia",
        notes: "Vence ontem. Usar o app do banco.",
        priority: "alta",
        list: "Casa",
        due: addDays(today, -1),
        done: false,
        createdAt: hoursAgo(50),
        completedAt: null,
      },
      {
        id: "seed-task-5",
        title: "Comprar presente da mãe",
        notes: "Ela comentou que queria um livro de fotografia.",
        priority: "media",
        list: "Pessoal",
        due: addDays(today, 4),
        done: false,
        createdAt: hoursAgo(30),
        completedAt: null,
      },
      {
        id: "seed-task-6",
        title: "Organizar as fotos do celular",
        notes: "Separar por ano e subir o backup.",
        priority: "baixa",
        list: "Pessoal",
        due: null,
        done: false,
        createdAt: hoursAgo(72),
        completedAt: null,
      },
      {
        id: "seed-task-7",
        title: "Enviar relatório semanal",
        notes: "",
        priority: "alta",
        list: "Trabalho",
        due: today,
        done: true,
        createdAt: hoursAgo(28),
        completedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 12).toISOString(),
      },
      {
        id: "seed-task-8",
        title: "Consulta no dentista",
        notes: "",
        priority: "media",
        list: "Casa",
        due: addDays(today, -2),
        done: true,
        createdAt: hoursAgo(100),
        completedAt: atTime(addDays(today, -2), 15, 30),
      },
    ],
    shopping: [
      {
        id: "seed-shop-1",
        name: "Café em grãos",
        quantity: 1,
        unit: "un",
        price: 39.9,
        category: "Mercado",
        done: false,
        createdAt: hoursAgo(4),
      },
      {
        id: "seed-shop-2",
        name: "Leite integral",
        quantity: 2,
        unit: "un",
        price: 5.49,
        category: "Mercado",
        done: false,
        createdAt: hoursAgo(4),
      },
      {
        id: "seed-shop-3",
        name: "Banana-prata",
        quantity: 1.2,
        unit: "kg",
        price: 7.99,
        category: "Mercado",
        done: false,
        createdAt: hoursAgo(5),
      },
      {
        id: "seed-shop-4",
        name: "Pão de forma",
        quantity: 1,
        unit: "un",
        price: 8.9,
        category: "Mercado",
        done: false,
        createdAt: hoursAgo(5),
      },
      {
        id: "seed-shop-5",
        name: "Detergente",
        quantity: 3,
        unit: "un",
        price: 3.29,
        category: "Casa",
        done: false,
        createdAt: hoursAgo(6),
      },
      {
        id: "seed-shop-6",
        name: "Protetor solar",
        quantity: 1,
        unit: "un",
        price: 54.9,
        category: "Farmácia",
        done: false,
        createdAt: hoursAgo(20),
      },
      {
        id: "seed-shop-7",
        name: "Ovos brancos",
        quantity: 1,
        unit: "cx",
        price: 18.9,
        category: "Mercado",
        done: false,
        createdAt: hoursAgo(22),
      },
      {
        id: "seed-shop-8",
        name: "Arroz 5kg",
        quantity: 1,
        unit: "un",
        price: 31.9,
        category: "Mercado",
        done: true,
        createdAt: hoursAgo(26),
      },
      {
        id: "seed-shop-9",
        name: "Papel higiênico",
        quantity: 1,
        unit: "pct",
        price: 22.9,
        category: "Casa",
        done: true,
        createdAt: hoursAgo(26),
      },
    ],
    transactions: [...currentTransactions, ...pastTransactions],
    media: [
      {
        id: "seed-media-1",
        title: "Redes neurais, visualmente",
        url: "https://www.youtube.com/watch?v=aircAruvnKk",
        kind: "video",
        tags: ["estudo", "ia"],
        favorite: true,
        createdAt: hoursAgo(12),
      },
      {
        id: "seed-media-2",
        title: "What the heck is the event loop?",
        url: "https://www.youtube.com/watch?v=8aGhZQkoFbQ",
        kind: "video",
        tags: ["dev", "javascript"],
        favorite: true,
        createdAt: hoursAgo(30),
      },
      {
        id: "seed-media-3",
        title: "Como a internet funciona em 5 minutos",
        url: "https://www.youtube.com/watch?v=7_LPdttKXPc",
        kind: "video",
        tags: ["dev", "redes"],
        favorite: false,
        createdAt: hoursAgo(54),
      },
      {
        id: "seed-media-4",
        title: "Por que procrastinamos — Tim Urban",
        url: "https://www.youtube.com/watch?v=arj7oStGLkU",
        kind: "video",
        tags: ["foco", "produtividade"],
        favorite: true,
        createdAt: hoursAgo(80),
      },
      {
        id: "seed-media-5",
        title: "Abstract: o design de objetos",
        url: "https://www.netflix.com/br/title/80057883",
        kind: "video",
        tags: ["design", "inspiração"],
        favorite: false,
        createdAt: hoursAgo(100),
      },
      {
        id: "seed-media-6",
        title: "lofi hip hop radio — beats para focar",
        url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        kind: "musica",
        tags: ["foco", "lofi"],
        favorite: true,
        createdAt: hoursAgo(3),
      },
      {
        id: "seed-media-7",
        title: "Today’s Top Hits",
        url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
        kind: "musica",
        tags: ["pop", "playlist"],
        favorite: false,
        createdAt: hoursAgo(40),
      },
      {
        id: "seed-media-8",
        title: "Nujabes — Feather",
        url: "https://music.youtube.com/search?q=nujabes+feather",
        kind: "musica",
        tags: ["chill", "hip-hop"],
        favorite: true,
        createdAt: hoursAgo(48),
      },
      {
        id: "seed-media-9",
        title: "Corrida — 150 bpm",
        url: "https://open.spotify.com/playlist/37i9dQZF1DX70RN3TfWWJh",
        kind: "musica",
        tags: ["treino", "playlist"],
        favorite: true,
        createdAt: hoursAgo(76),
      },
    ],
    goals: [
      {
        id: "seed-goal-1",
        title: "Reserva de emergência",
        target: 20000,
        current: 12400,
        unit: "R$",
        deadline: `${year + 1}-12-31`,
        color: "#89d185",
        createdAt: hoursAgo(200),
      },
      {
        id: "seed-goal-2",
        title: "Viagem — Chapada dos Veadeiros",
        target: 3500,
        current: 1800,
        unit: "R$",
        deadline: addDays(today, 240),
        color: "#4ec9b0",
        createdAt: hoursAgo(180),
      },
      {
        id: "seed-goal-3",
        title: "Ler 24 livros no ano",
        target: 24,
        current: 17,
        unit: "livros",
        deadline: `${year}-12-31`,
        color: "#c586c0",
        createdAt: hoursAgo(160),
      },
      {
        id: "seed-goal-4",
        title: "Correr 200 km no ano",
        target: 200,
        current: 146,
        unit: "km",
        deadline: `${year}-12-31`,
        color: "#569cd6",
        createdAt: hoursAgo(140),
      },
    ],
    notes: [
      {
        id: "seed-note-1",
        title: "Ideias para o fim de semana",
        body:
          "• Feira de produtores no sábado de manhã\n• Trilha da cachoeira — sair cedo\n• Tentar a receita de focaccia\n• Separar 1h para arrumar a varanda",
        color: "#dcdcaa",
        pinned: true,
        createdAt: hoursAgo(28),
        updatedAt: hoursAgo(5),
      },
      {
        id: "seed-note-2",
        title: "Checklist da viagem",
        body:
          "Passaporte e documentos\nCarregador + power bank\nTênis de trilha\nProtetor solar\nBaixar mapas offline",
        color: "#569cd6",
        pinned: true,
        createdAt: hoursAgo(140),
        updatedAt: hoursAgo(20),
      },
      {
        id: "seed-note-3",
        title: "Molho de tomate da casa",
        body:
          "Tomates bem maduros, cebola, alho, azeite e manjericão.\nCozinhar em fogo baixo por 40 min. Ajustar sal no final.",
        color: "#ce9178",
        pinned: false,
        createdAt: hoursAgo(90),
        updatedAt: hoursAgo(90),
      },
      {
        id: "seed-note-4",
        title: "Lembretes para dias difíceis",
        body: "Feito é melhor que perfeito.\nUm passo por dia ainda é progresso.\nDescanse sem culpa.",
        color: "#c586c0",
        pinned: false,
        createdAt: hoursAgo(220),
        updatedAt: hoursAgo(60),
      },
    ],
  };
}
