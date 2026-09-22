import { rupeesToPaise } from '../utils/money.js';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const avatar = (n) => `https://i.pravatar.cc/300?img=${n}`;

const winners = [
  { name: 'Riya Shah', positionLabel: { en: '1st Winner', hi: 'पहला विजेता' }, imageUrl: avatar(47), videoUrl: 'https://example.com/videos/riya' },
  { name: 'Aarav Mehta', positionLabel: { en: '1st Winner', hi: 'पहला विजेता' }, imageUrl: avatar(12), videoUrl: 'https://example.com/videos/aarav' },
  { name: 'Neha Verma', positionLabel: { en: '2nd Winner', hi: 'दूसरा विजेता' }, imageUrl: avatar(32), videoUrl: 'https://example.com/videos/neha' },
  { name: 'Ishita Chopra', positionLabel: { en: '3rd Winner', hi: 'तीसरा विजेता' }, imageUrl: avatar(45), videoUrl: 'https://example.com/videos/ishita' },
];

const rewardsFor = (amounts) =>
  amounts.map((rupees, i) => ({
    position: i + 1,
    label: { en: `${ordinal(i + 1)} Winner`, hi: `${['पहला', 'दूसरा', 'तीसरा', 'चौथा', 'पाँचवाँ', 'छठा'][i]} विजेता` },
    amountPaise: rupeesToPaise(rupees),
  }));

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

const judgeManju = {
  name: 'Manju Dubey',
  title: { en: 'Professional Kathak Dancer', hi: 'पेशेवर कथक नृत्यांगना' },
  experience: { en: '12+ Years of Experience', hi: '12+ वर्षों का अनुभव' },
  avatarUrl: avatar(49),
  introVideoUrl: 'https://example.com/videos/judge-manju',
};

const commonJudging = [
  { en: 'Technique and precision of movements', hi: 'तकनीक और गति की सटीकता' },
  { en: 'Expression (abhinaya) and stage presence', hi: 'भाव (अभिनय) और मंच उपस्थिति' },
  { en: 'Rhythm, timing and musicality', hi: 'लय, समय और संगीतमयता' },
  { en: 'Costume, presentation and overall impact', hi: 'वेशभूषा, प्रस्तुति और समग्र प्रभाव' },
];

const commonRules = [
  { en: 'Open to all age groups; solo performances only.', hi: 'सभी आयु वर्गों के लिए खुला; केवल एकल प्रस्तुति।' },
  { en: 'Video must be 2 to 5 minutes long, recorded in a single take.', hi: 'वीडियो 2 से 5 मिनट का हो और एक ही टेक में रिकॉर्ड किया गया हो।' },
  { en: 'Only one submission per participant; the latest upload counts.', hi: 'प्रति प्रतिभागी केवल एक प्रविष्टि; अंतिम अपलोड मान्य होगा।' },
  { en: 'Plagiarised or previously published entries will be disqualified.', hi: 'नकल की गई या पहले प्रकाशित प्रविष्टियाँ अयोग्य होंगी।' },
  { en: 'Entry fee is refundable only until registration closes.', hi: 'प्रवेश शुल्क केवल पंजीकरण बंद होने तक वापसी योग्य है।' },
];

const shared = {
  currency: 'INR',
  perks: [{ en: 'Winners get certificate', hi: 'विजेताओं को प्रमाणपत्र मिलेगा' }],
  previousWinners: winners,
  judgingParameters: commonJudging,
  rules: commonRules,
  disclaimer: {
    en: 'Only contributions from paid participants will be considered for judging.',
    hi: 'केवल भुगतान किए गए प्रतिभागियों की प्रविष्टियों पर ही निर्णय के लिए विचार किया जाएगा।',
  },
  media: {
    prizeMoneyVideoUrl: 'https://example.com/videos/how-prize-money-works',
    refundPolicyUrl: 'https://feedants.com/refund-policy',
    paymentProvider: 'Razorpay',
  },
  referral: { rewardPaise: rupeesToPaise(10) },
  testimonialsUrl: 'https://feedants.com/testimonials',
};

