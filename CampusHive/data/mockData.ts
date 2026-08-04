// ─────────────────────────────────────────────────────────────
// CAMPUSHIVE — COMPLETE MOCK DATA
// ─────────────────────────────────────────────────────────────

export const universities = [
  { id: 'cu',       name: 'Chandigarh University', short: 'CU',   color: '#2563EB', students: '2,50,000+', location: 'Chandigarh' },
  { id: 'iitd',     name: 'IIT Delhi',            short: 'IITD', color: '#1E40AF', students: '8,500+',     location: 'New Delhi' },
  { id: 'amity',    name: 'Amity University',     short: 'AU',   color: '#0891B2', students: '1,25,000+',  location: 'Noida' },
  { id: 'bits',     name: 'BITS Pilani',          short: 'BITS', color: '#EA580C', students: '15,000+',    location: 'Pilani, Rajasthan' },
  { id: 'jadavpur', name: 'Jadavpur University',  short: 'JU',   color: '#16A34A', students: '20,000+',    location: 'Kolkata' },
  { id: 'custom',   name: 'Other University',     short: '?',    color: '#6B7280', students: '',           location: 'Custom' },
];

export const categories = [
  { id: 'design',  label: 'Design',   icon: 'palette' },
  { id: 'video',   label: 'Video',    icon: 'video' },
  { id: 'dev',     label: 'Coding',   icon: 'code-braces' },
  { id: 'photo',   label: 'Photo',    icon: 'camera' },
  { id: 'writing', label: 'Writing',  icon: 'pencil' },
  { id: 'music',   label: 'Music',    icon: 'music' },
  { id: 'tutor',   label: 'Tutoring', icon: 'book' },
];

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  delivery: string;
  revisions: number;
}

export interface Review {
  author: string;
  rating: number;
  text: string;
}

export interface Freelancer {
  id: string;
  name: string;
  role: string;
  university: string;
  rating: number;
  reviews: number;
  completedOrders: number;
  bio: string;
  category: string;
  isVerified: boolean;
  responseTime: string;
  skills: string[];
  services: Service[];
  reviews_list: Review[];
  avatar: string;
}

