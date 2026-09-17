/**
 * AuraBot Core — Interactive Client Logic
 * Handles WhatsApp Simulator, ROI Calculator, Accordion and Modal states.
 */

// ==========================================================================
// 1. Industry Demo Data for WhatsApp Simulator
// ==========================================================================
const industryProfiles = {
  inmobiliaria: {
    name: "Baires Urbana Propiedades",
    avatar: "BU",
    initialMessages: [
      {
        sender: "bot",
        text: "¡Hola! 👋 Te saluda Martina de **Baires Urbana Propiedades** (Matrícula CUCICBA Nº 6842) 🏢✨\n\n¿Estás buscando alquilar, comprar o querés tasar una propiedad en CABA / Zona Norte?",
        time: "10:30"
      }
    ],
    quickReplies: [
      "¿Qué requisitos piden para alquilar un 2 ambientes?",
      "Busco departamento en Palermo hasta $450.000",
      "Quiero tasar un departamento para vender"
    ],
    responses: {
      "¿qué requisitos piden para alquilar un 2 ambientes?": 
        "Para un **alquiler tradicional**, los requisitos principales son:\n\n1️⃣ **Demostración de ingresos:** Recibos de sueldo o monotributo que tripliquen el valor mensual.\n2️⃣ **Garantía:** Propietaria de CABA o seguro de caución (*Finaer, Respaldar, Garantía Ya*).\n3️⃣ **1 mes de adelanto y 1 mes de depósito** en garantía.\n\n¿Buscás en alguna zona puntual (Palermo, Belgrano, Caballito) para enviarte opciones disponibles? 🔑",
      
      "busco departamento en palermo hasta $450.000":
        "¡Excelente! En Palermo tenemos 2 opciones en ese rango:\n\n📍 **Palermo Soho (Honduras y Scalabrini Ortiz):** 2 amb, 42m², balcón al frente, $420.000 + expensas bajas.\n📍 **Palermo Hollywood (Humboldt y Costa Rica):** 2 amb con amenities y pileta, $450.000.\n\n¿Te gustaría coordinar una visita presencial con nuestro asesor de la zona? 🏢",
      
      "quiero tasar un departamento para vender":
        "¡Con mucho gusto! Realizamos **tasaciones profesionales sin cargo** 📍.\n\nPor favor, contame:\n1. Dirección aproximada o barrio.\n2. Cantidad de ambientes y metros cuadrados estimados.\n3. Tu nombre completo para coordinar la visita de nuestro martillero matriculado 🤝"
    },
    defaultFallback: 
      "¡Perfecto! Tomo nota de tu consulta. En Baires Urbana te asesoramos de forma personalizada. ¿Buscás alquiler tradicional, temporario o compra?"
  },

  salud: {
    name: "DentalCare Consultorio (Google Calendar)",
    avatar: "DC",
    initialMessages: [
      {
        sender: "bot",
        text: "¡Hola! 👋 Te saluda Camila de **DentalCare Odontología Especializada** 🦷✨\n\n¿En qué podemos ayudarte hoy? (Limpieza dental, blanqueamiento, ortodoncia o urgencias)",
        time: "11:15"
      }
    ],
    quickReplies: [
      "Quiero un turno para limpieza dental este viernes",
      "¿Qué horarios tienen disponibles mañana?",
      "¿Qué precio tiene el blanqueamiento led?"
    ],
    responses: {
      "quiero un turno para limpieza dental este viernes":
        "*(Consultando Google Calendar en tiempo real... 📅)*\n\n¡Sí! Para este **viernes** tenemos los siguientes turnos libres para Limpieza Dental:\n\n🕙 **10:00 hs**\n🕦 **11:30 hs**\n🕒 **15:00 hs**\n🕟 **16:30 hs**\n\n¿Cuál te queda más cómodo para reservarte en la agenda?",

      "¿qué horarios tienen disponibles mañana?":
        "*(Google Calendar sync activo ⚡)*\n\nPara **mañana** tenemos turnos disponibles en estos horarios:\n\n🕘 **09:30 hs** con la Dra. Méndez\n🕑 **14:00 hs** con el Dr. Rossi\n🕔 **17:15 hs**\n\n¿A nombre de quién agendamos la cita?",

      "¿qué precio tiene el blanqueamiento led?":
        "El tratamiento de **Blanqueamiento Dental LED** en consultorio incluye sesión de 45 min + pulido previo por **$45.000 ARS** (hasta 3 cuotas sin interés 💳 o 15% OFF en efectivo/transferencia).\n\n¿Te gustaría agendar una consulta de evaluación sin cargo?"
    },
    defaultFallback:
      "Entendido. Nuestro sistema sincronizado con Google Calendar puede agendar tu turno al instante. ¿Qué día y horario preferís?"
  },

  barberia: {
    name: "The Barber Club & Salón",
    avatar: "BC",
    initialMessages: [
      {
        sender: "bot",
        text: "¡Buenas! 💈 Te habla el bot de **The Barber Club**. ¿Buscás turno para corte, barba, perfilado o combo completo?",
        time: "15:00"
      }
    ],
    quickReplies: [
      "¿Tenés turno para corte y barba hoy a la tarde?",
      "¿Cuáles son los precios de los servicios?",
      "¿Dónde queda la sucursal y qué horarios tienen?"
    ],
    responses: {
      "¿tenés turno para corte y barba hoy a la tarde?":
        "¡De una! 🔥 Para hoy a la tarde tenemos estos turnos disponibles con los barberos del equipo:\n\n💈 **17:00 hs** (con Nico)\n💈 **18:30 hs** (con Franco)\n💈 **19:15 hs** (con Matías)\n\n¿Cuál te reservo? Pasame tu nombre y ya te lo guardo.",

      "¿cuáles son los precios de los servicios?":
        "Nuestros precios vigentes:\n\n✂️ **Corte clásico / fade:** $12.000\n🧔 **Arreglo de barba con toalla caliente:** $8.000\n🔥 **Combo Corte + Barba:** $17.000 (Incluye café o cerveza de cortesía 🍺)\n\n¿Agendamos un turno?",

      "¿dónde queda la sucursal y qué horarios tienen?":
        "📍 Estamos en **Gorriti 4920, Palermo Soho**.\n⏰ Horarios: Martes a Sábados de 11:00 a 20:30 hs.\n\n¿Querés reservar para hoy o para el fin de semana?"
    },
    defaultFallback:
      "¡Dale! Decime qué servicio necesitás y qué día te viene mejor para chequear la disponibilidad de los barberos."
  },

  ecommerce: {
    name: "Urban Sneakers Oficial",
    avatar: "US",
    initialMessages: [
      {
        sender: "bot",
        text: "¡Hola! 👟🔥 Te habla UrbanBot de **Urban Sneakers**. ¿Tenés alguna duda con talles, envíos, métodos de pago o seguimiento de tu compra?",
        time: "16:45"
      }
    ],
    quickReplies: [
      "¿Tienen cuotas sin interés y envíos gratis?",
      "¿Cómo es la política de cambios?",
      "Quiero saber el estado de mi pedido #ORD-842"
    ],
    responses: {
      "¿tienen cuotas sin interés y envíos gratis?":
        "¡Sí, claro! 💳 Tenemos **3 y 6 cuotas sin interés** con todas las tarjetas (o 15% OFF por transferencia bancaria 🔥).\n\n📦 **Envíos:** Envíos **GRATIS** a todo el país en compras superiores a $80.000. Entregas en el día en AMBA comprando antes de las 13 hs 🚀\n\n¿Buscás algún modelo en particular?",

      "¿cómo es la política de cambios?":
        "¡Súper fácil! Tenés **30 días corridos** desde que recibís el calzado para realizar cambios. El producto debe estar sin uso y en su caja original.\n\n✨ **El primer cambio es 100% GRATIS** (retiramos y entregamos en tu domicilio).",

      "quiero saber el estado de mi pedido #ord-842":
        "*(Consultando sistema de logística... 🔍)*\n\nTu pedido **#ORD-842** (Zapatillas Nike Air Max 90 Talle 42) está **En Camino** vía Andreani con código de seguimiento `AR-94827104` 🚚.\n\n📅 Fecha estimada de entrega: **Mañana antes de las 18:00 hs**."
    },
    defaultFallback:
      "¡Genial! En Urban Sneakers te ayudamos a encontrar el calzado ideal o resolver cualquier duda de tu compra. ¿Qué modelo o talle buscabas?"
  }
};