/**
 * Seed competitions covering every lifecycle phase. Dates are relative to
 * `now` so the demo always shows live countdowns.
 */
export function buildCompetitions(now = new Date()) {
  const at = (ms) => new Date(now.getTime() + ms);

  return [
    {
      ...shared,
      slug: 'feedants-classical-dance',
      title: { en: 'Feedants Classical Dance', hi: 'फीडएंट्स शास्त्रीय नृत्य' },
      category: { en: 'Dance', hi: 'नृत्य' },
      tags: [{ en: 'Multi-Win', hi: 'मल्टी-विन' }],
      status: 'published',
      prizePoolPaise: rupeesToPaise(1500),
      entryFeePaise: rupeesToPaise(99),
      capacity: { total: 20, booked: 0 },
      schedule: {
        registrationOpensAt: at(-5 * DAY),
        registrationClosesAt: at(1 * DAY + 6 * HOUR + 28 * 60 * 1000 + 32 * 1000),
        submissionStartsAt: at(-3 * DAY),
        submissionEndsAt: at(21 * DAY),
        resultAt: at(23 * DAY),
      },
      judge: judgeManju,
      about: {
        en: 'This is an online classical dance competition open for all age groups. Participate from anywhere and showcase your talent. Express your passion through traditional dance.\n\nEntries are judged by professional artists on technique, expression and musicality. Top six participants share the prize pool and every winner receives a digital certificate.',
        hi: 'यह सभी आयु वर्गों के लिए खुली एक ऑनलाइन शास्त्रीय नृत्य प्रतियोगिता है। कहीं से भी भाग लें और अपनी प्रतिभा दिखाएँ। पारंपरिक नृत्य के माध्यम से अपने जुनून को व्यक्त करें।\n\nप्रविष्टियों का मूल्यांकन पेशेवर कलाकारों द्वारा तकनीक, भाव और संगीतमयता के आधार पर किया जाता है। शीर्ष छह प्रतिभागी पुरस्कार राशि साझा करते हैं और हर विजेता को डिजिटल प्रमाणपत्र मिलता है।',
      },
      rewards: rewardsFor([550, 300, 240, 200, 130, 80]),
    },
    {
      ...shared,
      slug: 'feedants-bollywood-groove',
      title: { en: 'Bollywood Groove Challenge', hi: 'बॉलीवुड ग्रूव चैलेंज' },
      category: { en: 'Dance', hi: 'नृत्य' },
      tags: [{ en: 'Hurry', hi: 'जल्दी करें' }],
      status: 'published',
      prizePoolPaise: rupeesToPaise(1000),
      entryFeePaise: rupeesToPaise(49),
      capacity: { total: 7, booked: 0 },
      schedule: {
        registrationOpensAt: at(-2 * DAY),
        registrationClosesAt: at(3 * HOUR),
        submissionStartsAt: at(-1 * DAY),
        submissionEndsAt: at(7 * DAY),
        resultAt: at(9 * DAY),
      },
      judge: { ...judgeManju, name: 'Kabir Rao', title: { en: 'Choreographer', hi: 'कोरियोग्राफर' }, avatarUrl: avatar(11) },
      about: {
        en: 'A high-energy Bollywood dance contest. Only a few spots remain and registration closes in a few hours.',
        hi: 'एक ऊर्जा से भरपूर बॉलीवुड नृत्य प्रतियोगिता। कुछ ही स्थान बचे हैं और पंजीकरण कुछ घंटों में बंद हो जाएगा।',
      },
      rewards: rewardsFor([500, 300, 200]),
    },
    {
      ...shared,
      slug: 'feedants-vocal-showdown',
      title: { en: 'Vocal Showdown', hi: 'वोकल शोडाउन' },
      category: { en: 'Music', hi: 'संगीत' },
      tags: [{ en: 'Upcoming', hi: 'आगामी' }],
      status: 'published',
      prizePoolPaise: rupeesToPaise(2000),
      entryFeePaise: rupeesToPaise(149),
      capacity: { total: 50, booked: 0 },
      schedule: {
        registrationOpensAt: at(3 * DAY),
        registrationClosesAt: at(12 * DAY),
        submissionStartsAt: at(5 * DAY),
        submissionEndsAt: at(20 * DAY),
        resultAt: at(25 * DAY),
      },
      judge: { ...judgeManju, name: 'Sanjana Iyer', title: { en: 'Playback Singer', hi: 'पार्श्व गायिका' }, avatarUrl: avatar(25) },
      about: {
        en: 'Registration opens soon. Singers of all genres are welcome to compete for a ₹2,000 prize pool.',
        hi: 'पंजीकरण जल्द ही खुलेगा। सभी शैलियों के गायक ₹2,000 की पुरस्कार राशि के लिए प्रतिस्पर्धा कर सकते हैं।',
      },
      rewards: rewardsFor([1000, 600, 400]),
    },
    {
      ...shared,
      slug: 'feedants-street-dance-battle',
      title: { en: 'Street Dance Battle', hi: 'स्ट्रीट डांस बैटल' },
      category: { en: 'Dance', hi: 'नृत्य' },
      tags: [{ en: 'Sold Out', hi: 'बिक चुका' }],
      status: 'published',
      prizePoolPaise: rupeesToPaise(800),
      entryFeePaise: rupeesToPaise(79),
      capacity: { total: 5, booked: 0 },
      schedule: {
        registrationOpensAt: at(-4 * DAY),
        registrationClosesAt: at(4 * DAY),
        submissionStartsAt: at(-1 * DAY),
        submissionEndsAt: at(10 * DAY),
        resultAt: at(12 * DAY),
      },
      judge: { ...judgeManju, name: 'Dev Malhotra', title: { en: 'Hip-Hop Artist', hi: 'हिप-हॉप कलाकार' }, avatarUrl: avatar(53) },
      about: {
        en: 'A small-batch street dance battle. All spots have been booked; watch the leaderboard when results go live.',
        hi: 'एक छोटा स्ट्रीट डांस बैटल। सभी स्थान बुक हो चुके हैं; परिणाम आने पर लीडरबोर्ड देखें।',
      },
      rewards: rewardsFor([400, 250, 150]),
    },
    {
      ...shared,
      slug: 'feedants-monsoon-poetry',
      title: { en: 'Monsoon Poetry Slam', hi: 'मानसून कविता स्लैम' },
      category: { en: 'Literature', hi: 'साहित्य' },
      tags: [{ en: 'Free Entry', hi: 'निःशुल्क प्रवेश' }],
      status: 'published',
      prizePoolPaise: rupeesToPaise(500),
      entryFeePaise: 0,
      capacity: { total: 100, booked: 0 },
      schedule: {
        registrationOpensAt: at(-10 * DAY),
        registrationClosesAt: at(-1 * DAY),
        submissionStartsAt: at(-2 * DAY),
        submissionEndsAt: at(5 * DAY),
        resultAt: at(8 * DAY),
      },
      judge: { ...judgeManju, name: 'Ritu Sharma', title: { en: 'Poet and Author', hi: 'कवयित्री और लेखिका' }, avatarUrl: avatar(29) },
      about: {
        en: 'Registration has closed and submissions are open. Registered poets can upload their entries until the deadline.',
        hi: 'पंजीकरण बंद हो चुका है और प्रविष्टियाँ खुली हैं। पंजीकृत कवि समय सीमा तक अपनी प्रविष्टियाँ अपलोड कर सकते हैं।',
      },
      rewards: rewardsFor([300, 200]),
    },
    {
      ...shared,
      slug: 'feedants-sketch-sprint',
      title: { en: 'Sketch Sprint', hi: 'स्केच स्प्रिंट' },
      category: { en: 'Art', hi: 'कला' },
      tags: [{ en: 'Judging', hi: 'मूल्यांकन' }],
      status: 'published',
      prizePoolPaise: rupeesToPaise(700),
      entryFeePaise: rupeesToPaise(59),
      capacity: { total: 30, booked: 0 },
      schedule: {
        registrationOpensAt: at(-20 * DAY),
        registrationClosesAt: at(-8 * DAY),
        submissionStartsAt: at(-10 * DAY),
        submissionEndsAt: at(-1 * DAY),
        resultAt: at(5 * DAY),
      },
      judge: { ...judgeManju, name: 'Arjun Nair', title: { en: 'Illustrator', hi: 'चित्रकार' }, avatarUrl: avatar(60) },
      about: {
        en: 'Submissions are closed and the judges are reviewing entries. Results will be announced soon.',
        hi: 'प्रविष्टियाँ बंद हो चुकी हैं और निर्णायक प्रविष्टियों की समीक्षा कर रहे हैं। परिणाम जल्द घोषित होंगे।',
      },
      rewards: rewardsFor([400, 200, 100]),
    },
    {
      ...shared,
      slug: 'feedants-folk-fusion',
      title: { en: 'Folk Fusion Fest', hi: 'फोक फ्यूज़न फेस्ट' },
      category: { en: 'Dance', hi: 'नृत्य' },
      tags: [{ en: 'Completed', hi: 'पूर्ण' }],
      status: 'published',
      prizePoolPaise: rupeesToPaise(1200),
      entryFeePaise: rupeesToPaise(89),
      capacity: { total: 25, booked: 0 },
      schedule: {
        registrationOpensAt: at(-40 * DAY),
        registrationClosesAt: at(-25 * DAY),
        submissionStartsAt: at(-30 * DAY),
        submissionEndsAt: at(-10 * DAY),
        resultAt: at(-2 * DAY),
      },
      judge: judgeManju,
      about: {
        en: 'This competition has concluded and results are out. Thank you to everyone who participated!',
        hi: 'यह प्रतियोगिता समाप्त हो चुकी है और परिणाम घोषित हो गए हैं। भाग लेने वाले सभी को धन्यवाद!',
      },
      rewards: rewardsFor([600, 350, 250]),
    },
  ];
}