export const freelancers: Freelancer[] = [
  {
    id: 'f1',
    name: 'Arjun Mehta',
    role: 'Video Editor & Motion Designer',
    university: 'Chandigarh University',
    rating: 4.9,
    reviews: 47,
    completedOrders: 63,
    bio: 'Chandigarh University student. Cinematic edits, reels, and YouTube content. Worked with 10+ student clubs.',
    category: 'video',
    isVerified: true,
    responseTime: '~2 hrs',
    skills: ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Motion Graphics'],
    services: [
      { id: 's1', title: 'Basic Reel Edit',      description: '15–30 sec reel with music sync, colour grade & transitions', price: 150,  delivery: '2 days', revisions: 2 },
      { id: 's2', title: 'YouTube Video Edit',   description: 'Full edit up to 15 min: cuts, B-roll, graphics, thumbnail',  price: 500,  delivery: '4 days', revisions: 3 },
      { id: 's3', title: 'Event Highlight Film', description: 'Professional 3–5 min highlight with cinematic grading',      price: 1200, delivery: '7 days', revisions: 2 },
    ],
    reviews_list: [
      { author: 'Priya S.',  rating: 5, text: 'Delivered 2 days early! Quality was top notch.' },
      { author: 'Rohan K.',  rating: 5, text: "Made our club's event video look absolutely cinematic." },
      { author: 'Ananya M.', rating: 4, text: 'Great work, minor delay but final result was worth it.' },
    ],
    avatar: 'https://i.pravatar.cc/150?img=11',
  },
  {
    id: 'f2',
    name: 'Priya Sharma',
    role: 'UI/UX & Brand Designer',
    university: 'Chandigarh University',
    rating: 4.8,
    reviews: 31,
    completedOrders: 39,
    bio: 'Final-year design student. Pixel-perfect interfaces for startups, clubs & events. Figma expert.',
    category: 'design',
    isVerified: true,
    responseTime: '~1 hr',
    skills: ['Figma', 'Illustrator', 'Brand Identity', 'Social Media Design'],
    services: [
      { id: 's4', title: 'Social Media Kit',      description: '5 post templates + story templates in brand colors',         price: 300, delivery: '3 days', revisions: 3 },
      { id: 's5', title: 'Logo & Brand Identity', description: 'Logo, color palette, typography, basic brand guide',         price: 800, delivery: '5 days', revisions: 4 },
      { id: 's6', title: 'Event Poster Design',   description: 'Stunning event poster + banner + Instagram post',            price: 200, delivery: '1 day',  revisions: 2 },
    ],
    reviews_list: [
      { author: 'Dev R.',   rating: 5, text: 'Priya designed our hackathon branding. Absolutely professional!' },
      { author: 'Neha T.',  rating: 5, text: 'Super quick turnaround. The logo she made is stunning.' },
      { author: 'Karan P.', rating: 4, text: 'Great communication throughout. Highly recommend.' },
    ],
    avatar: 'https://i.pravatar.cc/150?img=47',
  },
  {
    id: 'f3',
    name: 'Kavya Nair',
    role: 'Photographer & Content Creator',
    university: 'Chandigarh University',
    rating: 4.7,
    reviews: 22,
    completedOrders: 28,
    bio: 'Event & portrait photographer. Cultural fests, tech summits, club days. Available across campus.',
    category: 'photo',
    isVerified: false,
    responseTime: '~3 hrs',
    skills: ['Event Photography', 'Portrait', 'Lightroom', 'Instagram Content'],
    services: [
      { id: 's7', title: 'Event Photography (2hr)', description: '2 hours coverage, 50+ edited photos delivered', price: 600, delivery: '3 days', revisions: 1 },
      { id: 's8', title: 'Portrait Session',        description: '30 min session, 10 retouched photos',           price: 250, delivery: '2 days', revisions: 2 },
    ],
    reviews_list: [
      { author: 'Siddharth K.', rating: 5, text: 'Kavya shot our tech fest. Photos are extraordinary!' },
      { author: 'Meera J.',     rating: 4, text: 'Professional and friendly. Great eye for candid shots.' },
    ],
    avatar: 'https://i.pravatar.cc/150?img=44',
  },
  {
    id: 'f4',
    name: 'Rahul Gupta',
    role: 'Full-Stack Developer',
    university: 'Chandigarh University',
    rating: 5.0,
    reviews: 18,
    completedOrders: 21,
    bio: 'Chandigarh University student. Web apps, automation scripts, Discord bots, college utilities. Clean code.',
    category: 'dev',
    isVerified: true,
    responseTime: '~4 hrs',
    skills: ['React', 'Node.js', 'Python', 'Firebase', 'REST APIs'],
    services: [
      { id: 's9',  title: 'Landing Page',           description: 'Responsive landing page with animations',        price: 1000, delivery: '5 days',  revisions: 3 },
      { id: 's10', title: 'College Project (Minor)', description: 'Full-stack web project with DB integration',    price: 2500, delivery: '10 days', revisions: 2 },
      { id: 's11', title: 'Discord Bot',             description: 'Custom Discord bot for your server/community',  price: 400,  delivery: '3 days',  revisions: 2 },
    ],
    reviews_list: [
      { author: 'Aarav M.', rating: 5, text: 'Built our club website in record time. Flawless code!' },
      { author: 'Tanya R.', rating: 5, text: 'Very professional, great at communicating progress.' },
    ],
    avatar: 'https://i.pravatar.cc/150?img=68',
  },
];

export interface Post {
  id: string;
  type: 'announcement' | 'event' | 'update';
  title: string;
  body: string;
  time: string;
  likes: number;
  comments: number;
  hasImage: boolean;
}

export interface Community {
  id: string;
  name: string;
  shortName: string;
  emoji: string;
  color: string;
  university: string;
  members: number;
  isFollowing: boolean;
  isVerified: boolean;
  description: string;
  posts: Post[];
}