let currentIndustry = "inmobiliaria";

// ==========================================================================
// 2. Simulator Controller
// ==========================================================================
function initSimulator() {
  const pills = document.querySelectorAll(".pill-btn");
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentIndustry = pill.getAttribute("data-industry");
      loadIndustryChat(currentIndustry);
    });
  });

  const form = document.getElementById("waInputForm");
  const input = document.getElementById("waCustomInput");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendUserMessage(text);
  });

  loadIndustryChat(currentIndustry);
}

function loadIndustryChat(industryKey) {
  const profile = industryProfiles[industryKey];
  if (!profile) return;

  // Header update
  document.getElementById("waName").textContent = profile.name;
  document.getElementById("waAvatarText").textContent = profile.avatar;

  // Body update
  const chatBody = document.getElementById("waChatBody");
  chatBody.innerHTML = `<div class="wa-date-chip">Hoy</div>`;

  profile.initialMessages.forEach((msg) => {
    appendMessage(msg.sender, msg.text, msg.time);
  });

  // Quick replies
  renderQuickReplies(profile.quickReplies);
}

function renderQuickReplies(replies) {
  const container = document.getElementById("waQuickReplies");
  container.innerHTML = "";

  replies.forEach((text) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "quick-reply-pill";
    pill.textContent = text;
    pill.addEventListener("click", () => {
      sendUserMessage(text);
    });
    container.appendChild(pill);
  });
}

