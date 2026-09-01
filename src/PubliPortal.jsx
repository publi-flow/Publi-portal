import { useState, useEffect, useCallback } from "react";
import { loadData, saveData } from "./supabaseClient";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const CONTENT_TYPES = ["Reels","Carrossel","Stories","Foto","Vídeo Longo","Bastidores","Depoimento"];

const VIDEO_TYPES = ["Reels","Vídeo Longo","Stories","Bastidores","Depoimento"];
const isVideoContent = (c) => c.format === "video" || VIDEO_TYPES.includes(c.type);

const BRIEF_QUESTIONS = [
  {
    section: "Sobre o negócio",
    icon: "🏢",
    questions: [
      { key: "nomeCompleto", label: "Nome completo da empresa", placeholder: "Razão social ou nome fantasia" },
      { key: "endereco", label: "Endereço / localização", placeholder: "Rua, número, bairro, cidade" },
      { key: "segmentoDetalhado", label: "Segmento detalhado", placeholder: "Ex: Restaurante de comida japonesa premium com foco em delivery e experiência no salão" },
      { key: "produtosServicos", label: "Principais produtos ou serviços", placeholder: "Liste os produtos/serviços carro-chefe" },
      { key: "diferenciais", label: "Diferenciais competitivos", placeholder: "O que torna essa empresa única? Por que o cliente escolhe ela?" },
      { key: "publicoAlvo", label: "Público-alvo", placeholder: "Idade, perfil, interesses, poder aquisitivo, comportamento..." },
      { key: "faixaPreco", label: "Faixa de preço / posicionamento", placeholder: "Popular, intermediário, premium, luxo..." },
    ],
  },
  {
    section: "Pessoas-chave",
    icon: "👥",
    questions: [
      { key: "donosNomes", label: "Nome dos sócios / donos", placeholder: "Quem são os donos do negócio?" },
      { key: "donosPerfil", label: "Perfil dos donos (aparecem no conteúdo?)", placeholder: "Carismáticos, reservados, técnicos... participam das gravações?" },
      { key: "aprovador", label: "Quem aprova os conteúdos?", placeholder: "Nome e cargo de quem dá o ok final" },
      { key: "contatoGravacao", label: "Contato para agendamento de gravação", placeholder: "Nome e telefone de quem organiza na ponta" },
      { key: "protagonistas", label: "Quem participa das gravações?", placeholder: "Dono, funcionários, modelos, clientes... quem aparece nos vídeos?" },
    ],
  },
  {
    section: "Identidade e comunicação",
    icon: "🎨",
    questions: [
      { key: "tomDeVoz", label: "Tom de voz da marca", placeholder: "Ex: Descontraído e próximo, técnico e profissional, sofisticado e elegante..." },
      { key: "personalidade", label: "Se a marca fosse uma pessoa, como ela seria?", placeholder: "Descreva a personalidade da marca como se fosse alguém" },
      { key: "palavrasUsar", label: "Palavras ou expressões que a marca usa", placeholder: "Termos, gírias, bordões, expressões-chave..." },
      { key: "palavrasEvitar", label: "Palavras ou temas que devem ser EVITADOS", placeholder: "Termos proibidos, assuntos sensíveis, comparações indesejadas..." },
      { key: "valores", label: "Valores da marca", placeholder: "Qualidade, tradição, inovação, sustentabilidade..." },
      { key: "slogan", label: "Slogan ou tagline", placeholder: "Frase de efeito da marca (se tiver)" },
    ],
  },
  {
    section: "Redes sociais e referências",
    icon: "📱",
    questions: [
      { key: "plataformas", label: "Plataformas ativas", placeholder: "Instagram, TikTok, YouTube, Facebook, LinkedIn..." },
      { key: "arroba", label: "@ das redes sociais", placeholder: "@nomedaempresa em cada rede" },
      { key: "hashtags", label: "Hashtags principais", placeholder: "#marca #nicho #cidade..." },
      { key: "referencias", label: "Referências visuais / marcas que admira", placeholder: "Perfis ou marcas que servem de inspiração" },
      { key: "concorrentes", label: "Concorrentes diretos", placeholder: "Quem são os principais concorrentes na região?" },
    ],
  },
  {
    section: "Produção de conteúdo",
    icon: "🎬",
    questions: [
      { key: "horariosGravacao", label: "Horários preferidos para gravação", placeholder: "Manhã, tarde, noite? Dias melhores da semana?" },
      { key: "locaisGravacao", label: "Locais de gravação disponíveis", placeholder: "Loja, cozinha, escritório, área externa, estúdio..." },
      { key: "restricoes", label: "Restrições ou observações importantes", placeholder: "Algo que não pode mostrar, horários que não pode gravar, regras específicas..." },
      { key: "historico", label: "O que já funcionou bem em conteúdos anteriores?", placeholder: "Tipos de post que deram mais engajamento, temas que o público ama..." },
      { key: "objetivos", label: "Objetivo principal com as redes sociais", placeholder: "Vender mais, fortalecer marca, atrair clientes, lançar produto..." },
    ],
  },
];

const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();
const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const today = new Date();

const uid = () => Math.random().toString(36).slice(2,9);