export const communities: Community[] = [
  {
    id: 'c1',
    name: 'Coding Club',
    shortName: 'CodeX',
    emoji: 'code-braces',
    color: '#2563EB',
    university: 'IIT Delhi',
    members: 1240,
    isFollowing: true,
    isVerified: true,
    description: "IIT Delhi's premier coding community. Competitive programming, hackathons, open-source.",
    posts: [
      { id: 'p1', type: 'announcement', title: 'Winter Hackathon 2025 — Registrations Open!', body: 'Our Codeforces contest goes live Friday. Top 3 get exclusive CodeX merch.', time: '2 hours ago', likes: 214, comments: 38, hasImage: true },
      { id: 'p2', type: 'update',       title: 'Weekly CP Contest — This Friday 8PM',          body: 'Our Codeforces contest goes live Friday. Top 3 get exclusive CodeX merch.',                time: '1 day ago',   likes: 87,  comments: 12, hasImage: false },
    ],
  },
  {
    id: 'c2',
    name: 'Dance Society',
    shortName: 'Natyam',
    emoji: 'music-box-multiple',
    color: '#DC2626',
    university: 'Chandigarh University',
    members: 890,
    isFollowing: true,
    isVerified: true,
    description: "CU's vibrant dance society. Classical, contemporary & fusion. Open auditions every semester!",
    posts: [
      { id: 'p3', type: 'event', title: 'Natyam Utsav 2025 — Annual Dance Fest', body: 'Our biggest show at Open Air Theatre. Guest performers from 5 cities. Free entry for CU students!', time: '5 hours ago', likes: 412, comments: 67, hasImage: true },
    ],
  },
  {
    id: 'c3',
    name: 'Robotics Club',
    shortName: 'RoboIIT',
    emoji: 'robot',
    color: '#0891B2',
    university: 'IIT Delhi',
    members: 560,
    isFollowing: false,
    isVerified: true,
    description: 'We build robots, compete nationally and push campus boundaries.',
    posts: [
      { id: 'p4', type: 'announcement', title: 'Robocon 2025 Team Selection', body: 'Applications open for Robocon national team. Need mechanical, electronics and software folks.', time: '3 days ago', likes: 203, comments: 44, hasImage: true },
    ],
  },
  {
    id: 'c4',
    name: 'Entrepreneurship Cell',
    shortName: 'E-Cell',
    emoji: 'rocket-launch',
    color: '#EA580C',
    university: 'BITS Pilani',
    members: 2100,
    isFollowing: false,
    isVerified: true,
    description: "India's largest college E-Cell. Connecting students with mentors, investors, startups.",
    posts: [
      { id: 'p5', type: 'update', title: 'Startup Weekend — Coming Up March 15', body: '54 hours. Teams of 5. Build a startup from scratch. Top team gets ₹5L funding.', time: '1 day ago', likes: 623, comments: 91, hasImage: true },
    ],
  },
  {
    id: 'c5',
    name: 'Photography Club',
    shortName: 'PhotoPulse',
    emoji: 'camera',
    color: '#16A34A',
    university: 'Amity University',
    members: 340,
    isFollowing: false,
    isVerified: false,
    description: 'We see the world through lenses. Weekly photo walks, workshops and competitions.',
    posts: [],
  },
];

export interface Event {
  id: string;
  title: string;
  community: string;
  communityId: string;
  emoji: string;
  communityColor: string;
  date: string;
  time: string;
  location: string;
  description: string;
  tags: string[];
  isFree: boolean;
  registrationFee?: string;
  registeredCount: number;
  maxCapacity: number;
  isRegistered: boolean;
  prize: string | null;
}

