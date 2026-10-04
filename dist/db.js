// Shared State & Database Engine for Sayali Banode Makeup Artist
// Operates with localStorage for zero-backend operation, with automatic fallback seed data.

const DB_KEYS = {
  APPOINTMENTS: 'sba_appointments',
  PORTFOLIO: 'sba_portfolio',
  SERVICES: 'sba_services',
  TESTIMONIALS: 'sba_testimonials',
  SETTINGS: 'sba_settings',
  BLOCKED_DATES: 'sba_blocked_dates',
  AUTH: 'sba_auth_session'
};

const DEFAULT_SETTINGS = {
  siteTitle: "Sayali Banode Makeup Artist",
  artistName: "Sayali Banode",
  phone: "+91 7030477747",
  whatsapp: "917030477747",
  email: "sayali@example.com",
  location: "Mumbai, Maharashtra",
  instagram: "https://instagram.com/sayalibanodemakeup",
  facebook: "https://facebook.com",
  adminPassword: "admin", // default password
  emailServiceKey: "", // Web3Forms or EmailJS key
  experienceYears: "5+",
  happyBrides: "500+",
  currencySymbol: "₹"
};

const DEFAULT_SERVICES = [
  {
    id: "s1",
    title: "Bridal Makeup",
    price: "₹18,000",
    description: "Stunning, long-lasting bridal looks that make your special day unforgettable.",
    icon: "👰"
  },
  {
    id: "s2",
    title: "Engagement Makeup",
    price: "₹12,000",
    description: "Elegant and sophisticated looks for your engagement ceremony.",
    icon: "💍"
  },
  {
    id: "s3",
    title: "Reception Makeup",
    price: "₹15,000",
    description: "Glamorous makeup that photographs beautifully for your reception.",
    icon: "✨"
  },
  {
    id: "s4",
    title: "Party Makeup",
    price: "₹6,000",
    description: "Bold and beautiful looks for parties and special occasions.",
    icon: "🎉"
  },
  {
    id: "s5",
    title: "HD Makeup",
    price: "₹14,000",
    description: "Camera-ready, flawless makeup perfect for photography and videography.",
    icon: "📸"
  },
  {
    id: "s6",
    title: "Airbrush Makeup",
    price: "₹22,000",
    description: "Lightweight, flawless finish that lasts all day and night.",
    icon: "🎨"
  },
  {
    id: "s7",
    title: "Editorial Makeup",
    price: "₹10,000",
    description: "Creative, artistic looks for fashion shoots and editorials.",
    icon: "📷"
  },
  {
    id: "s8",
    title: "Fashion Shoot",
    price: "₹12,000",
    description: "High-fashion makeup for professional modeling and shoots.",
    icon: "👗"
  },
  {
    id: "s9",
    title: "Hair Styling",
    price: "₹4,500",
    description: "Professional hair styling to complete your perfect look.",
    icon: "💇"
  }
];

const DEFAULT_PORTFOLIO = [
  {
    id: "p1",
    url: "https://images.unsplash.com/photo-1684868265714-fd2300637c23",
    category: "bridal",
    title: "Bridal Elegance"
  },
  {
    id: "p2",
    url: "https://images.unsplash.com/photo-1684868268327-7e5590bcfbd6",
    category: "bridal",
    title: "Traditional Bridal"
  },
  {
    id: "p3",
    url: "https://images.pexels.com/photos/30809480/pexels-photo-30809480.jpeg",
    category: "bridal",
    title: "Classic Bridal"
  },
  {
    id: "p4",
    url: "https://images.pexels.com/photos/34955448/pexels-photo-34955448.jpeg",
    category: "reception",
    title: "Reception Glam"
  },
  {
    id: "p5",
    url: "https://images.pexels.com/photos/5394050/pexels-photo-5394050.jpeg",
    category: "party",
    title: "Party Glam"
  },
  {
    id: "p6",
    url: "https://images.unsplash.com/photo-1548112129-b5cf67e9558d",
    category: "editorial",
    title: "Editorial Beauty"
  },
  {
    id: "p7",
    url: "https://images.pexels.com/photos/31845455/pexels-photo-31845455.jpeg",
    category: "editorial",
    title: "Fashion Editorial"
  },
  {
    id: "p8",
    url: "https://images.pexels.com/photos/5149734/pexels-photo-5149734.jpeg",
    category: "glam",
    title: "Glamorous Look"
  }
];

