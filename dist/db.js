// =========================================================================
// Hybrid Database Engine: Supabase Cloud + LocalStorage Fallback Cache
// =========================================================================

const DB_KEYS = {
  APPOINTMENTS: 'sba_appointments',
  PORTFOLIO: 'sba_portfolio',
  SERVICES: 'sba_services',
  TESTIMONIALS: 'sba_testimonials',
  SETTINGS: 'sba_settings',
  BLOCKED_DATES: 'sba_blocked_dates',
  AUTH: 'sba_auth_session',
  SUPABASE_CONFIG: 'sba_supabase_config'
};

const DEFAULT_SETTINGS = {
  siteTitle: "Sayali Banode Makeup Artist",
  artistName: "Sayali Banode",
  phone: "+91 7030477747",
  whatsapp: "917030477747",
  email: "sayali@example.com",
  notificationEmails: ["sayali@example.com"],
  location: "Amravati, Maharashtra",
  instagram: "https://instagram.com/sayalibanodemakeup",
  facebook: "https://facebook.com",
  adminPassword: "admin",
  experienceYears: "5+",
  happyBrides: "500+"
};

const DEFAULT_SERVICES = [
  { id: "s1", title: "Bridal Makeup", description: "Stunning, long-lasting bridal looks that make your special day unforgettable.", icon: "👰" },
  { id: "s2", title: "Engagement Makeup", description: "Elegant and sophisticated looks for your engagement ceremony.", icon: "💍" },
  { id: "s3", title: "Reception Makeup", description: "Glamorous makeup that photographs beautifully for your reception.", icon: "✨" },
  { id: "s4", title: "Party Makeup", description: "Bold and beautiful looks for parties and special occasions.", icon: "🎉" },
  { id: "s5", title: "HD Makeup", description: "Camera-ready, flawless makeup perfect for photography and videography.", icon: "📸" },
  { id: "s6", title: "Airbrush Makeup", description: "Lightweight, flawless finish that lasts all day and night.", icon: "🎨" },
  { id: "s7", title: "Editorial Makeup", description: "Creative, artistic looks for fashion shoots and editorials.", icon: "📷" },
  { id: "s8", title: "Fashion Shoot", description: "High-fashion makeup for professional modeling and shoots.", icon: "👗" },
  { id: "s9", title: "Hair Styling", description: "Professional hair styling to complete your perfect look.", icon: "💇" }
];

const DEFAULT_PORTFOLIO = [
  { id: "p1", url: "https://images.unsplash.com/photo-1684868265714-fd2300637c23", category: "bridal", title: "Bridal Elegance" },
  { id: "p2", url: "https://images.unsplash.com/photo-1684868268327-7e5590bcfbd6", category: "bridal", title: "Traditional Bridal" },
  { id: "p3", url: "https://images.pexels.com/photos/30809480/pexels-photo-30809480.jpeg", category: "bridal", title: "Classic Bridal" },
  { id: "p4", url: "https://images.pexels.com/photos/34955448/pexels-photo-34955448.jpeg", category: "reception", title: "Reception Glam" },
  { id: "p5", url: "https://images.pexels.com/photos/5394050/pexels-photo-5394050.jpeg", category: "party", title: "Party Glam" },
  { id: "p6", url: "https://images.unsplash.com/photo-1548112129-b5cf67e9558d", category: "editorial", title: "Editorial Beauty" },
  { id: "p7", url: "https://images.pexels.com/photos/31845455/pexels-photo-31845455.jpeg", category: "editorial", title: "Fashion Editorial" },
  { id: "p8", url: "https://images.pexels.com/photos/5149734/pexels-photo-5149734.jpeg", category: "glam", title: "Glamorous Look" }
];

const DEFAULT_TESTIMONIALS = [];

const DEFAULT_APPOINTMENTS = [];

let supabaseClient = null;

function getSupabaseConfig() {
  let url = (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.SUPABASE_URL) || '';
  let key = (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.SUPABASE_ANON_KEY) || '';

  if (!url || !key) {
    try {
      const cached = JSON.parse(localStorage.getItem('sba_env_config') || '{}');
      if (cached.supabaseUrl && cached.supabaseAnonKey) {
        url = cached.supabaseUrl;
        key = cached.supabaseAnonKey;
      }
    } catch(e) {}
  }
  return { url: (url || '').trim(), key: (key || '').trim() };
}

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const cfg = getSupabaseConfig();
  if (cfg.url && cfg.key && typeof window !== 'undefined' && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(cfg.url, cfg.key);
    } catch (e) {
      console.warn("Supabase init error:", e);
    }
  }
  return supabaseClient;
}