function sendUserMessage(text) {
  const now = new Date();
  const timeStr = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
  appendMessage("user", text, timeStr);

  // Trigger Typing animation
  const typingIndicator = document.getElementById("waTyping");
  const chatBody = document.getElementById("waChatBody");
  
  typingIndicator.style.display = "flex";
  chatBody.scrollTop = chatBody.scrollHeight;

  // Simulated AI response delay (between 700ms and 1400ms)
  const delay = Math.floor(Math.random() * 600) + 800;

  setTimeout(() => {
    typingIndicator.style.display = "none";
    const replyText = findBestResponse(text, currentIndustry);
    const replyTime = new Date().getHours().toString().padStart(2, "0") + ":" + new Date().getMinutes().toString().padStart(2, "0");
    appendMessage("bot", replyText, replyTime);
  }, delay);
}

function findBestResponse(userText, industryKey) {
  const profile = industryProfiles[industryKey];
  const cleanUserText = userText.toLowerCase().trim();

  // Exact or partial match in responses dict
  for (const [question, answer] of Object.entries(profile.responses)) {
    if (cleanUserText.includes(question) || question.includes(cleanUserText)) {
      return answer;
    }
  }

  // Fallback intelligent response
  return profile.defaultFallback;
}

function appendMessage(sender, text, time) {
  const chatBody = document.getElementById("waChatBody");
  const msgDiv = document.createElement("div");
  msgDiv.className = `wa-message ${sender === "user" ? "outgoing" : "incoming"}`;

  // Parse markdown bold and newlines
  const formattedText = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");

  const ticks = sender === "user" ? `<span class="wa-ticks">✓✓</span>` : "";

  msgDiv.innerHTML = `
    <div class="wa-text">${formattedText}</div>
    <div class="wa-meta">
      <span>${time}</span>
      ${ticks}
    </div>
  `;

  chatBody.appendChild(msgDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// ==========================================================================
// 3. Interactive ROI Calculator
// ==========================================================================
function initRoiCalculator() {
  const chatsSlider = document.getElementById("chatsSlider");
  const ticketSlider = document.getElementById("ticketSlider");
  const hoursPerChat = document.getElementById("hoursPerChat");

  const chatsDisplay = document.getElementById("chatsDisplay");
  const ticketDisplay = document.getElementById("ticketDisplay");
  const minutesDisplay = document.getElementById("minutesDisplay");

  const hoursSaved = document.getElementById("hoursSaved");
  const revenueGain = document.getElementById("revenueGain");

  function recalculate() {
    const chats = parseInt(chatsSlider.value, 10);
    const ticket = parseInt(ticketSlider.value, 10);
    const minutes = parseInt(hoursPerChat.value, 10);

    // Displays
    chatsDisplay.textContent = `${chats.toLocaleString("es-AR")} consultas`;
    ticketDisplay.textContent = `$ ${ticket.toLocaleString("es-AR")}`;
    minutesDisplay.textContent = `${minutes} minutos`;

    // Calculations
    const totalMinutes = chats * minutes;
    const hours = Math.round(totalMinutes / 60);
    hoursSaved.textContent = `${hours} hs / mes`;

    // Conservative 3.5% conversion increase on missed leads
    const recoveredSales = Math.round(chats * 0.035);
    const recoveredMoney = recoveredSales * ticket;
    revenueGain.textContent = `$ ${recoveredMoney.toLocaleString("es-AR")} / mes`;
  }

  chatsSlider.addEventListener("input", recalculate);
  ticketSlider.addEventListener("input", recalculate);
  hoursPerChat.addEventListener("input", recalculate);

  recalculate();
}

// ==========================================================================
// 4. FAQ Accordion
// ==========================================================================
function initFaqAccordion() {
  const items = document.querySelectorAll(".faq-item");

  items.forEach((item) => {
    const questionBtn = item.querySelector(".faq-question");
    questionBtn.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      // Close all other items
      items.forEach((other) => {
        other.classList.remove("active");
        other.querySelector(".faq-answer").style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add("active");
        const answer = item.querySelector(".faq-answer");
        answer.style.maxHeight = answer.scrollHeight + 30 + "px";
      }
    });
  });
}

// ==========================================================================
// 5. Contact / Lead Modal
// ==========================================================================
window.openContactModal = function(source = "General") {
  const modal = document.getElementById("contactModal");
  const sourceInput = document.getElementById("leadSource");
  if (sourceInput) sourceInput.value = source;
  modal.classList.add("active");
};

window.closeContactModal = function() {
  const modal = document.getElementById("contactModal");
  modal.classList.remove("active");
  const form = document.getElementById("leadForm");
  const success = document.getElementById("modalSuccess");
  if (form) form.style.display = "flex";
  if (success) success.style.display = "none";
};

window.handleLeadSubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById("leadName").value;
  const phone = document.getElementById("leadPhone").value;
  const industry = document.getElementById("leadIndustry").value;

  console.log("[Lead Captured]:", { name, phone, industry, timestamp: new Date().toISOString() });

  document.getElementById("leadForm").style.display = "none";
  document.getElementById("modalSuccess").style.display = "block";
};

// ==========================================================================
// 6. Mobile Navigation Toggle
// ==========================================================================
function initMobileNav() {
  const toggle = document.getElementById("mobileToggle");
  const nav = document.getElementById("mainNav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("mobile-active");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("mobile-active");
      });
    });
  }
}

// ==========================================================================
// Initialization on DOM Ready
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initSimulator();
  initRoiCalculator();
  initFaqAccordion();
  initMobileNav();
});
