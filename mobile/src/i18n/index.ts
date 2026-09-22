import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Lang = 'en' | 'hi';

/**
 * UI chrome strings live in the app; competition *content* is localised by
 * the backend. Keys ending in `_at` receive a formatted date via {date}.
 */
const strings = {
  en: {
    go_back: 'Go back',
    registered: 'Registered',
    prize_pool: 'Prize Pool',
    entry_fee: 'Entry Fee',
    free: 'Free',
    spots_left: 'Only {n} spots left',
    spots_left_one: 'Only 1 spot left',
    spots_full: 'All spots booked',
    booked: '{booked} / {total} Booked',
    judge: 'Judge',
    intro_video: 'Intro Video',
    registration_closes_in: 'Registration closes in',
    registration_opens_in: 'Registration opens in',
    submission_starts_in: 'Submission starts in',
    submission_ends_in: 'Submission ends in',
    results_in: 'Results in',
    hurry_up: 'Hurry up!',
    important_dates: 'Important Dates',
    register_before: 'Register Before',
    submission_starts: 'Submission Starts',
    submission_ends: 'Submission Ends',
    result_date: 'Result Date',
    previous_winners: 'Previous Winners',
    about_competition: 'About Competition',
    judging_parameters: 'Judging Parameters',
    rules_eligibility: 'Rules & Eligibility',
    view_more: 'View more',
    view_less: 'View less',
    rewards: 'Rewards',
    all_positions: '(All Positions)',
    disclaimer: 'Disclaimer:',
    how_receive_prize: 'How will you receive prize money?',
    watch_video: 'Watch video to know more',
    refund_policy: 'Refund policy',
    secure_payments: 'Secure payments powered by',
    refer_earn: 'Refer & Earn more discount',
    copy_link: 'Copy Link',
    copied: 'Copied!',
    refer_now: 'Refer Now',
    you_earn: 'You earn {amount} for every signup',
    hear_from_users: 'Hear From Our Users',
    hear_from_users_sub: 'See what participants say about Feedants',
    ad_here: 'Ad Here',
    // Primary action labels. These keys are chosen by the BACKEND
    // (viewer.primaryAction.labelKey / subLabelKey) and resolved at
    // runtime, so they look unused to a static search. Do not delete.
    register_now: 'Register Now',
    complete_payment: 'Complete Payment',
    upload_submission: 'Upload Submission',
    update_submission: 'Update Submission',
    submission_uploaded: 'Submission Uploaded',
    submission_closed: 'Submissions Closed',
    competition_full: 'Competition Full',
    registration_closed: 'Registration Closed',
    registration_opens_at: 'Opens {date}',
    competition_cancelled: 'Competition Cancelled',
    unavailable: 'Unavailable',
    view_results: 'View Results',
    awaiting_results: 'Awaiting results',
    spot_held_until: 'Spot held until {date}',
    submission_opens_at: 'Submissions open {date}',
    cancel_registration: 'Cancel registration',
    cancel_confirm_title: 'Cancel registration?',
    cancel_confirm_body: 'Your spot will be released and the entry fee refunded as per the refund policy.',
    keep: 'Keep',
    cancel: 'Cancel',
    confirm: 'Confirm',
    pay_now: 'Pay {amount}',
    payment_title: 'Complete your payment',
    payment_body: 'Your spot is reserved. Complete the payment to confirm your registration.',
    payment_mock_note: 'Demo checkout: no real money is charged.',
    test_card_hint: 'Test mode. Demo card: {card}, any future expiry, any CVV.',
    submission_title: 'Upload your entry',
    submission_body: 'Paste a link to your performance video. Only the latest upload counts.',
    submission_title_label: 'Title (optional)',
    submission_url_label: 'Video URL',
    submit: 'Submit',
    results_announced: 'Results are out!',
    loading: 'Loading competition…',
    error_title: 'Something went wrong',
    retry: 'Retry',
    offline_hint: 'Check that the backend is running and reachable.',
    competitions: 'Competitions',
    home: 'Home',
    explore: 'Explore',
    profile: 'Profile',
    phase_upcoming: 'Upcoming',
    phase_registration_open: 'Open',
    phase_registration_closed: 'Closed',
    phase_submission_open: 'Submissions open',
    phase_judging: 'Judging',
    phase_results_announced: 'Results out',
    phase_cancelled: 'Cancelled',
    phase_draft: 'Draft',
    success_registered: 'You are registered!',
    success_submitted: 'Submission uploaded!',
    success_cancelled: 'Registration cancelled',
    stale_banner: 'Could not refresh. Showing last known details.',
    spot_held_timer: 'Spot held {time}',
    empty_list: 'No competitions yet',
    empty_list_sub: 'Pull down to refresh.',
    // Sign in
    sign_in_title: 'Welcome to Feedants',
    sign_in_body: 'Sign in to register for competitions, upload entries and track results.',
    email: 'E-mail',
    name: 'Name',
    sign_in: 'Sign in',
    one_click_sign_in: 'One-click demo sign in',
    use_another_email: 'Use another e-mail',
    no_password_note: 'Demo sign in. No password is required.',
    invalid_email: 'Enter a valid e-mail address',
    sign_out: 'Sign out',
    // Home
    home_greeting: 'Hi {name} 👋',
    home_tagline: 'Showcase your talent today',
    closing_soon: 'Closing soon',
    open_now: 'Open for registration',
    upcoming_section: 'Upcoming',
    results_section: 'Results out',
    view_all: 'View all',
    closes_in: 'Closes in {time}',
    // Explore
    explore_title: 'Explore',
    search_placeholder: 'Search competitions, judges…',
    no_results: 'No matches',
    no_results_sub: 'Try a different search or filter.',
    // Profile
    profile_title: 'Profile',
    my_registrations: 'My registrations',
    no_registrations: 'You have not registered for any competition yet.',
    browse_competitions: 'Browse competitions',
    referral_title: 'Refer & earn',
    referral_code: 'Your code',
    referral_earnings: 'Earned so far',
    language: 'Language',
    status_pending: 'Processing',
    status_reserved: 'Payment pending',
    status_confirmed: 'Registered',
    status_expired: 'Expired',
    status_cancelled: 'Cancelled',
    status_failed: 'Failed',
    // Create
    create_title: 'Host a competition',
    create_body: 'Organisers will soon be able to create and manage competitions from the app. For now, competitions are published by the Feedants team.',
    coming_soon: 'Coming soon',
  },
  hi: {
    go_back: 'वापस जाएँ',
    registered: 'पंजीकृत',
    prize_pool: 'पुरस्कार राशि',
    entry_fee: 'प्रवेश शुल्क',
    free: 'निःशुल्क',
    spots_left: 'केवल {n} स्थान शेष',
    spots_left_one: 'केवल 1 स्थान शेष',
    spots_full: 'सभी स्थान बुक',
    booked: '{booked} / {total} बुक',
    judge: 'निर्णायक',
    intro_video: 'परिचय वीडियो',
    registration_closes_in: 'पंजीकरण बंद होगा',
    registration_opens_in: 'पंजीकरण खुलेगा',
    submission_starts_in: 'प्रविष्टि शुरू होगी',
    submission_ends_in: 'प्रविष्टि समाप्त होगी',
    results_in: 'परिणाम आएँगे',
    hurry_up: 'जल्दी करें!',
    important_dates: 'महत्वपूर्ण तिथियाँ',
    register_before: 'पंजीकरण की अंतिम तिथि',
    submission_starts: 'प्रविष्टि शुरू',
    submission_ends: 'प्रविष्टि समाप्त',
    result_date: 'परिणाम तिथि',
    previous_winners: 'पिछले विजेता',
    about_competition: 'प्रतियोगिता के बारे में',
    judging_parameters: 'निर्णय मानदंड',
    rules_eligibility: 'नियम और पात्रता',
    view_more: 'और देखें',
    view_less: 'कम देखें',
    rewards: 'पुरस्कार',
    all_positions: '(सभी स्थान)',
    disclaimer: 'अस्वीकरण:',
    how_receive_prize: 'पुरस्कार राशि कैसे मिलेगी?',
    watch_video: 'अधिक जानने के लिए वीडियो देखें',
    refund_policy: 'रिफंड नीति',
    secure_payments: 'सुरक्षित भुगतान द्वारा',
    refer_earn: 'रेफर करें और छूट पाएँ',
    copy_link: 'लिंक कॉपी',
    copied: 'कॉपी हो गया!',
    refer_now: 'अभी रेफर करें',
    you_earn: 'हर साइनअप पर {amount} कमाएँ',
    hear_from_users: 'हमारे उपयोगकर्ताओं से सुनें',
    hear_from_users_sub: 'देखें प्रतिभागी फीडएंट्स के बारे में क्या कहते हैं',
    ad_here: 'विज्ञापन',
    register_now: 'अभी पंजीकरण करें',
    complete_payment: 'भुगतान पूरा करें',
    upload_submission: 'प्रविष्टि अपलोड करें',
    update_submission: 'प्रविष्टि अपडेट करें',
    submission_uploaded: 'प्रविष्टि अपलोड हो गई',
    submission_closed: 'प्रविष्टियाँ बंद',
    competition_full: 'प्रतियोगिता भर गई',
    registration_closed: 'पंजीकरण बंद',
    registration_opens_at: '{date} को खुलेगा',
    competition_cancelled: 'प्रतियोगिता रद्द',
    unavailable: 'उपलब्ध नहीं',
    view_results: 'परिणाम देखें',
    awaiting_results: 'परिणाम की प्रतीक्षा',
    spot_held_until: '{date} तक स्थान आरक्षित',
    submission_opens_at: 'प्रविष्टि {date} से खुलेगी',
    cancel_registration: 'पंजीकरण रद्द करें',
    cancel_confirm_title: 'पंजीकरण रद्द करें?',
    cancel_confirm_body: 'आपका स्थान छोड़ दिया जाएगा और रिफंड नीति के अनुसार शुल्क वापस होगा।',
    keep: 'रखें',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    pay_now: '{amount} भुगतान करें',
    payment_title: 'भुगतान पूरा करें',
    payment_body: 'आपका स्थान आरक्षित है। पंजीकरण की पुष्टि के लिए भुगतान पूरा करें।',
    payment_mock_note: 'डेमो चेकआउट: कोई वास्तविक पैसा नहीं लिया जाता।',
    test_card_hint: 'टेस्ट मोड। डेमो कार्ड: {card}, कोई भी भविष्य की समाप्ति, कोई भी CVV।',
    submission_title: 'अपनी प्रविष्टि अपलोड करें',
    submission_body: 'अपने प्रदर्शन वीडियो का लिंक डालें। केवल अंतिम अपलोड मान्य होगा।',
    submission_title_label: 'शीर्षक (वैकल्पिक)',
    submission_url_label: 'वीडियो URL',
    submit: 'जमा करें',
    results_announced: 'परिणाम आ गए!',
    loading: 'प्रतियोगिता लोड हो रही है…',
    error_title: 'कुछ गलत हो गया',
    retry: 'पुनः प्रयास',
    offline_hint: 'जाँचें कि बैकएंड चल रहा है और पहुँच योग्य है।',
    competitions: 'प्रतियोगिताएँ',
    home: 'होम',
    explore: 'खोजें',
    profile: 'प्रोफ़ाइल',
    phase_upcoming: 'आगामी',
    phase_registration_open: 'खुला',
    phase_registration_closed: 'बंद',
    phase_submission_open: 'प्रविष्टि खुली',
    phase_judging: 'मूल्यांकन',
    phase_results_announced: 'परिणाम घोषित',
    phase_cancelled: 'रद्द',
    phase_draft: 'ड्राफ्ट',
    success_registered: 'आप पंजीकृत हो गए!',
    success_submitted: 'प्रविष्टि अपलोड हो गई!',
    success_cancelled: 'पंजीकरण रद्द हो गया',
    stale_banner: 'रीफ़्रेश नहीं हो सका। अंतिम ज्ञात विवरण दिखाया जा रहा है।',
    spot_held_timer: 'स्थान आरक्षित {time}',
    empty_list: 'अभी कोई प्रतियोगिता नहीं',
    empty_list_sub: 'रीफ़्रेश करने के लिए नीचे खींचें।',
    sign_in_title: 'फीडएंट्स में आपका स्वागत है',
    sign_in_body: 'प्रतियोगिताओं में पंजीकरण, प्रविष्टि अपलोड और परिणाम देखने के लिए साइन इन करें।',
    email: 'ई-मेल',
    name: 'नाम',
    sign_in: 'साइन इन',
    one_click_sign_in: 'एक क्लिक में डेमो साइन इन',
    use_another_email: 'कोई अन्य ई-मेल उपयोग करें',
    no_password_note: 'डेमो साइन इन। पासवर्ड की आवश्यकता नहीं है।',
    invalid_email: 'मान्य ई-मेल पता दर्ज करें',
    sign_out: 'साइन आउट',
    home_greeting: 'नमस्ते {name} 👋',
    home_tagline: 'आज अपनी प्रतिभा दिखाएँ',
    closing_soon: 'जल्द बंद हो रहा है',
    open_now: 'पंजीकरण के लिए खुला',
    upcoming_section: 'आगामी',
    results_section: 'परिणाम घोषित',
    view_all: 'सभी देखें',
    closes_in: '{time} में बंद',
    explore_title: 'खोजें',
    search_placeholder: 'प्रतियोगिता, निर्णायक खोजें…',
    no_results: 'कोई परिणाम नहीं',
    no_results_sub: 'कोई अन्य खोज या फ़िल्टर आज़माएँ।',
    profile_title: 'प्रोफ़ाइल',
    my_registrations: 'मेरे पंजीकरण',
    no_registrations: 'आपने अभी किसी प्रतियोगिता में पंजीकरण नहीं किया है।',
    browse_competitions: 'प्रतियोगिताएँ देखें',
    referral_title: 'रेफर करें और कमाएँ',
    referral_code: 'आपका कोड',
    referral_earnings: 'अब तक कमाया',
    language: 'भाषा',
    status_pending: 'प्रक्रिया में',
    status_reserved: 'भुगतान बाकी',
    status_confirmed: 'पंजीकृत',
    status_expired: 'समाप्त',
    status_cancelled: 'रद्द',
    status_failed: 'विफल',
    create_title: 'प्रतियोगिता आयोजित करें',
    create_body: 'आयोजक जल्द ही ऐप से प्रतियोगिताएँ बना और प्रबंधित कर सकेंगे। अभी प्रतियोगिताएँ फीडएंट्स टीम द्वारा प्रकाशित की जाती हैं।',
    coming_soon: 'जल्द आ रहा है',
  },
} as const;

export type StringKey = keyof typeof strings.en;

type Params = Record<string, string | number>;

export function translate(lang: Lang, key: StringKey | string, params?: Params): string {
  const table = strings[lang] as Record<string, string>;
  let value = table[key] ?? (strings.en as Record<string, string>)[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) value = value.replace(`{${k}}`, String(v));
  }
  return value;
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: StringKey | string, params?: Params) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = 'feedants.lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'en' || saved === 'hi') setLangState(saved);
      })
      .catch(() => undefined);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t: (key, params) => translate(lang, key, params) }),
    [lang, setLang]
  );

  return React.createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