// Storage API with Supabase Sync
const StorageDB = {
  get(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error("Storage write error:", e);
    }
  },
  init() {
    if (!localStorage.getItem(DB_KEYS.SETTINGS)) this.set(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
    if (!localStorage.getItem(DB_KEYS.SERVICES)) {
      this.set(DB_KEYS.SERVICES, DEFAULT_SERVICES);
    } else {
      const current = this.get(DB_KEYS.SERVICES, []);
      if (current.some(s => s.price)) {
        current.forEach(s => delete s.price);
        this.set(DB_KEYS.SERVICES, current);
      }
    }
    // Settings
    let settings = this.get(DB_KEYS.SETTINGS, null);
    if (!settings) {
      this.set(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
    } else {
      let modified = false;
      if (settings.location === "Mumbai, Maharashtra" || !settings.location) {
        settings.location = "Amravati, Maharashtra";
        modified = true;
      }
      if (!settings.notificationEmails || !Array.isArray(settings.notificationEmails) || settings.notificationEmails.length === 0) {
        settings.notificationEmails = settings.email ? [settings.email] : ["sayali@example.com"];
        modified = true;
      }
      if (modified) this.set(DB_KEYS.SETTINGS, settings);
    }

    if (!localStorage.getItem(DB_KEYS.PORTFOLIO)) this.set(DB_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);

    // Clean dummy testimonials if present
    let testimonials = this.get(DB_KEYS.TESTIMONIALS, []);
    if (testimonials.some(t => ['t1', 't2', 't3', 't4'].includes(t.id))) {
      testimonials = testimonials.filter(t => !['t1', 't2', 't3', 't4'].includes(t.id));
      this.set(DB_KEYS.TESTIMONIALS, testimonials);
    }

    // Clean dummy appointments if present
    let appointments = this.get(DB_KEYS.APPOINTMENTS, []);
    if (appointments.some(a => ['apt-101', 'apt-102'].includes(a.id))) {
      appointments = appointments.filter(a => !['apt-101', 'apt-102'].includes(a.id));
      this.set(DB_KEYS.APPOINTMENTS, appointments);
    }

    // Clean dummy blocked dates if present
    let blocked = this.get(DB_KEYS.BLOCKED_DATES, []);
    if (blocked.includes("2026-10-18")) {
      blocked = blocked.filter(d => d !== "2026-10-18");
      this.set(DB_KEYS.BLOCKED_DATES, blocked);
    }
    
    // Check if Supabase env vars can be fetched via /api/config runtime endpoint
    if (typeof window !== 'undefined' && (!window.__ENV__ || !window.__ENV__.SUPABASE_URL)) {
      fetch('/api/config')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.supabaseUrl && data.supabaseAnonKey) {
            window.__ENV__ = window.__ENV__ || {};
            window.__ENV__.SUPABASE_URL = data.supabaseUrl;
            window.__ENV__.SUPABASE_ANON_KEY = data.supabaseAnonKey;
            try { localStorage.setItem('sba_env_config', JSON.stringify(data)); } catch(e) {}
            if (!supabaseClient && window.supabase) {
              supabaseClient = window.supabase.createClient(data.supabaseUrl, data.supabaseAnonKey);
              this.syncFromSupabase();
              if (typeof window.onSupabaseReady === 'function') {
                window.onSupabaseReady();
              }
            }
          }
        })
        .catch(() => {});
    }

    // Attempt background sync from Supabase if configured
    this.syncFromSupabase();
  },

  isSupabaseConfigured() {
    const cfg = getSupabaseConfig();
    return !!(cfg.url && cfg.key);
  },

  getSupabaseConfig() {
    return getSupabaseConfig();
  },

  async syncFromSupabase() {
    const client = getSupabase();
    if (!client) return;

    try {
      // Sync appointments
      const { data: apts } = await client.from('appointments').select('*').order('created_at', { ascending: false });
      if (apts && apts.length > 0) {
        const formatted = apts.map(a => ({
          id: a.id,
          name: a.name,
          phone: a.phone,
          email: a.email,
          eventDate: a.event_date,
          service: a.service,
          message: a.message,
          status: a.status,
          notes: a.notes,
          createdAt: a.created_at
        }));
        this.set(DB_KEYS.APPOINTMENTS, formatted);
      }

      // Sync portfolio
      const { data: portfolio } = await client.from('portfolio').select('*').order('created_at', { ascending: false });
      if (portfolio && portfolio.length > 0) {
        this.set(DB_KEYS.PORTFOLIO, portfolio);
      }

      // Sync services
      const { data: services } = await client.from('services').select('*').order('sort_order', { ascending: true });
      if (services && services.length > 0) {
        this.set(DB_KEYS.SERVICES, services);
      }

      // Sync testimonials
      const { data: testimonials } = await client.from('testimonials').select('*').order('created_at', { ascending: false });
      if (testimonials && testimonials.length > 0) {
        this.set(DB_KEYS.TESTIMONIALS, testimonials);
      }

      // Sync blocked dates
      const { data: dates } = await client.from('blocked_dates').select('date_str');
      if (dates && dates.length > 0) {
        this.set(DB_KEYS.BLOCKED_DATES, dates.map(d => d.date_str));
      }
    } catch (err) {
      console.warn("Supabase fetch failed, using local cache:", err);
    }
  },

  getSettings() { return this.get(DB_KEYS.SETTINGS, DEFAULT_SETTINGS); },
  saveSettings(s) {
    this.set(DB_KEYS.SETTINGS, s);
    supabaseClient = null; // Re-init
    const client = getSupabase();
    if (client) {
      client.from('settings').upsert({ key: 'business', value: s }).catch(console.warn);
    }
  },

  getAppointments() { return this.get(DB_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS); },
  saveAppointments(a) { this.set(DB_KEYS.APPOINTMENTS, a); },
  async addAppointment(apt) {
    const list = this.getAppointments();
    list.unshift(apt);
    this.saveAppointments(list);

    // Sync to Supabase cloud
    const client = getSupabase();
    if (client) {
      try {
        await client.from('appointments').insert({
          id: apt.id,
          name: apt.name,
          phone: apt.phone,
          email: apt.email,
          event_date: apt.eventDate,
          service: apt.service,
          message: apt.message,
          status: apt.status || 'Pending',
          notes: apt.notes || '',
          created_at: apt.createdAt || new Date().toISOString()
        });
      } catch (e) {
        console.warn("Supabase appointment insert error:", e);
      }
    }
    return list;
  },

  async updateAppointmentStatus(id, newStatus) {
    const apts = this.getAppointments();
    const apt = apts.find(a => a.id === id);
    if (apt) {
      apt.status = newStatus;
      this.saveAppointments(apts);
      const client = getSupabase();
      if (client) {
        client.from('appointments').update({ status: newStatus }).eq('id', id).catch(console.warn);
      }
    }
  },

  async deleteAppointment(id) {
    let apts = this.getAppointments();
    apts = apts.filter(a => a.id !== id);
    this.saveAppointments(apts);
    const client = getSupabase();
    if (client) {
      client.from('appointments').delete().eq('id', id).catch(console.warn);
    }
  },

  getPortfolio() { return this.get(DB_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO); },
  savePortfolio(p) { this.set(DB_KEYS.PORTFOLIO, p); },
  async addPhoto(item) {
    const list = this.getPortfolio();
    list.unshift(item);
    this.savePortfolio(list);
    const client = getSupabase();
    if (client) {
      client.from('portfolio').insert(item).catch(console.warn);
    }
  },
  async deletePhoto(id) {
    let list = this.getPortfolio().filter(p => p.id !== id);
    this.savePortfolio(list);
    const client = getSupabase();
    if (client) {
      client.from('portfolio').delete().eq('id', id).catch(console.warn);
    }
  },

  getServices() { return this.get(DB_KEYS.SERVICES, DEFAULT_SERVICES); },
  saveServices(s) { this.set(DB_KEYS.SERVICES, s); },
  async addService(service) {
    const list = this.getServices();
    list.push(service);
    this.saveServices(list);
    const client = getSupabase();
    if (client) {
      client.from('services').insert(service).catch(console.warn);
    }
  },
  async deleteService(id) {
    let list = this.getServices().filter(s => s.id !== id);
    this.saveServices(list);
    const client = getSupabase();
    if (client) {
      client.from('services').delete().eq('id', id).catch(console.warn);
    }
  },

  getTestimonials() { return this.get(DB_KEYS.TESTIMONIALS, DEFAULT_TESTIMONIALS); },
  saveTestimonials(t) { this.set(DB_KEYS.TESTIMONIALS, t); },
  async addTestimonial(t) {
    const list = this.getTestimonials();
    list.unshift(t);
    this.saveTestimonials(list);
    const client = getSupabase();
    if (client) {
      client.from('testimonials').insert({
        id: t.id,
        name: t.name,
        rating: t.rating,
        emoji: t.emoji,
        text: t.text,
        status: t.status || 'approved',
        date: t.date || new Date().toISOString().slice(0, 10)
      }).catch(console.warn);
    }
    return list;
  },
  async deleteTestimonial(id) {
    let list = this.getTestimonials().filter(t => t.id !== id);
    this.saveTestimonials(list);
    const client = getSupabase();
    if (client) {
      client.from('testimonials').delete().eq('id', id).catch(console.warn);
    }
  },

  getBlockedDates() { return this.get(DB_KEYS.BLOCKED_DATES, []); },
  saveBlockedDates(d) {
    this.set(DB_KEYS.BLOCKED_DATES, d);
    const client = getSupabase();
    if (client) {
      client.from('blocked_dates').delete().neq('id', 0).then(() => {
        if (d.length > 0) {
          client.from('blocked_dates').insert(d.map(date_str => ({ date_str }))).catch(console.warn);
        }
      }).catch(console.warn);
    }
  }
};

if (typeof window !== 'undefined') {
  StorageDB.init();
}