export const events: Event[] = [
  {
    id: 'e1',
    title: 'Winter Hackathon 2025',
    community: 'CodeX · IIT Delhi',
    communityId: 'c1',
    emoji: 'code-braces',
    communityColor: '#2563EB',
    date: 'March 15, 2025',
    time: '9:00 AM – 9:00 AM (24hrs)',
    location: 'Lecture Hall Complex, IIT Delhi',
    description: '24-hour hackathon. Theme: AI for Social Good. Teams of 2–5. Cash prizes ₹1,00,000+ and internship opportunities.',
    tags: ['Technology', 'AI/ML', 'Hackathon', 'Competition'],
    isFree: true,
    registeredCount: 342,
    maxCapacity: 500,
    isRegistered: false,
    prize: '₹1,00,000+',
  },
  {
    id: 'e2',
    title: 'Natyam Utsav — Annual Dance Fest',
    community: 'Natyam · Chandigarh University',
    communityId: 'c2',
    emoji: 'music-box-multiple',
    communityColor: '#DC2626',
    date: 'March 22, 2025',
    time: '5:00 PM – 10:00 PM',
    location: 'Open Air Theatre, Main Campus, CU',
    description: 'Classical, contemporary and fusion dance. CU\'s biggest cultural performance. Guest troupes from 5 cities.',
    tags: ['Cultural', 'Dance', 'Performance', 'Free Entry'],
    isFree: true,
    registeredCount: 780,
    maxCapacity: 1500,
    isRegistered: true,
    prize: null,
  },
  {
    id: 'e3',
    title: 'Startup Weekend Noida',
    community: 'E-Cell · BITS Pilani',
    communityId: 'c4',
    emoji: 'rocket-launch',
    communityColor: '#EA580C',
    date: 'March 29, 2025',
    time: 'Friday 6PM – Sunday 9PM',
    location: 'Amity University, Noida Campus',
    description: '54 hours to build a company. Get mentored by serial entrepreneurs, pitch to real investors. Winner gets ₹5L seed funding.',
    tags: ['Startup', 'Entrepreneurship', 'Pitch', 'Networking'],
    isFree: false,
    registrationFee: '₹299',
    registeredCount: 198,
    maxCapacity: 250,
    isRegistered: false,
    prize: '₹5,00,000 Seed Funding',
  },
  {
    id: 'e4',
    title: 'Photography Walk — Old Delhi',
    community: 'PhotoPulse · Amity',
    communityId: 'c5',
    emoji: 'camera',
    communityColor: '#16A34A',
    date: 'April 5, 2025',
    time: '7:00 AM – 11:00 AM',
    location: 'Chandni Chowk Metro Station Exit 3',
    description: 'Sunrise photography walk through historic lanes of Old Delhi. Professional photographer guide. Beginner-friendly.',
    tags: ['Photography', 'Walk', 'Creative', 'Beginner Friendly'],
    isFree: true,
    registeredCount: 42,
    maxCapacity: 60,
    isRegistered: false,
    prize: null,
  },
  {
    id: 'e5',
    title: 'TechTalks — AI in Education',
    community: 'CodeX · IIT Delhi',
    communityId: 'c1',
    emoji: 'microphone',
    communityColor: '#4F46E5',
    date: 'April 10, 2025',
    time: '3:00 PM – 6:00 PM',
    location: 'Dogra Hall, IIT Delhi',
    description: 'Panel discussion with IIT, IISc researchers and industry leaders on AI reshaping education. Q&A included.',
    tags: ['AI', 'Panel', 'Talk', 'Open to All'],
    isFree: true,
    registeredCount: 220,
    maxCapacity: 400,
    isRegistered: false,
    prize: null,
  },
];

export const notifications = [
  { id: 'n1', type: 'order',     icon: 'shopping', title: 'New Order!',                   body: "Priya Sharma placed an order for 'Social Media Kit'",              time: '5 min ago',  unread: true },
  { id: 'n2', type: 'community', icon: 'bullhorn', title: 'CodeX posted an announcement', body: 'Winter Hackathon 2025 — Registrations Open!',                     time: '2 hrs ago',  unread: true },
  { id: 'n3', type: 'event',     icon: 'calendar-outline', title: 'Event Reminder',               body: "Natyam Utsav starts tomorrow at 5PM. You're registered!",         time: '5 hrs ago',  unread: true },
  { id: 'n4', type: 'review',    icon: 'star', title: 'New Review from Dev R.',       body: "5 stars — 'Priya designed our hackathon branding. Absolutely professional!'", time: '1 day ago', unread: false },
  { id: 'n5', type: 'payment',   icon: 'wallet-plus', title: 'Payment Received',             body: '₹500 credited for YouTube Video Edit from Arjun M.',              time: '2 days ago', unread: false },
  { id: 'n6', type: 'community', icon: 'bell', title: 'Natyam posted an update',      body: 'Natyam Utsav — Gate passes now available!',                       time: '3 days ago', unread: false },
  { id: 'n7', type: 'order',     icon: 'check-circle-outline', title: 'Order Completed',              body: 'Your order with Rahul Gupta (Landing Page) is marked complete',   time: '4 days ago', unread: false },
];

export const currentUser = {
  id: 'u1',
  name: 'Utkarsh Kumar Tiwari',
  email: 'utkarsh.tiwari@cuchd.in',
  university: 'Chandigarh University',
  year: '2nd Year',
  role: 'Freelancer & Client',
  isFreelancer: true,
  followers: 45,
  following: 28,
  completedOrders: 18,
  earnings: 8750,
  rating: 4.7,
  joinedDate: 'March 2024',
  avatar: 'https://i.pravatar.cc/150?img=12',
};