const DEFAULT_TESTIMONIALS = [
  {
    id: "t1",
    name: "Priya Sharma",
    rating: 5,
    text: "Sayali made me look absolutely stunning on my wedding day! Her attention to detail and professionalism is unmatched. Highly recommended!",
    emoji: "👰",
    status: "approved",
    date: "2026-09-15"
  },
  {
    id: "t2",
    name: "Ananya Patel",
    rating: 5,
    text: "Best makeup artist in Mumbai! My makeup stayed flawless throughout my reception. Thank you Sayali for making me feel so beautiful!",
    emoji: "💕",
    status: "approved",
    date: "2026-09-20"
  },
  {
    id: "t3",
    name: "Neha Desai",
    rating: 5,
    text: "I was so impressed with Sayali's work. She understood exactly what I wanted and delivered beyond my expectations. Absolutely loved it!",
    emoji: "✨",
    status: "approved",
    date: "2026-09-28"
  },
  {
    id: "t4",
    name: "Kavya Reddy",
    rating: 5,
    text: "Sayali is a true artist! She made me look like a princess on my special day. Her skills and friendly nature make her the best choice!",
    emoji: "👑",
    status: "approved",
    date: "2026-10-01"
  }
];

const DEFAULT_APPOINTMENTS = [
  {
    id: "apt-101",
    name: "Aaradhya Joshi",
    phone: "+91 98201 12345",
    email: "aaradhya@example.com",
    eventDate: "2026-10-18",
    service: "Bridal Makeup",
    message: "Destination wedding at Taj Lands End. Need makeup for morning wedding and evening sangeet.",
    status: "Confirmed",
    createdAt: "2026-10-02T14:30:00Z",
    notes: "Advance 5,000 received. Outfit color: Crimson Red."
  },
  {
    id: "apt-102",
    name: "Simran Kaur",
    phone: "+91 98334 56789",
    email: "simran@example.com",
    eventDate: "2026-10-24",
    service: "Reception Makeup",
    message: "Reception party makeup with HD finish. Venue is in Bandra.",
    status: "Pending",
    createdAt: "2026-10-03T09:15:00Z",
    notes: ""
  }
];

// Helper Storage API
const StorageDB = {
  get(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error("Storage error:", e);
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
    if (!localStorage.getItem(DB_KEYS.SERVICES)) this.set(DB_KEYS.SERVICES, DEFAULT_SERVICES);
    if (!localStorage.getItem(DB_KEYS.PORTFOLIO)) this.set(DB_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO);
    if (!localStorage.getItem(DB_KEYS.TESTIMONIALS)) this.set(DB_KEYS.TESTIMONIALS, DEFAULT_TESTIMONIALS);
    if (!localStorage.getItem(DB_KEYS.APPOINTMENTS)) this.set(DB_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
    if (!localStorage.getItem(DB_KEYS.BLOCKED_DATES)) this.set(DB_KEYS.BLOCKED_DATES, ["2026-10-18"]);
  },
  getSettings() { return this.get(DB_KEYS.SETTINGS, DEFAULT_SETTINGS); },
  saveSettings(s) { this.set(DB_KEYS.SETTINGS, s); },
  getAppointments() { return this.get(DB_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS); },
  saveAppointments(a) { this.set(DB_KEYS.APPOINTMENTS, a); },
  addAppointment(apt) {
    const list = this.getAppointments();
    list.unshift(apt);
    this.saveAppointments(list);
    return list;
  },
  getPortfolio() { return this.get(DB_KEYS.PORTFOLIO, DEFAULT_PORTFOLIO); },
  savePortfolio(p) { this.set(DB_KEYS.PORTFOLIO, p); },
  getServices() { return this.get(DB_KEYS.SERVICES, DEFAULT_SERVICES); },
  saveServices(s) { this.set(DB_KEYS.SERVICES, s); },
  getTestimonials() { return this.get(DB_KEYS.TESTIMONIALS, DEFAULT_TESTIMONIALS); },
  saveTestimonials(t) { this.set(DB_KEYS.TESTIMONIALS, t); },
  addTestimonial(t) {
    const list = this.getTestimonials();
    list.unshift(t);
    this.saveTestimonials(list);
    return list;
  },
  getBlockedDates() { return this.get(DB_KEYS.BLOCKED_DATES, []); },
  saveBlockedDates(d) { this.set(DB_KEYS.BLOCKED_DATES, d); }
};

// Initialize right away
if (typeof window !== 'undefined') {
  StorageDB.init();
}