// ─── PDF GENERATOR ───
function generateRecordingDayPDF(client, dateStr, contents) {
  const d = new Date(dateStr + "T12:00:00");
  const dayNames = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
  const dayName = dayNames[d.getDay()];
  const dateFormatted = `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;

  const contentRows = contents.map((c, i) => `
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:20px 24px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:11px;font-weight:700;color:#6366f1;background:#eef2ff;border-radius:5px;padding:4px 10px;">${c.type}</span>
        <span style="font-size:12px;color:#94a3b8;">Conteúdo ${i + 1} de ${contents.length}</span>
      </div>
      <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:6px;">${c.title}</div>
      ${c.description ? `<div style="font-size:13px;color:#475569;line-height:1.6;margin-bottom:8px;">${c.description}</div>` : ""}
      ${c.postDate ? `<div style="font-size:12px;color:#64748b;margin-top:8px;">📅 Postagem prevista: ${new Date(c.postDate + "T12:00:00").toLocaleDateString("pt-BR")}</div>` : ""}
      ${c.refLink ? `<div style="margin-top:6px;"><a href="${c.refLink}" target="_blank" style="font-size:12px;color:#4338ca;text-decoration:none;background:#eef2ff;border-radius:4px;padding:4px 10px;display:inline-block;">🔗 Ver referência</a></div>` : ""}
    </div>
  `).join("");

  const typeSummary = {};
  contents.forEach(c => { typeSummary[c.type] = (typeSummary[c.type] || 0) + 1; });
  const typePills = Object.entries(typeSummary).map(([t, q]) =>
    `<span style="display:inline-flex;align-items:center;gap:4px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:20px;padding:4px 12px;font-size:12px;color:#4338ca;font-weight:600;">${t}: ${q}</span>`
  ).join(" ");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Gravação — ${client.name} — ${dateFormatted}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',system-ui,sans-serif; background:#f8fafc; color:#1e293b; padding:0; }
  @media print {
    body { background:#fff; }
    .no-print { display:none !important; }
    .page { box-shadow:none; margin:0; padding:32px; }
  }
  .page { max-width:700px; margin:24px auto; background:#fff; border-radius:16px; box-shadow:0 4px 24px rgba(0,0,0,0.08); padding:40px 44px; }
</style>
</head>
<body>
  <div class="no-print" style="text-align:center;padding:16px;">
    <button onclick="window.print()" style="padding:10px 24px;background:#000;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;">Imprimir / Salvar PDF</button>
  </div>
  <div class="page">
    <!-- Header -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:20px;border-bottom:2px solid #e2e8f0;">
      <div style="width:44px;height:44px;border-radius:12px;background:#000;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;color:#fff;">GC</div>
      <div>
        <div style="font-size:20px;font-weight:800;color:#0f172a;">Pauta de Gravação</div>
        <div style="font-size:13px;color:#94a3b8;">Agência Publi</div>
      </div>
    </div>

    <!-- Client & Date -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
      <div>
        <div style="font-size:12px;color:#94a3b8;font-weight:600;margin-bottom:2px;">Cliente</div>
        <div style="font-size:22px;font-weight:800;color:#0f172a;">${client.name}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:12px;color:#94a3b8;font-weight:600;margin-bottom:2px;">Data da gravação</div>
        <div style="font-size:18px;font-weight:700;color:#f97316;">${dateFormatted}</div>
        <div style="font-size:13px;color:#64748b;">${dayName}</div>
      </div>
    </div>

    <!-- Summary -->
    <div style="background:#f8fafc;border-radius:10px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div style="font-size:14px;color:#475569;"><strong style="color:#0f172a;font-size:20px;">${contents.length}</strong> conteúdo${contents.length > 1 ? "s" : ""} para gravar</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">${typePills}</div>
    </div>

    <!-- Contents -->
    ${contentRows}

    <!-- Footer -->
    <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;">
      Documento gerado pelo Gestão de Conteúdo · ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

const defaultData = {
  clients: [],
  contents: [],
};

export default function PubliPortal() {
  const [data, setData] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("admin");
  const [selectedClient, setSelectedClient] = useState(null);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [showClientForm, setShowClientForm] = useState(false);
  const [showContentForm, setShowContentForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [clientPortalId, setClientPortalId] = useState(null);
  const [showRecordingPicker, setShowRecordingPicker] = useState(false);
  const [showRecDayForm, setShowRecDayForm] = useState(null); // null or { dateStr, existing }
  const [selectedPortalDay, setSelectedPortalDay] = useState(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [clientTab, setClientTab] = useState("calendar"); // "calendar" | "briefing"
  const [linkCopied, setLinkCopied] = useState(false);

  // Persistence: Supabase (synced) + localStorage (cache/fallback)
  useEffect(() => {
    (async () => {
      try {
        const loadedData = await loadData();
        setData(loadedData);

        // Check URL for portal link: ?portal=CLIENT_ID
        const params = new URLSearchParams(window.location.search);
        const portalId = params.get("portal");
        if (portalId && loadedData.clients?.some(c => c.id === portalId)) {
          setClientPortalId(portalId);
          setView("portal");
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const save = useCallback((d) => {
    setData(d);
    saveData(d);
  }, []);

  // Client CRUD
  const saveClient = (client) => {
    const clients = client.id
      ? data.clients.map(c => c.id === client.id ? client : c)
      : [...data.clients, { ...client, id: uid() }];
    save({ ...data, clients });
    setShowClientForm(false);
    setEditingClient(null);
  };

  const deleteClient = (id) => {
    save({
      clients: data.clients.filter(c => c.id !== id),
      contents: data.contents.filter(c => c.clientId !== id),
    });
    if (selectedClient === id) setSelectedClient(null);
  };

  // Content CRUD
  const saveContent = (content) => {
    const contents = content.id
      ? data.contents.map(c => c.id === content.id ? content : c)
      : [...data.contents, { ...content, id: uid() }];
    save({ ...data, contents });
    setShowContentForm(false);
    setEditingContent(null);
  };

  const deleteContent = (id) => {
    save({ ...data, contents: data.contents.filter(c => c.id !== id) });
  };

  // Recording days — now objects: { date, local, horario, responsavel }
  // Migration: convert old string arrays to objects
  const migrateRecDays = (days) => {
    if (!days || typeof days !== "object") return days;
    const migrated = {};
    for (const [key, arr] of Object.entries(days)) {
      if (!Array.isArray(arr)) continue;
      migrated[key] = arr.map(d => typeof d === "string" ? { date: d, local: "", horario: "", responsavel: "" } : d);
    }
    return migrated;
  };

  const saveRecordingDay = (clientId, dateStr, details) => {
    const client = data.clients.find(c => c.id === clientId);
    if (!client) return;
    const key = dateStr.slice(0, 7); // "YYYY-MM"
    const days = migrateRecDays({ ...(client.recordingDays || {}) });
    const monthDays = days[key] || [];
    const existing = monthDays.findIndex(d => d.date === dateStr);
    if (existing >= 0) {
      monthDays[existing] = { ...monthDays[existing], ...details, date: dateStr };
    } else {
      monthDays.push({ date: dateStr, ...details });
    }
    days[key] = monthDays;
    const updated = data.clients.map(c => c.id === client.id ? { ...c, recordingDays: days } : c);
    save({ ...data, clients: updated });
  };

  const removeRecordingDay = (clientId, dateStr) => {
    const client = data.clients.find(c => c.id === clientId);
    if (!client) return;
    const key = dateStr.slice(0, 7);
    const days = migrateRecDays({ ...(client.recordingDays || {}) });
    const monthDays = days[key] || [];
    days[key] = monthDays.filter(d => d.date !== dateStr);
    const updated = data.clients.map(c => c.id === client.id ? { ...c, recordingDays: days } : c);
    save({ ...data, clients: updated });
  };

  const getRecordingDays = (clientId, year, month) => {
    const client = data.clients.find(c => c.id === clientId);
    if (!client) return [];
    const key = `${year}-${String(month+1).padStart(2,"0")}`;
    const raw = (client.recordingDays || {})[key] || [];
    return raw.map(d => typeof d === "string" ? { date: d, local: "", horario: "", responsavel: "" } : d);
  };

  const getRecDates = (clientId, year, month) => getRecordingDays(clientId, year, month).map(d => d.date);

  // Conflict detection — check if date has recordings from OTHER clients
  const getConflicts = (dateStr, excludeClientId) => {
    return data.clients
      .filter(c => c.id !== excludeClientId)
      .map(c => {
        const key = dateStr.slice(0, 7);
        const days = (c.recordingDays || {})[key] || [];
        const match = days.find(d => (typeof d === "string" ? d : d.date) === dateStr);
        return match ? { clientName: c.name, ...(typeof match === "object" ? match : { date: match }) } : null;
      })
      .filter(Boolean);
  };

  const getMonthContents = (clientId, year, month) => {
    return data.contents.filter(c => {
      if (c.clientId !== clientId) return false;
      const d = new Date(c.postDate + "T12:00:00");
      return d.getFullYear() === year && d.getMonth() === month;
    });
  };

  const getContractedCount = (clientId) => {
    const client = data.clients.find(c => c.id === clientId);
    return client ? client.qtdContents || 0 : 0;
  };

  // Save client brief
  const saveBrief = (clientId, brief) => {
    const updated = data.clients.map(c => c.id === clientId ? { ...c, brief } : c);
    save({ ...data, clients: updated });
  };

  if (!loaded) return (
    <div style={styles.loadWrap}>
      <div style={styles.loadDot} />
      <p style={{ color: "#94a3b8", marginTop: 12 }}>Carregando portal...</p>
    </div>
  );

  // ─── CLIENT PORTAL VIEW ───
  if (view === "portal") {
    const client = data.clients.find(c => c.id === clientPortalId);
    if (!client) return (
      <div style={styles.portalEmpty}>
        <p style={{ fontSize: 18, color: "#64748b" }}>Selecione um cliente para visualizar o portal.</p>
        <button style={styles.btnBack} onClick={() => setView("admin")}>← Voltar ao Admin</button>
      </div>
    );

    const recDaysObjs = getRecordingDays(client.id, viewYear, viewMonth);
    const recDays = recDaysObjs.map(d => d.date);
    const contents = getMonthContents(client.id, viewYear, viewMonth);
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

    const contentsByDate = {};
    contents.forEach(c => {
      const key = c.postDate;
      if (!contentsByDate[key]) contentsByDate[key] = [];
      contentsByDate[key].push(c);
    });

    return (
      <div style={styles.portal}>
        <header style={styles.portalHeader}>
          <div style={styles.portalBrand}>
            <div style={styles.logoMark}>GC</div>
            <div>
              <div style={styles.portalTitle}>Gestão de Conteúdo</div>
              <div style={styles.portalSub}>Agência Publi</div>
            </div>
          </div>
          <div style={styles.portalClientName}>{client.name}</div>
          {!new URLSearchParams(window.location.search).get("portal") && (
            <button style={styles.btnBackPortal} onClick={() => setView("admin")}>Sair</button>
          )}
        </header>

        <div style={styles.portalBody}>
          {/* Month nav */}
          <div style={styles.monthNav}>
            <button style={styles.monthBtn} onClick={() => {
              setSelectedPortalDay(null);
              if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
              else setViewMonth(viewMonth - 1);
            }}>‹</button>
            <span style={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</span>
            <button style={styles.monthBtn} onClick={() => {
              setSelectedPortalDay(null);
              if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
              else setViewMonth(viewMonth + 1);
            }}>›</button>
          </div>

          {/* ── SECTION 1: DIAS DE GRAVAÇÃO ── */}
          <div style={styles.portalBlock}>
            <div style={styles.portalBlockHeader}>
              <span style={styles.portalBlockIcon}>📹</span>
              <h3 style={styles.portalBlockTitle}>Dias de Gravação</h3>
            </div>
            {recDaysObjs.length === 0 ? (
              <p style={styles.portalEmptyText}>Nenhuma gravação marcada para este mês.</p>
            ) : (
              <div style={styles.recDaysList}>
                {recDaysObjs.sort((a,b) => a.date.localeCompare(b.date)).map(rec => {
                  const d = new Date(rec.date + "T12:00:00");
                  const dayName = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][d.getDay()];
                  const dayContentsForRec = contents.filter(c => c.recordDate === rec.date);
                  return (
                    <div key={rec.date} style={styles.recDayCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={styles.recDayDate}>
                          <span style={styles.recDayNum}>{d.getDate()}</span>
                          <span style={styles.recDayName}>{dayName}</span>
                        </div>
                        {dayContentsForRec.length > 0 && (
                          <button
                            style={styles.btnPDF}
                            onClick={() => generateRecordingDayPDF(client, rec.date, dayContentsForRec)}
                            title="Gerar pauta em PDF"
                          >📄 Pauta PDF</button>
                        )}
                      </div>
                      {/* Recording details */}
                      <div style={styles.recDayDetails}>
                        {rec.horario && <span>🕐 {rec.horario}</span>}
                        {rec.local && <span>📍 {rec.local}</span>}
                        {rec.responsavel && <span>🎬 {rec.responsavel}</span>}
                      </div>
                      {dayContentsForRec.length > 0 && (
                        <div style={styles.recDayContents}>
                          {dayContentsForRec.map(c => (
                            <span key={c.id} style={styles.recDayContentTag}>{c.type}: {c.title}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── SECTION 2: CONTEÚDOS DO MÊS (títulos) ── */}
          <div style={styles.portalBlock}>
            <div style={styles.portalBlockHeader}>
              <span style={styles.portalBlockIcon}>📝</span>
              <h3 style={styles.portalBlockTitle}>Conteúdos do Mês</h3>
              {client.contentPlan && Object.keys(client.contentPlan).length > 0 && (
                <span style={styles.portalBlockCount}>
                  {contents.length} de {Object.values(client.contentPlan).reduce((s,v)=>s+v,0)}
                </span>
              )}
            </div>
            {contents.length === 0 ? (
              <p style={styles.portalEmptyText}>Nenhum conteúdo planejado para este mês.</p>
            ) : (
              <div style={styles.portalContentList}>
                {contents.sort((a,b) => a.postDate.localeCompare(b.postDate)).map(c => {
                  const postD = new Date(c.postDate + "T12:00:00");
                  return (
                    <div key={c.id} style={styles.portalContentRow}>
                      <div style={styles.portalContentDot(c.type)} />
                      <span style={styles.portalContentTitle}>{c.title}</span>
                      {c.refLink && <a href={c.refLink} target="_blank" rel="noopener noreferrer" style={styles.refLinkSmall}>🔗</a>}
                      <span style={styles.portalContentTypeTag}>{c.type}</span>
                      <span style={styles.portalContentDate}>{postD.toLocaleDateString("pt-BR")}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Per-type breakdown inline */}
            {client.contentPlan && Object.keys(client.contentPlan).length > 0 && (
              <div style={styles.portalTypeSummary}>
                {Object.entries(client.contentPlan).map(([type, contracted]) => {
                  const done = contents.filter(c => c.type === type).length;
                  return (
                    <div key={type} style={styles.portalTypePill}>
                      <span style={styles.portalTypePillLabel}>{type}</span>
                      <span style={{
                        ...styles.portalTypePillCount,
                        color: done >= contracted ? "#10b981" : "#6366f1",
                      }}>{done}/{contracted}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── SECTION 3: CALENDÁRIO INTERATIVO ── */}
          <div style={styles.portalBlock}>
            <div style={styles.portalBlockHeader}>
              <span style={styles.portalBlockIcon}>📅</span>
              <h3 style={styles.portalBlockTitle}>Calendário</h3>
            </div>

            <div style={styles.legend}>
              <span style={styles.legendItem}><span style={{...styles.legendDot, background: "#f97316"}} /> Gravação</span>
              <span style={styles.legendItem}><span style={{...styles.legendDot, background: "#7c3aed"}} /> Vídeo / Reels</span>
              <span style={styles.legendItem}><span style={{...styles.legendDot, background: "#eab308"}} /> Foto / Imagem</span>
            </div>

            <div style={styles.calGrid}>
              {WEEKDAYS.map(d => (
                <div key={d} style={styles.calDayHeader}>{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e-${i}`} style={styles.calCellEmpty} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const isRec = recDays.includes(dateStr);
                const dayContents = contentsByDate[dateStr] || [];
                const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                const isSelected = selectedPortalDay === dateStr;
                const hasContent = dayContents.length > 0 || isRec;
                const hasVideo = dayContents.some(c => isVideoContent(c));
                const hasImage = dayContents.some(c => !isVideoContent(c));
                const cellColor = isRec ? styles.calCellRec : hasVideo ? styles.calCellVideo : hasImage ? styles.calCellImage : {};
                const isColored = isRec || hasVideo || hasImage;
                return (
                  <div
                    key={day}
                    style={{
                      ...styles.calCell,
                      ...cellColor,
                      ...(isToday ? styles.calCellToday : {}),
                      ...(isSelected ? styles.calCellSelected : {}),
                      ...(hasContent ? { cursor: "pointer" } : {}),
                    }}
                    onClick={() => hasContent && setSelectedPortalDay(isSelected ? null : dateStr)}
                  >
                    <span style={{
                      ...styles.calCellDay,
                      ...(isColored ? { color: "#fff", fontWeight: 700 } : {}),
                    }}>{day}</span>
                    {isRec && <span style={styles.recBadge}>📹</span>}
                    {dayContents.length > 0 && (
                      <div style={styles.calDots}>
                        {dayContents.map(c => (
                          <span key={c.id} style={styles.calContentDot} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── DETAIL PANEL (when a day is clicked) ── */}
            {selectedPortalDay && (() => {
              const selDate = new Date(selectedPortalDay + "T12:00:00");
              const selDayName = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"][selDate.getDay()];
              const selContents = contentsByDate[selectedPortalDay] || [];
              const selIsRec = recDays.includes(selectedPortalDay);
              const recContents = contents.filter(c => c.recordDate === selectedPortalDay);
              return (
                <div style={styles.dayDetail}>
                  <div style={styles.dayDetailHeader}>
                    <div>
                      <span style={styles.dayDetailDate}>{selDate.getDate()} de {MONTHS[selDate.getMonth()]}</span>
                      <span style={styles.dayDetailWeekday}>{selDayName}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      {selIsRec && recContents.length > 0 && (
                        <button
                          style={styles.btnPDF}
                          onClick={() => generateRecordingDayPDF(client, selectedPortalDay, recContents)}
                        >📄 Pauta PDF</button>
                      )}
                      <button style={styles.dayDetailClose} onClick={() => setSelectedPortalDay(null)}>✕</button>
                    </div>
                  </div>

                  {selIsRec && (
                    <div style={styles.dayDetailRecBanner}>
                      📹 Dia de gravação
                      {recContents.length > 0 && (
                        <span style={styles.dayDetailRecSub}>
                          {recContents.map(c => c.title).join(", ")}
                        </span>
                      )}
                    </div>
                  )}

                  {selContents.length > 0 ? (
                    <div style={styles.dayDetailContents}>
                      {selContents.map(c => (
                        <div key={c.id} style={styles.dayDetailCard}>
                          <div style={styles.dayDetailCardHeader}>
                            <span style={styles.contentType}>{c.type}</span>
                          </div>
                          <div style={styles.dayDetailCardTitle}>{c.title}</div>
                          {c.description && (
                            <div style={styles.dayDetailCardDesc}>{c.description}</div>
                          )}
                          {c.refLink && (
                            <a href={c.refLink} target="_blank" rel="noopener noreferrer" style={styles.refLink}>
                              🔗 Ver referência
                            </a>
                          )}
                          {c.recordDate && (
                            <div style={styles.dayDetailCardRec}>
                              📹 Gravado em {new Date(c.recordDate + "T12:00:00").toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : !selIsRec && (
                    <p style={styles.portalEmptyText}>Nenhum conteúdo neste dia.</p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  // ─── ADMIN VIEW ───
  const clientObj = data.clients.find(c => c.id === selectedClient);
  const recDaysObjs = selectedClient ? getRecordingDays(selectedClient, viewYear, viewMonth) : [];
  const recDays = recDaysObjs.map(d => d.date);
  const monthContents = selectedClient ? getMonthContents(selectedClient, viewYear, viewMonth) : [];

  return (
    <div style={styles.admin}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logoMark}>GC</div>
          <div style={styles.sidebarBrand}>Gestão de Conteúdo</div>
        </div>
        <div style={styles.sidebarSection}>
          {/* Dashboard nav */}
          <div
            style={{
              ...styles.sidebarItem,
              ...(selectedClient === null && view === "admin" ? styles.sidebarItemActive : {}),
              marginBottom: 12,
            }}
            onClick={() => { setSelectedClient(null); setView("admin"); }}
          >
            <span style={{ fontSize: 16 }}>📊</span>
            <span style={styles.sidebarName}>Dashboard</span>
          </div>

          <div style={styles.sidebarLabel}>Clientes</div>
          {data.clients.map(c => (
            <div
              key={c.id}
              style={{
                ...styles.sidebarItem,
                ...(selectedClient === c.id ? styles.sidebarItemActive : {}),
              }}
              onClick={() => setSelectedClient(c.id)}
            >
              <span style={styles.sidebarAvatar}>{c.name.charAt(0)}</span>
              <span style={styles.sidebarName}>{c.name}</span>
            </div>
          ))}
          <button style={styles.btnAddClient} onClick={() => { setEditingClient(null); setShowClientForm(true); }}>
            + Novo cliente
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        {!selectedClient ? (
          <Dashboard data={data} clients={data.clients} contents={data.contents} viewMonth={viewMonth} viewYear={viewYear} setViewMonth={setViewMonth} setViewYear={setViewYear} setSelectedClient={setSelectedClient} />
        ) : (
          <>
            {/* Client header */}
            <div style={styles.clientHeader}>
              <div>
                <h2 style={styles.clientName}>{clientObj?.name}</h2>
                <div style={styles.clientMeta}>
                  {clientObj?.contentPlan && Object.keys(clientObj.contentPlan).length > 0
                    ? Object.entries(clientObj.contentPlan).map(([t, q]) => `${t}: ${q}`).join(" · ")
                    : `${clientObj?.qtdContents || 0} conteúdos/mês`}
                  <span style={{ marginLeft: 8, color: "#6366f1", fontWeight: 600 }}>
                    ({clientObj?.qtdContents || Object.values(clientObj?.contentPlan || {}).reduce((s,v) => s+v, 0)} total)
                  </span>
                </div>
              </div>
              <div style={styles.clientActions}>
                <button style={styles.btnAI} onClick={() => setShowAIGenerator(true)}>
                  ✨ Gerar conteúdos com IA
                </button>
                <button style={styles.btnSecondary} onClick={() => {
                  setEditingClient(clientObj);
                  setShowClientForm(true);
                }}>Editar</button>
                <button style={styles.btnPortalPreview} onClick={() => {
                  setClientPortalId(selectedClient);
                  setView("portal");
                }}>👁 Ver portal</button>
                <button style={linkCopied ? styles.btnCopied : styles.btnShare} onClick={() => {
                  const url = `${window.location.origin}?portal=${selectedClient}`;
                  navigator.clipboard.writeText(url).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2500);
                  }).catch(() => {
                    const ta = document.createElement("textarea");
                    ta.value = url;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand("copy");
                    document.body.removeChild(ta);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2500);
                  });
                }}>{linkCopied ? "✓ Link copiado!" : "🔗 Compartilhar portal"}</button>
                <button style={styles.btnDanger} onClick={() => deleteClient(selectedClient)}>Excluir</button>
              </div>
            </div>

            {/* Client tabs */}
            <div style={styles.tabBar}>
              <button
                style={clientTab === "calendar" ? styles.tabActive : styles.tab}
                onClick={() => setClientTab("calendar")}
              >📅 Calendário</button>
              <button
                style={clientTab === "briefing" ? styles.tabActive : styles.tab}
                onClick={() => setClientTab("briefing")}
              >
                🧠 Briefing do Cliente
                {(() => {
                  const b = clientObj?.brief || {};
                  const filled = BRIEF_QUESTIONS.flatMap(s => s.questions).filter(q => b[q.key]?.trim()).length;
                  const total = BRIEF_QUESTIONS.flatMap(s => s.questions).length;
                  const pct = Math.round((filled / total) * 100);
                  return pct < 100 ? <span style={styles.tabBadge}>{pct}%</span> : <span style={styles.tabBadgeDone}>✓</span>;
                })()}
              </button>
            </div>

            {clientTab === "briefing" ? (
              <ClientBriefing
                client={clientObj}
                onSave={(brief) => saveBrief(selectedClient, brief)}
              />
            ) : (
            <>

            {/* Month nav */}
            <div style={styles.monthNav}>
              <button style={styles.monthBtn} onClick={() => {
                if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
                else setViewMonth(viewMonth - 1);
              }}>‹</button>
              <span style={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</span>
              <button style={styles.monthBtn} onClick={() => {
                if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
                else setViewMonth(viewMonth + 1);
              }}>›</button>
            </div>

            {/* Admin Calendar + Actions */}
            <div style={styles.adminGrid}>
              {/* Calendar */}
              <div style={styles.adminCalWrap}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={styles.sectionTitle}>Calendário</h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={showRecordingPicker ? styles.btnRecActive : styles.btnRec}
                      onClick={() => setShowRecordingPicker(!showRecordingPicker)}
                    >
                      {showRecordingPicker ? "✓ Selecionando gravações" : "📹 Marcar gravações"}
                    </button>
                    <button style={styles.btnPrimary} onClick={() => { setEditingContent(null); setShowContentForm(true); }}>
                      + Conteúdo
                    </button>
                  </div>
                </div>

                <div style={styles.legend}>
                  <span style={styles.legendItem}><span style={{...styles.legendDot, background: "#f97316"}} /> Gravação</span>
                  <span style={styles.legendItem}><span style={{...styles.legendDot, background: "#7c3aed"}} /> Vídeo / Reels</span>
                  <span style={styles.legendItem}><span style={{...styles.legendDot, background: "#eab308"}} /> Foto / Imagem</span>
                </div>

                <div style={styles.calGrid}>
                  {WEEKDAYS.map(d => <div key={d} style={styles.calDayHeader}>{d}</div>)}
                  {Array.from({ length: getFirstDayOfMonth(viewYear, viewMonth) }).map((_, i) => (
                    <div key={`e-${i}`} style={styles.calCellEmpty} />
                  ))}
                  {Array.from({ length: getDaysInMonth(viewYear, viewMonth) }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                    const isRec = recDays.includes(dateStr);
                    const recObj = recDaysObjs.find(d => d.date === dateStr);
                    const conflicts = showRecordingPicker ? getConflicts(dateStr, selectedClient) : [];
                    const hasConflict = conflicts.length > 0;
                    const dayContents = monthContents.filter(c => c.postDate === dateStr);
                    const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
                    const hasVideo = dayContents.some(c => isVideoContent(c));
                    const hasImage = dayContents.some(c => !isVideoContent(c));
                    const cellColor = isRec ? styles.calCellRec : hasVideo ? styles.calCellVideo : hasImage ? styles.calCellImage : {};
                    const isColored = isRec || hasVideo || hasImage;
                    return (
                      <div
                        key={day}
                        style={{
                          ...styles.calCell,
                          ...cellColor,
                          ...(isToday ? styles.calCellToday : {}),
                          ...(showRecordingPicker && hasConflict && !isRec ? styles.calCellConflict : {}),
                          ...(showRecordingPicker ? { cursor: "pointer" } : {}),
                        }}
                        onClick={() => {
                          if (!showRecordingPicker) return;
                          if (isRec) {
                            // Click existing recording → open form to edit or remove
                            setShowRecDayForm({ dateStr, existing: recObj });
                          } else {
                            // Click empty day → open form, show conflict warning if any
                            setShowRecDayForm({ dateStr, existing: null, conflicts });
                          }
                        }}
                      >
                        <span style={{
                          ...styles.calCellDay,
                          ...(isColored ? { color: "#fff", fontWeight: 700 } : {}),
                        }}>{day}</span>
                        {isRec && <span style={styles.recBadgeSmall}>📹</span>}
                        {showRecordingPicker && hasConflict && !isRec && <span style={{ fontSize: 9, color: "#dc2626" }}>⚠️</span>}
                        {isRec && recObj?.horario && <span style={{ fontSize: 8, color: "rgba(255,255,255,0.8)" }}>{recObj.horario}</span>}
                        {dayContents.map(c => (
                          <span
                            key={c.id}
                            style={styles.contentBadgeSmall}
                            onClick={(e) => { e.stopPropagation(); setEditingContent(c); setShowContentForm(true); }}
                          >{c.type?.slice(0,3)}</span>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content list panel */}
              <div style={styles.adminListPanel}>
                <h3 style={styles.sectionTitle}>Conteúdos — {MONTHS[viewMonth]}</h3>
                <div style={styles.adminCounter}>
                  {monthContents.length} de {clientObj?.qtdContents || Object.values(clientObj?.contentPlan || {}).reduce((s,v)=>s+v,0)} planejados
                </div>

                {/* PDF per recording day */}
                {recDays.length > 0 && (
                  <div style={{ marginTop: 12, marginBottom: 12, padding: "10px 12px", background: "#fff7ed", borderRadius: 8, border: "1px solid #fed7aa" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#9a3412", marginBottom: 6 }}>📄 Pautas de gravação</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {recDays.sort().map(dateStr => {
                        const d = new Date(dateStr + "T12:00:00");
                        const recContents = monthContents.filter(c => c.recordDate === dateStr);
                        return (
                          <div key={dateStr} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "#9a3412" }}>
                              {d.getDate()}/{d.getMonth()+1} — {recContents.length} conteúdo{recContents.length !== 1 ? "s" : ""}
                            </span>
                            <button
                              style={{ ...styles.btnPDF, fontSize: 11, padding: "3px 8px" }}
                              onClick={() => generateRecordingDayPDF(clientObj, dateStr, recContents)}
                              disabled={recContents.length === 0}
                            >PDF</button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {clientObj?.contentPlan && Object.keys(clientObj.contentPlan).length > 0 && (
                  <div style={styles.typeBreakdown}>
                    {Object.entries(clientObj.contentPlan).map(([type, contracted]) => {
                      const done = monthContents.filter(c => c.type === type).length;
                      return (
                        <div key={type} style={styles.typeBreakdownRow}>
                          <span style={styles.typeBreakdownLabel}>{type}</span>
                          <span style={{
                            ...styles.typeBreakdownCount,
                            color: done >= contracted ? "#10b981" : "#f59e0b",
                          }}>{done}/{contracted}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {monthContents.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 16 }}>Nenhum conteúdo adicionado.</p>
                ) : (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    {monthContents.sort((a,b) => a.postDate.localeCompare(b.postDate)).map(c => (
                      <div key={c.id} style={styles.adminContentItem}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <span style={styles.contentTypeTag}>{c.type}</span>
                            <span style={c.format === "imagem" ? styles.formatTagImg : styles.formatTagVid}>
                              {c.format === "imagem" ? "🖼" : "🎬"}
                            </span>
                            <span style={styles.adminContentTitle}>{c.title}</span>
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button style={styles.btnMini} onClick={() => { setEditingContent(c); setShowContentForm(true); }}>✎</button>
                            <button style={styles.btnMiniDanger} onClick={() => deleteContent(c.id)}>✕</button>
                          </div>
                        </div>
                        <div style={styles.adminContentMeta}>
                          {c.recordDate && <span>📹 {new Date(c.recordDate + "T12:00:00").toLocaleDateString("pt-BR")}</span>}
                          <span>📅 {new Date(c.postDate + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                          {c.refLink && <a href={c.refLink} target="_blank" rel="noopener noreferrer" style={styles.refLinkSmall} onClick={e => e.stopPropagation()}>🔗 Ref</a>}
                          <span style={{ display: "flex", gap: 3, marginLeft: 4 }}>
                            <span title="Gravado" style={{ opacity: c.recorded ? 1 : 0.2 }}>📹</span>
                            <span title="Entregue" style={{ opacity: c.delivered ? 1 : 0.2 }}>✅</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
          )}
          </>
        )}
      </main>

      {/* CLIENT FORM MODAL */}
      {showClientForm && (
        <Modal onClose={() => { setShowClientForm(false); setEditingClient(null); }}>
          <ClientForm
            initial={editingClient}
            onSave={saveClient}
            onCancel={() => { setShowClientForm(false); setEditingClient(null); }}
          />
        </Modal>
      )}

      {/* CONTENT FORM MODAL */}
      {showContentForm && selectedClient && (
        <Modal onClose={() => { setShowContentForm(false); setEditingContent(null); }}>
          <ContentForm
            initial={editingContent}
            clientId={selectedClient}
            clientTypes={clientObj?.contentTypes || CONTENT_TYPES}
            month={viewMonth}
            year={viewYear}
            onSave={saveContent}
            onCancel={() => { setShowContentForm(false); setEditingContent(null); }}
          />
        </Modal>
      )}

      {/* AI GENERATOR MODAL */}
      {showAIGenerator && selectedClient && clientObj && (
        <Modal onClose={() => setShowAIGenerator(false)}>
          <AIContentGenerator
            client={clientObj}
            onAddContent={(items) => {
              const newContents = items.map(item => ({
                ...item,
                id: uid(),
                clientId: selectedClient,
                recorded: false,
                delivered: false,
              }));
              save({ ...data, contents: [...data.contents, ...newContents] });
              setShowAIGenerator(false);
            }}
            onCancel={() => setShowAIGenerator(false)}
          />
        </Modal>
      )}

      {/* RECORDING DAY FORM MODAL */}
      {showRecDayForm && selectedClient && (
        <Modal onClose={() => setShowRecDayForm(null)}>
          <RecordingDayForm
            dateStr={showRecDayForm.dateStr}
            existing={showRecDayForm.existing}
            conflicts={showRecDayForm.conflicts || getConflicts(showRecDayForm.dateStr, selectedClient)}
            onSave={(details) => {
              saveRecordingDay(selectedClient, showRecDayForm.dateStr, details);
              setShowRecDayForm(null);
            }}
            onRemove={() => {
              removeRecordingDay(selectedClient, showRecDayForm.dateStr);
              setShowRecDayForm(null);
            }}
            onCancel={() => setShowRecDayForm(null)}
          />
        </Modal>
      )}
    </div>
  );
}

// ─── RECORDING DAY FORM ───
function RecordingDayForm({ dateStr, existing, conflicts, onSave, onRemove, onCancel }) {
  const d = new Date(dateStr + "T12:00:00");
  const dayNames = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
  const dateLabel = `${d.getDate()} de ${MONTHS[d.getMonth()]} · ${dayNames[d.getDay()]}`;

  const [local, setLocal] = useState(existing?.local || "");
  const [horario, setHorario] = useState(existing?.horario || "");
  const [responsavel, setResponsavel] = useState(existing?.responsavel || "");

  const hasConflicts = conflicts && conflicts.length > 0;

  return (
    <div>
      <h3 style={styles.formTitle}>{existing ? "📹 Editar gravação" : "📹 Nova gravação"}</h3>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 16 }}>{dateLabel}</div>

      {/* Conflict warning */}
      {hasConflicts && (
        <div style={styles.conflictBanner}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Conflito de agenda</div>
          {conflicts.map((c, i) => (
            <div key={i} style={{ fontSize: 12 }}>
              <strong>{c.clientName}</strong> já tem gravação neste dia
              {c.horario ? ` às ${c.horario}` : ""}
              {c.local ? ` em ${c.local}` : ""}
            </div>
          ))}
          <div style={{ fontSize: 11, marginTop: 4, color: "#9a3412" }}>
            Você pode continuar, mas atenção ao horário para não coincidir.
          </div>
        </div>
      )}

      <label style={styles.formLabel}>Local da gravação</label>
      <input
        style={styles.input}
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder="Ex: Loja do Shopping Midway, Cozinha do restaurante..."
      />

      <label style={styles.formLabel}>Horário</label>
      <input
        style={styles.input}
        type="time"
        value={horario}
        onChange={e => setHorario(e.target.value)}
      />

      <label style={styles.formLabel}>Responsável pela gravação</label>
      <input
        style={styles.input}
        value={responsavel}
        onChange={e => setResponsavel(e.target.value)}
        placeholder="Ex: João (videomaker), Equipe Publi..."
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
        {existing ? (
          <button style={styles.btnDanger} onClick={onRemove}>Remover gravação</button>
        ) : <div />}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.btnCancel} onClick={onCancel}>Cancelar</button>
          <button style={styles.btnPrimary} onClick={() => onSave({ local, horario, responsavel })}>
            {existing ? "Salvar alterações" : "Marcar gravação"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT BRIEFING ───
function ClientBriefing({ client, onSave }) {
  const [brief, setBrief] = useState(client.brief || {});
  const [expandedSection, setExpandedSection] = useState(BRIEF_QUESTIONS[0].section);
  const [saved, setSaved] = useState(false);

  const updateField = (key, value) => {
    setBrief(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    onSave(brief);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const allQuestions = BRIEF_QUESTIONS.flatMap(s => s.questions);
  const filled = allQuestions.filter(q => brief[q.key]?.trim()).length;
  const total = allQuestions.length;
  const pct = Math.round((filled / total) * 100);

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Progress bar */}
      <div style={styles.briefProgress}>
        <div style={styles.briefProgressInfo}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
            🧠 Briefing preenchido: {filled} de {total} campos
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color: pct === 100 ? "#10b981" : "#6366f1" }}>{pct}%</span>
        </div>
        <div style={styles.briefProgressBar}>
          <div style={{ ...styles.briefProgressFill, width: `${pct}%`, background: pct === 100 ? "#10b981" : "#6366f1" }} />
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
          Quanto mais completo, melhor a IA gera conteúdos para este cliente.
        </p>
      </div>

      {/* Sections */}
      {BRIEF_QUESTIONS.map(section => {
        const isOpen = expandedSection === section.section;
        const sectionFilled = section.questions.filter(q => brief[q.key]?.trim()).length;
        const sectionTotal = section.questions.length;
        return (
          <div key={section.section} style={styles.briefSection}>
            <div
              style={styles.briefSectionHeader}
              onClick={() => setExpandedSection(isOpen ? null : section.section)}
            >
              <span style={{ fontSize: 18 }}>{section.icon}</span>
              <span style={styles.briefSectionTitle}>{section.section}</span>
              <span style={styles.briefSectionCount}>
                {sectionFilled}/{sectionTotal}
              </span>
              <span style={{ fontSize: 16, color: "#94a3b8", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
            </div>
            {isOpen && (
              <div style={styles.briefSectionBody}>
                {section.questions.map(q => (
                  <div key={q.key} style={{ marginBottom: 14 }}>
                    <label style={styles.formLabel}>{q.label}</label>
                    <textarea
                      style={{ ...styles.input, height: 52, resize: "vertical", fontSize: 13 }}
                      value={brief[q.key] || ""}
                      onChange={e => updateField(q.key, e.target.value)}
                      placeholder={q.placeholder}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Save button */}
      <div style={{ position: "sticky", bottom: 0, background: "#f8fafc", padding: "12px 0", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end", gap: 10, alignItems: "center" }}>
        {saved && <span style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>✓ Salvo com sucesso</span>}
        <button style={styles.btnPrimary} onClick={handleSave}>
          Salvar briefing
        </button>
      </div>
    </div>
  );
}

// ─── AI CONTENT GENERATOR ───
function AIContentGenerator({ client, onAddContent, onCancel }) {
  const [prompt, setPrompt] = useState("");
  const [qty, setQty] = useState(client.qtdContents || 8);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState(null);
  const [step, setStep] = useState("generate"); // "generate" | "results" | "schedule"
  const [scheduleData, setScheduleData] = useState({});

  const types = client.contentTypes || [];
  const planDetail = client.contentPlan
    ? Object.entries(client.contentPlan).map(([t,q]) => `${q}x ${t}`).join(", ")
    : types.join(", ");

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const b = client.brief || {};
      const briefLines = BRIEF_QUESTIONS.flatMap(s => s.questions)
        .filter(q => b[q.key]?.trim())
        .map(q => `${q.label}: ${b[q.key]}`)
        .join("\n");

      const briefBlock = briefLines
        ? `\n\nBRIEFING COMPLETO DO CLIENTE:\n${briefLines}`
        : "";

      const systemPrompt = `Você é um estrategista de conteúdo digital para redes sociais no Brasil, especialista em criar conteúdos que geram engajamento e resultado.
Você conhece profundamente este cliente e deve gerar ideias que reflitam o tom de voz, os valores, o público-alvo e os diferenciais da marca.
Responda APENAS em JSON puro, sem markdown, sem backticks. O formato deve ser:
[{"title":"Título do conteúdo","type":"Tipo (ex: Reels, Carrossel)","format":"video ou imagem","description":"Descrição detalhada: roteiro resumido, ideia visual, gancho de abertura, CTA sugerido"}]
REGRAS IMPORTANTES:
- O campo "format" deve ser "video" para conteúdos gravados em vídeo (Reels, Vídeo Longo, Stories com vídeo, Bastidores, Depoimento) ou "imagem" para conteúdos estáticos (Carrossel de fotos, Foto, Arte estática, Stories com imagem).
- Gere exatamente ${qty} ideias.
- Use apenas estes tipos de conteúdo: ${types.join(", ")}.
${client.contentPlan ? `Distribuição ideal por tipo: ${planDetail}.` : ""}
Seja criativo, varie os formatos entre vídeo e imagem, e pense em conteúdos que funcionam especificamente para o nicho deste cliente.${briefBlock}`;

      const userMsg = `Cliente: ${client.name}
Segmento: ${client.segment || "não informado"}
Tipos contratados: ${planDetail}
${prompt ? `Tema/contexto específico: ${prompt}` : "Gere ideias estratégicas para o próximo mês, variando entre conteúdos de atração, engajamento e conversão. Misture vídeos e imagens estáticas."}`;

      const response = await fetch("/.netlify/functions/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: "user", content: userMsg }],
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError("Erro da API: " + (data.error?.message || data.error || JSON.stringify(data)));
        setLoading(false);
        return;
      }

      const text = data.content?.map(i => i.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResults(parsed);
      setSelected(new Set(parsed.map((_, i) => i)));
      setStep("results");
    } catch (err) {
      setError("Erro: " + err.message);
      console.error(err);
    }
    setLoading(false);
  };

  const toggleSelect = (i) => {
    const next = new Set(selected);
    next.has(i) ? next.delete(i) : next.add(i);
    setSelected(next);
  };

  const goToSchedule = () => {
    const initial = {};
    results.forEach((r, i) => {
      if (selected.has(i)) initial[i] = { postDate: "" };
    });
    setScheduleData(initial);
    setStep("schedule");
  };

  const updateSchedule = (i, field, value) => {
    setScheduleData(prev => ({ ...prev, [i]: { ...prev[i], [field]: value } }));
  };

  const addToCalendar = () => {
    if (!results) return;
    const sortedSelected = [...selected].sort((a,b)=>a-b);
    const items = sortedSelected.map(i => ({
      title: results[i].title,
      type: results[i].type || types[0] || "Reels",
      format: results[i].format || "video",
      description: results[i].description || "",
      postDate: scheduleData[i]?.postDate || "",
      recordDate: "",
    }));
    onAddContent(items);
  };

  const videoCount = results ? [...selected].filter(i => (results[i]?.format || "video") === "video").length : 0;
  const imgCount = results ? [...selected].filter(i => (results[i]?.format) === "imagem").length : 0;

  return (
    <div>
      <h3 style={styles.formTitle}>✨ Gerador de Conteúdo com IA</h3>
      <div style={styles.aiClientInfo}>
        <strong>{client.name}</strong>
        {client.segment && <span> · {client.segment}</span>}
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{planDetail}</div>
        {(() => {
          const b = client.brief || {};
          const filled = BRIEF_QUESTIONS.flatMap(s => s.questions).filter(q => b[q.key]?.trim()).length;
          const total = BRIEF_QUESTIONS.flatMap(s => s.questions).length;
          const pct = Math.round((filled / total) * 100);
          return (
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#10b981" : "#6366f1", borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 11, color: pct === 100 ? "#10b981" : "#94a3b8", fontWeight: 600 }}>
                Briefing {pct}%
              </span>
            </div>
          );
        })()}
      </div>

      {/* STEP 1: GENERATE */}
      {step === "generate" && (
        <>
          <label style={styles.formLabel}>Contexto ou tema (opcional)</label>
          <textarea
            style={{ ...styles.input, height: 70, resize: "vertical" }}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Ex: Promoção de verão, Lançamento do novo cardápio, Semana do consumidor..."
          />

          <label style={styles.formLabel}>Quantidade de ideias</label>
          <input style={styles.input} type="number" value={qty} onChange={e => setQty(Number(e.target.value))} min={1} max={20} />

          {error && <div style={styles.aiError}>{error}</div>}

          <div style={styles.formActions}>
            <button style={styles.btnCancel} onClick={onCancel}>Cancelar</button>
            <button style={styles.btnAI} onClick={generate} disabled={loading}>
              {loading ? "⏳ Gerando..." : "✨ Gerar ideias"}
            </button>
          </div>
        </>
      )}

      {/* STEP 2: RESULTS - select content */}
      {step === "results" && results && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              {results.length} ideias geradas — selecione as que deseja:
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={styles.formatBadgeVid}>🎬 {videoCount} vídeo{videoCount !== 1 ? "s" : ""}</span>
              <span style={styles.formatBadgeImg}>🖼 {imgCount} imagem{imgCount !== 1 ? "ns" : ""}</span>
            </div>
          </div>

          <div style={styles.aiResultList}>
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  ...styles.aiResultItem,
                  ...(selected.has(i) ? styles.aiResultSelected : {}),
                }}
                onClick={() => toggleSelect(i)}
              >
                <div style={styles.aiResultCheck}>
                  <span style={selected.has(i) ? styles.checkOn : styles.checkOff}>
                    {selected.has(i) ? "✓" : ""}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={r.format === "imagem" ? styles.formatTagImg : styles.formatTagVid}>
                      {r.format === "imagem" ? "🖼 Imagem" : "🎬 Vídeo"}
                    </span>
                    <span style={styles.contentTypeTag}>{r.type}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{r.title}</span>
                  </div>
                  {r.description && (
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{r.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <button style={styles.btnCancel} onClick={() => { setResults(null); setStep("generate"); setError(null); }}>
              ← Gerar novamente
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={styles.btnCancel} onClick={onCancel}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={goToSchedule} disabled={selected.size === 0}>
                Agendar {selected.size} conteúdo{selected.size !== 1 ? "s" : ""} →
              </button>
            </div>
          </div>
        </>
      )}

      {/* STEP 3: SCHEDULE - assign posting dates only */}
      {step === "schedule" && results && (
        <>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
            Defina a data de postagem de cada conteúdo. A data de gravação você define depois, clicando no conteúdo no calendário.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
            {[...selected].sort((a,b)=>a-b).map(i => {
              const r = results[i];
              return (
                <div key={i} style={styles.scheduleItem}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flex: 1, minWidth: 0 }}>
                      <span style={r.format === "imagem" ? styles.formatTagImg : styles.formatTagVid}>
                        {r.format === "imagem" ? "🖼" : "🎬"}
                      </span>
                      <span style={styles.contentTypeTag}>{r.type}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                    </div>
                    <div style={{ minWidth: 150 }}>
                      <input
                        style={{ ...styles.input, fontSize: 13 }}
                        type="date"
                        value={scheduleData[i]?.postDate || ""}
                        onChange={e => updateSchedule(i, "postDate", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <button style={styles.btnCancel} onClick={() => setStep("results")}>
              ← Voltar
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={styles.btnCancel} onClick={onCancel}>Cancelar</button>
              <button style={styles.btnPrimary} onClick={addToCalendar}>
                ✅ Adicionar ao calendário
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── DASHBOARD ───
function Dashboard({ data, clients, contents, viewMonth, viewYear, setViewMonth, setViewYear, setSelectedClient }) {
  const todayStr = fmt(today);
  const todayDow = today.getDay();
  const [copied, setCopied] = useState(false);

  // Week bounds (Mon–Sun)
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((todayDow + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = fmt(weekStart);
  const weekEndStr = fmt(weekEnd);

  // Monthly contents across all clients
  const monthContents = contents.filter(c => {
    const d = new Date(c.postDate + "T12:00:00");
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  // Also consider recordDate for monthly metrics
  const monthByRecord = contents.filter(c => {
    if (!c.recordDate) return false;
    const d = new Date(c.recordDate + "T12:00:00");
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  const gravados = monthContents.filter(c => c.recorded).length;
  const entregues = monthContents.filter(c => c.delivered).length;
  const totalMonth = monthContents.length;

  // Recording days across all clients this month
  const allRecDays = new Set();
  clients.forEach(cl => {
    const key = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}`;
    const days = (cl.recordingDays || {})[key] || [];
    days.forEach(d => allRecDays.add(typeof d === "string" ? d : d.date));
  });
  const diasGravacao = allRecDays.size;

  // Today's posts
  const todayPosts = contents.filter(c => c.postDate === todayStr);

  // This week's posts
  const weekPosts = contents.filter(c => c.postDate >= weekStartStr && c.postDate <= weekEndStr)
    .sort((a, b) => a.postDate.localeCompare(b.postDate));

  const getClientName = (id) => clients.find(c => c.id === id)?.name || "—";

  const dayLabel = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00");
    const names = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
    return `${names[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`;
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#0f172a" }}>Dashboard</h2>
      <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 20px" }}>
        Visão geral da agência — {MONTHS[viewMonth]} {viewYear}
      </p>

      {/* Month nav */}
      <div style={{ ...styles.monthNav, justifyContent: "flex-start", margin: "0 0 20px" }}>
        <button style={styles.monthBtn} onClick={() => {
          if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
          else setViewMonth(viewMonth - 1);
        }}>‹</button>
        <span style={styles.monthLabel}>{MONTHS[viewMonth]} {viewYear}</span>
        <button style={styles.monthBtn} onClick={() => {
          if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
          else setViewMonth(viewMonth + 1);
        }}>›</button>
      </div>

      {/* ── METRIC CARDS ── */}
      <div style={styles.dashMetrics}>
        <div style={styles.dashCard}>
          <div style={styles.dashCardIcon}>🗓️</div>
          <div>
            <div style={styles.dashCardNum}>{diasGravacao}</div>
            <div style={styles.dashCardLabel}>Dias em gravação</div>
          </div>
          <div style={styles.dashCardSub}>{clients.length} cliente{clients.length !== 1 ? "s" : ""}</div>
        </div>
        <div style={styles.dashCard}>
          <div style={styles.dashCardIcon}>📹</div>
          <div>
            <div style={styles.dashCardNum}>{gravados}</div>
            <div style={styles.dashCardLabel}>Conteúdos gravados</div>
          </div>
          <div style={styles.dashCardBar}>
            <div style={{ ...styles.dashCardBarFill, width: `${totalMonth ? (gravados/totalMonth)*100 : 0}%`, background: "#f97316" }} />
          </div>
        </div>
        <div style={styles.dashCard}>
          <div style={styles.dashCardIcon}>✅</div>
          <div>
            <div style={styles.dashCardNum}>{entregues}</div>
            <div style={styles.dashCardLabel}>Entregues</div>
          </div>
          <div style={styles.dashCardBar}>
            <div style={{ ...styles.dashCardBarFill, width: `${totalMonth ? (entregues/totalMonth)*100 : 0}%`, background: "#10b981" }} />
          </div>
        </div>
        <div style={styles.dashCard}>
          <div style={styles.dashCardIcon}>📦</div>
          <div>
            <div style={styles.dashCardNum}>{totalMonth}</div>
            <div style={styles.dashCardLabel}>Total do mês</div>
          </div>
        </div>
      </div>

      {/* ── WEEKLY RECORDING SCHEDULE ── */}
      {(() => {
        // Gather all recordings this week across all clients
        const weekRecs = [];
        clients.forEach(cl => {
          // Check all month keys that could overlap with this week
          const keysToCheck = new Set();
          for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
            keysToCheck.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
          }
          keysToCheck.forEach(key => {
            const days = (cl.recordingDays || {})[key] || [];
            days.forEach(rec => {
              const dateStr = typeof rec === "string" ? rec : rec.date;
              if (dateStr >= weekStartStr && dateStr <= weekEndStr) {
                weekRecs.push({
                  clientName: cl.name,
                  clientId: cl.id,
                  date: dateStr,
                  local: (typeof rec === "object" ? rec.local : "") || "",
                  horario: (typeof rec === "object" ? rec.horario : "") || "",
                  responsavel: (typeof rec === "object" ? rec.responsavel : "") || "",
                  // Get contents for this recording day
                  contents: contents.filter(c => c.clientId === cl.id && c.recordDate === dateStr),
                });
              }
            });
          });
        });
        weekRecs.sort((a, b) => a.date.localeCompare(b.date) || a.horario.localeCompare(b.horario));

        // Group by date
        const byDate = {};
        weekRecs.forEach(r => {
          if (!byDate[r.date]) byDate[r.date] = [];
          byDate[r.date].push(r);
        });

        // Generate WhatsApp text
        const generateWhatsAppText = () => {
          const weekLabel = `${weekStart.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} a ${weekEnd.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`;
          let text = `📹 *CRONOGRAMA DE GRAVAÇÕES*\n📅 Semana ${weekLabel}\n`;
          text += `━━━━━━━━━━━━━━━━━━\n\n`;

          if (weekRecs.length === 0) {
            text += `Nenhuma gravação programada para esta semana.\n`;
            return text;
          }

          const dayNamesLong = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];

          Object.entries(byDate).forEach(([dateStr, recs]) => {
            const d = new Date(dateStr + "T12:00:00");
            text += `📌 *${dayNamesLong[d.getDay()]} — ${d.toLocaleDateString("pt-BR")}*\n`;
            text += `\n`;

            recs.forEach(r => {
              text += `   🎬 *${r.clientName}*\n`;
              if (r.horario) text += `   🕐 Horário: ${r.horario}\n`;
              if (r.local) text += `   📍 Local: ${r.local}\n`;
              if (r.responsavel) text += `   👤 Responsável: ${r.responsavel}\n`;
              if (r.contents.length > 0) {
                text += `   📋 Conteúdos:\n`;
                r.contents.forEach(c => {
                  text += `      • ${c.type}: ${c.title}\n`;
                });
              }
              text += `\n`;
            });
            text += `━━━━━━━━━━━━━━━━━━\n\n`;
          });

          text += `✅ Total: ${weekRecs.length} gravação${weekRecs.length !== 1 ? "ões" : ""} na semana\n`;
          text += `\n_Agência Publi_`;
          return text;
        };

        const handleCopy = () => {
          const text = generateWhatsAppText();
          navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }).catch(() => {
            // Fallback
            const ta = document.createElement("textarea");
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          });
        };

        const dayNamesShort = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

        return (
          <div style={styles.dashSection}>
            <div style={styles.dashSectionHeader}>
              <span style={styles.dashSectionIcon}>📹</span>
              <h3 style={styles.dashSectionTitle}>Gravações da semana</h3>
              <span style={styles.dashSectionDate}>
                {weekStart.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} — {weekEnd.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
              </span>
            </div>

            {weekRecs.length === 0 ? (
              <div style={styles.dashEmpty}>Nenhuma gravação programada para esta semana.</div>
            ) : (
              <>
                <div style={styles.dashPostList}>
                  {Object.entries(byDate).map(([dateStr, recs]) => {
                    const d = new Date(dateStr + "T12:00:00");
                    const isToday = dateStr === todayStr;
                    return (
                      <div key={dateStr}>
                        <div style={{
                          fontSize: 12, fontWeight: 700, color: isToday ? "#dc2626" : "#64748b",
                          padding: "6px 0 4px", display: "flex", alignItems: "center", gap: 6,
                        }}>
                          {dayNamesShort[d.getDay()]} {d.getDate()}/{d.getMonth()+1}
                          {isToday && <span style={styles.dashTodayTag}>Hoje</span>}
                        </div>
                        {recs.map((r, ri) => (
                          <div key={ri} style={{
                            ...styles.dashPostItem,
                            ...(isToday ? { background: "#fff7ed", borderColor: "#fed7aa" } : {}),
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", cursor: "pointer" }}
                                  onClick={() => setSelectedClient(r.clientId)}
                                >{r.clientName}</span>
                              </div>
                              <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
                                {r.horario && <span>🕐 {r.horario}</span>}
                                {r.local && <span>📍 {r.local}</span>}
                                {r.responsavel && <span>🎬 {r.responsavel}</span>}
                              </div>
                              {r.contents.length > 0 && (
                                <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                                  {r.contents.map(c => (
                                    <span key={c.id} style={styles.contentTypeTag}>{c.type}: {c.title}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {/* Copy button */}
                <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    style={copied ? styles.btnCopied : styles.btnCopy}
                    onClick={handleCopy}
                  >
                    {copied ? "✓ Copiado!" : "📋 Copiar cronograma para WhatsApp"}
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ── TODAY'S POSTS ── */}
      <div style={styles.dashSection}>
        <div style={styles.dashSectionHeader}>
          <span style={styles.dashSectionIcon}>🔴</span>
          <h3 style={styles.dashSectionTitle}>Postagens de hoje</h3>
          <span style={styles.dashSectionDate}>{today.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>
        {todayPosts.length === 0 ? (
          <div style={styles.dashEmpty}>Nenhuma postagem programada para hoje.</div>
        ) : (
          <div style={styles.dashPostList}>
            {todayPosts.map(c => (
              <div key={c.id} style={styles.dashPostItem}>
                <div style={styles.dashPostLeft}>
                  <span style={styles.dashPostDot(c.delivered)} />
                  <div>
                    <div style={styles.dashPostTitle}>{c.title}</div>
                    <div style={styles.dashPostMeta}>
                      <span style={styles.contentTypeTag}>{c.type}</span>
                      <span
                        style={styles.dashPostClient}
                        onClick={() => setSelectedClient(c.clientId)}
                      >{getClientName(c.clientId)}</span>
                    </div>
                  </div>
                </div>
                <div style={styles.dashPostStatus}>
                  {c.delivered ? (
                    <span style={styles.dashStatusDone}>Entregue</span>
                  ) : c.edited ? (
                    <span style={styles.dashStatusReady}>Pronto</span>
                  ) : c.recorded ? (
                    <span style={styles.dashStatusEdit}>Em edição</span>
                  ) : (
                    <span style={styles.dashStatusPending}>Pendente</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── THIS WEEK'S POSTS ── */}
      <div style={styles.dashSection}>
        <div style={styles.dashSectionHeader}>
          <span style={styles.dashSectionIcon}>📅</span>
          <h3 style={styles.dashSectionTitle}>Postagens da semana</h3>
          <span style={styles.dashSectionDate}>{weekStart.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })} — {weekEnd.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</span>
        </div>
        {weekPosts.length === 0 ? (
          <div style={styles.dashEmpty}>Nenhuma postagem programada para esta semana.</div>
        ) : (
          <div style={styles.dashPostList}>
            {weekPosts.map(c => {
              const isToday = c.postDate === todayStr;
              const isPast = c.postDate < todayStr;
              return (
                <div key={c.id} style={{
                  ...styles.dashPostItem,
                  ...(isToday ? { background: "#fffbeb", borderColor: "#fde68a" } : {}),
                  ...(isPast ? { opacity: 0.6 } : {}),
                }}>
                  <div style={styles.dashPostLeft}>
                    <div style={styles.dashWeekDay}>
                      <span style={styles.dashWeekDayLabel}>{dayLabel(c.postDate)}</span>
                      {isToday && <span style={styles.dashTodayTag}>Hoje</span>}
                    </div>
                    <div>
                      <div style={styles.dashPostTitle}>{c.title}</div>
                      <div style={styles.dashPostMeta}>
                        <span style={styles.contentTypeTag}>{c.type}</span>
                        <span
                          style={styles.dashPostClient}
                          onClick={() => setSelectedClient(c.clientId)}
                        >{getClientName(c.clientId)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={styles.dashPostStatus}>
                    {c.delivered ? (
                      <span style={styles.dashStatusDone}>Entregue</span>
                    ) : c.edited ? (
                      <span style={styles.dashStatusReady}>Pronto</span>
                    ) : c.recorded ? (
                      <span style={styles.dashStatusEdit}>Em edição</span>
                    ) : (
                      <span style={styles.dashStatusPending}>Pendente</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CLIENT SUMMARY TABLE ── */}
      <div style={styles.dashSection}>
        <div style={styles.dashSectionHeader}>
          <span style={styles.dashSectionIcon}>👥</span>
          <h3 style={styles.dashSectionTitle}>Resumo por cliente — {MONTHS[viewMonth]}</h3>
        </div>
        {clients.length === 0 ? (
          <div style={styles.dashEmpty}>Nenhum cliente cadastrado.</div>
        ) : (
          <div style={styles.dashTable}>
            <div style={styles.dashTableHead}>
              <span style={{ flex: 2 }}>Cliente</span>
              <span style={styles.dashTableCol}>Planejados</span>
              <span style={styles.dashTableCol}>Gravados</span>
              <span style={styles.dashTableCol}>Entregues</span>
            </div>
            {clients.map(cl => {
              const clContents = monthContents.filter(c => c.clientId === cl.id);
              const clGrav = clContents.filter(c => c.recorded).length;
              const clDeliv = clContents.filter(c => c.delivered).length;
              return (
                <div
                  key={cl.id}
                  style={styles.dashTableRow}
                  onClick={() => setSelectedClient(cl.id)}
                >
                  <span style={{ flex: 2, fontWeight: 600, color: "#1e293b", cursor: "pointer" }}>{cl.name}</span>
                  <span style={styles.dashTableCol}>{clContents.length}</span>
                  <span style={{ ...styles.dashTableCol, color: clGrav > 0 ? "#f97316" : "#cbd5e1" }}>{clGrav}</span>
                  <span style={{ ...styles.dashTableCol, color: clDeliv > 0 ? "#10b981" : "#cbd5e1" }}>{clDeliv}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MODAL ───
function Modal({ children, onClose }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── CLIENT FORM ───
function ClientForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [contact, setContact] = useState(initial?.contact || "");
  const [segment, setSegment] = useState(initial?.segment || "");
  const [customType, setCustomType] = useState("");

  // contentPlan: { "Reels": 8, "Carrossel": 3 } — qty per type
  const initPlan = initial?.contentPlan || {};
  // migrate old format: if contentTypes array exists but no contentPlan
  const migratedPlan = Object.keys(initPlan).length > 0
    ? initPlan
    : (initial?.contentTypes || []).reduce((acc, t) => {
        acc[t] = Math.round((initial?.qtdContents || 8) / (initial?.contentTypes?.length || 1));
        return acc;
      }, {});
  const [plan, setPlan] = useState(migratedPlan);

  const setQty = (type, val) => {
    const v = Math.max(0, Number(val) || 0);
    if (v === 0) {
      const next = { ...plan };
      delete next[type];
      setPlan(next);
    } else {
      setPlan({ ...plan, [type]: v });
    }
  };

  const addType = (type) => {
    if (type && !plan.hasOwnProperty(type)) {
      setPlan({ ...plan, [type]: 1 });
    }
  };

  const removeType = (type) => {
    const next = { ...plan };
    delete next[type];
    setPlan(next);
  };

  const totalQtd = Object.values(plan).reduce((s, v) => s + v, 0);

  return (
    <div>
      <h3 style={styles.formTitle}>{initial ? "Editar cliente" : "Novo cliente"}</h3>
      <label style={styles.formLabel}>Nome do cliente</label>
      <input style={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Restaurante Mangai" />

      <label style={styles.formLabel}>Contato / WhatsApp</label>
      <input style={styles.input} value={contact} onChange={e => setContact(e.target.value)} placeholder="(84) 99999-0000" />

      <label style={styles.formLabel}>Segmento / Nicho do cliente</label>
      <input style={styles.input} value={segment} onChange={e => setSegment(e.target.value)} placeholder="Ex: Restaurante japonês, Imobiliária de luxo, Ótica..." />

      <label style={styles.formLabel}>Conteúdos contratados por tipo</label>

      {/* Active types with qty */}
      {Object.keys(plan).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
          {Object.entries(plan).map(([type, qty]) => (
            <div key={type} style={styles.typePlanRow}>
              <span style={styles.typePlanName}>{type}</span>
              <div style={styles.typePlanControls}>
                <button style={styles.qtyBtn} onClick={() => setQty(type, qty - 1)}>−</button>
                <input
                  style={styles.qtyInput}
                  type="number"
                  value={qty}
                  onChange={e => setQty(type, e.target.value)}
                  min={0}
                />
                <button style={styles.qtyBtn} onClick={() => setQty(type, qty + 1)}>+</button>
                <button style={styles.btnMiniDanger} onClick={() => removeType(type)} title="Remover">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add type buttons */}
      <div style={{ marginTop: 10 }}>
        <div style={styles.typeGrid}>
          {CONTENT_TYPES.filter(t => !plan.hasOwnProperty(t)).map(t => (
            <button key={t} style={styles.typeTag} onClick={() => addType(t)}>+ {t}</button>
          ))}
        </div>
        {/* Custom type */}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input
            style={{ ...styles.input, flex: 1 }}
            value={customType}
            onChange={e => setCustomType(e.target.value)}
            placeholder="Outro tipo personalizado..."
            onKeyDown={e => { if (e.key === "Enter" && customType.trim()) { addType(customType.trim()); setCustomType(""); } }}
          />
          <button
            style={styles.btnSecondary}
            onClick={() => { if (customType.trim()) { addType(customType.trim()); setCustomType(""); } }}
          >Adicionar</button>
        </div>
      </div>

      {/* Total */}
      <div style={styles.planTotal}>
        Total: <strong>{totalQtd}</strong> conteúdos/mês
      </div>

      <div style={styles.formActions}>
        <button style={styles.btnCancel} onClick={onCancel}>Cancelar</button>
        <button style={styles.btnPrimary} onClick={() => name && onSave({
          ...(initial || {}),
          name,
          contact,
          segment,
          contentPlan: plan,
          contentTypes: Object.keys(plan),
          qtdContents: totalQtd,
        })}>Salvar</button>
      </div>
    </div>
  );
}

// ─── CONTENT FORM ───
function ContentForm({ initial, clientId, clientTypes, month, year, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [type, setType] = useState(initial?.type || clientTypes[0] || "Reels");
  const [desc, setDesc] = useState(initial?.description || "");
  const [refLink, setRefLink] = useState(initial?.refLink || "");
  const [postDate, setPostDate] = useState(initial?.postDate || `${year}-${String(month+1).padStart(2,"0")}-01`);
  const [recordDate, setRecordDate] = useState(initial?.recordDate || "");
  const [recorded, setRecorded] = useState(initial?.recorded || false);
  const [delivered, setDelivered] = useState(initial?.delivered || false);

  return (
    <div>
      <h3 style={styles.formTitle}>{initial ? "Editar conteúdo" : "Novo conteúdo"}</h3>

      <label style={styles.formLabel}>Título / Assunto</label>
      <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Tour pelo restaurante" />

      <label style={styles.formLabel}>Tipo de conteúdo</label>
      <select style={styles.input} value={type} onChange={e => setType(e.target.value)}>
        {clientTypes.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      <label style={styles.formLabel}>Descrição (opcional)</label>
      <textarea style={{...styles.input, height: 60, resize: "vertical"}} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Detalhes do conteúdo..." />

      <label style={styles.formLabel}>🔗 Link de referência (opcional)</label>
      <input style={styles.input} value={refLink} onChange={e => setRefLink(e.target.value)} placeholder="https://www.instagram.com/reel/exemplo..." />

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={styles.formLabel}>Data da gravação</label>
          <input style={styles.input} type="date" value={recordDate} onChange={e => setRecordDate(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={styles.formLabel}>Data da postagem</label>
          <input style={styles.input} type="date" value={postDate} onChange={e => setPostDate(e.target.value)} />
        </div>
      </div>

      {/* Status */}
      <label style={styles.formLabel}>Status do conteúdo</label>
      <div style={styles.statusRow}>
        <label style={styles.statusCheck} onClick={() => setRecorded(!recorded)}>
          <span style={recorded ? styles.checkOn : styles.checkOff}>{recorded ? "✓" : ""}</span>
          <span>Gravado</span>
        </label>
        <label style={styles.statusCheck} onClick={() => setDelivered(!delivered)}>
          <span style={delivered ? styles.checkOn : styles.checkOff}>{delivered ? "✓" : ""}</span>
          <span>Entregue</span>
        </label>
      </div>

      <div style={styles.formActions}>
// ─── STYLES — LIGHT THEME ───
const styles = {
  loadWrap: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f172a" },
  loadDot: { width: 32, height: 32, borderRadius: "50%", background: "#6366f1" },
  admin: { display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#f8fafc", color: "#1e293b" },
  sidebar: { width: 240, background: "#0f172a", color: "#e2e8f0", display: "flex", flexDirection: "column", flexShrink: 0 },
  sidebarTop: { display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 12px", borderBottom: "1px solid #1e293b" },
  logoMark: { width: 36, height: 36, borderRadius: 10, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff" },
  sidebarBrand: { fontWeight: 700, fontSize: 15, letterSpacing: -0.3 },
  sidebarSection: { padding: "16px 12px", flex: 1, overflowY: "auto" },
  sidebarLabel: { fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  sidebarItem: { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, marginBottom: 2 },
  sidebarItemActive: { background: "#1e293b" },
  sidebarAvatar: { width: 28, height: 28, borderRadius: 7, background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#94a3b8", flexShrink: 0 },
  sidebarName: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  btnAddClient: { width: "100%", padding: "10px 0", background: "transparent", border: "1px dashed #334155", color: "#94a3b8", borderRadius: 8, cursor: "pointer", fontSize: 13, marginTop: 8 },
  main: { flex: 1, overflowY: "auto", padding: "24px 32px" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" },
  clientHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 16, flexWrap: "wrap" },
  clientName: { margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" },
  clientMeta: { fontSize: 13, color: "#64748b", marginTop: 2 },
  clientActions: { display: "flex", gap: 8, flexWrap: "wrap" },
  monthNav: { display: "flex", alignItems: "center", gap: 16, justifyContent: "center", margin: "16px 0" },
  monthBtn: { background: "none", border: "1px solid #e2e8f0", borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 18, color: "#475569", display: "flex", alignItems: "center", justifyContent: "center" },
  monthLabel: { fontSize: 17, fontWeight: 600, color: "#0f172a", minWidth: 160, textAlign: "center" },
  legend: { display: "flex", gap: 16, justifyContent: "center", marginBottom: 12, flexWrap: "wrap" },
  legendItem: { display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" },
  legendDot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, background: "#e2e8f0", borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" },
  calDayHeader: { background: "#f1f5f9", padding: "8px 0", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#64748b" },
  calCellEmpty: { background: "#f8fafc", minHeight: 72 },
  calCell: { background: "#fff", minHeight: 72, padding: 6, position: "relative", display: "flex", flexDirection: "column", gap: 2, fontSize: 11 },
  calCellRec: { background: "#f97316" },
  calCellVideo: { background: "#7c3aed" },
  calCellImage: { background: "#eab308" },
  calCellToday: { boxShadow: "inset 0 0 0 2px #0f172a" },
  calCellDay: { fontWeight: 600, fontSize: 13, color: "#334155" },
  recBadge: { fontSize: 10, background: "rgba(255,255,255,0.3)", borderRadius: 4, padding: "1px 4px", color: "#fff" },
  recBadgeSmall: { fontSize: 10 },
  contentBadge: { fontSize: 10, background: "#eef2ff", color: "#4338ca", borderRadius: 4, padding: "2px 5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  contentBadgeSmall: { fontSize: 9, background: "rgba(255,255,255,0.3)", color: "#fff", borderRadius: 3, padding: "1px 3px", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  adminGrid: { display: "flex", gap: 24, marginTop: 8, flexWrap: "wrap" },
  adminCalWrap: { flex: 2, minWidth: 380 },
  adminListPanel: { flex: 1, minWidth: 260, background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 16 },
  sectionTitle: { margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#0f172a" },
  adminCounter: { fontSize: 12, color: "#6366f1", fontWeight: 600 },
  adminContentItem: { background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: "1px solid #f1f5f9" },
  contentTypeTag: { fontSize: 10, fontWeight: 700, color: "#6366f1", background: "#eef2ff", borderRadius: 4, padding: "2px 6px", marginRight: 8 },
  adminContentTitle: { fontSize: 13, fontWeight: 600, color: "#1e293b" },
  adminContentMeta: { display: "flex", gap: 12, marginTop: 4, fontSize: 11, color: "#94a3b8", flexWrap: "wrap" },
  btnPrimary: { padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnSecondary: { padding: "8px 14px", background: "#f1f5f9", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  btnDanger: { padding: "8px 14px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  btnPortalPreview: { padding: "8px 14px", background: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  btnRec: { padding: "6px 12px", background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 },
  btnRecActive: { padding: "6px 12px", background: "#f97316", color: "#fff", border: "1px solid #f97316", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 },
  btnMini: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#94a3b8", padding: 2 },
  btnMiniDanger: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#f87171", padding: 2 },
  btnCancel: { padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  btnBack: { padding: "10px 20px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, marginTop: 16 },
  btnBackPortal: { padding: "6px 16px", background: "rgba(255,255,255,0.15)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  portal: { minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#f8fafc", color: "#1e293b" },
  portalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", background: "#0f172a", color: "#e2e8f0", flexWrap: "wrap", gap: 12 },
  portalBrand: { display: "flex", alignItems: "center", gap: 10 },
  portalTitle: { fontWeight: 700, fontSize: 16, lineHeight: 1.2 },
  portalSub: { fontSize: 11, color: "#94a3b8" },
  portalClientName: { fontSize: 15, fontWeight: 600, color: "#c7d2fe" },
  portalBody: { maxWidth: 860, margin: "0 auto", padding: "24px 20px" },
  portalEmpty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh" },
  portalSection: { marginTop: 32 },
  portalH3: { margin: "0 0 12px", fontSize: 17, fontWeight: 700, color: "#0f172a" },
  contentList: { display: "flex", flexDirection: "column", gap: 10 },
  contentCard: { background: "#fff", borderRadius: 10, padding: "14px 18px", border: "1px solid #e2e8f0" },
  contentCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  contentType: { fontSize: 11, fontWeight: 700, color: "#6366f1", background: "#eef2ff", borderRadius: 5, padding: "3px 8px" },
  contentPostDate: { fontSize: 12, color: "#94a3b8" },
  contentTitle: { fontSize: 15, fontWeight: 600, color: "#0f172a" },
  contentDesc: { fontSize: 13, color: "#64748b", marginTop: 4 },
  contentRecDate: { fontSize: 12, color: "#c2410c", marginTop: 6 },
  summaryRow: { display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" },
  summaryCard: { flex: 1, minWidth: 120, background: "#fff", borderRadius: 10, padding: 20, textAlign: "center", border: "1px solid #e2e8f0" },
  summaryNum: { fontSize: 32, fontWeight: 800, color: "#6366f1" },
  summaryLabel: { fontSize: 13, color: "#64748b", marginTop: 4 },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#fff", borderRadius: 16, padding: "28px 32px", width: "90%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 48px rgba(0,0,0,0.2)" },
  formTitle: { margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: "#0f172a" },
  formLabel: { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginTop: 14, marginBottom: 4 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, color: "#1e293b", outline: "none", boxSizing: "border-box", background: "#f8fafc" },
  typeGrid: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 },
  typeTag: { padding: "6px 12px", borderRadius: 20, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontSize: 12, cursor: "pointer" },
  typeTagActive: { padding: "6px 12px", borderRadius: 20, border: "1px solid #6366f1", background: "#eef2ff", color: "#4338ca", fontSize: 12, cursor: "pointer", fontWeight: 600 },
  formActions: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 },
  portalTypeCard: { flex: "1 1 120px", background: "#fff", borderRadius: 10, padding: "14px 18px", border: "1px solid #e2e8f0", textAlign: "center" },
  portalTypeLabel: { fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 },
  portalTypeNums: { display: "flex", alignItems: "baseline", justifyContent: "center" },
  portalBlock: { background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: 16 },
  portalBlockHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 },
  portalBlockIcon: { fontSize: 20 },
  portalBlockTitle: { margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a", flex: 1 },
  portalBlockCount: { fontSize: 13, fontWeight: 700, color: "#6366f1", background: "#eef2ff", borderRadius: 20, padding: "4px 12px" },
  portalEmptyText: { color: "#94a3b8", fontSize: 14, margin: "4px 0" },
  recDaysList: { display: "flex", gap: 10, flexWrap: "wrap" },
  recDayCard: { background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "12px 16px", minWidth: 140, flex: "1 1 140px" },
  recDayDate: { display: "flex", alignItems: "baseline", gap: 6 },
  recDayNum: { fontSize: 28, fontWeight: 800, color: "#c2410c", lineHeight: 1 },
  recDayName: { fontSize: 13, color: "#9a3412", fontWeight: 500 },
  recDayContents: { marginTop: 8, display: "flex", flexDirection: "column", gap: 3 },
  recDayContentTag: { fontSize: 11, color: "#9a3412", background: "rgba(249,115,22,0.1)", borderRadius: 4, padding: "2px 6px" },
  recDayDetails: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 6, fontSize: 11, color: "#9a3412" },
  calCellConflict: { background: "#fef2f2", border: "1px dashed #fca5a5" },
  conflictBanner: { background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: "#dc2626", fontSize: 13 },
  refLink: { display: "inline-block", fontSize: 12, color: "#4338ca", background: "#eef2ff", borderRadius: 4, padding: "4px 10px", marginTop: 6, textDecoration: "none", fontWeight: 600 },
  refLinkSmall: { fontSize: 11, color: "#4338ca", textDecoration: "none", fontWeight: 600, flexShrink: 0 },
  portalContentList: { display: "flex", flexDirection: "column", gap: 0 },
  portalContentRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9" },
  portalContentDot: () => ({ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", flexShrink: 0 }),
  portalContentTitle: { fontSize: 14, fontWeight: 500, color: "#1e293b", flex: 1 },
  portalContentTypeTag: { fontSize: 11, color: "#6366f1", background: "#eef2ff", borderRadius: 4, padding: "2px 8px", fontWeight: 600, flexShrink: 0 },
  portalContentDate: { fontSize: 12, color: "#94a3b8", flexShrink: 0 },
  portalTypeSummary: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" },
  portalTypePill: { display: "flex", alignItems: "center", gap: 6, background: "#f8fafc", borderRadius: 20, padding: "5px 12px", border: "1px solid #e2e8f0" },
  portalTypePillLabel: { fontSize: 12, color: "#64748b" },
  portalTypePillCount: { fontSize: 12, fontWeight: 800 },
  calCellSelected: { boxShadow: "inset 0 0 0 2px #6366f1", background: "#eef2ff" },
  calDots: { display: "flex", gap: 3, marginTop: 2, flexWrap: "wrap" },
  calContentDot: { width: 6, height: 6, borderRadius: "50%", background: "#6366f1" },
  dayDetail: { marginTop: 14, background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 22px" },
  dayDetailHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  dayDetailDate: { fontSize: 18, fontWeight: 700, color: "#0f172a", marginRight: 8 },
  dayDetailWeekday: { fontSize: 14, color: "#64748b" },
  dayDetailClose: { background: "none", border: "none", fontSize: 18, color: "#94a3b8", cursor: "pointer", padding: "4px 8px" },
  dayDetailRecBanner: { background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontWeight: 600, color: "#c2410c", marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 },
  dayDetailRecSub: { fontSize: 12, fontWeight: 400, color: "#9a3412" },
  dayDetailContents: { display: "flex", flexDirection: "column", gap: 10 },
  dayDetailCard: { background: "#fff", borderRadius: 10, padding: "14px 16px", border: "1px solid #e2e8f0" },
  dayDetailCardHeader: { marginBottom: 6 },
  dayDetailCardTitle: { fontSize: 16, fontWeight: 600, color: "#0f172a", marginBottom: 4 },
  dayDetailCardDesc: { fontSize: 13, color: "#64748b", lineHeight: 1.5 },
  dayDetailCardRec: { fontSize: 12, color: "#c2410c", marginTop: 8 },
  statusRow: { display: "flex", gap: 12, marginTop: 6 },
  statusCheck: { display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#475569", userSelect: "none" },
  checkOn: { width: 22, height: 22, borderRadius: 6, background: "#6366f1", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 },
  checkOff: { width: 22, height: 22, borderRadius: 6, border: "2px solid #cbd5e1", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  btnPDF: { padding: "5px 10px", background: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
  btnAI: { padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" },
  aiClientInfo: { background: "#f8fafc", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#1e293b", marginBottom: 14, border: "1px solid #e2e8f0" },
  aiError: { background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginTop: 10 },
  aiResultList: { display: "flex", flexDirection: "column", gap: 6, maxHeight: 340, overflowY: "auto" },
  aiResultItem: { display: "flex", gap: 10, padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer", background: "#fff" },
  aiResultSelected: { background: "#eef2ff", borderColor: "#c7d2fe" },
  aiResultCheck: { flexShrink: 0, paddingTop: 2 },
  formatTagVid: { fontSize: 10, fontWeight: 700, color: "#7c3aed", background: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: 4, padding: "2px 7px" },
  formatTagImg: { fontSize: 10, fontWeight: 700, color: "#a16207", background: "#fefce8", border: "1px solid #fde68a", borderRadius: 4, padding: "2px 7px" },
  formatBadgeVid: { fontSize: 11, fontWeight: 600, color: "#7c3aed", background: "#f5f3ff", borderRadius: 12, padding: "3px 8px" },
  formatBadgeImg: { fontSize: 11, fontWeight: 600, color: "#a16207", background: "#fefce8", borderRadius: 12, padding: "3px 8px" },
  scheduleItem: { background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1px solid #e2e8f0" },
  tabBar: { display: "flex", gap: 4, marginBottom: 16, borderBottom: "2px solid #e2e8f0", paddingBottom: 0 },
  tab: { padding: "10px 16px", background: "none", border: "none", borderBottom: "2px solid transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#64748b", marginBottom: -2, display: "flex", alignItems: "center", gap: 6 },
  tabActive: { padding: "10px 16px", background: "none", border: "none", borderBottom: "2px solid #6366f1", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#6366f1", marginBottom: -2, display: "flex", alignItems: "center", gap: 6 },
  tabBadge: { fontSize: 10, fontWeight: 700, color: "#f59e0b", background: "#fffbeb", borderRadius: 10, padding: "1px 6px" },
  tabBadgeDone: { fontSize: 10, fontWeight: 700, color: "#10b981", background: "#ecfdf5", borderRadius: 10, padding: "1px 6px" },
  briefProgress: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 22px", marginBottom: 14 },
  briefProgressInfo: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  briefProgressBar: { height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" },
  briefProgressFill: { height: "100%", borderRadius: 3, transition: "width 0.3s" },
  briefSection: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 8, overflow: "hidden" },
  briefSectionHeader: { display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", cursor: "pointer", userSelect: "none" },
  briefSectionTitle: { flex: 1, fontSize: 15, fontWeight: 700, color: "#0f172a" },
  briefSectionCount: { fontSize: 12, fontWeight: 600, color: "#94a3b8", background: "#f1f5f9", borderRadius: 10, padding: "2px 8px" },
  briefSectionBody: { padding: "0 18px 18px" },
  dashMetrics: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 },
  dashCard: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 6 },
  dashCardIcon: { fontSize: 22 },
  dashCardNum: { fontSize: 32, fontWeight: 800, color: "#0f172a", lineHeight: 1 },
  dashCardLabel: { fontSize: 13, color: "#64748b" },
  dashCardBar: { height: 4, background: "#f1f5f9", borderRadius: 2, marginTop: 4, overflow: "hidden" },
  dashCardBarFill: { height: "100%", borderRadius: 2, transition: "width 0.3s" },
  dashCardSub: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  dashSection: { background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 22px", marginBottom: 16 },
  dashSectionHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  dashSectionIcon: { fontSize: 18 },
  dashSectionTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a", flex: 1 },
  dashSectionDate: { fontSize: 12, color: "#94a3b8", fontWeight: 500 },
  dashEmpty: { padding: "16px 0", fontSize: 13, color: "#94a3b8", textAlign: "center" },
  dashPostList: { display: "flex", flexDirection: "column", gap: 6 },
  dashPostItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, border: "1px solid #f1f5f9", background: "#f8fafc", gap: 12, flexWrap: "wrap" },
  dashPostLeft: { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  dashPostDot: (delivered) => ({ width: 10, height: 10, borderRadius: "50%", background: delivered ? "#10b981" : "#f59e0b", flexShrink: 0 }),
  dashPostTitle: { fontSize: 14, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  dashPostMeta: { display: "flex", gap: 6, alignItems: "center", marginTop: 2 },
  dashPostClient: { fontSize: 12, color: "#6366f1", cursor: "pointer", fontWeight: 500 },
  dashPostStatus: { flexShrink: 0 },
  dashStatusDone: { fontSize: 11, fontWeight: 700, color: "#10b981", background: "#ecfdf5", borderRadius: 20, padding: "3px 10px" },
  dashStatusReady: { fontSize: 11, fontWeight: 700, color: "#6366f1", background: "#eef2ff", borderRadius: 20, padding: "3px 10px" },
  dashStatusEdit: { fontSize: 11, fontWeight: 700, color: "#8b5cf6", background: "#f5f3ff", borderRadius: 20, padding: "3px 10px" },
  dashStatusPending: { fontSize: 11, fontWeight: 700, color: "#f59e0b", background: "#fffbeb", borderRadius: 20, padding: "3px 10px" },
  dashWeekDay: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: 52, flexShrink: 0 },
  dashWeekDayLabel: { fontSize: 11, color: "#64748b", fontWeight: 600 },
  dashTodayTag: { fontSize: 9, fontWeight: 800, color: "#dc2626", background: "#fef2f2", borderRadius: 4, padding: "1px 5px", marginTop: 2 },
  dashTable: { borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" },
  dashTableHead: { display: "flex", padding: "10px 14px", background: "#f1f5f9", fontSize: 11, fontWeight: 700, color: "#64748b", gap: 4 },
  dashTableRow: { display: "flex", padding: "10px 14px", borderTop: "1px solid #f1f5f9", fontSize: 13, alignItems: "center", gap: 4, cursor: "pointer" },
  dashTableCol: { flex: 1, textAlign: "center", fontWeight: 700, fontSize: 13 },
  btnCopy: { padding: "8px 16px", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 },
  btnCopied: { padding: "8px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 },
  btnShare: { padding: "8px 14px", background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  typePlanRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", borderRadius: 8, padding: "8px 12px", border: "1px solid #e2e8f0" },
  typePlanName: { fontSize: 14, fontWeight: 600, color: "#1e293b" },
  typePlanControls: { display: "flex", alignItems: "center", gap: 4 },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" },
  qtyInput: { width: 44, textAlign: "center", padding: "4px 2px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 14, fontWeight: 700, color: "#6366f1", background: "#fff" },
  planTotal: { marginTop: 14, padding: "10px 14px", background: "#eef2ff", borderRadius: 8, fontSize: 14, color: "#4338ca", textAlign: "center" },
  typeBreakdown: { marginTop: 8, display: "flex", flexDirection: "column", gap: 3 },
  typeBreakdownRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "3px 0" },
  typeBreakdownLabel: { color: "#64748b" },
  typeBreakdownCount: { fontWeight: 700, fontSize: 12 },
};