export const earningsData = [
  { month: 'Oct', amount: 1800 },
  { month: 'Nov', amount: 3200 },
  { month: 'Dec', amount: 2600 },
  { month: 'Jan', amount: 4100 },
  { month: 'Feb', amount: 5400 },
  { month: 'Mar', amount: 7400 },
];

export const recentOrders = [
  { id: 'o1', client: 'Priya S.',       service: 'YouTube Video Edit',   amount: 500,  status: 'pending',     time: 'Just now' },
  { id: 'o2', client: 'Coding Club',    service: 'Event Highlight Film', amount: 1200, status: 'in-progress', time: '2 days ago' },
  { id: 'o3', client: 'Dev R.',         service: 'Reel Edit',            amount: 150,  status: 'completed',   time: '4 days ago' },
  { id: 'o4', client: 'Natyam Society', service: 'Event Highlight Film', amount: 1200, status: 'completed',   time: '1 week ago' },
  { id: 'o5', client: 'Karan P.',       service: 'YouTube Video Edit',   amount: 500,  status: 'completed',   time: '2 weeks ago' },
];

export type ChatRole = 'client' | 'freelancer';

export interface ChatMessage {
  id: string;
  senderRole: ChatRole;
  senderName: string;
  text: string;
  time: string;
  isRead: boolean;
}

export interface ChatThread {
  id: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  clientName: string;
  clientAvatar: string;
  projectTitle: string;
  status: 'inquiry' | 'in-progress' | 'completed';
  messages: ChatMessage[];
}

export const chatThreads: ChatThread[] = [
  {
    id: 'chat-f1',
    freelancerId: 'f1',
    freelancerName: 'Arjun Mehta',
    freelancerAvatar: 'https://i.pravatar.cc/150?img=11',
    clientName: 'Priya Sharma',
    clientAvatar: 'https://i.pravatar.cc/150?img=47',
    projectTitle: 'Event Highlight Reel',
    status: 'in-progress',
    messages: [
      {
        id: 'm1',
        senderRole: 'client',
        senderName: 'Priya Sharma',
        text: 'Hey Arjun, can you deliver a 45 second highlight reel by Saturday evening?',
        time: '10:10 AM',
        isRead: true,
      },
      {
        id: 'm2',
        senderRole: 'freelancer',
        senderName: 'Arjun Mehta',
        text: 'Yes, that works. Please share your preferred music vibe and any sponsor logos.',
        time: '10:14 AM',
        isRead: true,
      },
      {
        id: 'm3',
        senderRole: 'client',
        senderName: 'Priya Sharma',
        text: 'Done. Sending assets now. Need one version for Instagram and one for YouTube.',
        time: '10:18 AM',
        isRead: false,
      },
    ],
  },
  {
    id: 'chat-f2',
    freelancerId: 'f2',
    freelancerName: 'Priya Sharma',
    freelancerAvatar: 'https://i.pravatar.cc/150?img=47',
    clientName: 'Rahul Gupta',
    clientAvatar: 'https://i.pravatar.cc/150?img=68',
    projectTitle: 'Landing Page UI Kit',
    status: 'inquiry',
    messages: [
      {
        id: 'm4',
        senderRole: 'client',
        senderName: 'Rahul Gupta',
        text: 'Hi, I need a clean SaaS dashboard UI by next week. Are you available?',
        time: 'Yesterday',
        isRead: true,
      },
      {
        id: 'm5',
        senderRole: 'freelancer',
        senderName: 'Priya Sharma',
        text: 'Yes, available. Share your wireframe and I can send first draft in 2 days.',
        time: 'Yesterday',
        isRead: true,
      },
    ],
  },
  {
    id: 'chat-f4',
    freelancerId: 'f4',
    freelancerName: 'Rahul Gupta',
    freelancerAvatar: 'https://i.pravatar.cc/150?img=68',
    clientName: 'Natyam Society',
    clientAvatar: 'https://i.pravatar.cc/150?img=24',
    projectTitle: 'Event Registration Microsite',
    status: 'completed',
    messages: [
      {
        id: 'm6',
        senderRole: 'client',
        senderName: 'Natyam Society',
        text: 'The site is live and working great. Thank you!',
        time: '2 days ago',
        isRead: true,
      },
      {
        id: 'm7',
        senderRole: 'freelancer',
        senderName: 'Rahul Gupta',
        text: 'Awesome. Happy to help with post-event analytics dashboard too.',
        time: '2 days ago',
        isRead: true,
      },
    ],
  },
];