export const DEMO_USERS = [
  { name: 'Devang', email: 'demo@feedants.app', avatarUrl: avatar(68) },
  { name: 'Asha Patel', email: 'asha@feedants.app', avatarUrl: avatar(44) },
  { name: 'Rohan Gupta', email: 'rohan@feedants.app', avatarUrl: avatar(15) },
  { name: 'Meera Joshi', email: 'meera@feedants.app', avatarUrl: avatar(20) },
  { name: 'Kiran Das', email: 'kiran@feedants.app', avatarUrl: avatar(33) },
  { name: 'Tara Singh', email: 'tara@feedants.app', avatarUrl: avatar(38) },
];

/**
 * Which seeded users are pre-registered where. The primary demo user
 * (demo@feedants.app) is deliberately left unregistered for the design
 * competition so the full register -> pay -> submit flow can be demonstrated.
 */
export const SEED_REGISTRATIONS = {
  'feedants-classical-dance': ['asha@feedants.app'],
  'feedants-bollywood-groove': ['asha@feedants.app', 'rohan@feedants.app', 'meera@feedants.app', 'kiran@feedants.app', 'tara@feedants.app'],
  'feedants-street-dance-battle': ['asha@feedants.app', 'rohan@feedants.app', 'meera@feedants.app', 'kiran@feedants.app', 'tara@feedants.app'],
  'feedants-monsoon-poetry': ['demo@feedants.app', 'asha@feedants.app'],
  'feedants-sketch-sprint': ['demo@feedants.app', 'rohan@feedants.app'],
  'feedants-folk-fusion': ['demo@feedants.app', 'meera@feedants.app'],
};
